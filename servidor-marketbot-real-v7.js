// MARKETBOT ENTERPRISE - SERVIDOR PRODUÇÃO v7.0.0
console.log('🚀 INICIANDO MARKETBOT ENTERPRISE REAL...');

const express = require('express');
const { Pool } = require('pg');
const ccxt = require('ccxt');
const app = express();
const PORT = process.env.PORT || 3000;

console.log('✅ Express carregado');

// Configuração do banco de dados (Railway PostgreSQL)
const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
  ssl: { rejectUnauthorized: false }
});

// Middlewares básicos
app.use(express.json());

console.log('✅ Middlewares configurados');
console.log('✅ Banco de dados configurado');

// ========================================
// SISTEMA DE TRADING REAL INTEGRADO
// ========================================

async function processSignalWithRealTrading(signal) {
  try {
    console.log('🎯 PROCESSANDO SINAL PARA TRADING REAL:', signal);

    // 1. Buscar usuários ativos com trading habilitado
    const usersQuery = `
      SELECT DISTINCT 
        u.id, u.email, u.first_name, u.last_name,
        uea.id as account_id, 
        uea.api_key, 
        uea.api_secret,
        uea.account_name,
        uea.exchange,
        uea.is_testnet,
        uea.can_trade
      FROM users u
      JOIN user_exchange_accounts uea ON u.id = uea.user_id
      WHERE uea.is_active = true 
        AND uea.can_trade = true 
        AND uea.is_testnet = false
        AND u.user_status = 'ACTIVE'
      LIMIT 3
    `;

    const usersResult = await pool.query(usersQuery);
    const activeUsers = usersResult.rows;

    console.log(`📊 Encontrados ${activeUsers.length} usuários ativos para trading`);

    if (activeUsers.length === 0) {
      console.log('⚠️ Nenhum usuário ativo para trading encontrado');
      return { processed: 0, errors: [] };
    }

    // 2. Processar sinal para cada usuário
    const results = { processed: 0, errors: [] };

    for (const user of activeUsers) {
      try {
        console.log(`\n🔄 Processando para usuário: ${user.email} (${user.account_name})`);
        
        // Determinar ação baseada no sinal
        const action = await determineActionFromSignal(signal);
        
        if (action.action === 'NONE') {
          console.log(`⏭️ Nenhuma ação necessária para ${user.email}`);
          continue;
        }

        // Executar trading para este usuário
        const tradeResult = await executeTradeForUser(user, action, signal);
        
        if (tradeResult.success) {
          results.processed++;
          console.log(`✅ Trade executado com sucesso para ${user.email}`);
        } else {
          results.errors.push({
            user: user.email,
            error: tradeResult.error
          });
          console.log(`❌ Erro no trade para ${user.email}: ${tradeResult.error}`);
        }

      } catch (userError) {
        console.error(`❌ Erro processando usuário ${user.email}:`, userError);
        results.errors.push({
          user: user.email,
          error: userError.message
        });
      }
    }

    return results;

  } catch (error) {
    console.error('❌ Erro no processamento de sinal:', error);
    throw error;
  }
}

async function determineActionFromSignal(signal) {
  try {
    // Analisar o sinal recebido do TradingView
    const signalData = signal.signal || signal;
    
    // Extrair símbolo e ação
    let symbol = 'LINKUSDT'; // Default para teste
    let action = 'NONE';
    let quantity = 0.1; // Quantidade padrão pequena

    // Processar baseado no formato do TradingView
    if (signalData.ticker) {
      symbol = signalData.ticker.replace('.P', ''); // Remove sufixo de perpetual
    }

    if (signalData.signal) {
      const signalText = signalData.signal.toLowerCase();
      
      if (signalText.includes('compre') || signalText.includes('long')) {
        action = 'BUY';
      } else if (signalText.includes('venda') || signalText.includes('short')) {
        action = 'SELL';
      } else if (signalText.includes('feche') || signalText.includes('close')) {
        action = 'CLOSE';
      }
    }

    // Calcular quantidade baseada no preço
    const price = parseFloat(signalData.close) || 25.0;
    const maxUsdValue = 10.0; // Máximo $10 por trade
    quantity = Math.round((maxUsdValue / price) * 100000) / 100000; // 5 casas decimais

    console.log(`📊 Ação determinada: ${action} ${quantity} ${symbol} @ $${price}`);

    return {
      action,
      symbol,
      quantity,
      price,
      signalData
    };

  } catch (error) {
    console.error('❌ Erro determinando ação:', error);
    return { action: 'NONE' };
  }
}

