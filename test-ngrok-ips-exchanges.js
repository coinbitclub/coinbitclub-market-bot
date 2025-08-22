// TESTE COMPLETO DOS IPs NGROK PARA EXCHANGES
// Testa todos os IPs NGROK fornecidos para verificar conectividade com Binance e Bybit

const axios = require('axios');
const https = require('https');
const http = require('http');

console.log('🧪 TESTE COMPLETO DOS IPs NGROK PARA EXCHANGES');
console.log('=' * 60);

// IPs NGROK fornecidos pelo usuário
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

// Endpoints para teste
const TEST_ENDPOINTS = {
  binance: [
    'https://api.binance.com/api/v3/exchangeInfo',
    'https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT'
  ],
  bybit: [
    'https://api.bybit.com/v5/market/time',
    'https://api.bybit.com/v5/market/tickers?category=spot&symbol=BTCUSDT'
  ],
  coinstats: [
    'https://openapiv1.coinstats.app/markets'
  ]
};

// Função para criar agente com IP específico
function createAgentWithIP(ip, isHttps = true) {
  const AgentClass = isHttps ? https.Agent : http.Agent;
  
  return new AgentClass({
    localAddress: ip,
    keepAlive: true,
    timeout: 15000,
    maxSockets: 10
  });
}

// Função para testar um IP específico
async function testIPWithExchange(ip, exchange, endpoint) {
  try {
    const httpsAgent = createAgentWithIP(ip, true);
    const httpAgent = createAgentWithIP(ip, false);
    
    const config = {
      timeout: 10000,
      httpsAgent,
      httpAgent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    };

    // Adicionar API key para CoinStats se necessário
    if (endpoint.includes('coinstats.app')) {
      config.headers['X-API-KEY'] = 'ZFIxigBcVaCyXDL1Qp/Ork7TOL3+h07NM2f3YoSrMkI=';
    }

    const startTime = Date.now();
    const response = await axios.get(endpoint, config);
    const responseTime = Date.now() - startTime;
    
    return {
      success: true,
      ip,
      exchange,
      endpoint,
      status: response.status,
      responseTime,
      dataSize: JSON.stringify(response.data).length
    };
    
  } catch (error) {
    return {
      success: false,
      ip,
      exchange,
      endpoint,
      error: error.response?.status || error.code || error.message,
      message: error.message
    };
  }
}

