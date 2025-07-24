const { Pool } = require('pg');

// Usando as credenciais que funcionaram antes
const pool = new Pool({
  host: 'junction.proxy.rlwy.net',
  port: 26187,
  database: 'railway',
  user: 'postgres',
  password: 'LbTbNSKKfvjRxDdKsWIdJlSEHHmcLQPm',
  ssl: {
    rejectUnauthorized: false
  }
});

async function fullDatabaseCheck() {
  try {
    console.log('🔍 VERIFICAÇÃO COMPLETA DO BANCO DE DADOS');
    console.log('=' .repeat(50));
    
    // 1. Verificar todas as tabelas existentes
    console.log('\n📋 TABELAS EXISTENTES:');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    tables.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    // 2. Verificar estrutura de cada tabela importante
    const importantTables = ['users', 'operations', 'subscriptions', 'plans'];
    
    for (const tableName of importantTables) {
      console.log(`\n🏗️  ESTRUTURA DA TABELA: ${tableName.toUpperCase()}`);
      console.log('-'.repeat(40));
      
      try {
        const structure = await pool.query(`
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = $1 
          ORDER BY ordinal_position;
        `, [tableName]);
        
        structure.rows.forEach(col => {
          console.log(`  ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });
        
        // Contar registros
        const count = await pool.query(`SELECT COUNT(*) FROM ${tableName};`);
        console.log(`  📊 Total de registros: ${count.rows[0].count}`);
        
        // Mostrar dados de exemplo (primeiros 3 registros)
        const sample = await pool.query(`SELECT * FROM ${tableName} LIMIT 3;`);
        if (sample.rows.length > 0) {
          console.log(`  📄 Exemplo de dados:`);
          sample.rows.forEach((row, index) => {
            console.log(`    [${index + 1}] ${JSON.stringify(row, null, 2)}`);
          });
        }
        
      } catch (error) {
        console.log(`  ❌ Erro ao acessar tabela ${tableName}: ${error.message}`);
      }
    }
    
    // 3. Verificar dados específicos para contabilidade
    console.log(`\n💰 DADOS PARA CONTABILIDADE:`);
    console.log('-'.repeat(40));
    
    try {
      // Operações com lucro/prejuízo
      const profitData = await pool.query(`
        SELECT 
          status,
          COUNT(*) as count,
          SUM(profit_usd) as total_profit,
          AVG(profit_usd) as avg_profit
        FROM operations 
        GROUP BY status;
      `);
      
      console.log('📈 Resumo das operações:');
      profitData.rows.forEach(row => {
        console.log(`  ${row.status}: ${row.count} ops, Total: $${row.total_profit}, Média: $${row.avg_profit}`);
      });
      
      // Assinaturas ativas
      const activeSubscriptions = await pool.query(`
        SELECT 
          s.status,
          COUNT(*) as count,
          p.name as plan_name
        FROM subscriptions s
        LEFT JOIN plans p ON s.plan_id = p.id
        GROUP BY s.status, p.name;
      `);
      
      console.log('📋 Assinaturas por status:');
      activeSubscriptions.rows.forEach(row => {
        console.log(`  ${row.status} (${row.plan_name || 'sem plano'}): ${row.count}`);
      });
      
    } catch (error) {
      console.log(`❌ Erro nos dados de contabilidade: ${error.message}`);
    }
    
    console.log('\n✅ VERIFICAÇÃO COMPLETA FINALIZADA');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  } finally {
    await pool.end();
  }
}

fullDatabaseCheck();