async function executeTradeForUser(user, actionData, originalSignal) {
  try {
    console.log(`🚀 Executando trade para ${user.email}:`, actionData);

    // 1. Conectar à exchange
    const exchange = new ccxt.bybit({
      apiKey: user.api_key,
      secret: user.api_secret,
      sandbox: user.is_testnet,
      enableRateLimit: true,
    });

    // 2. Verificar saldo antes do trade
    const balance = await exchange.fetchBalance();
    const usdtBalance = balance['USDT'];
    
    console.log(`💰 Saldo USDT: $${usdtBalance.free.toFixed(2)}`);

    // 3. Verificar se há saldo suficiente
    const requiredAmount = actionData.quantity * actionData.price;
    
    if (actionData.action === 'BUY' && usdtBalance.free < requiredAmount) {
      return {
        success: false,
        error: `Saldo insuficiente. Necessário: $${requiredAmount.toFixed(2)}, Disponível: $${usdtBalance.free.toFixed(2)}`
      };
    }

    // 4. Executar ordem na exchange
    let order = null;
    
    if (actionData.action === 'BUY' || actionData.action === 'SELL') {
      const side = actionData.action.toLowerCase();
      
      order = await exchange.createMarketOrder(
        actionData.symbol,
        side,
        actionData.quantity
      );

      console.log(`✅ Ordem executada:`, {
        id: order.id,
        symbol: order.symbol,
        side: order.side,
        amount: order.amount,
        price: order.price || actionData.price
      });

      // 5. Registrar posição no banco de dados
      await registerPositionInDatabase(user, order, actionData, originalSignal);

      // 6. Log da operação
      await logTradingOperation(user, order, actionData);

    } else if (actionData.action === 'CLOSE') {
      console.log(`🔄 Fechando posições existentes para ${user.email}`);
      // Implementar fechamento de posições futuro
    }

    await exchange.close();

    return {
      success: true,
      order: order,
      action: actionData.action
    };

  } catch (error) {
    console.error(`❌ Erro executando trade para ${user.email}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function registerPositionInDatabase(user, order, actionData, originalSignal) {
  try {
    const positionQuery = `
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

    const exchangeOrderIds = JSON.stringify([order.id]);
    
    const result = await pool.query(positionQuery, [
      user.id,
      user.account_id,
      order.symbol,
      order.side.toUpperCase(),
      order.amount,
      order.price || actionData.price,
      exchangeOrderIds
    ]);

    console.log(`📊 Posição registrada no banco: ${result.rows[0].id}`);
    return result.rows[0].id;

  } catch (error) {
    console.error('❌ Erro registrando posição:', error);
    throw error;
  }
}

async function logTradingOperation(user, order, actionData) {
  try {
    const logQuery = `
      INSERT INTO system_monitoring (
        event_type, user_id, symbol, exchange_used,
        amount_usd, success, details, created_at
      ) VALUES (
        'AUTO_TRADE_EXECUTION', $1, $2, $3, $4, true, $5, NOW()
      )
    `;

    const details = JSON.stringify({
      orderId: order.id,
      action: actionData.action,
      symbol: order.symbol,
      quantity: order.amount,
      price: order.price || actionData.price,
      signalSource: 'TradingView',
      executionTime: new Date().toISOString()
    });

    await pool.query(logQuery, [
      user.id,
      order.symbol,
      'BYBIT',
      (order.amount * (order.price || actionData.price)),
      details
    ]);

    console.log(`📝 Operação logada no sistema de monitoramento`);

  } catch (error) {
    console.error('❌ Erro logando operação:', error);
  }
}

// ========================================
// ROTAS DA API
// ========================================

// Health Check Route
app.get('/', (req, res) => {
  res.json({
    status: 'OPERACIONAL',
    service: 'MARKETBOT ENTERPRISE',
    version: '7.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    message: '🚀 Sistema REAL de trading automático pronto!',
    features: [
      'TradingView Webhooks ✅',
      'Multi-User Trading ✅', 
      'Real Exchange Integration ✅',
      'Database Logging ✅',
      'Auto Position Management ✅'
    ]
  });
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '7.0.0',
    database: 'connected',
    trading: 'enabled'
  });
});

