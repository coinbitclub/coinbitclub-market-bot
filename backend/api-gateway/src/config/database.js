import pkg from 'pg';
const { Pool } = pkg;

// Configuração do PostgreSQL Railway
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Testar conexão
pool.on('connect', () => {
  console.log('✅ Conectado ao PostgreSQL Railway');
});

pool.on('error', (err) => {
  console.error('❌ Erro na conexão PostgreSQL:', err);
});

export default pool;
