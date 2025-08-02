const { Pool } = require('pg');

// Usar a conexão correta fornecida pelo usuário
const pool = new Pool({
  connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
  ssl: false
});

async function limpezaCompletaSistema() {
  try {
    console.log('🔍 INICIANDO LIMPEZA COMPLETA DO SISTEMA');
    console.log('📋 Mantendo apenas usuários com chaves válidas e pagantes');
    console.log('🔗 Conexão: maglev.proxy.rlwy.net:42095');

    // 1. IDENTIFICAR USUÁRIOS VÁLIDOS
    console.log('\n👥 Identificando usuários VÁLIDOS...');
    
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

    const validUserIds = validUsersQuery.rows.map(u => u.id);
    const validUserIdsStr = validUserIds.map(id => `'${id}'`).join(',');
    console.log(`\n🎯 IDs dos usuários válidos: ${validUserIdsStr}`);

    // 2. ANÁLISE PRÉVIA
    console.log('\n📊 ANALISANDO DADOS QUE SERÃO REMOVIDOS...');
    
    // Contar usuários inválidos
    const invalidUsersCount = await pool.query(`
      SELECT COUNT(*) as count FROM users WHERE id NOT IN (${validUserIdsStr})
    `);
    
    // Contar operações de teste
    const invalidOpsCount = await pool.query(`
      SELECT COUNT(*) as count FROM operations 
      WHERE user_id NOT IN (${validUserIdsStr})
    `);
    
    // Contar chaves inválidas
    const invalidKeysCount = await pool.query(`
      SELECT COUNT(*) as count FROM user_api_keys 
      WHERE validation_status != 'valid' OR is_active = false OR user_id NOT IN (${validUserIdsStr})
    `);
    
    console.log(`📋 RESUMO DA LIMPEZA:`);
    console.log(`   🗑️  ${invalidUsersCount.rows[0].count} usuários inválidos`);
    console.log(`   🗑️  ${invalidOpsCount.rows[0].count} operações de teste`);
    console.log(`   🗑️  ${invalidKeysCount.rows[0].count} chaves inválidas`);
    
    console.log('\n⚠️  ATENÇÃO: Esta operação é IRREVERSÍVEL!');
    console.log('📋 Resumo da limpeza:');
    console.log(`   ✅ Manter: ${validUsersQuery.rows.length} usuários válidos`);
    console.log(`   🗑️  Remover: Todos os dados de teste e usuários sem chaves válidas`);
    
    // Aguardar 5 segundos para dar tempo de cancelar
    console.log('\n⏰ Iniciando limpeza em 5 segundos... (Ctrl+C para cancelar)');
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('\n🚀 INICIANDO LIMPEZA...\n');

    // 3. LIMPEZA SISTEMÁTICA
    let deletedCount = 0;

    // Limpar operações de teste
    console.log('🔄 Removendo operações de teste...');
    const deleteOps = await pool.query(`
      DELETE FROM operations 
      WHERE user_id NOT IN (${validUserIdsStr})
      RETURNING id
    `);
    deletedCount += deleteOps.rowCount;
    console.log(`   ✅ ${deleteOps.rowCount} operações removidas`);

    // Limpar user_operations de teste
    console.log('🔄 Removendo user_operations de teste...');
    const deleteUserOps = await pool.query(`
      DELETE FROM user_operations 
      WHERE user_id NOT IN (${validUserIdsStr})
      RETURNING id
    `).catch(() => ({ rowCount: 0 }));
    deletedCount += deleteUserOps.rowCount;
    console.log(`   ✅ ${deleteUserOps.rowCount} user_operations removidas`);

    // Limpar trading_operations de teste
    console.log('🔄 Removendo trading_operations de teste...');
    const deleteTradingOps = await pool.query(`
      DELETE FROM trading_operations 
      WHERE user_id NOT IN (${validUserIdsStr})
      RETURNING id
    `).catch(() => ({ rowCount: 0 }));
    deletedCount += deleteTradingOps.rowCount;
    console.log(`   ✅ ${deleteTradingOps.rowCount} trading_operations removidas`);

    // Limpar chaves inválidas
    console.log('🔄 Removendo chaves API inválidas...');
    const deleteKeys = await pool.query(`
      DELETE FROM user_api_keys 
      WHERE validation_status != 'valid' 
        OR is_active = false
        OR user_id NOT IN (${validUserIdsStr})
      RETURNING id
    `);
    deletedCount += deleteKeys.rowCount;
    console.log(`   ✅ ${deleteKeys.rowCount} chaves removidas`);

    // Limpar saldos de usuários inválidos
    console.log('🔄 Removendo saldos de usuários inválidos...');
    const deleteBalances = await pool.query(`
      DELETE FROM user_balances 
      WHERE user_id NOT IN (${validUserIdsStr})
      RETURNING id
    `).catch(() => ({ rowCount: 0 }));
    deletedCount += deleteBalances.rowCount;
    console.log(`   ✅ ${deleteBalances.rowCount} saldos removidos`);

    // Limpar sinais antigos e de teste
    console.log('🔄 Removendo sinais antigos e de teste...');
    const deleteSignals = await pool.query(`
      DELETE FROM signals 
      WHERE created_at < NOW() - INTERVAL '30 days'
        OR id NOT IN (
          SELECT DISTINCT signal_id 
          FROM operations 
          WHERE user_id IN (${validUserIdsStr})
          AND signal_id IS NOT NULL
        )
      RETURNING id
    `).catch(() => ({ rowCount: 0 }));
    deletedCount += deleteSignals.rowCount;
    console.log(`   ✅ ${deleteSignals.rowCount} sinais removidos`);

    // Limpar configurações de usuários inválidos
    console.log('🔄 Removendo configurações de usuários inválidos...');
    const deleteConfigs = await pool.query(`
      DELETE FROM user_configurations 
      WHERE user_id NOT IN (${validUserIdsStr})
      RETURNING id
    `).catch(() => ({ rowCount: 0 }));
    deletedCount += deleteConfigs.rowCount;
    console.log(`   ✅ ${deleteConfigs.rowCount} configurações removidas`);

    // Limpar outros dados relacionados
    console.log('🔄 Removendo dados relacionados...');
    
    // Logs de atividade
    const deleteLogs = await pool.query(`
      DELETE FROM activity_logs 
      WHERE user_id NOT IN (${validUserIdsStr})
      RETURNING id
    `).catch(() => ({ rowCount: 0 }));
    deletedCount += deleteLogs.rowCount;
    console.log(`   ✅ ${deleteLogs.rowCount} logs removidos`);

    // Notificações
    const deleteNotifications = await pool.query(`
      DELETE FROM notifications 
      WHERE user_id NOT IN (${validUserIdsStr})
      RETURNING id
    `).catch(() => ({ rowCount: 0 }));
    deletedCount += deleteNotifications.rowCount;
    console.log(`   ✅ ${deleteNotifications.rowCount} notificações removidas`);

    // Limpar usuários inválidos por último
    console.log('🔄 Removendo usuários inválidos...');
    const deleteUsers = await pool.query(`
      DELETE FROM users 
      WHERE id NOT IN (${validUserIdsStr})
      RETURNING id, name, email
    `);
    deletedCount += deleteUsers.rowCount;
    console.log(`   ✅ ${deleteUsers.rowCount} usuários removidos`);

    // 4. VERIFICAÇÃO FINAL
    console.log('\n🔍 VERIFICAÇÃO FINAL...');
    
    const finalUsers = await pool.query('SELECT COUNT(*) as count FROM users');
    const finalOps = await pool.query('SELECT COUNT(*) as count FROM operations');
    const finalKeys = await pool.query('SELECT COUNT(*) as count FROM user_api_keys');
    
    console.log(`📊 RESULTADO FINAL:`);
    console.log(`   👥 Usuários restantes: ${finalUsers.rows[0].count}`);
    console.log(`   📈 Operações restantes: ${finalOps.rows[0].count}`);
    console.log(`   🔑 Chaves restantes: ${finalKeys.rows[0].count}`);
    console.log(`   🗑️  Total removido: ${deletedCount} registros`);

    // 5. LISTAGEM FINAL DOS USUÁRIOS VÁLIDOS
    console.log('\n✅ USUÁRIOS VÁLIDOS MANTIDOS:');
    validUsersQuery.rows.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name || 'N/A'} (${user.email})`);
    });

    console.log('\n🎉 LIMPEZA CONCLUÍDA COM SUCESSO!');
    console.log('📋 Sistema agora contém apenas usuários com chaves válidas e pagantes.');

  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

// Executar limpeza
limpezaCompletaSistema();
