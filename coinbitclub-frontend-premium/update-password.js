const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
  ssl: { rejectUnauthorized: false }
});

async function updatePassword() {
  try {
    console.log('🔍 Atualizando senha do usuário...');
    
    // Hash da nova senha
    const hashedPassword = await bcrypt.hash('123456', 12);
    console.log('🔐 Nova senha hasheada gerada');
    
    // Atualizar senha no banco
    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id, name, email',
      [hashedPassword, 'faleconosco@coinbitclub.vip']
    );

    if (result.rows.length > 0) {
      console.log('✅ Senha atualizada com sucesso para usuário:', result.rows[0]);
      
      // Verificar se a senha está funcionando
      const isValid = await bcrypt.compare('123456', hashedPassword);
      console.log('🔐 Verificação da nova senha:', isValid);
    } else {
      console.log('❌ Usuário não encontrado para atualização');
    }
    
  } catch (error) {
    console.error('❌ Erro ao atualizar senha:', error.message);
  } finally {
    await pool.end();
  }
}

updatePassword();
