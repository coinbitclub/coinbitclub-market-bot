const { Pool } = require('pg');
const fs = require('fs');
const pool = new Pool({ connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@postgres.railway.internal:5432/railway', ssl: { rejectUnauthorized: false } });
async function run() {
  try {
    const sql = fs.readFileSync('quick-migrate.sql', 'utf8');
    await pool.query(sql);
    console.log('Migração concluída!');
    const result = await pool.query('SELECT COUNT(*) FROM system_config');
    console.log('Configurações:', result.rows[0].count);
  } catch (e) {
    console.error('Erro:', e.message);
  } finally {
    await pool.end();
  }
}
run();
