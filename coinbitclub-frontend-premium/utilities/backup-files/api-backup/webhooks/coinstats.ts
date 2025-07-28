import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../src/lib/database';
import { coinStatsAPI } from '../../../src/lib/coinstats';

// Webhook para receber dados do CoinStats (Signal Ingestor)
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // Verificar autenticação (opcional)
    const authToken = req.headers['x-api-key'];
    const expectedToken = process.env.COINSTATS_WEBHOOK_SECRET;
    
    if (expectedToken && authToken !== expectedToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const signalData = req.body;
    console.log('CoinStats webhook recebido:', signalData);

    // Processar diferentes tipos de dados do CoinStats
    const result = await processCoinStatsData(signalData);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Dados CoinStats processados com sucesso',
      processed: result
    });

  } catch (error) {
    console.error('Erro no webhook CoinStats:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

interface CoinStatsWebhookData {
  type: 'price_alert' | 'market_update' | 'news_update' | 'trending_update';
  data: any;
  timestamp?: string;
}

async function processCoinStatsData(webhookData: CoinStatsWebhookData) {
  const { type, data } = webhookData;

  switch (type) {
    case 'price_alert':
      return await processPriceAlert(data);
    
    case 'market_update':
      return await processMarketUpdate(data);
    
    case 'news_update':
      return await processNewsUpdate(data);
    
    case 'trending_update':
      return await processTrendingUpdate(data);
    
    default:
      console.warn('Tipo de webhook CoinStats não reconhecido:', type);
      return { processed: false, reason: 'Unknown type' };
  }
}

// Processar alertas de preço
async function processPriceAlert(alertData: any) {
  try {
    const { symbol, price, changePercent, trigger } = alertData;

    // Salvar alerta no banco
    const alertResult = await query(`
      INSERT INTO price_alerts (
        source, symbol, current_price, change_percent, 
        trigger_type, raw_data, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING id
    `, [
      'COINSTATS',
      symbol.toUpperCase(),
      price,
      changePercent,
      trigger, // 'significant_move', 'volume_spike', etc.
      JSON.stringify(alertData)
    ]);

    // Se for movimento significativo (>5%), criar sinal
    if (Math.abs(changePercent) >= 5) {
      await createSignalFromPriceAlert(alertData, alertResult.rows[0].id);
    }

    return { processed: true, alertId: alertResult.rows[0].id };

  } catch (error) {
    console.error('Erro ao processar alerta de preço:', error);
    throw error;
  }
}

// Processar atualizações de mercado
async function processMarketUpdate(marketData: any) {
  try {
    const { 
      totalMarketCap, 
      total24hVolume, 
      btcDominance, 
      fearGreedIndex,
      topGainers,
      topLosers 
    } = marketData;

    // Salvar dados globais
    await query(`
      INSERT INTO market_data (
        total_market_cap, total_24h_volume, btc_dominance, 
        fear_greed_index, raw_data, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
    `, [
      totalMarketCap,
      total24hVolume,
      btcDominance,
      fearGreedIndex || null,
      JSON.stringify(marketData)
    ]);

    // Processar top gainers/losers
    if (topGainers?.length > 0) {
      await processTopMovers(topGainers, 'GAINER');
    }
    
    if (topLosers?.length > 0) {
      await processTopMovers(topLosers, 'LOSER');
    }

    return { processed: true, type: 'market_update' };

  } catch (error) {
    console.error('Erro ao processar update de mercado:', error);
    throw error;
  }
}

// Processar notícias
async function processNewsUpdate(newsData: any) {
  try {
    const { articles } = newsData;

    for (const article of articles) {
      // Salvar notícia no banco
      await query(`
        INSERT INTO crypto_news (
          title, description, url, source, published_at, 
          related_coins, sentiment, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (url) DO NOTHING
      `, [
        article.title,
        article.description || '',
        article.url,
        article.source || 'CoinStats',
        article.publishedAt,
        JSON.stringify(article.coins || []),
        article.sentiment || 'neutral'
      ]);
    }

    return { processed: true, newsCount: articles.length };

  } catch (error) {
    console.error('Erro ao processar notícias:', error);
    throw error;
  }
}

// Processar trending coins
async function processTrendingUpdate(trendingData: any) {
  try {
    const { trending } = trendingData;

    // Limpar trending antigo
    await query('DELETE FROM trending_coins WHERE created_at < NOW() - INTERVAL \'1 hour\'');

    // Inserir novos trending
    for (const coin of trending) {
      await query(`
        INSERT INTO trending_coins (
          coin_id, symbol, name, price, change_24h, 
          search_volume, rank, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `, [
        coin.id,
        coin.symbol,
        coin.name,
        coin.price,
        coin.priceChange24h,
        coin.searchVolume || 0,
        coin.rank || 0
      ]);
    }

    return { processed: true, trendingCount: trending.length };

  } catch (error) {
    console.error('Erro ao processar trending:', error);
    throw error;
  }
}

// Criar sinal baseado em alerta de preço
async function createSignalFromPriceAlert(alertData: any, alertId: string) {
  try {
    const { symbol, changePercent, volume24h } = alertData;

    // Determinar ação baseada na mudança
    let action = 'HOLD';
    let confidence = 50;

    if (changePercent > 5) {
      action = 'BUY';
      confidence = Math.min(60 + (changePercent - 5) * 2, 85);
    } else if (changePercent < -5) {
      action = 'SELL';
      confidence = Math.min(60 + (Math.abs(changePercent) - 5) * 2, 85);
    }

    // Ajustar confiança baseada no volume
    if (volume24h && volume24h > 1000000) { // Volume alto
      confidence = Math.min(confidence + 10, 95);
    }

    // Salvar sinal
    const signalResult = await query(`
      INSERT INTO trading_signals (
        source, symbol, action, confidence, price, 
        volume_24h, related_alert_id, raw_data, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id
    `, [
      'COINSTATS',
      symbol,
      action,
      confidence,
      alertData.price,
      volume24h || null,
      alertId,
      JSON.stringify(alertData)
    ]);

    console.log(`Sinal criado do CoinStats: ${symbol} ${action} (${confidence}%)`);
    return signalResult.rows[0].id;

  } catch (error) {
    console.error('Erro ao criar sinal do alerta:', error);
    throw error;
  }
}

// Processar top gainers/losers
async function processTopMovers(movers: any[], type: 'GAINER' | 'LOSER') {
  try {
    for (const mover of movers) {
      await query(`
        INSERT INTO market_movers (
          symbol, name, price, change_24h, volume_24h, 
          mover_type, rank, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `, [
        mover.symbol,
        mover.name,
        mover.price,
        mover.priceChange24h,
        mover.volume24h,
        type,
        mover.rank || 0
      ]);
    }

    console.log(`Processados ${movers.length} ${type.toLowerCase()}s`);

  } catch (error) {
    console.error(`Erro ao processar ${type.toLowerCase()}s:`, error);
  }
}
