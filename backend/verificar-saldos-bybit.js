const { Pool } = require('pg');
const crypto = require('crypto');
const https = require('https');

const pool = new Pool({
  connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

// Função para fazer requisições para Bybit API
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
        'Content-Type': 'application/json'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(new Error(`Erro ao parsear resposta: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout na requisição'));
    });
    
    req.end();
  });
}

async function verificarSaldosBybit() {
  try {
    console.log('💰 VERIFICANDO SALDOS REAIS NA BYBIT...');
    console.log('=' .repeat(70));
    
    // 1. Buscar todas as usuárias VIP com chaves API
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
    
    console.log(`📋 Encontradas ${usuariasVip.rows.length} usuárias VIP com chaves API ativas`);
    console.log('');
    
    const resultados = [];
    
    // 2. Verificar saldo de cada usuária
    for (const usuario of usuariasVip.rows) {
      console.log(`🔍 VERIFICANDO: ${usuario.name}`);
      console.log(`   📧 Email: ${usuario.email}`);
      console.log(`   🔑 API Key: ${usuario.api_key}`);
      console.log(`   🔐 Secret: ${usuario.secret_key.substring(0, 8)}...`);
      
      try {
        // Verificar saldo na conta unificada (UTA)
        console.log('   📊 Consultando saldo na Bybit...');
        
        const saldoResponse = await makeBybitRequest(
          '/v5/account/wallet-balance',
          usuario.api_key,
          usuario.secret_key,
          { accountType: 'UNIFIED' }
        );
        
        if (saldoResponse.retCode === 0) {
          console.log('   ✅ Conexão com Bybit bem-sucedida!');
          
          const wallet = saldoResponse.result?.list?.[0];
          if (wallet && wallet.coin) {
            console.log('   💰 SALDOS ENCONTRADOS:');
            
            let saldosFormatados = [];
            wallet.coin.forEach(coin => {
              const walletBalance = parseFloat(coin.walletBalance || 0);
              const availableBalance = parseFloat(coin.availableBalance || 0);
              const locked = parseFloat(coin.locked || 0);
              
              if (walletBalance > 0 || availableBalance > 0 || locked > 0) {
                console.log(`      💎 ${coin.coin}:`);
                console.log(`         💰 Total: ${walletBalance}`);
                console.log(`         🟢 Disponível: ${availableBalance}`);
                console.log(`         🔒 Bloqueado: ${locked}`);
                
                saldosFormatados.push({
                  coin: coin.coin,
                  total: walletBalance,
                  disponivel: availableBalance,
                  bloqueado: locked
                });
              }
            });
            
            if (saldosFormatados.length === 0) {
              console.log('      ⚠️ Nenhum saldo encontrado (conta zerada)');
            }
            
            resultados.push({
              usuario: usuario.name,
              email: usuario.email,
              status: 'sucesso',
              chaveValida: true,
              saldos: saldosFormatados,
              erro: null
            });
            
          } else {
            console.log('   ⚠️ Nenhum wallet encontrado na resposta');
            resultados.push({
              usuario: usuario.name,
              email: usuario.email,
              status: 'sem_wallet',
              chaveValida: true,
              saldos: [],
              erro: 'Nenhum wallet encontrado'
            });
          }
          
        } else {
          console.log(`   ❌ Erro na API Bybit: ${saldoResponse.retMsg}`);
          console.log(`   📋 Código: ${saldoResponse.retCode}`);
          
          resultados.push({
            usuario: usuario.name,
            email: usuario.email,
            status: 'erro_api',
            chaveValida: false,
            saldos: [],
            erro: `${saldoResponse.retCode}: ${saldoResponse.retMsg}`
          });
        }
        
      } catch (error) {
        console.log(`   ❌ Erro na conexão: ${error.message}`);
        
        resultados.push({
          usuario: usuario.name,
          email: usuario.email,
          status: 'erro_conexao',
          chaveValida: false,
          saldos: [],
          erro: error.message
        });
      }
      
      console.log('   ' + '-'.repeat(50));
      console.log('');
    }
    
    // 3. Resumo final
    console.log('=' .repeat(70));
    console.log('📊 RESUMO FINAL DOS SALDOS BYBIT');
    console.log('=' .repeat(70));
    
    resultados.forEach((resultado, index) => {
      console.log(`\n${index + 1}. ${resultado.usuario}`);
      console.log(`   📧 ${resultado.email}`);
      
      if (resultado.status === 'sucesso') {
        console.log('   ✅ Status: Chaves válidas, conexão bem-sucedida');
        
        if (resultado.saldos.length > 0) {
          console.log('   💰 Saldos:');
          resultado.saldos.forEach(saldo => {
            console.log(`      💎 ${saldo.coin}: ${saldo.total} (Disponível: ${saldo.disponivel})`);
          });
        } else {
          console.log('   💸 Saldos: Conta zerada (sem criptomoedas)');
        }
        
      } else if (resultado.status === 'sem_wallet') {
        console.log('   ⚠️ Status: Chaves válidas, mas nenhum wallet configurado');
        
      } else {
        console.log(`   ❌ Status: ${resultado.erro}`);
        console.log('   🔧 Ação: Verificar chaves API no painel Bybit');
      }
    });
    
    // 4. Estatísticas gerais
    const sucessos = resultados.filter(r => r.status === 'sucesso').length;
    const comSaldo = resultados.filter(r => r.saldos.length > 0).length;
    const chavesValidas = resultados.filter(r => r.chaveValida).length;
    
    console.log('\n📈 ESTATÍSTICAS:');
    console.log(`   👑 Usuárias VIP verificadas: ${resultados.length}`);
    console.log(`   🔑 Chaves API válidas: ${chavesValidas}/${resultados.length}`);
    console.log(`   ✅ Conexões bem-sucedidas: ${sucessos}/${resultados.length}`);
    console.log(`   💰 Contas com saldo: ${comSaldo}/${resultados.length}`);
    
    // 5. Recomendações
    console.log('\n🎯 RECOMENDAÇÕES:');
    if (chavesValidas === resultados.length) {
      console.log('   ✅ Todas as chaves API estão funcionando corretamente');
    } else {
      console.log('   ⚠️ Algumas chaves precisam ser verificadas no painel Bybit');
    }
    
    if (comSaldo === 0) {
      console.log('   💸 Todas as contas estão zeradas - prontas para receber depósitos');
    } else {
      console.log(`   💰 ${comSaldo} conta(s) já possuem saldo para trading`);
    }
    
    console.log('\n🚀 Sistema pronto para operações reais com as chaves validadas!');
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
    console.log('\n🔌 Conexão com banco fechada');
  }
}

// Executar verificação
verificarSaldosBybit().catch(console.error);
