const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
  ssl: { rejectUnauthorized: false }
});

async function createTestUser() {
  try {
    console.log('🔍 Verificando se usuário de teste existe...');
    
    // Verificar se usuário já existe
    const existingUser = await pool.query(
      'SELECT id, email, name FROM users WHERE email = $1',
      ['faleconosco@coinbitclub.vip']
    );

    if (existingUser.rows.length > 0) {
      console.log('✅ Usuário já existe:', existingUser.rows[0]);
      return;
    }

    console.log('👤 Criando usuário de teste...');
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash('123456', 12);
    
    // Criar usuário
    const result = await pool.query(`
      INSERT INTO users (name, email, password_hash, role, status, phone) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING id, name, email, role
    `, [
      'Fale Conosco',
      'faleconosco@coinbitclub.vip',
      hashedPassword,
      'admin',
      'active',
      '+5511999999999'
    ]);

    console.log('✅ Usuário criado com sucesso:', result.rows[0]);
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
  } finally {
    await pool.end();
  }
}

createTestUser();
