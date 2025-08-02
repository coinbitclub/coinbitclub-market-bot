const { Pool } = require('pg');

const pool = new Pool({
  host: 'maglev.proxy.rlwy.net',
  port: 42095,
  database: 'railway',
  user: 'postgres',
  password: 'FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv'
});

async function removerUsuariosIncompletos() {
  try {
    console.log('🔄 REMOVENDO USUÁRIOS CRIADOS PARCIALMENTE...');
    
    const emails = [
      'pamaral15@hotmail.com',
      'erica.andrade.santos@hotmail.com', 
      'faleconosco@coinbitclub.vip'
    ];
    
    for (const email of emails) {
      // Buscar usuário
      const user = await pool.query('SELECT id, name FROM users WHERE email = $1', [email]);
      
      if (user.rows.length > 0) {
        const userId = user.rows[0].id;
        const userName = user.rows[0].name;
        
        console.log(`   🗑️ Removendo ${userName} (${email})...`);
        
        // Remover dependências primeiro
        await pool.query('DELETE FROM user_balances WHERE user_id = $1', [userId]);
        await pool.query('DELETE FROM user_api_keys WHERE user_id = $1', [userId]);
        await pool.query('DELETE FROM prepaid_balances WHERE user_id = $1', [userId]);
        
        // Remover usuário
        await pool.query('DELETE FROM users WHERE id = $1', [userId]);
        
        console.log(`     ✅ ${userName} removido completamente`);
      } else {
        console.log(`   ℹ️ ${email} não encontrado`);
      }
    }
    
    console.log('\n✅ LIMPEZA CONCLUÍDA!');
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error.message);
  } finally {
    await pool.end();
  }
}

removerUsuariosIncompletos();
