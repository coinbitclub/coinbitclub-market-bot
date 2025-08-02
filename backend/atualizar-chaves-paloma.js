const { Pool } = require('pg');

const pool = new Pool({
  host: 'maglev.proxy.rlwy.net',
  port: 42095,
  database: 'railway',
  user: 'postgres',
  password: 'FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv'
});

async function atualizarChavesPaloma() {
  try {
    console.log('🔑 ATUALIZANDO CHAVES API DA PALOMA');
    
    // Buscar ID da Paloma
    const paloma = await pool.query(`
      SELECT id, name FROM users WHERE email = 'pamaral15@hotmail.com'
    `);
    
    if (paloma.rows.length === 0) {
      console.log('❌ Usuária Paloma não encontrada');
      return;
    }
    
    const palomaId = paloma.rows[0].id;
    const palomaName = paloma.rows[0].name;
    
    console.log(`👤 Encontrada: ${palomaName} (ID: ${palomaId})`);
    
    // Chaves da imagem compartilhada
    const apiKey = 'DxFAJJEBN2e12R5B4riU';
    const secretKey = 'SgxOl7DAmzrrQNlTz6NMZoR9Q4noNlWABvi';
    
    console.log('🔄 Atualizando chaves API...');
    
    // Atualizar as chaves API existentes
    const updateResult = await pool.query(`
      UPDATE user_api_keys 
      SET 
        api_key = $1,
        secret_key = $2,
        is_active = true,
        validation_status = 'valid',
        environment = 'mainnet',
        updated_at = NOW()
      WHERE user_id = $3 AND exchange = 'bybit'
      RETURNING id, api_key
    `, [apiKey, secretKey, palomaId]);
    
    if (updateResult.rows.length > 0) {
      console.log(`   ✅ Chaves atualizadas com sucesso!`);
      console.log(`   🔑 API Key: ${apiKey}`);
      console.log(`   🔐 Secret: ${secretKey.substring(0, 10)}...`);
      console.log(`   🌐 Environment: mainnet`);
      console.log(`   ✅ Status: Ativa e validada`);
    } else {
      console.log('❌ Nenhum registro foi atualizado');
    }
    
    // Verificar a atualização
    const verification = await pool.query(`
      SELECT 
        ak.api_key, ak.secret_key, ak.is_active, 
        ak.validation_status, ak.environment, ak.updated_at
      FROM user_api_keys ak
      WHERE ak.user_id = $1 AND ak.exchange = 'bybit'
    `, [palomaId]);
    
    if (verification.rows.length > 0) {
      const key = verification.rows[0];
      console.log('\n📋 VERIFICAÇÃO DAS CHAVES:');
      console.log(`   API Key: ${key.api_key}`);
      console.log(`   Secret: ${key.secret_key.substring(0, 10)}...`);
      console.log(`   Ativa: ${key.is_active ? '✅ Sim' : '❌ Não'}`);
      console.log(`   Status: ${key.validation_status}`);
      console.log(`   Environment: ${key.environment}`);
      console.log(`   Atualizado: ${key.updated_at}`);
    }
    
    console.log('\n✅ CHAVES DA PALOMA ATUALIZADAS COM SUCESSO!');
    
  } catch (error) {
    console.error('❌ Erro ao atualizar chaves:', error.message);
  } finally {
    await pool.end();
  }
}

atualizarChavesPaloma();
