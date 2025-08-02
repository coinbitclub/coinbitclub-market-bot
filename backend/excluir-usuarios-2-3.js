const { Pool } = require('pg');

// Configuração de conexão com a string fornecida
const pool = new Pool({
  connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
  ssl: false,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 5
});

async function excluirUsuarios() {
  try {
    console.log('🔍 EXCLUINDO USUÁRIOS ESPECÍFICOS');
    console.log('📋 Alvos: Usuários com IDs 2 e 3');
    
    // 1. Verificar usuários que serão excluídos
    const usuariosParaExcluir = await pool.query(`
      SELECT id, name, email, vip_status, created_at
      FROM users 
      WHERE id IN (2, 3)
      ORDER BY id
    `);
    
    console.log('\n👥 USUÁRIOS QUE SERÃO EXCLUÍDOS:');
    usuariosParaExcluir.rows.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name || 'N/A'} (${user.email})`);
      console.log(`      ID: ${user.id} | VIP: ${user.vip_status ? 'Sim' : 'Não'}`);
      console.log(`      Cadastrado: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
    });
    
    if (usuariosParaExcluir.rows.length === 0) {
      console.log('❌ Nenhum usuário encontrado com IDs 2 ou 3');
      return;
    }
    
    console.log('\n⚠️  ATENÇÃO: Esta operação REMOVERÁ PERMANENTEMENTE estes usuários!');
    console.log('⏰ Iniciando em 3 segundos... (Ctrl+C para cancelar)');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n🚀 INICIANDO EXCLUSÃO...\n');
    
    // 2. Remover dependências primeiro (se existirem)
    console.log('🔄 Removendo dependências...');
    
    // Remover user_risk_profiles
    const deleteRiskProfiles = await pool.query(`
      DELETE FROM user_risk_profiles 
      WHERE user_id IN (2, 3)
      RETURNING id, user_id
    `);
    console.log(`   ✅ ${deleteRiskProfiles.rowCount} risk_profiles removidos`);
    
    // Remover user_trading_params
    const deleteTradingParams = await pool.query(`
      DELETE FROM user_trading_params 
      WHERE user_id IN (2, 3)
      RETURNING id, user_id
    `);
    console.log(`   ✅ ${deleteTradingParams.rowCount} trading_params removidos`);
    
    // Remover chaves API
    const deleteKeys = await pool.query(`
      DELETE FROM user_api_keys 
      WHERE user_id IN (2, 3)
      RETURNING id, user_id
    `);
    console.log(`   ✅ ${deleteKeys.rowCount} chaves API removidas`);
    
    // Remover saldos
    const deleteBalances = await pool.query(`
      DELETE FROM user_balances 
      WHERE user_id IN (2, 3)
      RETURNING id, user_id
    `);
    console.log(`   ✅ ${deleteBalances.rowCount} saldos removidos`);
    
    // Remover configurações
    const deleteConfigs = await pool.query(`
      DELETE FROM user_configurations 
      WHERE user_id IN (2, 3)
      RETURNING id, user_id
    `);
    console.log(`   ✅ ${deleteConfigs.rowCount} configurações removidas`);
    
    // Remover user_operations
    const deleteUserOps = await pool.query(`
      DELETE FROM user_operations 
      WHERE user_id IN (2, 3)
      RETURNING id, user_id
    `);
    console.log(`   ✅ ${deleteUserOps.rowCount} user_operations removidas`);
    
    // Remover trading_operations
    try {
      const deleteTradingOps = await pool.query(`
        DELETE FROM trading_operations 
        WHERE user_id IN (2, 3)
        RETURNING id, user_id
      `);
      console.log(`   ✅ ${deleteTradingOps.rowCount} trading_operations removidas`);
    } catch (error) {
      console.log(`   ⚠️  trading_operations: ${error.message}`);
    }
    
    // Remover user_sessions
    try {
      const deleteSessions = await pool.query(`
        DELETE FROM user_sessions 
        WHERE user_id IN (2, 3)
        RETURNING id, user_id
      `);
      console.log(`   ✅ ${deleteSessions.rowCount} sessions removidas`);
    } catch (error) {
      console.log(`   ⚠️  user_sessions: ${error.message}`);
    }
    
    // Remover user_notifications
    try {
      const deleteNotifications = await pool.query(`
        DELETE FROM user_notifications 
        WHERE user_id IN (2, 3)
        RETURNING id, user_id
      `);
      console.log(`   ✅ ${deleteNotifications.rowCount} notifications removidas`);
    } catch (error) {
      console.log(`   ⚠️  user_notifications: ${error.message}`);
    }
    
    // Remover user_settings
    try {
      const deleteSettings = await pool.query(`
        DELETE FROM user_settings 
        WHERE user_id IN (2, 3)
        RETURNING id, user_id
      `);
      console.log(`   ✅ ${deleteSettings.rowCount} settings removidas`);
    } catch (error) {
      console.log(`   ⚠️  user_settings: ${error.message}`);
    }
    
    // 3. Excluir os usuários
    console.log('\n🔄 Removendo usuários...');
    const deleteUsers = await pool.query(`
      DELETE FROM users 
      WHERE id IN (2, 3)
      RETURNING id, name, email
    `);
    
    console.log(`✅ ${deleteUsers.rowCount} usuários removidos:`);
    deleteUsers.rows.forEach(user => {
      console.log(`   🗑️  ${user.name || 'N/A'} (${user.email}) - ID: ${user.id}`);
    });
    
    // 4. Verificar resultado final
    const finalCount = await pool.query('SELECT COUNT(*) as total FROM users');
    const remainingUsers = await pool.query(`
      SELECT id, name, email, vip_status 
      FROM users 
      ORDER BY id
    `);
    
    console.log(`\n🎯 EXCLUSÃO CONCLUÍDA!`);
    console.log(`   📊 Total de usuários restantes: ${finalCount.rows[0].total}`);
    
    if (remainingUsers.rows.length > 0) {
      console.log('\n👥 USUÁRIOS RESTANTES:');
      remainingUsers.rows.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name || 'N/A'} (${user.email})`);
        console.log(`      ID: ${user.id} | VIP: ${user.vip_status ? 'Sim' : 'Não'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro durante a exclusão:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

excluirUsuarios();
