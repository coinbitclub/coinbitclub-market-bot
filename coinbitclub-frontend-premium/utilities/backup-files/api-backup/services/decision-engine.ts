import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../src/lib/database';
import OpenAI from 'openai';

// Decision Engine - IA e Análises 
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🧠 Decision Engine: Processando sinal...');
    
    const { signalId, source, symbol, action, confidence, marketData } = req.body;

    // 1. Buscar dados do sinal
    const signalResult = await query(`
      SELECT * FROM trading_signals WHERE id = $1
    `, [signalId]);

    if (signalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Sinal não encontrado' });
    }

    const signal = signalResult.rows[0];

    // 2. Coletar dados de mercado adicionais (CoinStats)
    const marketDataQuery = await query(`
      SELECT * FROM market_data 
      WHERE symbol LIKE $1 
      ORDER BY timestamp DESC 
      LIMIT 5
    `, [`%${symbol.replace('USDT', '')}%`]);

    // 3. Realizar análise com IA
    const aiAnalysis = await performAIAnalysis(signal, marketData, marketDataQuery.rows);

    // 4. Salvar análise no banco
    const analysisResult = await query(`
      INSERT INTO ai_analysis (
        signal_id, analysis_type, recommendation, confidence, reasoning,
        technical_indicators, market_sentiment, risk_level, position_size,
        stop_loss, take_profit, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING id
    `, [
      signalId,
      'RADAR_DA_AGUIA',
      aiAnalysis.recommendation,
      aiAnalysis.confidence,
      aiAnalysis.reasoning,
      JSON.stringify(aiAnalysis.technicalIndicators),
      JSON.stringify(aiAnalysis.marketSentiment),
      aiAnalysis.riskLevel,
      aiAnalysis.positionSize,
      aiAnalysis.stopLoss,
      aiAnalysis.takeProfit
    ]);

    // 5. Atualizar fila de processamento
    await query(`
      UPDATE signal_processing_queue 
      SET status = 'COMPLETED', processed_at = NOW(), result = $1
      WHERE signal_id = $2
    `, [JSON.stringify(aiAnalysis), signalId]);

    // 6. Enviar notificação se for sinal forte
    if (aiAnalysis.confidence >= 80) {
      await sendStrongSignalNotification(signal, aiAnalysis);
    }

    return res.status(200).json({
      status: 'success',
      message: '🧠 Análise IA completa',
      signalId,
      analysisId: analysisResult.rows[0].id,
      analysis: aiAnalysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro no Decision Engine:', error);
    
    // Marcar como erro na fila
    if (req.body.signalId) {
      await query(`
        UPDATE signal_processing_queue 
        SET status = 'FAILED', processed_at = NOW(), result = $1
        WHERE signal_id = $2
      `, [JSON.stringify({ error: error.message }), req.body.signalId]);
    }

    return res.status(500).json({
      status: 'error',
      message: '❌ Erro no Decision Engine',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function performAIAnalysis(signal: any, marketData: any, historicalData: any[]) {
  try {
    // Análise técnica básica
    const technicalIndicators = {
      rsi: marketData.rsi || calculateRSI(historicalData),
      macd: marketData.macd || 0,
      volume: marketData.volume || 0,
      priceChange24h: historicalData[0]?.price_change_24h || 0
    };

    // Análise de sentimento de mercado
    const marketSentiment = {
      overall: historicalData[0]?.price_change_24h > 0 ? 'BULLISH' : 'BEARISH',
      strength: Math.abs(historicalData[0]?.price_change_24h || 0) > 5 ? 'STRONG' : 'WEAK',
      trend: determineTrend(historicalData)
    };

    // Lógica do RADAR DA ÁGUIA
    let recommendation = signal.action;
    let confidence = 50;
    let reasoning = 'Análise baseada no sinal TradingView';

    // Aumentar confiança baseado em indicadores
    if (technicalIndicators.rsi < 30 && signal.action.includes('BUY')) {
      confidence += 20;
      reasoning += ' + RSI oversold confirma compra';
    }
    
    if (technicalIndicators.rsi > 70 && signal.action.includes('SELL')) {
      confidence += 20;
      reasoning += ' + RSI overbought confirma venda';
    }

    if (technicalIndicators.volume > 1000000) {
      confidence += 10;
      reasoning += ' + Alto volume';
    }

    if (marketSentiment.overall === 'BULLISH' && signal.action.includes('BUY')) {
      confidence += 15;
      reasoning += ' + Mercado bullish';
    }

    if (marketSentiment.overall === 'BEARISH' && signal.action.includes('SELL')) {
      confidence += 15;
      reasoning += ' + Mercado bearish';
    }

    // Limitar confiança máxima
    confidence = Math.min(confidence, 95);

    // Determinar nível de risco
    const riskLevel = confidence > 80 ? 'LOW' : confidence > 60 ? 'MEDIUM' : 'HIGH';
    
    // Calcular position size baseado no risco
    const positionSize = confidence > 80 ? '3%' : confidence > 60 ? '2%' : '1%';

    // Calcular stop loss e take profit
    const currentPrice = signal.price || historicalData[0]?.price || 0;
    const stopLoss = signal.action.includes('BUY') ? currentPrice * 0.97 : currentPrice * 1.03;
    const takeProfit = signal.action.includes('BUY') ? currentPrice * 1.06 : currentPrice * 0.94;

    return {
      recommendation,
      confidence,
      reasoning,
      technicalIndicators,
      marketSentiment,
      riskLevel,
      positionSize,
      stopLoss,
      takeProfit,
      analysisScore: confidence,
      processingTime: Date.now()
    };

  } catch (error) {
    console.error('Erro na análise IA:', error);
    return {
      recommendation: signal.action,
      confidence: 50,
      reasoning: 'Análise padrão aplicada',
      riskLevel: 'MEDIUM',
      positionSize: '1%',
      stopLoss: 0,
      takeProfit: 0,
      error: error.message
    };
  }
}

function calculateRSI(data: any[]): number {
  if (data.length < 2) return 50;
  
  const changes = data.slice(0, 14).map((item, index) => {
    if (index === 0) return 0;
    return ((item.price || 0) - (data[index - 1]?.price || 0)) / (data[index - 1]?.price || 1) * 100;
  });

  const gains = changes.filter(change => change > 0);
  const losses = changes.filter(change => change < 0).map(loss => Math.abs(loss));

  const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / gains.length : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0;

  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function determineTrend(data: any[]): string {
  if (data.length < 3) return 'NEUTRAL';
  
  const recent = data.slice(0, 3);
  const prices = recent.map(item => item.price || 0);
  
  if (prices[0] > prices[1] && prices[1] > prices[2]) return 'UPWARD';
  if (prices[0] < prices[1] && prices[1] < prices[2]) return 'DOWNWARD';
  
  return 'SIDEWAYS';
}

async function sendStrongSignalNotification(signal: any, analysis: any) {
  try {
    console.log(`📱 Notificação: ${signal.symbol} ${analysis.recommendation} (${analysis.confidence}% confiança)`);
    
    // Aqui implementaria Z-API para WhatsApp
    const message = `
🚨 *RADAR DA ÁGUIA - SINAL FORTE*

📊 Par: ${signal.symbol}
📈 Ação: ${analysis.recommendation}
💰 Preço: $${signal.price}
🎯 Confiança: ${analysis.confidence}%
📊 Risco: ${analysis.riskLevel}

💡 Análise: ${analysis.reasoning}

Stop Loss: $${analysis.stopLoss?.toFixed(2)}
Take Profit: $${analysis.takeProfit?.toFixed(2)}
Position Size: ${analysis.positionSize}
    `;

    // Salvar notificação no banco
    await query(`
      INSERT INTO notifications (
        user_id, type, title, message, data, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
    `, [
      1, // Admin user
      'TRADING_SIGNAL',
      `🎯 RADAR DA ÁGUIA - ${signal.symbol}`,
      message,
      JSON.stringify({ signal, analysis })
    ]);

    console.log('✅ Notificação salva no banco de dados');

  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
  }
}
