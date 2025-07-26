const { Pool } = require('pg');
const fs = require('fs');

const databaseUrl = process.argv[2];
const backupFile = process.argv[3];

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000
});

async function applyBackup() {
  try {
    const client = await pool.connect();
    
    // Ler e executar backup
    const backupSql = fs.readFileSync(backupFile, 'utf8');
    
    console.log('📥 Aplicando estrutura do banco...');
    await client.query(backupSql);
    
    console.log('✅ Backup estrutural aplicado com sucesso!');
    
    // Verificar tabelas criadas
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 Tabelas criadas:', tablesResult.rows.length);
    tablesResult.rows.forEach(row => {
      console.log('  - ' + row.table_name);
    });
    
    client.release();
    await pool.end();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro ao aplicar backup:', error.message);
    await pool.end();
    process.exit(1);
  }
}

applyBackup();
