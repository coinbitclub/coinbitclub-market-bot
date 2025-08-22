const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway'
});

async function analyzeStrongSignals() {
  try {
    console.log('🎯 ANÁLISE ESPECÍFICA DOS SINAIS FORTES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // 1. Buscar todos os sinais FORTES no raw_data
    console.log('📊 SINAIS FORTES RECEBIDOS:');
    const strongSignals = await pool.query(`
      SELECT 
        webhook_id,
        raw_data,
        parsed_data,
        processed,
        error_message,
        created_at
      FROM webhook_signals 
      WHERE raw_data::text ILIKE '%FORTE%'
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log(`🎯 Total de sinais FORTES encontrados: ${strongSignals.rows.length}`);
    
    if (strongSignals.rows.length > 0) {
      console.log('\n📋 DETALHES DOS SINAIS FORTES:');
      strongSignals.rows.forEach((signal, index) => {
        console.log(`\n${index + 1}. Webhook ID: ${signal.webhook_id}`);
        console.log(`   Data: ${new Date(signal.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
        console.log(`   Processado: ${signal.processed ? '✅' : '❌'}`);
        
        // Mostrar o conteúdo real do raw_data
        try {
          const rawData = signal.raw_data;
          console.log(`   Raw Data:`, rawData);
          
          if (rawData.action) {
            console.log(`   🎯 AÇÃO: ${rawData.action}`);
          }
          if (rawData.ticker) {
            console.log(`   💰 ATIVO: ${rawData.ticker}`);
          }
          if (rawData.price) {
            console.log(`   💲 PREÇO: ${rawData.price}`);
          }
          
        } catch (err) {
          console.log(`   ❌ Erro ao parsear raw_data: ${err.message}`);
        }
        
        if (signal.parsed_data) {
          console.log(`   Parsed Data:`, signal.parsed_data);
        } else {
          console.log(`   ❌ Parsed Data: NULL (PROBLEMA!)`);
        }
        
        if (signal.error_message) {
          console.log(`   ❌ Erro: ${signal.error_message}`);
        }
      });
    }
    
    // 2. Verificar a lógica de processamento
    console.log('\n🔍 ANÁLISE DO PROBLEMA DE PROCESSAMENTO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const processedCount = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN processed = true THEN 1 END) as processed,
        COUNT(CASE WHEN parsed_data IS NOT NULL THEN 1 END) as with_parsed_data,
        COUNT(CASE WHEN error_message IS NOT NULL THEN 1 END) as with_errors
      FROM webhook_signals 
      WHERE raw_data::text ILIKE '%FORTE%'
    `);
    
    const stats = processedCount.rows[0];
    console.log(`📊 Estatísticas dos sinais FORTES:`);
    console.log(`   Total: ${stats.total}`);
    console.log(`   Processados: ${stats.processed}`);
    console.log(`   Com parsed_data: ${stats.with_parsed_data}`);
    console.log(`   Com erros: ${stats.with_errors}`);
    
    // 3. Verificar se existem ordens abertas
    console.log('\n💼 VERIFICAÇÃO DE ORDENS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      const ordersResult = await pool.query('SELECT COUNT(*) as count FROM trading_orders');
      console.log(`📈 Ordens na tabela trading_orders: ${ordersResult.rows[0].count}`);
    } catch (err) {
      console.log(`❌ Erro ao verificar trading_orders: ${err.message}`);
    }
    
    try {
      const signalsResult = await pool.query('SELECT COUNT(*) as count FROM trading_signals');
      console.log(`🔄 Sinais na tabela trading_signals: ${signalsResult.rows[0].count}`);
    } catch (err) {
      console.log(`❌ Erro ao verificar trading_signals: ${err.message}`);
    }
    
    // 4. Verificar usuários
    console.log('\n👥 VERIFICAÇÃO DE USUÁRIOS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      const usersResult = await pool.query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users
        FROM users
      `);
      console.log(`👥 Usuários: ${usersResult.rows[0].total_users} total, ${usersResult.rows[0].active_users} ativos`);
      
      // Tentar diferentes nomes de coluna para trading
      const tradingColumns = ['trading_enabled', 'trading_active', 'trading', 'enable_trading'];
      
      for (const column of tradingColumns) {
        try {
          const tradingResult = await pool.query(`
            SELECT COUNT(CASE WHEN ${column} = true THEN 1 END) as trading_enabled
            FROM users
          `);
          console.log(`✅ ${column}: ${tradingResult.rows[0].trading_enabled} usuários habilitados`);
          break;
        } catch (err) {
          console.log(`❌ Coluna ${column} não existe`);
        }
      }
      
    } catch (err) {
      console.log(`❌ Erro ao verificar usuários: ${err.message}`);
    }
    
    // 5. Diagnóstico final
    console.log('\n🧩 DIAGNÓSTICO FINAL:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (strongSignals.rows.length > 0) {
      console.log('✅ SINAIS FORTES estão chegando do TradingView');
      
      const allProcessed = strongSignals.rows.every(s => s.processed);
      const anyParsed = strongSignals.rows.some(s => s.parsed_data !== null);
      
      if (allProcessed) {
        console.log('✅ Sinais estão sendo marcados como processados');
      } else {
        console.log('❌ Alguns sinais não estão sendo processados');
      }
      
      if (!anyParsed) {
        console.log('❌ PROBLEMA CRÍTICO: parsed_data está sempre NULL');
        console.log('   → O parsing dos dados do webhook está falhando');
        console.log('   → Verificar função de parsing no código do servidor');
      }
    } else {
      console.log('❌ Nenhum sinal FORTE chegou recentemente');
    }
    
    console.log('\n💡 PRÓXIMAS AÇÕES:');
    console.log('🔧 1. Corrigir função de parsing dos webhooks');
    console.log('🔧 2. Garantir que sinais FORTES criem registros em trading_signals');
    console.log('🔧 3. Verificar lógica de criação de ordens');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

analyzeStrongSignals();
