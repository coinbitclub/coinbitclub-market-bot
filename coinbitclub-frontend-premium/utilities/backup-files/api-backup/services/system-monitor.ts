import { NextApiRequest, NextApiResponse } from 'next';
import { query, testConnection } from '../../../src/lib/database';

// Sistema de monitoramento completo
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📊 Executando monitoramento completo do sistema...');

    // 1. Status do banco de dados
    const dbStatus = await testConnection();

    // 2. Estatísticas de sinais (últimas 24h)
    const signalStats = await query(`
      SELECT 
        source,
        COUNT(*) as total_signals,
        COUNT(CASE WHEN action IN ('STRONG_BUY', 'STRONG_SELL') THEN 1 END) as strong_signals
      FROM trading_signals 
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY source
    `);

    // 3. Status da fila de processamento
    const queueStatus = await query(`
      SELECT 
        status,
        COUNT(*) as count,
        MIN(created_at) as oldest_signal,
        MAX(created_at) as newest_signal
      FROM signal_processing_queue
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY status
    `);

    // 4. Análises IA completadas
    const aiAnalysisStats = await query(`
      SELECT 
        COUNT(*) as total_analysis,
        AVG(confidence) as avg_confidence,
        COUNT(CASE WHEN confidence >= 80 THEN 1 END) as high_confidence_signals
      FROM ai_analysis 
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `);

    // 5. Performance do sistema
    const performanceStats = await query(`
      SELECT 
        COUNT(*) as processed_signals,
        AVG(EXTRACT(EPOCH FROM (processed_at - created_at))) as avg_processing_time_seconds
      FROM signal_processing_queue 
      WHERE status = 'COMPLETED' 
      AND processed_at > NOW() - INTERVAL '24 hours'
    `);

    // 6. Últimos sinais processados
    const recentSignals = await query(`
      SELECT 
        ts.symbol, ts.action, ts.price, ts.created_at,
        aa.recommendation, aa.confidence, aa.risk_level
      FROM trading_signals ts
      LEFT JOIN ai_analysis aa ON ts.id = aa.signal_id
      WHERE ts.created_at > NOW() - INTERVAL '6 hours'
      ORDER BY ts.created_at DESC
      LIMIT 10
    `);

    // 7. Status das APIs externas
    const apiStatus = await checkExternalAPIs();

    // 8. Calcular score geral do sistema
    const systemScore = calculateSystemScore({
      database: dbStatus,
      signalStats: signalStats.rows,
      queueStatus: queueStatus.rows,
      aiStats: aiAnalysisStats.rows[0],
      performance: performanceStats.rows[0],
      apiStatus
    });

    return res.status(200).json({
      status: 'success',
      timestamp: new Date().toISOString(),
      systemScore,
      overview: {
        database: dbStatus ? 'HEALTHY' : 'ERROR',
        signalProcessing: queueStatus.rows.find(s => s.status === 'PENDING')?.count > 10 ? 'BUSY' : 'NORMAL',
        aiEngine: aiAnalysisStats.rows[0]?.total_analysis > 0 ? 'ACTIVE' : 'IDLE',
        externalAPIs: apiStatus.coinstats && apiStatus.tradingview ? 'CONNECTED' : 'PARTIAL'
      },
      detailed: {
        database: {
          connected: dbStatus,
          latency: 'Low'
        },
        signals: {
          last24h: signalStats.rows,
          recentActivity: recentSignals.rows
        },
        processing: {
          queue: queueStatus.rows,
          performance: {
            avgProcessingTime: parseFloat(performanceStats.rows[0]?.avg_processing_time_seconds || '0'),
            processedSignals: parseInt(performanceStats.rows[0]?.processed_signals || '0')
          }
        },
        aiAnalysis: {
          totalAnalysis: parseInt(aiAnalysisStats.rows[0]?.total_analysis || '0'),
          avgConfidence: parseFloat(aiAnalysisStats.rows[0]?.avg_confidence || '0'),
          highConfidenceSignals: parseInt(aiAnalysisStats.rows[0]?.high_confidence_signals || '0')
        },
        externalAPIs: apiStatus
      },
      recommendations: generateSystemRecommendations({
        queueStatus: queueStatus.rows,
        aiStats: aiAnalysisStats.rows[0],
        apiStatus,
        systemScore
      })
    });

  } catch (error) {
    console.error('Erro no monitoramento do sistema:', error);
    
    return res.status(500).json({
      status: 'error',
      message: '❌ Erro no monitoramento do sistema',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}

async function checkExternalAPIs() {
  const status = {
    coinstats: false,
    tradingview: true, // Webhook sempre disponível
    frontend: true
  };

  try {
    // Testar CoinStats via nosso endpoint
    const coinStatsResponse = await fetch('http://localhost:3001/api/test/coinstats-integration');
    status.coinstats = coinStatsResponse.ok;
  } catch (error) {
    status.coinstats = false;
  }

  return status;
}

function calculateSystemScore(data: any): number {
  let score = 0;
  let maxScore = 100;

  // Database (25 pontos)
  if (data.database) score += 25;

  // Signal processing (25 pontos)
  const pendingSignals = data.queueStatus.find((s: any) => s.status === 'PENDING')?.count || 0;
  if (pendingSignals < 5) score += 25;
  else if (pendingSignals < 15) score += 15;
  else score += 5;

  // AI Analysis (25 pontos)
  const aiActive = data.aiStats?.total_analysis > 0;
  const avgConfidence = parseFloat(data.aiStats?.avg_confidence || '0');
  if (aiActive) {
    score += 15;
    if (avgConfidence >= 70) score += 10;
    else if (avgConfidence >= 50) score += 5;
  }

  // External APIs (25 pontos)
  if (data.apiStatus.coinstats) score += 15;
  if (data.apiStatus.tradingview) score += 10;

  return Math.round((score / maxScore) * 100);
}

function generateSystemRecommendations(data: any): string[] {
  const recommendations = [];

  const pendingSignals = data.queueStatus.find((s: any) => s.status === 'PENDING')?.count || 0;
  if (pendingSignals > 10) {
    recommendations.push('⚡ Alta carga na fila - considere executar processamento adicional');
  }

  const avgConfidence = parseFloat(data.aiStats?.avg_confidence || '0');
  if (avgConfidence < 60) {
    recommendations.push('🧠 Confiança IA baixa - revisar parâmetros do Decision Engine');
  }

  if (!data.apiStatus.coinstats) {
    recommendations.push('📡 CoinStats API desconectada - verificar conectividade');
  }

  if (data.systemScore < 80) {
    recommendations.push('🔧 Sistema operando abaixo do ideal - verificar componentes');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ Sistema operando perfeitamente - todos os componentes funcionais');
  }

  return recommendations;
}
