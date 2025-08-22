const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway'
});

async function fixSignalAnalysis() {
  try {
    console.log('🔍 INVESTIGAÇÃO CORRIGIDA: ESTRUTURA REAL DAS TABELAS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // 1. Verificar estrutura da tabela webhook_signals
    console.log('📋 ESTRUTURA DA TABELA webhook_signals:');
    const webhookStructure = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'webhook_signals'
      ORDER BY ordinal_position
    `);
    
    console.log('Colunas disponíveis:');
    webhookStructure.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    // 2. Verificar alguns registros reais
    console.log('\n📊 AMOSTRA DE WEBHOOKS RECEBIDOS:');
    const sampleSignals = await pool.query(`
      SELECT * FROM webhook_signals 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    if (sampleSignals.rows.length > 0) {
      console.log('Estrutura real dos dados:');
      sampleSignals.rows.forEach((signal, index) => {
        console.log(`\n${index + 1}. Webhook ID: ${signal.id || signal.webhook_id}`);
        console.log(`   Criado em: ${new Date(signal.created_at).toLocaleString('pt-BR')}`);
        console.log(`   Processado: ${signal.processed}`);
        
        // Listar todas as colunas disponíveis
        Object.keys(signal).forEach(key => {
          if (key !== 'id' && key !== 'webhook_id' && key !== 'created_at' && key !== 'processed') {
            console.log(`   ${key}: ${signal[key]}`);
          }
        });
      });
    }
    
    // 3. Buscar especificamente por sinais FORTES
    console.log('\n🎯 BUSCA POR SINAIS FORTES:');
    
    // Verificar todas as colunas que podem conter os dados do sinal
    const possibleColumns = webhookStructure.rows.map(col => col.column_name);
    console.log('Colunas para verificar:', possibleColumns.join(', '));
    
    // Tentar diferentes colunas onde os dados podem estar
    for (const column of possibleColumns) {
      if (column !== 'id' && column !== 'created_at' && column !== 'processed' && column !== 'webhook_id') {
        try {
          console.log(`\n🔍 Verificando coluna "${column}":`);
          
          const columnData = await pool.query(`
            SELECT ${column}, created_at 
            FROM webhook_signals 
            WHERE ${column} IS NOT NULL 
            ORDER BY created_at DESC 
            LIMIT 3
          `);
          
          if (columnData.rows.length > 0) {
            columnData.rows.forEach(row => {
              console.log(`   Conteúdo: ${row[column]}`);
              console.log(`   Data: ${new Date(row.created_at).toLocaleString('pt-BR')}`);
            });
            
            // Procurar por "FORTE" nesta coluna
            const strongSearch = await pool.query(`
              SELECT COUNT(*) as count 
              FROM webhook_signals 
              WHERE ${column}::text ILIKE '%FORTE%'
            `);
            
            console.log(`   🎯 Registros com "FORTE": ${strongSearch.rows[0].count}`);
          }
          
        } catch (err) {
          console.log(`   ❌ Erro ao verificar coluna ${column}: ${err.message}`);
        }
      }
    }
    
    // 4. Verificar trading_signals e trading_orders
    console.log('\n📊 STATUS DAS TABELAS DE TRADING:');
    
    const tradingSignalsCount = await pool.query('SELECT COUNT(*) as count FROM trading_signals');
    console.log(`🔄 trading_signals: ${tradingSignalsCount.rows[0].count} registros`);
    
    const tradingOrdersCount = await pool.query('SELECT COUNT(*) as count FROM trading_orders');
    console.log(`📈 trading_orders: ${tradingOrdersCount.rows[0].count} registros`);
    
    // 5. Verificar usuários com trading habilitado
    const activeUsers = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN trading_enabled = true THEN 1 END) as trading_enabled
      FROM users
    `);
    
    console.log(`👥 Usuários: ${activeUsers.rows[0].total} total, ${activeUsers.rows[0].trading_enabled} com trading habilitado`);
    
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('1. Identificar a coluna correta que contém os dados do sinal');
    console.log('2. Verificar se sinais FORTES estão chegando');
    console.log('3. Corrigir o processamento se necessário');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

fixSignalAnalysis();
