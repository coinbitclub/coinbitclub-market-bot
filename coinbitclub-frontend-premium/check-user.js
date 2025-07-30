const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
  ssl: { rejectUnauthorized: false }
});

async function checkUser() {
  try {
    console.log('🔍 Verificando usuário no banco...');
    
    // Buscar usuário
    const result = await pool.query(
      'SELECT id, name, email, password_hash, role, status FROM users WHERE email = $1',
      ['faleconosco@coinbitclub.vip']
    );

    if (result.rows.length === 0) {
      console.log('❌ Usuário não encontrado');
      return;
    }

    const user = result.rows[0];
    console.log('👤 Usuário encontrado:');
    console.log('- ID:', user.id);
    console.log('- Nome:', user.name);
    console.log('- Email:', user.email); 
    console.log('- Role:', user.role);
    console.log('- Status:', user.status);
    console.log('- Password Hash:', user.password_hash ? 'Existe' : 'Não existe');

    // Testar senha
    if (user.password_hash) {
      const isValid = await bcrypt.compare('123456', user.password_hash);
      console.log('🔐 Senha "123456" é válida:', isValid);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

checkUser();
