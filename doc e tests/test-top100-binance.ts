// ========================================
// TESTE DAS TOP 100 MOEDAS BINANCE
// Valida análise detalhada do Market Pulse
// ========================================

import axios from 'axios';

interface BinanceTicker {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

async function testTop100BinanceAnalysis() {
  console.log('🧪 TESTE DETALHADO - TOP 100 ANÁLISE BINANCE\n');
  
  try {
    // 1. Buscar dados da Binance
    console.log('📊 Buscando dados da Binance API...');
    const response = await axios.get('https://api.binance.com/api/v3/ticker/24hr', {
      timeout: 15000
    });

    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Resposta inválida da Binance');
    }

    console.log(`✅ Total de pares recebidos: ${response.data.length}`);

    // 2. Filtrar apenas pares USDT
    const usdtPairs = response.data.filter((ticker: BinanceTicker) => 
      ticker.symbol.endsWith('USDT') && 
      !ticker.symbol.includes('UP') && 
      !ticker.symbol.includes('DOWN') &&
      !ticker.symbol.includes('BEAR') &&
      !ticker.symbol.includes('BULL')
    );

    console.log(`🔍 Pares USDT filtrados: ${usdtPairs.length}`);

    // 3. Ordenar por volume em USD (quoteVolume) e pegar TOP 100
    const sortedByVolume = usdtPairs
      .map((ticker: BinanceTicker) => ({
        symbol: ticker.symbol,
        price: parseFloat(ticker.lastPrice),
        priceChange: parseFloat(ticker.priceChange),
        priceChangePercent: parseFloat(ticker.priceChangePercent),
        volume: parseFloat(ticker.volume),
        quoteVolume: parseFloat(ticker.quoteVolume), // Volume em USD
        timestamp: new Date()
      }))
      .filter(coin => coin.quoteVolume > 0) // Apenas com volume válido
      .sort((a, b) => b.quoteVolume - a.quoteVolume) // Ordenar por volume desc
      .slice(0, 100); // TOP 100

    console.log(`📈 TOP 100 por volume selecionados: ${sortedByVolume.length}\n`);

    // 4. Análise detalhada
    const positiveCoins = sortedByVolume.filter(coin => coin.priceChangePercent > 0);
    const negativeCoins = sortedByVolume.filter(coin => coin.priceChangePercent < 0);
    const neutralCoins = sortedByVolume.filter(coin => coin.priceChangePercent === 0);

    const positivePercentage = (positiveCoins.length / sortedByVolume.length) * 100;
    const negativePercentage = (negativeCoins.length / sortedByVolume.length) * 100;

    // Calcular delta ponderado por volume
    const totalVolume = sortedByVolume.reduce((sum, coin) => sum + coin.quoteVolume, 0);
    const volumeWeightedDelta = sortedByVolume.reduce((sum, coin) => {
      const weight = coin.quoteVolume / totalVolume;
      return sum + (coin.priceChangePercent * weight);
    }, 0);

    // Determinar tendência
    let trend = 'NEUTRAL';
    if (positivePercentage >= 60 && volumeWeightedDelta > 0.5) {
      trend = 'BULLISH';
    } else if (negativePercentage >= 60 && volumeWeightedDelta < -0.5) {
      trend = 'BEARISH';
    }

    // 5. Relatório detalhado
    console.log('📊 RELATÓRIO DE ANÁLISE DO MERCADO:');
    console.log('==========================================');
    console.log(`🟢 Moedas Positivas: ${positiveCoins.length} (${positivePercentage.toFixed(1)}%)`);
    console.log(`🔴 Moedas Negativas: ${negativeCoins.length} (${negativePercentage.toFixed(1)}%)`);
    console.log(`⚪ Moedas Neutras: ${neutralCoins.length} (${(neutralCoins.length/sortedByVolume.length*100).toFixed(1)}%)`);
    console.log(`📊 Delta Ponderado por Volume: ${volumeWeightedDelta.toFixed(2)}%`);
    console.log(`📈 Tendência: ${trend}`);
    console.log(`💰 Volume Total (USDT): $${(totalVolume / 1000000).toFixed(2)}M\n`);

    // 6. TOP 10 Maiores volumes
    console.log('🔝 TOP 10 MAIORES VOLUMES:');
    console.log('==========================================');
    sortedByVolume.slice(0, 10).forEach((coin, index) => {
      const status = coin.priceChangePercent > 0 ? '🟢' : coin.priceChangePercent < 0 ? '🔴' : '⚪';
      console.log(`${index + 1}. ${status} ${coin.symbol}: $${coin.price.toFixed(4)} (${coin.priceChangePercent.toFixed(2)}%) Vol: $${(coin.quoteVolume / 1000000).toFixed(2)}M`);
    });

    // 7. TOP 5 Maiores ganhos
    console.log('\n📈 TOP 5 MAIORES GANHOS (das TOP 100):');
    console.log('==========================================');
    const topGainers = sortedByVolume
      .filter(coin => coin.priceChangePercent > 0)
      .sort((a, b) => b.priceChangePercent - a.priceChangePercent)
      .slice(0, 5);

    topGainers.forEach((coin, index) => {
      console.log(`${index + 1}. 🟢 ${coin.symbol}: +${coin.priceChangePercent.toFixed(2)}% Vol: $${(coin.quoteVolume / 1000000).toFixed(2)}M`);
    });

    // 8. TOP 5 Maiores quedas
    console.log('\n📉 TOP 5 MAIORES QUEDAS (das TOP 100):');
    console.log('==========================================');
    const topLosers = sortedByVolume
      .filter(coin => coin.priceChangePercent < 0)
      .sort((a, b) => a.priceChangePercent - b.priceChangePercent)
      .slice(0, 5);

    topLosers.forEach((coin, index) => {
      console.log(`${index + 1}. 🔴 ${coin.symbol}: ${coin.priceChangePercent.toFixed(2)}% Vol: $${(coin.quoteVolume / 1000000).toFixed(2)}M`);
    });

    // 9. Decisão de trading
    console.log('\n🎯 DECISÃO DE TRADING:');
    console.log('==========================================');
    
    let decision = 'NEUTRAL';
    let reasoning = '';
    
    if (trend === 'BULLISH') {
      decision = 'LONG_FAVORABLE';
      reasoning = `Mercado BULLISH: ${positivePercentage.toFixed(1)}% das TOP 100 em alta com delta de volume +${volumeWeightedDelta.toFixed(2)}%`;
    } else if (trend === 'BEARISH') {
      decision = 'SHORT_FAVORABLE';
      reasoning = `Mercado BEARISH: ${negativePercentage.toFixed(1)}% das TOP 100 em baixa com delta de volume ${volumeWeightedDelta.toFixed(2)}%`;
    } else {
      decision = 'NEUTRAL';
      reasoning = `Mercado NEUTRO: ${positivePercentage.toFixed(1)}% positivas vs ${negativePercentage.toFixed(1)}% negativas, delta: ${volumeWeightedDelta.toFixed(2)}%`;
    }

    console.log(`📊 Decisão: ${decision}`);
    console.log(`💡 Raciocínio: ${reasoning}`);

    // 10. Teste do endpoint local
    console.log('\n🔗 TESTANDO ENDPOINT LOCAL:');
    console.log('==========================================');
    
    try {
      const localResponse = await axios.get('http://localhost:3000/api/market/market-pulse', {
        timeout: 10000
      });
      
      console.log('✅ Endpoint local funcionando!');
      console.log('📊 Resposta:', JSON.stringify(localResponse.data, null, 2));
    } catch (error: any) {
      console.log('❌ Erro no endpoint local:');
      if (error.code === 'ECONNREFUSED') {
        console.log('🔴 Servidor não está rodando na porta 3000');
      } else {
        console.log('🔴', error.message);
      }
    }

    console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!');
    
  } catch (error: any) {
    console.error('❌ ERRO NO TESTE:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      console.error('🔴 Timeout na conexão com a Binance');
    } else if (error.response) {
      console.error('🔴 Erro HTTP:', error.response.status, error.response.statusText);
    } else if (error.request) {
      console.error('🔴 Erro de rede:', error.code);
    }
    
    process.exit(1);
  }
}

// Executar teste
testTop100BinanceAnalysis();
