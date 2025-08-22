// ========================================
// CONFIGURAÇÃO DE IP FIXO PARA RAILWAY - MARKETBOT
// ========================================

const axios = require('axios');
const https = require('https');
const http = require('http');

console.log('🌐 CONFIGURAÇÃO DE IP FIXO PARA RAILWAY');
console.log('======================================');

// ========================================
// 1. DETECTAR IP ATUAL DO RAILWAY
// ========================================

async function detectCurrentIP() {
  try {
    console.log('\n🔍 Detectando IP atual do Railway...');
    
    const ipServices = [
      'https://api.ipify.org?format=json',
      'https://httpbin.org/ip',
      'https://api.myip.com',
      'https://checkip.amazonaws.com',
      'https://icanhazip.com'
    ];
    
    for (const service of ipServices) {
      try {
        const response = await axios.get(service, { timeout: 5000 });
        
        let ip = null;
        if (service.includes('ipify')) {
          ip = response.data.ip;
        } else if (service.includes('httpbin')) {
          ip = response.data.origin;
        } else if (service.includes('myip')) {
          ip = response.data.ip;
        } else if (service.includes('amazonaws')) {
          ip = response.data.trim();
        } else if (service.includes('icanhazip')) {
          ip = response.data.trim();
        }
        
        if (ip) {
          console.log(`✅ IP detectado via ${service}: ${ip}`);
          return ip;
        }
      } catch (error) {
        console.log(`⚠️ Falha em ${service}: ${error.message}`);
      }
    }
    
    throw new Error('Não foi possível detectar o IP');
    
  } catch (error) {
    console.error('❌ Erro detectando IP:', error.message);
    return null;
  }
}

// ========================================
// 2. TESTAR CONECTIVIDADE COM EXCHANGES
// ========================================

async function testExchangeConnectivity(fixedIP = null) {
  console.log('\n🔗 Testando conectividade com exchanges...');
  
  // Configurar agentes com IP fixo se fornecido
  const httpsAgent = fixedIP ? new https.Agent({
    localAddress: fixedIP,
    keepAlive: true,
    timeout: 30000
  }) : undefined;
  
  const httpAgent = fixedIP ? new http.Agent({
    localAddress: fixedIP,
    keepAlive: true,
    timeout: 30000
  }) : undefined;
  
  const requestConfig = {
    timeout: 15000,
    httpsAgent,
    httpAgent,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9'
    }
  };
  
  const exchanges = [
    {
      name: 'Binance',
      url: 'https://api.binance.com/api/v3/exchangeInfo',
      testFunction: async () => {
        const response = await axios.get('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT', requestConfig);
        return response.status === 200;
      }
    },
    {
      name: 'Bybit',
      url: 'https://api.bybit.com/v5/market/time',
      testFunction: async () => {
        const response = await axios.get('https://api.bybit.com/v5/market/time', requestConfig);
        return response.status === 200 && response.data.result;
      }
    },
    {
      name: 'CoinGecko',
      url: 'https://api.coingecko.com/api/v3/ping',
      testFunction: async () => {
        const response = await axios.get('https://api.coingecko.com/api/v3/ping', requestConfig);
        return response.status === 200;
      }
    },
    {
      name: 'Alternative.me (Fear&Greed)',
      url: 'https://api.alternative.me/fng/',
      testFunction: async () => {
        const response = await axios.get('https://api.alternative.me/fng/', requestConfig);
        return response.status === 200 && response.data.data;
      }
    }
  ];
  
  const results = {};
  
  for (const exchange of exchanges) {
    try {
      console.log(`🔄 Testando ${exchange.name}...`);
      const startTime = Date.now();
      const success = await exchange.testFunction();
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      if (success) {
        console.log(`✅ ${exchange.name}: OK (${responseTime}ms)`);
        results[exchange.name] = { success: true, responseTime, error: null };
      } else {
        console.log(`❌ ${exchange.name}: Resposta inválida`);
        results[exchange.name] = { success: false, responseTime, error: 'Invalid response' };
      }
      
    } catch (error) {
      const responseTime = Date.now();
      console.log(`❌ ${exchange.name}: ${error.response?.status || error.message}`);
      
      if (error.response?.status === 451) {
        console.log(`🚫 BLOQUEIO GEOGRÁFICO detectado em ${exchange.name}`);
      } else if (error.response?.status === 403) {
        console.log(`🚫 ACESSO NEGADO detectado em ${exchange.name}`);
      }
      
      results[exchange.name] = { 
        success: false, 
        responseTime: 0, 
        error: error.response?.status || error.message,
        blocked: error.response?.status === 451 || error.response?.status === 403
      };
    }
  }
  
  return results;
}

// ========================================
// 3. CONFIGURAR VARIÁVEIS DE AMBIENTE
// ========================================

