// SCRIPT DE TESTE DE API KEYS BYBIT - v1.0.0
console.log('🔍 INICIANDO TESTE DE CONECTIVIDADE DAS API KEYS...');

const { Pool } = require('pg');
const ccxt = require('ccxt');

// Configuração do banco
const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
  ssl: { rejectUnauthorized: false }
});

async function testAllApiKeys() {
  try {
    console.log('📊 Buscando contas MAINNET para teste...');
    
    const query = `
      SELECT u.email, uea.account_name, uea.api_key, uea.api_secret, uea.is_testnet
      FROM users u 
      JOIN user_exchange_accounts uea ON u.id = uea.user_id
      WHERE uea.is_active = true 
        AND uea.can_trade = true 
        AND uea.is_testnet = false
      ORDER BY u.email
    `;
    
    const result = await pool.query(query);
    const accounts = result.rows;
    
    console.log(`🔑 Encontradas ${accounts.length} contas para teste`);
    
    for (const account of accounts) {
      console.log(`\n🔄 Testando: ${account.email} (${account.account_name})`);
      console.log(`🔑 API Key: ${account.api_key.substring(0, 8)}...`);
      console.log(`🔐 Secret: ${account.api_secret.substring(0, 8)}...`);
      
      await testSingleApiKey(account);
    }
    
    console.log('\n✅ TESTE COMPLETO!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await pool.end();
  }
}

async function testSingleApiKey(account) {
  let exchange = null;
  
  try {
    // Detectar se é API key de teste
    const isTestKey = account.api_key.length < 10 || 
                      account.api_key.startsWith('test_') ||
                      account.api_key.startsWith('demo_');
    
    if (isTestKey) {
      console.log('🎭 API Key de TESTE detectada - pulando');
      return;
    }
    
    // Criar exchange
    exchange = new ccxt.bybit({
      apiKey: account.api_key,
      secret: account.api_secret,
      sandbox: account.is_testnet,
      enableRateLimit: true,
      timeout: 30000,
      options: {
        defaultType: 'linear',
        hedgeMode: true
      }
    });
    
    console.log('🔗 Testando conectividade...');
    
    // Teste 1: Carregar mercados
    await exchange.loadMarkets();
    console.log('✅ Conectividade: OK');
    
    // Teste 2: Verificar saldo
    console.log('💰 Verificando saldo...');
    const balance = await exchange.fetchBalance();
    const usdtBalance = balance['USDT'] || { free: 0, total: 0 };
    console.log(`💰 Saldo USDT: $${usdtBalance.free?.toFixed(2) || '0.00'} (Total: $${usdtBalance.total?.toFixed(2) || '0.00'})`);
    
    // Teste 3: Verificar posições abertas
    console.log('📊 Verificando posições...');
    const positions = await exchange.fetchPositions();
    const openPositions = positions.filter(pos => pos.contracts > 0);
    console.log(`📊 Posições abertas: ${openPositions.length}`);
    
    if (openPositions.length > 0) {
      openPositions.forEach(pos => {
        console.log(`  - ${pos.symbol}: ${pos.side} ${pos.contracts} @ $${pos.markPrice?.toFixed(4) || 'N/A'}`);
      });
    }
    
    // Teste 4: Verificar configuração da conta
    console.log('⚙️ Verificando configurações...');
    const accountInfo = await exchange.fetchStatus();
    console.log('⚙️ Status da conta:', accountInfo.status);
    
    console.log('✅ TODOS OS TESTES PASSARAM!');
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
    
    // Analisar tipo de erro
    if (error.message.includes('10003')) {
      console.error('🔑 ERRO: API key inválida ou expirada');
    } else if (error.message.includes('10001')) {
      console.error('⚙️ ERRO: Configuração de posição incompatível');
    } else if (error.message.includes('timeout')) {
      console.error('⏱️ ERRO: Timeout na conexão');
    } else {
      console.error('❓ ERRO DESCONHECIDO:', error.code || 'NO_CODE');
    }
    
  } finally {
    if (exchange) {
      await exchange.close();
    }
  }
}

// Executar teste
testAllApiKeys().catch(console.error);
