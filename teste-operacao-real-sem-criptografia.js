// ========================================
// TESTE REAL - OPERAÇÃO SEM CRIPTOGRAFIA
// Validar trading com chaves em texto plano
// ========================================

const { Pool } = require('pg');
const ccxt = require('ccxt');

// Configuração do banco de dados
const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
  ssl: { rejectUnauthorized: false }
});

async function testarOperacaoReal() {
  try {
    console.log('🚀 TESTE REAL - OPERAÇÃO SEM CRIPTOGRAFIA');
    console.log('==========================================\n');

    // 1. Buscar usuários MAINNET
    const queryUsers = `
      SELECT 
        u.id, u.email, u.plan_type,
        uea.id as account_id, uea.api_key, uea.api_secret, 
        uea.exchange, uea.is_testnet, uea.account_name
      FROM users u
      JOIN user_exchange_accounts uea ON u.id = uea.user_id
      WHERE uea.is_active = true 
        AND uea.can_trade = true
        AND uea.is_testnet = false
      ORDER BY u.email
    `;

    const usersResult = await pool.query(queryUsers);
    console.log(`📊 Usuários MAINNET encontrados: ${usersResult.rows.length}\n`);

    if (usersResult.rows.length === 0) {
      console.log('❌ Nenhum usuário MAINNET encontrado');
      return;
    }

    // 2. Testar conexão direta com as chaves (sem descriptografia)
    const results = [];
    
    for (const user of usersResult.rows) {
      try {
        console.log(`🔍 Testando usuário: ${user.email}`);
        console.log(`   Exchange: ${user.exchange}`);
        console.log(`   Account: ${user.account_name}`);
        console.log(`   Testnet: ${user.is_testnet}`);

        // Criar conexão CCXT diretamente
        const exchange = new ccxt.bybit({
          apiKey: user.api_key,     // DIRETO DO BANCO (SEM DESCRIPTOGRAFIA)
          secret: user.api_secret,  // DIRETO DO BANCO (SEM DESCRIPTOGRAFIA)
          sandbox: user.is_testnet,
          enableRateLimit: true,
        });

        // Testar saldo
        const balance = await exchange.fetchBalance();
        const usdtBalance = balance['USDT'] || { free: 0, used: 0, total: 0 };

        console.log(`   ✅ Conexão OK! Saldo USDT: $${usdtBalance.free.toFixed(2)}`);

        // Testar preço LINKUSDT
        const ticker = await exchange.fetchTicker('LINK/USDT');
        const linkPrice = ticker.last;

        console.log(`   📈 Preço LINK: $${linkPrice.toFixed(4)}`);

        // Calcular quantidade para $5 (teste menor)
        const orderValue = 5; // $5 USD
        const linkQuantity = orderValue / linkPrice;

        console.log(`   💰 Ordem teste: $${orderValue} = ${linkQuantity.toFixed(6)} LINK\n`);

        // Simular criação de posição no banco (sem executar ordem real)
        const positionQuery = `
          INSERT INTO trading_positions (
            id, user_id, exchange_account_id, symbol, side, size, 
            entry_price, leverage, stop_loss, take_profit, status,
            opened_at, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), $1, $2, 'LINK/USDT', 'BUY', $3,
            $4, 1, $5, $6, 'OPEN',
            NOW(), NOW(), NOW()
          ) RETURNING id
        `;

        const stopLoss = linkPrice * 0.98; // -2%
        const takeProfit = linkPrice * 1.04; // +4%

        const positionResult = await pool.query(positionQuery, [
          user.id,
          user.account_id,
          linkQuantity,
          linkPrice,
          stopLoss,
          takeProfit
        ]);

        console.log(`   ✅ Posição criada: ${positionResult.rows[0].id}`);

        results.push({
          user: user.email,
          exchange: user.exchange,
          success: true,
          balance: usdtBalance.free,
          linkPrice: linkPrice,
          positionId: positionResult.rows[0].id
        });

        await exchange.close();

      } catch (error) {
        console.log(`   ❌ ERRO: ${error.message}`);
        results.push({
          user: user.email,
          exchange: user.exchange,
          success: false,
          error: error.message
        });
      }

      console.log('-------------------\n');
    }

    // 3. Resumo final
    console.log('📊 RESULTADO FINAL:');
    console.log('====================');
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`✅ Sucessos: ${successful.length}/${results.length}`);
    console.log(`❌ Falhas: ${failed.length}/${results.length}`);
    console.log(`📈 Taxa de sucesso: ${((successful.length / results.length) * 100).toFixed(1)}%\n`);

    if (successful.length > 0) {
      console.log('🎉 OPERAÇÕES BEM-SUCEDIDAS:');
      successful.forEach(result => {
        console.log(`   ✅ ${result.user}: $${result.balance.toFixed(2)} USDT`);
        console.log(`      Posição: ${result.positionId}`);
      });
    }

    if (failed.length > 0) {
      console.log('\n⚠️ OPERAÇÕES COM ERRO:');
      failed.forEach(result => {
        console.log(`   ❌ ${result.user}: ${result.error}`);
      });
    }

    console.log('\n🎯 RESULTADO:');
    if (successful.length === results.length) {
      console.log('✅ TODAS as operações funcionaram SEM CRIPTOGRAFIA!');
      console.log('✅ Sistema pronto para trading real!');
    } else if (successful.length > 0) {
      console.log('⚠️ Algumas operações funcionaram - investigar falhas');
    } else {
      console.log('❌ Nenhuma operação funcionou - verificar configuração');
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await pool.end();
  }
}

// Executar teste
testarOperacaoReal().catch(console.error);
