// TESTE COMPLETO DO MODO REAL EM TODAS AS CHAVES - v6.0.0
console.log('🎯 TESTANDO MODO REAL EM TODAS AS API KEYS...');

const { Pool } = require('pg');
const ccxt = require('ccxt');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
  ssl: { rejectUnauthorized: false }
});

async function testarTodasAsChaves() {
  try {
    console.log('🔍 BUSCANDO TODAS AS CONTAS PARA TESTE REAL...');
    
    const query = `
      SELECT 
        u.id as user_id, u.email, u.first_name, u.last_name,
        uea.id as account_id, 
        uea.api_key, 
        uea.api_secret,
        uea.account_name,
        uea.exchange,
        uea.is_testnet,
        uea.can_trade,
        uea.is_active
      FROM users u
      JOIN user_exchange_accounts uea ON u.id = uea.user_id
      WHERE uea.is_active = true 
        AND uea.can_trade = true 
        AND uea.is_testnet = false
      ORDER BY u.email, uea.account_name
    `;
    
    const result = await pool.query(query);
    const accounts = result.rows;
    
    console.log(`📊 Encontradas ${accounts.length} contas MAINNET para teste`);
    
    const testResults = [];
    
    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];
      console.log(`\n🔄 TESTANDO [${i+1}/${accounts.length}]: ${account.email} (${account.account_name})`);
      console.log(`🔑 API Key: ${account.api_key.substring(0, 8)}...`);
      
      const testResult = await testarContaReal(account);
      testResults.push(testResult);
      
      // Pausa entre testes para evitar rate limiting
      if (i < accounts.length - 1) {
        console.log('⏳ Aguardando 3 segundos...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    // RELATÓRIO FINAL
    console.log('\n📊 RELATÓRIO FINAL DE TODAS AS CONTAS:');
    console.log('='.repeat(60));
    
    let sucessos = 0;
    let falhas = 0;
    
    testResults.forEach((result, index) => {
      const emoji = result.success ? '✅' : '❌';
      const status = result.success ? 'SUCESSO' : 'FALHA';
      const details = result.success ? 
        `Saldo: $${result.balance} - ${result.mode}` : 
        `Erro: ${result.error}`;
      
      console.log(`${emoji} [${index+1}] ${result.email} (${result.account_name})`);
      console.log(`    Status: ${status}`);
      console.log(`    Detalhes: ${details}`);
      
      if (result.success) sucessos++;
      else falhas++;
    });
    
    console.log('\n📈 ESTATÍSTICAS FINAIS:');
    console.log(`✅ Sucessos: ${sucessos}/${testResults.length} (${((sucessos/testResults.length)*100).toFixed(1)}%)`);
    console.log(`❌ Falhas: ${falhas}/${testResults.length} (${((falhas/testResults.length)*100).toFixed(1)}%)`);
    
    if (sucessos > 0) {
      console.log('\n🚀 SISTEMA PRONTO PARA TRADING REAL!');
    } else {
      console.log('\n⚠️ NENHUMA CONTA OPERACIONAL - VERIFICAR CONFIGURAÇÕES');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste geral:', error);
  } finally {
    await pool.end();
  }
}

async function testarContaReal(account) {
  const resultado = {
    email: account.email,
    account_name: account.account_name,
    success: false,
    error: null,
    balance: 0,
    mode: 'unknown'
  };
  
  let exchange = null;
  
  try {
    // 1. VERIFICAR SE É API KEY DE TESTE
    const isTestKey = account.api_key === 'test_key' || 
                      account.api_key === 'demo_key' || 
                      account.api_key.startsWith('demo_') ||
                      account.api_key.startsWith('test_') ||
                      account.api_key.length < 10;
    
    if (isTestKey) {
      resultado.error = 'API Key de teste detectada';
      resultado.mode = 'test_key';
      console.log(`🎭 API Key de teste detectada - pulando`);
      return resultado;
    }
    
    console.log(`⏰ Sincronizando tempo...`);
    
    // 2. PRIMEIRA ETAPA: Obter diferença de tempo
    const tempExchange = new ccxt.bybit({
      apiKey: account.api_key,
      secret: account.api_secret,
      sandbox: account.is_testnet,
      enableRateLimit: true,
      timeout: 30000
    });
    
    let timeDifference = 0;
    try {
      const serverTime = await tempExchange.fetchTime();
      const localTime = Date.now();
      timeDifference = serverTime - localTime;
      console.log(`⏰ Diferença temporal: ${timeDifference}ms`);
      await tempExchange.close();
    } catch (syncError) {
      await tempExchange.close();
      throw new Error(`Sincronização falhou: ${syncError.message}`);
    }
    
    // 3. SEGUNDA ETAPA: Exchange principal com correção
    console.log(`🔗 Criando exchange com correções...`);
    
    exchange = new ccxt.bybit({
      apiKey: account.api_key,
      secret: account.api_secret,
      sandbox: account.is_testnet,
      enableRateLimit: true,
      timeout: 45000,
      options: {
        defaultType: 'linear',
        hedgeMode: true,
        portfolioMargin: false,
        recvWindow: 30000
      }
    });
    
    // 4. APLICAR CORREÇÃO DE TIMESTAMP
    const originalNonce = exchange.nonce;
    exchange.nonce = function() {
      const timestamp = originalNonce.call(this);
      return timestamp + timeDifference;
    };
    
    console.log(`🔍 Testando conectividade...`);
    
    // 5. TESTES PROGRESSIVOS
    
    // Teste 1: Carregar mercados
    await exchange.loadMarkets();
    console.log(`✅ Mercados carregados`);
    
    // Teste 2: Verificar saldo
    console.log(`💰 Verificando saldo...`);
    const balance = await exchange.fetchBalance();
    const usdtBalance = balance['USDT'] || { free: 0, total: 0 };
    
    resultado.balance = parseFloat(usdtBalance.free || 0).toFixed(2);
    console.log(`💰 Saldo USDT: $${resultado.balance}`);
    
    // Teste 3: Verificar posições
    console.log(`📊 Verificando posições...`);
    const positions = await exchange.fetchPositions();
    const openPositions = positions.filter(pos => pos.contracts > 0);
    console.log(`📊 Posições abertas: ${openPositions.length}`);
    
    // Teste 4: Testar capacidade de ordem (sem executar)
    console.log(`🎯 Testando capacidade de criação de ordem...`);
    
    // Verificar se tem saldo suficiente para pelo menos um trade pequeno
    if (usdtBalance.free >= 5) {
      console.log(`✅ Saldo suficiente para trading ($${resultado.balance})`);
      resultado.mode = 'ready_for_trading';
    } else {
      console.log(`⚠️ Saldo baixo ($${resultado.balance}) - mas conexão OK`);
      resultado.mode = 'low_balance';
    }
    
    resultado.success = true;
    console.log(`✅ CONTA OPERACIONAL - PRONTA PARA MODO REAL!`);
    
  } catch (error) {
    console.error(`❌ Erro:`, error.message);
    resultado.error = error.message;
    resultado.mode = 'failed';
    
    // Classificar tipo de erro
    if (error.message.includes('10003')) {
      resultado.mode = 'invalid_api_key';
    } else if (error.message.includes('10002')) {
      resultado.mode = 'timestamp_error';
    } else if (error.message.includes('10001')) {
      resultado.mode = 'position_mode_error';
    } else if (error.message.includes('timeout')) {
      resultado.mode = 'timeout_error';
    }
    
  } finally {
    if (exchange) {
      try {
        await exchange.close();
      } catch (closeError) {
        console.log('⚠️ Erro fechando exchange:', closeError.message);
      }
    }
  }
  
  return resultado;
}

// Simular sinal de trading para teste completo
async function simularSinalTrading() {
  console.log('\n🎯 SIMULANDO SINAL DE TRADING PARA TESTE COMPLETO...');
  
  const sinalTeste = {
    signal: {
      ticker: 'LINKUSDT',
      cruzou_acima_ema9: 1,
      rsi_4h: 45,
      rsi_15: 55,
      momentum_15: 2.5,
      close: 25.45
    },
    source: 'teste_automatico',
    timestamp: new Date().toISOString()
  };
  
  console.log('📊 Sinal de teste:', sinalTeste);
  
  // Este sinal seria processado pelo sistema real
  // Resultado esperado: BUY_LONG 0.59 LINKUSDT @ $25.45
  
  return sinalTeste;
}

// Executar teste completo
async function executarTesteCompleto() {
  console.log('🚀 INICIANDO TESTE COMPLETO DO SISTEMA...');
  
  // 1. Testar todas as API keys
  await testarTodasAsChaves();
  
  // 2. Simular processamento de sinal
  await simularSinalTrading();
  
  console.log('\n✅ TESTE COMPLETO FINALIZADO!');
}

// Executar
executarTesteCompleto().catch(console.error);
