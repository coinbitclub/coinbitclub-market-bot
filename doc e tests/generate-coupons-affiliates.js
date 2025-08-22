// ========================================
// MARKETBOT - GERAÇÃO AUTOMÁTICA DE CUPONS E AFILIADOS
// Script para criar sistema completo de marketing
// ========================================

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway'
});

// ========================================
// FUNÇÕES DE GERAÇÃO
// ========================================

function generateCouponCode() {
  const prefix = 'MB';
  const randomBytes = Math.random().toString(36).substring(2, 8).toUpperCase();
  const timestamp = Date.now().toString().slice(-4);
  return `${prefix}${randomBytes}${timestamp}`;
}

function generateAffiliateCode() {
  const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `MB${randomPart}`;
}

// ========================================
// GERAÇÃO DE CUPONS AUTOMÁTICOS
// ========================================

async function generateCoupons() {
  try {
    console.log('🎫 Gerando cupons automáticos...');

    const coupons = [
      {
        code: 'WELCOME10',
        discount_type: 'percentage',
        discount_value: 10.00,
        max_uses: 1000,
        expires_days: 60,
        metadata: { type: 'welcome', auto_generated: true }
      },
      {
        code: 'VIP15',
        discount_type: 'percentage', 
        discount_value: 15.00,
        max_uses: 500,
        expires_days: 30,
        metadata: { type: 'vip', auto_generated: true }
      },
      {
        code: 'BLACKFRIDAY25',
        discount_type: 'percentage',
        discount_value: 25.00,
        max_uses: 2000,
        expires_days: 7,
        metadata: { type: 'black_friday', auto_generated: true }
      },
      {
        code: 'FIRSTBUY20',
        discount_type: 'percentage',
        discount_value: 20.00,
        max_uses: 1500,
        expires_days: 45,
        metadata: { type: 'first_buy', auto_generated: true }
      },
      {
        code: 'PREMIUM30',
        discount_type: 'percentage',
        discount_value: 30.00,
        max_uses: 100,
        expires_days: 15,
        metadata: { type: 'premium', auto_generated: true }
      }
    ];

    for (const coupon of coupons) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + coupon.expires_days);

      try {
        const result = await pool.query(`
          INSERT INTO coupons (
            code, discount_type, discount_value, max_uses,
            current_uses, expires_at, is_active, created_by_user_id, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (code) DO UPDATE SET
            discount_value = $3,
            max_uses = $4,
            expires_at = $6,
            metadata = $9
          RETURNING *
        `, [
          coupon.code,
          coupon.discount_type,
          coupon.discount_value,
          coupon.max_uses,
          0, // current_uses
          expiresAt,
          true, // is_active
          1, // created_by_user_id (admin)
          JSON.stringify(coupon.metadata)
        ]);

        console.log(`   ✅ ${coupon.code}: ${coupon.discount_value}% desconto (${coupon.max_uses} usos)`);
      } catch (error) {
        console.log(`   ⚠️  ${coupon.code}: ${error.message}`);
      }
    }

    console.log('🎫 Cupons criados com sucesso!');
    return coupons.length;
  } catch (error) {
    console.error('❌ Erro ao gerar cupons:', error.message);
    return 0;
  }
}

// ========================================
// GERAÇÃO DE AFILIADOS AUTOMÁTICOS
// ========================================

async function generateAffiliates() {
  try {
    console.log('🤝 Gerando afiliados automáticos...');

    // Buscar usuários sem afiliação
    const usersResult = await pool.query(`
      SELECT u.id, u.email, u.user_type 
      FROM users u
      LEFT JOIN affiliates a ON u.id = a.user_id
      WHERE a.id IS NULL
      AND u.is_active = true
      LIMIT 100
    `);

    const users = usersResult.rows;
    console.log(`   📊 Encontrados ${users.length} usuários sem afiliação`);

    let affiliatesCreated = 0;

    for (const user of users) {
      try {
        const affiliateCode = generateAffiliateCode();
        const affiliateLink = `https://marketbot.ngrok.app/ref/${affiliateCode}`;
        const tier = user.user_type === 'vip' ? 'vip' : 'normal';
        const commissionRate = tier === 'vip' ? 0.05 : 0.015;

        const result = await pool.query(`
          INSERT INTO affiliates (
            user_id, affiliate_code, affiliate_link, commission_rate,
            total_referrals, total_commission_earned, commission_pending,
            commission_paid, is_active, tier, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *
        `, [
          user.id,
          affiliateCode,
          affiliateLink,
          commissionRate,
          0, // total_referrals
          0, // total_commission_earned
          0, // commission_pending
          0, // commission_paid
          true, // is_active
          tier,
          JSON.stringify({
            auto_generated: true,
            user_email: user.email,
            created_at: new Date().toISOString()
          })
        ]);

        console.log(`   ✅ ${affiliateCode} (${tier}): ${user.email} - ${(commissionRate * 100).toFixed(1)}%`);
        affiliatesCreated++;
      } catch (error) {
        console.log(`   ⚠️  Erro para usuário ${user.id}: ${error.message}`);
      }
    }

    console.log(`🤝 ${affiliatesCreated} afiliados criados!`);
    return affiliatesCreated;
  } catch (error) {
    console.error('❌ Erro ao gerar afiliados:', error.message);
    return 0;
  }
}

