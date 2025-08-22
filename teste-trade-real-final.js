// TESTE FINAL COM SÍMBOLO CORRIGIDO - v8.0.0
console.log('🎯 TESTE FINAL COM CORREÇÃO DE SÍMBOLO...');

const { Pool } = require('pg');
const ccxt = require('ccxt');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
  ssl: { rejectUnauthorized: false }
});

async function testeTradeReal() {
  try {
    console.log('🚀 INICIANDO TESTE DE TRADE REAL...');
    
    // Buscar uma conta ativa
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
        AND u.email = 'erica.andrade.santos@hotmail.com'
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
    
    // Dados do trade de teste
    const actionData = {
      action: 'BUY_LONG',
      symbol: 'LINKUSDT', // Entrada como string simples
      quantity: 0.5, // Quantidade pequena para teste
      price: 24.40
    };
    
    console.log('📊 Dados do trade:', actionData);
    
    // Executar trade
    const resultado = await executarTradeComCorrecao(user, actionData);
    
    if (resultado.success) {
      console.log('✅ TRADE EXECUTADO COM SUCESSO!');
      console.log('📊 Detalhes:', {
        order_id: resultado.order.id,
        symbol: resultado.order.symbol,
        side: resultado.order.side,
        amount: resultado.order.amount,
        status: resultado.order.status
      });
    } else {
      console.log('❌ TRADE FALHOU:', resultado.error);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await pool.end();
  }
}

async function executarTradeComCorrecao(user, actionData) {
  try {
    console.log(`🚀 Executando trade para ${user.email}:`);

    // ETAPA 1: Sincronização de tempo
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
      console.log(`⏰ Diferença: ${timeDifference}ms`);
      await tempExchange.close();
    } catch (syncError) {
      await tempExchange.close();
      throw new Error(`Sincronização falhou: ${syncError.message}`);
    }
    
    // ETAPA 2: Exchange principal
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
    
    // ETAPA 3: Correção de timestamp
    const originalNonce = exchange.nonce;
    exchange.nonce = function() {
      const timestamp = originalNonce.call(this);
      return timestamp + timeDifference;
    };
    
    // ETAPA 4: Conectar e verificar
    console.log(`🔗 Conectando...`);
    await exchange.loadMarkets();
    
    // Verificar saldo
    const balance = await exchange.fetchBalance();
    const usdtBalance = balance['USDT'] || { free: 0 };
    console.log(`💰 Saldo: $${usdtBalance.free?.toFixed(2)}`);
    
    if (usdtBalance.free < 5) {
      throw new Error(`Saldo insuficiente: $${usdtBalance.free?.toFixed(2)}`);
    }
    
    // ETAPA 5: Formatar símbolo CORRETAMENTE
    let symbol = actionData.symbol;
    
    // Remover sufixos se existirem
    symbol = symbol.replace('.P', '').replace('/USDT:USDT', '').replace('/USDT', '');
    
    // Garantir que termine com USDT
    if (!symbol.endsWith('USDT')) {
      symbol = symbol + 'USDT';
    }
    
    // Extrair base currency (ex: LINKUSDT -> LINK)
    const baseCurrency = symbol.replace('USDT', '');
    
    // Formato correto para Bybit Linear: BASE/USDT:USDT
    const bybitSymbol = `${baseCurrency}/USDT:USDT`;
    
    console.log(`🔄 Símbolo formatado: ${actionData.symbol} → ${bybitSymbol}`);
    
    // ETAPA 6: Verificar se símbolo existe
    if (!exchange.markets[bybitSymbol]) {
      throw new Error(`Símbolo ${bybitSymbol} não encontrado na exchange`);
    }
    
    console.log(`✅ Símbolo ${bybitSymbol} confirmado na exchange`);
    
    // ETAPA 7: Preparar ordem
    const orderSide = actionData.action === 'BUY_LONG' ? 'buy' : 'sell';
    
    console.log(`🎯 Preparando ordem: ${orderSide} ${actionData.quantity} ${bybitSymbol}`);
    
    // ETAPA 8: EXECUTAR ORDEM REAL
    const order = await exchange.createOrder(
      bybitSymbol,
      'market',
      orderSide,
      actionData.quantity,
      undefined, // preço market
      {
        timeInForce: 'IOC',
        reduceOnly: false,
        positionIdx: 1
      }
    );
    
    console.log(`✅ ORDEM EXECUTADA COM SUCESSO!`);
    console.log(`📊 ID: ${order.id}`);
    console.log(`📊 Status: ${order.status}`);
    console.log(`📊 Preço: $${order.price || 'Market'}`);
    
    await exchange.close();
    
    return {
      success: true,
      order: order,
      mode: 'real',
      message: `Ordem real executada: ${order.id}`
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
testeTradeReal().catch(console.error);
