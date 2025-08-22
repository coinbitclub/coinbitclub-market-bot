// Script para verificar estrutura da tabela schema_migrations
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway'
});

async function checkSchemaMigrations() {
  try {
    console.log('🔍 Verificando estrutura da tabela schema_migrations...');
    
    // Verificar se a tabela existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'schema_migrations'
      );
    `);
    
    console.log('Tabela schema_migrations existe:', tableExists.rows[0].exists);
    
    if (tableExists.rows[0].exists) {
      // Verificar colunas
      const columns = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'schema_migrations'
        ORDER BY ordinal_position;
      `);
      
      console.log('📋 Colunas da tabela:');
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
      
      // Verificar registros existentes
      const records = await pool.query('SELECT * FROM schema_migrations ORDER BY applied_at DESC');
      console.log(`\n📊 Registros existentes: ${records.rows.length}`);
      records.rows.forEach(record => {
        console.log(`  - ${record.filename || record.migration_name || 'UNKNOWN'} (${record.applied_at})`);
      });
    } else {
      console.log('❌ Tabela schema_migrations não existe!');
      
      // Criar tabela
      console.log('🔧 Criando tabela schema_migrations...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id SERIAL PRIMARY KEY,
          filename VARCHAR(255) NOT NULL UNIQUE,
          applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      console.log('✅ Tabela schema_migrations criada!');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

checkSchemaMigrations();
