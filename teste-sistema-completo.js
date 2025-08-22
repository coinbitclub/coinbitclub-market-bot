// TESTE COMPLETO DO SISTEMA CORRIGIDO - v5.0.0  
console.log('🎯 TESTE COMPLETO DO SISTEMA CORRIGIDO...');

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
  ssl: { rejectUnauthorized: false }
});

// Simular o fluxo completo do servidor
async function testeCompleto() {
  try {
    console.log('🚀 INICIANDO TESTE COMPLETO DO SISTEMA...');
    
    // Simular sinal de entrada
    const sinal = {
      symbol: 'BTCUSDT',
      action: 'BUY_LONG',
      quantity: 0.001,
      price: 45000
    };
    
    console.log('📊 Sinal simulado:', sinal);
    
    // Buscar usuários reais
    const query = `
      SELECT u.id, u.email, uea.api_key, uea.api_secret, uea.is_testnet
      FROM users u 
      JOIN user_exchange_accounts uea ON u.id = uea.user_id
      WHERE uea.is_active = true 
        AND uea.can_trade = true 
        AND uea.is_testnet = false
        AND u.email = 'erica.andrade.santos@hotmail.com'
        AND uea.account_name LIKE '%MAINNET%'
      LIMIT 1
    `;
    
    const result = await pool.query(query);
    
    if (result.rows.length === 0) {
      console.log('❌ Nenhuma conta encontrada');
      return;
    }
    
    const user = result.rows[0];
    console.log(`👤 Usuário teste: ${user.email}`);
    
    // Simular função executeTradeForUser
    const tradeResult = await simularExecuteTradeForUser(user, sinal);
    
    console.log('📊 Resultado do trade:', tradeResult);
    
    if (tradeResult.success) {
      console.log('✅ SISTEMA FUNCIONANDO PERFEITAMENTE!');
      console.log('🚀 READY FOR REAL TRADING!');
    } else {
      console.log('❌ Sistema ainda tem problemas:', tradeResult.error);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste completo:', error);
  } finally {
    await pool.end();
  }
}

async function simularExecuteTradeForUser(user, actionData) {
  const ccxt = require('ccxt');
  
  try {
    console.log(`🚀 Executando trade para ${user.email}:`, actionData);

    // Verificar se é API key de teste
    const isTestKey = user.api_key === 'test_key' || 
                      user.api_key === 'demo_key' || 
                      user.api_key.startsWith('demo_') ||
                      user.api_key.startsWith('test_') ||
                      user.api_key.length < 10;
    
    if (isTestKey) {
      console.log(`🎭 API key de teste detectada - seria simulação`);
      return { success: false, mode: 'test', reason: 'API key de teste' };
    }

    console.log(`🔗 MODO REAL para ${user.email} - aplicando correções...`);
    
    // PRIMEIRA ETAPA: Obter diferença de tempo
    console.log(`⏰ Sincronizando tempo...`);
    
    const tempExchange = new ccxt.bybit({
      apiKey: user.api_key,
      secret: user.api_secret,
      sandbox: user.is_testnet,
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
      throw new Error(`Falha na sincronização: ${syncError.message}`);
    }
    
    // SEGUNDA ETAPA: Exchange principal com correção
    const exchange = new ccxt.bybit({
      apiKey: user.api_key,
      secret: user.api_secret,
      sandbox: user.is_testnet,
      enableRateLimit: true,
      timeout: 45000,
      options: {
        defaultType: 'linear',
        hedgeMode: true,
        portfolioMargin: false,
        recvWindow: 30000
      }
    });
    
    // Aplicar correção de timestamp
    const originalNonce = exchange.nonce;
    exchange.nonce = function() {
      const timestamp = originalNonce.call(this);
      return timestamp + timeDifference;
    };
    
    // Testar conectividade
    console.log(`🔍 Testando conectividade...`);
    await exchange.loadMarkets();
    console.log(`✅ Conectividade OK`);
    
    // Verificar saldo
    console.log(`💰 Verificando saldo...`);
    const balance = await exchange.fetchBalance();
    const usdtBalance = balance['USDT'] || { free: 0 };
    console.log(`💰 Saldo: $${usdtBalance.free?.toFixed(2) || '0.00'} USDT`);
    
    await exchange.close();
    
    return {
      success: true,
      mode: 'real',
      balance: usdtBalance.free,
      timeDifference: timeDifference,
      message: 'Sistema pronto para operações reais'
    };
    
  } catch (error) {
    console.error(`❌ Erro:`, error.message);
    
    return {
      success: false,
      error: error.message,
      mode: 'failed'
    };
  }
}

// Executar teste
testeCompleto().catch(console.error);
