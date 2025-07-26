// TESTE COMPLETO DOS 3 ENDPOINTS COINSTATS PARA INTEGRAÇÃO
// =========================================================

const https = require('https');

console.log('📊 TESTE DOS ENDPOINTS COINSTATS PARA INTEGRAÇÃO');
console.log('================================================');
console.log('Data:', new Date().toLocaleString('pt-BR'));
console.log('');

// ================================================
// CONFIGURAÇÕES
// ================================================

const CONFIG = {
  coinstatsApiKey: 'ZFIxigBcVaCyXDL1Qp/Ork7TOL3+h07NM2f3YoSrMkI=',
  
  // Endpoints da API CoinStats v1 (funcionais)
  endpoints: {
    global: 'https://api.coinstats.app/public/v1/global',
    coins: 'https://api.coinstats.app/public/v1/coins',
    fearGreed: 'https://api.coinstats.app/public/v1/fear-greed',
  },
  
  // Endpoints da API CoinStats v2 (novos - podem precisar de diferentes headers)
  endpointsV2: {
    markets: 'https://openapiv1.coinstats.app/markets',
    fearGreed: 'https://openapiv1.coinstats.app/insights/fear-and-greed',
    dominance: 'https://openapiv1.coinstats.app/insights/btc-dominance?type=24h'
  },
  
  database: {
    // Configuração do banco para salvar os dados
    url: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@postgres.railway.internal:5432/railway'
  }
};

// ================================================
// FUNÇÃO PARA FAZER REQUESTS HTTPS
// ================================================

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CoinBitClub-Market-Bot/1.0',
        'Accept': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData,
            rawData: data,
            success: res.statusCode >= 200 && res.statusCode < 300
          });
        } catch (parseError) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: null,
            rawData: data,
            success: false,
            parseError: parseError.message
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// ================================================
// TESTE 1: DADOS GLOBAIS DO MERCADO
// ================================================

