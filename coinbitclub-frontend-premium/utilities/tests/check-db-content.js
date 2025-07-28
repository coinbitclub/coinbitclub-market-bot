const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway',
  ssl: false
});

async function checkDatabaseContent() {
  try {
    console.log('🔍 Verificando conteúdo das tabelas...\n');
    
    const client = await pool.connect();
    
    // Verificar todas as tabelas
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 Tabelas disponíveis:');
    tables.rows.forEach(row => console.log(`  - ${row.table_name}`));
    console.log('');
    
    // Contar registros em cada tabela
    for (const table of tables.rows) {
      try {
        const count = await client.query(`SELECT COUNT(*) as total FROM ${table.table_name}`);
        console.log(`📊 ${table.table_name}: ${count.rows[0].total} registros`);
      } catch (error) {
        console.log(`❌ ${table.table_name}: Erro ao contar (${error.message})`);
      }
    }
    
    console.log('\n🔍 Dados de exemplo dos usuários:');
    const users = await client.query('SELECT id, name, email, user_type, created_at FROM users LIMIT 5');
    console.table(users.rows);
    
    // Verificar se existem operações de trading
    try {
      const operations = await client.query('SELECT COUNT(*) as total FROM trade_operations');
      console.log(`\n📈 Operações de trading: ${operations.rows[0].total} registros`);
      
      if (parseInt(operations.rows[0].total) > 0) {
        const recentOps = await client.query(`
          SELECT symbol, side, quantity, price, profit_loss, created_at 
          FROM trade_operations 
          ORDER BY created_at DESC 
          LIMIT 3
        `);
        console.log('\n📈 Operações recentes:');
        console.table(recentOps.rows);
      }
    } catch (error) {
      console.log('❌ Tabela trade_operations não existe ainda');
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

checkDatabaseContent();
