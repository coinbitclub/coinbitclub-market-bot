// ========================================
// MARKETBOT BACKEND - DATABASE CONFIGURATION
// ========================================
// PostgreSQL Railway Enterprise Configuration
// Performance optimized for 1000+ simultaneous users

import { Pool, PoolConfig } from 'pg';
import { databaseConfig, appConfig } from './env';

// ========================================
// DATABASE CONNECTION POOL CONFIGURATION
// ========================================
// Enterprise-grade connection pooling for high performance

const poolConfig: PoolConfig = {
  connectionString: databaseConfig.url,
  host: databaseConfig.host,
  port: databaseConfig.port,
  database: databaseConfig.database,
  user: databaseConfig.user,
  password: databaseConfig.password,
  
  // Performance optimizations for 1000+ users
  max: 100,                    // Maximum connections in pool
  min: 10,                     // Minimum connections to maintain
  idleTimeoutMillis: 300000,   // 5 minutes idle timeout
  connectionTimeoutMillis: 10000, // 10 seconds connection timeout
  maxUses: 7500,               // Maximum uses per connection
  
  // SSL configuration for production
  ssl: appConfig.nodeEnv === 'production' ? {
    rejectUnauthorized: false,
  } : false,
  
  // Application name for monitoring
  application_name: 'marketbot_backend',
  
  // Query timeout
  query_timeout: 30000,        // 30 seconds query timeout
  statement_timeout: 30000,    // 30 seconds statement timeout
  
  // Connection keep-alive
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
};

// ========================================
// DATABASE CONNECTION POOL
// ========================================

export const db = new Pool(poolConfig);

// Connection error handling
db.on('error', (err: Error) => {
  console.error('❌ Database connection error:', err);
  process.exit(1);
});

db.on('connect', (client: any) => {
  console.log('✅ New database connection established');
  
  // Set session configurations for performance
  client.query(`
    SET statement_timeout = '30s';
    SET lock_timeout = '10s';
    SET idle_in_transaction_session_timeout = '60s';
    SET log_statement = 'none';
  `).catch((err: Error) => {
    console.error('Failed to set session config:', err);
  });
});

// ========================================
// DATABASE HEALTH CHECK
// ========================================

export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    const client = await db.connect();
    
    // Test basic connectivity
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    
    console.log(`
🔍 DATABASE HEALTH CHECK
✅ Connection: SUCCESS
✅ Current Time: ${result.rows[0].current_time}
✅ PostgreSQL Version: ${result.rows[0].postgres_version.split(' ')[0]}
✅ Pool Size: ${db.totalCount} total, ${db.idleCount} idle
    `);
    
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    return false;
  }
};

// ========================================
// DATABASE CLEANUP FUNCTIONS
// ========================================
// 24h cleanup for webhooks and market data as specified

export const cleanupObsoleteData = async (): Promise<void> => {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    // Clean webhook signals older than 24 hours
    const webhookCleanup = await client.query(`
      DELETE FROM webhook_signals 
      WHERE created_at < NOW() - INTERVAL '24 hours'
    `);
    
    // Clean market data older than 24 hours
    const marketDataCleanup = await client.query(`
      DELETE FROM market_data 
      WHERE created_at < NOW() - INTERVAL '24 hours'
    `);
    
    // Clean failed login attempts older than specified days
    const failedLoginsCleanup = await client.query(`
      DELETE FROM failed_login_attempts 
      WHERE created_at < NOW() - INTERVAL '7 days'
    `);
    
    // Clean expired sessions
    const sessionsCleanup = await client.query(`
      DELETE FROM user_sessions 
      WHERE expires_at < NOW()
    `);
    
    await client.query('COMMIT');
    
    console.log(`
🧹 DATABASE CLEANUP COMPLETED
✅ Webhook signals cleaned: ${webhookCleanup.rowCount}
✅ Market data cleaned: ${marketDataCleanup.rowCount}
✅ Failed logins cleaned: ${failedLoginsCleanup.rowCount}
✅ Expired sessions cleaned: ${sessionsCleanup.rowCount}
    `);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Database cleanup failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

// ========================================
// DATABASE PERFORMANCE MONITORING
// ========================================

export const getDatabaseStats = async (): Promise<any> => {
  const client = await db.connect();
  
  try {
    const stats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
        (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'idle') as idle_connections,
        (SELECT COUNT(*) FROM pg_stat_activity) as total_connections,
        (SELECT setting FROM pg_settings WHERE name = 'max_connections') as max_connections,
        (SELECT pg_size_pretty(pg_database_size(current_database()))) as database_size
    `);
    
    return stats.rows[0];
  } finally {
    client.release();
  }
};

// ========================================
// GRACEFUL SHUTDOWN
// ========================================

export const closeDatabaseConnection = async (): Promise<void> => {
  try {
    await db.end();
    console.log('✅ Database connections closed gracefully');
  } catch (error) {
    console.error('❌ Error closing database connections:', error);
  }
};

// Process event handlers
process.on('SIGINT', closeDatabaseConnection);
process.on('SIGTERM', closeDatabaseConnection);
process.on('exit', closeDatabaseConnection);

export default db;
