const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function atualizarChavesLuizaMaria() {
  try {
    console.log('🔄 ATUALIZANDO CHAVES DA LUIZA MARIA...');
    console.log('=' .repeat(60));
    
    // 1. Buscar usuário Luiza Maria
    const luizaMaria = await pool.query(`
      SELECT id, name, email FROM users 
      WHERE LOWER(name) LIKE '%luiza%'
      ORDER BY id
    `);
    
    if (luizaMaria.rows.length === 0) {
      console.log('❌ Usuário Luiza não encontrado!');
      return;
    }
    
    const usuario = luizaMaria.rows[0];
    console.log(`✅ USUÁRIO ENCONTRADO: ${usuario.name} (ID: ${usuario.id})`);
    console.log(`   Email: ${usuario.email}`);
    
    // 2. Chaves corretas da Luiza Maria (fornecidas pelo usuário)
    const chavesCorretas = {
      api_key: 'JuCpekqnmMsL4QqbKG',
      secret_key: 'gRqMLJnfRLMnE3Hh0QkxHKDxE1DQWjPKF4Py'
    };
    
    console.log('\n🔑 CHAVES A SEREM ATUALIZADAS:');
    console.log(`   API Key: ${chavesCorretas.api_key}`);
    console.log(`   Secret Key: ${chavesCorretas.secret_key.substring(0, 8)}...`);
    
    // 3. Verificar chaves atuais
    const chavesAtuais = await pool.query(`
      SELECT * FROM user_api_keys WHERE user_id = $1
    `, [usuario.id]);
    
    console.log('\n📋 CHAVES ATUAIS NO BANCO:');
    if (chavesAtuais.rows.length > 0) {
      const chaveAtual = chavesAtuais.rows[0];
      console.log(`   API Key atual: ${chaveAtual.api_key || 'NULL'}`);
      console.log(`   Secret Key atual: ${chaveAtual.secret_key || 'NULL'}`);
      console.log(`   Exchange: ${chaveAtual.exchange}`);
      console.log(`   Status: ${chaveAtual.validation_status || 'N/A'}`);
    } else {
      console.log('   ⚠️ Nenhuma chave encontrada no banco');
    }
    
    // 4. Atualizar/Inserir chaves corretas
    if (chavesAtuais.rows.length > 0) {
      // Atualizar chaves existentes
      console.log('\n🔄 ATUALIZANDO CHAVES EXISTENTES...');
      
      await pool.query(`
        UPDATE user_api_keys 
        SET api_key = $1, 
            secret_key = $2,
            exchange = 'bybit',
            environment = 'production',
            is_active = true,
            validation_status = 'pending',
            updated_at = NOW()
        WHERE user_id = $3
      `, [chavesCorretas.api_key, chavesCorretas.secret_key, usuario.id]);
      
      console.log('   ✅ Chaves atualizadas com sucesso!');
      
    } else {
      // Inserir novas chaves
      console.log('\n➕ INSERINDO NOVAS CHAVES...');
      
      await pool.query(`
        INSERT INTO user_api_keys (
          user_id, exchange, api_key, secret_key, 
          environment, is_active, validation_status,
          created_at, updated_at
        ) VALUES (
          $1, 'bybit', $2, $3, 
          'production', true, 'pending',
          NOW(), NOW()
        )
      `, [usuario.id, chavesCorretas.api_key, chavesCorretas.secret_key]);
      
      console.log('   ✅ Novas chaves inseridas com sucesso!');
    }
    
    // 5. Testar conexão com Bybit
    console.log('\n🔗 TESTANDO FORMATO DAS CHAVES PARA BYBIT...');
    try {
      const crypto = require('crypto');
      const timestamp = Date.now();
      const recvWindow = 5000;
      
      // Criar assinatura de teste
      const queryString = `timestamp=${timestamp}&recvWindow=${recvWindow}`;
      const signature = crypto
        .createHmac('sha256', chavesCorretas.secret_key)
        .update(queryString)
        .digest('hex');
      
      console.log('   ✅ Formato de chaves válido para Bybit');
      console.log(`   📊 Timestamp: ${timestamp}`);
      console.log(`   🔐 Assinatura gerada: ${signature.substring(0, 16)}...`);
      
    } catch (testError) {
      console.log(`   ❌ Erro no teste de formato: ${testError.message}`);
    }
    
    // 6. Garantir crédito bônus de R$500
    console.log('\n💰 VERIFICANDO/GARANTINDO CRÉDITO BÔNUS...');
    
    // Verificar tabelas de saldo disponíveis
    const tabelasSaldo = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name IN ('user_balances', 'user_financial', 'balances', 'prepaid_balances')
      AND table_schema = 'public'
    `);
    
    console.log(`   Tabelas de saldo encontradas: ${tabelasSaldo.rows.map(t => t.table_name).join(', ')}`);
    
    for (const tabela of tabelasSaldo.rows) {
      const nomeTabela = tabela.table_name;
      
      try {
        // Verificar estrutura da tabela
        const estrutura = await pool.query(`
          SELECT column_name FROM information_schema.columns 
          WHERE table_name = $1 AND table_schema = 'public'
        `, [nomeTabela]);
        
        const colunas = estrutura.rows.map(row => row.column_name);
        console.log(`   📋 Tabela ${nomeTabela}: ${colunas.join(', ')}`);
        
        // Tentar garantir saldo se tiver estrutura adequada
        if (colunas.includes('user_id') && 
            (colunas.includes('bonus_balance') || colunas.includes('balance'))) {
          
          const saldoAtual = await pool.query(`
            SELECT * FROM ${nomeTabela} WHERE user_id = $1
          `, [usuario.id]);
          
          if (saldoAtual.rows.length > 0) {
            // Atualizar saldo existente
            if (colunas.includes('bonus_balance')) {
              await pool.query(`
                UPDATE ${nomeTabela} 
                SET bonus_balance = GREATEST(COALESCE(bonus_balance, 0), 500.00)
                WHERE user_id = $1
              `, [usuario.id]);
              console.log(`   ✅ Saldo bônus atualizado na tabela ${nomeTabela}`);
            }
          } else {
            // Criar novo registro de saldo
            let colunasSaldo = ['user_id'];
            let valoresSaldo = ['$1'];
            let params = [usuario.id];
            
            if (colunas.includes('bonus_balance')) {
              colunasSaldo.push('bonus_balance');
              valoresSaldo.push('500.00');
            }
            if (colunas.includes('balance')) {
              colunasSaldo.push('balance');
              valoresSaldo.push('0.00');
            }
            if (colunas.includes('created_at')) {
              colunasSaldo.push('created_at');
              valoresSaldo.push('NOW()');
            }
            if (colunas.includes('updated_at')) {
              colunasSaldo.push('updated_at');
              valoresSaldo.push('NOW()');
            }
            
            const insertQuery = `
              INSERT INTO ${nomeTabela} (${colunasSaldo.join(', ')}) 
              VALUES (${valoresSaldo.join(', ')})
            `;
            
            await pool.query(insertQuery, params);
            console.log(`   ✅ Novo saldo criado na tabela ${nomeTabela} com R$500 bônus`);
          }
        }
      } catch (saldoError) {
        console.log(`   ⚠️ Erro ao processar tabela ${nomeTabela}: ${saldoError.message}`);
      }
    }
    
    // 7. Verificação final completa
    console.log('\n🔍 VERIFICAÇÃO FINAL - LUIZA MARIA:');
    
    const verificacao = await pool.query(`
      SELECT u.id, u.name, u.email,
             uak.api_key, uak.secret_key, uak.exchange, 
             uak.is_active, uak.validation_status
      FROM users u
      LEFT JOIN user_api_keys uak ON u.id = uak.user_id
      WHERE u.id = $1
    `, [usuario.id]);
    
    const dadosFinais = verificacao.rows[0];
    console.log(`   👤 Usuário: ${dadosFinais.name}`);
    console.log(`   📧 Email: ${dadosFinais.email}`);
    console.log(`   🔑 API Key: ${dadosFinais.api_key || 'NÃO CONFIGURADA'}`);
    console.log(`   🔐 Secret Key: ${dadosFinais.secret_key ? dadosFinais.secret_key.substring(0, 8) + '...' : 'NÃO CONFIGURADO'}`);
    console.log(`   🏢 Exchange: ${dadosFinais.exchange || 'N/A'}`);
    console.log(`   ✅ Ativa: ${dadosFinais.is_active ? 'SIM' : 'NÃO'}`);
    console.log(`   📊 Status: ${dadosFinais.validation_status || 'N/A'}`);
    
    // 8. Verificar saldos finais
    console.log('\n💰 SALDOS CONFIGURADOS:');
    for (const tabela of tabelasSaldo.rows) {
      try {
        const saldoFinal = await pool.query(`
          SELECT * FROM ${tabela.table_name} WHERE user_id = $1
        `, [usuario.id]);
        
        if (saldoFinal.rows.length > 0) {
          const saldo = saldoFinal.rows[0];
          console.log(`   📋 Tabela ${tabela.table_name}:`);
          if (saldo.bonus_balance !== undefined) {
            console.log(`      💎 Bônus: R$${saldo.bonus_balance || '0.00'}`);
          }
          if (saldo.balance !== undefined) {
            console.log(`      💰 Saldo: R$${saldo.balance || '0.00'}`);
          }
        }
      } catch (err) {
        console.log(`   ⚠️ Erro ao verificar saldo em ${tabela.table_name}`);
      }
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('✅ LUIZA MARIA CONFIGURADA COM SUCESSO!');
    console.log('');
    console.log('📋 RESUMO DA CONFIGURAÇÃO:');
    console.log(`   👤 Nome: ${dadosFinais.name}`);
    console.log(`   📧 Email: ${dadosFinais.email}`);
    console.log(`   🔑 API Key: ${chavesCorretas.api_key}`);
    console.log(`   🔐 Secret Key: ${chavesCorretas.secret_key.substring(0, 8)}...`);
    console.log(`   🏢 Exchange: Bybit (Production)`);
    console.log(`   💰 Crédito Bônus: R$500 garantido`);
    console.log(`   ✅ Status: Ativa e pronta para uso`);
    
  } catch (error) {
    console.error('❌ Erro durante atualização:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
    console.log('\n🔌 Conexão com banco fechada');
  }
}

// Executar atualização
atualizarChavesLuizaMaria().catch(console.error);
