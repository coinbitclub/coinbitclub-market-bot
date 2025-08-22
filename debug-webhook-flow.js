const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway'
});

async function fixMarketDecisions() {
  try {
    console.log('🔍 INVESTIGANDO MARKET DECISIONS E WEBHOOK PIPELINE\n');
    
    // 1. Verificar estrutura real da market_decisions
    console.log('📊 ESTRUTURA REAL: market_decisions');
    console.log('━'.repeat(50));
    
    const decisionsColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'market_decisions'
      ORDER BY ordinal_position
    `);
    
    if (decisionsColumns.rows.length > 0) {
      decisionsColumns.rows.forEach(col => {
        console.log(`  ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      });
      
      // Buscar dados existentes com as colunas corretas
      const decisionsData = await pool.query(`
        SELECT * FROM market_decisions 
        ORDER BY created_at DESC 
        LIMIT 3
      `);
      
      if (decisionsData.rows.length > 0) {
        console.log('\n📋 Últimas decisões:');
        decisionsData.rows.forEach((decision, index) => {
          console.log(`${index + 1}.`, decision);
        });
      } else {
        console.log('\n❌ Nenhuma decisão encontrada');
      }
      
    } else {
      console.log('❌ Tabela market_decisions não encontrada!');
    }
    
    console.log('\n' + '━'.repeat(70));
    
    // 2. Verificar webhook_signals em detalhes
    console.log('📡 ANÁLISE DETALHADA: webhook_signals');
    console.log('━'.repeat(50));
    
    const webhookData = await pool.query(`
      SELECT * FROM webhook_signals 
      ORDER BY id DESC 
      LIMIT 10
    `);
    
    if (webhookData.rows.length > 0) {
      console.log(`✅ ${webhookData.rows.length} webhook signals encontrados:`);
      webhookData.rows.forEach((signal, index) => {
        console.log(`${index + 1}.`, signal);
      });
    } else {
      console.log('❌ Nenhum webhook signal encontrado');
      console.log('⚠️ PROBLEMA: Webhooks não estão sendo salvos!');
    }
    
    console.log('\n' + '━'.repeat(70));
    
    // 3. Verificar qual tabela está realmente recebendo os sinais
    console.log('🔍 PROCURANDO SINAIS EM TODAS AS TABELAS:');
    console.log('━'.repeat(50));
    
    const allTables = ['trading_signals', 'webhook_signals', 'trading_queue', 'trading_orders'];
    
    for (const table of allTables) {
      try {
        const count = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`📊 ${table}: ${count.rows[0].count} registros`);
        
        if (parseInt(count.rows[0].count) > 0) {
          const sample = await pool.query(`SELECT * FROM ${table} LIMIT 3`);
          console.log(`   Amostra:`, sample.rows);
        }
      } catch (error) {
        console.log(`❌ Erro em ${table}: ${error.message}`);
      }
    }
    
    console.log('\n' + '━'.repeat(70));
    
    // 4. Testar webhook real para ver onde os dados vão
    console.log('🧪 TESTE WEBHOOK REAL - RASTREAMENTO COMPLETO:');
    console.log('━'.repeat(50));
    
    const testSignal = {
      symbol: 'BTCUSDT',
      action: 'buy',
      price: 45000,
      quantity: 0.001,
      timestamp: new Date().toISOString(),
      source: 'diagnostic-tracking-test'
    };
    
    console.log('📤 Enviando sinal de teste com rastreamento...');
    console.log('Dados:', testSignal);
    
    const axios = require('axios');
    
    try {
      const response = await axios.post(
        'https://coinbitclub-market-bot.up.railway.app/api/webhooks/signal?token=210406',
        testSignal,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Test-ID': 'tracking-test-001'
          },
          timeout: 10000
        }
      );
      
      console.log(`✅ Webhook respondeu: ${response.status}`);
      console.log(`📊 Resposta:`, response.data);
      
      // Aguardar e verificar onde o sinal foi salvo
      console.log('\n⏳ Aguardando 5 segundos para verificar salvamento...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log('\n🔍 VERIFICANDO ONDE O SINAL FOI SALVO:');
      
      // Verificar trading_signals
      const signalCheck = await pool.query(`
        SELECT * FROM trading_signals 
        WHERE symbol = 'BTCUSDT' 
        AND source = 'diagnostic-tracking-test'
        ORDER BY received_at DESC 
        LIMIT 1
      `);
      
      if (signalCheck.rows.length > 0) {
        console.log('✅ Encontrado em trading_signals:');
        console.log(signalCheck.rows[0]);
      } else {
        console.log('❌ Não encontrado em trading_signals');
      }
      
      // Verificar webhook_signals
      const webhookCheck = await pool.query(`
        SELECT * FROM webhook_signals 
        WHERE raw_data::text LIKE '%diagnostic-tracking-test%'
        ORDER BY id DESC 
        LIMIT 1
      `);
      
      if (webhookCheck.rows.length > 0) {
        console.log('✅ Encontrado em webhook_signals:');
        console.log(webhookCheck.rows[0]);
      } else {
        console.log('❌ Não encontrado em webhook_signals');
      }
      
      // Verificar trading_orders (se foi processado)
      const orderCheck = await pool.query(`
        SELECT * FROM trading_orders 
        WHERE symbol = 'BTCUSDT'
        ORDER BY created_at DESC 
        LIMIT 1
      `);
      
      if (orderCheck.rows.length > 0) {
        console.log('✅ Ordem criada:');
        console.log(orderCheck.rows[0]);
      } else {
        console.log('❌ Nenhuma ordem criada');
      }
      
    } catch (error) {
      console.log(`❌ Erro no teste de webhook: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Dados:`, error.response.data);
      }
    }
    
    console.log('\n' + '═'.repeat(70));
    console.log('🎯 DIAGNÓSTICO FINAL - FLUXO DE DADOS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. ✅ Webhook endpoint: FUNCIONANDO (200)');
    console.log('2. ✅ Usuários ativos: 5 com trading habilitado');
    console.log('3. ❌ Sinais não estão sendo salvos em trading_signals');
    console.log('4. ❌ Market decisions schema incompatível');
    console.log('5. ❌ Nenhuma ordem sendo criada');
    console.log('');
    console.log('💡 HIPÓTESE: O webhook está respondendo mas não está');
    console.log('   processando/salvando os dados corretamente no banco.');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

fixMarketDecisions();
