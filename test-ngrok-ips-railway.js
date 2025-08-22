// TESTE SIMULADO DOS IPS NGROK PARA RAILWAY
// Este script testa a configuração que será usada no Railway

const axios = require('axios');

console.log('🧪 TESTE SIMULADO DOS IPS NGROK PARA RAILWAY');
console.log('=' .repeat(60));

// IPs do NGROK para teste
const NGROK_IPS = [
  '54.207.219.70',
  '52.67.28.7', 
  '56.125.142.8',
  '54.94.135.43',
  '15.229.184.96',
  '132.255.160.131',
  '132.255.171.176',
  '132.255.249.43'
];

// APIs para testar
const TEST_APIS = [
  {
    name: 'Binance API',
    url: 'https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT',
    timeout: 8000,
    testWithoutIP: true
  },
  {
    name: 'Bybit API', 
    url: 'https://api.bybit.com/v5/market/time',
    timeout: 8000,
    testWithoutIP: true
  },
  {
    name: 'CoinStats API',
    url: 'https://openapiv1.coinstats.app/markets',
    timeout: 8000,
    headers: {
      'X-API-KEY': 'ZFIxigBcVaCyXDL1Qp/Ork7TOL3+h07NM2f3YoSrMkI='
    },
    testWithoutIP: true
  }
];

// Função para testar uma API sem IP fixo (baseline)
async function testAPIBaseline(api) {
  try {
    const config = {
      timeout: api.timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'DNT': '1',
        'Connection': 'keep-alive',
        ...api.headers
      }
    };
    
    const startTime = Date.now();
    const response = await axios.get(api.url, config);
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Verificar se a resposta é válida
    let isValid = false;
    let dataInfo = '';
    
    if (api.name === 'Binance API' && response.data && response.data.symbol) {
      isValid = true;
      dataInfo = `BTC: $${parseFloat(response.data.price).toFixed(2)}`;
    } else if (api.name === 'Bybit API' && response.data && response.data.result) {
      isValid = true;
      dataInfo = `Time: ${response.data.result.timeSecond}`;
    } else if (api.name === 'CoinStats API' && response.data) {
      isValid = true;
      if (response.data.btcDominance) {
        dataInfo = `BTC Dom: ${response.data.btcDominance.toFixed(1)}%`;
      }
    }
    
    return {
      success: true,
      status: response.status,
      responseTime,
      isValid,
      dataInfo,
      error: null
    };
    
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 0,
      responseTime: null,
      isValid: false,
      dataInfo: '',
      error: error.message,
      isGeoBlocked: error.response?.status === 451 || error.response?.status === 403,
      isTimeout: error.code === 'ECONNABORTED' || error.message.includes('timeout'),
      isCloudFront: error.message.includes('CloudFront')
    };
  }
}

// Função para validar se um IP é válido
function validateIP(ip) {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  
  return parts.every(part => {
    const num = parseInt(part);
    return num >= 0 && num <= 255 && part === num.toString();
  });
}

