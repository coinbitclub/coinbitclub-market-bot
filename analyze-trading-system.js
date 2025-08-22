const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway'
});

async function analyzeTrading() {
  try {
    console.log('🎯 ANÁLISE DETALHADA DO SISTEMA DE TRADING\n');
    
    // 1. Verificar estrutura da tabela trading_signals
    console.log('📊 ESTRUTURA: trading_signals');
    console.log('━'.repeat(50));
    
    const signalsColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'trading_signals'
      ORDER BY ordinal_position
    `);
    
    if (signalsColumns.rows.length > 0) {
      signalsColumns.rows.forEach(col => {
        console.log(`  ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      });
      
      // Verificar dados existentes
      const signalsCount = await pool.query('SELECT COUNT(*) as count FROM trading_signals');
      console.log(`\n📊 Total de sinais: ${signalsCount.rows[0].count}`);
      
      if (parseInt(signalsCount.rows[0].count) > 0) {
        const recentSignals = await pool.query(`
          SELECT * FROM trading_signals 
          ORDER BY id DESC 
          LIMIT 5
        `);
        console.log('\n📋 Últimos 5 sinais:');
        recentSignals.rows.forEach((signal, index) => {
          console.log(`${index + 1}.`, signal);
        });
      }
      
    } else {
      console.log('❌ Tabela trading_signals não encontrada!');
    }
    
    console.log('\n' + '━'.repeat(70));
    
    // 2. Verificar estrutura da tabela trading_orders
    console.log('📊 ESTRUTURA: trading_orders');
    console.log('━'.repeat(50));
    
    const ordersColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'trading_orders'
      ORDER BY ordinal_position
    `);
    
    if (ordersColumns.rows.length > 0) {
      ordersColumns.rows.forEach(col => {
        console.log(`  ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      });
      
      // Verificar dados existentes
      const ordersCount = await pool.query('SELECT COUNT(*) as count FROM trading_orders');
      console.log(`\n📊 Total de ordens: ${ordersCount.rows[0].count}`);
      
      if (parseInt(ordersCount.rows[0].count) > 0) {
        const recentOrders = await pool.query(`
          SELECT * FROM trading_orders 
          ORDER BY id DESC 
          LIMIT 5
        `);
        console.log('\n📋 Últimas 5 ordens:');
        recentOrders.rows.forEach((order, index) => {
          console.log(`${index + 1}.`, order);
        });
      }
      
    } else {
      console.log('❌ Tabela trading_orders não encontrada!');
    }
    
    console.log('\n' + '━'.repeat(70));
    
    // 3. Verificar usuários com trading habilitado
    console.log('👥 USUÁRIOS COM TRADING HABILITADO:');
    console.log('━'.repeat(50));
    
    const activeUsers = await pool.query(`
      SELECT 
        id,
        email,
        first_name,
        last_name,
        enable_trading,
        account_balance_usd,
        max_concurrent_positions,
        user_status,
        plan_type,
        created_at
      FROM users 
      WHERE enable_trading = true
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    if (activeUsers.rows.length > 0) {
      console.log(`✅ ${activeUsers.rows.length} usuários com trading habilitado:`);
      activeUsers.rows.forEach((user, index) => {
        console.log(`${index + 1}. ${user.first_name} ${user.last_name} (${user.email})`);
        console.log(`   Balance: $${parseFloat(user.account_balance_usd || 0).toFixed(2)}`);
        console.log(`   Status: ${user.user_status} | Plano: ${user.plan_type}`);
        console.log(`   Max posições: ${user.max_concurrent_positions}`);
        console.log('');
      });
    } else {
      console.log('❌ NENHUM USUÁRIO COM TRADING HABILITADO!');
      console.log('⚠️ PROBLEMA CRÍTICO: Sem usuários ativos, nenhuma ordem será criada!');
    }
    
    console.log('\n' + '━'.repeat(70));
    
    // 4. Verificar Market Intelligence
    console.log('🧠 MARKET INTELLIGENCE - ÚLTIMAS DECISÕES:');
    console.log('━'.repeat(50));
    
    const decisions = await pool.query(`
      SELECT 
        allow_long,
        allow_short,
        confidence,
        market_pulse,
        fear_greed,
        btc_dominance,
        reasoning,
        created_at
      FROM market_decisions 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    if (decisions.rows.length > 0) {
      console.log(`✅ ${decisions.rows.length} decisões encontradas:`);
      decisions.rows.forEach((decision, index) => {
        const timestamp = new Date(decision.created_at).toLocaleString('pt-BR');
        console.log(`${index + 1}. ${timestamp}`);
        console.log(`   Market Pulse: ${parseFloat(decision.market_pulse).toFixed(1)}%`);
        console.log(`   F&G: ${decision.fear_greed} | BTC Dom: ${parseFloat(decision.btc_dominance).toFixed(1)}%`);
        console.log(`   LONG: ${decision.allow_long ? '✅' : '❌'} | SHORT: ${decision.allow_short ? '✅' : '❌'}`);
        console.log(`   Confiança: ${decision.confidence}% | Razão: ${decision.reasoning || 'N/A'}`);
        console.log('');
      });
      
      const lastDecision = decisions.rows[0];
      if (!lastDecision.allow_long && !lastDecision.allow_short) {
        console.log('⚠️ PROBLEMA: Market Intelligence BLOQUEOU todas as operações!');
        console.log('   Tanto LONG quanto SHORT estão desabilitados.');
      }
      
    } else {
      console.log('❌ NENHUMA DECISÃO DE MARKET INTELLIGENCE ENCONTRADA!');
    }
    
    console.log('\n' + '━'.repeat(70));
    
    // 5. Verificar configurações do sistema
    console.log('⚙️ CONFIGURAÇÕES CRÍTICAS DO SISTEMA:');
    console.log('━'.repeat(50));
    
    try {
      const configs = await pool.query(`
        SELECT key, value, updated_at
        FROM system_settings 
        WHERE key LIKE '%trading%' 
        OR key LIKE '%webhook%'
        OR key LIKE '%maintenance%'
        ORDER BY key
      `);
      
      if (configs.rows.length > 0) {
        configs.rows.forEach(config => {
          console.log(`  ${config.key}: ${config.value}`);
        });
      } else {
        console.log('⚠️ Nenhuma configuração crítica encontrada');
      }
    } catch (error) {
      console.log(`❌ Erro ao buscar configurações: ${error.message}`);
    }
    
    console.log('\n' + '━'.repeat(70));
    
    // 6. Verificar webhook_signals (nova tabela descoberta)
    console.log('📡 WEBHOOK SIGNALS (tabela descoberta):');
    console.log('━'.repeat(50));
    
    const webhookColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'webhook_signals'
      ORDER BY ordinal_position
    `);
    
    if (webhookColumns.rows.length > 0) {
      console.log('Estrutura da webhook_signals:');
      webhookColumns.rows.forEach(col => {
        console.log(`  ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      });
      
      const webhookCount = await pool.query('SELECT COUNT(*) as count FROM webhook_signals');
      console.log(`\n📊 Total de webhook signals: ${webhookCount.rows[0].count}`);
      
      if (parseInt(webhookCount.rows[0].count) > 0) {
        const recentWebhooks = await pool.query(`
          SELECT * FROM webhook_signals 
          ORDER BY id DESC 
          LIMIT 5
        `);
        console.log('\n📋 Últimos 5 webhook signals:');
        recentWebhooks.rows.forEach((signal, index) => {
          console.log(`${index + 1}.`, signal);
        });
      }
    }
    
    console.log('\n' + '═'.repeat(70));
    console.log('🎯 DIAGNÓSTICO FINAL - POR QUE NENHUMA OPERAÇÃO FOI ABERTA:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Calcular problemas encontrados
    let problems = [];
    
    // Verificar usuários ativos
    const userCheck = await pool.query('SELECT COUNT(*) as count FROM users WHERE enable_trading = true');
    if (parseInt(userCheck.rows[0].count) === 0) {
      problems.push('❌ CRÍTICO: Nenhum usuário com trading habilitado');
    }
    
    // Verificar market intelligence
    if (decisions.rows.length > 0) {
      const lastDecision = decisions.rows[0];
      if (!lastDecision.allow_long && !lastDecision.allow_short) {
        problems.push('❌ CRÍTICO: Market Intelligence bloqueou todas as operações');
      }
    } else {
      problems.push('❌ CRÍTICO: Market Intelligence não está funcionando');
    }
    
    // Verificar sinais
    const signalsCheck = await pool.query('SELECT COUNT(*) as count FROM trading_signals');
    if (parseInt(signalsCheck.rows[0].count) === 0) {
      problems.push('⚠️ Nenhum sinal de trading recebido');
    }
    
    if (problems.length > 0) {
      console.log('PROBLEMAS IDENTIFICADOS:');
      problems.forEach(problem => console.log(`  ${problem}`));
    } else {
      console.log('✅ Nenhum problema crítico identificado');
    }
    
    console.log('\n📋 PRÓXIMAS AÇÕES RECOMENDADAS:');
    console.log('1. ✅ Criar usuário de teste com trading habilitado');
    console.log('2. ✅ Verificar se Market Intelligence está permitindo trades');
    console.log('3. ✅ Testar fluxo completo de webhook → signal → order');
    console.log('4. ✅ Validar configurações de sistema');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

analyzeTrading();
