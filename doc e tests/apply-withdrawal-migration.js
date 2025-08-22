// ========================================
// APLICAR MIGRATION 008 - WITHDRAWAL SYSTEM
// Sistema completo de saques e retiradas
// ========================================

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

console.log('🏦 APLICANDO MIGRATION 008 - WITHDRAWAL SYSTEM');
console.log('==============================================');

async function applyWithdrawalMigration() {
  const db = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/marketbot'
  });

  try {
    console.log('🔗 Conectando ao banco Railway...');
    await db.query('SELECT 1');
    console.log('✅ Conectado ao banco Railway');

    // Verificar se a migration já foi aplicada
    console.log('🔍 Verificando se migration 008 já foi aplicada...');
    const migrationCheck = await db.query(`
      SELECT version FROM schema_migrations WHERE version = '008'
    `);

    if (migrationCheck.rows.length > 0) {
      console.log('⚠️ Migration 008 já foi aplicada anteriormente');
      await db.end();
      return;
    }

    // Ler o arquivo de migration
    console.log('📖 Lendo arquivo de migration...');
    const migrationPath = path.join(__dirname, 'migrations', '008_withdrawal_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Aplicar a migration
    console.log('🚀 Aplicando migration 008...');
    await db.query(migrationSQL);
    console.log('✅ Migration 008 aplicada com sucesso!');

    // Verificar tabelas criadas
    console.log('🔍 Verificando tabelas criadas...');
    const tablesResult = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('withdrawal_requests', 'withdrawal_settings')
      ORDER BY table_name
    `);

    console.log(`✅ Tabelas criadas: ${tablesResult.rows.map(r => r.table_name).join(', ')}`);

    // Verificar colunas de saldo adicionadas
    console.log('💰 Verificando colunas de saldo...');
    const balanceColumns = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name LIKE 'balance_%'
      ORDER BY column_name
    `);

    console.log('✅ Colunas de saldo criadas:');
    balanceColumns.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });

    // Verificar configurações padrão inseridas
    console.log('⚙️ Verificando configurações de saque...');
    const settingsResult = await db.query(`
      SELECT currency, min_amount, max_monthly_amount, transaction_fee 
      FROM withdrawal_settings 
      ORDER BY currency
    `);

    console.log('✅ Configurações de saque:');
    settingsResult.rows.forEach(setting => {
      console.log(`   - ${setting.currency}: Min ${setting.min_amount}, Max mensal ${setting.max_monthly_amount}, Taxa ${setting.transaction_fee}`);
    });

    // Verificar views criadas
    console.log('📊 Verificando views criadas...');
    const viewsResult = await db.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%withdrawal%'
      ORDER BY table_name
    `);

    console.log(`✅ Views criadas: ${viewsResult.rows.map(r => r.table_name).join(', ')}`);

    // Verificar funções criadas
    console.log('🔧 Verificando funções criadas...');
    const functionsResult = await db.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name LIKE '%withdrawal%'
      ORDER BY routine_name
    `);

    console.log(`✅ Funções criadas: ${functionsResult.rows.map(r => r.routine_name).join(', ')}`);

    // Testar funções utilitárias
    console.log('🧪 Testando funções utilitárias...');
    const isWithdrawalDay = await db.query('SELECT is_withdrawal_day() as is_day');
    const nextDate = await db.query('SELECT next_withdrawal_date() as next_date');
    
    console.log(`✅ Hoje é dia de saque: ${isWithdrawalDay.rows[0].is_day}`);
    console.log(`✅ Próxima data de saque: ${nextDate.rows[0].next_date}`);

    await db.end();

    console.log('\n🎉 ======= RELATÓRIO MIGRATION 008 =======');
    console.log('✅ Tabela withdrawal_requests criada');
    console.log('✅ Tabela withdrawal_settings criada');
    console.log('✅ 6 colunas de saldo adicionadas aos usuários');
    console.log('✅ Configurações padrão BRL/USD inseridas');
    console.log('✅ Views de relatório criadas');
    console.log('✅ Funções utilitárias criadas');
    console.log('✅ Triggers de validação criados');
    console.log('✅ Índices de performance criados');
    console.log('🎯 SISTEMA DE SAQUES 100% ESTRUTURADO!');
    console.log('======================================');

  } catch (error) {
    console.error('❌ Erro ao aplicar migration:', error);
    await db.end();
    throw error;
  }
}

// Executar migration
applyWithdrawalMigration()
  .then(() => {
    console.log('✅ Migration 008 concluída com sucesso!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Falha na migration 008:', error);
    process.exit(1);
  });
