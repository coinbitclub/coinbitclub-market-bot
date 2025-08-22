// ========================================
// MIGRAÇÃO SIMPLES DO SISTEMA FINANCEIRO
// ========================================

const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway'
});

async function runMigration() {
  try {
    console.log('🗄️  Executando migração das tabelas financeiras...');

    // Criar tabelas uma por uma
    const queries = [
      // Tabela de cupons
      `CREATE TABLE IF NOT EXISTS coupons (
        id SERIAL PRIMARY KEY,
        code VARCHAR(20) UNIQUE NOT NULL,
        discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
        discount_value DECIMAL(10,2) NOT NULL,
        max_uses INTEGER NOT NULL DEFAULT 100,
        current_uses INTEGER NOT NULL DEFAULT 0,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_by_user_id INTEGER NOT NULL DEFAULT 1,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      // Tabela de uso de cupons
      `CREATE TABLE IF NOT EXISTS coupon_usage (
        id SERIAL PRIMARY KEY,
        coupon_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        order_id VARCHAR(255),
        used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      // Tabela de afiliados
      `CREATE TABLE IF NOT EXISTS affiliates (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        affiliate_code VARCHAR(20) UNIQUE NOT NULL,
        affiliate_link TEXT NOT NULL,
        commission_rate DECIMAL(5,4) NOT NULL DEFAULT 0.015,
        total_referrals INTEGER NOT NULL DEFAULT 0,
        total_commission_earned DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        commission_pending DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        commission_paid DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        is_active BOOLEAN NOT NULL DEFAULT true,
        tier VARCHAR(20) NOT NULL DEFAULT 'normal',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      // Tabela de referrals
      `CREATE TABLE IF NOT EXISTS referrals (
        id SERIAL PRIMARY KEY,
        affiliate_id INTEGER NOT NULL,
        referred_user_id INTEGER NOT NULL,
        order_id VARCHAR(255),
        commission_amount DECIMAL(10,2) NOT NULL,
        commission_rate DECIMAL(5,4) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        paid_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      // Tabela de assinaturas
      `CREATE TABLE IF NOT EXISTS user_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        plan_type VARCHAR(20) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        stripe_customer_id VARCHAR(255),
        stripe_subscription_id VARCHAR(255),
        stripe_order_id VARCHAR(255),
        amount_paid DECIMAL(10,2),
        currency VARCHAR(3) DEFAULT 'BRL',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      // Tabela de histórico de pagamentos
      `CREATE TABLE IF NOT EXISTS payment_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        stripe_payment_intent_id VARCHAR(255),
        stripe_session_id VARCHAR(255),
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'BRL',
        status VARCHAR(20) NOT NULL,
        plan_type VARCHAR(20),
        coupon_code VARCHAR(20),
        affiliate_code VARCHAR(20),
        discount_amount DECIMAL(10,2) DEFAULT 0.00,
        commission_amount DECIMAL(10,2) DEFAULT 0.00,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      // Criar índices
      `CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code)`,
      `CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active, expires_at)`,
      `CREATE INDEX IF NOT EXISTS idx_affiliates_code ON affiliates(affiliate_code)`,
      `CREATE INDEX IF NOT EXISTS idx_affiliates_user ON affiliates(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id)`
    ];

    for (let i = 0; i < queries.length; i++) {
      try {
        await pool.query(queries[i]);
        console.log(`   ✅ Query ${i + 1}/${queries.length} executada`);
      } catch (error) {
        if (error.message.includes('already exists') || error.message.includes('does not exist')) {
          console.log(`   ⚠️  Query ${i + 1}/${queries.length}: ${error.message.split('\n')[0]}`);
        } else {
          console.log(`   ❌ Query ${i + 1}/${queries.length}: ${error.message}`);
        }
      }
    }

    console.log('✅ Migração concluída!');
    await pool.end();

  } catch (error) {
    console.error('❌ Erro na migração:', error.message);
    await pool.end();
  }
}

runMigration();
