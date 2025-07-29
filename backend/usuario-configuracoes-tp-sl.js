const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function atualizarConfiguracoes() {
  console.log('🔧 Atualizando configurações TP/SL...');
  
  try {
    const result = await pool.query(`
      UPDATE usuario_configuracoes 
      SET 
        take_profit_percentage = 15.0,
        stop_loss_percentage = 10.0,
        leverage = 5,
        balance_percentage_per_trade = 30.0,
        max_positions = 2,
        updated_at = NOW()
      WHERE user_id IN (SELECT id FROM users WHERE is_active = true)
    `);
    
    console.log(`✅ ${result.rowCount} configurações atualizadas`);
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  atualizarConfiguracoes();
}

module.exports = { atualizarConfiguracoes };