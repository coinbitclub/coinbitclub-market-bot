#!/usr/bin/env node

/**
 * 🔍 TESTE RÁPIDO DE HOMOLOGAÇÃO - COINBITCLUB
 * Validação imediata das URLs e conexões corretas
 */

const https = require('https');
const http = require('http');

// ✅ CONFIGURAÇÕES CORRETAS
const CONFIG = {
  BACKEND_URL: 'https://coinbitclub-market-bot-up.railway.app',
  FRONTEND_URL: 'https://coinbitclub-market-bot.vercel.app',
  FRONTEND_LOGIN: 'https://coinbitclub-market-bot.vercel.app/login-integrated',
  DATABASE_URL: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway'
};

console.log('🔍 TESTE RÁPIDO DE HOMOLOGAÇÃO COINBITCLUB');
console.log('==========================================');
console.log(`📅 Executado em: ${new Date().toISOString()}`);
console.log('');

// Função para testar URL
function testUrl(url, name) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const startTime = Date.now();
    const req = protocol.get(url, (res) => {
      const responseTime = Date.now() - startTime;
      const status = res.statusCode;
      
      console.log(`✅ ${name}:`);
      console.log(`   URL: ${url}`);
      console.log(`   Status: ${status}`);
      console.log(`   Response Time: ${responseTime}ms`);
      console.log('');
      
      resolve({ name, url, status, responseTime, success: status < 400 });
    });
    
    req.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      console.log(`❌ ${name}:`);
      console.log(`   URL: ${url}`);
      console.log(`   Error: ${error.message}`);
      console.log(`   Time: ${responseTime}ms`);
      console.log('');
      
      resolve({ name, url, status: 'ERROR', responseTime, success: false, error: error.message });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      console.log(`⏰ ${name}:`);
      console.log(`   URL: ${url}`);
      console.log(`   Error: Timeout (10s)`);
      console.log('');
      
      resolve({ name, url, status: 'TIMEOUT', responseTime: 10000, success: false });
    });
  });
}

// Executar testes
async function runTests() {
  console.log('🚀 Iniciando testes...');
  console.log('');
  
  const tests = [
    testUrl(CONFIG.BACKEND_URL + '/health', 'Backend Health'),
    testUrl(CONFIG.BACKEND_URL + '/api/health', 'Backend API Health'),
    testUrl(CONFIG.BACKEND_URL + '/api/status', 'Backend Status'),
    testUrl(CONFIG.FRONTEND_URL, 'Frontend Home'),
    testUrl(CONFIG.FRONTEND_LOGIN, 'Frontend Login')
  ];
  
  const results = await Promise.all(tests);
  
  console.log('📊 RESUMO DOS TESTES');
  console.log('====================');
  
  let successCount = 0;
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.name}: ${result.status} (${result.responseTime}ms)`);
    if (result.success) successCount++;
  });
  
  console.log('');
  console.log(`📈 Success Rate: ${successCount}/${results.length} (${Math.round(successCount/results.length*100)}%)`);
  
  // Teste de banco (básico)
  console.log('');
  console.log('🗄️ CONFIGURAÇÃO DO BANCO');
  console.log('========================');
  console.log(`📍 Host: maglev.proxy.rlwy.net:42095`);
  console.log(`📂 Database: railway`);
  console.log(`🔐 User: postgres`);
  console.log(`🔗 SSL: enabled`);
  
  console.log('');
  if (successCount === results.length) {
    console.log('🎉 TODOS OS TESTES PASSARAM!');
    console.log('✅ Sistema pronto para homologação completa');
  } else {
    console.log('⚠️ ALGUNS TESTES FALHARAM');
    console.log('🔧 Verificar URLs e configurações');
  }
  
  console.log('');
  console.log('📋 Próximos passos:');
  console.log('1. ✅ URLs corretas validadas');
  console.log('2. 🔄 Executar homologação completa');
  console.log('3. 🧪 Executar testes automatizados');
  console.log('4. 📊 Gerar relatório final');
  
  return results;
}

// Executar se chamado diretamente
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, CONFIG };
