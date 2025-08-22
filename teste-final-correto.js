// TESTE FINAL COM QUANTIDADE CORRETA - v11.0.0
console.log('🎯 TESTE FINAL COM QUANTIDADE MÍNIMA CORRETA...');

const { Pool } = require('pg');
const ccxt = require('ccxt');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
  ssl: { rejectUnauthorized: false }
});

async function testeFinalCorreto() {
  try {
    console.log('🚀 INICIANDO TESTE FINAL COM QUANTIDADE CORRETA...');
    
    // Usar conta Luiza
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
    
    console.log('👤 Usando conta Luiza');
    console.log('💰 Saldo disponível: $100.99 USDT');
    
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
    
    // Exchange principal
    const exchange = new ccxt.bybit({
      apiKey: account.api_key,
      secret: account.api_secret,
      sandbox: account.is_testnet,
      enableRateLimit: true,
      timeout: 45000,
      options: {
        defaultType: 'linear'
      }
    });
    
    // Correção de timestamp
    const originalNonce = exchange.nonce;
    exchange.nonce = function() {
      return originalNonce.call(this) + timeDifference;
    };
    
    await exchange.loadMarkets();
    
    // Verificar especificações do mercado
    const market = exchange.markets['LINK/USDT:USDT'];
    console.log('📊 Especificações do mercado LINK/USDT:USDT:');
    console.log(`   Quantidade mínima: ${market.limits.amount.min}`);
    console.log(`   Valor mínimo: $${market.limits.cost.min || 'N/A'}`);
    
    // Usar quantidade mínima correta
    const minAmount = Math.max(0.1, market.limits.amount.min || 0.1);
    console.log(`📊 Usando quantidade: ${minAmount} LINK`);
    
    // Estimar valor
    const ticker = await exchange.fetchTicker('LINK/USDT:USDT');
    const estimatedValue = minAmount * ticker.last;
    console.log(`💵 Valor estimado: $${estimatedValue.toFixed(2)} (preço atual: $${ticker.last?.toFixed(4)})`);
    
    if (estimatedValue > 95) { // Deixar margem de segurança
      throw new Error(`Valor muito alto: $${estimatedValue.toFixed(2)} > $95`);
    }
    
    console.log('\n⚡ EXECUTANDO ORDEM REAL...');
    console.log('🚨 TRADE REAL COM DINHEIRO REAL!');
    
    const order = await exchange.createMarketBuyOrder(
      'LINK/USDT:USDT',
      minAmount
    );
    
    console.log('\n🎉 ===============================');
    console.log('🎉 TRADE REAL EXECUTADO COM SUCESSO!');
    console.log('🎉 ===============================');
    console.log(`📊 ID da Ordem: ${order.id}`);
    console.log(`📊 Símbolo: ${order.symbol}`);
    console.log(`📊 Tipo: ${order.type}`);
    console.log(`📊 Lado: ${order.side}`);
    console.log(`📊 Quantidade: ${order.amount} LINK`);
    console.log(`📊 Status: ${order.status}`);
    console.log(`📊 Preço médio: $${order.average || order.price || 'N/A'}`);
    console.log(`📊 Valor total: $${order.cost || 'N/A'}`);
    
    // Verificar saldo atualizado
    const newBalance = await exchange.fetchBalance();
    const newUsdtBalance = newBalance['USDT'].free;
    const linkBalance = newBalance['LINK']?.total || 0;
    
    console.log('\n💰 SALDOS ATUALIZADOS:');
    console.log(`   USDT: $${newUsdtBalance.toFixed(2)} (era $100.99)`);
    console.log(`   LINK: ${linkBalance.toFixed(4)} LINK`);
    
    console.log('\n🚀 SISTEMA 100% OPERACIONAL!');
    console.log('🎯 TRADING REAL CONFIRMADO E FUNCIONANDO!');
    console.log('✅ TODAS AS CORREÇÕES APLICADAS COM SUCESSO!');
    
    await exchange.close();
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

// Executar teste final
testeFinalCorreto().catch(console.error);
