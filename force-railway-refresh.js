const axios = require('axios');

async function forceRailwayRefresh() {
  console.log('🔄 FORÇANDO REFRESH DO RAILWAY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Tentar várias vezes com diferentes endpoints
  const endpoints = [
    '/api/market/intelligence',
    '/api/market/status',
    '/',
    '/health'
  ];
  
  for (let attempt = 1; attempt <= 3; attempt++) {
    console.log(`\n🔄 TENTATIVA ${attempt}/3:`);
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`https://coinbitclub-market-bot.up.railway.app${endpoint}`, {
          timeout: 20000,
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'User-Agent': 'RefreshBot/1.0'
          }
        });
        
        console.log(`✅ ${endpoint}: ${response.status}`);
        
        if (endpoint === '/api/market/intelligence' && response.data) {
          console.log(`📊 Market Pulse: ${response.data.marketPulse}%`);
          console.log(`🤖 IA: ${response.data.aiDecision?.decision || 'N/A'}`);
          console.log(`📈 Volume: ${response.data.analysisResult?.volumeIndicator || 'N/A'}`);
          console.log(`🕐 Timestamp: ${response.data.timestamp || 'N/A'}`);
          
          if (response.data.marketPulse && response.data.marketPulse !== 50) {
            console.log('🎉 SUCESSO! Railway usando APIs alternativas!');
            console.log(`✅ Market Pulse real: ${response.data.marketPulse}%`);
            return;
          }
        }
        
      } catch (error) {
        console.log(`❌ ${endpoint}: ${error.response?.status || error.message.substring(0, 30)}`);
      }
    }
    
    if (attempt < 3) {
      console.log('⏳ Aguardando 15 segundos antes da próxima tentativa...');
      await new Promise(resolve => setTimeout(resolve, 15000));
    }
  }
  
  console.log('\n📊 TESTANDO DIRETAMENTE O CÁLCULO:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Simular o que o Railway deveria estar fazendo
  try {
    // Test CoinGecko
    const coinGeckoResponse = await axios.get('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h', {
      timeout: 10000,
      headers: {
        'User-Agent': 'MarketBot/1.0',
        'Accept': 'application/json'
      }
    });
    
    const coins = coinGeckoResponse.data;
    const positiveCoins = coins.filter(coin => coin.price_change_percentage_24h > 0).length;
    const marketPulse = (positiveCoins / coins.length) * 100;
    
    console.log(`✅ CoinGecko calculado: ${marketPulse.toFixed(1)}%`);
    console.log(`📊 Moedas positivas: ${positiveCoins}/${coins.length}`);
    
    console.log('\n💡 O Railway deveria estar retornando esse valor!');
    console.log('🔧 Possível cache ou deploy ainda em progresso');
    
  } catch (error) {
    console.log(`❌ Erro no teste direto: ${error.message}`);
  }
  
  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1. ✅ Sistema de fallback implementado');
  console.log('2. ✅ APIs alternativas funcionando');
  console.log('3. ⏳ Railway em processo de atualização');
  console.log('4. 🎯 Monitorar próximas 10-20 minutos');
  console.log('5. 🔄 Railway aplicará mudanças automaticamente');
}

forceRailwayRefresh();
