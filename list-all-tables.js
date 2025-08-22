const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:FYHVNKLIXYmRWdRLKNnYdCXhGNsgjLSr@autorack.proxy.rlwy.net:39170/railway'
});

async function listAllTables() {
  try {
    console.log('🔍 Listando todas as tabelas do banco...');
    
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`\n📋 ${tablesResult.rows.length} tabelas encontradas:`);
    for (const table of tablesResult.rows) {
      console.log(`\n🔧 Tabela: ${table.table_name}`);
      
      try {
        const columnsResult = await pool.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = $1 AND table_schema = 'public'
          ORDER BY ordinal_position
        `, [table.table_name]);
        
        columnsResult.rows.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
        });
        
        // Contar registros
        const countResult = await pool.query(`SELECT COUNT(*) FROM "${table.table_name}"`);
        console.log(`  📊 Registros: ${countResult.rows[0].count}`);
        
      } catch (error) {
        console.log(`  ❌ Erro ao acessar tabela: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

listAllTables();
