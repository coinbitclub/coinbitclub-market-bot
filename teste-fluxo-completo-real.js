// TESTE DE SINAL REAL COMPLETO - v7.0.0
console.log('📡 TESTANDO FLUXO COMPLETO DE SINAL REAL...');

const { Pool } = require('pg');
const ccxt = require('ccxt');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
  ssl: { rejectUnauthorized: false }
});

// Simular recebimento de webhook do TradingView
async function simularWebhookTradingView() {
  console.log('📡 SIMULANDO WEBHOOK DO TRADINGVIEW...');
  
  const webhookData = {
    signal: {
      ticker: 'LINKUSDT',
      cruzou_acima_ema9: '1',
      rsi_4h: '45.5',
      rsi_15: '55.2',
      momentum_15: '2.8',
      close: '25.45',
      volume: '15432100'
    },
    source: 'TradingView',
    strategy: 'EMA_Cross_Strategy',
    timestamp: new Date().toISOString()
  };
  
  console.log('📊 Dados do webhook:', webhookData);
  
  // Processar sinal como o servidor real faria
  await processarSinalCompleto(webhookData);
}

async function processarSinalCompleto(signal) {
  try {
    console.log('\n🎯 PROCESSANDO SINAL PARA TRADING REAL...');

    // 1. ANÁLISE DE MERCADO (como no servidor real)
    const marketDecision = await analisarMercado();
    console.log('📊 Decisão de Mercado:', {
      allowLong: marketDecision.allowLong,
      allowShort: marketDecision.allowShort,
      confidence: `${marketDecision.confidence}%`
    });

    // 2. DETERMINAR AÇÃO BASEADA NO SINAL
    const actionData = await determinarAcao(signal, marketDecision);
    console.log('🎯 Ação determinada:', actionData);
    
    if (actionData.action === 'NONE') {
      console.log('⏭️ Nenhuma ação necessária baseada no mercado atual');
      return;
    }

    // 3. BUSCAR USUÁRIOS ATIVOS
    const usersQuery = `
      SELECT DISTINCT 
        u.id, u.email, u.first_name,
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
        AND u.user_status = 'ACTIVE'
        AND u.email IN (
          'erica.andrade.santos@hotmail.com', 
          'lmariadeapinto@gmail.com', 
          'pamaral15@hotmail.com'
        )
    `;

    const usersResult = await pool.query(usersQuery);
    const activeUsers = usersResult.rows;

    console.log(`\n👥 ${activeUsers.length} usuários ativos encontrados para trading`);

    // 4. EXECUTAR TRADES PARA CADA USUÁRIO
    const results = { processed: 0, errors: [], successes: [] };

    for (const user of activeUsers) {
      try {
        console.log(`\n🔄 Executando para: ${user.email} (${user.account_name})`);
        
        const tradeResult = await executarTradeReal(user, actionData, signal);
        
        if (tradeResult.success) {
          results.processed++;
          results.successes.push({
            user: user.email,
            order_id: tradeResult.order?.id,
            action: actionData.action,
            symbol: actionData.symbol,
            amount: actionData.quantity
          });
          console.log(`✅ Trade executado: ${tradeResult.order?.id}`);
        } else {
          results.errors.push({
            user: user.email,
            error: tradeResult.error
          });
          console.log(`❌ Erro: ${tradeResult.error}`);
        }

      } catch (userError) {
        console.error(`❌ Erro para ${user.email}:`, userError);
        results.errors.push({
          user: user.email,
          error: userError.message
        });
      }
    }

    // 5. RELATÓRIO FINAL
    console.log('\n📊 RELATÓRIO FINAL DO PROCESSAMENTO:');
    console.log(`✅ Sucessos: ${results.successes.length}`);
    console.log(`❌ Erros: ${results.errors.length}`);
    
    if (results.successes.length > 0) {
      console.log('\n🎯 TRADES EXECUTADOS:');
      results.successes.forEach(trade => {
        console.log(`  - ${trade.user}: ${trade.action} ${trade.amount} ${trade.symbol} (${trade.order_id})`);
      });
    }
    
    if (results.errors.length > 0) {
      console.log('\n❌ ERROS ENCONTRADOS:');
      results.errors.forEach(error => {
        console.log(`  - ${error.user}: ${error.error}`);
      });
    }

    return results;

  } catch (error) {
    console.error('❌ Erro no processamento de sinal:', error);
    throw error;
  }
}

async function analisarMercado() {
  // Simulação simplificada da análise de mercado
  return {
    allowLong: true,
    allowShort: true,
    confidence: 75,
    reasons: ['Market conditions favorable'],
    timestamp: new Date().toISOString()
  };
}

