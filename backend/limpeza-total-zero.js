const { Pool } = require('pg');

// Configuração de conexão com a string fornecida
const pool = new Pool({
  connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
  ssl: false,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 5
});

async function limpezaCompleta() {
  try {
    console.log('🔥 LIMPEZA TOTAL DO SISTEMA');
    console.log('📋 MANTENDO APENAS: Luiza Maria de Almeida Pinto (ID: 4)');
    console.log('🗑️  REMOVENDO: TUDO O MAIS - TODOS os usuários, operações, sinais, etc.');
    
    // 1. Verificar usuário que será MANTIDO
    const usuarioMantido = await pool.query(`
      SELECT id, name, email, vip_status, created_at
      FROM users 
      WHERE id = 4
    `);
    
    if (usuarioMantido.rows.length === 0) {
      console.log('❌ ERRO: Usuário Luiza Maria (ID: 4) não encontrado!');
      return;
    }
    
    console.log('\n✅ USUÁRIO QUE SERÁ MANTIDO:');
    const luiza = usuarioMantido.rows[0];
    console.log(`   👤 ${luiza.name} (${luiza.email})`);
    console.log(`   🆔 ID: ${luiza.id} | VIP: ${luiza.vip_status ? 'Sim' : 'Não'}`);
    console.log(`   📅 Cadastrado: ${new Date(luiza.created_at).toLocaleString('pt-BR')}`);
    
    // 2. Contar TUDO que será removido
    console.log('\n📊 CONTANDO DADOS QUE SERÃO REMOVIDOS...');
    
    const totalUsuarios = await pool.query('SELECT COUNT(*) as count FROM users WHERE id != 4');
    const totalOperacoes = await pool.query('SELECT COUNT(*) as count FROM operations');
    const totalSinais = await pool.query('SELECT COUNT(*) as count FROM signals');
    const totalChaves = await pool.query('SELECT COUNT(*) as count FROM user_api_keys WHERE user_id != 4');
    const totalSaldos = await pool.query('SELECT COUNT(*) as count FROM user_balances WHERE user_id != 4');
    
    console.log(`   👥 Usuários a remover: ${totalUsuarios.rows[0].count}`);
    console.log(`   📈 Operações a remover: ${totalOperacoes.rows[0].count}`);
    console.log(`   📡 Sinais a remover: ${totalSinais.rows[0].count}`);
    console.log(`   🔑 Chaves API a remover: ${totalChaves.rows[0].count}`);
    console.log(`   💰 Saldos a remover: ${totalSaldos.rows[0].count}`);
    
    console.log('\n⚠️  ⚠️  ⚠️  ATENÇÃO CRÍTICA ⚠️  ⚠️  ⚠️');
    console.log('🔥 Esta operação IRÁ APAGAR COMPLETAMENTE:');
    console.log('   - TODOS os outros usuários');
    console.log('   - TODAS as operações (histórico completo)');
    console.log('   - TODOS os sinais recebidos');
    console.log('   - TODAS as chaves API (exceto da Luiza)');
    console.log('   - TODOS os saldos e configurações');
    console.log('   - TODO o histórico do sistema');
    console.log('🔥 SISTEMA VOLTARÁ AO ESTADO ZERO!');
    
    console.log('\n⏰ Iniciando LIMPEZA TOTAL em 5 segundos... (Ctrl+C para cancelar)');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n🚀 INICIANDO LIMPEZA COMPLETA DO SISTEMA...\n');
    
    // 3. REMOVER TUDO - Ordem específica para evitar violações de FK
    let totalRemovidos = 0;
    
    // Desabilitar verificações de FK temporariamente para acelerar
    console.log('🔧 Desabilitando verificações de chave estrangeira...');
    await pool.query('SET session_replication_role = replica;');
    
    // STEP 1: APAGAR TODOS OS SINAIS
    console.log('🔄 REMOVENDO TODOS OS SINAIS...');
    const deleteSinais = await pool.query('DELETE FROM signals RETURNING id');
    console.log(`   ✅ ${deleteSinais.rowCount} sinais APAGADOS`);
    totalRemovidos += deleteSinais.rowCount;
    
    // STEP 2: APAGAR TODAS AS OPERAÇÕES
    console.log('🔄 REMOVENDO TODAS AS OPERAÇÕES...');
    const deleteOperacoes = await pool.query('DELETE FROM operations RETURNING id');
    console.log(`   ✅ ${deleteOperacoes.rowCount} operações APAGADAS`);
    totalRemovidos += deleteOperacoes.rowCount;
    
    // STEP 3: APAGAR DEPENDÊNCIAS DOS OUTROS USUÁRIOS
    const tabelasDependentes = [
      'ai_analysis',
      'prepaid_balances',
      'operation_limits',
      'user_risk_profiles', 
      'user_trading_params',
      'user_api_keys',
      'user_balances',
      'user_configurations',
      'user_operations',
      'trading_operations',
      'user_sessions',
      'user_logs',
      'user_alerts',
      'user_preferences'
    ];
    
    console.log('🔄 REMOVENDO DEPENDÊNCIAS DE OUTROS USUÁRIOS...');
    for (const tabela of tabelasDependentes) {
      try {
        const result = await pool.query(`
          DELETE FROM ${tabela} 
          WHERE user_id != 4
          RETURNING id
        `);
        
        if (result.rowCount > 0) {
          console.log(`   ✅ ${tabela}: ${result.rowCount} registros APAGADOS`);
          totalRemovidos += result.rowCount;
        }
      } catch (error) {
        if (!error.message.includes('does not exist')) {
          console.log(`   ⚠️  ${tabela}: ${error.message}`);
        }
      }
    }
    
    // STEP 4: APAGAR TODOS OS OUTROS USUÁRIOS
    console.log('🔄 REMOVENDO TODOS OS OUTROS USUÁRIOS...');
    const deleteUsers = await pool.query(`
      DELETE FROM users 
      WHERE id != 4
      RETURNING id, name, email
    `);
    
    console.log(`   ✅ ${deleteUsers.rowCount} usuários APAGADOS:`);
    deleteUsers.rows.forEach(user => {
      console.log(`     🗑️  ${user.name || 'N/A'} (${user.email})`);
    });
    totalRemovidos += deleteUsers.rowCount;
    
    // STEP 5: LIMPAR TABELAS GERAIS (que não dependem de usuários)
    const tabelasGerais = [
      'system_logs',
      'system_alerts',
      'notifications',
      'activities',
      'audit_logs'
    ];
    
    console.log('🔄 LIMPANDO TABELAS GERAIS DO SISTEMA...');
    for (const tabela of tabelasGerais) {
      try {
        const result = await pool.query(`DELETE FROM ${tabela} RETURNING id`);
        if (result.rowCount > 0) {
          console.log(`   ✅ ${tabela}: ${result.rowCount} registros LIMPOS`);
          totalRemovidos += result.rowCount;
        }
      } catch (error) {
        if (!error.message.includes('does not exist')) {
          console.log(`   ⚠️  ${tabela}: ${error.message}`);
        }
      }
    }
    
    // Reabilitar verificações de FK
    console.log('🔧 Reabilitando verificações de chave estrangeira...');
    await pool.query('SET session_replication_role = DEFAULT;');
    
    // 4. VERIFICAR RESULTADO FINAL
    console.log('\n🎯 LIMPEZA COMPLETA FINALIZADA!');
    console.log(`   🗑️  Total de registros APAGADOS: ${totalRemovidos}`);
    
    const finalUsers = await pool.query('SELECT COUNT(*) as count FROM users');
    const finalOperations = await pool.query('SELECT COUNT(*) as count FROM operations');
    const finalSignals = await pool.query('SELECT COUNT(*) as count FROM signals');
    const finalKeys = await pool.query('SELECT COUNT(*) as count FROM user_api_keys');
    const finalBalances = await pool.query('SELECT COUNT(*) as count FROM user_balances');
    
    console.log('\n📊 ESTADO FINAL DO SISTEMA:');
    console.log(`   👥 Usuários restantes: ${finalUsers.rows[0].count}`);
    console.log(`   📈 Operações restantes: ${finalOperations.rows[0].count}`);
    console.log(`   📡 Sinais restantes: ${finalSignals.rows[0].count}`);
    console.log(`   🔑 Chaves API restantes: ${finalKeys.rows[0].count}`);
    console.log(`   💰 Saldos restantes: ${finalBalances.rows[0].count}`);
    
    // Verificar usuário restante
    const usuarioFinal = await pool.query(`
      SELECT id, name, email, vip_status, created_at
      FROM users 
      ORDER BY id
    `);
    
    if (usuarioFinal.rows.length === 1) {
      const user = usuarioFinal.rows[0];
      console.log('\n✅ ÚNICO USUÁRIO RESTANTE:');
      console.log(`   👤 ${user.name} (${user.email})`);
      console.log(`   🆔 ID: ${user.id} | VIP: ${user.vip_status ? 'Sim' : 'Não'}`);
      console.log(`   📅 Cadastrado: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
    } else if (usuarioFinal.rows.length === 0) {
      console.log('\n❌ ERRO: Nenhum usuário restante! (Algo deu errado)');
    } else {
      console.log('\n⚠️  ATENÇÃO: Mais de um usuário restante:');
      usuarioFinal.rows.forEach(user => {
        console.log(`   - ${user.name} (${user.email}) - ID: ${user.id}`);
      });
    }
    
    console.log('\n🎉 SISTEMA RESETADO PARA ESTADO ZERO!');
    console.log('📋 Agora você pode começar com dados 100% reais');
    console.log('🚀 Dashboard mostrará apenas dados legítimos da Luiza Maria');
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error.message);
    console.error('Stack:', error.stack);
    
    // Garantir que as verificações de FK sejam reabilitadas
    try {
      await pool.query('SET session_replication_role = DEFAULT;');
    } catch (fkError) {
      console.error('❌ Erro ao reabilitar FK:', fkError.message);
    }
  } finally {
    await pool.end();
  }
}

limpezaCompleta();
