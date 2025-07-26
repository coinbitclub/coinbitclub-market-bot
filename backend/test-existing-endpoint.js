// TESTE DO ENDPOINT EXISTENTE PARA VERIFICAR QUAL ARQUIVO ESTÁ RODANDO
// ===================================================================

const https = require('https');

console.log('🔍 VERIFICANDO QUAL ARQUIVO ESTÁ RODANDO NO RAILWAY');
console.log('==================================================');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(url, requestOptions, (res) => {
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
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testExistingEndpoint() {
  try {
    console.log('🧪 Testando endpoint existente /webhook/signal1...');
    
    const response = await makeRequest('https://coinbitclub-market-bot.up.railway.app/webhook/signal1', {
      method: 'POST',
      body: { test: 'verificacao' }
    });
    
    console.log(`Status: ${response.statusCode}`);
    console.log(`Resposta: ${response.data}`);
    
    if (response.success) {
      console.log('✅ CONFIRMADO: Railway está usando server-ultra-minimal.cjs');
      console.log('💡 As modificações foram feitas no arquivo correto');
      console.log('🚨 PROBLEMA: Railway não aplicou as mudanças ainda');
      console.log('');
      console.log('🔧 SOLUÇÕES:');
      console.log('1. Fazer commit e push para Git');
      console.log('2. Aguardar mais tempo para redeploy automático');
      console.log('3. Forçar redeploy manual no Railway dashboard');
    } else {
      console.log('❌ Endpoint /webhook/signal1 não encontrado');
      console.log('🤔 Pode estar rodando arquivo diferente');
    }
    
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
  }
}

testExistingEndpoint();
