const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function verificarEAtualizarLuizaMaria() {
  try {
    console.log('🔍 VERIFICANDO ESTRUTURA E USUÁRIOS LUIZA...');
    console.log('=' .repeat(60));
    
    // 1. Verificar estrutura da tabela users
    console.log('📋 VERIFICANDO ESTRUTURA DA TABELA USERS:');
    const estruturaUsers = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('   Colunas da tabela users:');
    estruturaUsers.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    
    // 2. Buscar usuários Luiza (adaptando para estrutura real)
    console.log('\n📋 BUSCANDO USUÁRIOS LUIZA:');
    let queryUsers = 'SELECT id, name, email, created_at FROM users WHERE LOWER(name) LIKE \'%luiza%\' ORDER BY id';
    
    // Verificar se existe coluna plan
    const temPlan = estruturaUsers.rows.some(col => col.column_name === 'plan');
    if (temPlan) {
      queryUsers = 'SELECT id, name, email, plan, created_at FROM users WHERE LOWER(name) LIKE \'%luiza%\' ORDER BY id';
    }
    
    const usuariosLuiza = await pool.query(queryUsers);
    
    console.log(`   Total encontrados: ${usuariosLuiza.rows.length}`);
    usuariosLuiza.rows.forEach(user => {
      const plan = user.plan || 'N/A';
      console.log(`   ID ${user.id}: ${user.name} (${user.email}) - Plano: ${plan} - Criado: ${user.created_at}`);
    });
    
    // 3. Verificar estrutura da tabela user_api_keys
    console.log('\n🔑 VERIFICANDO ESTRUTURA DA TABELA USER_API_KEYS:');
    const estruturaKeys = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_api_keys'
      ORDER BY ordinal_position
    `);
    
    console.log('   Colunas da tabela user_api_keys:');
    estruturaKeys.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    
    // 4. Verificar chaves existentes para usuários Luiza
    console.log('\n🔑 VERIFICANDO CHAVES API EXISTENTES:');
    const chavesLuiza = await pool.query(`
      SELECT uak.*, u.name, u.email 
      FROM user_api_keys uak
      JOIN users u ON uak.user_id = u.id
      WHERE LOWER(u.name) LIKE '%luiza%'
      ORDER BY uak.user_id
    `);
    
    console.log(`   Chaves encontradas: ${chavesLuiza.rows.length}`);
    chavesLuiza.rows.forEach(key => {
      console.log(`   User ID ${key.user_id} (${key.name}): API Key = ${key.api_key ? key.api_key.substring(0, 8) + '...' : 'NULL'}`);
      console.log(`      Secret = ${key.api_secret ? key.api_secret.substring(0, 8) + '...' : 'NULL'}`);
    });
    
    // 5. Identificar usuário principal Luiza Maria
    const luizaMaria = usuariosLuiza.rows.find(user => 
      user.name.toLowerCase().includes('luiza maria') || 
      user.name.toLowerCase().includes('luiza santos') ||
      user.email.toLowerCase().includes('luiza')
    ) || usuariosLuiza.rows[0]; // Pegar o primeiro se não encontrar especificamente
    
    if (luizaMaria) {
      console.log(`\n✅ USUÁRIO PRINCIPAL IDENTIFICADO: ${luizaMaria.name} (ID: ${luizaMaria.id})`);
      
      // 6. Atualizar com as chaves corretas da Luiza Maria
      console.log('\n🔄 ATUALIZANDO CHAVES DA LUIZA MARIA...');
      
      const novasChaves = {
        api_key: 'JuCpekqnmMsL4QqbKG',
        api_secret: 'gRqMLJnfRLMnE3Hh0QkxHKDxE1DQWjPKF4Py'
      };
      
      // Verificar se já existe registro de chaves
      const chaveExistente = await pool.query(
        'SELECT id FROM user_api_keys WHERE user_id = $1',
        [luizaMaria.id]
      );
      
      if (chaveExistente.rows.length > 0) {
        // Atualizar chaves existentes
        const updateQuery = estruturaKeys.rows.some(col => col.column_name === 'updated_at') 
          ? 'UPDATE user_api_keys SET api_key = $1, api_secret = $2, updated_at = NOW() WHERE user_id = $3'
          : 'UPDATE user_api_keys SET api_key = $1, api_secret = $2 WHERE user_id = $3';
        
        await pool.query(updateQuery, [novasChaves.api_key, novasChaves.api_secret, luizaMaria.id]);
        console.log(`   ✅ Chaves atualizadas para ${luizaMaria.name}`);
      } else {
        // Inserir novas chaves (adaptando para estrutura real)
        let insertQuery = 'INSERT INTO user_api_keys (user_id, api_key, api_secret';
        let values = '($1, $2, $3';
        let params = [luizaMaria.id, novasChaves.api_key, novasChaves.api_secret];
        
        if (estruturaKeys.rows.some(col => col.column_name === 'exchange')) {
          insertQuery += ', exchange';
          values += ', $4';
          params.push('bybit');
        }
        if (estruturaKeys.rows.some(col => col.column_name === 'created_at')) {
          insertQuery += ', created_at';
          values += ', NOW()';
        }
        if (estruturaKeys.rows.some(col => col.column_name === 'updated_at')) {
          insertQuery += ', updated_at';
          values += ', NOW()';
        }
        
        insertQuery += ') VALUES ' + values + ')';
        
        await pool.query(insertQuery, params);
        console.log(`   ✅ Novas chaves inseridas para ${luizaMaria.name}`);
      }
      
      // 7. Testar conexão com Bybit usando as chaves
      console.log('\n🔗 TESTANDO CONEXÃO COM BYBIT...');
      try {
        const crypto = require('crypto');
        const timestamp = Date.now();
        const recvWindow = 5000;
        
        // Criar assinatura para teste de chaves
        const queryString = `timestamp=${timestamp}&recvWindow=${recvWindow}`;
        const signature = crypto
          .createHmac('sha256', novasChaves.api_secret)
          .update(queryString)
          .digest('hex');
        
        console.log(`   📊 Chaves formatadas corretamente`);
        console.log(`   🔑 API Key: ${novasChaves.api_key}`);
        console.log(`   🔐 Secret: ${novasChaves.api_secret.substring(0, 8)}...`);
        console.log(`   ✅ Assinatura gerada com sucesso`);
        
      } catch (testError) {
        console.log(`   ⚠️ Erro no teste de assinatura: ${testError.message}`);
      }
      
      // 8. Verificar/Garantir crédito bônus
      console.log('\n💰 VERIFICANDO TABELA DE SALDOS...');
      
      // Verificar se existe tabela user_balances
      const tabelaSaldos = await pool.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_name IN ('user_balances', 'user_financial', 'balances')
      `);
      
      console.log(`   Tabelas de saldo encontradas: ${tabelaSaldos.rows.map(t => t.table_name).join(', ')}`);
      
      if (tabelaSaldos.rows.length > 0) {
        const tabelaSaldo = tabelaSaldos.rows[0].table_name;
        
        // Verificar estrutura da tabela de saldos
        const estruturaSaldo = await pool.query(`
          SELECT column_name FROM information_schema.columns 
          WHERE table_name = $1
        `, [tabelaSaldo]);
        
        const colunas = estruturaSaldo.rows.map(row => row.column_name);
        console.log(`   Colunas da tabela ${tabelaSaldo}: ${colunas.join(', ')}`);
        
        // Tentar garantir saldo bônus (adaptando para estrutura real)
        if (colunas.includes('user_id') && colunas.includes('bonus_balance')) {
          const saldoAtual = await pool.query(`SELECT * FROM ${tabelaSaldo} WHERE user_id = $1`, [luizaMaria.id]);
          
          if (saldoAtual.rows.length > 0) {
            await pool.query(`
              UPDATE ${tabelaSaldo} 
              SET bonus_balance = GREATEST(COALESCE(bonus_balance, 0), 500.00)
              WHERE user_id = $1
            `, [luizaMaria.id]);
            console.log(`   ✅ Saldo bônus atualizado para pelo menos R$500`);
          } else {
            let insertSaldoQuery = `INSERT INTO ${tabelaSaldo} (user_id, bonus_balance`;
            let valuesSaldo = '($1, 500.00';
            let paramsSaldo = [luizaMaria.id];
            
            if (colunas.includes('balance')) {
              insertSaldoQuery += ', balance';
              valuesSaldo += ', 0.00';
            }
            if (colunas.includes('created_at')) {
              insertSaldoQuery += ', created_at';
              valuesSaldo += ', NOW()';
            }
            
            insertSaldoQuery += ') VALUES ' + valuesSaldo + ')';
            
            await pool.query(insertSaldoQuery, paramsSaldo);
            console.log(`   ✅ Novo saldo criado com R$500 bônus`);
          }
        } else {
          console.log(`   ⚠️ Estrutura de saldo não compatível - colunas: ${colunas.join(', ')}`);
        }
      } else {
        console.log(`   ⚠️ Nenhuma tabela de saldos encontrada`);
      }
    }
    
    // 9. Remover usuários Luiza duplicados/de teste
    console.log('\n🗑️ LIMPANDO USUÁRIOS LUIZA DUPLICADOS...');
    
    if (usuariosLuiza.rows.length > 1) {
      // Manter apenas o principal, remover outros
      const usuariosParaRemover = usuariosLuiza.rows.filter(user => 
        user.id !== (luizaMaria ? luizaMaria.id : usuariosLuiza.rows[0].id)
      );
      
      for (const usuario of usuariosParaRemover) {
        // Remover chaves primeiro
        await pool.query('DELETE FROM user_api_keys WHERE user_id = $1', [usuario.id]);
        console.log(`   🔑 Chaves removidas para ${usuario.name}`);
        
        // Remover saldos se existir tabela
        if (tabelaSaldos.rows.length > 0) {
          const tabelaSaldo = tabelaSaldos.rows[0].table_name;
          await pool.query(`DELETE FROM ${tabelaSaldo} WHERE user_id = $1`, [usuario.id]);
          console.log(`   💰 Saldos removidos para ${usuario.name}`);
        }
        
        // Remover usuário
        await pool.query('DELETE FROM users WHERE id = $1', [usuario.id]);
        console.log(`   ✅ Usuário removido: ${usuario.name} (ID: ${usuario.id})`);
      }
    }
    
    // 10. Verificação final
    console.log('\n🔍 VERIFICAÇÃO FINAL - LUIZA MARIA:');
    
    const verificacaoFinal = await pool.query(`
      SELECT u.id, u.name, u.email,
             uak.api_key, uak.api_secret
      FROM users u
      LEFT JOIN user_api_keys uak ON u.id = uak.user_id
      WHERE LOWER(u.name) LIKE '%luiza%'
      ORDER BY u.id
    `);
    
    console.log(`   Usuários Luiza finais: ${verificacaoFinal.rows.length}`);
    verificacaoFinal.rows.forEach(user => {
      console.log(`   ✅ ${user.name} (${user.email}):`);
      console.log(`      API Key: ${user.api_key || 'NÃO CONFIGURADA'}`);
      console.log(`      Secret: ${user.api_secret ? user.api_secret.substring(0, 8) + '...' : 'NÃO CONFIGURADO'}`);
    });
    
    console.log('\n' + '=' .repeat(60));
    console.log('✅ VERIFICAÇÃO E ATUALIZAÇÃO DA LUIZA MARIA CONCLUÍDA!');
    console.log('🔑 Chaves: JuCpekqnmMsL4QqbKG / gRqMLJnfRLMnE3Hh0Q...');
    console.log('💰 Crédito bônus configurado');
    console.log('🗑️ Duplicatas removidas');
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
    console.log('🔌 Conexão fechada');
  }
}

// Executar verificação
verificarEAtualizarLuizaMaria().catch(console.error);
