// ========================================
// APLICAR MIGRAÇÃO - SISTEMA DE COMISSIONAMENTO
// Script para aplicar a migração 009 do sistema de comissões
// ========================================

const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// Configuração do banco (Railway PostgreSQL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:DaOOFECebcBgfcDfafADBgGFeEFbbeGD@autorack.proxy.rlwy.net:26714/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function applyCommissionMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Iniciando migração do sistema de comissionamento...\n');

    // Verificar se a migração já foi aplicada
    const existingMigration = await client.query(
      "SELECT * FROM migration_log WHERE version = '009'"
    );

    if (existingMigration.rows.length > 0) {
      console.log('⚠️ Migração 009 já foi aplicada anteriormente');
      console.log('Data da aplicação:', existingMigration.rows[0].executed_at);
      return;
    }

    // Ler o arquivo de migração
    const migrationPath = path.join(__dirname, 'migrations', '009_commission_system.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');

    console.log('📄 Arquivo de migração carregado');
    console.log('📊 Executando migração...');

    // Executar a migração dentro de uma transação
    await client.query('BEGIN');

    try {
      await client.query(migrationSQL);
      await client.query('COMMIT');
      
      console.log('\n✅ Migração aplicada com sucesso!');
      
      // Verificar estruturas criadas
      console.log('\n🔍 Verificando estruturas criadas:');
      
      // Verificar tabelas
      const tables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('commission_payments', 'affiliates', 'referrals')
        ORDER BY table_name
      `);
      
      console.log('📋 Tabelas criadas:');
      tables.rows.forEach(row => {
        console.log(`   ✓ ${row.table_name}`);
      });

      // Verificar views
      const views = await client.query(`
        SELECT table_name 
        FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND table_name LIKE '%commission%' OR table_name LIKE '%affiliate%'
        ORDER BY table_name
      `);
      
      console.log('👁️ Views criadas:');
      views.rows.forEach(row => {
        console.log(`   ✓ ${row.table_name}`);
      });

      // Verificar funções
      const functions = await client.query(`
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name LIKE '%affiliate%' OR routine_name LIKE '%commission%'
        ORDER BY routine_name
      `);
      
      console.log('⚙️ Funções criadas:');
      functions.rows.forEach(row => {
        console.log(`   ✓ ${row.routine_name}`);
      });

      // Verificar configurações inseridas
      const settings = await client.query(`
        SELECT key, value, description 
        FROM system_settings 
        WHERE key LIKE 'commission%'
        ORDER BY key
      `);
      
      console.log('⚙️ Configurações do sistema:');
      settings.rows.forEach(row => {
        console.log(`   ✓ ${row.key}: ${row.value}`);
      });

      // Testar função de geração de código de afiliado
      const testCode = await client.query('SELECT generate_affiliate_code() as code');
      console.log(`🧪 Teste geração código afiliado: ${testCode.rows[0].code}`);

      console.log('\n🎉 Sistema de comissionamento configurado e pronto!');
      console.log('\n📋 Recursos disponíveis:');
      console.log('   • Processamento automático de comissões por posição');
      console.log('   • Sistema de tiers para afiliados (NORMAL/VIP)');
      console.log('   • Cálculo automático de taxas de conversão USD→BRL');
      console.log('   • Relatórios detalhados de performance');
      console.log('   • Gestão completa de indicações e referências');
      console.log('   • Views otimizadas para consultas');

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('\n❌ Erro ao aplicar migração:');
    console.error('Detalhes:', error.message);
    
    if (error.code) {
      console.error('Código do erro:', error.code);
    }
    
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar migração
applyCommissionMigration().catch(console.error);
