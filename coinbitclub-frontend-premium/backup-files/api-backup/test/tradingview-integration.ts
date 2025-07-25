import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../src/lib/database';

// Endpoint para testar integração TradingView
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    console.log('Testando integração TradingView...');

    // 1. Simular sinais do TradingView para teste
    const testSignals = [
      {
        symbol: 'BTCUSDT',
        action: 'STRONG_BUY',
        price: 43500.00,
        strategy: 'RSI_OVERSOLD',
        timeframe: '1h',
        rsi: 28.5,
        macd: 0.15,
        volume: 1500000,
        exchange: 'binance'
      },
      {
        symbol: 'ETHUSDT',
        action: 'BUY',
        price: 2650.00,
        strategy: 'EMA_CROSSOVER',
        timeframe: '4h',
        rsi: 45.2,
        volume: 800000,
        exchange: 'binance'
      },
      {
        symbol: 'ADAUSDT',
        action: 'SELL',
        price: 0.85,
        strategy: 'RESISTANCE_REJECTION',
        timeframe: '1d',
        rsi: 72.8,
        volume: 300000,
        exchange: 'binance'
      }
    ];

    const processedSignals = [];
    const errors = [];

    // 2. Processar cada sinal de teste
    for (const signal of testSignals) {
      try {
        const processResult = await processTestTradingViewSignal(signal);
        processedSignals.push({
          ...signal,
          processResult
        });
      } catch (error) {
        errors.push({
          signal: signal.symbol,
          error: error.message
        });
      }
    }

    // 3. Verificar estado do banco de dados
    const dbStatus = await checkTradingViewDatabaseStatus();

    // 4. Testar conectividade com Decision Engine
    const decisionEngineStatus = await testTradingViewDecisionEngineIntegration();

    // 5. Verificar sistema de notificações
    const notificationStatus = await testTradingViewNotifications();

    const response = {
      status: 'success',
      timestamp: new Date().toISOString(),
      testResults: {
        signalsProcessed: processedSignals.length,
        signalsWithErrors: errors.length,
        successRate: `${((processedSignals.length / testSignals.length) * 100).toFixed(1)}%`
      },
      databaseStatus: dbStatus,
      decisionEngineIntegration: decisionEngineStatus,
      notificationSystem: notificationStatus,
      processedSignals,
      errors,
      recommendations: generateTradingViewRecommendations(processedSignals, errors, dbStatus)
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Erro no teste TradingView:', error);
    return res.status(500).json({ 
      error: 'Erro interno durante teste TradingView',
      message: error.message,
      status: 'failed'
    });
  }
}

async function processTestTradingViewSignal(signalData: any) {
  try {
    // 1. Salvar sinal no banco de dados
    const signalResult = await query(`
      INSERT INTO trading_signals (
        source, symbol, action, price, strategy, 
        exchange, timeframe, raw_data, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id
    `, [
      'TRADINGVIEW',
      signalData.symbol.toUpperCase(),
      signalData.action,
      signalData.price,
      signalData.strategy,
      signalData.exchange,
      signalData.timeframe,
      JSON.stringify(signalData)
    ]);

    const signalId = signalResult.rows[0].id;

    // 2. Adicionar à fila do Decision Engine
    await query(`
      INSERT INTO signal_processing_queue (
        signal_id, source, symbol, action, confidence, 
        market_data, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', NOW())
    `, [
      signalId,
      'TRADINGVIEW',
      signalData.symbol,
      signalData.action,
      getConfidenceFromAction(signalData.action),
      JSON.stringify({
        price: signalData.price,
        rsi: signalData.rsi,
        macd: signalData.macd,
        volume: signalData.volume
      })
    ]);

    // 3. Atualizar estatísticas
    await updateSignalStats('TRADINGVIEW');

    return {
      success: true,
      signalId,
      confidence: getConfidenceFromAction(signalData.action),
      addedToDecisionQueue: true
    };

  } catch (error) {
    console.error('Erro ao processar sinal de teste:', error);
    throw error;
  }
}

