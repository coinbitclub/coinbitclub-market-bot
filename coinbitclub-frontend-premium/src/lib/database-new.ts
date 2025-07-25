// Configuração do banco de dados PostgreSQL
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Função para executar queries
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  
  try {
    const client = await pool.connect();
    
    try {
      const result = await client.query(text, params);
      const duration = Date.now() - start;
      
      console.log('Query executed:', { 
        text: text.substring(0, 100) + '...', 
        duration, 
        rows: result.rowCount 
      });
      
      return result;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database query error:', error);
    console.error('Query:', text);
    console.error('Params:', params);
    throw error;
  }
};

// Função para executar transações
export const transaction = async (callback: (client: any) => Promise<any>) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction error:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Função para testar conectividade
export async function testConnection() {
  try {
    const result = await query('SELECT NOW() as current_time, version() as version');
    console.log('✅ Database connection successful:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Função para verificar se as tabelas existem
export async function checkTables() {
  try {
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    const tables = result.rows.map(row => row.table_name);
    console.log('📊 Tables found:', tables);
    return tables;
  } catch (error) {
    console.error('Error checking tables:', error);
    return [];
  }
}

// Função para criar tabelas essenciais se não existirem
export async function ensureTablesExist() {
  try {
    console.log('📋 Ensuring essential tables exist...');
    
    // Criar tabelas básicas uma por vez
    await query(`
      CREATE TABLE IF NOT EXISTS trading_signals (
        id SERIAL PRIMARY KEY,
        source VARCHAR(50) NOT NULL,
        symbol VARCHAR(20) NOT NULL,
        action VARCHAR(20) NOT NULL,
        price DECIMAL(20,8),
        strategy VARCHAR(100),
        exchange VARCHAR(50),
        timeframe VARCHAR(10),
        raw_data JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        processed_at TIMESTAMP,
        status VARCHAR(20) DEFAULT 'PENDING'
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS signal_processing_queue (
        id SERIAL PRIMARY KEY,
        signal_id INTEGER,
        source VARCHAR(50) NOT NULL,
        symbol VARCHAR(20) NOT NULL,
        action VARCHAR(20) NOT NULL,
        confidence INTEGER DEFAULT 50,
        market_data JSONB,
        status VARCHAR(20) DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT NOW(),
        processed_at TIMESTAMP,
        result JSONB
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS market_data (
        id SERIAL PRIMARY KEY,
        source VARCHAR(50) NOT NULL,
        symbol VARCHAR(20) NOT NULL,
        price DECIMAL(20,8),
        volume DECIMAL(20,8),
        market_cap DECIMAL(20,8),
        price_change_24h DECIMAL(10,4),
        data JSONB,
        timestamp TIMESTAMP DEFAULT NOW()
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS ai_analysis (
        id SERIAL PRIMARY KEY,
        signal_id INTEGER,
        analysis_type VARCHAR(50) NOT NULL,
        recommendation VARCHAR(20),
        confidence DECIMAL(5,2),
        reasoning TEXT,
        technical_indicators JSONB,
        market_sentiment JSONB,
        risk_level VARCHAR(20),
        position_size VARCHAR(10),
        stop_loss DECIMAL(20,8),
        take_profit DECIMAL(20,8),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS signal_stats (
        id SERIAL PRIMARY KEY,
        source VARCHAR(50) NOT NULL,
        date DATE NOT NULL,
        signal_count INTEGER DEFAULT 0,
        success_count INTEGER DEFAULT 0,
        last_updated TIMESTAMP DEFAULT NOW(),
        UNIQUE(source, date)
      );
    `);

    console.log('✅ Essential tables created/verified successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error ensuring tables exist:', error);
    return false;
  }
}

// Fechar pool quando aplicação terminar
process.on('SIGINT', () => {
  pool.end();
});

process.on('SIGTERM', () => {
  pool.end();
});

export default pool;
