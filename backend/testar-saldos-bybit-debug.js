const { Pool } = require('pg');
const crypto = require('crypto');
const https = require('https');

const pool = new Pool({
  connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

// Função para fazer requisições para Bybit API com melhor tratamento de erros
function makeBybitRequest(endpoint, apiKey, secretKey, params = {}) {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now().toString();
    const recvWindow = '5000';
    
    // Criar query string
    const queryParams = {
      ...params,
      timestamp,
      recvWindow
    };
    
    const queryString = Object.keys(queryParams)
      .sort()
      .map(key => `${key}=${queryParams[key]}`)
      .join('&');
    
    // Criar assinatura
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(queryString)
      .digest('hex');
    
    const finalQuery = `${queryString}&signature=${signature}`;
    
    const options = {
      hostname: 'api.bybit.com',
      port: 443,
      path: `${endpoint}?${finalQuery}`,
      method: 'GET',
      headers: {
        'X-BAPI-API-KEY': apiKey,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-RECV-WINDOW': recvWindow,
        'X-BAPI-SIGN': signature,
        'Content-Type': 'application/json',
        'User-Agent': 'CoinBitClub-Bot/1.0'
      }
    };
    
    console.log(`      🔗 URL: https://api.bybit.com${endpoint}`);
    console.log(`      📝 Query: ${queryString.substring(0, 100)}...`);
    
    const req = https.request(options, (res) => {
      let data = '';
      
      console.log(`      📊 Status HTTP: ${res.statusCode}`);
      console.log(`      📋 Headers: ${JSON.stringify(res.headers)}`);
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`      📦 Response length: ${data.length} chars`);
        console.log(`      📄 Response preview: ${data.substring(0, 200)}...`);
        
        if (!data || data.trim() === '') {
          reject(new Error('Resposta vazia da API Bybit'));
          return;
        }
        
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          console.log(`      ❌ JSON parse error: ${error.message}`);
          console.log(`      📄 Raw response: ${data}`);
          reject(new Error(`Erro ao parsear JSON: ${error.message} | Raw: ${data.substring(0, 500)}`));
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`      ❌ Request error: ${error.message}`);
      reject(error);
    });
    
    req.setTimeout(15000, () => {
      console.log(`      ⏰ Request timeout após 15s`);
      req.destroy();
      reject(new Error('Timeout na requisição (15s)'));
    });
    
    req.end();
  });
}

async function testarConexaoBybit() {
  try {
    console.log('🔍 TESTANDO CONEXÃO COM BYBIT API...');
    console.log('=' .repeat(70));
    
    // 1. Teste simples sem autenticação primeiro
    console.log('📡 1. Teste de conectividade básica...');
    
    const testeBasico = new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.bybit.com',
        port: 443,
        path: '/v5/market/time',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'CoinBitClub-Bot/1.0'
        }
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve(response);
          } catch (error) {
            reject(new Error(`Erro JSON: ${error.message} | Data: ${data}`));
          }
        });
      });
      
      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Timeout no teste básico'));
      });
      req.end();
    });
    
    try {
      const timeResponse = await testeBasico;
      console.log('   ✅ Conectividade com Bybit OK');
      console.log(`   ⏰ Server time: ${timeResponse.result?.timeSecond || 'N/A'}`);
    } catch (error) {
      console.log(`   ❌ Erro na conectividade básica: ${error.message}`);
      throw error;
    }
    
    // 2. Buscar usuárias VIP
    console.log('\n📋 2. Buscando usuárias VIP no banco...');
    
    const usuariasVip = await pool.query(`
      SELECT u.id, u.name, u.email, u.plan_type,
             uak.api_key, uak.secret_key, uak.exchange, 
             uak.is_active, uak.validation_status
      FROM users u
      INNER JOIN user_api_keys uak ON u.id = uak.user_id
      WHERE u.name IN ('Luiza Maria de Almeida Pinto', 'Érica dos Santos', 'PALOMA AMARAL')
        AND uak.is_active = true
        AND uak.api_key IS NOT NULL
        AND uak.secret_key IS NOT NULL
      ORDER BY u.id
    `);
    
    console.log(`   ✅ Encontradas ${usuariasVip.rows.length} usuárias com chaves API`);
    
    // 3. Testar cada usuária individualmente
    console.log('\n💰 3. Testando chaves API e verificando saldos...');
    
    for (let i = 0; i < usuariasVip.rows.length; i++) {
      const usuario = usuariasVip.rows[i];
      
      console.log(`\n🔍 [${i + 1}/${usuariasVip.rows.length}] ${usuario.name}`);
      console.log(`   📧 ${usuario.email}`);
      console.log(`   🔑 API Key: ${usuario.api_key}`);
      console.log(`   🔐 Secret: ${usuario.secret_key.substring(0, 8)}...${usuario.secret_key.substring(-4)}`);
      
      try {
        // Primeiro teste: informações da conta
        console.log('   📊 Testando autenticação...');
        
        const accountInfo = await makeBybitRequest(
          '/v5/user/query-api',
          usuario.api_key,
          usuario.secret_key
        );
        
        if (accountInfo.retCode === 0) {
          console.log('   ✅ Autenticação bem-sucedida!');
          console.log(`   👤 User ID: ${accountInfo.result?.userId || 'N/A'}`);
          console.log(`   🔐 Permissões: ${JSON.stringify(accountInfo.result?.permissions || {})}`);
          
          // Segundo teste: saldo da conta
          console.log('   💰 Consultando saldos...');
          
          const saldoResponse = await makeBybitRequest(
            '/v5/account/wallet-balance',
            usuario.api_key,
            usuario.secret_key,
            { accountType: 'UNIFIED' }
          );
          
          if (saldoResponse.retCode === 0) {
            const wallet = saldoResponse.result?.list?.[0];
            
            if (wallet && wallet.coin && wallet.coin.length > 0) {
              console.log('   💰 SALDOS ENCONTRADOS:');
              
              wallet.coin.forEach(coin => {
                const walletBalance = parseFloat(coin.walletBalance || 0);
                const availableBalance = parseFloat(coin.availableBalance || 0);
                
                if (walletBalance > 0 || availableBalance > 0) {
                  console.log(`      💎 ${coin.coin}: ${walletBalance} (Disponível: ${availableBalance})`);
                }
              });
              
              // Verificar se há saldos zerados também
              const saldosZerados = wallet.coin.filter(coin => 
                parseFloat(coin.walletBalance || 0) === 0 && 
                parseFloat(coin.availableBalance || 0) === 0
              );
              
              if (saldosZerados.length > 0) {
                console.log(`      💸 ${saldosZerados.length} moedas com saldo zero`);
              }
              
            } else {
              console.log('   💸 Conta sem saldos (zerada)');
            }
            
          } else {
            console.log(`   ❌ Erro ao consultar saldo: ${saldoResponse.retMsg}`);
          }
          
        } else {
          console.log(`   ❌ Erro de autenticação: ${accountInfo.retMsg}`);
          console.log(`   📋 Código: ${accountInfo.retCode}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Erro na requisição: ${error.message}`);
      }
      
      // Pausa entre usuários para evitar rate limit
      if (i < usuariasVip.rows.length - 1) {
        console.log('   ⏱️ Aguardando 2s antes da próxima verificação...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log('\n' + '=' .repeat(70));
    console.log('✅ VERIFICAÇÃO DE SALDOS BYBIT CONCLUÍDA');
    console.log('=' .repeat(70));
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
    console.log('\n🔌 Conexão com banco fechada');
  }
}

// Executar teste
testarConexaoBybit().catch(console.error);
