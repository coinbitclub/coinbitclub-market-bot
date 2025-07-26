// VERIFICAÇÃO COMPLETA DE WEBHOOKS TRADINGVIEW E COINSTATS
// ========================================================

const https = require('https');
const http = require('http');

console.log('📡 VERIFICAÇÃO DE WEBHOOKS TRADINGVIEW E COINSTATS');
console.log('==================================================');
console.log('Data:', new Date().toLocaleString('pt-BR'));
console.log('');

// ================================================
// CONFIGURAÇÕES
// ================================================

const CONFIG = {
  // URLs do TradingView (conforme informado)
  tradingViewUrls: {
    signal: 'https://coinbitclub-market-bot-production.up.railway.app/webhook/signal?token=210406',
    dominance: 'https://coinbitclub-market-bot-production.up.railway.app/webhook/dominance?token=210406'
  },
  
  // URL atual do Railway
  currentUrl: 'https://coinbitclub-market-bot.up.railway.app',
  
  // Token de autenticação
  webhookToken: '210406',
  
  // Banco de dados
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@postgres.railway.internal:5432/railway',
    ssl: true
  }
};

// ================================================
// FUNÇÃO PARA FAZER REQUESTS HTTP
// ================================================

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TradingView-Webhook-Test',
        ...options.headers
      }
    };

    const req = lib.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          success: res.statusCode >= 200 && res.statusCode < 300
        });
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
// VERIFICAÇÃO DE CONECTIVIDADE
// ================================================

async function checkConnectivity() {
  console.log('🌐 VERIFICAÇÃO DE CONECTIVIDADE:');
  console.log('================================');
  
  const urls = [
    CONFIG.tradingViewUrls.signal.split('/webhook')[0],
    CONFIG.tradingViewUrls.dominance.split('/webhook')[0],
    CONFIG.currentUrl
  ];
  
  const uniqueUrls = [...new Set(urls)];
  
  for (const url of uniqueUrls) {
    try {
      console.log(`🔍 Testando: ${url}`);
      const response = await makeRequest(`${url}/health`);
      
      if (response.success) {
        console.log(`  ✅ ${url}: OK (${response.statusCode})`);
        console.log(`  📄 Resposta: ${response.data.substring(0, 100)}...`);
      } else {
        console.log(`  ❌ ${url}: Erro ${response.statusCode}`);
        console.log(`  📄 Resposta: ${response.data}`);
      }
    } catch (error) {
      console.log(`  ❌ ${url}: ${error.message}`);
    }
  }
  console.log('');
}

// ================================================
// TESTE DOS WEBHOOKS TRADINGVIEW
// ================================================

async function testTradingViewWebhooks() {
  console.log('📊 TESTE DOS WEBHOOKS TRADINGVIEW:');
  console.log('==================================');
  
  const testPayloads = {
    signal: {
      token: CONFIG.webhookToken,
      symbol: "BTCUSDT",
      action: "buy",
      price: 45000,
      volume: 1.5,
      timestamp: new Date().toISOString(),
      strategy: "TEST_STRATEGY",
      timeframe: "1h",
      source: "webhook_test"
    },
    dominance: {
      token: CONFIG.webhookToken,
      btc_dominance: 42.5,
      eth_dominance: 18.3,
      timestamp: new Date().toISOString(),
      trend: "up",
      source: "webhook_test"
    }
  };
  
  // Testar webhook de sinais
  console.log('🎯 Testando webhook de SINAIS:');
  console.log(`URL: ${CONFIG.tradingViewUrls.signal}`);
  
  try {
    const response = await makeRequest(CONFIG.tradingViewUrls.signal, {
      method: 'POST',
      body: testPayloads.signal
    });
    
    console.log(`  Status: ${response.statusCode}`);
    console.log(`  Sucesso: ${response.success ? 'SIM' : 'NÃO'}`);
    console.log(`  Resposta: ${response.data}`);
    
    if (!response.success) {
      console.log('  ⚠️ Tentando URL alternativa...');
      const altUrl = CONFIG.tradingViewUrls.signal.replace('-production', '');
      const altResponse = await makeRequest(altUrl, {
        method: 'POST',
        body: testPayloads.signal
      });
      console.log(`  Alt Status: ${altResponse.statusCode}`);
      console.log(`  Alt Resposta: ${altResponse.data}`);
    }
    
  } catch (error) {
    console.log(`  ❌ Erro: ${error.message}`);
  }
  
  console.log('');
  
  // Testar webhook de dominância
  console.log('📈 Testando webhook de DOMINÂNCIA:');
  console.log(`URL: ${CONFIG.tradingViewUrls.dominance}`);
  
  try {
    const response = await makeRequest(CONFIG.tradingViewUrls.dominance, {
      method: 'POST',
      body: testPayloads.dominance
    });
    
    console.log(`  Status: ${response.statusCode}`);
    console.log(`  Sucesso: ${response.success ? 'SIM' : 'NÃO'}`);
    console.log(`  Resposta: ${response.data}`);
    
    if (!response.success) {
      console.log('  ⚠️ Tentando URL alternativa...');
      const altUrl = CONFIG.tradingViewUrls.dominance.replace('-production', '');
      const altResponse = await makeRequest(altUrl, {
        method: 'POST',
        body: testPayloads.dominance
      });
      console.log(`  Alt Status: ${altResponse.statusCode}`);
      console.log(`  Alt Resposta: ${altResponse.data}`);
    }
    
  } catch (error) {
    console.log(`  ❌ Erro: ${error.message}`);
  }
  
  console.log('');
}