function generateEnvironmentConfig(detectedIP) {
  console.log('\n⚙️ Configuração de variáveis de ambiente para Railway:');
  console.log('====================================================');
  
  if (detectedIP) {
    console.log(`✅ IP fixo detectado: ${detectedIP}`);
    console.log('\n📋 Adicione estas variáveis no Railway Dashboard:');
    console.log(`RAILWAY_STATIC_IP=${detectedIP}`);
    console.log(`FIXED_IP=${detectedIP}`);
    console.log(`OUTBOUND_IP=${detectedIP}`);
  } else {
    console.log('❌ IP não detectado - configure manualmente');
  }
  
  console.log('\n🔧 Outras configurações recomendadas:');
  console.log('NODE_ENV=production');
  console.log('TZ=America/Sao_Paulo');
  console.log('DEBIAN_FRONTEND=noninteractive');
  
  console.log('\n📖 Instruções:');
  console.log('1. Acesse o Railway Dashboard');
  console.log('2. Vá em Settings > Environment');
  console.log('3. Adicione as variáveis acima');
  console.log('4. Redeploy o projeto');
}

// ========================================
// 4. FUNÇÃO PRINCIPAL DE TESTE
// ========================================

async function runFixedIPTest() {
  try {
    console.log('🚀 INICIANDO TESTE DE IP FIXO PARA MARKETBOT\n');
    
    // 1. Detectar IP atual
    const currentIP = await detectCurrentIP();
    
    // 2. Testar conectividade SEM IP fixo
    console.log('\n📊 TESTE 1: Conectividade SEM IP fixo');
    console.log('=====================================');
    const resultsWithoutFixedIP = await testExchangeConnectivity();
    
    // 3. Testar conectividade COM IP fixo (se detectado)
    let resultsWithFixedIP = null;
    if (currentIP) {
      console.log(`\n📊 TESTE 2: Conectividade COM IP fixo (${currentIP})`);
      console.log('===============================================');
      resultsWithFixedIP = await testExchangeConnectivity(currentIP);
    }
    
    // 4. Comparar resultados
    console.log('\n📈 COMPARAÇÃO DE RESULTADOS:');
    console.log('============================');
    
    Object.keys(resultsWithoutFixedIP).forEach(exchange => {
      const without = resultsWithoutFixedIP[exchange];
      const with_ = resultsWithFixedIP ? resultsWithFixedIP[exchange] : null;
      
      console.log(`\n${exchange}:`);
      console.log(`  Sem IP fixo: ${without.success ? '✅' : '❌'} ${without.error || ''}`);
      if (with_) {
        console.log(`  Com IP fixo: ${with_.success ? '✅' : '❌'} ${with_.error || ''}`);
        
        if (without.blocked && !with_.success) {
          console.log(`  🚫 Ainda bloqueado - IP ${currentIP} pode estar em região restrita`);
        } else if (without.blocked && with_.success) {
          console.log(`  ✅ IP fixo resolveu o bloqueio!`);
        } else if (!without.blocked && with_.success) {
          console.log(`  ✅ Funcionando normalmente com IP fixo`);
        }
      }
    });
    
    // 5. Gerar configuração
    generateEnvironmentConfig(currentIP);
    
    // 6. Relatório final
    console.log('\n🎯 RELATÓRIO FINAL:');
    console.log('==================');
    
    const blockedExchanges = Object.keys(resultsWithoutFixedIP).filter(
      exchange => resultsWithoutFixedIP[exchange].blocked
    );
    
    if (blockedExchanges.length > 0) {
      console.log(`❌ ${blockedExchanges.length} exchanges bloqueadas geograficamente:`);
      blockedExchanges.forEach(exchange => console.log(`   - ${exchange}`));
      
      if (currentIP) {
        console.log(`\n💡 RECOMENDAÇÃO: Configure IP fixo ${currentIP} no Railway`);
        console.log('   Isso pode resolver os bloqueios geográficos');
      } else {
        console.log('\n⚠️ ATENÇÃO: Não foi possível detectar IP - configure manualmente');
      }
    } else {
      console.log('✅ Todas as exchanges estão acessíveis');
      console.log('✅ Sistema funcionando normalmente');
    }
    
    return {
      currentIP,
      resultsWithoutFixedIP,
      resultsWithFixedIP,
      blockedExchanges
    };
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return null;
  }
}

// ========================================
// 5. EXECUTAR SE CHAMADO DIRETAMENTE
// ========================================

if (require.main === module) {
  runFixedIPTest()
    .then(results => {
      if (results) {
        console.log('\n✅ Teste concluído com sucesso!');
        console.log('📋 Resultados salvos na variável results');
      } else {
        console.log('\n❌ Teste falhou');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n❌ Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = {
  detectCurrentIP,
  testExchangeConnectivity,
  generateEnvironmentConfig,
  runFixedIPTest
};
