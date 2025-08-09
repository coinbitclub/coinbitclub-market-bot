const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
  ssl: false
});

async function createAdminUser() {
  try {
    console.log('🔍 Verificando se usuário admin existe...');
    
    // Verificar se usuário já existe
    const existingUser = await pool.query(
      'SELECT id, email, username FROM users WHERE email = $1',
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
      INSERT INTO users (username, email, password_hash, role, status, full_name, phone, email_verified) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING id, username, email, role, full_name
    `, [
      'faleconosco',
      'faleconosco@coinbitclub.vip',
      hashedPassword,
      'admin',
      'active',
      'Fale Conosco Admin',
      '+5521987386645',
      true
    ]);

    console.log('✅ Usuário admin criado com sucesso:', result.rows[0]);
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
  } finally {
    await pool.end();
  }
}

createAdminUser();
