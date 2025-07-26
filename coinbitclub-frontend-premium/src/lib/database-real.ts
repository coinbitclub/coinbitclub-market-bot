import { Pool } from 'pg';

// Configuração da conexão PostgreSQL real
const pool = new Pool({
  connectionString: 'postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway',
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Função para executar queries
export async function query(text: string, params?: any[]): Promise<any> {
  const start = Date.now();
  const client = await pool.connect();
  
  try {
    const res = await client.query(text, params);
    const duration = Date.now() - start;
    console.log('Query executado:', { text: text.substring(0, 50), duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Erro na query:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Função para testar conexão
export async function testConnection(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW() as current_time');
    console.log('✅ Conexão PostgreSQL estabelecida:', result.rows[0].current_time);
    return true;
  } catch (error) {
    console.error('❌ Erro na conexão PostgreSQL:', error);
    return false;
  }
}

// Função para verificar estrutura das tabelas
export async function checkTables(): Promise<any> {
  try {
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📊 Tabelas disponíveis:', result.rows.map(r => r.table_name));
    return result.rows;
  } catch (error) {
    console.error('❌ Erro ao verificar tabelas:', error);
    throw error;
  }
}

export default pool;
