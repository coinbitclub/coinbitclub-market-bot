import pkg from 'pg';
const { Pool } = pkg;

// Usa variável de ambiente padrão do Railway
const connectionString = process.env.DATABASE_URL;

// Configuração para conexão segura (Railway, SSL)
const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: connectionString?.includes('railway') || connectionString?.includes('amazonaws')
    ? { rejectUnauthorized: false }
    : false
});

// Teste automático de conexão ao iniciar o backend
pool.connect()
  .then(client => {
    return client
      .query('SELECT NOW()')
      .then(res => {
        console.log('🟢 Banco conectado:', res.rows[0].now);
        client.release();
      })
      .catch(err => {
        client.release();
        console.error('🔴 Erro ao conectar banco:', err.message);
      });
  })
  .catch(err => {
    console.error('🔴 Erro inicial pool:', err.message);
  });

export { pool };
