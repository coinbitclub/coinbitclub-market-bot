const axios = require('axios');
const crypto = require('crypto');

// DADOS REAIS das usuárias VIP
const CHAVES_USUARIOS = [
  {
    nome: 'Luiza Maria',
    api_key: 'JuCpekqnmMsL4QqbKG',
    api_secret: 'gRqMLJnfRLMnE3Hh0QkxHKDxE1DQWjPKF4Py'
  },
  {
    nome: 'Érica dos Santos',
    api_key: 'rg1HWyxETWwbzJGew',
    api_secret: 'g0Gr9hokGvFDE0CSFyndZr0EBXryA1nmRd'
  },
  {
    nome: 'Paloma Amaral',
    api_key: 'DxFAJPo5KQQIg5Enq',
    api_secret: '6OGy9hokGvF3EBOCSPynczOEBXnyA1nmR4'
  }
];

async function testarChavesDiretamente() {
  console.log('🔍 TESTANDO CHAVES DIRETAMENTE COM O CÓDIGO FORNECIDO');
  console.log('=' .repeat(70));
  
  for (let i = 0; i < CHAVES_USUARIOS.length; i++) {
    const usuario = CHAVES_USUARIOS[i];
    
    console.log(`\n[${i + 1}/3] 👤 TESTANDO: ${usuario.nome}`);
    console.log(`🔑 API Key: ${usuario.api_key}`);
    console.log(`🔐 Secret: ${usuario.api_secret.substring(0, 8)}...`);
    
    try {
      // Usando exatamente o código que você forneceu
      const API_KEY = usuario.api_key;
      const API_SECRET = usuario.api_secret;
      
      // Parâmetros obrigatórios da Bybit v5
      const timestamp = Date.now().toString();
      const recvWindow = '5000';
      
      const query = '';
      const signPayload = timestamp + API_KEY + recvWindow + query;
      
      // Gerar assinatura
      const signature = crypto
        .createHmac('sha256', API_SECRET)
        .update(signPayload)
        .digest('hex');
      
      // Cabeçalhos exigidos pela Bybit
      const headers = {
        'Content-Type': 'application/json',
        'X-BAPI-API-KEY': API_KEY,
        'X-BAPI-SIGN': signature,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-RECV-WINDOW': recvWindow,
        'X-BAPI-SIGN-TYPE': '2'
      };
      
      console.log('   📊 Fazendo requisição para /v5/account/info...');
      
      // Fazer a chamada
      const response = await axios.get('https://api.bybit.com/v5/account/info', { headers });
      
      console.log('   ✅ Conexão OK!');
      console.log('   📋 Resposta:', JSON.stringify(response.data, null, 2));
      
      // Se chegou até aqui, a chave funciona - testar saldo também
      console.log('\n   💰 Testando consulta de saldo...');
      
      const queryBalance = 'accountType=UNIFIED';
      const signPayloadBalance = timestamp + API_KEY + recvWindow + queryBalance;
      const signatureBalance = crypto
        .createHmac('sha256', API_SECRET)
        .update(signPayloadBalance)
        .digest('hex');
      
      const headersBalance = {
        'Content-Type': 'application/json',
        'X-BAPI-API-KEY': API_KEY,
        'X-BAPI-SIGN': signatureBalance,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-RECV-WINDOW': recvWindow,
        'X-BAPI-SIGN-TYPE': '2'
      };
      
      const balanceResponse = await axios.get(
        `https://api.bybit.com/v5/account/wallet-balance?${queryBalance}`, 
        { headers: headersBalance }
      );
      
      console.log('   💰 Saldo OK!');
      console.log('   📊 Saldos:', JSON.stringify(balanceResponse.data, null, 2));
      
    } catch (error) {
      console.log('   ❌ Erro na requisição:');
      if (error.response) {
        console.log(`   📊 Status: ${error.response.status}`);
        console.log(`   📋 Dados:`, error.response.data);
      } else {
        console.log(`   📋 Erro: ${error.message}`);
      }
    }
    
    // Pausa entre testes para evitar rate limit
    if (i < CHAVES_USUARIOS.length - 1) {
      console.log('   ⏱️ Aguardando 2s...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n' + '=' .repeat(70));
  console.log('✅ TESTE DIRETO DAS CHAVES CONCLUÍDO');
  console.log('=' .repeat(70));
}

// Executar teste
testarChavesDiretamente().catch(console.error);
