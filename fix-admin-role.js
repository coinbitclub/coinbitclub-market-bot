#!/usr/bin/env node

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
  ssl: { rejectUnauthorized: false }
});

async function updateUserRole() {
  try {
    console.log('🔄 Atualizando role do usuário admin...');
    
    // Verificar usuários existentes
    const users = await pool.query('SELECT id, name, email, role FROM users');
    console.log('👥 Usuários encontrados:');
    users.rows.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Role: ${user.role}`);
    });
    
    // Atualizar role do admin
    const result = await pool.query(
      "UPDATE users SET role = 'admin' WHERE email = 'admin@coinbitclub.com'",
    );
    
    console.log('✅ Role do admin atualizado para "admin"');
    console.log(`📊 ${result.rowCount} registro(s) atualizado(s)`);
    
    // Verificar novamente
    const updatedUser = await pool.query(
      'SELECT id, name, email, role FROM users WHERE email = $1',
      ['admin@coinbitclub.com']
    );
    
    if (updatedUser.rows.length > 0) {
      const user = updatedUser.rows[0];
      console.log(`✅ Verificação: ${user.name} agora tem role "${user.role}"`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao atualizar role:', error);
  } finally {
    await pool.end();
  }
}

updateUserRole();
