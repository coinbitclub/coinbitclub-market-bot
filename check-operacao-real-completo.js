// ========================================
// CHECK COMPLETO - VERIFICAR OPERAÇÃO REAL
// Validar se a ordem foi realmente executada na exchange
// ========================================

const { Pool } = require('pg');
const ccxt = require('ccxt');

// Configuração do banco de dados
const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
  ssl: { rejectUnauthorized: false }
});

async function checkOperacaoReal() {
  try {
    console.log('🔍 CHECK COMPLETO - VERIFICAÇÃO DA OPERAÇÃO');
    console.log('==========================================\n');

    const userEmail = 'pamaral15@hotmail.com';
    
    // 1. Buscar dados do usuário
    const queryUser = `
      SELECT 
        u.id, u.email,
        uea.id as account_id, uea.api_key, uea.api_secret, 
        uea.account_name
      FROM users u
      JOIN user_exchange_accounts uea ON u.id = uea.user_id
      WHERE u.email = $1 AND uea.is_testnet = false
    `;

    const userResult = await pool.query(queryUser, [userEmail]);
    const user = userResult.rows[0];

    console.log(`👤 Usuário: ${user.email}`);
    console.log(`🏦 Conta: ${user.account_name}\n`);

    // 2. Conectar com Bybit
    const exchange = new ccxt.bybit({
      apiKey: user.api_key,
      secret: user.api_secret,
      sandbox: false,
      enableRateLimit: true,
    });

    console.log('🔗 Conectando com Bybit MAINNET...\n');

    // 3. Verificar saldos atuais
    console.log('💰 VERIFICANDO SALDOS ATUAIS:');
    console.log('=============================');
    
    const balance = await exchange.fetchBalance();
    const usdtBalance = balance['USDT'] || { free: 0, used: 0, total: 0 };
    const linkBalance = balance['LINK'] || { free: 0, used: 0, total: 0 };

    console.log(`USDT: $${usdtBalance.free.toFixed(2)} (livre) + $${usdtBalance.used.toFixed(2)} (em uso) = $${usdtBalance.total.toFixed(2)} (total)`);
    console.log(`LINK: ${linkBalance.free.toFixed(6)} (livre) + ${linkBalance.used.toFixed(6)} (em uso) = ${linkBalance.total.toFixed(6)} (total)\n`);

    // 4. Verificar histórico de ordens LINK/USDT
    console.log('📋 VERIFICANDO HISTÓRICO DE ORDENS LINK/USDT:');
    console.log('==============================================');
    
    try {
      // Buscar ordens dos últimos 7 dias
      const since = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 dias atrás
      const orders = await exchange.fetchMyTrades('LINK/USDT', since, 10);
      
      if (orders.length === 0) {
        console.log('❌ NENHUMA ORDEM ENCONTRADA nos últimos 7 dias!');
        console.log('❌ A operação NÃO foi executada na exchange!\n');
      } else {
        console.log(`✅ ${orders.length} ordens encontradas:`);
        orders.forEach((order, index) => {
          const date = new Date(order.timestamp).toLocaleString('pt-BR');
          console.log(`${index + 1}. ${order.side.toUpperCase()} ${order.amount.toFixed(6)} LINK @ $${order.price.toFixed(4)}`);
          console.log(`   Data: ${date}`);
          console.log(`   Order ID: ${order.order}`);
          console.log(`   Trade ID: ${order.id}`);
          console.log(`   Valor: $${(order.amount * order.price).toFixed(2)} USD`);
          console.log(`   Taxa: ${order.fee?.cost || 0} ${order.fee?.currency || 'USD'}\n`);
        });
      }
    } catch (historyError) {
      console.log(`❌ Erro ao buscar histórico: ${historyError.message}`);
      
      // Tentar método alternativo - ordens abertas/fechadas
      try {
        console.log('\n🔄 Tentando método alternativo...');
        const openOrders = await exchange.fetchOpenOrders('LINK/USDT');
        const closedOrders = await exchange.fetchClosedOrders('LINK/USDT', undefined, 5);
        
        console.log(`Ordens abertas: ${openOrders.length}`);
        console.log(`Ordens fechadas recentes: ${closedOrders.length}`);
        
        if (closedOrders.length > 0) {
          console.log('\n📋 Últimas ordens fechadas:');
          closedOrders.forEach((order, index) => {
            const date = new Date(order.timestamp).toLocaleString('pt-BR');
            console.log(`${index + 1}. ${order.side.toUpperCase()} ${order.amount} ${order.symbol} @ $${order.price || 'MARKET'}`);
            console.log(`   Status: ${order.status} | Data: ${date}`);
            console.log(`   Order ID: ${order.id}\n`);
          });
        }
      } catch (altError) {
        console.log(`❌ Método alternativo também falhou: ${altError.message}`);
      }
    }

    // 5. Verificar posições abertas
    console.log('📊 VERIFICANDO POSIÇÕES ABERTAS:');
    console.log('================================');
    
    try {
      const positions = await exchange.fetchPositions(['LINK/USDT']);
      const linkPositions = positions.filter(pos => pos.symbol === 'LINK/USDT' && pos.contracts > 0);
      
      if (linkPositions.length === 0) {
        console.log('❌ NENHUMA POSIÇÃO LINK/USDT encontrada na exchange!');
      } else {
        linkPositions.forEach((pos, index) => {
          console.log(`${index + 1}. Posição ${pos.side.toUpperCase()}: ${pos.contracts} LINK`);
          console.log(`   Preço entrada: $${pos.entryPrice}`);
          console.log(`   Preço atual: $${pos.markPrice}`);
          console.log(`   PnL: $${pos.unrealizedPnl} (${pos.percentage}%)\n`);
        });
      }
    } catch (posError) {
      console.log(`⚠️ Não foi possível verificar posições: ${posError.message}`);
    }

    // 6. Verificar no banco de dados
    console.log('🗃️ VERIFICANDO REGISTROS NO BANCO:');
    console.log('==================================');
    
    const queryPositions = `
      SELECT 
        id, symbol, side, size, entry_price, status,
        exchange_order_ids, created_at
      FROM trading_positions 
      WHERE user_id = $1 
        AND symbol = 'LINK/USDT'
      ORDER BY created_at DESC
      LIMIT 5
    `;

    const positionsResult = await pool.query(queryPositions, [user.id]);
    
    if (positionsResult.rows.length === 0) {
      console.log('❌ Nenhuma posição LINK/USDT registrada no banco!');
    } else {
      console.log(`📊 ${positionsResult.rows.length} posições encontradas no banco:`);
      positionsResult.rows.forEach((pos, index) => {
        const date = new Date(pos.created_at).toLocaleString('pt-BR');
        console.log(`${index + 1}. ${pos.side} ${pos.size} LINK @ $${pos.entry_price}`);
        console.log(`   Status: ${pos.status} | Data: ${date}`);
        console.log(`   Position ID: ${pos.id}`);
        console.log(`   Exchange Orders: ${pos.exchange_order_ids || 'N/A'}\n`);
      });
    }

    // 7. Verificar logs do sistema
    console.log('📋 VERIFICANDO LOGS DO SISTEMA:');
    console.log('===============================');
    
    const queryLogs = `
      SELECT 
        event_type, success, details, created_at
      FROM system_monitoring 
      WHERE user_id = $1 
        AND (symbol = 'LINK/USDT' OR event_type LIKE '%TRADE%')
      ORDER BY created_at DESC
      LIMIT 5
    `;

    const logsResult = await pool.query(queryLogs, [user.id]);
    
    if (logsResult.rows.length === 0) {
      console.log('❌ Nenhum log de trading encontrado!');
    } else {
      console.log(`📋 ${logsResult.rows.length} logs encontrados:`);
      logsResult.rows.forEach((log, index) => {
        const date = new Date(log.created_at).toLocaleString('pt-BR');
        console.log(`${index + 1}. ${log.event_type} - ${log.success ? '✅ Sucesso' : '❌ Falha'}`);
        console.log(`   Data: ${date}`);
        if (log.details) {
          try {
            const details = JSON.parse(log.details);
            console.log(`   Detalhes: Order ID ${details.orderId || 'N/A'}`);
          } catch (e) {
            console.log(`   Detalhes: ${log.details}`);
          }
        }
        console.log('');
      });
    }

    await exchange.close();

    // 8. CONCLUSÃO FINAL
    console.log('🎯 CONCLUSÃO FINAL:');
    console.log('===================');
    
    // Análise baseada nos dados coletados
    const hasLinkBalance = linkBalance.total > 0;
    const hasRecentOrders = false; // será determinado pelos resultados acima
    const hasDbRecords = positionsResult.rows.length > 0;
    
    if (hasLinkBalance) {
      console.log(`✅ Saldo LINK detectado: ${linkBalance.total.toFixed(6)} LINK`);
      console.log('✅ Indica que ALGUMA operação foi executada');
    } else {
      console.log('❌ NENHUM saldo LINK detectado');
      console.log('❌ Indica que a operação NÃO foi executada na exchange');
    }
    
    if (hasDbRecords) {
      console.log('✅ Registros encontrados no banco de dados');
    } else {
      console.log('❌ Nenhum registro no banco de dados');
    }
    
    console.log('\n🚨 DIAGNÓSTICO:');
    
    if (hasLinkBalance && hasDbRecords) {
      console.log('✅ OPERAÇÃO CONFIRMADA - Dados consistentes');
    } else if (!hasLinkBalance && hasDbRecords) {
      console.log('⚠️ INCONSISTÊNCIA - Registro no banco mas sem saldo na exchange');
      console.log('💡 Possível: ordem cancelada, executada e vendida, ou erro na execução');
    } else if (hasLinkBalance && !hasDbRecords) {
      console.log('⚠️ INCONSISTÊNCIA - Saldo na exchange mas sem registro no banco');
      console.log('💡 Possível: operação manual ou falha no registro');
    } else {
      console.log('❌ OPERAÇÃO NÃO EXECUTADA - Nenhum dado confirma a execução');
    }

  } catch (error) {
    console.error('❌ Erro no check:', error);
  } finally {
    await pool.end();
  }
}

// Executar check
checkOperacaoReal().catch(console.error);
