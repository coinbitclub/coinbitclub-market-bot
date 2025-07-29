
/**
 * Configuração das APIs das Exchanges com IP fixo
 * Railway IP: 132.255.160.140
 */

const exchangeConfig = {
  // Railway Configuration
  railway: {
    ip: '132.255.160.140',
    environment: process.env.NODE_ENV || 'development',
    region: 'us-west-2'
  },

  // Binance Configuration
  binance: {
    apiKey: process.env.BINANCE_API_KEY,
    secretKey: process.env.BINANCE_SECRET_KEY,
    
    // URLs baseadas no ambiente
    baseURL: process.env.USE_TESTNET === 'true' 
      ? 'https://testnet.binance.vision'
      : 'https://api.binance.com',
    
    futuresURL: process.env.USE_TESTNET === 'true'
      ? 'https://testnet.binancefuture.com'
      : 'https://fapi.binance.com',
    
    // Configurações de segurança
    allowedIPs: ['132.255.160.140'],
    ipCheckEnabled: true,
    
    // Headers padrão
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'CoinBitClub-Bot/1.0',
      'X-Source-IP': '132.255.160.140',
      'X-Railway-Service': 'coinbitclub-market-bot'
    },
    
    // Timeouts
    timeout: 10000,
    retries: 3
  },

  // Bybit Configuration  
  bybit: {
    apiKey: process.env.BYBIT_API_KEY,
    secretKey: process.env.BYBIT_SECRET_KEY,
    
    // URLs baseadas no ambiente
    baseURL: process.env.USE_TESTNET === 'true'
      ? 'https://api-testnet.bybit.com'
      : 'https://api.bybit.com',
    
    // Configurações de segurança
    allowedIPs: ['132.255.160.140'],
    ipCheckEnabled: true,
    
    // Headers padrão
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'CoinBitClub-Bot/1.0',
      'X-Source-IP': '132.255.160.140',
      'X-Railway-Service': 'coinbitclub-market-bot'
    },
    
    // Timeouts
    timeout: 10000,
    retries: 3
  }
};

// Função para obter headers específicos da exchange
function getExchangeHeaders(exchange, apiKey, additionalHeaders = {}) {
  const config = exchangeConfig[exchange];
  if (!config) {
    throw new Error(`Exchange não suportada: ${exchange}`);
  }

  const headers = { ...config.headers, ...additionalHeaders };

  if (exchange === 'binance') {
    headers['X-MBX-APIKEY'] = apiKey;
  } else if (exchange === 'bybit') {
    headers['X-BAPI-API-KEY'] = apiKey;
  }

  return headers;
}

// Função para validar configuração
function validateExchangeConfig(exchange) {
  const config = exchangeConfig[exchange];
  
  if (!config) {
    throw new Error(`Configuração não encontrada para: ${exchange}`);
  }

  if (!config.apiKey || !config.secretKey) {
    throw new Error(`API Keys não configuradas para: ${exchange}`);
  }

  console.log(`✅ Configuração válida para ${exchange}`);
  return true;
}

module.exports = {
  exchangeConfig,
  getExchangeHeaders,
  validateExchangeConfig
};
