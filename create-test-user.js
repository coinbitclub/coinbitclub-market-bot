const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway'
});

async function createTestUser() {
  try {
    // Criar usuário de teste
    await pool.query(`
      INSERT INTO users (email, name, role, password_hash, is_active) 
      VALUES ($1, $2, $3, $4, $5) 
      ON CONFLICT (email) DO UPDATE SET 
        password_hash = $4, 
        is_active = $5
    `, ['faleconosco@coinbitclub.vip', 'Admin User', 'admin', 'placeholder', true]);
    
    console.log('✅ Usuario criado/atualizado: faleconosco@coinbitclub.vip');
    
    // Verificar o usuário
    const result = await pool.query('SELECT * FROM users WHERE email = $1', ['faleconosco@coinbitclub.vip']);
    console.log('Usuário encontrado:', result.rows[0]);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    pool.end();
  }
}

createTestUser();
