// TESTE DOS IPS FIXOS NGROK PARA MARKETBOT
// IPs fornecidos: 54.207.219.70,52.67.28.7,56.125.142.8,54.94.135.43,15.229.184.96,132.255.160.131,132.255.171.176,132.255.249.43

const axios = require('axios');
const https = require('https');
const http = require('http');

console.log('🧪 TESTE DE IPS FIXOS NGROK PARA MARKETBOT');
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
    timeout: 8000
  },
  {
    name: 'Bybit API',
    url: 'https://api.bybit.com/v5/market/time',
    timeout: 8000
  },
  {
    name: 'CoinStats API',
    url: 'https://openapiv1.coinstats.app/markets',
    timeout: 8000,
    headers: {
      'X-API-KEY': 'ZFIxigBcVaCyXDL1Qp/Ork7TOL3+h07NM2f3YoSrMkI='
    }
  }
];

// Função para criar agente com IP específico
function createAgentWithIP(ip, isHttps = true) {
  const AgentClass = isHttps ? https.Agent : http.Agent;
  
  return new AgentClass({
    localAddress: ip,
    keepAlive: true,
    keepAliveMsecs: 30000,
    maxSockets: 10,
    timeout: 10000,
    freeSocketTimeout: 5000
  });
}

// Função para testar uma API com um IP específico
async function testAPIWithIP(api, ip) {
  try {
    const httpsAgent = createAgentWithIP(ip, true);
    const httpAgent = createAgentWithIP(ip, false);
    
    const config = {
      timeout: api.timeout,
      httpsAgent,
      httpAgent,
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
    if (api.name === 'Binance API' && response.data && response.data.symbol) {
      isValid = true;
    } else if (api.name === 'Bybit API' && response.data && response.data.result) {
      isValid = true;
    } else if (api.name === 'CoinStats API' && response.data) {
      isValid = true;
    }
    
    return {
      success: true,
      status: response.status,
      responseTime,
      isValid,
      error: null
    };
    
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 0,
      responseTime: null,
      isValid: false,
      error: error.message,
      isGeoBlocked: error.response?.status === 451 || error.response?.status === 403,
      isTimeout: error.code === 'ECONNABORTED' || error.message.includes('timeout')
    };
  }
}

// Função para testar um IP com todas as APIs
async function testIPWithAllAPIs(ip) {
  console.log(`\n🌐 TESTANDO IP: ${ip}`);
  console.log('-'.repeat(40));
  
  const results = {};
  
  for (const api of TEST_APIS) {
    console.log(`  🔄 Testando ${api.name}...`);
    
    const result = await testAPIWithIP(api, ip);
    results[api.name] = result;
    
    if (result.success && result.isValid) {
      console.log(`  ✅ ${api.name}: OK (${result.responseTime}ms)`);
    } else if (result.isGeoBlocked) {
      console.log(`  🚫 ${api.name}: Bloqueio geográfico (${result.status})`);
    } else if (result.isTimeout) {
      console.log(`  ⏰ ${api.name}: Timeout`);
    } else {
      console.log(`  ❌ ${api.name}: ${result.error || 'Erro desconhecido'}`);
    }
  }
  
  // Calcular score do IP
  const successCount = Object.values(results).filter(r => r.success && r.isValid).length;
  const avgResponseTime = Object.values(results)
    .filter(r => r.responseTime)
    .reduce((acc, r, _, arr) => acc + r.responseTime / arr.length, 0);
  
  const score = (successCount / TEST_APIS.length) * 100;
  
  console.log(`  📊 Score: ${score.toFixed(1)}% (${successCount}/${TEST_APIS.length} sucesso)`);
  if (avgResponseTime > 0) {
    console.log(`  ⏱️ Tempo médio: ${avgResponseTime.toFixed(0)}ms`);
  }
  
  return {
    ip,
    results,
    score,
    avgResponseTime: avgResponseTime || null,
    successCount
  };
}

// Função principal de teste
async function runNgrokIPTest() {
  console.log(`\n🚀 INICIANDO TESTE COM ${NGROK_IPS.length} IPS NGROK...\n`);
  
  const allResults = [];
  
  // Testar cada IP
  for (const ip of NGROK_IPS) {
    const ipResult = await testIPWithAllAPIs(ip);
    allResults.push(ipResult);
    
    // Pequena pausa entre testes para não sobrecarregar
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Análise final dos resultados
  console.log('\n📊 ANÁLISE FINAL DOS RESULTADOS:');
  console.log('='.repeat(60));
  
  // Ordenar por score (melhor primeiro)
  allResults.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (a.avgResponseTime || 999999) - (b.avgResponseTime || 999999);
  });
  
  console.log('\n🏆 RANKING DOS IPS:');
  allResults.forEach((result, index) => {
    const rank = index + 1;
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
    
    console.log(`${medal} IP: ${result.ip}`);
    console.log(`    Score: ${result.score.toFixed(1)}% (${result.successCount}/${TEST_APIS.length})`);
    if (result.avgResponseTime) {
      console.log(`    Tempo: ${result.avgResponseTime.toFixed(0)}ms`);
    }
    
    // Mostrar detalhes dos sucessos/falhas
    const details = [];
    if (result.results['Binance API']?.success) details.push('✅ Binance');
    else details.push('❌ Binance');
    
    if (result.results['Bybit API']?.success) details.push('✅ Bybit');
    else details.push('❌ Bybit');
    
    if (result.results['CoinStats API']?.success) details.push('✅ CoinStats');
    else details.push('❌ CoinStats');
    
    console.log(`    APIs: ${details.join(' | ')}`);
    console.log('');
  });
  
  // Recomendação final
  const bestIP = allResults[0];
  const secondBestIP = allResults[1];
  
  console.log('🎯 RECOMENDAÇÕES:');
  
  if (bestIP.score >= 100) {
    console.log(`✅ MELHOR IP: ${bestIP.ip} (${bestIP.score}% sucesso)`);
    console.log('   Configure como: RAILWAY_FIXED_IP=' + bestIP.ip);
    console.log('   ou: NGROK_IP_FIXO=' + bestIP.ip);
  } else if (bestIP.score >= 66) {
    console.log(`⚠️ IP PARCIAL: ${bestIP.ip} (${bestIP.score}% sucesso)`);
    console.log('   Funciona para algumas APIs, mas não todas');
    console.log('   Configure como: RAILWAY_FIXED_IP=' + bestIP.ip);
  } else {
    console.log('❌ NENHUM IP TEVE SUCESSO COMPLETO');
    console.log('   Possíveis problemas:');
    console.log('   - Todos os IPs podem estar em regiões bloqueadas');
    console.log('   - Problemas de conectividade temporários');
    console.log('   - APIs podem estar rejeitando tráfego de VPN/Proxy');
  }
  
  if (secondBestIP && secondBestIP.score > 0) {
    console.log(`\n🔄 IP BACKUP: ${secondBestIP.ip} (${secondBestIP.score}% sucesso)`);
  }
  
  // Comando para aplicar no Railway
  if (bestIP.score > 0) {
    console.log('\n🚀 COMANDO PARA APLICAR NO RAILWAY:');
    console.log(`railway variables set RAILWAY_FIXED_IP=${bestIP.ip}`);
    console.log('ou');
    console.log(`railway variables set NGROK_IP_FIXO=${bestIP.ip}`);
  }
  
  console.log('\n✅ TESTE CONCLUÍDO!');
  
  return allResults;
}

// Executar teste
runNgrokIPTest().catch(error => {
  console.error('❌ Erro executando teste:', error);
  process.exit(1);
});
