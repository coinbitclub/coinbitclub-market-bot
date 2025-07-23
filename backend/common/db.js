import knex from 'knex';
import retry from 'async-retry';
import logger from './logger.js';
import { env } from './env.js';


// Database configuration - use PostgreSQL if DATABASE_URL is set, otherwise fallback to SQLite
let dbConfig;
if (env.DATABASE_URL) {
  dbConfig = {
    client: 'pg',
    connection: {
      connectionString: env.DATABASE_URL,
      ssl: env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
    },
    pool: { min: 2, max: 10 },
    migrations: { directory: '../migrations', tableName: 'knex_migrations' },
    seeds: { directory: '../seeds' }
  };
} else {
  dbConfig = {
    client: 'sqlite3',
    connection: { filename: './dev.sqlite3' },
    useNullAsDefault: true,
    migrations: { directory: '../migrations', tableName: 'knex_migrations' },
    seeds: { directory: '../seeds' }
  };
}

// Create database instance
export const db = knex(dbConfig);

// Connection health check
export async function ensureConnection() {
  await retry(
    async () => {
      const result = await db.raw('SELECT 1 as health_check');
      logger.info('Database connection verified');
      return result;
    },
    {
      retries: 5,
      minTimeout: 1000,
      maxTimeout: 5000,
      onRetry: (err, attempt) => {
        logger.warn({ err, attempt }, 'Database connection retry');
      }
    }
  );
}

// Simplified query execution
export async function query(sql, params = []) {
  try {
    return await db.raw(sql, params);
  } catch (err) {
    logger.error({ err, sql, params }, 'Database query failed');
    throw err;
  }
}

// Transaction helper
export async function transaction(callback) {
  const trx = await db.transaction();
  try {
    const result = await callback(trx);
    await trx.commit();
    return result;
  } catch (error) {
    await trx.rollback();
    logger.error({ error }, 'Transaction rolled back');
    throw error;
  }
}

// Health check for monitoring
export async function healthCheck() {
  try {
    const start = Date.now();
    await db.raw('SELECT 1');
    const duration = Date.now() - start;
    
    return {
      status: 'healthy',
      responseTime: duration,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Graceful shutdown
export async function closeConnection() {
  try {
    await db.destroy();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error({ error }, 'Error closing database connection');
  }
}

// Setup graceful shutdown handlers
process.on('SIGINT', closeConnection);
process.on('SIGTERM', closeConnection);

export default db;
