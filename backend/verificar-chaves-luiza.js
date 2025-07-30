const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function verificarChavesLuiza() {
  try {
    console.log('🔍 VERIFICANDO CHAVES API DA LUIZA SANTOS...');
    console.log('=' .repeat(60));
    
    // 1. Buscar usuário Luiza
    console.log('👤 BUSCANDO USUÁRIO LUIZA:');
    const userQuery = await pool.query(`
      SELECT id, name, email, created_at 
      FROM users 
      WHERE name ILIKE '%luiza%' OR email ILIKE '%luiza%'
      ORDER BY id
    `);
    
    if (userQuery.rows.length === 0) {
      console.log('❌ Usuário Luiza não encontrado');
      return;
    }
    
    console.log('✅ Usuários encontrados:');
    userQuery.rows.forEach(user => {
      console.log(`   ID: ${user.id} | Nome: ${user.name} | Email: ${user.email}`);
    });
    
    const luizaUserId = userQuery.rows[0].id;
    
    // 2. Verificar chaves API
    console.log('\n🔑 VERIFICANDO CHAVES API:');
    const keysQuery = await pool.query(`
      SELECT id, user_id, api_key, api_secret, created_at, updated_at
      FROM user_api_keys 
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [luizaUserId]);
    
    if (keysQuery.rows.length === 0) {
      console.log('❌ Nenhuma chave API encontrada para Luiza');
    } else {
      console.log(`✅ ${keysQuery.rows.length} chave(s) encontrada(s):`);
      keysQuery.rows.forEach((key, idx) => {
        console.log(`   Chave ${idx + 1}:`);
        console.log(`     ID: ${key.id}`);
        console.log(`     API Key: ${key.api_key?.substring(0, 8)}...`);
        console.log(`     API Secret: ${key.api_secret?.substring(0, 8)}...`);
        console.log(`     Criada: ${key.created_at}`);
        console.log(`     Atualizada: ${key.updated_at}`);
      });
    }
    
    // 3. Verificar saldo/créditos
    console.log('\n💰 VERIFICANDO SALDOS E CRÉDITOS:');
    
    // Verificar na tabela user_balances
    const balanceQuery = await pool.query(`
      SELECT * FROM user_balances WHERE user_id = $1
    `, [luizaUserId]);
    
    if (balanceQuery.rows.length > 0) {
      console.log('✅ Saldos encontrados:');
      balanceQuery.rows.forEach(balance => {
        console.log(`   Saldo: R$ ${balance.balance || 0}`);
        console.log(`   Crédito Bônus: R$ ${balance.bonus_balance || 0}`);
        console.log(`   Atualizado: ${balance.updated_at}`);
      });
    } else {
      console.log('⚠️ Nenhum saldo encontrado');
    }
    
    // Verificar na tabela user_financial
    const financialQuery = await pool.query(`
      SELECT * FROM user_financial WHERE user_id = $1
    `, [luizaUserId]);
    
    if (financialQuery.rows.length > 0) {
      console.log('✅ Dados financeiros encontrados:');
      financialQuery.rows.forEach(fin => {
        console.log(`   Saldo Total: R$ ${fin.total_balance || 0}`);
        console.log(`   Crédito Bônus: R$ ${fin.bonus_credits || 0}`);
        console.log(`   Status: ${fin.status || 'N/A'}`);
      });
    }
    
    // 4. Testar conexão com Bybit (se tiver chaves)
    if (keysQuery.rows.length > 0) {
      console.log('\n🔗 TESTANDO CONEXÃO COM BYBIT:');
      const latestKey = keysQuery.rows[0];
      
      try {
        const crypto = require('crypto');
        const https = require('https');
        
        const apiKey = latestKey.api_key;
        const apiSecret = latestKey.api_secret;
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
              if (response.retCode === 0) {
                console.log('✅ Conexão Bybit: SUCESSO');
                console.log(`   Resposta: ${JSON.stringify(response.result, null, 2)}`);
              } else {
                console.log('❌ Erro Bybit:', response.retMsg);
              }
            } catch (e) {
              console.log('❌ Erro parsing resposta Bybit:', e.message);
            }
          });
        });
        
        req.on('error', (error) => {
          console.log('❌ Erro requisição Bybit:', error.message);
        });
        
        req.setTimeout(10000, () => {
          console.log('❌ Timeout na requisição Bybit');
          req.destroy();
        });
        
        req.end();
        
      } catch (error) {
        console.log('❌ Erro ao testar Bybit:', error.message);
      }
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('🔍 VERIFICAÇÃO COMPLETA DA LUIZA CONCLUÍDA');
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error.message);
  } finally {
    await pool.end();
  }
}

// Executar verificação
verificarChavesLuiza().catch(console.error);
