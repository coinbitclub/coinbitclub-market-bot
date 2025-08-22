// ========================================
// SISTEMA COMPLETO - WEBHOOK MONITORING
// Monitorar sinais TradingView e ativar orquestrador
// ========================================

const { Pool } = require('pg');
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Configuração do banco de dados
const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
  ssl: { rejectUnauthorized: false }
});

const app = express();
app.use(express.json());

console.log('🚀 SISTEMA MARKETBOT - AMBIENTE REAL ATIVADO');
console.log('============================================');
console.log('📡 URL TradingView: https://coinbitclub-market-bot.up.railway.app/api/webhooks/signal?token=210406');
console.log('🔗 Local Testing: http://localhost:3000/api/webhooks/signal?token=210406');
console.log('⚡ Status: AGUARDANDO SINAIS...\n');

// ========================================
// WEBHOOK CONTROLLER - RECEBER SINAIS
// ========================================

app.post('/api/webhooks/signal', async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log('📥 SINAL RECEBIDO DO TRADINGVIEW!');
    console.log('=================================');
    console.log('⏰ Timestamp:', new Date().toLocaleString('pt-BR'));
    console.log('🔑 Token:', req.query.token);
    console.log('📋 Headers:', JSON.stringify(req.headers, null, 2));
    console.log('📊 Body:', JSON.stringify(req.body, null, 2));
    console.log('');

    // Validar token
    if (req.query.token !== '210406') {
      console.log('❌ TOKEN INVÁLIDO!');
      return res.status(401).json({ error: 'Token inválido' });
    }

    // Registrar sinal no banco
    const signalData = {
      source: 'TRADINGVIEW',
      webhook_id: req.headers['x-webhook-id'] || 'unknown',
      raw_data: req.body,
      token: req.query.token,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.headers['user-agent'],
      received_at: new Date()
    };

    const insertQuery = `
      INSERT INTO webhook_signals (
        source, webhook_id, raw_data, token, ip_address, 
        user_agent, received_at, processed, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, false, NOW())
      RETURNING id
    `;

    const result = await pool.query(insertQuery, [
      signalData.source,
      signalData.webhook_id,
      JSON.stringify(signalData.raw_data),
      signalData.token,
      signalData.ip_address,
      signalData.user_agent,
      signalData.received_at
    ]);

    const webhookId = result.rows[0].id;
    console.log(`✅ Sinal registrado no banco: ID ${webhookId}`);

    // PROCESSAR SINAL COM ORQUESTRADOR
    const processResult = await processSignalWithOrchestrator(req.body, webhookId);

    const executionTime = Date.now() - startTime;
    console.log(`⚡ Tempo de processamento: ${executionTime}ms`);
    console.log('=================================\n');

    res.json({
      success: true,
      webhookId: webhookId,
      message: 'Sinal recebido e processado',
      executionTime: executionTime,
      result: processResult
    });

  } catch (error) {
    console.error('❌ ERRO no webhook:', error);
    
    const executionTime = Date.now() - startTime;
    
    res.status(500).json({
      success: false,
      error: error.message,
      executionTime: executionTime
    });
  }
});

// ========================================
// ORQUESTRADOR DE TRADING
// ========================================

