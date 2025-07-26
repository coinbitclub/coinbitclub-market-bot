// VERIFICAÇÃO COMPLETA DE CHAVES E APIS - PRODUÇÃO
// ================================================

const https = require('https');
const http = require('http');

console.log('🔍 VERIFICAÇÃO COMPLETA DE CHAVES E APIS');
console.log('=========================================');
console.log('Data:', new Date().toLocaleString('pt-BR'));
console.log('');

// ================================================
// FUNÇÃO PARA FAZER REQUESTS HTTP
// ================================================

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// ================================================
// VERIFICAÇÃO DAS VARIÁVEIS DE AMBIENTE
// ================================================

function checkEnvironmentVariables() {
  console.log('📋 VARIÁVEIS DE AMBIENTE CONFIGURADAS:');
  console.log('======================================');
  
  const variables = {
    // Segurança
    JWT_SECRET: process.env.JWT_SECRET,
    ADMIN_TOKEN: process.env.ADMIN_TOKEN,
    WEBHOOK_TOKEN: process.env.WEBHOOK_TOKEN,
    
    // Banco de dados
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_SSL: process.env.DATABASE_SSL,
    
    // Stripe
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    
    // OpenAI
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    USE_REAL_AI: process.env.USE_REAL_AI,
    
    // Trading APIs
    COINSTATS_API_KEY: process.env.COINSTATS_API_KEY,
    BINANCE_API_BASE: process.env.BINANCE_API_BASE,
    BYBIT_BASE_URL_REAL: process.env.BYBIT_BASE_URL_REAL,
    
    // WhatsApp
    ZAPI_INSTANCE: process.env.ZAPI_INSTANCE,
    ZAPI_TOKEN: process.env.ZAPI_TOKEN,
    
    // Frontend
    REACT_APP_API_URL: process.env.REACT_APP_API_URL,
    FRONTEND_URL: process.env.FRONTEND_URL,
    
    // Admin
    DASHBOARD_USER: process.env.DASHBOARD_USER,
    DASHBOARD_PASS: process.env.DASHBOARD_PASS
  };
  
  let configured = 0;
  let total = 0;
  
  for (const [key, value] of Object.entries(variables)) {
    total++;
    if (value) {
      configured++;
      const masked = key.includes('SECRET') || key.includes('KEY') || key.includes('TOKEN') || key.includes('PASS') 
        ? value.substring(0, 10) + '***' 
        : value;
      console.log(`  ✅ ${key}: ${masked}`);
    } else {
      console.log(`  ❌ ${key}: NÃO CONFIGURADA`);
    }
  }
  
  console.log(`\n📊 Total: ${configured}/${total} (${Math.round(configured/total*100)}%)`);
  console.log('');
  
  return { configured, total, variables };
}

// ================================================
// VERIFICAÇÃO DA API STRIPE
// ================================================

