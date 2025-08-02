const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  host: 'maglev.proxy.rlwy.net',
  port: 42095,
  database: 'railway',
  user: 'postgres',
  password: 'FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv'
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
        vip_status, role, status, balance, credit_bonus, created_at, updated_at
      ) VALUES (
        'Paloma Amaral', 'pamaral15@hotmail.com', $1, '55 21 982218182', 'BR',
        false, 'user', 'active', 500.00, 500.00, NOW(), NOW()
      ) RETURNING id, name, email
    `, [hashPaloma]);
    
    const palomaId = paloma.rows[0].id;
    console.log(`   ✅ Usuário criado: ${paloma.rows[0].name} (ID: ${palomaId})`);
    
    // Adicionar balanço na tabela user_balances
    await pool.query(`
      INSERT INTO user_balances (
        user_id, exchange, currency, available_balance, total_balance, created_at
      ) VALUES (
        $1, 'bybit', 'BRL', 500.00, 500.00, NOW()
      )
    `, [palomaId]);
    console.log(`   💰 Balanço de R$500 configurado`);
    
    // Chaves API placeholders para Paloma
    await pool.query(`
      INSERT INTO user_api_keys (
        user_id, exchange, api_key, secret_key, 
        is_active, validation_status, environment, created_at, updated_at
      ) VALUES (
        $1, 'bybit', 'PLACEHOLDER_API_KEY_PALOMA', 'PLACEHOLDER_SECRET_PALOMA', 
        false, 'pending', 'testnet', NOW(), NOW()
      )
    `, [palomaId]);
    console.log(`   🔑 Chaves API criadas (aguardando configuração)`);

    // 2. ERICA DOS SANTOS ANDRADE
    console.log('\n🔄 Cadastrando ERICA DOS SANTOS ANDRADE...');
    
    const hashErica = await bcrypt.hash('Apelido22@', 10);
    
    const erica = await pool.query(`
      INSERT INTO users (
        name, email, password_hash, phone, country, 
        vip_status, role, status, balance, credit_bonus, created_at, updated_at
      ) VALUES (
        'Erica dos Santos Andrade', 'erica.andrade.santos@hotmail.com', $1, '55 21 987386645', 'BR',
        true, 'vip', 'active', 5000.00, 5000.00, NOW(), NOW()
      ) RETURNING id, name, email
    `, [hashErica]);
    
    const ericaId = erica.rows[0].id;
    console.log(`   ✅ Usuário VIP criado: ${erica.rows[0].name} (ID: ${ericaId})`);
    
    // Adicionar balanço na tabela user_balances
    await pool.query(`
      INSERT INTO user_balances (
        user_id, exchange, currency, available_balance, total_balance, created_at
      ) VALUES (
        $1, 'bybit', 'BRL', 5000.00, 5000.00, NOW()
      )
    `, [ericaId]);
    console.log(`   💰 Balanço de R$5.000 configurado`);
    
    // Chaves API da Erica
    await pool.query(`
      INSERT INTO user_api_keys (
        user_id, exchange, api_key, secret_key, 
        is_active, validation_status, environment, created_at, updated_at
      ) VALUES (
        $1, 'bybit', 'axgdZkzOx55Ay3aqeg', 'xRU8tPASGVQYr2b0c0t32BxmdG8w7Jx8ltOR', 
        true, 'valid', 'mainnet', NOW(), NOW()
      )
    `, [ericaId]);
    console.log(`   🔑 Chaves API Bybit configuradas e validadas`);

    // 3. ADMIN COINBITCLUB
    console.log('\n🔄 Cadastrando ADMIN COINBITCLUB...');
    
    const hashAdmin = await bcrypt.hash('Apelido22@', 10);
    
    const admin = await pool.query(`
      INSERT INTO users (
        name, email, password_hash, phone, country, 
        vip_status, role, status, balance, credit_bonus, created_at, updated_at
      ) VALUES (
        'ADMIN CoinBitClub', 'faleconosco@coinbitclub.vip', $1, '5521995966652', 'BR',
        true, 'admin', 'active', 0.00, 0.00, NOW(), NOW()
      ) RETURNING id, name, email
    `, [hashAdmin]);
    
    const adminId = admin.rows[0].id;
    console.log(`   ✅ Administrador criado: ${admin.rows[0].name} (ID: ${adminId})`);
    
    // Adicionar balanço admin na tabela user_balances
    await pool.query(`
      INSERT INTO user_balances (
        user_id, exchange, currency, available_balance, total_balance, created_at
      ) VALUES (
        $1, 'bybit', 'BRL', 0.00, 0.00, NOW()
      )
    `, [adminId]);
    console.log(`   🔧 Configurações de administrador aplicadas`);

    console.log('\n✅ TODOS OS USUÁRIOS CRIADOS COM SUCESSO!');
    console.log('\n📊 RESUMO DOS CADASTROS:');
    console.log(`   👤 Paloma Amaral (ID: ${palomaId}) - Usuário comum com R$500`);
    console.log(`   💎 Erica dos Santos Andrade (ID: ${ericaId}) - VIP com R$5.000 + API Keys`);
    console.log(`   👑 ADMIN CoinBitClub (ID: ${adminId}) - Administrador do sistema`);
    
  } catch (error) {
    console.error('❌ Erro durante a criação dos usuários:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

criarUsuarios();
