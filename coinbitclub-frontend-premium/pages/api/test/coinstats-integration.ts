import { NextApiRequest, NextApiResponse } from 'next';
import { coinStatsAPI } from '../../../src/lib/coinstats';
import { query } from '../../../src/lib/database';

// Endpoint para testar e verificar integração CoinStats
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    console.log('Testando integração CoinStats...');

    // 1. Testar conectividade
    const pingResult = await coinStatsAPI.ping();
    if (!pingResult) {
      return res.status(500).json({ 
        error: 'Falha na conectividade com CoinStats API',
        status: 'disconnected'
      });
    }

    // 2. Obter dados em paralelo
    const [globalStats, topCoins, trending, news] = await Promise.allSettled([
      coinStatsAPI.getGlobalStats(),
      coinStatsAPI.getCoins(20),
      coinStatsAPI.getTrending(10),
      coinStatsAPI.getNews(5)
    ]);

    // 3. Processar resultados
    const results = {
      connectivity: 'success',
      globalStats: globalStats.status === 'fulfilled' ? globalStats.value : null,
      topCoins: topCoins.status === 'fulfilled' ? topCoins.value : [],
      trending: trending.status === 'fulfilled' ? trending.value : [],
      news: news.status === 'fulfilled' ? news.value : [],
      errors: []
    };

    // 4. Verificar erros
    if (globalStats.status === 'rejected') {
      results.errors.push({ type: 'globalStats', error: globalStats.reason?.message });
    }
    if (topCoins.status === 'rejected') {
      results.errors.push({ type: 'topCoins', error: topCoins.reason?.message });
    }
    if (trending.status === 'rejected') {
      results.errors.push({ type: 'trending', error: trending.reason?.message });
    }
    if (news.status === 'rejected') {
      results.errors.push({ type: 'news', error: news.reason?.message });
    }

    // 5. Salvar dados no banco se conseguiu obter
    let savedData = {
      marketData: false,
      coins: 0,
      trendingCoins: 0,
      newsArticles: 0
    };

    try {
      // Salvar dados globais
      if (results.globalStats) {
        await query(`
          INSERT INTO market_data (
            total_market_cap, total_24h_volume, btc_dominance, 
            active_coins, raw_data, created_at
          ) VALUES ($1, $2, $3, $4, $5, NOW())
        `, [
          results.globalStats.totalMarketCap,
          results.globalStats.total24hVolume,
          results.globalStats.btcDominance,
          results.globalStats.activeCoins,
          JSON.stringify(results.globalStats)
        ]);
        savedData.marketData = true;
      }

      // Salvar top coins
      if (results.topCoins?.length > 0) {
        for (const coin of results.topCoins) {
          try {
            await query(`
              INSERT INTO coin_prices (
                coin_id, symbol, name, price, market_cap, 
                volume_24h, change_1d, change_7d, rank, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
              ON CONFLICT (coin_id, DATE(created_at)) 
              DO UPDATE SET 
                price = EXCLUDED.price,
                volume_24h = EXCLUDED.volume_24h,
                change_1d = EXCLUDED.change_1d,
                updated_at = NOW()
            `, [
              coin.id,
              coin.symbol,
              coin.name,
              coin.price,
              coin.marketCap,
              coin.volume24h,
              coin.priceChange1d,
              coin.priceChange7d,
              coin.rank
            ]);
            savedData.coins++;
          } catch (error) {
            console.error(`Erro ao salvar coin ${coin.symbol}:`, error);
          }
        }
      }

      // Salvar trending
      if (results.trending?.length > 0) {
        // Limpar trending antigo
        await query('DELETE FROM trending_coins WHERE created_at < NOW() - INTERVAL \'2 hours\'');
        
        for (const coin of results.trending) {
          try {
            await query(`
              INSERT INTO trending_coins (
                coin_id, symbol, name, price_change_24h, 
                volume_24h, search_volume, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
            `, [
              coin.id,
              coin.symbol,
              coin.name,
              coin.priceChange24h,
              coin.volume24h,
              coin.searchVolume
            ]);
            savedData.trendingCoins++;
          } catch (error) {
            console.error(`Erro ao salvar trending ${coin.symbol}:`, error);
          }
        }
      }

      // Salvar news
      if (results.news?.length > 0) {
        for (const article of results.news) {
          try {
            await query(`
              INSERT INTO crypto_news (
                title, description, url, source, published_at, 
                related_coins, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
              ON CONFLICT (url) DO NOTHING
            `, [
              article.title,
              article.description,
              article.url,
              article.source,
              article.publishedAt,
              JSON.stringify(article.coins)
            ]);
            savedData.newsArticles++;
          } catch (error) {
            console.error(`Erro ao salvar news:`, error);
          }
        }
      }

    } catch (dbError) {
      console.error('Erro ao salvar no banco:', dbError);
      results.errors.push({ type: 'database', error: dbError.message });
    }

    // 6. Verificar integração com Decision Engine
    const decisionEngineStatus = await testDecisionEngineIntegration(results);

    // 7. Resposta final
    const response = {
      status: 'success',
      timestamp: new Date().toISOString(),
      connectivity: results.connectivity,
      dataRetrieved: {
        globalStats: !!results.globalStats,
        topCoins: results.topCoins?.length || 0,
        trending: results.trending?.length || 0,
        news: results.news?.length || 0
      },
      savedToDatabase: savedData,
      decisionEngineIntegration: decisionEngineStatus,
      errors: results.errors,
      nextSteps: generateNextSteps(results, savedData)
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Erro no teste CoinStats:', error);
    return res.status(500).json({ 
      error: 'Erro interno durante teste',
      message: error.message,
      status: 'failed'
    });
  }
}