async function checkStripeAPI() {
  console.log('💳 VERIFICAÇÃO DA API STRIPE:');
  console.log('=============================');
  
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  
  if (!stripeKey) {
    console.log('❌ STRIPE_SECRET_KEY não configurada');
    return false;
  }
  
  try {
    const isLive = stripeKey.startsWith('sk_live_');
    const isTest = stripeKey.startsWith('sk_test_');
    
    console.log(`🔑 Tipo de chave: ${isLive ? 'PRODUÇÃO (sk_live_)' : isTest ? 'TESTE (sk_test_)' : 'FORMATO INVÁLIDO'}`);
    
    if (isLive) {
      console.log('✅ Chave de PRODUÇÃO detectada');
    } else if (isTest) {
      console.log('⚠️ Chave de TESTE detectada - Verifique se é intencional');
    } else {
      console.log('❌ Formato de chave inválido');
      return false;
    }
    
    // Verificar se a chave é válida fazendo uma requisição para a API
    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/json'
      }
    };
    
    console.log('🧪 Testando conectividade com Stripe...');
    const response = await makeRequest('https://api.stripe.com/v1/account', options);
    
    if (response.statusCode === 200) {
      console.log('✅ Conexão com Stripe: OK');
      const account = JSON.parse(response.data);
      console.log(`📧 Conta: ${account.email || 'N/A'}`);
      console.log(`🏪 Business: ${account.business_profile?.name || 'N/A'}`);
      return true;
    } else {
      console.log(`❌ Erro na API Stripe: ${response.statusCode}`);
      console.log(`📄 Resposta: ${response.data}`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Erro ao verificar Stripe: ${error.message}`);
    return false;
  }
}

// ================================================
// VERIFICAÇÃO DA API OPENAI
// ================================================

async function checkOpenAIAPI() {
  console.log('🤖 VERIFICAÇÃO DA API OPENAI:');
  console.log('=============================');
  
  const openaiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiKey) {
    console.log('❌ OPENAI_API_KEY não configurada');
    return false;
  }
  
  try {
    const isServiceAccount = openaiKey.startsWith('sk-svcacct-');
    const isProject = openaiKey.startsWith('sk-proj-');
    const isUser = openaiKey.startsWith('sk-');
    
    console.log(`🔑 Tipo de chave: ${isServiceAccount ? 'SERVICE ACCOUNT' : isProject ? 'PROJECT' : isUser ? 'USER' : 'FORMATO INVÁLIDO'}`);
    
    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      }
    };
    
    console.log('🧪 Testando conectividade com OpenAI...');
    const response = await makeRequest('https://api.openai.com/v1/models', options);
    
    if (response.statusCode === 200) {
      console.log('✅ Conexão com OpenAI: OK');
      const models = JSON.parse(response.data);
      console.log(`📊 Modelos disponíveis: ${models.data.length}`);
      
      // Verificar se GPT-4 está disponível
      const hasGPT4 = models.data.some(model => model.id.includes('gpt-4'));
      console.log(`🧠 GPT-4 disponível: ${hasGPT4 ? 'SIM' : 'NÃO'}`);
      
      return true;
    } else {
      console.log(`❌ Erro na API OpenAI: ${response.statusCode}`);
      console.log(`📄 Resposta: ${response.data}`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Erro ao verificar OpenAI: ${error.message}`);
    return false;
  }
}

// ================================================
// VERIFICAÇÃO DAS APIS DE TRADING
// ================================================

async function checkTradingAPIs() {
  console.log('📊 VERIFICAÇÃO DAS APIS DE TRADING:');
  console.log('===================================');
  
  // Verificar Binance
  console.log('🟡 BINANCE:');
  try {
    const binanceUrl = process.env.BINANCE_API_BASE || 'https://api.binance.com';
    const response = await makeRequest(`${binanceUrl}/api/v3/ping`);
    
    if (response.statusCode === 200) {
      console.log('  ✅ Binance API: Conectando normalmente');
    } else {
      console.log(`  ❌ Binance API: Erro ${response.statusCode}`);
    }
  } catch (error) {
    console.log(`  ❌ Binance API: ${error.message}`);
  }
  
  // Verificar Bybit
  console.log('🟣 BYBIT:');
  try {
    const bybitUrl = process.env.BYBIT_BASE_URL_REAL || 'https://api.bybit.com';
    const response = await makeRequest(`${bybitUrl}/v5/market/time`);
    
    if (response.statusCode === 200) {
      console.log('  ✅ Bybit API: Conectando normalmente');
    } else {
      console.log(`  ❌ Bybit API: Erro ${response.statusCode}`);
    }
  } catch (error) {
    console.log(`  ❌ Bybit API: ${error.message}`);
  }
  
  // Verificar CoinStats (se tiver chave)
  const coinstatsKey = process.env.COINSTATS_API_KEY;
  if (coinstatsKey) {
    console.log('📈 COINSTATS:');
    try {
      const options = {
        method: 'GET',
        headers: {
          'X-API-KEY': coinstatsKey
        }
      };
      
      const response = await makeRequest('https://api.coinstats.app/public/v1/coins', options);
      
      if (response.statusCode === 200) {
        console.log('  ✅ CoinStats API: Chave válida');
      } else {
        console.log(`  ❌ CoinStats API: Erro ${response.statusCode}`);
      }
    } catch (error) {
      console.log(`  ❌ CoinStats API: ${error.message}`);
    }
  } else {
    console.log('📈 COINSTATS: Chave não configurada');
  }
}

// ================================================
// VERIFICAÇÃO DO WHATSAPP (ZAPI)
// ================================================

