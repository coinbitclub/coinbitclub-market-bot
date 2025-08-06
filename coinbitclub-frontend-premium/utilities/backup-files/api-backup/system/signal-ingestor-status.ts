import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../src/lib/database';
import { coinStatsAPI } from '../../../src/lib/coinstats';

// Endpoint para verificar status completo do Signal Ingestor
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    console.log('Verificando status completo do Signal Ingestor...');

    // 1. Verificar conectividade das APIs
    const connectivityStatus = await checkApiConnectivity();

    // 2. Verificar estrutura do banco de dados
    const databaseStatus = await checkDatabaseStructure();

    // 3. Verificar sinais recentes
    const signalAnalysis = await analyzeRecentSignals();

    // 4. Verificar fila de processamento
    const processingQueueStatus = await checkProcessingQueue();

    // 5. Verificar estatísticas de performance
    const performanceStats = await getPerformanceStats();

    // 6. Verificar configurações do sistema
    const systemConfig = await checkSystemConfiguration();

    const response = {
      status: 'success',
      timestamp: new Date().toISOString(),
      systemHealth: calculateSystemHealth(connectivityStatus, databaseStatus, signalAnalysis),
      connectivity: connectivityStatus,
      database: databaseStatus,
      signals: signalAnalysis,
      processingQueue: processingQueueStatus,
      performance: performanceStats,
      systemConfiguration: systemConfig,
      recommendations: generateSystemRecommendations(connectivityStatus, databaseStatus, signalAnalysis, performanceStats)
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Erro na verificação do Signal Ingestor:', error);
    return res.status(500).json({ 
      error: 'Erro interno durante verificação',
      message: error.message,
      status: 'failed'
    });
  }
}

async function checkApiConnectivity() {
  const results: any = {
    coinstats: { status: 'unknown', latency: 0, error: null },
    tradingview: { status: 'webhook_ready', error: null }
  };

  // Testar CoinStats
  try {
    const startTime = Date.now();
    const pingResult = await coinStatsAPI.ping();
    const latency = Date.now() - startTime;

    results.coinstats = {
      status: pingResult ? 'connected' : 'disconnected',
      latency,
      error: null
    };

    // Teste adicional: buscar dados
    if (pingResult) {
      try {
        const testData = await coinStatsAPI.getCoins(5);
        results.coinstats.dataTest = {
          success: testData.length > 0,
          recordsReturned: testData.length
        };
      } catch (error: any) {
        results.coinstats.dataTest = {
          success: false,
          error: error.message
        };
      }
    }

  } catch (error: any) {
    results.coinstats = {
      status: 'error',
      latency: 0,
      error: error.message
    };
  }

  return results;
}

async function checkDatabaseStructure() {
  const requiredTables = [
    'trading_signals',
    'signal_processing_queue',
    'signal_stats',
    'market_data',
    'coin_prices',
    'trending_coins',
    'crypto_news',
    'price_alerts',
    'market_movers'
  ];

  const tableStatus = {};
  let missingTables = [];

  for (const table of requiredTables) {
    try {
      const result = await query(`
        SELECT 
          COUNT(*) as record_count,
          MAX(created_at) as last_entry,
          MIN(created_at) as first_entry
        FROM ${table}
      `);

      tableStatus[table] = {
        exists: true,
        recordCount: parseInt(result.rows[0].record_count),
        lastEntry: result.rows[0].last_entry,
        firstEntry: result.rows[0].first_entry,
        isEmpty: parseInt(result.rows[0].record_count) === 0
      };

    } catch (error) {
      tableStatus[table] = {
        exists: false,
        error: error.message
      };
      missingTables.push(table);
    }
  }

  return {
    allTablesExist: missingTables.length === 0,
    missingTables,
    tableDetails: tableStatus,
    status: missingTables.length === 0 ? 'healthy' : 'incomplete'
  };
}

