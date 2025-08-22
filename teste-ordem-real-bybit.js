// ========================================
// TESTE DE EXECUÇÃO REAL NA EXCHANGE BYBIT
// Script para executar ordem real na Bybit
// ========================================

const { Pool } = require('pg');
const ccxt = require('ccxt');
const crypto = require('crypto');

// Configuração do banco
const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
  ssl: { rejectUnauthorized: false }
});

// Chave de criptografia (mesma do sistema)
const ENCRYPTION_KEY = 'marketbot-default-key-change-in-production';

// Função para descriptografar (método atualizado)
function decrypt(encryptedText) {
  try {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const iv = Buffer.alloc(16, 0); // IV fixo para compatibilidade
    
    const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('❌ Erro ao descriptografar:', error);
    throw new Error('Falha na descriptografia');
  }
}

async function executarOrdemReal() {
  try {
    console.log('🚀 INICIANDO TESTE DE ORDEM REAL NA BYBIT');
    console.log('====================================');

    // 1. Buscar usuário com maior saldo (Paloma)
    const userQuery = `
      SELECT 
        u.email,
        uea.id as account_id,
        uea.api_key,
        uea.api_secret,
        uea.is_testnet,
        uea.exchange
      FROM users u
      JOIN user_exchange_accounts uea ON u.id = uea.user_id
      WHERE u.email = 'pamaral15@hotmail.com'
        AND uea.is_active = true
        AND uea.can_trade = true
      LIMIT 1
    `;

    const userResult = await pool.query(userQuery);
    
    if (userResult.rows.length === 0) {
      throw new Error('Usuário Paloma não encontrado');
    }

    const user = userResult.rows[0];
    console.log(`👤 Usuário: ${user.email}`);
    console.log(`🏦 Exchange: ${user.exchange}`);
    console.log(`🔧 Testnet: ${user.is_testnet}`);

    // 2. Descriptografar credenciais
    const apiKey = decrypt(user.api_key);
    const apiSecret = decrypt(user.api_secret);

    console.log(`🔑 API Key: ${apiKey.substring(0, 8)}...`);

    // 3. Conectar com Bybit
    const exchange = new ccxt.bybit({
      apiKey: apiKey,
      secret: apiSecret,
      sandbox: user.is_testnet,
      enableRateLimit: true,
      timeout: 30000,
    });

    console.log('\n🔗 Conectando com Bybit...');

    // 4. Verificar saldo atual
    const balance = await exchange.fetchBalance();
    const usdtBalance = balance['USDT'];
    
    console.log(`💰 Saldo USDT: ${usdtBalance.free} (livre: ${usdtBalance.free}, usado: ${usdtBalance.used})`);

    if (usdtBalance.free < 5) {
      throw new Error(`Saldo insuficiente: ${usdtBalance.free} USDT (mínimo: 5 USDT)`);
    }

    // 5. Buscar preço atual do LINKUSDT
    const ticker = await exchange.fetchTicker('LINK/USDT');
    const currentPrice = ticker.last;
    
    console.log(`📊 Preço atual LINK/USDT: $${currentPrice}`);

    // 6. Calcular quantidade para $5 USD (ordem pequena para teste)
    const orderValueUsd = 5.0;
    const quantity = orderValueUsd / currentPrice;
    
    console.log(`📈 Valor da ordem: $${orderValueUsd}`);
    console.log(`📦 Quantidade LINK: ${quantity}`);

    // 7. Calcular Stop Loss e Take Profit
    const stopLossPrice = currentPrice * 0.98; // 2% abaixo
    const takeProfitPrice = currentPrice * 1.04; // 4% acima
    
    console.log(`🛡️ Stop Loss: $${stopLossPrice.toFixed(4)}`);
    console.log(`🎯 Take Profit: $${takeProfitPrice.toFixed(4)}`);

    // 8. EXECUTAR ORDEM REAL DE COMPRA
    console.log('\n🚀 EXECUTANDO ORDEM REAL...');
    
    const order = await exchange.createMarketOrder(
      'LINK/USDT',
      'buy',
      quantity,
      undefined, // market order não precisa de preço
      {
        timeInForce: 'IOC' // Immediate or Cancel
      }
    );

    console.log('✅ ORDEM EXECUTADA COM SUCESSO!');
    console.log(`📋 Order ID: ${order.id}`);
    console.log(`💱 Símbolo: ${order.symbol}`);
    console.log(`📊 Tipo: ${order.type} ${order.side}`);
    console.log(`📦 Quantidade: ${order.amount}`);
    console.log(`💰 Preço médio: $${order.average || 'N/A'}`);
    console.log(`✅ Status: ${order.status}`);
    console.log(`💸 Preenchido: ${order.filled}`);
    console.log(`💰 Custo: $${order.cost}`);

    // 9. Verificar se a ordem foi preenchida
    if (order.status === 'closed' && order.filled > 0) {
      console.log('\n🎉 ORDEM PREENCHIDA COM SUCESSO!');
      
      // 10. Configurar Stop Loss (ordem condicional)
      try {
        console.log('\n🛡️ Configurando Stop Loss...');
        
        const stopOrder = await exchange.createOrder(
          'LINK/USDT',
          'market',
          'sell',
          order.filled,
          undefined,
          {
            stopPrice: stopLossPrice,
            type: 'stop'
          }
        );
        
        console.log(`✅ Stop Loss configurado: ${stopOrder.id}`);
      } catch (slError) {
        console.log(`⚠️ Erro ao configurar Stop Loss: ${slError.message}`);
      }

      // 11. Configurar Take Profit (ordem limit)
      try {
        console.log('🎯 Configurando Take Profit...');
        
        const tpOrder = await exchange.createLimitOrder(
          'LINK/USDT',
          'sell',
          order.filled,
          takeProfitPrice
        );
        
        console.log(`✅ Take Profit configurado: ${tpOrder.id}`);
      } catch (tpError) {
        console.log(`⚠️ Erro ao configurar Take Profit: ${tpError.message}`);
      }

      // 12. Salvar posição no banco de dados
      const insertQuery = `
        INSERT INTO trading_positions (
          id, user_id, exchange_account_id, symbol, side, size, 
          entry_price, leverage, stop_loss, take_profit, status,
          exchange_position_id, exchange_order_ids, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), 
          (SELECT id FROM users WHERE email = $1),
          $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) RETURNING id
      `;

      const insertResult = await pool.query(insertQuery, [
        user.email,
        user.account_id,
        'LINKUSDT',
        'BUY',
        order.filled,
        order.average || currentPrice,
        1, // sem alavancagem
        stopLossPrice,
        takeProfitPrice,
        'OPEN',
        order.id,
        JSON.stringify([order.id])
      ]);

      console.log(`💾 Posição salva no banco: ${insertResult.rows[0].id}`);

    } else {
      console.log('❌ Ordem não foi preenchida completamente');
      console.log(`Status: ${order.status}, Preenchido: ${order.filled}`);
    }

    // 13. Verificar saldo após a compra
    console.log('\n📊 Verificando saldo após a compra...');
    const newBalance = await exchange.fetchBalance();
    const newUsdtBalance = newBalance['USDT'];
    const linkBalance = newBalance['LINK'];

    console.log(`💰 Novo saldo USDT: ${newUsdtBalance.free}`);
    console.log(`🔗 Saldo LINK: ${linkBalance ? linkBalance.total : 0}`);

    // 14. Relatório final
    console.log('\n📋 RELATÓRIO FINAL');
    console.log('================');
    console.log(`✅ Ordem executada: ${order.id}`);
    console.log(`💰 Valor investido: $${order.cost}`);
    console.log(`🔗 LINK comprado: ${order.filled}`);
    console.log(`📊 Preço médio: $${order.average}`);
    console.log(`🛡️ Stop Loss: $${stopLossPrice.toFixed(4)}`);
    console.log(`🎯 Take Profit: $${takeProfitPrice.toFixed(4)}`);

    await exchange.close();

  } catch (error) {
    console.error('❌ ERRO NA EXECUÇÃO:', error);
    
    if (error.message.includes('Insufficient balance')) {
      console.log('💡 Solução: Verifique se há saldo suficiente na exchange');
    } else if (error.message.includes('Invalid symbol')) {
      console.log('💡 Solução: Verifique se LINK/USDT está disponível na Bybit');
    } else if (error.message.includes('Min order size')) {
      console.log('💡 Solução: Aumentar valor da ordem ou usar símbolo diferente');
    }
  } finally {
    await pool.end();
  }
}

// Executar teste
executarOrdemReal();
