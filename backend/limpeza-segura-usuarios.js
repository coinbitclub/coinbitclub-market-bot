const { Pool } = require('pg');

// Usar a conexão correta fornecida pelo usuário
const pool = new Pool({
  connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
  ssl: false
});

async function limpezaSeguraUsuarios() {
  try {
    console.log('🔍 INICIANDO LIMPEZA SEGURA DO SISTEMA');
    console.log('📋 Removendo apenas usuários SEM chaves válidas');
    console.log('🔗 Conexão: maglev.proxy.rlwy.net:42095');

    // 1. IDENTIFICAR USUÁRIOS VÁLIDOS
    console.log('\n👥 Identificando usuários com chaves VÁLIDAS...');
    
    const validUsersQuery = await pool.query(`
      SELECT DISTINCT u.id, u.name, u.email, u.vip_status, u.created_at
      FROM users u
      INNER JOIN user_api_keys k ON u.id = k.user_id
      WHERE k.validation_status = 'valid' 
        AND k.is_active = true
        AND u.status = 'active'
      ORDER BY u.created_at DESC
    `);

    console.log(`✅ Encontrados ${validUsersQuery.rows.length} usuários VÁLIDOS:`);
    validUsersQuery.rows.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name || 'N/A'} (${user.email}) - VIP: ${user.vip_status ? 'Sim' : 'Não'}`);
      console.log(`      ID: ${user.id}`);
      console.log(`      Cadastrado: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
    });

    if (validUsersQuery.rows.length === 0) {
      console.log('❌ NENHUM usuário válido encontrado! Operação cancelada.');
      return;
    }

    // 2. IDENTIFICAR USUÁRIOS INVÁLIDOS
    console.log('\n👥 Identificando usuários INVÁLIDOS (sem chaves válidas)...');
    
    const invalidUsersQuery = await pool.query(`
      SELECT u.id, u.name, u.email, u.created_at
      FROM users u
      WHERE u.id NOT IN (
        SELECT DISTINCT user_id 
        FROM user_api_keys 
        WHERE validation_status = 'valid' AND is_active = true
      )
      ORDER BY u.created_at DESC
    `);

    console.log(`❌ Encontrados ${invalidUsersQuery.rows.length} usuários INVÁLIDOS:`);
    invalidUsersQuery.rows.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name || 'N/A'} (${user.email})`);
      console.log(`      ID: ${user.id}`);
      console.log(`      Cadastrado: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
    });

    if (invalidUsersQuery.rows.length === 0) {
      console.log('✅ Nenhum usuário inválido encontrado. Sistema já está limpo!');
      return;
    }

    // 3. ANÁLISE DE DEPENDÊNCIAS
    console.log('\n📊 Analisando dependências dos usuários inválidos...');
    
    for (const user of invalidUsersQuery.rows) {
      console.log(`\n🔍 Analisando usuário: ${user.name || 'N/A'} (ID: ${user.id})`);
      
      // Verificar operações
      const opsCount = await pool.query(`
        SELECT COUNT(*) as count FROM operations WHERE user_id = $1
      `, [user.id]);
      console.log(`   📈 Operações: ${opsCount.rows[0].count}`);
      
      // Verificar chaves
      const keysCount = await pool.query(`
        SELECT COUNT(*) as count FROM user_api_keys WHERE user_id = $1
      `, [user.id]);
      console.log(`   🔑 Chaves API: ${keysCount.rows[0].count}`);
      
      // Verificar saldos
      const balanceCount = await pool.query(`
        SELECT COUNT(*) as count FROM user_balances WHERE user_id = $1
      `, [user.id]);
      console.log(`   💰 Saldos: ${balanceCount.rows[0].count}`);
    }

    // 4. CONFIRMAÇÃO
    console.log('\n⚠️  ATENÇÃO: Esta operação removerá usuários sem chaves válidas!');
    console.log('📋 Resumo:');
    console.log(`   ✅ Manter: ${validUsersQuery.rows.length} usuários com chaves válidas`);
    console.log(`   🗑️  Remover: ${invalidUsersQuery.rows.length} usuários sem chaves válidas`);
    
    console.log('\n⏰ Iniciando limpeza em 5 segundos... (Ctrl+C para cancelar)');
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('\n🚀 INICIANDO LIMPEZA DOS USUÁRIOS INVÁLIDOS...\n');

    // 5. REMOÇÃO SEGURA USUÁRIO POR USUÁRIO
    let totalRemoved = 0;

    for (const user of invalidUsersQuery.rows) {
      console.log(`🔄 Removendo usuário: ${user.name || 'N/A'} (ID: ${user.id})`);
      
      try {
        // Remover dependências primeiro
        await pool.query('DELETE FROM user_balances WHERE user_id = $1', [user.id]);
        await pool.query('DELETE FROM user_api_keys WHERE user_id = $1', [user.id]);
        await pool.query('DELETE FROM user_configurations WHERE user_id = $1', [user.id]);
        await pool.query('DELETE FROM activity_logs WHERE user_id = $1', [user.id]);
        await pool.query('DELETE FROM notifications WHERE user_id = $1', [user.id]);
        
        // Remover operações (com cuidado para UUIDs)
        const opsResult = await pool.query('DELETE FROM operations WHERE user_id = $1', [user.id]);
        console.log(`   ✅ ${opsResult.rowCount} operações removidas`);
        
        // Remover usuário
        const userResult = await pool.query('DELETE FROM users WHERE id = $1', [user.id]);
        console.log(`   ✅ Usuário removido`);
        
        totalRemoved++;
        
      } catch (error) {
        console.log(`   ❌ Erro ao remover usuário ${user.id}: ${error.message}`);
      }
    }

    // 6. VERIFICAÇÃO FINAL
    console.log('\n🔍 VERIFICAÇÃO FINAL...');
    
    const finalUsers = await pool.query('SELECT COUNT(*) as count FROM users');
    const finalValidUsers = await pool.query(`
      SELECT COUNT(DISTINCT u.id) as count
      FROM users u
      INNER JOIN user_api_keys k ON u.id = k.user_id
      WHERE k.validation_status = 'valid' AND k.is_active = true
    `);
    
    console.log(`📊 RESULTADO FINAL:`);
    console.log(`   👥 Total de usuários: ${finalUsers.rows[0].count}`);
    console.log(`   ✅ Usuários com chaves válidas: ${finalValidUsers.rows[0].count}`);
    console.log(`   🗑️  Usuários removidos: ${totalRemoved}`);

    console.log('\n✅ USUÁRIOS VÁLIDOS MANTIDOS:');
    validUsersQuery.rows.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name || 'N/A'} (${user.email})`);
    });

    console.log('\n🎉 LIMPEZA CONCLUÍDA COM SUCESSO!');
    console.log('📋 Sistema agora contém apenas usuários com chaves válidas ativas.');

  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

// Executar limpeza
limpezaSeguraUsuarios();
