// Script para executar migrations
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function runMigrations() {
  console.log('🔄 Executando migrations...');
  
  try {
    // Lista de migrations em ordem
    const migrations = [
      '000_reset_database.sql',
      '002_auth_system.sql', 
      '003_trading_engine.sql',
      '004_market_intelligence.sql'
    ];
    
    for (const migration of migrations) {
      const filePath = path.join(__dirname, 'migrations', migration);
      
      if (fs.existsSync(filePath)) {
        console.log(`📋 Executando ${migration}...`);
        
        const sql = fs.readFileSync(filePath, 'utf8');
        await pool.query(sql);
        
        console.log(`✅ ${migration} executada com sucesso!`);
      } else {
        console.log(`⚠️ Arquivo ${migration} não encontrado`);
      }
    }
    
    console.log('🎉 Todas as migrations executadas com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao executar migrations:', error);
  } finally {
    await pool.end();
  }
}

runMigrations();
