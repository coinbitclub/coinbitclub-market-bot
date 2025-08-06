const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
  ssl: { rejectUnauthorized: false }
});

async function createTestUser() {
  try {
    console.log('🔍 Verificando se usuário de teste existe...');
    
    // Verificar se usuário já existe
    const existingUser = await pool.query(
      'SELECT id, email, full_name FROM users WHERE email = $1',
      ['faleconosco@coinbitclub.vip']
    );

    if (existingUser.rows.length > 0) {
      console.log('✅ Usuário já existe:', existingUser.rows[0]);
      return;
    }

    console.log('👤 Criando usuário admin...');
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash('123456', 12);
    
    // Criar usuário admin
    const result = await pool.query(`
      INSERT INTO users (username, full_name, email, password_hash, role, status, phone, country, email_verified, phone_verified) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING id, username, full_name, email, role
    `, [
      'admin-coinbitclub',
      'Fale Conosco Admin',
      'faleconosco@coinbitclub.vip',
      hashedPassword,
      'admin',
      'active',
      '+5521987386645',
      'Brasil',
      true,
      true
    ]);

    console.log('✅ Usuário criado com sucesso:', result.rows[0]);
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
  } finally {
    await pool.end();
  }
}

createTestUser();
