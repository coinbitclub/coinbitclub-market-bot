const axios = require('axios');
const crypto = require('crypto');

// CHAVES EXATAS DA LUIZA (da imagem fornecida)
const API_KEY = '9HZy9BiUW95iXprVRl';
const API_SECRET = 'QUjDXNmSI0qiqaKTUk7FHAHZnjiEN8AaRKQO';

console.log('🔍 TESTANDO CHAVES EXATAS DA LUIZA (DA IMAGEM)');
console.log('=' .repeat(60));
console.log(`🔑 API Key: ${API_KEY}`);
console.log(`🔐 Secret: ${API_SECRET}`);
console.log('');

// Parâmetros obrigatórios da Bybit v5
const timestamp = Date.now().toString();
const recvWindow = '5000';

const query = 'accountType=UNIFIED';
const signPayload = timestamp + API_KEY + recvWindow + query;

console.log(`📊 Timestamp: ${timestamp}`);
console.log(`📋 Query: ${query}`);
console.log(`🔐 SignPayload: ${signPayload}`);

// Gerar assinatura
const signature = crypto
  .createHmac('sha256', API_SECRET)
  .update(signPayload)
  .digest('hex');

console.log(`✍️ Signature: ${signature}`);
console.log('');

// Cabeçalhos exigidos pela Bybit
const headers = {
  'Content-Type': 'application/json',
  'X-BAPI-API-KEY': API_KEY,
  'X-BAPI-SIGN': signature,
  'X-BAPI-TIMESTAMP': timestamp,
  'X-BAPI-RECV-WINDOW': recvWindow,
  'X-BAPI-SIGN-TYPE': '2'
};

console.log('📋 Headers enviados:');
console.log(JSON.stringify(headers, null, 2));
console.log('');

console.log('🌐 Fazendo requisição para Bybit...');
console.log('URL: https://api.bybit.com/v5/account/wallet-balance?accountType=UNIFIED');
console.log('');

// Fazer a chamada para obter saldo da conta
axios.get('https://api.bybit.com/v5/account/wallet-balance?accountType=UNIFIED', { headers })
  .then(res => {
    console.log('✅ CONEXÃO OK! Saldo da conta:');
    console.log('='.repeat(50));
    
    console.log('📊 Status da resposta:', res.status);
    console.log('📋 RetCode:', res.data.retCode);
    console.log('📝 RetMsg:', res.data.retMsg);
    console.log('');
    
    if (res.data.retCode === 0) {
      console.log('🎉 SUCESSO! Chaves são válidas!');
      
      if (res.data.result && res.data.result.list && res.data.result.list.length > 0) {
        const account = res.data.result.list[0];
        console.log(`💰 Tipo de conta: ${account.accountType}`);
        console.log(`💎 Total equity: ${account.totalEquity} USD`);
        console.log(`🏦 Total wallet balance: ${account.totalWalletBalance} USD`);
        console.log(`💵 Total available balance: ${account.totalAvailableBalance} USD`);
        console.log(`📊 Total margin balance: ${account.totalMarginBalance} USD`);
        console.log(`🔒 Total initial margin: ${account.totalInitialMargin} USD`);
        console.log(`⚠️ Total maintenance margin: ${account.totalMaintenanceMargin} USD`);
        
        console.log('\n💰 Detalhes por moeda:');
        console.log('-'.repeat(50));
        
        if (account.coin && account.coin.length > 0) {
          let temSaldo = false;
          account.coin.forEach(coin => {
            const walletBalance = parseFloat(coin.walletBalance || 0);
            const available = parseFloat(coin.availableToWithdraw || 0);
            const locked = parseFloat(coin.locked || 0);
            const equity = parseFloat(coin.equity || 0);
            
            if (walletBalance > 0 || available > 0 || locked > 0 || equity > 0) {
              temSaldo = true;
              console.log(`💎 ${coin.coin}:`);
              console.log(`  💳 Saldo carteira: ${walletBalance}`);
              console.log(`  💵 Saldo disponível: ${available}`);
              console.log(`  📊 Em ordens: ${locked}`);
              console.log(`  📈 Equity: ${equity}`);
              console.log('');
            }
          });
          
          if (!temSaldo) {
            console.log('💸 Conta sem saldos (zerada - pronta para depósitos)');
          }
        }
      } else {
        console.log('⚠️ Nenhum dado de conta encontrado');
      }
    } else {
      console.log('❌ ERRO DA API BYBIT:');
      console.log(`Código: ${res.data.retCode}`);
      console.log(`Mensagem: ${res.data.retMsg}`);
    }
    
    console.log('\n📋 Resposta completa da API:');
    console.log(JSON.stringify(res.data, null, 2));
  })
  .catch(err => {
    console.error('❌ ERRO NA REQUISIÇÃO:');
    console.error(`Tipo de erro: ${err.name}`);
    console.error(`Mensagem: ${err.message}`);
    
    if (err.response) {
      console.error(`Status HTTP: ${err.response.status}`);
      console.error(`Status Text: ${err.response.statusText}`);
      console.error('Headers de resposta:', err.response.headers);
      console.error('Dados de erro:', err.response.data);
    } else if (err.request) {
      console.error('Erro de rede - sem resposta do servidor');
      console.error('Request config:', err.config);
    } else {
      console.error('Erro na configuração da requisição');
    }
    
    console.log('\n🔍 ANÁLISE DO PROBLEMA:');
    if (err.response?.status === 401) {
      console.log('📋 Erro 401 = Não autorizado');
      console.log('🔧 Possíveis causas:');
      console.log('   1. API Key inválida');
      console.log('   2. Secret Key inválida');
      console.log('   3. Assinatura incorreta');
      console.log('   4. Timestamp fora da janela válida');
      console.log('   5. Headers mal formatados');
    }
  });
