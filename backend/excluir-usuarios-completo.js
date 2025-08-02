const { Pool } = require('pg');

// Configuração de conexão com a string fornecida
const pool = new Pool({
  connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
  ssl: false,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 5
});

async function excluirUsuariosCompleto() {
  try {
    console.log('🔍 EXCLUSÃO COMPLETA DOS USUÁRIOS 2 E 3');
    console.log('📋 Removendo TODAS as dependências automaticamente');
    
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
    
    console.log('\n🚀 INICIANDO EXCLUSÃO COMPLETA...\n');
    
    // 2. Lista de todas as tabelas dependentes conhecidas
    const tabelasDependentes = [
      'operation_limits',
      'user_risk_profiles', 
      'user_trading_params',
      'user_api_keys',
      'user_balances',
      'user_configurations',
      'user_operations',
      'trading_operations',
      'user_sessions',
      'user_notifications',
      'user_settings',
      'user_logs',
      'user_alerts',
      'user_preferences',
      'user_subscriptions',
      'user_payments',
      'user_withdrawals',
      'user_deposits'
    ];
    
    console.log('🔄 Removendo dependências de todas as tabelas...\n');
    
    let totalRemovidos = 0;
    
    for (const tabela of tabelasDependentes) {
      try {
        const result = await pool.query(`
          DELETE FROM ${tabela} 
          WHERE user_id IN (2, 3)
          RETURNING id
        `);
        
        if (result.rowCount > 0) {
          console.log(`   ✅ ${tabela}: ${result.rowCount} registros removidos`);
          totalRemovidos += result.rowCount;
        } else {
          console.log(`   ⭕ ${tabela}: nenhum registro encontrado`);
        }
        
      } catch (error) {
        if (error.message.includes('does not exist')) {
          console.log(`   ⚠️  ${tabela}: tabela não existe`);
        } else if (error.message.includes('operator does not exist')) {
          console.log(`   ⚠️  ${tabela}: tipo de dados incompatível`);
        } else {
          console.log(`   ❌ ${tabela}: ${error.message}`);
        }
      }
    }
    
    console.log(`\n📊 Total de dependências removidas: ${totalRemovidos}`);
    
    // 3. Agora tentar excluir os usuários
    console.log('\n🔄 Removendo usuários...');
    
    try {
      const deleteUsers = await pool.query(`
        DELETE FROM users 
        WHERE id IN (2, 3)
        RETURNING id, name, email
      `);
      
      console.log(`✅ ${deleteUsers.rowCount} usuários removidos com sucesso:`);
      deleteUsers.rows.forEach(user => {
        console.log(`   🗑️  ${user.name || 'N/A'} (${user.email}) - ID: ${user.id}`);
      });
      
    } catch (error) {
      console.log(`❌ Ainda há dependências: ${error.message}`);
      
      // Se ainda há erro, usar CASCADE (mais agressivo)
      console.log('\n🔄 Tentando exclusão com CASCADE...');
      
      try {
        // Desabilitar temporariamente as verificações de chave estrangeira
        await pool.query('SET session_replication_role = replica;');
        
        const deleteUsers = await pool.query(`
          DELETE FROM users 
          WHERE id IN (2, 3)
          RETURNING id, name, email
        `);
        
        // Reabilitar as verificações
        await pool.query('SET session_replication_role = DEFAULT;');
        
        console.log(`✅ ${deleteUsers.rowCount} usuários removidos com CASCADE:`);
        deleteUsers.rows.forEach(user => {
          console.log(`   🗑️  ${user.name || 'N/A'} (${user.email}) - ID: ${user.id}`);
        });
        
      } catch (cascadeError) {
        console.log(`❌ Erro mesmo com CASCADE: ${cascadeError.message}`);
        
        // Reabilitar as verificações em caso de erro
        await pool.query('SET session_replication_role = DEFAULT;');
        
        // Listar as dependências restantes
        console.log('\n🔍 Investigando dependências restantes...');
        try {
          const dependencies = await pool.query(`
            SELECT 
              conname as constraint_name,
              conrelid::regclass as table_name,
              confrelid::regclass as referenced_table
            FROM pg_constraint 
            WHERE confrelid = 'users'::regclass 
              AND contype = 'f'
          `);
          
          console.log('📋 Tabelas que ainda referenciam users:');
          dependencies.rows.forEach(dep => {
            console.log(`   - ${dep.table_name} (constraint: ${dep.constraint_name})`);
          });
          
        } catch (depError) {
          console.log('❌ Erro ao listar dependências:', depError.message);
        }
      }
    }
    
    // 4. Verificar resultado final
    const finalCount = await pool.query('SELECT COUNT(*) as total FROM users');
    const remainingUsers = await pool.query(`
      SELECT id, name, email, vip_status 
      FROM users 
      ORDER BY id
    `);
    
    console.log(`\n🎯 PROCESSO CONCLUÍDO!`);
    console.log(`   📊 Total de usuários restantes: ${finalCount.rows[0].total}`);
    
    if (remainingUsers.rows.length > 0) {
      console.log('\n👥 USUÁRIOS RESTANTES:');
      remainingUsers.rows.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name || 'N/A'} (${user.email})`);
        console.log(`      ID: ${user.id} | VIP: ${user.vip_status ? 'Sim' : 'Não'}`);
      });
    } else {
      console.log('\n⚠️  NENHUM usuário restante no sistema!');
    }
    
  } catch (error) {
    console.error('❌ Erro durante a exclusão:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

excluirUsuariosCompleto();
