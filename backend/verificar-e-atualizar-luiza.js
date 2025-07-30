const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function verificarEAtualizarLuiza() {
  try {
    console.log('🔍 VERIFICANDO USUÁRIOS LUIZA NO BANCO...');
    console.log('=' .repeat(60));
    
    // 1. Verificar todos os usuários com nome Luiza
    console.log('📋 BUSCANDO USUÁRIOS LUIZA:');
    const usuariosLuiza = await pool.query(`
      SELECT id, name, email, created_at, plan 
      FROM users 
      WHERE LOWER(name) LIKE '%luiza%'
      ORDER BY id
    `);
    
    console.log(`   Total encontrados: ${usuariosLuiza.rows.length}`);
    usuariosLuiza.rows.forEach(user => {
      console.log(`   ID ${user.id}: ${user.name} (${user.email}) - Plano: ${user.plan} - Criado: ${user.created_at}`);
    });
    
    // 2. Verificar chaves API existentes para usuários Luiza
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
      console.log(`   User ID ${key.user_id} (${key.name}): API Key = ${key.api_key.substring(0, 8)}... | Secret = ${key.api_secret.substring(0, 8)}...`);
    });
    
    // 3. Identificar o usuário correto "Luiza Maria"
    const luizaMaria = usuariosLuiza.rows.find(user => 
      user.name.toLowerCase().includes('luiza maria') || 
      user.email.toLowerCase().includes('luiza') ||
      user.name.toLowerCase() === 'luiza santos' ||
      user.name.toLowerCase() === 'luiza maria'
    );
    
    if (luizaMaria) {
      console.log(`\n✅ USUÁRIO PRINCIPAL IDENTIFICADO: ${luizaMaria.name} (ID: ${luizaMaria.id})`);
      
      // 4. Atualizar com as chaves corretas da Luiza Maria
      console.log('\n🔄 ATUALIZANDO CHAVES DA LUIZA MARIA...');
      
      const novasChaves = {
        api_key: 'JuCpekqnmMsL4QqbKG',
        api_secret: 'gRqMLJnfRLMnE3Hh0QkxHKDxE1DQWjPKF4Py'
      };
      
      // Verificar se já existe registro de chaves para este usuário
      const chaveExistente = await pool.query(
        'SELECT id FROM user_api_keys WHERE user_id = $1',
        [luizaMaria.id]
      );
      
      if (chaveExistente.rows.length > 0) {
        // Atualizar chaves existentes
        await pool.query(`
          UPDATE user_api_keys 
          SET api_key = $1, api_secret = $2, updated_at = NOW()
          WHERE user_id = $3
        `, [novasChaves.api_key, novasChaves.api_secret, luizaMaria.id]);
        
        console.log(`   ✅ Chaves atualizadas para ${luizaMaria.name}`);
      } else {
        // Inserir novas chaves
        await pool.query(`
          INSERT INTO user_api_keys (user_id, api_key, api_secret, exchange, created_at, updated_at)
          VALUES ($1, $2, $3, 'bybit', NOW(), NOW())
        `, [luizaMaria.id, novasChaves.api_key, novasChaves.api_secret]);
        
        console.log(`   ✅ Novas chaves inseridas para ${luizaMaria.name}`);
      }
      
      // 5. Garantir crédito bônus de R$500
      console.log('\n💰 VERIFICANDO/ADICIONANDO CRÉDITO BÔNUS...');
      
      const saldoAtual = await pool.query(`
        SELECT * FROM user_balances WHERE user_id = $1
      `, [luizaMaria.id]);
      
      if (saldoAtual.rows.length > 0) {
        // Atualizar saldo
        await pool.query(`
          UPDATE user_balances 
          SET bonus_balance = GREATEST(bonus_balance, 500.00),
              updated_at = NOW()
          WHERE user_id = $1
        `, [luizaMaria.id]);
        
        console.log(`   ✅ Saldo bônus atualizado para R$500 (${luizaMaria.name})`);
      } else {
        // Criar novo registro de saldo
        await pool.query(`
          INSERT INTO user_balances (user_id, balance, bonus_balance, created_at, updated_at)
          VALUES ($1, 0.00, 500.00, NOW(), NOW())
        `, [luizaMaria.id]);
        
        console.log(`   ✅ Novo saldo criado com R$500 bônus (${luizaMaria.name})`);
      }
    } else {
      console.log('\n⚠️ Usuário "Luiza Maria" não encontrado claramente identificado');
      console.log('   Criando novo usuário...');
      
      // Criar usuário Luiza Maria
      const novoUsuario = await pool.query(`
        INSERT INTO users (name, email, plan, status, created_at, updated_at)
        VALUES ('Luiza Maria', 'luiza.maria@coinbitclub.com', 'VIP', 'ACTIVE', NOW(), NOW())
        RETURNING id, name
      `);
      
      const userId = novoUsuario.rows[0].id;
      console.log(`   ✅ Usuário criado: ${novoUsuario.rows[0].name} (ID: ${userId})`);
      
      // Inserir chaves
      await pool.query(`
        INSERT INTO user_api_keys (user_id, api_key, api_secret, exchange, created_at, updated_at)
        VALUES ($1, $2, $3, 'bybit', NOW(), NOW())
      `, [userId, 'JuCpekqnmMsL4QqbKG', 'gRqMLJnfRLMnE3Hh0QkxHKDxE1DQWjPKF4Py']);
      
      // Inserir saldo bônus
      await pool.query(`
        INSERT INTO user_balances (user_id, balance, bonus_balance, created_at, updated_at)
        VALUES ($1, 0.00, 500.00, NOW(), NOW())
      `, [userId]);
      
      console.log(`   ✅ Chaves e saldo bônus R$500 configurados`);
    }
    
    // 6. Remover usuários Luiza de teste (se houver múltiplos)
    console.log('\n🗑️ REMOVENDO USUÁRIOS LUIZA DE TESTE...');
    
    const usuariosParaRemover = usuariosLuiza.rows.filter(user => 
      user.name.toLowerCase().includes('teste') ||
      user.name.toLowerCase().includes('demo') ||
      (user.name.toLowerCase().includes('luiza santos') && !user.name.toLowerCase().includes('maria'))
    );
    
    for (const usuario of usuariosParaRemover) {
      // Remover chaves primeiro
      await pool.query('DELETE FROM user_api_keys WHERE user_id = $1', [usuario.id]);
      // Remover saldos
      await pool.query('DELETE FROM user_balances WHERE user_id = $1', [usuario.id]);
      // Remover usuário
      await pool.query('DELETE FROM users WHERE id = $1', [usuario.id]);
      
      console.log(`   ✅ Removido usuário de teste: ${usuario.name} (ID: ${usuario.id})`);
    }
    
    // 7. Verificação final
    console.log('\n🔍 VERIFICAÇÃO FINAL:');
    
    const verificacaoFinal = await pool.query(`
      SELECT u.id, u.name, u.email, u.plan,
             uak.api_key, uak.api_secret,
             ub.bonus_balance
      FROM users u
      LEFT JOIN user_api_keys uak ON u.id = uak.user_id
      LEFT JOIN user_balances ub ON u.id = ub.user_id
      WHERE LOWER(u.name) LIKE '%luiza%'
      ORDER BY u.id
    `);
    
    console.log(`   Usuários Luiza finais: ${verificacaoFinal.rows.length}`);
    verificacaoFinal.rows.forEach(user => {
      console.log(`   ✅ ${user.name} (${user.email}):`);
      console.log(`      API Key: ${user.api_key ? user.api_key.substring(0, 8) + '...' : 'NÃO CONFIGURADA'}`);
      console.log(`      Secret: ${user.api_secret ? user.api_secret.substring(0, 8) + '...' : 'NÃO CONFIGURADO'}`);
      console.log(`      Bônus: R$${user.bonus_balance || '0.00'}`);
    });
    
    console.log('\n' + '=' .repeat(60));
    console.log('✅ VERIFICAÇÃO E ATUALIZAÇÃO DA LUIZA MARIA CONCLUÍDA!');
    console.log('🔑 Chaves corretas configuradas');
    console.log('💰 Crédito bônus R$500 garantido');
    console.log('🗑️ Dados de teste removidos');
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
    console.log('🔌 Conexão fechada');
  }
}

// Executar verificação
verificarEAtualizarLuiza().catch(console.error);