async function determinarAcao(signal, marketDecision) {
  const signalData = signal.signal || signal;
  
  // Analisar sinal técnico
  const emaAbove = signalData.cruzou_acima_ema9 === '1' || signalData.cruzou_acima_ema9 === 1;
  const rsi4h = parseFloat(signalData.rsi_4h || 50);
  const momentum = parseFloat(signalData.momentum_15 || 0);
  
  let action = 'NONE';
  let symbol = 'LINKUSDT';
  const price = parseFloat(signalData.close || 25.45);
  const quantity = Math.round((15.0 / price) * 100000) / 100000; // $15 por trade
  
  // Lógica de decisão
  if (emaAbove && rsi4h < 70 && momentum > 0) {
    if (marketDecision.allowLong) {
      action = 'BUY_LONG';
      console.log('🔵 SINAL LONG CONFIRMADO pelo mercado');
    } else {
      console.log('❌ SINAL LONG bloqueado pelo mercado');
    }
  }
  
  return {
    action,
    symbol,
    quantity,
    price,
    isOpening: action.includes('BUY_') || action.includes('SELL_'),
    signalData
  };
}

async function executarTradeReal(user, actionData, originalSignal) {
  try {
    console.log(`🚀 Executando trade real para ${user.email}:`);
    console.log(`📊 ${actionData.action} ${actionData.quantity} ${actionData.symbol} @ $${actionData.price}`);

    // Verificar se é API key de teste
    const isTestKey = user.api_key === 'test_key' || 
                      user.api_key === 'demo_key' || 
                      user.api_key.startsWith('demo_') ||
                      user.api_key.startsWith('test_') ||
                      user.api_key.length < 10;
    
    if (isTestKey) {
      console.log(`🎭 API key de teste - executando simulação`);
      return await executarSimulacao(user, actionData);
    }

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
    
    // ETAPA 4: Executar trade
    console.log(`🔗 Conectando e executando...`);
    
    await exchange.loadMarkets();
    
    // Verificar saldo
    const balance = await exchange.fetchBalance();
    const usdtBalance = balance['USDT'] || { free: 0 };
    console.log(`💰 Saldo: $${usdtBalance.free?.toFixed(2)}`);
    
    if (usdtBalance.free < 5) {
      throw new Error(`Saldo insuficiente: $${usdtBalance.free?.toFixed(2)}`);
    }
    
    // Preparar ordem
    let symbol = actionData.symbol;
    if (!symbol.endsWith('USDT')) {
      symbol = symbol + 'USDT';
    }
    const bybitSymbol = symbol + '/USDT:USDT';
    
    const orderSide = actionData.action === 'BUY_LONG' ? 'buy' : 'sell';
    
    console.log(`🎯 Criando ordem: ${orderSide} ${actionData.quantity} ${bybitSymbol}`);
    
    // EXECUTAR ORDEM REAL
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
    
    console.log(`✅ ORDEM EXECUTADA:`, {
      id: order.id,
      symbol: order.symbol,
      side: order.side,
      amount: order.amount,
      status: order.status
    });
    
    // Registrar no banco
    await registrarPosicao(user, order, actionData);
    
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

async function executarSimulacao(user, actionData) {
  const simulatedOrder = {
    id: `SIM_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    symbol: actionData.symbol,
    side: actionData.action === 'BUY_LONG' ? 'buy' : 'sell',
    amount: actionData.quantity,
    price: actionData.price,
    status: 'filled',
    simulation: true
  };
  
  console.log(`🎭 SIMULAÇÃO executada:`, simulatedOrder);
  
  return {
    success: true,
    order: simulatedOrder,
    mode: 'simulation',
    message: 'Trade simulado executado'
  };
}

async function registrarPosicao(user, order, actionData) {
  try {
    const query = `
      INSERT INTO trading_positions (
        id, user_id, exchange_account_id, symbol, side, size, 
        entry_price, leverage, status, exchange_order_ids,
        opened_at, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5,
        $6, 1, 'OPEN', $7,
        NOW(), NOW(), NOW()
      ) RETURNING id
    `;

    const side = order.side === 'buy' ? 'BUY' : 'SELL';
    const exchangeOrderIds = JSON.stringify([order.id]);
    
    await pool.query(query, [
      user.id,
      user.account_id,
      order.symbol.replace('/USDT:USDT', '').replace('USDT', '') + 'USDT',
      side,
      order.amount,
      order.price || actionData.price,
      exchangeOrderIds
    ]);
    
    console.log(`📊 Posição registrada no banco`);
    
  } catch (error) {
    console.error('⚠️ Erro registrando posição:', error.message);
  }
}

// Executar teste completo
async function executarTesteCompleto() {
  try {
    await simularWebhookTradingView();
    console.log('\n🎉 TESTE DE FLUXO COMPLETO FINALIZADO!');
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await pool.end();
  }
}

// Executar
executarTesteCompleto().catch(console.error);