// Função principal de teste
async function runCompleteTest() {
  console.log(`\n🔍 Iniciando teste com ${NGROK_IPS.length} IPs NGROK...\n`);
  
  const results = [];
  const summary = {
    total_tests: 0,
    successful: 0,
    failed: 0,
    by_ip: {},
    by_exchange: {},
    fastest_responses: [],
    recommended_ips: []
  };

  // Testar cada IP com cada exchange
  for (const ip of NGROK_IPS) {
    console.log(`🌐 Testando IP: ${ip}`);
    summary.by_ip[ip] = { total: 0, success: 0, failed: 0, avg_response_time: 0 };
    
    for (const [exchange, endpoints] of Object.entries(TEST_ENDPOINTS)) {
      if (!summary.by_exchange[exchange]) {
        summary.by_exchange[exchange] = { total: 0, success: 0, failed: 0 };
      }
      
      for (const endpoint of endpoints) {
        summary.total_tests++;
        summary.by_ip[ip].total++;
        summary.by_exchange[exchange].total++;
        
        console.log(`  📊 ${exchange.toUpperCase()}: ${endpoint.split('/').pop()}`);
        
        const result = await testIPWithExchange(ip, exchange, endpoint);
        results.push(result);
        
        if (result.success) {
          console.log(`    ✅ ${result.responseTime}ms - Status ${result.status}`);
          summary.successful++;
          summary.by_ip[ip].success++;
          summary.by_exchange[exchange].success++;
          summary.by_ip[ip].avg_response_time += result.responseTime;
          
          // Coletar respostas rápidas
          if (result.responseTime < 2000) {
            summary.fastest_responses.push(result);
          }
        } else {
          console.log(`    ❌ ${result.error} - ${result.message?.substring(0, 50) || 'N/A'}`);
          summary.failed++;
          summary.by_ip[ip].failed++;
          summary.by_exchange[exchange].failed++;
        }
        
        // Aguardar um pouco entre requests
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    // Calcular média de tempo de resposta
    if (summary.by_ip[ip].success > 0) {
      summary.by_ip[ip].avg_response_time = Math.round(
        summary.by_ip[ip].avg_response_time / summary.by_ip[ip].success
      );
    }
    
    console.log(`  📊 Resultado: ${summary.by_ip[ip].success}/${summary.by_ip[ip].total} sucessos\n`);
  }

  // Identificar melhores IPs
  const ipPerformance = Object.entries(summary.by_ip)
    .map(([ip, stats]) => ({
      ip,
      success_rate: stats.total > 0 ? (stats.success / stats.total * 100) : 0,
      avg_response_time: stats.avg_response_time,
      total_success: stats.success
    }))
    .sort((a, b) => {
      // Ordenar por taxa de sucesso, depois por tempo de resposta
      if (b.success_rate !== a.success_rate) return b.success_rate - a.success_rate;
      return a.avg_response_time - b.avg_response_time;
    });

  summary.recommended_ips = ipPerformance.slice(0, 3);

  // Exibir resultados
  console.log('\n📊 RELATÓRIO COMPLETO:');
  console.log('=' * 50);
  
  console.log(`\n📈 ESTATÍSTICAS GERAIS:`);
  console.log(`   Total de testes: ${summary.total_tests}`);
  console.log(`   Sucessos: ${summary.successful} (${(summary.successful/summary.total_tests*100).toFixed(1)}%)`);
  console.log(`   Falhas: ${summary.failed} (${(summary.failed/summary.total_tests*100).toFixed(1)}%)`);

  console.log(`\n🏆 TOP 3 MELHORES IPs:`);
  summary.recommended_ips.forEach((ip, index) => {
    console.log(`   ${index + 1}. ${ip.ip}`);
    console.log(`      Taxa de sucesso: ${ip.success_rate.toFixed(1)}%`);
    console.log(`      Tempo médio: ${ip.avg_response_time}ms`);
    console.log(`      Total sucessos: ${ip.total_success}`);
  });

  console.log(`\n📊 PERFORMANCE POR EXCHANGE:`);
  Object.entries(summary.by_exchange).forEach(([exchange, stats]) => {
    const rate = stats.total > 0 ? (stats.success / stats.total * 100) : 0;
    console.log(`   ${exchange.toUpperCase()}: ${stats.success}/${stats.total} (${rate.toFixed(1)}%)`);
  });

  console.log(`\n⚡ RESPOSTAS MAIS RÁPIDAS (< 2s):`);
  summary.fastest_responses
    .sort((a, b) => a.responseTime - b.responseTime)
    .slice(0, 5)
    .forEach(result => {
      console.log(`   ${result.ip} → ${result.exchange}: ${result.responseTime}ms`);
    });

  console.log(`\n🎯 RECOMENDAÇÃO PARA PRODUÇÃO:`);
  if (summary.recommended_ips.length > 0) {
    const best = summary.recommended_ips[0];
    console.log(`   IP Principal: ${best.ip} (${best.success_rate.toFixed(1)}% sucesso)`);
    console.log(`   IP Backup: ${summary.recommended_ips[1]?.ip || 'N/A'}`);
    console.log(`   IP Terciário: ${summary.recommended_ips[2]?.ip || 'N/A'}`);
  } else {
    console.log(`   ⚠️ Nenhum IP teve performance satisfatória`);
  }

  console.log(`\n🔧 CONFIGURAÇÃO PARA CÓDIGO:`);
  console.log(`   process.env.NGROK_IP_FIXO = "${summary.recommended_ips[0]?.ip || NGROK_IPS[0]}"`);

  return summary;
}

// Executar teste
runCompleteTest()
  .then(summary => {
    console.log('\n✅ Teste completo finalizado!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Erro durante o teste:', error.message);
    process.exit(1);
  });
