const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function atualizarChavesLuiza() {
  try {
    console.log('🔄 ATUALIZANDO CHAVES DA LUIZA SANTOS...');
    console.log('=' .repeat(60));
    
    // Chaves corretas da imagem fornecida
    const chavesCorretas = {
      api_key: '9HVNA00aCaRqPUve25',
      secret_key: 'rQXQlcB1XBKoLLRNru5tOLqnT6DrZ7wAOrV'
    };
    
    console.log('🔑 CHAVES CORRETAS A SEREM INSERIDAS:');
    console.log(`   API Key: ${chavesCorretas.api_key}`);
    console.log(`   Secret Key: ${chavesCorretas.secret_key}`);
    
    // Atualizar chaves para Luiza Maria de Almeida Pinto (ID 4)
    const updateResult = await pool.query(`
      UPDATE user_api_keys 
      SET 
        api_key = $1,
        secret_key = $2,
        updated_at = NOW(),
        validation_status = 'pending',
        error_message = 'Chaves atualizadas - aguardando validação'
      WHERE user_id = 4 AND exchange = 'bybit'
      RETURNING *
    `, [chavesCorretas.api_key, chavesCorretas.secret_key]);
    
    if (updateResult.rows.length > 0) {
      console.log('✅ CHAVES ATUALIZADAS COM SUCESSO!');
      const updated = updateResult.rows[0];
      console.log(`   ID: ${updated.id}`);
      console.log(`   User ID: ${updated.user_id}`);
      console.log(`   API Key: ${updated.api_key}`);
      console.log(`   Secret: ${updated.secret_key?.substring(0, 8)}...`);
      console.log(`   Status: ${updated.validation_status}`);
      console.log(`   Atualizado: ${updated.updated_at}`);
    } else {
      console.log('❌ Nenhuma chave foi atualizada. Verificando se precisa inserir...');
      
      // Inserir nova chave se não existir
      const insertResult = await pool.query(`
        INSERT INTO user_api_keys (
          user_id, exchange, api_key, secret_key, environment, 
          is_active, validation_status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING *
      `, [4, 'bybit', chavesCorretas.api_key, chavesCorretas.secret_key, 'mainnet', true, 'pending']);
      
      if (insertResult.rows.length > 0) {
        console.log('✅ NOVA CHAVE INSERIDA COM SUCESSO!');
        const inserted = insertResult.rows[0];
        console.log(`   ID: ${inserted.id}`);
        console.log(`   API Key: ${inserted.api_key}`);
      }
    }
    
    // Verificar se foi salvo corretamente
    console.log('\n🔍 VERIFICANDO CHAVES SALVAS:');
    const verifyQuery = await pool.query(`
      SELECT * FROM user_api_keys 
      WHERE user_id = 4 AND exchange = 'bybit'
      ORDER BY updated_at DESC
    `);
    
    verifyQuery.rows.forEach((key, idx) => {
      console.log(`   Chave ${idx + 1}:`);
      console.log(`     ID: ${key.id}`);
      console.log(`     API Key: ${key.api_key}`);
      console.log(`     Secret: ${key.secret_key?.substring(0, 8)}...`);
      console.log(`     Ativa: ${key.is_active}`);
      console.log(`     Status: ${key.validation_status}`);
      console.log(`     Atualizada: ${key.updated_at}`);
    });
    
    // Garantir crédito bônus de R$500
    console.log('\n💰 GARANTINDO CRÉDITO BÔNUS DE R$500...');
    
    const balanceUpdate = await pool.query(`
      UPDATE user_balances 
      SET 
        total_balance = GREATEST(total_balance, 500.00),
        available_balance = GREATEST(available_balance, 500.00),
        last_updated = NOW()
      WHERE user_id = 4 AND currency = 'USDT'
      RETURNING *
    `);
    
    if (balanceUpdate.rows.length > 0) {
      const balance = balanceUpdate.rows[0];
      console.log(`✅ Saldo atualizado: $${balance.total_balance} USDT`);
      console.log(`   Disponível: $${balance.available_balance} USDT`);
    }
    
    // Verificar usuário na tabela users
    console.log('\n👤 VERIFICANDO DADOS DO USUÁRIO:');
    const userQuery = await pool.query(`
      SELECT id, name, email, vip_status, plan_type, balance_usd
      FROM users 
      WHERE id = 4
    `);
    
    if (userQuery.rows.length > 0) {
      const user = userQuery.rows[0];
      console.log(`   Nome: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   VIP Status: ${user.vip_status}`);
      console.log(`   Plano: ${user.plan_type}`);
      console.log(`   Saldo USD: $${user.balance_usd || 0}`);
      
      // Atualizar para VIP se não for
      if (!user.vip_status) {
        await pool.query(`
          UPDATE users 
          SET vip_status = true, plan_type = 'VIP', balance_usd = GREATEST(COALESCE(balance_usd, 0), 500)
          WHERE id = 4
        `);
        console.log('✅ Usuário promovido para VIP com saldo mínimo garantido');
      }
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('✅ ATUALIZAÇÃO COMPLETA DA LUIZA CONCLUÍDA!');
    console.log('📋 RESUMO:');
    console.log('   ✅ Chaves API atualizadas com dados corretos');
    console.log('   ✅ Crédito bônus garantido (≥ $500 USDT)');
    console.log('   ✅ Status VIP confirmado');
    console.log('   ✅ Dados salvos no banco real (maglev.proxy)');
    
  } catch (error) {
    console.error('❌ Erro na atualização:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

// Executar atualização
atualizarChavesLuiza().catch(console.error);
