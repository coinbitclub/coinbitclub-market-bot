const { Pool } = require('pg');

const connectionString = 'postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function testDatabase() {
  console.log('🔗 Testing PostgreSQL Railway connection...');
  console.log('Connection string:', connectionString.replace(/:[^:@]*@/, ':****@'));
  console.log('');

  try {
    // Test basic connection
    const timeResult = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Database connected successfully');
    console.log('   Current time:', timeResult.rows[0].current_time);
    console.log('');

    // Test users table
    const usersResult = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log('✅ Users table accessible');
    console.log('   Total users:', usersResult.rows[0].count);
    console.log('');

    // Test operations table  
    const operationsResult = await pool.query('SELECT COUNT(*) as count FROM operations');
    console.log('✅ Operations table accessible');
    console.log('   Total operations:', operationsResult.rows[0].count);
    console.log('');

    // Test user_financial table
    const financialResult = await pool.query('SELECT COUNT(*) as count FROM user_financial');
    console.log('✅ User financial table accessible');
    console.log('   Total financial records:', financialResult.rows[0].count);
    console.log('');

    // Test affiliates table
    const affiliatesResult = await pool.query('SELECT COUNT(*) as count FROM affiliates');
    console.log('✅ Affiliates table accessible');
    console.log('   Total affiliates:', affiliatesResult.rows[0].count);
    console.log('');

    console.log('🎉 All database tests passed!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run: setup-and-start.bat');
    console.log('2. Wait for all services to start');
    console.log('3. Open: http://localhost:3000/admin');
    console.log('');

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.log('');
    console.log('Please check:');
    console.log('1. Internet connection');
    console.log('2. Database URL is correct');
    console.log('3. Railway database is running');
    console.log('');
  } finally {
    await pool.end();
  }
}

testDatabase();
