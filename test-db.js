const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway',
  ssl: { rejectUnauthorized: false }
});

async function testConnection() {
  try {
    console.log('Connecting to database...');
    const result = await pool.query('SELECT NOW() as current_time, version() as version');
    console.log('✅ Database connected successfully!');
    console.log('Current time:', result.rows[0].current_time);
    console.log('Database version:', result.rows[0].version);
    
    // Test users table
    const usersCount = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log('Total users in database:', usersCount.rows[0].count);
    
    await pool.end();
    console.log('Connection closed.');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

testConnection();
