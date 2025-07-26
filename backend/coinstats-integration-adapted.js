// INTEGRAÇÃO COINSTATS - ADAPTADA ÀS TABELAS EXISTENTES
// =====================================================

require('dotenv').config();
const { Pool } = require('pg');
const https = require('https');

console.log('💾 INTEGRAÇÃO COINSTATS - ADAPTADA ÀS TABELAS EXISTENTES');
console.log('========================================================');
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
    
    console.log('📊 Dados coletados:');
    console.log(`  💰 Market Cap: $${data.marketCap?.toLocaleString() || 'N/A'}`);
    console.log(`  📊 Volume 24h: $${data.volume?.toLocaleString() || 'N/A'}`);
    console.log(`  🟡 BTC Dominance: ${data.btcDominance || 'N/A'}%`);
    console.log(`  📈 Market Cap Change: ${data.marketCapChange || 'N/A'}%`);
    console.log(`  📊 Volume Change: ${data.volumeChange || 'N/A'}%`);
    
    // Adaptar à estrutura da tabela market_data existente
    const query = `
      INSERT INTO market_data (
        source, symbol, price, volume, market_cap, 
        price_change_24h, data, timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `;
    
    const values = [
      'COINSTATS_MARKETS',
      'GLOBAL',
      data.btcDominance || null,  // Usando btcDominance como "price"
      data.volume || null,
      data.marketCap || null,
      data.marketCapChange || null,
      JSON.stringify(data),  // Dados completos em JSONB
      new Date()
    ];
    
    const result = await pool.query(query, values);
    
    console.log(`✅ Dados salvos no banco - ID: ${result.rows[0].id}`);
    
    return {
      success: true,
      id: result.rows[0].id,
      data: data
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
    
    const currentData = response.data.now;
    const yesterdayData = response.data.yesterday;
    
    console.log('📊 Dados coletados:');
    console.log(`  📊 Valor: ${currentData.value || 'N/A'}`);
    console.log(`  🏷️ Classificação: ${currentData.value_classification || 'N/A'}`);
    console.log(`  📅 API Timestamp: ${currentData.update_time ? new Date(currentData.update_time).toLocaleString('pt-BR') : 'N/A'}`);
    
    // Calcular classificação em português
    const getClassificacaoPt = (classification) => {
      const map = {
        'Extreme Fear': 'Medo Extremo',
        'Fear': 'Medo',
        'Neutral': 'Neutro',
        'Greed': 'Ganância',
        'Extreme Greed': 'Ganância Extrema'
      };
      return map[classification] || classification;
    };
    
    // Adaptar à estrutura da tabela fear_greed_index existente
    const query = `
      INSERT INTO fear_greed_index (
        id, timestamp_data, value, classification, classificacao_pt,
        value_previous, change_24h, source, raw_payload, created_at, updated_at
      ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING id
    `;
    
    const timestampData = currentData.update_time ? new Date(currentData.update_time) : new Date();
    const change24h = yesterdayData ? (currentData.value - yesterdayData.value) : null;
    
    const values = [
      timestampData,
      currentData.value || null,
      currentData.value_classification || 'Unknown',
      getClassificacaoPt(currentData.value_classification),
      yesterdayData?.value || null,
      change24h,
      'COINSTATS',
      JSON.stringify(response.data)
    ];
    
    const result = await pool.query(query, values);
    
    console.log(`✅ Dados salvos no banco - ID: ${result.rows[0].id}`);
    
    return {
      success: true,
      id: result.rows[0].id,
      data: currentData
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
    
    const dominanceValue = latestData[1];
    const timestamp = new Date(latestData[0] * 1000);
    
    console.log('📊 Dados coletados:');
    console.log(`  🟡 Dominância: ${dominanceValue || 'N/A'}%`);
    console.log(`  📅 API Timestamp: ${timestamp.toLocaleString('pt-BR')}`);
    console.log(`  📈 Total de pontos históricos: ${dominanceArray.length}`);
    
    // Calcular EMA simples (usando últimos 7 pontos como aproximação)
    const last7Points = dominanceArray.slice(-7);
    const ema7 = last7Points.reduce((sum, point) => sum + point[1], 0) / last7Points.length;
    const diffPct = ((dominanceValue - ema7) / ema7) * 100;
    
    // Determinar sinal baseado na diferença
    let sinal = 'NEUTRO';
    if (diffPct > 0.5) sinal = 'LONG';
    else if (diffPct < -0.5) sinal = 'SHORT';
    
    console.log(`  📊 EMA7: ${ema7.toFixed(2)}%`);
    console.log(`  📈 Diferença: ${diffPct.toFixed(2)}%`);
    console.log(`  🎯 Sinal: ${sinal}`);
    
    // Adaptar à estrutura da tabela btc_dominance existente
    const query = `
      INSERT INTO btc_dominance (
        id, timestamp_data, btc_dominance_value, ema_7, diff_pct,
        sinal, source, raw_payload, created_at, updated_at
      ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING id
    `;
    
    const values = [
      timestamp,
      dominanceValue,
      ema7,
      diffPct,
      sinal,
      'COINSTATS',
      JSON.stringify({ data: [latestData] })
    ];
    
    const result = await pool.query(query, values);
    
    console.log(`✅ Dados salvos no banco - ID: ${result.rows[0].id}`);
    
    return {
      success: true,
      id: result.rows[0].id,
      data: {
        dominance: dominanceValue,
        ema7,
        diffPct,
        sinal,
        timestamp
      }
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
// FUNÇÃO PARA VERIFICAR DADOS RECENTES
// ================================================

async function checkRecentData() {
  console.log('📊 VERIFICANDO DADOS RECENTES NO BANCO...');
  
  try {
    // Verificar market_data
    const marketQuery = `
      SELECT COUNT(*) as count, MAX(timestamp) as latest
      FROM market_data 
      WHERE timestamp >= NOW() - INTERVAL '1 hour'
      AND source = 'COINSTATS_MARKETS'
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
      AND source = 'COINSTATS'
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
      AND source = 'COINSTATS'
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
    const result = await collectors[type]();
    
    if (result.success) {
      console.log(`✅ Coleta ${type} concluída com sucesso! ID: ${result.id}`);
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
    checkRecentData().then(() => pool.end());
  } else {
    console.log('❌ Uso: node coinstats-integration-adapted.js [market|fear|dominance|check]');
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
  checkRecentData,
  runFullCollection
};