async function testGlobalMarketData() {
  console.log('🌍 TESTE 1: DADOS GLOBAIS DO MERCADO');
  console.log('===================================');
  
  console.log('🔍 Testando API v1 (global):');
  console.log(`URL: ${CONFIG.endpoints.global}`);
  
  try {
    const response = await makeRequest(CONFIG.endpoints.global, {
      headers: {
        'X-API-KEY': CONFIG.coinstatsApiKey
      }
    });
    
    console.log(`📊 Status: ${response.statusCode}`);
    console.log(`✅ Sucesso: ${response.success ? 'SIM' : 'NÃO'}`);
    
    if (response.success && response.data) {
      console.log('📈 DADOS RECEBIDOS:');
      console.log(`  💰 Market Cap Total: $${response.data.totalMarketCap?.toLocaleString() || 'N/A'}`);
      console.log(`  📊 Volume 24h: $${response.data.total24hVolume?.toLocaleString() || 'N/A'}`);
      console.log(`  🟡 BTC Dominance: ${response.data.bitcoinDominance || 'N/A'}%`);
      console.log(`  📈 Market Cap Change 24h: ${response.data.marketCapChange24h || 'N/A'}%`);
      console.log(`  📊 Volume Change 24h: ${response.data.volumeChange24h || 'N/A'}%`);
      
      // Estrutura para salvar no banco
      const marketData = {
        market_cap: response.data.totalMarketCap,
        volume_24h: response.data.total24hVolume,
        btc_dominance: response.data.bitcoinDominance,
        market_cap_change: response.data.marketCapChange24h,
        volume_change: response.data.volumeChange24h,
        timestamp: new Date().toISOString(),
        source: 'coinstats_v1'
      };
      
      console.log('💾 ESTRUTURA PARA BANCO:');
      console.log(JSON.stringify(marketData, null, 2));
      
    } else {
      console.log(`❌ Erro: ${response.statusCode}`);
      console.log(`📄 Resposta: ${response.rawData}`);
      if (response.parseError) {
        console.log(`🔍 Erro de Parse: ${response.parseError}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Erro na requisição: ${error.message}`);
  }
  
  console.log('');
  
  // Testar API v2 alternativa
  console.log('🔍 Testando API v2 (markets):');
  console.log(`URL: ${CONFIG.endpointsV2.markets}`);
  
  try {
    const response = await makeRequest(CONFIG.endpointsV2.markets, {
      headers: {
        'X-API-KEY': CONFIG.coinstatsApiKey
      }
    });
    
    console.log(`📊 Status: ${response.statusCode}`);
    console.log(`✅ Sucesso: ${response.success ? 'SIM' : 'NÃO'}`);
    
    if (response.success && response.data) {
      console.log('📈 DADOS V2 RECEBIDOS:');
      console.log(JSON.stringify(response.data, null, 2));
    } else {
      console.log(`❌ Erro: ${response.statusCode}`);
      console.log(`📄 Resposta: ${response.rawData}`);
    }
    
  } catch (error) {
    console.log(`❌ Erro na requisição v2: ${error.message}`);
  }
  
  console.log('');
}

// ================================================
// TESTE 2: ÍNDICE FEAR & GREED
// ================================================

async function testFearGreedIndex() {
  console.log('😰 TESTE 2: ÍNDICE FEAR & GREED');
  console.log('===============================');
  
  console.log('🔍 Testando API v1 (fear-greed):');
  console.log(`URL: ${CONFIG.endpoints.fearGreed}`);
  
  try {
    const response = await makeRequest(CONFIG.endpoints.fearGreed, {
      headers: {
        'X-API-KEY': CONFIG.coinstatsApiKey
      }
    });
    
    console.log(`📊 Status: ${response.statusCode}`);
    console.log(`✅ Sucesso: ${response.success ? 'SIM' : 'NÃO'}`);
    
    if (response.success && response.data) {
      console.log('📈 DADOS FEAR & GREED:');
      console.log(`  📊 Valor Atual: ${response.data.value || 'N/A'}`);
      console.log(`  🏷️ Classificação: ${response.data.value_classification || 'N/A'}`);
      console.log(`  📅 Última Atualização: ${response.data.timestamp || 'N/A'}`);
      
      // Estrutura para salvar no banco
      const fearGreedData = {
        fear_greed_value: response.data.value,
        fear_greed_classification: response.data.value_classification,
        timestamp: new Date().toISOString(),
        source: 'coinstats_v1'
      };
      
      console.log('💾 ESTRUTURA PARA BANCO:');
      console.log(JSON.stringify(fearGreedData, null, 2));
      
    } else {
      console.log(`❌ Erro: ${response.statusCode}`);
      console.log(`📄 Resposta: ${response.rawData}`);
      if (response.parseError) {
        console.log(`🔍 Erro de Parse: ${response.parseError}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Erro na requisição: ${error.message}`);
  }
  
  console.log('');
  
  // Testar API v2 alternativa
  console.log('🔍 Testando API v2 (fear-and-greed):');
  console.log(`URL: ${CONFIG.endpointsV2.fearGreed}`);
  
  try {
    const response = await makeRequest(CONFIG.endpointsV2.fearGreed, {
      headers: {
        'X-API-KEY': CONFIG.coinstatsApiKey
      }
    });
    
    console.log(`📊 Status: ${response.statusCode}`);
    console.log(`✅ Sucesso: ${response.success ? 'SIM' : 'NÃO'}`);
    
    if (response.success && response.data) {
      console.log('📈 DADOS FEAR & GREED V2:');
      console.log(JSON.stringify(response.data, null, 2));
      
      // Se tiver estrutura "now"
      if (response.data.now) {
        console.log('📊 DADOS ATUAIS:');
        console.log(`  Valor: ${response.data.now.value}`);
        console.log(`  Classificação: ${response.data.now.value_classification}`);
        console.log(`  Timestamp: ${response.data.now.update_time}`);
      }
      
    } else {
      console.log(`❌ Erro: ${response.statusCode}`);
      console.log(`📄 Resposta: ${response.rawData}`);
    }
    
  } catch (error) {
    console.log(`❌ Erro na requisição v2: ${error.message}`);
  }
  
  console.log('');
}

// ================================================
// TESTE 3: DOMINÂNCIA DO BITCOIN
// ================================================

async function testBtcDominance() {
  console.log('🟡 TESTE 3: DOMINÂNCIA DO BITCOIN');
  console.log('==================================');
  
  // Primeiro, tentar obter da API global (já testada)
  console.log('🔍 Obtendo dominância dos dados globais:');
  
  try {
    const globalResponse = await makeRequest(CONFIG.endpoints.global, {
      headers: {
        'X-API-KEY': CONFIG.coinstatsApiKey
      }
    });
    
    if (globalResponse.success && globalResponse.data?.bitcoinDominance) {
      console.log(`✅ BTC Dominance (Global): ${globalResponse.data.bitcoinDominance}%`);
    }
    
  } catch (error) {
    console.log(`❌ Erro obtendo dominância global: ${error.message}`);
  }
  
  console.log('');
  
  // Testar endpoint específico de dominância v2
  console.log('🔍 Testando API v2 (btc-dominance):');
  console.log(`URL: ${CONFIG.endpointsV2.dominance}`);
  
  try {
    const response = await makeRequest(CONFIG.endpointsV2.dominance, {
      headers: {
        'X-API-KEY': CONFIG.coinstatsApiKey
      }
    });
    
    console.log(`📊 Status: ${response.statusCode}`);
    console.log(`✅ Sucesso: ${response.success ? 'SIM' : 'NÃO'}`);
    
    if (response.success && response.data) {
      console.log('📈 DADOS DOMINÂNCIA BTC:');
      console.log(JSON.stringify(response.data, null, 2));
      
      // Se retornar array de dados históricos
      if (Array.isArray(response.data.data)) {
        const latestData = response.data.data[response.data.data.length - 1];
        if (latestData) {
          console.log(`📊 Dominância Atual: ${latestData[1]}%`);
          console.log(`📅 Timestamp: ${new Date(latestData[0] * 1000).toLocaleString('pt-BR')}`);
          
          // Estrutura para salvar no banco
          const dominanceData = {
            dominance_percentage: latestData[1],
            timestamp: new Date(latestData[0] * 1000).toISOString(),
            source: 'coinstats_v2'
          };
          
          console.log('💾 ESTRUTURA PARA BANCO:');
          console.log(JSON.stringify(dominanceData, null, 2));
        }
      }
      
    } else {
      console.log(`❌ Erro: ${response.statusCode}`);
      console.log(`📄 Resposta: ${response.rawData}`);
    }
    
  } catch (error) {
    console.log(`❌ Erro na requisição: ${error.message}`);
  }
  
  console.log('');
}

// ================================================
// TESTE DE CONECTIVIDADE GERAL
// ================================================

async function testConnectivity() {
  console.log('🔌 TESTE DE CONECTIVIDADE');
  console.log('=========================');
  
  console.log(`🔑 Chave API: ${CONFIG.coinstatsApiKey.substring(0, 20)}...`);
  console.log('');
  
  // Testar endpoint básico (coins)
  console.log('🪙 Testando endpoint básico (coins):');
  console.log(`URL: ${CONFIG.endpoints.coins}?limit=5`);
  
  try {
    const response = await makeRequest(`${CONFIG.endpoints.coins}?limit=5`, {
      headers: {
        'X-API-KEY': CONFIG.coinstatsApiKey
      }
    });
    
    console.log(`📊 Status: ${response.statusCode}`);
    console.log(`✅ Sucesso: ${response.success ? 'SIM' : 'NÃO'}`);
    
    if (response.success && response.data?.coins) {
      console.log(`💰 Moedas retornadas: ${response.data.coins.length}`);
      
      if (response.data.coins.length > 0) {
        const firstCoin = response.data.coins[0];
        console.log(`🥇 Primeira moeda: ${firstCoin.name} (${firstCoin.symbol})`);
        console.log(`💵 Preço: $${firstCoin.price}`);
        console.log(`📊 Market Cap: $${firstCoin.marketCap?.toLocaleString() || 'N/A'}`);
      }
    } else {
      console.log(`❌ Erro: ${response.statusCode}`);
      console.log(`📄 Resposta: ${response.rawData}`);
    }
    
  } catch (error) {
    console.log(`❌ Erro na requisição: ${error.message}`);
  }
  
  console.log('');
}

// ================================================
// ESTRUTURAS DE TABELAS SUGERIDAS
// ================================================

function showDatabaseStructures() {
  console.log('🗄️ ESTRUTURAS DE TABELAS SUGERIDAS');
  console.log('===================================');
  
  console.log('📊 Tabela: market_data');
  console.log(`
CREATE TABLE IF NOT EXISTS market_data (
  id SERIAL PRIMARY KEY,
  market_cap BIGINT,
  volume_24h BIGINT,
  btc_dominance DECIMAL(5,2),
  market_cap_change DECIMAL(10,4),
  volume_change DECIMAL(10,4),
  source VARCHAR(50),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
  `);
  
  console.log('😰 Tabela: fear_greed_index');
  console.log(`
CREATE TABLE IF NOT EXISTS fear_greed_index (
  id SERIAL PRIMARY KEY,
  fear_greed_value INTEGER CHECK (fear_greed_value >= 0 AND fear_greed_value <= 100),
  fear_greed_classification VARCHAR(50),
  source VARCHAR(50),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
  `);
  
  console.log('🟡 Tabela: btc_dominance');
  console.log(`
CREATE TABLE IF NOT EXISTS btc_dominance (
  id SERIAL PRIMARY KEY,
  dominance_percentage DECIMAL(5,2),
  source VARCHAR(50),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
  `);
  
  console.log('');
}

// ================================================
// FUNÇÃO PRINCIPAL
// ================================================

async function runCoinStatsTest() {
  console.log('🚀 INICIANDO TESTE COMPLETO DOS ENDPOINTS COINSTATS...\n');
  
  try {
    // Teste de conectividade básica
    await testConnectivity();
    
    // Teste dos 3 endpoints principais
    await testGlobalMarketData();
    await testFearGreedIndex();
    await testBtcDominance();
    
    // Mostrar estruturas de banco sugeridas
    showDatabaseStructures();
    
    console.log('📊 RELATÓRIO FINAL');
    console.log('==================');
    console.log('✅ Teste completo finalizado');
    console.log('📋 Verifique os resultados acima para cada endpoint');
    console.log('');
    console.log('🔧 PRÓXIMOS PASSOS:');
    console.log('  1. Criar as tabelas no banco de dados');
    console.log('  2. Implementar funções de salvamento dos dados');
    console.log('  3. Configurar cron jobs para coleta automática');
    console.log('  4. Implementar webhooks para dados em tempo real');
    console.log('  5. Integrar com o sistema de sinais existente');
    console.log('');
    
  } catch (error) {
    console.error('❌ Erro durante teste:', error);
  }
}

// Executar se for o arquivo principal
if (require.main === module) {
  runCoinStatsTest();
}

module.exports = { 
  runCoinStatsTest,
  testGlobalMarketData,
  testFearGreedIndex,
  testBtcDominance,
  CONFIG
};
