// ========================================
// PRIMEIRA OPERAÇÃO REAL NA EXCHANGE
// Executar trade real de $3 LINKUSDT 
// ========================================

const { Pool } = require('pg');
const ccxt = require('ccxt');

// Configuração do banco de dados
const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
  ssl: { rejectUnauthorized: false }
});

async function executarPrimeiraOperacaoReal() {
  try {
    console.log('🎯 PRIMEIRA OPERAÇÃO REAL NA EXCHANGE');
    console.log('=====================================\n');

    // Escolher a Paloma (maior saldo: $236.70)
    const userEmail = 'pamaral15@hotmail.com';
    const orderValue = 3; // $3 USD (valor bem pequeno para teste)

    console.log(`👤 Usuário selecionado: ${userEmail}`);
    console.log(`💰 Valor da ordem: $${orderValue} USD\n`);

    // 1. Buscar dados do usuário
    const queryUser = `
      SELECT 
        u.id, u.email, u.plan_type,
        uea.id as account_id, uea.api_key, uea.api_secret, 
        uea.exchange, uea.is_testnet, uea.account_name
      FROM users u
      JOIN user_exchange_accounts uea ON u.id = uea.user_id
      WHERE u.email = $1 
        AND uea.is_active = true 
        AND uea.can_trade = true
        AND uea.is_testnet = false
    `;

    const userResult = await pool.query(queryUser, [userEmail]);
    
    if (userResult.rows.length === 0) {
      console.log('❌ Usuário não encontrado ou não habilitado para trading');
      return;
    }

    const user = userResult.rows[0];
    console.log(`✅ Usuário encontrado: ${user.account_name}`);

    // 2. Conectar com Bybit
    const exchange = new ccxt.bybit({
      apiKey: user.api_key,
      secret: user.api_secret,
      sandbox: false, // MAINNET REAL
      enableRateLimit: true,
    });

    console.log('🔗 Conectando com Bybit MAINNET...');

    // 3. Verificar saldo
    const balance = await exchange.fetchBalance();
    const usdtBalance = balance['USDT'];
    
    console.log(`💰 Saldo USDT: $${usdtBalance.free.toFixed(2)} (disponível)`);
    
    if (usdtBalance.free < orderValue) {
      console.log(`❌ Saldo insuficiente. Necessário: $${orderValue}`);
      await exchange.close();
      return;
    }

    // 4. Obter preço atual do LINK
    const ticker = await exchange.fetchTicker('LINK/USDT');
    const linkPrice = ticker.last;
    const linkQuantity = orderValue / linkPrice;

    console.log(`📈 Preço LINK atual: $${linkPrice.toFixed(4)}`);
    console.log(`🔢 Quantidade calculada: ${linkQuantity.toFixed(6)} LINK\n`);

    // 5. Calcular Stop Loss e Take Profit
    const stopLoss = linkPrice * 0.985; // -1.5% (conservador)
    const takeProfit = linkPrice * 1.03; // +3% (conservador)

    console.log(`🛡️ Stop Loss: $${stopLoss.toFixed(4)} (-1.5%)`);
    console.log(`🎯 Take Profit: $${takeProfit.toFixed(4)} (+3%)\n`);

    // 6. EXECUTAR ORDEM REAL NA EXCHANGE
    console.log('🚀 EXECUTANDO ORDEM REAL...');
    
    try {
      // Ordem de compra MARKET (execução imediata)
      const order = await exchange.createMarketBuyOrder('LINK/USDT', linkQuantity);
      
      console.log(`✅ ORDEM EXECUTADA COM SUCESSO!`);
      console.log(`   Order ID: ${order.id}`);
      console.log(`   Símbolo: ${order.symbol}`);
      console.log(`   Tipo: ${order.type}`);
      console.log(`   Lado: ${order.side}`);
      console.log(`   Quantidade: ${order.amount}`);
      console.log(`   Preço médio: $${order.price || 'MARKET'}`);
      console.log(`   Status: ${order.status}\n`);

      // 7. Registrar posição no banco de dados
      const positionQuery = `
        INSERT INTO trading_positions (
          id, user_id, exchange_account_id, symbol, side, size, 
          entry_price, leverage, stop_loss, take_profit, status,
          exchange_order_ids, opened_at, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, 'LINK/USDT', 'BUY', $3,
          $4, 1, $5, $6, 'OPEN',
          ARRAY[$7], NOW(), NOW(), NOW()
        ) RETURNING id
      `;

      const positionResult = await pool.query(positionQuery, [
        user.id,
        user.account_id,
        linkQuantity,
        order.price || linkPrice,
        stopLoss,
        takeProfit,
        order.id
      ]);

      const positionId = positionResult.rows[0].id;
      
      console.log(`📊 POSIÇÃO REGISTRADA NO BANCO:`);
      console.log(`   Position ID: ${positionId}`);
      console.log(`   Exchange Order ID: ${order.id}\n`);

      // 8. Verificar saldo após a compra
      const newBalance = await exchange.fetchBalance();
      const newUsdtBalance = newBalance['USDT'];
      const linkBalance = newBalance['LINK'] || { free: 0, used: 0, total: 0 };

      console.log(`💰 SALDOS APÓS COMPRA:`);
      console.log(`   USDT: $${newUsdtBalance.free.toFixed(2)} (era $${usdtBalance.free.toFixed(2)})`);
      console.log(`   LINK: ${linkBalance.total.toFixed(6)} LINK\n`);

      // 9. Log da operação para auditoria
      const logQuery = `
        INSERT INTO system_monitoring (
          event_type, user_id, position_id, symbol, exchange_used,
          amount_usd, execution_time_ms, success, details, created_at
        ) VALUES (
          'REAL_TRADE_EXECUTED', $1, $2, 'LINK/USDT', 'BYBIT',
          $3, 0, true, $4, NOW()
        )
      `;

      await pool.query(logQuery, [
        user.id,
        positionId,
        orderValue,
        JSON.stringify({
          orderId: order.id,
          priceExecuted: order.price || linkPrice,
          quantityExecuted: linkQuantity,
          stopLoss: stopLoss,
          takeProfit: takeProfit,
          balanceBefore: usdtBalance.free,
          balanceAfter: newUsdtBalance.free
        })
      ]);

      console.log('📋 Operação registrada no log de auditoria\n');

      console.log('🎉 PRIMEIRA OPERAÇÃO REAL CONCLUÍDA COM SUCESSO!');
      console.log('==============================================');
      console.log('✅ Sistema MarketBot FUNCIONANDO EM PRODUÇÃO');
      console.log('✅ Conexão Bybit MAINNET validada');
      console.log('✅ Execução de ordens reais funcionando');
      console.log('✅ Registro de posições funcionando');
      console.log('✅ Sistema de auditoria funcionando\n');

      console.log('🚀 PRÓXIMOS PASSOS:');
      console.log('1. Configurar webhooks TradingView');
      console.log('2. Implementar monitoramento automático SL/TP');
      console.log('3. Ativar sistema para todos os usuários');
      console.log('4. Deploy para produção final');

    } catch (orderError) {
      console.log(`❌ ERRO NA EXECUÇÃO DA ORDEM: ${orderError.message}`);
      
      // Log do erro
      const errorLogQuery = `
        INSERT INTO system_monitoring (
          event_type, user_id, symbol, exchange_used,
          amount_usd, execution_time_ms, success, error_message, created_at
        ) VALUES (
          'REAL_TRADE_FAILED', $1, 'LINK/USDT', 'BYBIT',
          $2, 0, false, $3, NOW()
        )
      `;

      await pool.query(errorLogQuery, [
        user.id,
        orderValue,
        orderError.message
      ]);
    }

    await exchange.close();

  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  } finally {
    await pool.end();
  }
}

// Confirmar execução
console.log('⚠️  ATENÇÃO: Esta operação executará um trade REAL na exchange Bybit!');
console.log('⚠️  Valor: $3 USD em LINK/USDT');
console.log('⚠️  Usuário: pamaral15@hotmail.com (Paloma)');
console.log('⚠️  Pressione Ctrl+C para cancelar ou aguarde 5 segundos...\n');

setTimeout(() => {
  executarPrimeiraOperacaoReal().catch(console.error);
}, 5000);
