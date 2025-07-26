// RESTART DO SISTEMA E VERIFICAÇÃO DOS ENDPOINTS
// ===============================================

const https = require('https');

console.log('🔄 REINICIALIZANDO SISTEMA RAILWAY');
console.log('==================================');
console.log('Data:', new Date().toLocaleString('pt-BR'));
console.log('');

// Configuração
const CONFIG = {
  baseUrl: 'https://coinbitclub-market-bot.up.railway.app',
  webhookToken: '210406'
};

// Função para fazer requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Railway-Restart-Test',
        ...options.headers
      }
    };

    const req = https.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
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

// Verificar status atual
async function checkCurrentStatus() {
  console.log('📊 VERIFICANDO STATUS ATUAL:');
  console.log('============================');
  
  const endpoints = [
    '/health',
    '/api/auth/health',
    '/api/webhooks/stripe',
    '/api/webhooks/signal',
    '/api/webhooks/dominance'
  ];
  
  for (const endpoint of endpoints) {
    const url = `${CONFIG.baseUrl}${endpoint}`;
    console.log(`🔍 Testando: ${endpoint}`);
    
    try {
      const response = await makeRequest(url);
      console.log(`   Status: ${response.statusCode} | ${response.success ? 'OK' : 'ERRO'}`);
      
      if (endpoint === '/health' && response.success) {
        const data = JSON.parse(response.data);
        console.log(`   Uptime: ${Math.floor(data.uptime || 0)}s`);
      }
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
  }
  
  console.log('');
}

// Forçar reinicialização fazendo algumas operações
async function triggerRefresh() {
  console.log('🔄 TENTANDO ATIVAR REFRESH:');
  console.log('===========================');
  
  try {
    // Fazer várias requisições para forçar atividade
    console.log('📡 Fazendo requisições para ativar servidor...');
    
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(makeRequest(`${CONFIG.baseUrl}/health`));
    }
    
    await Promise.all(promises);
    console.log('✅ Requisições enviadas');
    
    // Aguardar um pouco
    console.log('⏱️ Aguardando 10 segundos...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.log(`❌ Erro durante refresh: ${error.message}`);
  }
  
  console.log('');
}

// Verificar novamente após refresh
async function checkAfterRefresh() {
  console.log('🔍 VERIFICAÇÃO PÓS-REFRESH:');
  console.log('===========================');
  
  const testEndpoints = [
    '/api/webhooks/signal',
    '/api/webhooks/dominance',
    '/api/webhooks/signals/recent'
  ];
  
  for (const endpoint of testEndpoints) {
    const url = `${CONFIG.baseUrl}${endpoint}`;
    console.log(`🧪 Testando: ${endpoint}`);
    
    try {
      const response = await makeRequest(url);
      console.log(`   Status: ${response.statusCode}`);
      
      if (response.statusCode === 404) {
        console.log(`   ❌ Endpoint não encontrado`);
      } else if (response.statusCode === 401) {
        console.log(`   🔐 Endpoint existe, mas requer autenticação`);
      } else if (response.statusCode === 405) {
        console.log(`   ✅ Endpoint existe, método não permitido (normal para GET)`);
      } else {
        console.log(`   ✅ Endpoint respondeu: ${response.data.substring(0, 100)}`);
      }
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
  }
  
  console.log('');
}

// Função principal
async function checkAndRefresh() {
  console.log('🚀 INICIANDO VERIFICAÇÃO E REFRESH...\n');
  
  try {
    await checkCurrentStatus();
    await triggerRefresh();
    await checkAfterRefresh();
    
    console.log('📋 DIAGNÓSTICO:');
    console.log('===============');
    console.log('Se os endpoints ainda retornarem 404, pode ser:');
    console.log('1. O webhook controller não está sendo carregado');
    console.log('2. As rotas não estão registradas corretamente');
    console.log('3. O servidor precisa de redeploy manual');
    console.log('');
    console.log('💡 AÇÕES RECOMENDADAS:');
    console.log('1. Verificar logs do Railway');
    console.log('2. Fazer redeploy manual');
    console.log('3. Verificar import/export dos controllers');
    console.log('');
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error);
  }
}

// Executar
if (require.main === module) {
  checkAndRefresh();
}

module.exports = { checkAndRefresh };
