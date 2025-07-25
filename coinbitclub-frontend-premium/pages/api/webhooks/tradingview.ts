import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../src/lib/database';

// Webhook para receber sinais do TradingView
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // Verificar se veio do TradingView (opcional: autenticação)
    const authToken = req.headers['authorization'];
    const expectedToken = process.env.TRADINGVIEW_WEBHOOK_SECRET;
    
    if (expectedToken && authToken !== `Bearer ${expectedToken}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const signalData = req.body;
    console.log('TradingView webhook recebido:', signalData);

    // Validar dados obrigatórios
    if (!signalData.symbol || !signalData.action) {
      return res.status(400).json({ error: 'Dados inválidos - symbol e action são obrigatórios' });
    }

    // Processar o sinal
    const processedSignal = await processTradingViewSignal(signalData);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Sinal processado com sucesso',
      signalId: processedSignal.id
    });

  } catch (error) {
    console.error('Erro no webhook TradingView:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

interface TradingViewSignal {
  symbol: string;
  action: 'BUY' | 'SELL' | 'STRONG_BUY' | 'STRONG_SELL';
  price?: number;
  time?: string;
  strategy?: string;
  exchange?: string;
  timeframe?: string;
  rsi?: number;
  macd?: number;
  volume?: number;
  [key: string]: any;
}

async function processTradingViewSignal(signalData: TradingViewSignal) {
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
      signalData.price || null,
      signalData.strategy || 'default',
      signalData.exchange || 'binance',
      signalData.timeframe || '1h',
      JSON.stringify(signalData)
    ]);

    const signalId = signalResult.rows[0].id;

    // 2. Processar para Decision Engine
    await processSignalForDecisionEngine(signalId, signalData);

    // 3. Notificar usuários se for sinal forte
    if (['STRONG_BUY', 'STRONG_SELL'].includes(signalData.action)) {
      await notifyUsersOfStrongSignal(signalData);
    }

    // 4. Atualizar estatísticas
    await updateSignalStats('TRADINGVIEW');

    return { id: signalId, processed: true };

  } catch (error) {
    console.error('Erro ao processar sinal TradingView:', error);
    throw error;
  }
}

async function processSignalForDecisionEngine(signalId: string, signalData: TradingViewSignal) {
  try {
    // Enviar para fila de processamento do Decision Engine
    const decisionEnginePayload = {
      signalId,
      source: 'TRADINGVIEW',
      symbol: signalData.symbol,
      action: signalData.action,
      confidence: getConfidenceFromAction(signalData.action),
      marketData: {
        price: signalData.price,
        rsi: signalData.rsi,
        macd: signalData.macd,
        volume: signalData.volume
      },
      timestamp: new Date().toISOString()
    };

    // Salvar na fila de processamento
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
      JSON.stringify(decisionEnginePayload.marketData)
    ]);

    console.log(`Sinal ${signalId} adicionado à fila do Decision Engine`);

  } catch (error) {
    console.error('Erro ao enviar para Decision Engine:', error);
  }
}

async function notifyUsersOfStrongSignal(signalData: TradingViewSignal) {
  try {
    // Buscar usuários ativos que querem notificações
    const usersResult = await query(`
      SELECT u.id, u.phone, u.name 
      FROM users u 
      WHERE u.is_active = true 
      AND u.phone IS NOT NULL 
      AND u.plan_type != 'none'
      AND u.notification_preferences->>'trading_signals' = 'true'
    `);

    // Implementar notificação via Z-API (webhook do WhatsApp)
    for (const user of usersResult.rows) {
      const message = `
🚨 *SINAL FORTE DETECTADO*

📊 Par: ${signalData.symbol}
📈 Ação: ${signalData.action}
💰 Preço: $${signalData.price || 'N/A'}
⏰ Estratégia: ${signalData.strategy || 'TradingView'}

🔥 Este é um sinal de alta confiança detectado pelo nosso sistema!
      `;

      // Aqui implementaria a chamada para Z-API
      console.log(`Notificação enviada para ${user.name}: ${signalData.symbol} ${signalData.action}`);
    }

  } catch (error) {
    console.error('Erro ao notificar usuários:', error);
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
