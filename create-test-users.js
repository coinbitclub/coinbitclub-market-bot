#!/usr/bin/env node

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
  ssl: { rejectUnauthorized: false }
});

async function createTestUsers() {
  try {
    console.log('👥 Criando usuários de teste para todos os perfis...');
    
    const testUsers = [
      { email: 'user@coinbitclub.com', password: 'user123', name: 'Usuário Teste', role: 'user' },
      { email: 'affiliate@coinbitclub.com', password: 'affiliate123', name: 'Afiliado Teste', role: 'affiliate' },
      { email: 'gestor@coinbitclub.com', password: 'gestor123', name: 'Gestor Teste', role: 'gestor' },
      { email: 'operador@coinbitclub.com', password: 'operador123', name: 'Operador Teste', role: 'operador' },
      { email: 'supervisor@coinbitclub.com', password: 'supervisor123', name: 'Supervisor Teste', role: 'supervisor' }
    ];
    
    for (const user of testUsers) {
      try {
        // Verificar se usuário já existe
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [user.email]);
        
        if (existing.rows.length > 0) {
          console.log(`⚠️  Usuário ${user.email} já existe, atualizando role...`);
          await pool.query(
            'UPDATE users SET role = $1 WHERE email = $2',
            [user.role, user.email]
          );
        } else {
          // Hash da senha
          const hashedPassword = await bcrypt.hash(user.password, 12);
          
          // Inserir usuário
          await pool.query(`
            INSERT INTO users (name, email, password_hash, role, status, created_at)
            VALUES ($1, $2, $3, $4, 'active', NOW())
          `, [user.name, user.email, hashedPassword, user.role]);
          
          console.log(`✅ Usuário criado: ${user.email} (${user.role})`);
        }
      } catch (error) {
        console.error(`❌ Erro ao criar usuário ${user.email}:`, error.message);
      }
    }
    
    // Verificar todos os usuários
    console.log('\n📋 Lista final de usuários de teste:');
    const allUsers = await pool.query(`
      SELECT name, email, role 
      FROM users 
      WHERE email IN ('admin@coinbitclub.com', 'user@coinbitclub.com', 'affiliate@coinbitclub.com', 'gestor@coinbitclub.com', 'operador@coinbitclub.com', 'supervisor@coinbitclub.com')
      ORDER BY role
    `);
    
    allUsers.rows.forEach(user => {
      console.log(`${getRoleIcon(user.role)} ${user.name} (${user.email}) - ${user.role}`);
    });
    
    console.log('\n🔑 Credenciais de teste:');
    console.log('Admin: admin@coinbitclub.com / admin123');
    console.log('User: user@coinbitclub.com / user123');
    console.log('Affiliate: affiliate@coinbitclub.com / affiliate123');
    console.log('Gestor: gestor@coinbitclub.com / gestor123');
    console.log('Operador: operador@coinbitclub.com / operador123');
    console.log('Supervisor: supervisor@coinbitclub.com / supervisor123');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    await pool.end();
  }
}

function getRoleIcon(role) {
  const icons = {
    'admin': '👑',
    'user': '👤',
    'affiliate': '💰',
    'gestor': '📊',
    'operador': '⚙️',
    'supervisor': '🎖️'
  };
  return icons[role] || '👤';
}

createTestUsers();
