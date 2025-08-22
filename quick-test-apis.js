const axios = require('axios');

async function quickTestAPIs() {
  console.log('⚡ TESTE RÁPIDO DAS APIS ALTERNATIVAS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Testar as APIs que implementamos como fallback
  const apis = [
    {
      name: 'CoinGecko',
      url: 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h',
      test: async () => {
        const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h', {
          timeout: 10000,
          headers: {
            'User-Agent': 'MarketBot/1.0',
            'Accept': 'application/json'
          }
        });
        
        const coins = response.data;
        const positiveCoins = coins.filter(coin => coin.price_change_percentage_24h > 0).length;
        const marketPulse = (positiveCoins / coins.length) * 100;
        
        return { marketPulse: marketPulse.toFixed(1), total: coins.length };
      }
    },
    {
      name: 'CryptoCompare',
      url: 'https://min-api.cryptocompare.com/data/top/mktcapfull?limit=50&tsym=USD',
      test: async () => {
        const response = await axios.get('https://min-api.cryptocompare.com/data/top/mktcapfull?limit=50&tsym=USD', {
          timeout: 10000,
          headers: {
            'User-Agent': 'CryptoBot/1.0',
            'Accept': 'application/json'
          }
        });
        
        const coins = response.data.Data;
        const validCoins = coins.filter(coin => coin.RAW && coin.RAW.USD);
        const positiveCoins = validCoins.filter(coin => coin.RAW.USD.CHANGEPCT24HOUR > 0).length;
        const marketPulse = (positiveCoins / validCoins.length) * 100;
        
        return { marketPulse: marketPulse.toFixed(1), total: validCoins.length };
      }
    },
    {
      name: 'CoinCap',
      url: 'https://api.coincap.io/v2/assets?limit=50',
      test: async () => {
        const response = await axios.get('https://api.coincap.io/v2/assets?limit=50', {
          timeout: 10000,
          headers: {
            'User-Agent': 'MarketTracker/1.0',
            'Accept': 'application/json'
          }
        });
        
        const coins = response.data.data;
        const validCoins = coins.filter(coin => coin.changePercent24Hr !== null);
        const positiveCoins = validCoins.filter(coin => parseFloat(coin.changePercent24Hr) > 0).length;
        const marketPulse = (positiveCoins / validCoins.length) * 100;
        
        return { marketPulse: marketPulse.toFixed(1), total: validCoins.length };
      }
    },
    {
      name: 'Fear & Greed',
      url: 'https://api.alternative.me/fng/',
      test: async () => {
        const response = await axios.get('https://api.alternative.me/fng/', {
          timeout: 5000,
          headers: {
            'User-Agent': 'MarketAnalyzer/1.0'
          }
        });
        
        const fearGreed = response.data.data[0].value;
        return { fearGreed, value_classification: response.data.data[0].value_classification };
      }
    }
  ];
  
  let workingAPIs = 0;
  const results = [];
  
  for (const api of apis) {
    try {
      const result = await api.test();
      
      if (api.name === 'Fear & Greed') {
        console.log(`✅ ${api.name}: ${result.fearGreed} (${result.value_classification})`);
      } else {
        console.log(`✅ ${api.name}: Market Pulse ${result.marketPulse}% (${result.total} moedas)`);
        results.push(parseFloat(result.marketPulse));
      }
      
      workingAPIs++;
      
    } catch (error) {
      console.log(`❌ ${api.name}: ERRO - ${error.response?.status || error.message.substring(0, 30)}`);
    }
  }
  
  console.log('');
  console.log('📊 RESUMO DOS RESULTADOS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🎯 APIs funcionando: ${workingAPIs}/4`);
  
  if (results.length > 0) {
    const average = results.reduce((sum, val) => sum + val, 0) / results.length;
    console.log(`📈 Market Pulse médio: ${average.toFixed(1)}%`);
    
    let marketSentiment = '';
    if (average >= 60) {
      marketSentiment = '🟢 BULL (maioria subindo)';
    } else if (average >= 40) {
      marketSentiment = '🟡 NEUTRO (equilibrado)';
    } else {
      marketSentiment = '🔴 BEAR (maioria descendo)';
    }
    
    console.log(`💹 Sentimento: ${marketSentiment}`);
    
    console.log('');
    console.log('🎉 SISTEMA DE FALLBACK FUNCIONANDO!');
    console.log('✅ Não dependemos mais de Binance/Bybit');
    console.log('✅ Market Pulse pode ser calculado com APIs alternativas');
    console.log('✅ Sistema robusto contra bloqueios regionais');
    
  } else {
    console.log('⚠️ Nenhuma API de Market Pulse funcionou');
    console.log('🔧 Sistema usará valor de emergência (50%)');
  }
  
  // Testar Railway após delay
  console.log('\n⏳ Testando Railway em 10 segundos...');
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  try {
    const railwayResponse = await axios.get('https://coinbitclub-market-bot.up.railway.app/api/market/intelligence', {
      timeout: 15000
    });
    
    console.log('✅ Railway Market Intelligence:', railwayResponse.status);
    console.log(`📊 Market Pulse Railway: ${railwayResponse.data.marketPulse}%`);
    console.log(`🤖 IA Decisão: ${railwayResponse.data.aiDecision?.decision || 'N/A'}`);
    
    if (railwayResponse.data.marketPulse !== 50) {
      console.log('🎉 SUCESSO: Railway usando API alternativa!');
    } else {
      console.log('⚠️ Railway ainda em modo emergência');
    }
    
  } catch (railwayError) {
    console.log(`❌ Railway erro: ${railwayError.response?.status || railwayError.message}`);
  }
}

quickTestAPIs();