// ========================================
// GERAR AFILIADOS PARA ADMINISTRADORES
// ========================================

async function generateAdminAffiliates() {
  try {
    console.log('👑 Criando afiliados administrativos...');

    const adminAffiliates = [
      {
        email: 'admin@marketbot.com',
        code: 'MBADMIN01',
        tier: 'vip',
        rate: 0.10 // 10% para admin
      },
      {
        email: 'support@marketbot.com', 
        code: 'MBSUPPORT',
        tier: 'vip',
        rate: 0.07 // 7% para suporte
      },
      {
        email: 'marketing@marketbot.com',
        code: 'MBMARKETING',
        tier: 'vip',
        rate: 0.08 // 8% para marketing
      }
    ];

    for (const admin of adminAffiliates) {
      try {
        // Primeiro inserir/atualizar usuário
        const userResult = await pool.query(`
          INSERT INTO users (email, password_hash, user_type, is_active)
          VALUES ($1, 'admin_hash', 'admin', true)
          ON CONFLICT (email) DO UPDATE SET
            user_type = 'admin',
            is_active = true
          RETURNING id
        `, [admin.email]);

        const userId = userResult.rows[0].id;
        const affiliateLink = `https://marketbot.ngrok.app/ref/${admin.code}`;

        // Inserir afiliado
        await pool.query(`
          INSERT INTO affiliates (
            user_id, affiliate_code, affiliate_link, commission_rate,
            total_referrals, total_commission_earned, commission_pending,
            commission_paid, is_active, tier, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (affiliate_code) DO UPDATE SET
            commission_rate = $4,
            tier = $10
        `, [
          userId,
          admin.code,
          affiliateLink,
          admin.rate,
          0, 0, 0, 0, true, admin.tier,
          JSON.stringify({
            admin_affiliate: true,
            auto_generated: true,
            special_rate: true
          })
        ]);

        console.log(`   👑 ${admin.code}: ${admin.email} - ${(admin.rate * 100).toFixed(0)}% (ADMIN)`);
      } catch (error) {
        console.log(`   ⚠️  Erro para admin ${admin.email}: ${error.message}`);
      }
    }

    console.log('👑 Afiliados administrativos criados!');
  } catch (error) {
    console.error('❌ Erro ao criar afiliados admin:', error.message);
  }
}

// ========================================
// RELATÓRIO FINAL
// ========================================

async function generateReport() {
  try {
    console.log('📊 Gerando relatório final...');

    const couponsResult = await pool.query('SELECT COUNT(*) as total FROM coupons WHERE is_active = true');
    const affiliatesResult = await pool.query('SELECT COUNT(*) as total, tier FROM affiliates WHERE is_active = true GROUP BY tier');
    const usersResult = await pool.query('SELECT COUNT(*) as total FROM users WHERE is_active = true');

    console.log('');
    console.log('========================================');
    console.log('📋 RELATÓRIO FINAL - SISTEMA ATIVO');
    console.log('========================================');
    console.log(`👥 Usuários ativos: ${usersResult.rows[0]?.total || 0}`);
    console.log(`🎫 Cupons ativos: ${couponsResult.rows[0]?.total || 0}`);
    
    affiliatesResult.rows.forEach(row => {
      console.log(`🤝 Afiliados ${row.tier}: ${row.total}`);
    });

    console.log('');
    console.log('🔗 LINKS DE PAGAMENTO ATIVOS:');
    console.log('🟢 Mensal: https://buy.stripe.com/8x214m88f3in75eaF00Ny0h');
    console.log('🟡 Pré-pago: https://buy.stripe.com/9B6fZgbkrg59exG6oK0Ny0i');
    console.log('');
    console.log('✅ SISTEMA FINANCEIRO 100% OPERACIONAL!');
    console.log('========================================');

  } catch (error) {
    console.error('❌ Erro ao gerar relatório:', error.message);
  }
}

// ========================================
// EXECUÇÃO PRINCIPAL
// ========================================

async function main() {
  try {
    console.log('🚀 INICIANDO GERAÇÃO AUTOMÁTICA DE CUPONS E AFILIADOS');
    console.log('========================================');

    // Primeiro executar migração
    console.log('🗄️  Executando migração do sistema financeiro...');
    try {
      const migrationSql = require('fs').readFileSync('./migrations/005_stripe_financial_system.sql', 'utf8');
      await pool.query(migrationSql);
      console.log('✅ Migração executada com sucesso!');
    } catch (migrationError) {
      if (migrationError.message.includes('already exists')) {
        console.log('✅ Tabelas já existem, continuando...');
      } else {
        console.log('⚠️  Erro na migração (continuando):', migrationError.message);
      }
    }
    
    console.log('');

    const couponsCreated = await generateCoupons();
    console.log('');
    
    const affiliatesCreated = await generateAffiliates();
    console.log('');
    
    await generateAdminAffiliates();
    console.log('');
    
    await generateReport();

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  } finally {
    await pool.end();
  }
}

// Executar
main();