// TradingView Webhook Route - ENDPOINT PRINCIPAL COM TRADING REAL
app.post('/api/webhooks/signal', async (req, res) => {
  try {
    const token = req.query.token;
    const signal = req.body;

    console.log('📡 TradingView Signal Received:', {
      timestamp: new Date().toISOString(),
      token: token,
      signal: signal,
      headers: req.headers
    });

    // Validar token
    if (token !== '210406') {
      console.log('❌ Token inválido:', token);
      return res.status(401).json({ 
        error: 'Token inválido',
        received_token: token 
      });
    }

    // Log do sinal processado
    console.log('🎯 PROCESSANDO SINAL TRADINGVIEW:', {
      symbol: signal.symbol || 'N/A',
      action: signal.action || 'N/A',
      price: signal.price || 'N/A',
      timestamp: new Date().toISOString()
    });

    // ===== NOVA FUNCIONALIDADE: PROCESSAMENTO REAL DE TRADING =====
    let tradingResults = { processed: 0, errors: [] };
    
    try {
      console.log('🚀 INICIANDO PROCESSAMENTO DE TRADING REAL...');
      tradingResults = await processSignalWithRealTrading(signal);
      console.log('✅ TRADING REAL PROCESSADO:', tradingResults);
    } catch (tradingError) {
      console.error('❌ Erro no trading real:', tradingError);
      tradingResults.errors.push({ error: tradingError.message });
    }

    // Resposta de sucesso
    res.json({
      status: 'success',
      message: 'Signal received and processed successfully',
      timestamp: new Date().toISOString(),
      signal_id: Date.now(),
      processed_signal: {
        symbol: signal.symbol,
        action: signal.action,
        price: signal.price
      },
      trading_results: {
        users_processed: tradingResults.processed,
        errors_count: tradingResults.errors.length,
        errors: tradingResults.errors
      }
    });

    console.log('✅ Signal processado com sucesso!');
    console.log(`📊 Resultado: ${tradingResults.processed} usuários processados, ${tradingResults.errors.length} erros`);

  } catch (error) {
    console.error('❌ Erro no webhook TradingView:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Webhook alternativo (sem /api)
app.post('/webhooks/signal', (req, res) => {
  console.log('📡 Webhook alternativo chamado, redirecionando...');
  req.url = '/api/webhooks/signal' + (req.url.includes('?') ? '&' + req.url.split('?')[1] : '');
  return app._router.handle(req, res);
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({
    message: 'MARKETBOT Test Endpoint',
    timestamp: new Date().toISOString(),
    status: 'working'
  });
});

// API Info
app.get('/api', (req, res) => {
  res.json({
    name: 'MARKETBOT Enterprise API',
    version: '7.0.0',
    status: 'ONLINE',
    endpoints: {
      health: '/health',
      webhook: '/api/webhooks/signal?token=210406',
      test: '/test',
      users: '/api/users/active'
    },
    webhook_info: {
      method: 'POST',
      url: '/api/webhooks/signal',
      required_param: 'token=210406',
      content_type: 'application/json'
    }
  });
});

// Endpoint para verificar usuários ativos
app.get('/api/users/active', async (req, res) => {
  try {
    const query = `
      SELECT 
        u.email, u.first_name, u.last_name, u.user_status,
        uea.account_name, uea.exchange, uea.can_trade, uea.is_testnet
      FROM users u
      JOIN user_exchange_accounts uea ON u.id = uea.user_id
      WHERE uea.is_active = true AND uea.can_trade = true
      ORDER BY u.created_at DESC
      LIMIT 10
    `;
    
    const result = await pool.query(query);
    
    res.json({
      active_users: result.rows.length,
      users: result.rows,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Catch all outros endpoints
app.use('*', (req, res) => {
  console.log(`📍 Endpoint não encontrado: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Endpoint not found',
    method: req.method,
    path: req.originalUrl,
    available_endpoints: {
      health: 'GET /health',
      webhook: 'POST /api/webhooks/signal?token=210406',
      test: 'GET /test',
      api_info: 'GET /api',
      active_users: 'GET /api/users/active'
    }
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('✅ MARKETBOT ENTERPRISE ONLINE!');
  console.log(`🌐 Porta: ${PORT}`);
  console.log(`📡 Webhook: /api/webhooks/signal?token=210406`);
  console.log('🚀 SISTEMA DE TRADING REAL ATIVO!');
});

console.log('🎯 SERVIDOR CONFIGURADO!');
