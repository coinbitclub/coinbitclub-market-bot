import { Pool } from 'pg';

// Configuração do pool de conexões PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Event listeners para debug
pool.on('connect', () => {
  console.log('✅ Conectado ao PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Erro inesperado no PostgreSQL:', err);
});

// Helper para executar queries com tratamento de erro
export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const start = Date.now();
    const result = await client.query(text, params);
    const duration = Date.now() - start;
    console.log(`🔍 Query executada em ${duration}ms`);
    return result;
  } catch (error) {
    console.error('❌ Erro na query:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Testar conexão
export async function testConnection() {
  try {
    const result = await query('SELECT NOW() as current_time');
    console.log('✅ Conexão com banco testada com sucesso:', result.rows[0].current_time);
    return true;
  } catch (error) {
    console.error('❌ Falha no teste de conexão:', error);
    return false;
  }
}

export default pool;
