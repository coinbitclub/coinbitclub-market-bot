const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway'
});

async function criarGestores() {
  try {
    console.log('🚀 Criando Gestores CoinBitClub...');
    
    const gestores = [
      {
        name: 'signals_manager',
        email: 'signals@coinbitclub.com',
        user_type: 'manager',
        role: 'GESTOR'
      },
      {
        name: 'operations_manager',
        email: 'operations@coinbitclub.com',
        user_type: 'manager',
        role: 'GESTOR'
      },
      {
        name: 'fear_greed_manager',
        email: 'feargreed@coinbitclub.com',
        user_type: 'manager',
        role: 'GESTOR'
      },
      {
        name: 'financial_supervisor',
        email: 'financial@coinbitclub.com',
        user_type: 'supervisor',
        role: 'SUPERVISOR'
      },
      {
        name: 'trade_supervisor',
        email: 'trades@coinbitclub.com',
        user_type: 'supervisor',
        role: 'SUPERVISOR'
      },
      {
        name: 'users_manager',
        email: 'users@coinbitclub.com',
        user_type: 'manager',
        role: 'GESTOR'
      },
      {
        name: 'risk_manager',
        email: 'risk@coinbitclub.com',
        user_type: 'manager',
        role: 'GESTOR'
      },
      {
        name: 'analytics_manager',
        email: 'analytics@coinbitclub.com',
        user_type: 'manager',
        role: 'GESTOR'
      }
    ];

    for (const gestor of gestores) {
      try {
        await pool.query(`
          INSERT INTO users (
            id, name, email, password_hash, role, status, user_type, 
            is_active, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), 
            $1, 
            $2, 
            'hashed_password_123', 
            $3, 
            'active', 
            $4,
            true, 
            NOW(), 
            NOW()
          )
          ON CONFLICT (email) DO UPDATE SET
            name = $1,
            user_type = $4,
            role = $3,
            status = 'active',
            is_active = true,
            updated_at = NOW()
        `, [gestor.name, gestor.email, gestor.role, gestor.user_type]);
        
        console.log(`✅ ${gestor.name} criado/atualizado com sucesso`);
      } catch (error) {
        console.log(`⚠️ ${gestor.name}: ${error.message}`);
      }
    }

    // Verificar se foram criados
    const result = await pool.query(`
      SELECT name, email, user_type, role, status
      FROM users 
      WHERE name IN (
        'signals_manager', 'operations_manager', 'fear_greed_manager',
        'financial_supervisor', 'trade_supervisor', 'users_manager',
        'risk_manager', 'analytics_manager'
      )
    `);

    console.log('\n📊 GESTORES CRIADOS:');
    console.log('==================');
    result.rows.forEach(gestor => {
      console.log(`🤖 ${gestor.name} - ${gestor.user_type} - ${gestor.role} - ${gestor.status}`);
    });

    console.log(`\n🎉 Total de gestores ativos: ${result.rows.length}`);
    
  } catch (error) {
    console.error('❌ Erro ao criar gestores:', error.message);
  } finally {
    await pool.end();
  }
}

criarGestores();
