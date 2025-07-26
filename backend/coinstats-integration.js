// INTEGRAÇÃO COMPLETA COINSTATS - COLETA E SALVAMENTO NO BANCO
// =============================================================

require('dotenv').config();
const { Pool } = require('pg');
const https = require('https');

console.log('💾 INTEGRAÇÃO COINSTATS - COLETA E SALVAMENTO');
console.log('==============================================');
console.log('Data:', new Date().toLocaleString('pt-BR'));
console.log('');

// ================================================
// CONFIGURAÇÕES
// ================================================

const CONFIG = {
  coinstatsApiKey: 'ZFIxigBcVaCyXDL1Qp/Ork7TOL3+h07NM2f3YoSrMkI=',
  
  // Endpoints funcionais da API CoinStats v2
  endpoints: {
    markets: 'https://openapiv1.coinstats.app/markets',
    fearGreed: 'https://openapiv1.coinstats.app/insights/fear-and-greed',
    dominance: 'https://openapiv1.coinstats.app/insights/btc-dominance?type=24h'
  },
  
  database: {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway',
    ssl: { rejectUnauthorized: false }
  }
};

// ================================================
// CONEXÃO COM BANCO DE DADOS
// ================================================

const pool = new Pool({
  connectionString: CONFIG.database.connectionString,
  ssl: CONFIG.database.ssl
});

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
        'X-API-KEY': CONFIG.coinstatsApiKey,
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
            data: jsonData,
            success: res.statusCode >= 200 && res.statusCode < 300
          });
        } catch (parseError) {
          reject(new Error(`Parse error: ${parseError.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

// ================================================
// FUNÇÃO 1: COLETAR E SALVAR DADOS GLOBAIS
// ================================================

async function collectAndSaveMarketData() {
  console.log('🌍 COLETANDO DADOS GLOBAIS DO MERCADO...');
  
  try {
    const response = await makeRequest(CONFIG.endpoints.markets);
    
    if (!response.success || !response.data) {
      throw new Error(`API error: ${response.statusCode}`);
    }
    
    const data = response.data;
    
    // Preparar dados para inserção
    const marketData = {
      market_cap: data.marketCap || null,
      volume_24h: data.volume || null,
      btc_dominance: data.btcDominance || null,
      market_cap_change: data.marketCapChange || null,
      volume_change: data.volumeChange || null,
      btc_dominance_change: data.btcDominanceChange || null,
      source: 'coinstats_v2',
      timestamp: new Date()
    };
    
    console.log('📊 Dados coletados:');
    console.log(`  💰 Market Cap: $${marketData.market_cap?.toLocaleString() || 'N/A'}`);
    console.log(`  📊 Volume 24h: $${marketData.volume_24h?.toLocaleString() || 'N/A'}`);
    console.log(`  🟡 BTC Dominance: ${marketData.btc_dominance || 'N/A'}%`);
    console.log(`  📈 Market Cap Change: ${marketData.market_cap_change || 'N/A'}%`);
    console.log(`  📊 Volume Change: ${marketData.volume_change || 'N/A'}%`);
    
    // Salvar no banco de dados
    const query = `
      INSERT INTO market_data (
        market_cap, volume_24h, btc_dominance, 
        market_cap_change, volume_change, btc_dominance_change,
        source, timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, created_at
    `;
    
    const values = [
      marketData.market_cap,
      marketData.volume_24h,
      marketData.btc_dominance,
      marketData.market_cap_change,
      marketData.volume_change,
      marketData.btc_dominance_change,
      marketData.source,
      marketData.timestamp
    ];
    
    const result = await pool.query(query, values);
    
    console.log(`✅ Dados salvos no banco - ID: ${result.rows[0].id}`);
    console.log(`📅 Timestamp: ${result.rows[0].created_at.toLocaleString('pt-BR')}`);
    
    return {
      success: true,
      id: result.rows[0].id,
      data: marketData
    };
    
  } catch (error) {
    console.error(`❌ Erro ao coletar dados do mercado: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// ================================================
// FUNÇÃO 2: COLETAR E SALVAR FEAR & GREED INDEX
// ================================================

async function collectAndSaveFearGreed() {
  console.log('😰 COLETANDO ÍNDICE FEAR & GREED...');
  
  try {
    const response = await makeRequest(CONFIG.endpoints.fearGreed);
    
    if (!response.success || !response.data?.now) {
      throw new Error(`API error: ${response.statusCode}`);
    }
    
    const data = response.data.now;
    
    // Preparar dados para inserção
    const fearGreedData = {
      fear_greed_value: data.value || null,
      fear_greed_classification: data.value_classification || null,
      api_timestamp: data.update_time ? new Date(data.update_time) : null,
      source: 'coinstats_v2',
      timestamp: new Date()
    };
    
    console.log('📊 Dados coletados:');
    console.log(`  📊 Valor: ${fearGreedData.fear_greed_value || 'N/A'}`);
    console.log(`  🏷️ Classificação: ${fearGreedData.fear_greed_classification || 'N/A'}`);
    console.log(`  📅 API Timestamp: ${fearGreedData.api_timestamp?.toLocaleString('pt-BR') || 'N/A'}`);
    
    // Salvar no banco de dados
    const query = `
      INSERT INTO fear_greed_index (
        fear_greed_value, fear_greed_classification, 
        api_timestamp, source, timestamp
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id, created_at
    `;
    
    const values = [
      fearGreedData.fear_greed_value,
      fearGreedData.fear_greed_classification,
      fearGreedData.api_timestamp,
      fearGreedData.source,
      fearGreedData.timestamp
    ];
    
    const result = await pool.query(query, values);
    
    console.log(`✅ Dados salvos no banco - ID: ${result.rows[0].id}`);
    console.log(`📅 Timestamp: ${result.rows[0].created_at.toLocaleString('pt-BR')}`);
    
    return {
      success: true,
      id: result.rows[0].id,
      data: fearGreedData
    };
    
  } catch (error) {
    console.error(`❌ Erro ao coletar Fear & Greed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// ================================================
// FUNÇÃO 3: COLETAR E SALVAR DOMINÂNCIA BTC
// ================================================

async function collectAndSaveBtcDominance() {
  console.log('🟡 COLETANDO DOMINÂNCIA DO BITCOIN...');
  
  try {
    const response = await makeRequest(CONFIG.endpoints.dominance);
    
    if (!response.success || !response.data?.data || !Array.isArray(response.data.data)) {
      throw new Error(`API error: ${response.statusCode}`);
    }
    
    const dominanceArray = response.data.data;
    const latestData = dominanceArray[dominanceArray.length - 1];
    
    if (!latestData || !Array.isArray(latestData) || latestData.length < 2) {
      throw new Error('Invalid dominance data format');
    }
    
    // Preparar dados para inserção
    const dominanceData = {
      dominance_percentage: latestData[1] || null,
      api_timestamp: new Date(latestData[0] * 1000), // Convert Unix timestamp
      source: 'coinstats_v2',
      timestamp: new Date()
    };
    
    console.log('📊 Dados coletados:');
    console.log(`  🟡 Dominância: ${dominanceData.dominance_percentage || 'N/A'}%`);
    console.log(`  📅 API Timestamp: ${dominanceData.api_timestamp.toLocaleString('pt-BR')}`);
    console.log(`  📈 Total de pontos históricos: ${dominanceArray.length}`);
    
    // Salvar no banco de dados
    const query = `
      INSERT INTO btc_dominance (
        dominance_percentage, api_timestamp, source, timestamp
      ) VALUES ($1, $2, $3, $4)
      RETURNING id, created_at
    `;
    
    const values = [
      dominanceData.dominance_percentage,
      dominanceData.api_timestamp,
      dominanceData.source,
      dominanceData.timestamp
    ];
    
    const result = await pool.query(query, values);
    
    console.log(`✅ Dados salvos no banco - ID: ${result.rows[0].id}`);
    console.log(`📅 Timestamp: ${result.rows[0].created_at.toLocaleString('pt-BR')}`);
    
    return {
      success: true,
      id: result.rows[0].id,
      data: dominanceData
    };
    
  } catch (error) {
    console.error(`❌ Erro ao coletar dominância BTC: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// ================================================
// FUNÇÃO PARA CRIAR TABELAS (SE NÃO EXISTIREM)
// ================================================

async function createTables() {
  console.log('🗄️ VERIFICANDO/CRIANDO TABELAS...');
  
  const queries = [
    // Tabela market_data
    `
    CREATE TABLE IF NOT EXISTS market_data (
      id SERIAL PRIMARY KEY,
      market_cap BIGINT,
      volume_24h BIGINT,
      btc_dominance DECIMAL(5,2),
      market_cap_change DECIMAL(10,4),
      volume_change DECIMAL(10,4),
      btc_dominance_change DECIMAL(10,4),
      source VARCHAR(50),
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `,
    
    // Tabela fear_greed_index
    `
    CREATE TABLE IF NOT EXISTS fear_greed_index (
      id SERIAL PRIMARY KEY,
      fear_greed_value INTEGER CHECK (fear_greed_value >= 0 AND fear_greed_value <= 100),
      fear_greed_classification VARCHAR(50),
      api_timestamp TIMESTAMP,
      source VARCHAR(50),
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `,
    
    // Tabela btc_dominance
    `
    CREATE TABLE IF NOT EXISTS btc_dominance (
      id SERIAL PRIMARY KEY,
      dominance_percentage DECIMAL(5,2),
      api_timestamp TIMESTAMP,
      source VARCHAR(50),
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `
  ];
  
  try {
    for (const query of queries) {
      await pool.query(query);
    }
    console.log('✅ Todas as tabelas foram verificadas/criadas');
    
  } catch (error) {
    console.error(`❌ Erro ao criar tabelas: ${error.message}`);
    throw error;
  }
}

// ================================================
// FUNÇÃO PARA VERIFICAR DADOS RECENTES
// ================================================

async function checkRecentData() {
  console.log('📊 VERIFICANDO DADOS RECENTES NO BANCO...');
  
  try {
    // Verificar market_data
    const marketQuery = `
      SELECT COUNT(*) as count, MAX(created_at) as latest
      FROM market_data 
      WHERE created_at >= NOW() - INTERVAL '1 hour'
    `;
    const marketResult = await pool.query(marketQuery);
    
    console.log(`📈 Market Data (última hora): ${marketResult.rows[0].count} registros`);
    if (marketResult.rows[0].latest) {
      console.log(`   Último: ${new Date(marketResult.rows[0].latest).toLocaleString('pt-BR')}`);
    }
    
    // Verificar fear_greed_index
    const fearQuery = `
      SELECT COUNT(*) as count, MAX(created_at) as latest
      FROM fear_greed_index 
      WHERE created_at >= NOW() - INTERVAL '1 hour'
    `;
    const fearResult = await pool.query(fearQuery);
    
    console.log(`😰 Fear & Greed (última hora): ${fearResult.rows[0].count} registros`);
    if (fearResult.rows[0].latest) {
      console.log(`   Último: ${new Date(fearResult.rows[0].latest).toLocaleString('pt-BR')}`);
    }
    
    // Verificar btc_dominance
    const dominanceQuery = `
      SELECT COUNT(*) as count, MAX(created_at) as latest
      FROM btc_dominance 
      WHERE created_at >= NOW() - INTERVAL '1 hour'
    `;
    const dominanceResult = await pool.query(dominanceQuery);
    
    console.log(`🟡 BTC Dominance (última hora): ${dominanceResult.rows[0].count} registros`);
    if (dominanceResult.rows[0].latest) {
      console.log(`   Último: ${new Date(dominanceResult.rows[0].latest).toLocaleString('pt-BR')}`);
    }
    
  } catch (error) {
    console.error(`❌ Erro ao verificar dados: ${error.message}`);
  }
}

// ================================================
// FUNÇÃO PRINCIPAL - COLETA COMPLETA
// ================================================

async function runFullCollection() {
  console.log('🚀 INICIANDO COLETA COMPLETA DOS DADOS COINSTATS...\n');
  
  try {
    // Criar tabelas se não existirem
    await createTables();
    console.log('');
    
    // Verificar dados recentes
    await checkRecentData();
    console.log('');
    
    // Executar coleta dos 3 endpoints
    console.log('📡 INICIANDO COLETA DOS 3 ENDPOINTS:');
    console.log('===================================');
    
    const results = await Promise.allSettled([
      collectAndSaveMarketData(),
      collectAndSaveFearGreed(),
      collectAndSaveBtcDominance()
    ]);
    
    console.log('');
    console.log('📊 RELATÓRIO DE COLETA:');
    console.log('=======================');
    
    results.forEach((result, index) => {
      const endpoints = ['Market Data', 'Fear & Greed', 'BTC Dominance'];
      
      if (result.status === 'fulfilled' && result.value.success) {
        console.log(`✅ ${endpoints[index]}: Sucesso (ID: ${result.value.id})`);
      } else {
        const error = result.status === 'rejected' 
          ? result.reason.message 
          : result.value.error;
        console.log(`❌ ${endpoints[index]}: Erro - ${error}`);
      }
    });
    
    console.log('');
    console.log('🔧 PRÓXIMOS PASSOS:');
    console.log('  1. Configurar cron job para execução automática (a cada 15-30 min)');
    console.log('  2. Implementar alertas baseados nos dados coletados');
    console.log('  3. Criar dashboard para visualização dos dados');
    console.log('  4. Integrar com sistema de sinais de trading');
    console.log('');
    
  } catch (error) {
    console.error('❌ Erro na coleta completa:', error);
  } finally {
    // Fechar conexão com banco
    await pool.end();
  }
}

// ================================================
// FUNÇÃO PARA EXECUTAR APENAS UMA COLETA
// ================================================

async function runSingleCollection(type) {
  const collectors = {
    market: collectAndSaveMarketData,
    fear: collectAndSaveFearGreed,
    dominance: collectAndSaveBtcDominance
  };
  
  if (!collectors[type]) {
    console.error(`❌ Tipo inválido: ${type}. Use: market, fear, ou dominance`);
    return;
  }
  
  try {
    await createTables();
    const result = await collectors[type]();
    
    if (result.success) {
      console.log(`✅ Coleta ${type} concluída com sucesso!`);
    } else {
      console.log(`❌ Erro na coleta ${type}: ${result.error}`);
    }
    
  } catch (error) {
    console.error(`❌ Erro: ${error.message}`);
  } finally {
    await pool.end();
  }
}

// Verificar argumentos da linha de comando
const args = process.argv.slice(2);

if (args.length > 0) {
  const action = args[0];
  
  if (['market', 'fear', 'dominance'].includes(action)) {
    runSingleCollection(action);
  } else if (action === 'check') {
    createTables().then(() => checkRecentData()).then(() => pool.end());
  } else {
    console.log('❌ Uso: node coinstats-integration.js [market|fear|dominance|check]');
    console.log('   Sem parâmetros: executa coleta completa');
  }
} else {
  // Executar coleta completa se for o arquivo principal sem argumentos
  if (require.main === module) {
    runFullCollection();
  }
}

module.exports = {
  collectAndSaveMarketData,
  collectAndSaveFearGreed,
  collectAndSaveBtcDominance,
  createTables,
  checkRecentData,
  runFullCollection
};
