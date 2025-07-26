const { Pool } = require('pg');

const databaseUrl = process.argv[2];

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000
});

async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Conexão bem-sucedida!');
    console.log('🕐 Hora:', result.rows[0].current_time);
    console.log('📊 Versão:', result.rows[0].pg_version.substring(0, 50) + '...');
    client.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    await pool.end();
    process.exit(1);
  }
}

testConnection();
