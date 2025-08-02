const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Configuração de conexão
const pool = new Pool({
  connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
  ssl: false,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 5
});

async function criarUsuarios() {
  try {
    console.log('👥 CRIANDO NOVOS USUÁRIOS NO SISTEMA');
    console.log('📋 Cadastrando 3 usuários conforme especificado\n');

    // 1. PALOMA AMARAL
    console.log('🔄 Cadastrando PALOMA AMARAL...');
    
    const hashPaloma = await bcrypt.hash('Diogo1520', 10);
    
    const paloma = await pool.query(`
      INSERT INTO users (
        name, email, password_hash, phone, country, 
        vip_status, role, status, created_at, updated_at
      ) VALUES (
        'Paloma Amaral', 'pamaral15@hotmail.com', $1, '55 21 982218182', 'BR',
        false, 'user', 'active', NOW(), NOW()
      ) RETURNING id, name, email
    `, [hashPaloma]);
    
    const palomaId = paloma.rows[0].id;
    console.log(`   ✅ Usuário criado: ${paloma.rows[0].name} (ID: ${palomaId})`);
    
    // Adicionar bônus de R$500 para Paloma
    await pool.query(`
      INSERT INTO user_balances (
        user_id, account_type, total_balance, available_balance, 
        reserved_balance, bonus_balance, currency, created_at, updated_at
      ) VALUES (
        $1, 'demo', 500.00, 0.00, 0.00, 500.00, 'BRL', NOW(), NOW()
      )
    `, [palomaId]);
    console.log(`   💰 Bônus de R$500 adicionado`);
    
    // Chaves API da imagem (não fornecidas no texto, deixando placeholder)
    await pool.query(`
      INSERT INTO user_api_keys (
        user_id, exchange, api_key, api_secret, 
        is_active, validation_status, created_at, updated_at
      ) VALUES (
        $1, 'bybit', 'PLACEHOLDER_API_KEY', 'PLACEHOLDER_SECRET', 
        false, 'pending', NOW(), NOW()
      )
    `, [palomaId]);
    console.log(`   🔑 Chaves API criadas (aguardando imagem)`);

    // 2. ERICA DOS SANTOS ANDRADE
    console.log('\n🔄 Cadastrando ERICA DOS SANTOS ANDRADE...');
    
    const hashErica = await bcrypt.hash('Apelido22@', 10);
    
    const erica = await pool.query(`
      INSERT INTO users (
        name, email, password_hash, phone, country, 
        vip_status, role, status, created_at, updated_at
      ) VALUES (
        'Erica dos Santos Andrade', 'erica.andrade.santos@hotmail.com', $1, '55 21 987386645', 'BR',
        true, 'vip', 'active', NOW(), NOW()
      ) RETURNING id, name, email
    `, [hashErica]);
    
    const ericaId = erica.rows[0].id;
    console.log(`   ✅ Usuário VIP criado: ${erica.rows[0].name} (ID: ${ericaId})`);
    
    // Adicionar bônus de R$5000 para Erica
    await pool.query(`
      INSERT INTO user_balances (
        user_id, account_type, total_balance, available_balance, 
        reserved_balance, bonus_balance, currency, created_at, updated_at
      ) VALUES (
        $1, 'live', 5000.00, 0.00, 0.00, 5000.00, 'BRL', NOW(), NOW()
      )
    `, [ericaId]);
    console.log(`   💰 Bônus de R$5.000 adicionado`);
    
    // Chaves API da Erica
    await pool.query(`
      INSERT INTO user_api_keys (
        user_id, exchange, api_key, api_secret, 
        is_active, validation_status, created_at, updated_at
      ) VALUES (
        $1, 'bybit', 'axgdZkzOx55Ay3aqeg', 'xRU8tPASGVQYr2b0c0t32BxmdG8w7Jx8ltOR', 
        true, 'valid', NOW(), NOW()
      )
    `, [ericaId]);
    console.log(`   🔑 Chaves API Bybit configuradas e validadas`);

    // 3. ADMIN COINBITCLUB
    console.log('\n🔄 Cadastrando ADMIN COINBITCLUB...');
    
    const hashAdmin = await bcrypt.hash('Apelido22@', 10);
    
    const admin = await pool.query(`
      INSERT INTO users (
        name, email, password_hash, phone, country, 
        vip_status, role, status, created_at, updated_at
      ) VALUES (
        'ADMIN CoinBitClub', 'faleconosco@coinbitclub.vip', $1, '5521995966652', 'BR',
        true, 'admin', 'active', NOW(), NOW()
      ) RETURNING id, name, email
    `, [hashAdmin]);
    
    const adminId = admin.rows[0].id;
    console.log(`   ✅ Administrador criado: ${admin.rows[0].name} (ID: ${adminId})`);
    
    // Adicionar configurações específicas para admin
    await pool.query(`
      INSERT INTO user_balances (
        user_id, account_type, total_balance, available_balance, 
        reserved_balance, bonus_balance, currency, created_at, updated_at
      ) VALUES (
        $1, 'admin', 0.00, 0.00, 0.00, 0.00, 'BRL', NOW(), NOW()
      )
    `, [adminId]);
    console.log(`   🔧 Configurações de administrador aplicadas`);

    // Verificar resultado final
    console.log('\n📊 VERIFICANDO USUÁRIOS CRIADOS...');
    
    const totalUsers = await pool.query('SELECT COUNT(*) as count FROM users');
    const users = await pool.query(`
      SELECT id, name, email, vip_status, admin_status, created_at
      FROM users 
      ORDER BY id DESC
      LIMIT 4
    `);
    
    console.log(`\n✅ CADASTROS CONCLUÍDOS!`);
    console.log(`   📊 Total de usuários no sistema: ${totalUsers.rows[0].count}`);
    
    console.log('\n👥 ÚLTIMOS USUÁRIOS CADASTRADOS:');
    users.rows.forEach((user, index) => {
      const status = user.admin_status ? 'ADMIN' : user.vip_status ? 'VIP' : 'COMUM';
      console.log(`   ${index + 1}. ${user.name} (${user.email})`);
      console.log(`      ID: ${user.id} | Status: ${status}`);
      console.log(`      Cadastrado: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
    });

    // Verificar saldos
    const balances = await pool.query(`
      SELECT u.name, u.email, ub.bonus_balance, ub.currency, ub.account_type
      FROM users u
      JOIN user_balances ub ON u.id = ub.user_id
      WHERE u.id IN ($1, $2, $3)
      ORDER BY u.id DESC
    `, [palomaId, ericaId, adminId]);
    
    console.log('\n💰 SALDOS CONFIGURADOS:');
    balances.rows.forEach(balance => {
      console.log(`   👤 ${balance.name}: R$${balance.bonus_balance} (${balance.account_type})`);
    });

    // Verificar chaves API
    const apiKeys = await pool.query(`
      SELECT u.name, uak.exchange, uak.api_key, uak.validation_status, uak.is_active
      FROM users u
      JOIN user_api_keys uak ON u.id = uak.user_id
      WHERE u.id IN ($1, $2)
      ORDER BY u.id DESC
    `, [palomaId, ericaId]);
    
    console.log('\n🔑 CHAVES API CONFIGURADAS:');
    apiKeys.rows.forEach(key => {
      const keyDisplay = key.api_key.length > 10 ? key.api_key.substring(0, 10) + '...' : key.api_key;
      const status = key.is_active ? 'ATIVA' : 'INATIVA';
      console.log(`   👤 ${key.name}: ${key.exchange} - ${keyDisplay} (${status})`);
    });

    console.log('\n🎉 TODOS OS USUÁRIOS FORAM CRIADOS COM SUCESSO!');
    console.log('📋 Sistema pronto para uso com os novos cadastros');
    
  } catch (error) {
    console.error('❌ Erro durante a criação dos usuários:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

criarUsuarios();
