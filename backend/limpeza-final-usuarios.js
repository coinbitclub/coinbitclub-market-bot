const { Pool } = require('pg');

// Usar a conexão correta fornecida pelo usuário
const pool = new Pool({
  connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
  ssl: false
});

async function limpezaFinalUsuarios() {
  try {
    console.log('🔍 LIMPEZA FINAL - SISTEMA COINBITCLUB');
    console.log('📋 Removendo usuários SEM chaves API válidas');
    console.log('🔗 Conexão: maglev.proxy.rlwy.net:42095');
    console.log('⚠️  DESCOBERTA: Operations usam UUIDs, Users usam INTs - tabelas independentes');

    // 1. IDENTIFICAR USUÁRIOS VÁLIDOS
    console.log('\n👥 Identificando usuários com chaves API VÁLIDAS...');
    
    const validUsersQuery = await pool.query(`
      SELECT DISTINCT u.id, u.name, u.email, u.vip_status, u.created_at, u.role
      FROM users u
      INNER JOIN user_api_keys k ON u.id = k.user_id
      WHERE k.validation_status = 'valid' 
        AND k.is_active = true
        AND u.status = 'active'
      ORDER BY u.created_at DESC
    `);

    console.log(`✅ Encontrados ${validUsersQuery.rows.length} usuários VÁLIDOS com chaves ativas:`);
    validUsersQuery.rows.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name || 'N/A'} (${user.email})`);
      console.log(`      ID: ${user.id} | Função: ${user.role || 'N/A'} | VIP: ${user.vip_status ? 'Sim' : 'Não'}`);
      console.log(`      Cadastrado: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
    });

    if (validUsersQuery.rows.length === 0) {
      console.log('❌ NENHUM usuário válido encontrado! Operação cancelada.');
      return;
    }

    const validUserIds = validUsersQuery.rows.map(u => u.id);
    console.log(`\n🎯 IDs válidos: [${validUserIds.join(', ')}]`);

    // 2. IDENTIFICAR USUÁRIOS INVÁLIDOS
    console.log('\n❌ Identificando usuários INVÁLIDOS (sem chaves válidas)...');
    
    const invalidUsersQuery = await pool.query(`
      SELECT u.id, u.name, u.email, u.created_at, u.role
      FROM users u
      WHERE u.id NOT IN (
        SELECT DISTINCT user_id 
        FROM user_api_keys 
        WHERE validation_status = 'valid' AND is_active = true
      )
      ORDER BY u.created_at DESC
    `);

    console.log(`🗑️  Encontrados ${invalidUsersQuery.rows.length} usuários INVÁLIDOS:`);
    invalidUsersQuery.rows.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name || 'N/A'} (${user.email})`);
      console.log(`      ID: ${user.id} | Função: ${user.role || 'N/A'}`);
      console.log(`      Cadastrado: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
    });

    if (invalidUsersQuery.rows.length === 0) {
      console.log('✅ Nenhum usuário inválido encontrado. Sistema já está limpo!');
      return;
    }

    // 3. ANÁLISE DE DEPENDÊNCIAS (apenas tabelas relacionadas por INT)
    console.log('\n📊 Analisando dependências dos usuários inválidos...');
    
    let totalDependencies = 0;
    
    for (const user of invalidUsersQuery.rows) {
      console.log(`\n🔍 ${user.name || 'N/A'} (ID: ${user.id}):`);
      
      // Verificar chaves API
      const keysCount = await pool.query('SELECT COUNT(*) as count FROM user_api_keys WHERE user_id = $1', [user.id]);
      console.log(`   🔑 Chaves API: ${keysCount.rows[0].count}`);
      totalDependencies += parseInt(keysCount.rows[0].count);
      
      // Verificar saldos
      const balanceCount = await pool.query('SELECT COUNT(*) as count FROM user_balances WHERE user_id = $1', [user.id]);
      console.log(`   💰 Saldos: ${balanceCount.rows[0].count}`);
      totalDependencies += parseInt(balanceCount.rows[0].count);
      
      // Verificar configurações
      const configCount = await pool.query('SELECT COUNT(*) as count FROM user_configurations WHERE user_id = $1', [user.id]);
      console.log(`   ⚙️  Configurações: ${configCount.rows[0].count}`);
      totalDependencies += parseInt(configCount.rows[0].count);
      
      // Verificar logs (se existir)
      try {
        const logsCount = await pool.query('SELECT COUNT(*) as count FROM activity_logs WHERE user_id = $1', [user.id]);
        console.log(`   📝 Logs: ${logsCount.rows[0].count}`);
        totalDependencies += parseInt(logsCount.rows[0].count);
      } catch (e) {
        console.log(`   📝 Logs: (tabela não existe)`);
      }
      
      // Verificar notificações (se existir)
      try {
        const notifCount = await pool.query('SELECT COUNT(*) as count FROM notifications WHERE user_id = $1', [user.id]);
        console.log(`   🔔 Notificações: ${notifCount.rows[0].count}`);
        totalDependencies += parseInt(notifCount.rows[0].count);
      } catch (e) {
        console.log(`   🔔 Notificações: (tabela não existe)`);
      }
    }

    // 4. CONFIRMAÇÃO
    console.log('\n⚠️  ATENÇÃO: OPERAÇÃO IRREVERSÍVEL!');
    console.log('📋 RESUMO DA LIMPEZA:');
    console.log(`   ✅ MANTER: ${validUsersQuery.rows.length} usuários com chaves válidas`);
    console.log(`   🗑️  REMOVER: ${invalidUsersQuery.rows.length} usuários inválidos`);
    console.log(`   🔗 DEPENDÊNCIAS: ${totalDependencies} registros relacionados`);
    console.log('\n💡 NOTA: Operações na tabela "operations" usam UUIDs e são independentes');
    
    console.log('\n⏰ Iniciando limpeza em 5 segundos... (Ctrl+C para cancelar)');
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('\n🚀 INICIANDO LIMPEZA DOS USUÁRIOS INVÁLIDOS...\n');

    // 5. REMOÇÃO SEGURA USUÁRIO POR USUÁRIO
    let successCount = 0;
    let totalRemoved = 0;

    for (const user of invalidUsersQuery.rows) {
      console.log(`🔄 Removendo: ${user.name || 'N/A'} (ID: ${user.id})`);
      
      try {
        // Contar antes da remoção
        let userRemoved = 0;
        
        // Remover dependências primeiro
        const balances = await pool.query('DELETE FROM user_balances WHERE user_id = $1', [user.id]);
        userRemoved += balances.rowCount;
        console.log(`   ✅ ${balances.rowCount} saldos removidos`);
        
        const apiKeys = await pool.query('DELETE FROM user_api_keys WHERE user_id = $1', [user.id]);
        userRemoved += apiKeys.rowCount;
        console.log(`   ✅ ${apiKeys.rowCount} chaves API removidas`);
        
        const configs = await pool.query('DELETE FROM user_configurations WHERE user_id = $1', [user.id]);
        userRemoved += configs.rowCount;
        console.log(`   ✅ ${configs.rowCount} configurações removidas`);
        
        // Tentar remover logs e notificações (se existirem)
        try {
          const logs = await pool.query('DELETE FROM activity_logs WHERE user_id = $1', [user.id]);
          userRemoved += logs.rowCount;
          console.log(`   ✅ ${logs.rowCount} logs removidos`);
        } catch (e) {}
        
        try {
          const notifs = await pool.query('DELETE FROM notifications WHERE user_id = $1', [user.id]);
          userRemoved += notifs.rowCount;
          console.log(`   ✅ ${notifs.rowCount} notificações removidas`);
        } catch (e) {}
        
        // Remover usuário
        const userResult = await pool.query('DELETE FROM users WHERE id = $1', [user.id]);
        userRemoved += userResult.rowCount;
        console.log(`   ✅ Usuário removido`);
        
        totalRemoved += userRemoved;
        successCount++;
        
      } catch (error) {
        console.log(`   ❌ ERRO: ${error.message}`);
      }
      
      console.log(); // Linha em branco
    }

    // 6. VERIFICAÇÃO FINAL
    console.log('🔍 VERIFICAÇÃO FINAL...');
    
    const finalUsers = await pool.query('SELECT COUNT(*) as count FROM users');
    const finalValidUsers = await pool.query(`
      SELECT COUNT(DISTINCT u.id) as count
      FROM users u
      INNER JOIN user_api_keys k ON u.id = k.user_id
      WHERE k.validation_status = 'valid' AND k.is_active = true
    `);
    const finalApiKeys = await pool.query('SELECT COUNT(*) as count FROM user_api_keys');
    
    console.log(`\n📊 RESULTADO FINAL:`);
    console.log(`   👥 Total de usuários restantes: ${finalUsers.rows[0].count}`);
    console.log(`   ✅ Usuários com chaves válidas: ${finalValidUsers.rows[0].count}`);
    console.log(`   🔑 Total de chaves API restantes: ${finalApiKeys.rows[0].count}`);
    console.log(`   🗑️  Usuários removidos com sucesso: ${successCount}`);
    console.log(`   📊 Total de registros removidos: ${totalRemoved}`);

    console.log('\n✅ USUÁRIOS VÁLIDOS MANTIDOS NO SISTEMA:');
    validUsersQuery.rows.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name || 'N/A'} (${user.email})`);
    });

    console.log('\n🎉 LIMPEZA CONCLUÍDA COM SUCESSO!');
    console.log('📋 Sistema purificado - apenas usuários com chaves API válidas mantidos');
    console.log('💡 Tabela "operations" permanece intacta (usa UUIDs independentes)');

  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

// Executar limpeza
limpezaFinalUsuarios();