async function checkTradingViewDatabaseStatus() {
  try {
    // Verificar tabelas necessárias
    const tables = ['trading_signals', 'signal_processing_queue', 'signal_stats'];
    const tableStatus = {};

    for (const table of tables) {
      try {
        const result = await query(`
          SELECT COUNT(*) as count, 
          MAX(created_at) as last_entry
          FROM ${table} 
          WHERE source = 'TRADINGVIEW'
        `);
        
        tableStatus[table] = {
          exists: true,
          recordCount: parseInt(result.rows[0].count),
          lastEntry: result.rows[0].last_entry
        };
      } catch (error) {
        tableStatus[table] = {
          exists: false,
          error: error.message
        };
      }
    }

    // Verificar sinais das últimas 24h
    const recentSignalsResult = await query(`
      SELECT 
        COUNT(*) as total_signals,
        COUNT(CASE WHEN action = 'BUY' OR action = 'STRONG_BUY' THEN 1 END) as buy_signals,
        COUNT(CASE WHEN action = 'SELL' OR action = 'STRONG_SELL' THEN 1 END) as sell_signals
      FROM trading_signals 
      WHERE source = 'TRADINGVIEW' 
      AND created_at > NOW() - INTERVAL '24 hours'
    `);

    return {
      tables: tableStatus,
      last24Hours: recentSignalsResult.rows[0] || {},
      status: 'healthy'
    };

  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

async function testTradingViewDecisionEngineIntegration() {
  try {
    // Verificar se existe fila de processamento
    const queueResult = await query(`
      SELECT 
        COUNT(*) as pending_signals,
        COUNT(CASE WHEN status = 'PROCESSING' THEN 1 END) as processing_signals,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_signals,
        COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed_signals
      FROM signal_processing_queue 
      WHERE source = 'TRADINGVIEW'
    `);

    const queueStats = queueResult.rows[0];

    // Verificar tempo médio de processamento  
    const performanceResult = await query(`
      SELECT 
        AVG(EXTRACT(EPOCH FROM (processed_at - created_at))) as avg_processing_time_seconds
      FROM signal_processing_queue 
      WHERE source = 'TRADINGVIEW' 
      AND status = 'COMPLETED'
      AND processed_at > NOW() - INTERVAL '24 hours'
    `);

    return {
      status: 'operational',
      queueStats: {
        pending: parseInt(queueStats.pending_signals || '0'),
        processing: parseInt(queueStats.processing_signals || '0'),
        completed: parseInt(queueStats.completed_signals || '0'),
        failed: parseInt(queueStats.failed_signals || '0')
      },
      performance: {
        avgProcessingTime: parseFloat(performanceResult.rows[0]?.avg_processing_time_seconds || '0')
      }
    };

  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

async function testTradingViewNotifications() {
  try {
    // Verificar usuários ativos (simplificado sem notification_preferences)
    const usersWithNotificationsResult = await query(`
      SELECT COUNT(*) as users_count
      FROM users 
      WHERE phone IS NOT NULL
      AND is_active = true
    `);

    // Verificar notificações enviadas recentemente
    const recentNotificationsResult = await query(`
      SELECT COUNT(*) as notifications_sent
      FROM notifications 
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `);

    return {
      status: 'configured',
      usersEnabled: parseInt(usersWithNotificationsResult.rows[0]?.users_count || '0'),
      notificationsSent24h: parseInt(recentNotificationsResult.rows[0]?.notifications_sent || '0')
    };

  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

function getConfidenceFromAction(action: string): number {
  const confidenceMap: Record<string, number> = {
    'STRONG_BUY': 90,
    'BUY': 70,
    'SELL': 70,
    'STRONG_SELL': 90
  };
  return confidenceMap[action] || 50;
}

async function updateSignalStats(source: string) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    await query(`
      INSERT INTO signal_stats (source, date, signal_count, last_updated)
      VALUES ($1, $2, 1, NOW())
      ON CONFLICT (source, date) 
      DO UPDATE SET 
        signal_count = signal_stats.signal_count + 1,
        last_updated = NOW()
    `, [source, today]);

  } catch (error) {
    console.error('Erro ao atualizar estatísticas:', error);
  }
}

function generateTradingViewRecommendations(processedSignals: any[], errors: any[], dbStatus: any): string[] {
  const recommendations = [];

  if (errors.length > 0) {
    recommendations.push('🔧 Investigar e corrigir erros de processamento de sinais');
  }

  if (processedSignals.length > 0) {
    recommendations.push('✅ Sistema TradingView funcionando - sinais sendo processados');
  }

  // Verificar performance
  const avgConfidence = processedSignals.reduce((sum, signal) => 
    sum + (signal.processResult?.confidence || 0), 0) / processedSignals.length;

  if (avgConfidence < 60) {
    recommendations.push('📊 Revisar estratégias - confiança média baixa');
  }

  if (dbStatus.status === 'healthy') {
    recommendations.push('💾 Banco de dados configurado corretamente');
  } else {
    recommendations.push('🗄️ Verificar configuração do banco de dados');
  }

  recommendations.push('🔄 Configurar webhook URL no TradingView');
  recommendations.push('🤖 Ativar processamento automático pelo Decision Engine');
  recommendations.push('📱 Configurar notificações WhatsApp para sinais fortes');

  return recommendations;
}