async function checkWhatsAppAPI() {
  console.log('📱 VERIFICAÇÃO DO WHATSAPP (ZAPI):');
  console.log('==================================');
  
  const instance = process.env.ZAPI_INSTANCE;
  const token = process.env.ZAPI_TOKEN;
  
  if (!instance || !token) {
    console.log('❌ ZAPI_INSTANCE ou ZAPI_TOKEN não configuradas');
    return false;
  }
  
  try {
    console.log(`📱 Instância: ${instance}`);
    console.log('🧪 Testando conectividade com Zapi...');
    
    const options = {
      method: 'GET',
      headers: {
        'Client-Token': token
      }
    };
    
    const response = await makeRequest(`https://api.z-api.io/instances/${instance}/token/status`, options);
    
    if (response.statusCode === 200) {
      console.log('✅ Zapi API: Conectando normalmente');
      const status = JSON.parse(response.data);
      console.log(`📊 Status: ${status.connected ? 'CONECTADO' : 'DESCONECTADO'}`);
      return true;
    } else {
      console.log(`❌ Zapi API: Erro ${response.statusCode}`);
      console.log(`📄 Resposta: ${response.data}`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Erro ao verificar Zapi: ${error.message}`);
    return false;
  }
}

// ================================================
// VERIFICAÇÃO DO BANCO DE DADOS
// ================================================

async function checkDatabase() {
  console.log('🗄️ VERIFICAÇÃO DO BANCO DE DADOS:');
  console.log('=================================');
  
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.log('❌ DATABASE_URL não configurada');
    return false;
  }
  
  try {
    const { Pool } = require('pg');
    
    console.log('🔗 Conectando ao PostgreSQL...');
    const pool = new Pool({
      connectionString: dbUrl,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
    });
    
    const client = await pool.connect();
    
    // Verificar versão do PostgreSQL
    const versionResult = await client.query('SELECT version()');
    console.log(`✅ PostgreSQL: ${versionResult.rows[0].version.split(' ')[1]}`);
    
    // Contar tabelas
    const tablesResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log(`📊 Tabelas: ${tablesResult.rows[0].count}`);
    
    // Verificar algumas tabelas importantes
    const importantTables = ['users', 'trading_signals', 'payments', 'subscriptions'];
    for (const table of importantTables) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`  📋 ${table}: ${result.rows[0].count} registros`);
      } catch (error) {
        console.log(`  ❌ ${table}: Tabela não encontrada`);
      }
    }
    
    client.release();
    await pool.end();
    
    return true;
    
  } catch (error) {
    console.log(`❌ Erro no banco de dados: ${error.message}`);
    return false;
  }
}

// ================================================
// FUNÇÃO PRINCIPAL
// ================================================

async function runAllChecks() {
  console.log('🚀 INICIANDO VERIFICAÇÃO COMPLETA...\n');
  
  const results = {
    environment: checkEnvironmentVariables(),
    stripe: false,
    openai: false,
    trading: false,
    whatsapp: false,
    database: false
  };
  
  console.log('');
  
  // Verificar APIs apenas se as chaves estão configuradas
  if (results.environment.variables.STRIPE_SECRET_KEY) {
    results.stripe = await checkStripeAPI();
    console.log('');
  }
  
  if (results.environment.variables.OPENAI_API_KEY) {
    results.openai = await checkOpenAIAPI();
    console.log('');
  }
  
  await checkTradingAPIs();
  console.log('');
  
  if (results.environment.variables.ZAPI_INSTANCE && results.environment.variables.ZAPI_TOKEN) {
    results.whatsapp = await checkWhatsAppAPI();
    console.log('');
  }
  
  if (results.environment.variables.DATABASE_URL) {
    results.database = await checkDatabase();
    console.log('');
  }
  
  // Relatório final
  console.log('📊 RELATÓRIO FINAL:');
  console.log('==================');
  console.log(`✅ Variáveis: ${results.environment.configured}/${results.environment.total}`);
  console.log(`💳 Stripe: ${results.stripe ? 'OK' : 'ERRO'}`);
  console.log(`🤖 OpenAI: ${results.openai ? 'OK' : 'ERRO'}`);
  console.log(`📱 WhatsApp: ${results.whatsapp ? 'OK' : 'ERRO'}`);
  console.log(`🗄️ Banco: ${results.database ? 'OK' : 'ERRO'}`);
  
  const allGood = results.stripe && results.openai && results.whatsapp && results.database;
  
  console.log('');
  if (allGood) {
    console.log('🎉 TODAS AS CHAVES ESTÃO CORRETAS E FUNCIONAIS!');
    console.log('✅ Sistema pronto para produção');
  } else {
    console.log('⚠️ Algumas verificações falharam');
    console.log('🔧 Verifique as chaves e configurações acima');
  }
  
  return results;
}

// Executar se for o arquivo principal
if (require.main === module) {
  runAllChecks().catch(console.error);
}

module.exports = { runAllChecks };
