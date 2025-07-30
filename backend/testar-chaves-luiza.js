const { Pool } = require('pg');
const crypto = require('crypto');
const https = require('https');

const pool = new Pool({
  connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function testarChavesLuiza() {
  try {
    console.log('🔍 TESTANDO CHAVES API DA LUIZA SANTOS...');
    console.log('=' .repeat(60));
    
    // Buscar chaves da Luiza (ID 4 - Luiza Maria de Almeida Pinto)
    const keysQuery = await pool.query(`
      SELECT * FROM user_api_keys 
      WHERE user_id = 4 AND is_active = true
      ORDER BY created_at DESC
      LIMIT 1
    `);
    
    if (keysQuery.rows.length === 0) {
      console.log('❌ Nenhuma chave ativa encontrada para Luiza');
      return;
    }
    
    const key = keysQuery.rows[0];
    console.log('🔑 CHAVE ENCONTRADA:');
    console.log(`   Exchange: ${key.exchange}`);
    console.log(`   Environment: ${key.environment}`);
    console.log(`   API Key: ${key.api_key}`);
    console.log(`   Secret Key: ${key.secret_key?.substring(0, 8)}...`);
    console.log(`   Status: ${key.validation_status}`);
    console.log(`   Criada: ${key.created_at}`);
    console.log(`   Atualizada: ${key.updated_at}`);
    
    // Verificar se as chaves correspondem às mostradas na imagem
    const expectedApiKey = '9HVNA00aCaRqPUve25';
    const expectedSecret = 'rQXQlcB1XBKoLLRNru5tOLqnT6DrZ7wAOrV'; // Truncado da imagem
    
    console.log('\n🔍 COMPARANDO COM CHAVES ESPERADAS:');
    console.log(`   API Key no DB: ${key.api_key}`);
    console.log(`   API Key esperada: ${expectedApiKey}`);
    
    if (key.api_key === expectedApiKey) {
      console.log('✅ API Key CORRETA!');
    } else {
      console.log('❌ API Key INCORRETA! Precisa ser atualizada.');
    }
    
    // Testar conexão com Bybit
    console.log('\n🔗 TESTANDO CONEXÃO COM BYBIT:');
    
    const testBybitConnection = (apiKey, apiSecret) => {
      return new Promise((resolve) => {
        try {
          const timestamp = Date.now().toString();
          const recvWindow = '5000';
          const queryString = `timestamp=${timestamp}&recvWindow=${recvWindow}`;
          const signature = crypto.createHmac('sha256', apiSecret).update(queryString).digest('hex');
          
          const options = {
            hostname: 'api.bybit.com',
            path: `/v5/account/wallet-balance?category=unified&${queryString}&signature=${signature}`,
            method: 'GET',
            headers: {
              'X-BAPI-API-KEY': apiKey,
              'X-BAPI-TIMESTAMP': timestamp,
              'X-BAPI-RECV-WINDOW': recvWindow,
              'X-BAPI-SIGN': signature
            }
          };
          
          const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
              try {
                const response = JSON.parse(data);
                resolve(response);
              } catch (e) {
                resolve({ error: 'Parse error', data });
              }
            });
          });
          
          req.on('error', (error) => {
            resolve({ error: error.message });
          });
          
          req.setTimeout(10000, () => {
            resolve({ error: 'Timeout' });
            req.destroy();
          });
          
          req.end();
          
        } catch (error) {
          resolve({ error: error.message });
        }
      });
    };
    
    // Testar com as chaves atuais do banco
    console.log('📡 Testando com chaves do banco...');
    const result1 = await testBybitConnection(key.api_key, key.secret_key);
    
    if (result1.error) {
      console.log(`❌ Erro: ${result1.error}`);
    } else if (result1.retCode === 0) {
      console.log('✅ Conexão SUCESSO com chaves do banco!');
      console.log('   Saldo:', JSON.stringify(result1.result, null, 2));
    } else {
      console.log(`❌ Erro API: ${result1.retMsg} (Código: ${result1.retCode})`);
    }
    
    // Testar com as chaves corretas da imagem (se diferentes)
    if (key.api_key !== expectedApiKey) {
      console.log('\n📡 Testando com chaves corretas da imagem...');
      const result2 = await testBybitConnection(expectedApiKey, expectedSecret);
      
      if (result2.error) {
        console.log(`❌ Erro: ${result2.error}`);
      } else if (result2.retCode === 0) {
        console.log('✅ Conexão SUCESSO com chaves corretas!');
        console.log('   Saldo:', JSON.stringify(result2.result, null, 2));
        
        // Atualizar chaves no banco
        console.log('\n💾 ATUALIZANDO CHAVES NO BANCO...');
        await pool.query(`
          UPDATE user_api_keys 
          SET api_key = $1, secret_key = $2, updated_at = NOW(), validation_status = 'valid'
          WHERE id = $3
        `, [expectedApiKey, expectedSecret, key.id]);
        
        console.log('✅ Chaves atualizadas no banco!');
        
      } else {
        console.log(`❌ Erro API: ${result2.retMsg} (Código: ${result2.retCode})`);
      }
    }
    
    // Verificar crédito bônus
    console.log('\n💰 VERIFICANDO CRÉDITO BÔNUS...');
    
    const balanceQuery = await pool.query(`
      SELECT * FROM user_balances 
      WHERE user_id = 4 AND currency = 'USDT'
    `);
    
    if (balanceQuery.rows.length > 0) {
      const balance = balanceQuery.rows[0];
      console.log(`💳 Saldo atual: $${balance.total_balance} USDT`);
      
      if (parseFloat(balance.total_balance) < 500) {
        console.log('⚠️ Saldo menor que R$500, adicionando crédito bônus...');
        
        await pool.query(`
          UPDATE user_balances 
          SET total_balance = 500.00, available_balance = 500.00, last_updated = NOW()
          WHERE user_id = 4 AND currency = 'USDT'
        `);
        
        console.log('✅ Crédito bônus de $500 USDT adicionado!');
      } else {
        console.log('✅ Saldo adequado (>= $500 USDT)');
      }
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('🔍 TESTE COMPLETO DA LUIZA CONCLUÍDO');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

// Executar teste
testarChavesLuiza().catch(console.error);