async function processSignalWithOrchestrator(signalData, webhookId) {
  try {
    console.log('🎯 INICIANDO ORQUESTRADOR DE TRADING');
    console.log('====================================');

    // 1. Interpretar sinal TradingView
    const parsedSignal = parseTraidingViewSignal(signalData);
    
    if (!parsedSignal) {
      console.log('⚠️ Sinal não reconhecido ou inválido');
      return { processed: false, reason: 'Sinal inválido' };
    }

    console.log('📊 Sinal interpretado:', parsedSignal);

    // 2. Buscar usuários elegíveis (MAINNET prioritário)
    const eligibleUsers = await getEligibleUsers(parsedSignal.symbol);
    console.log(`👥 Usuários elegíveis: ${eligibleUsers.length}`);

    if (eligibleUsers.length === 0) {
      console.log('⚠️ Nenhum usuário elegível encontrado');
      return { processed: false, reason: 'Nenhum usuário elegível' };
    }

    // 3. Processar por ordem de prioridade
    const results = [];
    
    for (const user of eligibleUsers) {
      try {
        console.log(`\n🔄 Processando usuário: ${user.email}`);
        console.log(`   Prioridade: ${user.priority} (${user.environment})`);
        console.log(`   Saldo USDT: $${user.balance_usd}`);

        const userResult = await executeTradeForUser(user, parsedSignal, webhookId);
        results.push(userResult);

        // Rate limiting entre usuários
        await sleep(1000);

      } catch (userError) {
        console.log(`   ❌ Erro para ${user.email}: ${userError.message}`);
        results.push({
          userId: user.id,
          email: user.email,
          success: false,
          error: userError.message
        });
      }
    }

    // 4. Resumo final
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log('\n📊 RESUMO DO PROCESSAMENTO:');
    console.log('===========================');
    console.log(`✅ Sucessos: ${successful.length}/${results.length}`);
    console.log(`❌ Falhas: ${failed.length}/${results.length}`);
    console.log(`📈 Taxa de sucesso: ${((successful.length / results.length) * 100).toFixed(1)}%`);

    // 5. Atualizar webhook como processado
    await pool.query(
      'UPDATE webhook_signals SET processed = true, processed_at = NOW() WHERE id = $1',
      [webhookId]
    );

    return {
      processed: true,
      usersProcessed: results.length,
      successful: successful.length,
      failed: failed.length,
      results: results
    };

  } catch (error) {
    console.error('❌ Erro no orquestrador:', error);
    throw error;
  }
}

// ========================================
// PARSEAR SINAL TRADINGVIEW
// ========================================

function parseTraidingViewSignal(data) {
  try {
    // Detectar diferentes formatos de sinal
    const text = JSON.stringify(data).toLowerCase();
    
    let signalType = null;
    let symbol = null;
    let action = null;

    // Detectar tipo de sinal
    if (text.includes('long') || text.includes('buy') || text.includes('compra')) {
      signalType = 'LONG';
      action = 'BUY';
    } else if (text.includes('short') || text.includes('sell') || text.includes('venda')) {
      signalType = 'SHORT';
      action = 'SELL';
    } else if (text.includes('close') || text.includes('fechar') || text.includes('exit')) {
      action = 'CLOSE';
    }

    // Detectar símbolo
    const symbols = ['btc', 'eth', 'link', 'bnb', 'ada', 'dot', 'sol'];
    for (const sym of symbols) {
      if (text.includes(sym)) {
        symbol = sym.toUpperCase() + '/USDT';
        break;
      }
    }

    // Default para LINK se não detectado
    if (!symbol) {
      symbol = 'LINK/USDT';
    }

    if (!signalType && !action) {
      return null;
    }

    return {
      type: signalType,
      action: action,
      symbol: symbol,
      timestamp: new Date(),
      source: 'TRADINGVIEW',
      rawData: data
    };

  } catch (error) {
    console.error('Erro ao parsear sinal:', error);
    return null;
  }
}

// ========================================
// BUSCAR USUÁRIOS ELEGÍVEIS
// ========================================

async function getEligibleUsers(symbol) {
  try {
    const query = `
      SELECT 
        u.id, u.email, u.plan_type,
        uea.id as account_id, uea.api_key, uea.api_secret,
        uea.exchange, uea.is_testnet, uea.account_name,
        uea.max_position_size_usd,
        ts.auto_trading_enabled,
        CASE 
          WHEN uea.is_testnet = false AND u.account_balance_usd > 0 THEN 1
          WHEN uea.is_testnet = false AND u.prepaid_credits > 0 THEN 2
          ELSE 3
        END as priority,
        CASE 
          WHEN uea.is_testnet = false THEN 'MAINNET'
          ELSE 'TESTNET'
        END as environment,
        COALESCE(u.account_balance_usd, 0) + COALESCE(u.prepaid_credits, 0) as balance_usd
      FROM users u
      JOIN user_exchange_accounts uea ON u.id = uea.user_id
      LEFT JOIN trading_settings ts ON u.id = ts.user_id
      WHERE uea.is_active = true 
        AND uea.can_trade = true
        AND (ts.auto_trading_enabled = true OR ts.auto_trading_enabled IS NULL)
      ORDER BY priority ASC, balance_usd DESC
    `;

    const result = await pool.query(query);
    return result.rows;

  } catch (error) {
    console.error('Erro ao buscar usuários elegíveis:', error);
    return [];
  }
}