// ================================================
// VERIFICAÇÃO DO BANCO DE DADOS
// ================================================

async function checkDatabaseSignals() {
  console.log('🗄️ VERIFICAÇÃO DOS SINAIS NO BANCO:');
  console.log('===================================');
  
  try {
    const { Pool } = require('pg');
    
    const pool = new Pool({
      connectionString: CONFIG.database.url,
      ssl: CONFIG.database.ssl ? { rejectUnauthorized: false } : false
    });
    
    const client = await pool.connect();
    
    // Verificar tabelas relacionadas a sinais
    const signalTables = [
      'trading_signals',
      'signals',
      'webhook_signals',
      'market_signals',
      'dominance_data',
      'btc_dominance'
    ];
    
    console.log('📋 Verificando tabelas de sinais:');
    
    for (const tableName of signalTables) {
      try {
        const existsQuery = `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )
        `;
        
        const existsResult = await client.query(existsQuery, [tableName]);
        
        if (existsResult.rows[0].exists) {
          const countQuery = `SELECT COUNT(*) FROM ${tableName}`;
          const countResult = await client.query(countQuery);
          
          console.log(`  ✅ ${tableName}: ${countResult.rows[0].count} registros`);
          
          // Verificar registros recentes (últimas 24h)
          try {
            const recentQuery = `
              SELECT COUNT(*) FROM ${tableName} 
              WHERE created_at > NOW() - INTERVAL '24 hours'
              OR updated_at > NOW() - INTERVAL '24 hours'
              OR timestamp > NOW() - INTERVAL '24 hours'
            `;
            const recentResult = await client.query(recentQuery);
            console.log(`    📅 Últimas 24h: ${recentResult.rows[0].count} registros`);
          } catch (err) {
            // Tabela pode não ter colunas de timestamp
            console.log(`    📅 Últimas 24h: não verificável`);
          }
          
          // Mostrar estrutura da tabela
          const structureQuery = `
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = $1 
            ORDER BY ordinal_position
          `;
          const structureResult = await client.query(structureQuery, [tableName]);
          console.log(`    📊 Colunas: ${structureResult.rows.map(r => r.column_name).join(', ')}`);
          
        } else {
          console.log(`  ❌ ${tableName}: Tabela não encontrada`);
        }
      } catch (error) {
        console.log(`  ❌ ${tableName}: Erro - ${error.message}`);
      }
    }
    
    // Verificar logs de webhook (se existir)
    console.log('');
    console.log('📝 Verificando logs de webhook:');
    
    try {
      const logTables = ['webhook_logs', 'api_logs', 'request_logs'];
      
      for (const logTable of logTables) {
        const existsQuery = `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )
        `;
        
        const existsResult = await client.query(existsQuery, [logTable]);
        
        if (existsResult.rows[0].exists) {
          const recentLogsQuery = `
            SELECT * FROM ${logTable} 
            WHERE created_at > NOW() - INTERVAL '1 hour'
            OR timestamp > NOW() - INTERVAL '1 hour'
            ORDER BY created_at DESC, timestamp DESC
            LIMIT 5
          `;
          
          try {
            const logsResult = await client.query(recentLogsQuery);
            console.log(`  📋 ${logTable}: ${logsResult.rows.length} logs recentes`);
            
            logsResult.rows.forEach((log, i) => {
              console.log(`    ${i+1}. ${JSON.stringify(log).substring(0, 100)}...`);
            });
          } catch (err) {
            console.log(`  📋 ${logTable}: Estrutura não compatível`);
          }
        }
      }
    } catch (error) {
      console.log(`  ❌ Erro ao verificar logs: ${error.message}`);
    }
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.log(`❌ Erro no banco de dados: ${error.message}`);
  }
  
  console.log('');
}

// ================================================
// TESTE DE COINSTATS API
// ================================================

