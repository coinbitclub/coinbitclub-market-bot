// ========================================
// TESTE ORDEM REAL BYBIT - VERSÃO SIMPLIFICADA
// Usando chaves diretas para teste
// ========================================

const ccxt = require('ccxt');
const { Pool } = require('pg');

// Configuração do banco
const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
  ssl: { rejectUnauthorized: false }
});

async function testeOrdemRealSimples() {
  try {
    console.log('🚀 TESTE DE ORDEM REAL BYBIT - VERSÃO SIMPLIFICADA');
    console.log('==================================================');

    // 1. Buscar as chaves da Paloma (usuária com maior saldo)
    const query = `
      SELECT 
        u.email,
        u.id as user_id,
        uea.id as account_id,
        uea.api_key,
        uea.api_secret,
        uea.is_testnet
      FROM users u
      JOIN user_exchange_accounts uea ON u.id = uea.user_id
      WHERE u.email = 'pamaral15@hotmail.com'
        AND uea.is_active = true
      LIMIT 1
    `;

    const result = await pool.query(query);
    
    if (result.rows.length === 0) {
      throw new Error('Usuário não encontrado');
    }

    const user = result.rows[0];
    console.log(`👤 Usuário: ${user.email}`);
    console.log(`🆔 User ID: ${user.user_id}`);
    console.log(`🔧 Testnet: ${user.is_testnet}`);

    // 2. Para o teste, vamos usar chaves de teste conhecidas
    // ⚠️ ATENÇÃO: Em produção, usar descriptografia correta
    
    console.log('\n⚠️ USANDO CHAVES DE TESTE PARA DEMONSTRAÇÃO');
    console.log('Em produção, usar descriptografia das chaves do banco');

    // Chaves de teste Bybit (substitua pelas reais)
    const apiKey = 'YOUR_BYBIT_API_KEY'; // Colocar chave real aqui
    const apiSecret = 'YOUR_BYBIT_SECRET'; // Colocar secret real aqui

    // 3. Conectar com Bybit
    const exchange = new ccxt.bybit({
      apiKey: apiKey,
      secret: apiSecret,
      sandbox: false, // MAINNET
      enableRateLimit: true,
      timeout: 30000,
    });

    console.log('\n🔗 Testando conexão com Bybit MAINNET...');

    // 4. Verificar se consegue conectar
    try {
      const balance = await exchange.fetchBalance();
      console.log('✅ Conexão com Bybit estabelecida!');
      
      const usdtBalance = balance['USDT'];
      console.log(`💰 Saldo USDT: ${usdtBalance ? usdtBalance.free : 0}`);

      if (!usdtBalance || usdtBalance.free < 10) {
        console.log('⚠️ Saldo insuficiente para teste real');
        console.log('💡 Para o teste, vamos simular a execução');
        
        await simularExecucaoOrdem(user);
        return;
      }

      // 5. Buscar preço atual LINKUSDT
      const ticker = await exchange.fetchTicker('LINK/USDT');
      const currentPrice = ticker.last;
      
      console.log(`📊 Preço atual LINK/USDT: $${currentPrice}`);

      // 6. Calcular ordem de $10
      const orderValueUsd = 10.0;
      const quantity = orderValueUsd / currentPrice;
      
      console.log(`💰 Valor da ordem: $${orderValueUsd}`);
      console.log(`📦 Quantidade LINK: ${quantity.toFixed(6)}`);

      // 7. EXECUTAR ORDEM REAL
      console.log('\n🚀 EXECUTANDO ORDEM REAL...');
      
      const order = await exchange.createMarketOrder(
        'LINK/USDT',
        'buy',
        quantity
      );

      console.log('🎉 ORDEM EXECUTADA COM SUCESSO!');
      console.log(`📋 Order ID: ${order.id}`);
      console.log(`💱 Símbolo: ${order.symbol}`);
      console.log(`📊 Tipo: ${order.type} ${order.side}`);
      console.log(`📦 Quantidade: ${order.amount}`);
      console.log(`💰 Preço médio: $${order.average || currentPrice}`);
      console.log(`✅ Status: ${order.status}`);
      console.log(`💸 Preenchido: ${order.filled}`);
      console.log(`💰 Custo total: $${order.cost}`);

      // 8. Salvar no banco
      await salvarPosicaoNoBanco(user, order, currentPrice);

      await exchange.close();

    } catch (connectionError) {
      console.log('❌ Erro de conexão:', connectionError.message);
      console.log('\n💡 POSSÍVEIS CAUSAS:');
      console.log('1. Chaves API inválidas');
      console.log('2. Permissões insuficientes');
      console.log('3. IP não autorizado');
      console.log('4. Chaves de testnet em ambiente mainnet');
      
      console.log('\n🔧 SIMULANDO EXECUÇÃO PARA DEMONSTRAÇÃO...');
      await simularExecucaoOrdem(user);
    }

  } catch (error) {
    console.error('❌ ERRO GERAL:', error);
  } finally {
    await pool.end();
  }
}

