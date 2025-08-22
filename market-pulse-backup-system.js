
// Sistema de Backup Market Pulse - Binance + Bybit
// Implementação completa para substituir a função getMarketPulse()

const axios = require('axios');



// Função para obter Market Pulse via Binance API
async function getBinanceMarketPulse() {
  try {
    console.log('📡 Tentando Binance API...');
    
    const response = await axios.get('https://api.binance.com/api/v3/ticker/24hr', {
      timeout: 15000,
      headers: {
        'User-Agent': 'MarketBot/1.0'
      }
    });
    
    const data = response.data;
    const usdtPairs = data.filter(ticker => 
      ticker.symbol.endsWith('USDT') && 
      !ticker.symbol.includes('UP') && 
      !ticker.symbol.includes('DOWN') &&
      !ticker.symbol.includes('BEAR') &&
      !ticker.symbol.includes('BULL')
    );
    
    const positiveCount = usdtPairs.filter(ticker => 
      parseFloat(ticker.priceChangePercent) > 0
    ).length;
    
    const marketPulse = (positiveCount / usdtPairs.length) * 100;
    
    console.log(`✅ Binance: ${usdtPairs.length} pares, ${positiveCount} positivos (${marketPulse.toFixed(1)}%)`);
    
    return {
      success: true,
      marketPulse: marketPulse,
      source: 'binance',
      totalPairs: usdtPairs.length,
      positivePairs: positiveCount
    };
    
  } catch (error) {
    console.log(`❌ Binance falhou: ${error.response?.status || error.message}`);
    
    // Marcar códigos de erro específicos
    const isBlocked = error.response?.status === 451 || 
                      error.response?.status === 403 || 
                      error.response?.status === 429;
    
    return {
      success: false,
      error: error.message,
      blocked: isBlocked,
      source: 'binance'
    };
  }
}


// Função para obter Market Pulse via Bybit API
async function getBybitMarketPulse() {
  try {
    console.log('📡 Tentando Bybit API...');
    
    // Bybit usa endpoint diferente para tickers
    const response = await axios.get('https://api.bybit.com/v5/market/tickers', {
      params: {
        category: 'spot'  // Spot trading pairs
      },
      timeout: 15000,
      headers: {
        'User-Agent': 'MarketBot/1.0'
      }
    });
    
    const data = response.data.result.list;
    const usdtPairs = data.filter(ticker => 
      ticker.symbol.endsWith('USDT') && 
      ticker.lastPrice && 
      ticker.price24hPcnt
    );
    
    const positiveCount = usdtPairs.filter(ticker => 
      parseFloat(ticker.price24hPcnt) > 0
    ).length;
    
    const marketPulse = (positiveCount / usdtPairs.length) * 100;
    
    console.log(`✅ Bybit: ${usdtPairs.length} pares, ${positiveCount} positivos (${marketPulse.toFixed(1)}%)`);
    
    return {
      success: true,
      marketPulse: marketPulse,
      source: 'bybit',
      totalPairs: usdtPairs.length,
      positivePairs: positiveCount
    };
    
  } catch (error) {
    console.log(`❌ Bybit falhou: ${error.response?.status || error.message}`);
    
    return {
      success: false,
      error: error.message,
      source: 'bybit'
    };
  }
}


// Sistema inteligente de alternância entre APIs
let apiStatus = {
  binance: { available: true, lastError: null, lastCheck: 0 },
  bybit: { available: true, lastError: null, lastCheck: 0 }
};

async function getMarketPulseWithFallback() {
  const now = Date.now();
  const RETRY_INTERVAL = 5 * 60 * 1000; // 5 minutos
  
  // Verificar se Binance pode ser tentada novamente
  if (!apiStatus.binance.available && 
      (now - apiStatus.binance.lastCheck) > RETRY_INTERVAL) {
    console.log('🔄 Tentando reconectar Binance após 5 minutos...');
    apiStatus.binance.available = true;
  }
  
  // Tentar Binance primeiro (prioridade)
  if (apiStatus.binance.available) {
    const binanceResult = await getBinanceMarketPulse();
    
    if (binanceResult.success) {
      // Binance funcionou, marcar como disponível
      apiStatus.binance.available = true;
      apiStatus.binance.lastError = null;
      return binanceResult;
    } else {
      // Binance falhou
      apiStatus.binance.lastError = binanceResult.error;
      apiStatus.binance.lastCheck = now;
      
      // Se foi bloqueio, marcar como indisponível
      if (binanceResult.blocked) {
        console.log('🚫 Binance bloqueada, alternando para Bybit...');
        apiStatus.binance.available = false;
      }
    }
  }
  
  // Fallback para Bybit
  console.log('🔄 Usando Bybit como backup...');
  const bybitResult = await getBybitMarketPulse();
  
  if (bybitResult.success) {
    return bybitResult;
  } else {
    // Ambas as APIs falharam
    apiStatus.bybit.lastError = bybitResult.error;
    apiStatus.bybit.lastCheck = now;
    
    throw new Error(`Todas as APIs falharam. Binance: ${apiStatus.binance.lastError}, Bybit: ${bybitResult.error}`);
  }
}

// Função principal do Market Pulse com backup automático
async function getMarketPulse() {
  try {
    const result = await getMarketPulseWithFallback();
    
    // Log para acompanhamento
    console.log(`📊 Market Pulse: ${result.marketPulse.toFixed(1)}% (${result.source})`);
    console.log(`   Pares analisados: ${result.totalPairs} | Positivos: ${result.positivePairs}`);
    
    return result.marketPulse;
    
  } catch (error) {
    console.error('❌ Erro Market Pulse:', error.message);
    console.error('⚠️ Stack trace:', error);
    
    // Valor padrão de emergência baseado no último valor conhecido
    const lastKnownValue = global.lastMarketPulse || 50.0;
    console.log(`🆘 Usando valor de emergência: ${lastKnownValue}%`);
    
    return lastKnownValue;
  }
}

module.exports = { 
  getMarketPulse,
  getBinanceMarketPulse,
  getBybitMarketPulse,
  getMarketPulseWithFallback,
  apiStatus
};