async function testDecisionEngineIntegration(results: any): Promise<any> {
  try {
    // Simular criação de sinal para o Decision Engine
    if (results.topCoins?.length > 0) {
      const btc = results.topCoins.find((coin: any) => coin.symbol === 'BTC');
      if (btc && Math.abs(btc.priceChange1d) > 2) {
        
        // Criar sinal baseado em mudança de preço do BTC
        const signal = {
          source: 'COINSTATS',
          symbol: 'BTCUSDT',
          action: btc.priceChange1d > 0 ? 'BUY' : 'SELL',
          confidence: Math.min(50 + Math.abs(btc.priceChange1d) * 5, 85),
          price: btc.price,
          change24h: btc.priceChange1d
        };

        // Salvar na fila do Decision Engine
        const signalResult = await query(`
          INSERT INTO signal_processing_queue (
            signal_id, source, symbol, action, confidence, 
            market_data, status, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', NOW())
          RETURNING id
        `, [
          `coinstats_${Date.now()}`,
          signal.source,
          signal.symbol,
          signal.action,
          signal.confidence,
          JSON.stringify({ price: signal.price, change24h: signal.change24h })
        ]);

        return {
          status: 'success',
          signalCreated: true,
          signalId: signalResult.rows[0].id,
          signalData: signal
        };
      }
    }

    return {
      status: 'success',
      signalCreated: false,
      reason: 'No significant market movement detected'
    };

  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

function generateNextSteps(results: any, savedData: any): string[] {
  const steps = [];

  if (results.errors.length > 0) {
    steps.push('🔧 Verificar e corrigir erros de API reportados');
  }

  if (!savedData.marketData) {
    steps.push('📊 Configurar salvamento de dados globais de mercado');
  }

  if (savedData.coins === 0) {
    steps.push('💰 Verificar salvamento de dados de moedas');
  }

  if (savedData.newsArticles === 0) {
    steps.push('📰 Configurar coleta de notícias crypto');
  }

  if (results.topCoins?.length > 0) {
    steps.push('✅ Integração CoinStats funcionando - dados sendo coletados');
  }

  steps.push('🔄 Configurar cron job para coleta automática a cada 15 minutos');
  steps.push('🤖 Ativar processamento pelo Decision Engine');
  
  return steps;
}