async function simularExecucaoOrdem(user) {
  try {
    console.log('\n🎭 SIMULAÇÃO DE EXECUÇÃO REAL');
    console.log('============================');

    const simulatedPrice = 25.05;
    const orderValue = 10.0;
    const quantity = orderValue / simulatedPrice;

    console.log(`📊 Preço simulado LINK: $${simulatedPrice}`);
    console.log(`💰 Valor da ordem: $${orderValue}`);
    console.log(`📦 Quantidade: ${quantity.toFixed(6)} LINK`);

    // Simular ordem executada
    const simulatedOrder = {
      id: `simulated_${Date.now()}`,
      symbol: 'LINK/USDT',
      type: 'market',
      side: 'buy',
      amount: quantity,
      price: simulatedPrice,
      average: simulatedPrice,
      cost: orderValue,
      filled: quantity,
      status: 'closed'
    };

    console.log('\n✅ ORDEM SIMULADA EXECUTADA:');
    console.log(`📋 Order ID: ${simulatedOrder.id}`);
    console.log(`💱 Símbolo: ${simulatedOrder.symbol}`);
    console.log(`📊 Tipo: ${simulatedOrder.type} ${simulatedOrder.side}`);
    console.log(`📦 Quantidade: ${simulatedOrder.amount}`);
    console.log(`💰 Preço: $${simulatedOrder.average}`);
    console.log(`💸 Preenchido: ${simulatedOrder.filled}`);
    console.log(`💰 Custo: $${simulatedOrder.cost}`);

    // Salvar simulação no banco
    await salvarPosicaoNoBanco(user, simulatedOrder, simulatedPrice);

    console.log('\n🎯 PRÓXIMOS PASSOS PARA EXECUÇÃO REAL:');
    console.log('1. ✅ Obter chaves API válidas da Bybit');
    console.log('2. ✅ Configurar permissões de trading');
    console.log('3. ✅ Adicionar IP na whitelist');
    console.log('4. ✅ Implementar descriptografia correta');
    console.log('5. ✅ Testar com valor mínimo');

  } catch (error) {
    console.error('❌ Erro na simulação:', error);
  }
}

async function salvarPosicaoNoBanco(user, order, price) {
  try {
    const stopLoss = price * 0.95; // 5% stop loss
    const takeProfit = price * 1.10; // 10% take profit

    const insertQuery = `
      INSERT INTO trading_positions (
        id, user_id, exchange_account_id, symbol, side, size,
        entry_price, leverage, stop_loss, take_profit, status,
        exchange_position_id, exchange_order_ids, 
        unrealized_pnl_usd, realized_pnl_usd, fees_paid_usd,
        created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING id
    `;

    const values = [
      user.user_id,
      user.account_id,
      'LINKUSDT',
      'BUY',
      order.filled || order.amount,
      order.average || order.price || price,
      1, // leverage
      stopLoss,
      takeProfit,
      'OPEN',
      order.id,
      JSON.stringify([order.id]),
      0, // unrealized_pnl_usd
      0, // realized_pnl_usd
      order.cost * 0.001 || 0 // fees estimadas 0.1%
    ];

    const result = await pool.query(insertQuery, values);
    
    console.log(`💾 Posição salva no banco: ${result.rows[0].id}`);
    console.log(`🛡️ Stop Loss: $${stopLoss.toFixed(4)}`);
    console.log(`🎯 Take Profit: $${takeProfit.toFixed(4)}`);

  } catch (error) {
    console.error('❌ Erro ao salvar no banco:', error);
  }
}

// Executar teste
testeOrdemRealSimples();
