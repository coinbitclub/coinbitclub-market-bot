// TESTE FINAL DEFINITIVO - TRADE REAL COM TODAS AS CORREÇÕES - v9.0.0
console.log('🎯 TESTE FINAL DEFINITIVO - TRADE REAL...');

const { Pool } = require('pg');
const ccxt = require('ccxt');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
  ssl: { rejectUnauthorized: false }
});

async function testeDefinitivo() {
  try {
    console.log('🚀 INICIANDO TESTE DEFINITIVO...');
    
    // Buscar conta ativa
    const query = `
      SELECT 
        u.id, u.email, 
        uea.id as account_id, 
        uea.api_key, 
        uea.api_secret,
        uea.account_name,
        uea.is_testnet
      FROM users u
      JOIN user_exchange_accounts uea ON u.id = uea.user_id
      WHERE uea.is_active = true 
        AND uea.can_trade = true 
        AND uea.is_testnet = false
        AND u.email = 'pamaral15@hotmail.com'
        AND uea.account_name LIKE '%MAINNET%'
      LIMIT 1
    `;
    
    const result = await pool.query(query);
    const user = result.rows[0];
    
    if (!user) {
      console.log('❌ Nenhuma conta encontrada');
      return;
    }
    
    console.log(`👤 Testando com: ${user.email} (${user.account_name})`);
    console.log(`💰 Esta conta tem $233.73 USDT disponível`);
    
    // Trade de teste - quantidade muito pequena
    const actionData = {
      action: 'BUY_LONG',
      symbol: 'LINKUSDT',
      quantity: 0.1, // Apenas 0.1 LINK (~$2.40)
      price: 24.40
    };
    
    console.log('📊 Dados do trade (quantidade mínima):', actionData);
    console.log('💵 Valor estimado: ~$2.40 USD');
    
    // Executar trade real
    const resultado = await executarTradeDefinitivo(user, actionData);
    
    if (resultado.success) {
      console.log('\n🎉 ===== TRADE REAL EXECUTADO COM SUCESSO! =====');
      console.log('📊 DETALHES DA ORDEM:');
      console.log(`   ID: ${resultado.order.id}`);
      console.log(`   Símbolo: ${resultado.order.symbol}`);
      console.log(`   Lado: ${resultado.order.side}`);
      console.log(`   Quantidade: ${resultado.order.amount}`);
      console.log(`   Status: ${resultado.order.status}`);
      console.log(`   Preço: $${resultado.order.price || resultado.order.average || 'Market'}`);
      console.log('\n🚀 SISTEMA 100% OPERACIONAL PARA TRADING REAL!');
      
    } else {
      console.log('\n❌ TRADE FALHOU:', resultado.error);
      console.log('📝 Modo:', resultado.mode);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste definitivo:', error);
  } finally {
    await pool.end();
  }
}

async function executarTradeDefinitivo(user, actionData) {
  try {
    console.log(`\n🚀 === EXECUTANDO TRADE REAL DEFINITIVO ===`);
    console.log(`👤 Usuário: ${user.email}`);
    console.log(`🔑 API Key: ${user.api_key.substring(0, 8)}...`);

    // ETAPA 1: Sincronização de tempo
    console.log(`\n⏰ ETAPA 1: Sincronizando tempo...`);
    
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
      throw new Error(`Sincronização falhou: ${syncError.message}`);
    }
    
    // ETAPA 2: Exchange principal
    console.log(`\n🔗 ETAPA 2: Criando exchange principal...`);
    
    const exchange = new ccxt.bybit({
      apiKey: user.api_key,
      secret: user.api_secret,
      sandbox: user.is_testnet,
      enableRateLimit: true,
      timeout: 45000,
      options: {
        defaultType: 'linear',
        hedgeMode: false, // One-way mode
        portfolioMargin: false,
        recvWindow: 30000
      }
    });
    
    // ETAPA 3: Correção de timestamp
    console.log(`\n🔧 ETAPA 3: Aplicando correção de timestamp...`);
    
    const originalNonce = exchange.nonce;
    exchange.nonce = function() {
      const timestamp = originalNonce.call(this);
      return timestamp + timeDifference;
    };
    
    // ETAPA 4: Conectar e verificar
    console.log(`\n📡 ETAPA 4: Conectando à exchange...`);
    await exchange.loadMarkets();
    console.log(`✅ Conectado e mercados carregados`);
    
    // Verificar saldo
    const balance = await exchange.fetchBalance();
    const usdtBalance = balance['USDT'] || { free: 0 };
    console.log(`💰 Saldo USDT: $${usdtBalance.free?.toFixed(2)}`);
    
    if (usdtBalance.free < 3) {
      throw new Error(`Saldo insuficiente: $${usdtBalance.free?.toFixed(2)}`);
    }
    
    // ETAPA 5: Formatar símbolo
    console.log(`\n🔄 ETAPA 5: Formatando símbolo...`);
    
    let symbol = actionData.symbol;
    symbol = symbol.replace('.P', '').replace('/USDT:USDT', '').replace('/USDT', '');
    
    if (!symbol.endsWith('USDT')) {
      symbol = symbol + 'USDT';
    }
    
    const baseCurrency = symbol.replace('USDT', '');
    const bybitSymbol = `${baseCurrency}/USDT:USDT`;
    
    console.log(`🔄 Símbolo: ${actionData.symbol} → ${bybitSymbol}`);
    
    // Verificar se símbolo existe
    if (!exchange.markets[bybitSymbol]) {
      throw new Error(`Símbolo ${bybitSymbol} não encontrado`);
    }
    console.log(`✅ Símbolo confirmado na exchange`);
    
    // ETAPA 6: Preparar ordem
    console.log(`\n🎯 ETAPA 6: Preparando ordem...`);
    
    const orderSide = actionData.action === 'BUY_LONG' ? 'buy' : 'sell';
    
    console.log(`📋 Ordem: ${orderSide} ${actionData.quantity} ${bybitSymbol}`);
    console.log(`💵 Valor estimado: ~$${(actionData.quantity * actionData.price).toFixed(2)}`);
    
    // ETAPA 7: EXECUTAR ORDEM REAL
    console.log(`\n⚡ ETAPA 7: EXECUTANDO ORDEM REAL...`);
    console.log(`🚨 ATENÇÃO: Esta é uma operação REAL com dinheiro REAL!`);
    
    const order = await exchange.createOrder(
      bybitSymbol,
      'market',
      orderSide,
      actionData.quantity,
      undefined, // preço market
      {
        timeInForce: 'IOC',
        reduceOnly: false,
        positionIdx: 0 // One-way mode
      }
    );
    
    console.log(`\n🎉 === ORDEM EXECUTADA COM SUCESSO! ===`);
    console.log(`📊 ID da Ordem: ${order.id}`);
    console.log(`📊 Status: ${order.status}`);
    console.log(`📊 Filled: ${order.filled || order.amount}`);
    console.log(`📊 Preço médio: $${order.average || order.price || 'N/A'}`);
    
    // Verificar posição resultante
    try {
      console.log(`\n📊 Verificando posição resultante...`);
      const positions = await exchange.fetchPositions([bybitSymbol]);
      const position = positions.find(pos => pos.contracts > 0);
      
      if (position) {
        console.log(`✅ Posição aberta: ${position.contracts} ${baseCurrency} @ $${position.markPrice?.toFixed(4)}`);
      }
    } catch (posError) {
      console.log(`⚠️ Erro verificando posição: ${posError.message}`);
    }
    
    await exchange.close();
    
    return {
      success: true,
      order: order,
      mode: 'real',
      message: `Ordem real executada com sucesso: ${order.id}`
    };
    
  } catch (error) {
    console.error(`❌ Erro executando trade:`, error.message);
    return {
      success: false,
      error: error.message,
      mode: 'failed'
    };
  }
}

// Executar teste definitivo
testeDefinitivo().catch(console.error);
