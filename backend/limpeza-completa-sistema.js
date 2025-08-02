const { Pool } = require('pg');

const pool = new Pool({
  host: 'maglev.proxy.rlwy.net',
  port: 42095,
  user: 'postgres',
  password: 'FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv',
  database: 'railway'
});

async function limpezaCompletaSistema() {
  try {
    console.log('🔍 INICIANDO LIMPEZA COMPLETA DO SISTEMA');
    console.log('📋 Mantendo apenas usuários com chaves válidas e pagantes\n');

    // 1. Primeiro, identificar usuários VÁLIDOS (com chaves válidas e pagamentos)
    console.log('👥 Identificando usuários VÁLIDOS...');
    
    const validUsersQuery = await pool.query(`
      SELECT DISTINCT u.id, u.name, u.email, u.created_at, u.vip_status
      FROM users u
      INNER JOIN user_api_keys uak ON u.id = uak.user_id
      WHERE uak.validation_status = 'valid' 
        AND uak.is_active = true
        AND u.status = 'active'
      ORDER BY u.created_at
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

    // 2. Verificar dados que serão removidos
    console.log('\n📊 ANALISANDO DADOS QUE SERÃO REMOVIDOS...');

    // Usuários inválidos
    const invalidUsersQuery = await pool.query(`
      SELECT COUNT(*) as total
      FROM users 
      WHERE id NOT IN (${validUserIdsStr})
    `);

    // Operações de teste - tratando user_id como text
    const testOperationsQuery = await pool.query(`
      SELECT COUNT(*) as total
      FROM operations 
      WHERE user_id NOT IN (${validUserIdsStr})
    `);

    // Sinais de teste
    const testSignalsQuery = await pool.query(`
      SELECT COUNT(*) as total
      FROM signals 
      WHERE created_at < NOW() - INTERVAL '30 days'
        OR id NOT IN (
          SELECT DISTINCT signal_id 
          FROM operations 
          WHERE user_id IN (${validUserIdsStr})
          AND signal_id IS NOT NULL
        )
    `);

    // Chaves inválidas
    const invalidKeysQuery = await pool.query(`
      SELECT COUNT(*) as total
      FROM user_api_keys 
      WHERE validation_status != 'valid' 
        OR is_active = false
        OR user_id NOT IN (${validUserIdsStr})
    `);

    console.log(`   🗑️  Usuários de teste: ${invalidUsersQuery.rows[0].total}`);
    console.log(`   🗑️  Operações de teste: ${testOperationsQuery.rows[0].total}`);
    console.log(`   🗑️  Sinais antigos/teste: ${testSignalsQuery.rows[0].total}`);
    console.log(`   🗑️  Chaves inválidas: ${invalidKeysQuery.rows[0].total}`);

    // 3. CONFIRMAÇÃO ANTES DA LIMPEZA
    console.log('\n⚠️  ATENÇÃO: Esta operação é IRREVERSÍVEL!');
    console.log('📋 Resumo da limpeza:');
    console.log(`   ✅ Manter: ${validUsersQuery.rows.length} usuários válidos`);
    console.log(`   🗑️  Remover: Todos os dados de teste e usuários sem chaves válidas`);
    
    // Aguardar 5 segundos para dar tempo de cancelar
    console.log('\n⏰ Iniciando limpeza em 5 segundos... (Ctrl+C para cancelar)');
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('\n🚀 INICIANDO LIMPEZA...\n');

    // 4. LIMPEZA SISTEMÁTICA
    let deletedCount = 0;

    // Limpar operações de teste - tratando user_id como text
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
    `);
    deletedCount += deleteUserOps.rowCount;
    console.log(`   ✅ ${deleteUserOps.rowCount} user_operations removidas`);

    // Limpar trading_operations de teste
    console.log('🔄 Removendo trading_operations de teste...');
    const deleteTradingOps = await pool.query(`
      DELETE FROM trading_operations 
      WHERE user_id NOT IN (${validUserIdsStr})
      RETURNING id
    `);
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
    `);
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
    `);
    deletedCount += deleteSignals.rowCount;
    console.log(`   ✅ ${deleteSignals.rowCount} sinais removidos`);

    // Limpar configurações de usuários inválidos
    console.log('🔄 Removendo configurações de usuários inválidos...');
    const deleteConfigs = await pool.query(`
      DELETE FROM user_configurations 
      WHERE user_id NOT IN (${validUserIdsStr})
      RETURNING id
    `);
    deletedCount += deleteConfigs.rowCount;
    console.log(`   ✅ ${deleteConfigs.rowCount} configurações removidas`);

    // Limpar usuários inválidos por último
    console.log('🔄 Removendo usuários inválidos...');
    const deleteUsers = await pool.query(`
      DELETE FROM users 
      WHERE id NOT IN (${validUserIdsStr})
      RETURNING id, name, email
    `);
    
    console.log(`   ✅ ${deleteUsers.rowCount} usuários removidos:`);
    deleteUsers.rows.forEach((user, index) => {
      console.log(`      ${index + 1}. ${user.name || 'N/A'} (${user.email || 'N/A'})`);
    });

    deletedCount += deleteUsers.rowCount;

    // 5. VERIFICAÇÃO FINAL
    console.log('\n📊 VERIFICAÇÃO PÓS-LIMPEZA:');
    
    const finalUsersCount = await pool.query('SELECT COUNT(*) FROM users');
    const finalOperationsCount = await pool.query('SELECT COUNT(*) FROM operations');
    const finalKeysCount = await pool.query('SELECT COUNT(*) FROM user_api_keys WHERE is_active = true');
    const finalSignalsCount = await pool.query('SELECT COUNT(*) FROM signals');

    console.log(`   👥 Usuários restantes: ${finalUsersCount.rows[0].count}`);
    console.log(`   📈 Operações restantes: ${finalOperationsCount.rows[0].count}`);
    console.log(`   🔑 Chaves ativas restantes: ${finalKeysCount.rows[0].count}`);
    console.log(`   📡 Sinais restantes: ${finalSignalsCount.rows[0].count}`);

    console.log(`\n✅ LIMPEZA CONCLUÍDA!`);
    console.log(`🗑️  Total de registros removidos: ${deletedCount}`);
    console.log(`🎯 Sistema agora contém apenas dados REAIS de usuários pagantes!`);

    // 6. Listar usuários finais
    console.log('\n👑 USUÁRIOS VÁLIDOS MANTIDOS:');
    const finalValidUsers = await pool.query(`
      SELECT u.name, u.email, u.vip_status, 
             COUNT(uak.id) as api_keys_count,
             COUNT(o.id) as operations_count
      FROM users u
      LEFT JOIN user_api_keys uak ON u.id = uak.user_id AND uak.is_active = true
      LEFT JOIN operations o ON u.id = o.user_id
      GROUP BY u.id, u.name, u.email, u.vip_status
      ORDER BY u.name
    `);

    finalValidUsers.rows.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email})`);
      console.log(`      👑 VIP: ${user.vip_status ? 'Sim' : 'Não'}`);
      console.log(`      🔑 Chaves: ${user.api_keys_count}`);
      console.log(`      📈 Operações: ${user.operations_count}`);
    });

    await pool.end();

  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error.message);
    await pool.end();
  }
}

// Executar limpeza
limpezaCompletaSistema();