async function testCoinStatsAPI() {
  console.log('📈 TESTE DA API COINSTATS:');
  console.log('==========================');
  
  const coinStatsKey = process.env.COINSTATS_API_KEY || 'ZFIxigBcVaCyXDL1Qp/Ork7TOL3+h07NM2f3YoSrMkI=';
  
  if (!coinStatsKey) {
    console.log('❌ COINSTATS_API_KEY não configurada');
    return;
  }
  
  console.log(`🔑 Chave: ${coinStatsKey.substring(0, 20)}...`);
  
  try {
    // Testar endpoint de coins
    console.log('🪙 Testando endpoint de moedas...');
    const coinsResponse = await makeRequest('https://api.coinstats.app/public/v1/coins?limit=10', {
      headers: {
        'X-API-KEY': coinStatsKey
      }
    });
    
    if (coinsResponse.success) {
      const data = JSON.parse(coinsResponse.data);
      console.log(`  ✅ Sucesso: ${data.coins?.length || 0} moedas retornadas`);
      
      if (data.coins && data.coins.length > 0) {
        console.log(`  📊 Primeira moeda: ${data.coins[0].name} (${data.coins[0].symbol})`);
        console.log(`  💰 Preço: $${data.coins[0].price}`);
      }
    } else {
      console.log(`  ❌ Erro: ${coinsResponse.statusCode}`);
      console.log(`  📄 Resposta: ${coinsResponse.data}`);
    }
    
    // Testar endpoint de mercado global
    console.log('🌍 Testando dados globais...');
    const globalResponse = await makeRequest('https://api.coinstats.app/public/v1/global', {
      headers: {
        'X-API-KEY': coinStatsKey
      }
    });
    
    if (globalResponse.success) {
      const globalData = JSON.parse(globalResponse.data);
      console.log(`  ✅ Market Cap Total: $${globalData.totalMarketCap?.toLocaleString() || 'N/A'}`);
      console.log(`  📊 BTC Dominance: ${globalData.bitcoinDominance || 'N/A'}%`);
    } else {
      console.log(`  ❌ Erro global: ${globalResponse.statusCode}`);
    }
    
  } catch (error) {
    console.log(`❌ Erro CoinStats: ${error.message}`);
  }
  
  console.log('');
}

// ================================================
// DIAGNÓSTICO DE DISCREPÂNCIAS
// ================================================

async function diagnoseProblem() {
  console.log('🔍 DIAGNÓSTICO DE PROBLEMAS:');
  console.log('============================');
  
  console.log('📋 URLs configuradas:');
  console.log(`  TradingView Signal: ${CONFIG.tradingViewUrls.signal}`);
  console.log(`  TradingView Dominance: ${CONFIG.tradingViewUrls.dominance}`);
  console.log(`  Railway Atual: ${CONFIG.currentUrl}`);
  console.log('');
  
  // Verificar discrepância de URLs
  const tvDomain = CONFIG.tradingViewUrls.signal.split('/')[2];
  const currentDomain = CONFIG.currentUrl.split('/')[2];
  
  if (tvDomain !== currentDomain) {
    console.log('⚠️ DISCREPÂNCIA DETECTADA:');
    console.log(`  TradingView aponta para: ${tvDomain}`);
    console.log(`  Railway atual está em: ${currentDomain}`);
    console.log('');
    console.log('🔧 SOLUÇÕES POSSÍVEIS:');
    console.log('  1. Atualizar URLs no TradingView para o domínio atual');
    console.log('  2. Verificar se o domínio antigo ainda funciona');
    console.log('  3. Configurar redirecionamento');
    console.log('');
  } else {
    console.log('✅ URLs são consistentes');
    console.log('');
  }
  
  // Verificar token
  console.log(`🔑 Token configurado: ${CONFIG.webhookToken}`);
  console.log('');
}

// ================================================
// FUNÇÃO PRINCIPAL
// ================================================

async function runWebhookCheck() {
  console.log('🚀 INICIANDO VERIFICAÇÃO COMPLETA...\n');
  
  try {
    await diagnoseProblem();
    await checkConnectivity();
    await testTradingViewWebhooks();
    await testCoinStatsAPI();
    await checkDatabaseSignals();
    
    console.log('📊 RELATÓRIO FINAL:');
    console.log('==================');
    console.log('✅ Verificação completa finalizada');
    console.log('📋 Verifique os resultados acima para identificar problemas');
    console.log('');
    console.log('🔧 PRÓXIMOS PASSOS:');
    console.log('  1. Corrigir URLs discrepantes no TradingView');
    console.log('  2. Verificar se sinais estão sendo salvos no banco');
    console.log('  3. Monitorar webhooks em tempo real');
    console.log('');
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error);
  }
}

// Executar se for o arquivo principal
if (require.main === module) {
  runWebhookCheck();
}

module.exports = { runWebhookCheck };
