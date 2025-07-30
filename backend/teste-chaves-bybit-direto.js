// 📁 CÓDIGO PRINCIPAL - TESTE DIRETO BYBIT API
// Baseado no teste bem-sucedido do usuário

const axios = require('axios');
const crypto = require('crypto');

// CHAVES API REAIS DAS USUÁRIAS (obtidas do banco)
const CHAVES_USUARIAS = {
  'Luiza Maria de Almeida Pinto': {
    API_KEY: 'JuCpekqnmMsL4QqbKG',
    API_SECRET: 'gRqMLJnfRLMnE3Hh0QkxHKDxE1DQWjPKF4Py'
  },
  'Érica dos Santos': {
    API_KEY: 'rg1HWyxETWwbzJGew',
    API_SECRET: 'g0Gr9hokGvFDE0CSFyndZr0EBXryA1nmRd'
  },
  'PALOMA AMARAL': {
    API_KEY: 'DxFAJPo5KQQIg5Enq',
    API_SECRET: '6OGy9hokGvF3EBOCSPynczOEBXnyA1nmR4'
  }
};

// Função para testar uma chave específica
async function testarChaveBybit(nomeUsuario, API_KEY, API_SECRET) {
  try {
    console.log(`\n🔍 TESTANDO: ${nomeUsuario}`);
    console.log('='.repeat(60));
    console.log(`🔑 API Key: ${API_KEY}`);
    console.log(`🔐 Secret: ${API_SECRET.substring(0, 8)}...${API_SECRET.substring(-4)}`);
    
    // Parâmetros obrigatórios da Bybit v5
    const timestamp = Date.now().toString();
    const recvWindow = '5000';
    const query = 'accountType=UNIFIED';
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

    console.log(`📊 Timestamp: ${timestamp}`);
    console.log(`🔐 Signature: ${signature.substring(0, 16)}...`);
    console.log(`📋 Query: ${query}`);

    // Fazer a chamada para obter saldo da conta
    const response = await axios.get(
      'https://api.bybit.com/v5/account/wallet-balance?accountType=UNIFIED', 
      { headers }
    );
    
    if (response.data.retCode === 0) {
      console.log('✅ CONEXÃO SUCESSO! Dados da conta:');
      
      if (response.data.result && response.data.result.list && response.data.result.list.length > 0) {
        const account = response.data.result.list[0];
        
        console.log(`💰 Tipo de conta: ${account.accountType}`);
        console.log(`💎 Total equity: ${account.totalEquity} USD`);
        console.log(`🏦 Total wallet balance: ${account.totalWalletBalance} USD`);
        console.log(`💵 Total available balance: ${account.totalAvailableBalance} USD`);
        console.log(`📊 Total margin balance: ${account.totalMarginBalance} USD`);
        console.log(`🔒 Total initial margin: ${account.totalInitialMargin} USD`);
        console.log(`⚠️ Total maintenance margin: ${account.totalMaintenanceMargin} USD`);
        
        console.log('\n💰 DETALHES POR MOEDA:');
        console.log('-'.repeat(50));
        
        if (account.coin && account.coin.length > 0) {
          let temSaldo = false;
          
          account.coin.forEach(coin => {
            const walletBalance = parseFloat(coin.walletBalance || 0);
            const availableBalance = parseFloat(coin.availableToWithdraw || 0);
            const locked = parseFloat(coin.locked || 0);
            const equity = parseFloat(coin.equity || 0);
            
            if (walletBalance > 0 || availableBalance > 0 || locked > 0 || equity > 0) {
              temSaldo = true;
              console.log(`💎 ${coin.coin}:`);
              console.log(`   💳 Saldo carteira: ${walletBalance}`);
              console.log(`   💵 Disponível para saque: ${availableBalance}`);
              console.log(`   📊 Em ordens/bloqueado: ${locked}`);
              console.log(`   📈 Equity: ${equity}`);
              console.log('');
            }
          });
          
          if (!temSaldo) {
            console.log('💸 Conta sem saldos (zerada - pronta para depósitos)');
          }
        } else {
          console.log('📋 Nenhuma moeda configurada na conta');
        }
        
        return {
          success: true,
          usuario: nomeUsuario,
          account: account,
          status: 'Chave válida e funcionando'
        };
        
      } else {
        console.log('⚠️ Resposta válida, mas sem dados de conta');
        return {
          success: true,
          usuario: nomeUsuario,
          status: 'Chave válida, mas conta sem dados'
        };
      }
      
    } else {
      console.log(`❌ ERRO DA API: ${response.data.retMsg}`);
      console.log(`📋 Código de erro: ${response.data.retCode}`);
      
      return {
        success: false,
        usuario: nomeUsuario,
        erro: `${response.data.retCode}: ${response.data.retMsg}`,
        status: 'Chave inválida ou erro de API'
      };
    }
    
  } catch (error) {
    console.log(`❌ ERRO NA REQUISIÇÃO: ${error.message}`);
    
    if (error.response) {
      console.log(`📊 Status HTTP: ${error.response.status}`);
      console.log(`📋 Dados do erro:`, error.response.data);
    }
    
    return {
      success: false,
      usuario: nomeUsuario,
      erro: error.message,
      status: 'Erro de conexão ou chave inválida'
    };
  }
}

