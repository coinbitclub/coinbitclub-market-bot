
// SISTEMA DE FALLBACK AVANÇADO PARA MARKET PULSE
async function getMarketPulseRobust() {
  console.log('📊 Iniciando Market Pulse com sistema robusto...');
  
  const apis = [
    // API 1: CoinGecko (Mais Confiável)
    {
      name: 'CoinGecko',
      call: async () => {
        const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h', {
          timeout: 15000,
          headers: {
            'User-Agent': 'MarketBot/1.0 (https://coinbitclub.com)',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9'
          }
        });
        
        const coins = response.data;
        const positiveCoins = coins.filter(coin => coin.price_change_percentage_24h > 0).length;
        const marketPulse = (positiveCoins / coins.length) * 100;
        
        console.log(`✅ CoinGecko: ${marketPulse.toFixed(1)}% (${coins.length} moedas)`);
        return marketPulse;
      }
    },
    
    // API 2: CryptoCompare
    {
      name: 'CryptoCompare',
      call: async () => {
        const response = await axios.get('https://min-api.cryptocompare.com/data/top/mktcapfull?limit=100&tsym=USD', {
          timeout: 10000,
          headers: {
            'User-Agent': 'CryptoAnalyzer/1.0',
            'Accept': 'application/json'
          }
        });
        
        const coins = response.data.Data;
        const validCoins = coins.filter(coin => coin.RAW && coin.RAW.USD);
        const positiveCoins = validCoins.filter(coin => coin.RAW.USD.CHANGEPCT24HOUR > 0).length;
        const marketPulse = (positiveCoins / validCoins.length) * 100;
        
        console.log(`✅ CryptoCompare: ${marketPulse.toFixed(1)}% (${validCoins.length} moedas)`);
        return marketPulse;
      }
    },
    
    // API 3: CoinCap
    {
      name: 'CoinCap',
      call: async () => {
        const response = await axios.get('https://api.coincap.io/v2/assets?limit=100', {
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
        
        console.log(`✅ CoinCap: ${marketPulse.toFixed(1)}% (${validCoins.length} moedas)`);
        return marketPulse;
      }
    },
    
    // API 4: Binance (com retry otimizado)
    {
      name: 'Binance',
      call: async () => {
        const configs = [
          { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } },
          { headers: { 'User-Agent': 'TradingBot/1.0', 'Accept': 'application/json' } }
        ];
        
        for (const config of configs) {
          try {
            const response = await axios.get('https://api.binance.com/api/v3/ticker/24hr', {
              timeout: 8000,
              ...config
            });
            
            const tickers = response.data;
            const usdtPairs = tickers.filter(t => t.symbol.endsWith('USDT'));
            const positivePairs = usdtPairs.filter(t => parseFloat(t.priceChangePercent) > 0).length;
            const marketPulse = (positivePairs / usdtPairs.length) * 100;
            
            console.log(`✅ Binance: ${marketPulse.toFixed(1)}% (${usdtPairs.length} pares USDT)`);
            return marketPulse;
          } catch (error) {
            console.log(`⚠️ Binance tentativa falhou: ${error.response?.status || error.message}`);
          }
        }
        throw new Error('Binance indisponível');
      }
    }
  ];
  
  // Tentar cada API em sequência
  for (const api of apis) {
    try {
      const marketPulse = await api.call();
      if (marketPulse && marketPulse >= 0 && marketPulse <= 100) {
        console.log(`🎯 Market Pulse obtido via ${api.name}: ${marketPulse.toFixed(1)}%`);
        return marketPulse;
      }
    } catch (error) {
      console.log(`❌ ${api.name} falhou: ${error.message.substring(0, 50)}`);
    }
  }
  
  // Se tudo falhar, usar valor baseado em análise técnica
  console.log('🆘 Todas as APIs falharam, usando análise técnica de emergência...');
  
  // Análise baseada em Fear & Greed + BTC Dominance (quando disponível)
  try {
    const fearGreedResponse = await axios.get('https://api.alternative.me/fng/', { timeout: 5000 });
    const fearGreed = fearGreedResponse.data.data[0].value;
    
    // Converter Fear & Greed em Market Pulse estimado
    // Fear & Greed 0-25 = Market Pulse ~30-40% (bear)
    // Fear & Greed 25-75 = Market Pulse ~40-60% (neutral)  
    // Fear & Greed 75-100 = Market Pulse ~60-80% (bull)
    let estimatedPulse;
    if (fearGreed < 25) {
      estimatedPulse = 30 + (fearGreed / 25) * 10; // 30-40%
    } else if (fearGreed < 75) {
      estimatedPulse = 40 + ((fearGreed - 25) / 50) * 20; // 40-60%
    } else {
      estimatedPulse = 60 + ((fearGreed - 75) / 25) * 20; // 60-80%
    }
    
    console.log(`📊 Market Pulse estimado via Fear&Greed(${fearGreed}): ${estimatedPulse.toFixed(1)}%`);
    return estimatedPulse;
    
  } catch (fearGreedError) {
    console.log('🔴 Fear & Greed também indisponível, usando valor neutro');
    return 50; // Valor neutro padrão
  }
}

// SUBSTITUIR A FUNÇÃO ORIGINAL NO SERVIDOR
// Localizar e substituir getMarketPulseWithFallback por getMarketPulseRobust
