// TESTE LOCAL DO SERVIDOR COM WEBHOOKS
// ====================================

console.log('🏠 TESTANDO SERVIDOR LOCALMENTE');
console.log('===============================');

// Importar e iniciar o servidor
const app = require('./server.js');

// Aguardar um pouco para o servidor inicializar
setTimeout(async () => {
  console.log('🧪 Testando endpoints localmente...\n');
  
  const http = require('http');
  
  function makeLocalRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
      const requestOptions = {
        hostname: 'localhost',
        port: process.env.PORT || 8080,
        path: path,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      };

      const req = http.request(requestOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            data: data,
            success: res.statusCode >= 200 && res.statusCode < 300
          });
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      if (options.body) {
        req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
      }
      
      req.end();
    });
  }
  
  try {
    // Testar health
    console.log('🏥 Testando /health...');
    const healthResponse = await makeLocalRequest('/health');
    console.log(`Status: ${healthResponse.statusCode} | ${healthResponse.success ? 'OK' : 'ERRO'}`);
    
    // Testar endpoints de webhook
    console.log('\n📡 Testando endpoints de webhook...');
    
    const endpoints = [
      '/api/webhooks/signal',
      '/api/webhooks/dominance', 
      '/api/webhooks/signals/recent'
    ];
    
    for (const endpoint of endpoints) {
      console.log(`🔍 GET ${endpoint}`);
      
      try {
        const response = await makeLocalRequest(endpoint);
        console.log(`   Status: ${response.statusCode}`);
        
        if (response.statusCode === 401) {
          console.log('   ✅ Endpoint existe! (401 = precisa token)');
        } else if (response.statusCode === 405) {
          console.log('   ✅ Endpoint existe! (405 = método não permitido)');
        } else if (response.statusCode === 200) {
          console.log('   ✅ Endpoint funcionando!');
        } else {
          console.log(`   ⚠️ Status: ${response.statusCode}`);
        }
      } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
      }
    }
    
    // Testar POST com dados
    console.log('\n🎯 Testando POST com dados...');
    
    const testSignal = {
      ticker: "BTCUSDT",
      time: "2024-01-26 15:30:00",
      close: "42500.50",
      cruzou_acima_ema9: "1",
      cruzou_abaixo_ema9: "0"
    };
    
    try {
      const signalResponse = await makeLocalRequest('/api/webhooks/signal?token=210406', {
        method: 'POST',
        body: testSignal
      });
      
      console.log(`POST /api/webhooks/signal: ${signalResponse.statusCode}`);
      if (signalResponse.success) {
        console.log('✅ Webhook de sinal funcionando!');
        console.log(`Resposta: ${signalResponse.data.substring(0, 100)}...`);
      } else {
        console.log(`❌ Erro: ${signalResponse.data}`);
      }
    } catch (error) {
      console.log(`❌ Erro no POST: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Erro nos testes locais:', error);
  }
  
  console.log('\n✅ Testes locais concluídos!');
  console.log('Se funcionou localmente, o problema é no redeploy do Railway.');
  
  process.exit(0);
  
}, 3000); // 3 segundos para inicializar