// Função principal para testar todas as usuárias
async function testarTodasAsChaves() {
  console.log('🚀 INICIANDO TESTE COMPLETO DAS CHAVES BYBIT');
  console.log('=' .repeat(80));
  console.log(`📅 Data/Hora: ${new Date().toLocaleString()}`);
  console.log(`🌐 Endpoint: https://api.bybit.com/v5/account/wallet-balance`);
  console.log(`👑 Usuárias VIP: ${Object.keys(CHAVES_USUARIAS).length}`);
  
  const resultados = [];
  
  // Testar cada usuária sequencialmente
  for (const [nomeUsuario, chaves] of Object.entries(CHAVES_USUARIAS)) {
    const resultado = await testarChaveBybit(nomeUsuario, chaves.API_KEY, chaves.API_SECRET);
    resultados.push(resultado);
    
    // Pausa entre testes para evitar rate limit
    console.log('\n⏱️ Aguardando 2 segundos antes do próximo teste...');
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Resumo final
  console.log('\n' + '=' .repeat(80));
  console.log('📊 RESUMO FINAL DOS TESTES');
  console.log('=' .repeat(80));
  
  const sucessos = resultados.filter(r => r.success).length;
  const falhas = resultados.filter(r => !r.success).length;
  
  console.log(`\n📈 ESTATÍSTICAS:`);
  console.log(`   👑 Total de usuárias testadas: ${resultados.length}`);
  console.log(`   ✅ Chaves válidas e funcionando: ${sucessos}`);
  console.log(`   ❌ Chaves com problemas: ${falhas}`);
  console.log(`   📊 Taxa de sucesso: ${((sucessos/resultados.length)*100).toFixed(1)}%`);
  
  console.log(`\n📋 DETALHES POR USUÁRIA:`);
  resultados.forEach((resultado, index) => {
    console.log(`\n${index + 1}. ${resultado.usuario}`);
    if (resultado.success) {
      console.log(`   ✅ Status: ${resultado.status}`);
      if (resultado.account) {
        console.log(`   💰 Equity total: ${resultado.account.totalEquity} USD`);
        console.log(`   💵 Saldo disponível: ${resultado.account.totalAvailableBalance} USD`);
      }
    } else {
      console.log(`   ❌ Status: ${resultado.status}`);
      console.log(`   🔧 Erro: ${resultado.erro}`);
    }
  });
  
  console.log(`\n🎯 PRÓXIMOS PASSOS:`);
  if (sucessos > 0) {
    console.log(`   ✅ ${sucessos} chave(s) válida(s) - pronta(s) para trading`);
    console.log(`   🔄 Integrar chaves válidas no sistema de trading`);
    console.log(`   📊 Configurar monitoramento de saldos`);
  }
  
  if (falhas > 0) {
    console.log(`   ⚠️ ${falhas} chave(s) com problema - verificar no painel Bybit`);
    console.log(`   🔧 Gerar novas chaves se necessário`);
    console.log(`   📋 Atualizar banco de dados com chaves corretas`);
  }
  
  console.log(`\n✅ TESTE COMPLETO FINALIZADO!`);
  
  return resultados;
}

// Executar se for chamado diretamente
if (require.main === module) {
  testarTodasAsChaves()
    .then(resultados => {
      console.log(`\n🎉 Processo finalizado com ${resultados.length} usuárias testadas!`);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Erro durante execução:', error.message);
      process.exit(1);
    });
}

module.exports = { testarTodasAsChaves, testarChaveBybit, CHAVES_USUARIAS };
