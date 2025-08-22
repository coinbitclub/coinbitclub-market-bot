// TESTE ULTRA SIMPLES - SEM POSITION IDX - v10.0.0
console.log('🎯 TESTE ULTRA SIMPLES - SEM POSITION IDX...');

const { Pool } = require('pg');
const ccxt = require('ccxt');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
  ssl: { rejectUnauthorized: false }
});

async function testeUltraSimples() {
  try {
    console.log('🚀 INICIANDO TESTE ULTRA SIMPLES...');
    
    // Usar conta Luiza que não tem posições abertas
    const query = `
      SELECT api_key, api_secret, is_testnet
      FROM user_exchange_accounts uea
      JOIN users u ON u.id = uea.user_id
      WHERE uea.is_active = true 
        AND uea.can_trade = true 
        AND uea.is_testnet = false
        AND u.email = 'lmariadeapinto@gmail.com'
        AND uea.account_name LIKE '%MAINNET%'
      LIMIT 1
    `;
    
    const result = await pool.query(query);
    const account = result.rows[0];
    
    console.log('👤 Usando conta Luiza (sem posições abertas)');
    console.log('💰 Saldo: $100.99 USDT');
    
    // Sincronização de tempo
    const tempExchange = new ccxt.bybit({
      apiKey: account.api_key,
      secret: account.api_secret,
      sandbox: account.is_testnet,
      enableRateLimit: true,
      timeout: 30000
    });
    
    const serverTime = await tempExchange.fetchTime();
    const timeDifference = serverTime - Date.now();
    await tempExchange.close();
    
    console.log(`⏰ Diferença temporal: ${timeDifference}ms`);
    
    // Exchange principal - configuração MÍNIMA
    const exchange = new ccxt.bybit({
      apiKey: account.api_key,
      secret: account.api_secret,
      sandbox: account.is_testnet,
      enableRateLimit: true,
      timeout: 45000,
      options: {
        defaultType: 'linear'
        // Removendo todas as outras configurações
      }
    });
    
    // Aplicar correção de timestamp
    const originalNonce = exchange.nonce;
    exchange.nonce = function() {
      return originalNonce.call(this) + timeDifference;
    };
    
    await exchange.loadMarkets();
    console.log('✅ Exchange conectada');
    
    // Verificar saldo
    const balance = await exchange.fetchBalance();
    const usdtBalance = balance['USDT'].free;
    console.log(`💰 Saldo confirmado: $${usdtBalance.toFixed(2)}`);
    
    // ORDEM MAIS SIMPLES POSSÍVEL
    console.log('\n🎯 CRIANDO ORDEM MAIS SIMPLES POSSÍVEL...');
    console.log('📊 Compra: 0.05 LINK (valor ~$1.20)');
    
    try {
      const order = await exchange.createMarketBuyOrder(
        'LINK/USDT:USDT',
        0.05 // Quantidade mínima
      );
      
      console.log('\n🎉 ===== SUCESSO TOTAL! =====');
      console.log('✅ ORDEM EXECUTADA COM CONFIGURAÇÃO SIMPLES!');
      console.log(`📊 ID: ${order.id}`);
      console.log(`📊 Status: ${order.status}`);
      console.log(`📊 Quantidade: ${order.amount}`);
      console.log(`📊 Preço: $${order.price || order.average || 'Market'}`);
      
      console.log('\n🚀 SISTEMA TOTALMENTE OPERACIONAL!');
      console.log('🎯 TRADING REAL FUNCIONANDO PERFEITAMENTE!');
      
    } catch (orderError) {
      console.error('❌ Erro na ordem:', orderError.message);
      
      // Tentar ordem ainda mais simples - via método direto
      console.log('\n🔄 Tentando método alternativo...');
      
      try {
        const orderAlt = await exchange.createOrder(
          'LINK/USDT:USDT',
          'market',
          'buy',
          0.05
        );
        
        console.log('\n🎉 ===== SUCESSO COM MÉTODO ALTERNATIVO! =====');
        console.log(`📊 ID: ${orderAlt.id}`);
        console.log(`📊 Status: ${orderAlt.status}`);
        
      } catch (altError) {
        console.error('❌ Erro método alternativo:', altError.message);
      }
    }
    
    await exchange.close();
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

// Executar teste
testeUltraSimples().catch(console.error);