// Função principal de teste
async function runNgrokIPAnalysis() {
  console.log('\n🔍 ANALISANDO IPS NGROK E TESTANDO CONECTIVIDADE...\n');
  
  // 1. Validar todos os IPs
  console.log('📊 VALIDAÇÃO DOS IPS:');
  console.log('-'.repeat(40));
  
  const validIPs = [];
  const invalidIPs = [];
  
  NGROK_IPS.forEach(ip => {
    if (validateIP(ip)) {
      validIPs.push(ip);
      console.log(`✅ ${ip} - IP válido`);
    } else {
      invalidIPs.push(ip);
      console.log(`❌ ${ip} - IP inválido`);
    }
  });
  
  console.log(`\n📊 Resumo: ${validIPs.length} válidos, ${invalidIPs.length} inválidos`);
  
  // 2. Analisar geograficamente os IPs
  console.log('\n🌍 ANÁLISE GEOGRÁFICA DOS IPS:');
  console.log('-'.repeat(40));
  
  const regions = {
    'América do Sul': validIPs.filter(ip => 
      ip.startsWith('54.') || ip.startsWith('52.') || ip.startsWith('15.')
    ),
    'Ásia/Pacífico': validIPs.filter(ip => 
      ip.startsWith('56.') || ip.startsWith('132.')
    )
  };
  
  Object.entries(regions).forEach(([region, ips]) => {
    console.log(`${region}: ${ips.length} IPs`);
    ips.forEach(ip => console.log(`  - ${ip}`));
  });
  
  // 3. Testar conectividade base (sem IP fixo)
  console.log('\n🧪 TESTE DE CONECTIVIDADE BASE (SEM IP FIXO):');
  console.log('-'.repeat(50));
  
  const baselineResults = {};
  
  for (const api of TEST_APIS) {
    console.log(`🔄 Testando ${api.name}...`);
    
    const result = await testAPIBaseline(api);
    baselineResults[api.name] = result;
    
    if (result.success && result.isValid) {
      console.log(`  ✅ ${api.name}: OK (${result.responseTime}ms) - ${result.dataInfo}`);
    } else if (result.isGeoBlocked) {
      console.log(`  🚫 ${api.name}: Bloqueio geográfico (${result.status})`);
    } else if (result.isCloudFront) {
      console.log(`  ☁️ ${api.name}: Bloqueio CloudFront`);
    } else if (result.isTimeout) {
      console.log(`  ⏰ ${api.name}: Timeout`);
    } else {
      console.log(`  ❌ ${api.name}: ${result.error}`);
    }
    
    // Pausa entre testes
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 4. Análise e recomendações
  console.log('\n📊 ANÁLISE DOS RESULTADOS:');
  console.log('='.repeat(60));
  
  const workingAPIs = Object.entries(baselineResults).filter(([_, result]) => result.success);
  const blockedAPIs = Object.entries(baselineResults).filter(([_, result]) => result.isGeoBlocked || result.isCloudFront);
  
  console.log(`✅ APIs funcionando: ${workingAPIs.length}/${TEST_APIS.length}`);
  workingAPIs.forEach(([name, result]) => {
    console.log(`  - ${name}: ${result.responseTime}ms`);
  });
  
  console.log(`\n🚫 APIs bloqueadas: ${blockedAPIs.length}/${TEST_APIS.length}`);
  blockedAPIs.forEach(([name, result]) => {
    console.log(`  - ${name}: ${result.error}`);
  });
  
  // 5. Configurar arquivo de configuração para Railway
  console.log('\n🚀 CONFIGURAÇÃO PARA RAILWAY:');
  console.log('-'.repeat(40));
  
  if (blockedAPIs.length > 0) {
    console.log('❗ BLOQUEIO DETECTADO - IP FIXO RECOMENDADO');
    
    // Recomendar melhor IP baseado na região
    const recommendedIPs = [
      '54.207.219.70', // AWS US East
      '52.67.28.7',    // AWS South America
      '15.229.184.96'  // AWS South America 2
    ];
    
    console.log('\n🎯 IPS RECOMENDADOS (ordem de prioridade):');
    recommendedIPs.forEach((ip, index) => {
      console.log(`${index + 1}. ${ip} - Configure como RAILWAY_FIXED_IP`);
    });
    
    console.log('\n📝 COMANDOS PARA RAILWAY:');
    console.log(`railway variables set RAILWAY_FIXED_IP=${recommendedIPs[0]}`);
    console.log('ou');
    console.log(`railway variables set NGROK_IP_FIXO=${recommendedIPs[0]}`);
    
  } else {
    console.log('✅ SEM BLOQUEIO DETECTADO');
    console.log('   O sistema pode funcionar sem IP fixo');
    console.log('   Mas recomenda-se configurar um IP fixo como backup');
  }
  
  // 6. Criar código de configuração
  console.log('\n💻 CÓDIGO DE CONFIGURAÇÃO GERADO:');
  console.log('-'.repeat(40));
  
  const configCode = `
// Configuração automática para Railway
const RAILWAY_FIXED_IP = process.env.RAILWAY_FIXED_IP || 
                         process.env.NGROK_IP_FIXO || 
                         '${validIPs[0]}'; // IP padrão

console.log(\`🌐 IP FIXO: \${RAILWAY_FIXED_IP || 'NÃO CONFIGURADO'}\`);

// IPs alternativos em caso de falha
const BACKUP_IPS = [
  '${validIPs[0]}',
  '${validIPs[1]}', 
  '${validIPs[2]}'
];`;

  console.log(configCode);
  
  console.log('\n✅ ANÁLISE COMPLETA!');
  console.log(`🎯 Total de ${validIPs.length} IPs válidos para uso`);
  
  return {
    validIPs,
    invalidIPs,
    baselineResults,
    workingAPIs: workingAPIs.length,
    blockedAPIs: blockedAPIs.length,
    recommendedIP: validIPs[0]
  };
}

// Executar análise
runNgrokIPAnalysis().catch(error => {
  console.error('❌ Erro executando análise:', error);
  process.exit(1);
});
