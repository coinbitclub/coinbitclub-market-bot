const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function checkSubscriptionsStructure() {
  try {
    console.log('🔍 Verificando estrutura da tabela subscriptions...\n');

    // Verificar estrutura da tabela subscriptions
    const structureResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'subscriptions'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Estrutura da tabela subscriptions:');
    structureResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}) ${col.column_default ? `(default: ${col.column_default})` : ''}`);
    });

    // Verificar algumas subscriptions existentes
    const subscriptionsResult = await pool.query(`
      SELECT id, user_id, plan_id, status, plan_type, trial_ends_at
      FROM subscriptions 
      LIMIT 5;
    `);
    
    console.log('\n📊 Algumas subscriptions existentes:');
    subscriptionsResult.rows.forEach(sub => {
      console.log(`  - ID: ${sub.id}`);
      console.log(`    User ID: ${sub.user_id}`);
      console.log(`    Plan ID: ${sub.plan_id}`);
      console.log(`    Status: ${sub.status}`);
      console.log(`    Plan Type: ${sub.plan_type}`);
      console.log(`    Trial Ends At: ${sub.trial_ends_at}`);
      console.log('');
    });

    console.log('✅ Verificação concluída!');

  } catch (error) {
    console.error('❌ Erro ao verificar estrutura:', error);
  } finally {
    await pool.end();
  }
}

checkSubscriptionsStructure();