// ========================================
// EXECUTAR TRADE PARA USUÁRIO
// ========================================

async function executeTradeForUser(user, signal, webhookId) {
  const ccxt = require('ccxt');
  
  try {
    // Conectar com exchange
    const exchange = new ccxt.bybit({
      apiKey: user.api_key,
      secret: user.api_secret,
      sandbox: user.is_testnet,
      enableRateLimit: true,
    });

    // Verificar saldo
    const balance = await exchange.fetchBalance();
    const usdtBalance = balance['USDT']?.free || 0;

    if (usdtBalance < 5) {
      throw new Error(`Saldo insuficiente: $${usdtBalance.toFixed(2)} (mínimo $5)`);
    }

    // Obter preço atual
    const ticker = await exchange.fetchTicker(signal.symbol);
    const currentPrice = ticker.last;

    // Calcular posição (máximo $10 para teste)
    const maxOrderValue = Math.min(10, usdtBalance * 0.3);
    const quantity = maxOrderValue / currentPrice;

    console.log(`   📈 Preço atual ${signal.symbol}: $${currentPrice.toFixed(4)}`);
    console.log(`   💰 Valor da ordem: $${maxOrderValue.toFixed(2)}`);
    console.log(`   🔢 Quantidade: ${quantity.toFixed(6)}`);

    // Executar ordem se for ação de compra/venda
    let orderId = null;
    if (signal.action === 'BUY' || signal.action === 'SELL') {
      const order = await exchange.createMarketOrder(
        signal.symbol,
        signal.action.toLowerCase(),
        quantity
      );

      orderId = order.id;
      console.log(`   ✅ Ordem executada: ${order.id}`);

      // Registrar posição no banco
      const positionQuery = `
        INSERT INTO trading_positions (
          id, user_id, exchange_account_id, symbol, side, size,
          entry_price, leverage, status, webhook_signal_id,
          exchange_order_ids, opened_at, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5,
          $6, 1, 'OPEN', $7,
          $8::jsonb, NOW(), NOW(), NOW()
        ) RETURNING id
      `;

      const positionResult = await pool.query(positionQuery, [
        user.id,
        user.account_id,
        signal.symbol,
        signal.action,
        quantity,
        currentPrice,
        webhookId,
        JSON.stringify([orderId])
      ]);

      console.log(`   📊 Posição registrada: ${positionResult.rows[0].id}`);
    }

    await exchange.close();

    return {
      userId: user.id,
      email: user.email,
      success: true,
      orderId: orderId,
      symbol: signal.symbol,
      action: signal.action,
      quantity: quantity,
      price: currentPrice,
      value: maxOrderValue
    };

  } catch (error) {
    throw error;
  }
}

// ========================================
// UTILITÁRIOS
// ========================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ========================================
// MONITORAMENTO DE SAÚDE
// ========================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'MarketBot Trading System',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    environment: 'PRODUCTION'
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'MarketBot Trading System - ATIVO',
    webhook_url: '/api/webhooks/signal?token=210406',
    status: 'Aguardando sinais do TradingView...'
  });
});

// ========================================
// INICIALIZAR SERVIDOR
// ========================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🌟 SERVIDOR MARKETBOT ATIVO!`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`📡 Webhook: http://localhost:${PORT}/api/webhooks/signal?token=210406`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);
  console.log(`\n⚡ SISTEMA PRONTO PARA RECEBER SINAIS TRADINGVIEW!`);
  console.log(`🎯 Aguardando sinais em: https://coinbitclub-market-bot.up.railway.app/api/webhooks/signal?token=210406\n`);
});

// ========================================
// TRATAMENTO DE ERROS
// ========================================

process.on('uncaughtException', (error) => {
  console.error('❌ Erro não tratado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada:', reason);
});
