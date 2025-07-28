const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function populateTestData() {
  console.log('🎭 Populando dados de teste para o dashboard...\n');
  
  try {
    // Adicionar mais alguns usuários de teste
    const testUsers = [
      {
        name: 'Carlos Investidor',
        email: 'carlos.investidor@coinbitclub.com',
        phone: '(11) 98888-1111',
        password: '$2b$10$example.hash.here',
        user_type: 'user',
        is_active: true
      },
      {
        name: 'Ana Trader',
        email: 'ana.trader@coinbitclub.com', 
        phone: '(11) 98888-2222',
        password: '$2b$10$example.hash.here',
        user_type: 'user',
        is_active: true
      },
      {
        name: 'Roberto Afiliado',
        email: 'roberto.afiliado@coinbitclub.com',
        phone: '(11) 98888-3333', 
        password: '$2b$10$example.hash.here',
        user_type: 'affiliate',
        is_active: true
      }
    ];

    for (const user of testUsers) {
      // Verificar se já existe
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [user.email]
      );

      if (existingUser.rows.length === 0) {
        console.log(`👤 Criando usuário: ${user.name}`);
        
        const userResult = await pool.query(
          `INSERT INTO users (name, email, phone, password_hash, user_type, is_active)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
          [user.name, user.email, user.phone, user.password, user.user_type, user.is_active]
        );

        const userId = userResult.rows[0].id;

        // Criar user_balance
        await pool.query(
          `INSERT INTO user_balances (user_id, prepaid_balance, total_profit, total_loss)
           VALUES ($1, $2, $3, $4)`,
          [userId, Math.random() * 1000, Math.random() * 500, Math.random() * 200]
        );

        // Criar subscription
        const basicPlanId = '042e6ad2-2517-4197-b5ec-1d6d2fca5745';
        await pool.query(
          `INSERT INTO subscriptions (user_id, plan_id, status, plan_type)
           VALUES ($1, $2, 'active', 'basic')`,
          [userId, basicPlanId]
        );

        // Se for afiliado, criar registro
        if (user.user_type === 'affiliate') {
          const affiliateCode = `CBC${Date.now().toString().slice(-6)}`;
          await pool.query(
            `INSERT INTO affiliates (user_id, code, affiliate_code, commission_rate, is_active)
             VALUES ($1, $2, $3, 0.15, true)`,
            [userId, affiliateCode, affiliateCode]
          );
        }

        console.log(`✅ ${user.name} criado com sucesso!`);
      } else {
        console.log(`👤 ${user.name} já existe, pulando...`);
      }
    }

    // Buscar estatísticas atualizadas
    console.log('\n📊 ESTATÍSTICAS ATUALIZADAS:');
    console.log('============================');

    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE is_active = true) as active_users,
        (SELECT COUNT(*) FROM users WHERE user_type = 'user') as regular_users,
        (SELECT COUNT(*) FROM users WHERE user_type = 'affiliate') as affiliates,
        (SELECT COUNT(*) FROM users WHERE user_type = 'admin') as admins,
        (SELECT COUNT(*) FROM subscriptions) as total_subscriptions,
        (SELECT COUNT(*) FROM subscriptions WHERE status = 'active') as active_subscriptions,
        (SELECT ROUND(AVG(prepaid_balance), 2) FROM user_balances) as avg_balance,
        (SELECT ROUND(SUM(total_profit), 2) FROM user_balances) as total_profit,
        (SELECT COUNT(*) FROM affiliates WHERE is_active = true) as active_affiliates
    `;

    const statsResult = await pool.query(statsQuery);
    const stats = statsResult.rows[0];

    console.log(`👥 Total de Usuários: ${stats.total_users}`);
    console.log(`✅ Usuários Ativos: ${stats.active_users}`);
    console.log(`👤 Usuários Regulares: ${stats.regular_users}`);
    console.log(`🤝 Afiliados: ${stats.affiliates}`);
    console.log(`👑 Administradores: ${stats.admins}`);
    console.log(`📦 Total Subscriptions: ${stats.total_subscriptions}`);
    console.log(`✅ Subscriptions Ativas: ${stats.active_subscriptions}`);
    console.log(`💰 Saldo Médio: R$ ${stats.avg_balance}`);
    console.log(`📈 Lucro Total: R$ ${stats.total_profit}`);
    console.log(`🤝 Afiliados Ativos: ${stats.active_affiliates}`);

    console.log('\n🎯 DADOS DE TESTE POPULADOS COM SUCESSO!');
    console.log('========================================');
    console.log('🌐 Acesse: http://localhost:3000/admin/dashboard-real');
    console.log('📧 Login: admin.dashboard@coinbitclub.com');
    console.log('🔐 Senha: admin123');

  } catch (error) {
    console.error('❌ Erro ao popular dados:', error.message);
  } finally {
    await pool.end();
  }
}

populateTestData();
