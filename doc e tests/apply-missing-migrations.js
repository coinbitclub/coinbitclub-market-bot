// ========================================
// APLICAÇÃO DE MIGRATIONS FALTANDO
// Script para aplicar todas as migrations pendentes
// ========================================

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: false
});

async function applyMigrations() {
  console.log('🚀 APLICANDO MIGRATIONS FALTANDO...');
  console.log('=' .repeat(50));

  try {
    // Verificar migrations aplicadas
    const appliedResult = await pool.query('SELECT version FROM schema_migrations ORDER BY applied_at');
    const appliedMigrations = appliedResult.rows.map(row => row.version);
    
    console.log('📋 Migrations já aplicadas:');
    appliedMigrations.forEach(migration => {
      console.log(`  ✅ ${migration}`);
    });
    console.log('');

    // Listar todas as migrations disponíveis
    const migrationsDir = path.join(__dirname, 'migrations');
    const allMigrations = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log('📁 Migrations disponíveis:');
    allMigrations.forEach(migration => {
      const isApplied = appliedMigrations.includes(migration);
      console.log(`  ${isApplied ? '✅' : '⏳'} ${migration}`);
    });
    console.log('');

    // Identificar migrations pendentes
    const pendingMigrations = allMigrations.filter(migration => 
      !appliedMigrations.includes(migration) && migration !== '000_reset_database.sql'
    );

    if (pendingMigrations.length === 0) {
      console.log('✅ Todas as migrations já foram aplicadas!');
      return;
    }

    console.log('🔄 Aplicando migrations pendentes:');
    console.log('=' .repeat(40));

    for (const migration of pendingMigrations) {
      console.log(`\n📦 Aplicando: ${migration}`);
      
      try {
        // Ler arquivo de migration
        const migrationPath = path.join(migrationsDir, migration);
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        // Executar migration
        await pool.query('BEGIN');
        await pool.query(migrationSQL);
        
        // Registrar migration como aplicada
        await pool.query(
          'INSERT INTO schema_migrations (version, applied_at) VALUES ($1, NOW())',
          [migration]
        );
        
        await pool.query('COMMIT');
        
        console.log(`  ✅ ${migration} aplicada com sucesso!`);
      } catch (error) {
        await pool.query('ROLLBACK');
        console.error(`  ❌ Erro ao aplicar ${migration}:`, error.message);
        throw error;
      }
    }

    console.log('\n🎉 TODAS AS MIGRATIONS APLICADAS COM SUCESSO!');
    console.log('=' .repeat(50));

    // Verificar tabelas criadas
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log(`\n📊 Total de tabelas no banco: ${tablesResult.rows.length}`);
    console.log('🏗️ Tabelas importantes verificadas:');
    
    const importantTables = [
      'users', 'coupons', 'coupon_usage', 'affiliates', 'referrals',
      'commission_payments', 'user_subscriptions', 'payment_history',
      'user_2fa', 'temp_2fa_setup', 'sms_verification',
      'system_monitoring', 'system_alerts', 'component_status'
    ];

    for (const table of importantTables) {
      const exists = tablesResult.rows.some(row => row.table_name === table);
      console.log(`  ${exists ? '✅' : '❌'} ${table}`);
    }

    console.log('\n✅ SISTEMA DE BANCO DE DADOS COMPLETAMENTE CONFIGURADO!');

  } catch (error) {
    console.error('❌ Erro durante aplicação de migrations:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  applyMigrations()
    .then(() => {
      console.log('\n🚀 PRONTO PARA PRÓXIMA FASE!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 FALHA CRÍTICA:', error.message);
      process.exit(1);
    });
}

module.exports = { applyMigrations };
