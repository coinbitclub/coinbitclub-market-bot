const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function checkPlansAndFix() {
  try {
    console.log('🔍 Verificando planos existentes...\n');

    // 1. Verificar planos existentes
    const plansResult = await pool.query(`
      SELECT id, name, price_id, unit_amount, currency
      FROM plans 
      ORDER BY name;
    `);
    
    console.log('📋 Planos existentes:');
    plansResult.rows.forEach(plan => {
      console.log(`  - ID: ${plan.id}`);
      console.log(`    Nome: ${plan.name}`);
      console.log(`    Preço: ${plan.unit_amount/100} ${plan.currency}`);
      console.log(`    Price ID: ${plan.price_id}`);
      console.log('');
    });

    // 2. Verificar se existe plano gratuito ou básico
    const freePlan = plansResult.rows.find(plan => 
      plan.name.toLowerCase().includes('free') || 
      plan.name.toLowerCase().includes('básico') ||
      plan.name.toLowerCase().includes('basico') ||
      plan.unit_amount === 0
    );

    if (freePlan) {
      console.log(`✅ Plano gratuito encontrado: ${freePlan.name} (ID: ${freePlan.id})`);
    } else {
      console.log('⚠️ Nenhum plano gratuito encontrado. Usando o primeiro plano disponível.');
    }

    // 3. Verificar registros órfãos em subscriptions
    console.log('\n🔍 Verificando registros órfãos em subscriptions...');
    const orphanSubscriptions = await pool.query(`
      SELECT s.id, s.plan_id, s.user_id
      FROM subscriptions s
      LEFT JOIN plans p ON s.plan_id = p.id
      WHERE p.id IS NULL;
    `);

    if (orphanSubscriptions.rows.length > 0) {
      console.log(`❌ Encontrados ${orphanSubscriptions.rows.length} registros órfãos em subscriptions:`);
      orphanSubscriptions.rows.forEach(sub => {
        console.log(`  - Subscription ID: ${sub.id}, Plan ID inexistente: ${sub.plan_id}`);
      });
    } else {
      console.log('✅ Nenhum registro órfão encontrado em subscriptions.');
    }

    // 4. Verificar affiliates com code NULL
    console.log('\n🔍 Verificando affiliates com code NULL...');
    const nullCodeAffiliates = await pool.query(`
      SELECT id, user_id, code, affiliate_code
      FROM affiliates
      WHERE code IS NULL;
    `);

    if (nullCodeAffiliates.rows.length > 0) {
      console.log(`❌ Encontrados ${nullCodeAffiliates.rows.length} affiliates com code NULL:`);
      nullCodeAffiliates.rows.forEach(aff => {
        console.log(`  - Affiliate ID: ${aff.id}, User ID: ${aff.user_id}`);
      });
    } else {
      console.log('✅ Todos os affiliates têm code preenchido.');
    }

    // 5. Usar primeiro plano disponível como default
    const defaultPlan = freePlan || plansResult.rows[0];
    console.log(`\n📌 Plano padrão a ser usado: ${defaultPlan.name} (ID: ${defaultPlan.id})`);

    return defaultPlan.id;

  } catch (error) {
    console.error('❌ Erro ao verificar planos:', error);
    return null;
  } finally {
    await pool.end();
  }
}

checkPlansAndFix();