async function analyzeRecentSignals() {
  try {
    // Análise dos últimos 7 dias
    const signalAnalysisResult = await query(`
      SELECT 
        source,
        DATE(created_at) as signal_date,
        COUNT(*) as signal_count,
        COUNT(CASE WHEN action IN ('BUY', 'STRONG_BUY') THEN 1 END) as buy_signals,
        COUNT(CASE WHEN action IN ('SELL', 'STRONG_SELL') THEN 1 END) as sell_signals,
        AVG(confidence) as avg_confidence,
        MAX(created_at) as last_signal
      FROM trading_signals 
      WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY source, DATE(created_at)
      ORDER BY signal_date DESC, source
    `);

    // Resumo por fonte
    const sourceStatsResult = await query(`
      SELECT 
        source,
        COUNT(*) as total_signals,
        AVG(confidence) as avg_confidence,
        MAX(created_at) as last_signal,
        COUNT(DISTINCT symbol) as unique_symbols
      FROM trading_signals 
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY source
    `);

    // Top símbolos
    const topSymbolsResult = await query(`
      SELECT 
        symbol,
        COUNT(*) as signal_count,
        AVG(confidence) as avg_confidence,
        source
      FROM trading_signals 
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY symbol, source
      ORDER BY signal_count DESC
      LIMIT 10
    `);

    return {
      last7Days: signalAnalysisResult.rows,
      sourceStats: sourceStatsResult.rows,
      topSymbols: topSymbolsResult.rows,
      status: signalAnalysisResult.rows.length > 0 ? 'active' : 'inactive'
    };

  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

async function checkProcessingQueue() {
  try {
    const queueStatsResult = await query(`
      SELECT 
        status,
        source,
        COUNT(*) as count,
        AVG(EXTRACT(EPOCH FROM (COALESCE(updated_at, NOW()) - created_at))) as avg_processing_time
      FROM signal_processing_queue 
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY status, source
      ORDER BY status, source
    `);

    const backlogResult = await query(`
      SELECT COUNT(*) as backlog_count
      FROM signal_processing_queue 
      WHERE status = 'PENDING'
    `);

    return {
      queueStats: queueStatsResult.rows,
      backlog: parseInt(backlogResult.rows[0]?.backlog_count || '0'),
      status: parseInt(backlogResult.rows[0]?.backlog_count || '0') < 100 ? 'healthy' : 'overloaded'
    };

  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

async function getPerformanceStats() {
  try {
    // Estatísticas de performance das últimas 24h
    const performanceResult = await query(`
      SELECT 
        source,
        COUNT(*) as total_processed,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as successful,
        COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed,
        AVG(CASE WHEN status = 'COMPLETED' THEN 
          EXTRACT(EPOCH FROM (updated_at - created_at)) 
        END) as avg_success_time,
        MAX(CASE WHEN status = 'COMPLETED' THEN 
          EXTRACT(EPOCH FROM (updated_at - created_at)) 
        END) as max_processing_time
      FROM signal_processing_queue 
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY source
    `);

    // Taxa de sucesso geral
    const overallStatsResult = await query(`
      SELECT 
        COUNT(*) as total_signals,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending,
        ROUND(
          COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) * 100.0 / 
          NULLIF(COUNT(CASE WHEN status != 'PENDING' THEN 1 END), 0), 2
        ) as success_rate
      FROM signal_processing_queue 
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `);

    return {
      bySource: performanceResult.rows,
      overall: overallStatsResult.rows[0] || {},
      status: parseFloat(overallStatsResult.rows[0]?.success_rate || '0') > 80 ? 'good' : 'needs_attention'
    };

  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

async function checkSystemConfiguration() {
  const config = {
    coinstatsApiKey: !!process.env.COINSTATS_API_KEY,
    systemApiKey: !!process.env.SYSTEM_API_KEY,
    tradingviewWebhookSecret: !!process.env.TRADINGVIEW_WEBHOOK_SECRET,
    coinstatsWebhookSecret: !!process.env.COINSTATS_WEBHOOK_SECRET,
    databaseUrl: !!process.env.DATABASE_URL,
    openaiApiKey: !!process.env.OPENAI_API_KEY
  };

  const missingConfigs = Object.entries(config)
    .filter(([_, value]) => !value)
    .map(([key, _]) => key);

  return {
    configured: config,
    missingConfigurations: missingConfigs,
    status: missingConfigs.length === 0 ? 'complete' : 'incomplete'
  };
}

function calculateSystemHealth(connectivity: any, database: any, signals: any) {
  let healthScore = 100;
  let issues = [];

  // Verificar conectividade
  if (connectivity.coinstats?.status !== 'connected') {
    healthScore -= 25;
    issues.push('CoinStats API connectivity issue');
  }

  // Verificar banco de dados
  if (!database.allTablesExist) {
    healthScore -= 30;
    issues.push('Missing database tables');
  }

  // Verificar sinais
  if (signals.status === 'inactive') {
    healthScore -= 20;
    issues.push('No recent signals detected');
  }

  let status = 'healthy';
  if (healthScore < 70) status = 'critical';
  else if (healthScore < 85) status = 'warning';

  return {
    score: healthScore,
    status,
    issues
  };
}

function generateSystemRecommendations(connectivity: any, database: any, signals: any, performance: any): string[] {
  const recommendations = [];

  // Recomendações de conectividade
  if (connectivity.coinstats?.status !== 'connected') {
    recommendations.push('🔧 Verificar configuração da API CoinStats');
    recommendations.push('🔑 Validar COINSTATS_API_KEY nas variáveis de ambiente');
  }

  // Recomendações de banco de dados
  if (!database.allTablesExist) {
    recommendations.push('🗄️ Executar script de criação de tabelas do banco de dados');
    recommendations.push('📊 Verificar permissões do usuário do banco de dados');
  }

  // Recomendações de sinais
  if (signals.status === 'inactive') {
    recommendations.push('📡 Configurar webhooks do TradingView');
    recommendations.push('🔄 Ativar cron job de coleta do CoinStats');
  }

  // Recomendações de performance
  if (performance.status === 'needs_attention') {
    recommendations.push('⚡ Otimizar processamento de sinais');
    recommendations.push('🚀 Verificar recursos do servidor');
  }

  // Recomendações gerais
  if (recommendations.length === 0) {
    recommendations.push('✅ Sistema funcionando corretamente');
    recommendations.push('📈 Monitorar performance continuamente');
    recommendations.push('🔄 Configurar alertas de monitoramento');
  }

  return recommendations;
}
