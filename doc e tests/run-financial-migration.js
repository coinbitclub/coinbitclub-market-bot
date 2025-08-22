// ========================================
// MARKETBOT - EXECUTAR MIGRAÇÃO FINANCEIRA
// Criação das tabelas do sistema Stripe
// ========================================

const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway'
});

async function runFinancialMigration() {
  try {
    console.log('🗄️  INICIANDO MIGRAÇÃO DO SISTEMA FINANCEIRO...');
    console.log('========================================');

    // Ler o arquivo SQL da migração
    const migrationSQL = fs.readFileSync('./migrations/005_stripe_financial_system.sql', 'utf8');
    
    // Dividir em statements individuais para melhor controle
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📊 Total de statements SQL: ${statements.length}`);
    console.log('');

    let successCount = 0;
    let warningCount = 0;
    let errorCount = 0;

    // Executar cada statement individualmente
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        await pool.query(statement);
        
        // Identificar tipo de operação
        if (statement.toUpperCase().includes('CREATE TABLE')) {
          const tableName = statement.match(/CREATE TABLE.*?(\w+)/i)?.[1] || 'unknown';
          console.log(`   ✅ Tabela criada: ${tableName}`);
        } else if (statement.toUpperCase().includes('CREATE INDEX')) {
          console.log(`   📊 Índice criado`);
        } else if (statement.toUpperCase().includes('CREATE TRIGGER')) {
          console.log(`   🔄 Trigger criado`);
        } else if (statement.toUpperCase().includes('INSERT INTO')) {
          console.log(`   📥 Dados iniciais inseridos`);
        } else if (statement.toUpperCase().includes('CREATE VIEW')) {
          console.log(`   👁️  View criada`);
        } else {
          console.log(`   ✅ Statement ${i + 1} executado`);
        }
        
        successCount++;
        
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`   ⚠️  Statement ${i + 1}: Já existe (ignorando)`);
          warningCount++;
        } else {
          console.log(`   ❌ Statement ${i + 1}: ${error.message}`);
          errorCount++;
        }
      }
    }

    console.log('');
    console.log('📋 RESUMO DA MIGRAÇÃO:');
    console.log(`   ✅ Sucessos: ${successCount}`);
    console.log(`   ⚠️  Warnings: ${warningCount}`);
    console.log(`   ❌ Erros: ${errorCount}`);

    // Verificar tabelas criadas
    console.log('');
    console.log('🔍 VERIFICANDO TABELAS CRIADAS...');
    
    const tableCheck = await pool.query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('coupons', 'coupon_usage', 'affiliates', 'referrals', 'commission_payments', 'user_subscriptions', 'payment_history')
      ORDER BY table_name
    `);

    console.log(`📊 Tabelas do sistema financeiro: ${tableCheck.rows.length}/7`);
    tableCheck.rows.forEach(table => {
      console.log(`   ✅ ${table.table_name} (${table.table_type})`);
    });

    // Verificar views criadas
    const viewCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name IN ('affiliate_stats', 'coupon_stats')
      ORDER BY table_name
    `);

    console.log(`📈 Views criadas: ${viewCheck.rows.length}/2`);
    viewCheck.rows.forEach(view => {
      console.log(`   👁️  ${view.table_name}`);
    });

    // Verificar dados iniciais
    console.log('');
    console.log('🎫 VERIFICANDO CUPONS INICIAIS...');
    const couponCheck = await pool.query('SELECT code, discount_value FROM coupons ORDER BY code');
    
    if (couponCheck.rows.length > 0) {
      console.log(`📋 Cupons criados: ${couponCheck.rows.length}`);
      couponCheck.rows.forEach(coupon => {
        console.log(`   🎟️  ${coupon.code}: ${coupon.discount_value}% desconto`);
      });
    } else {
      console.log('   ⚠️  Nenhum cupom inicial encontrado');
    }

    if (errorCount === 0) {
      console.log('');
      console.log('🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
      console.log('✅ Sistema financeiro totalmente operacional');
      console.log('🚀 Pronto para processar pagamentos Stripe');
    } else {
      console.log('');
      console.log('⚠️  MIGRAÇÃO CONCLUÍDA COM ALGUNS ERROS');
      console.log('📋 Verifique os erros acima antes de prosseguir');
    }

  } catch (error) {
    console.error('❌ ERRO CRÍTICO NA MIGRAÇÃO:', error.message);
  } finally {
    await pool.end();
    console.log('🔌 Conexão com banco encerrada');
  }
}

// Executar migração
runFinancialMigration();
