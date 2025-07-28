/**
 * 🧪 Script de Teste - Sistema de Crédito de Teste
 * Versão: 1.0.0
 * Data: 27/07/2025
 * 
 * Testa todos os endpoints do sistema de crédito implementados na Fase 1
 */

const axios = require('axios');

// Configuração do servidor
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_TOKEN = 'admin-emergency-token';

// Headers padrão para requests admin
const adminHeaders = {
  'Authorization': `Bearer ${ADMIN_TOKEN}`,
  'Content-Type': 'application/json'
};

console.log('🚀 Iniciando testes do Sistema de Crédito de Teste');
console.log(`📡 URL Base: ${BASE_URL}`);
console.log('=' * 60);

// Função para fazer requests com tratamento de erro
async function makeRequest(method, url, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: { ...headers },
      timeout: 10000
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 500,
      error: error.response?.data || error.message
    };
  }
}

// Testes individuais
async function testHealthCheck() {
  console.log('\n1️⃣ Testando Health Check...');
  
  const result = await makeRequest('GET', '/health');
  
  if (result.success) {
    console.log('✅ Health Check OK');
    console.log(`   Status: ${result.status}`);
    console.log(`   Servidor: ${result.data.status}`);
  } else {
    console.log('❌ Health Check FALHOU');
    console.log(`   Status: ${result.status}`);
    console.log(`   Erro: ${result.error}`);
  }
  
  return result.success;
}

async function testEndpointsList() {
  console.log('\n2️⃣ Testando lista de endpoints...');
  
  const result = await makeRequest('GET', '/api/test/endpoints');
  
  if (result.success) {
    console.log('✅ Lista de endpoints OK');
    console.log(`   Versão: ${result.data.version}`);
    
    // Verificar se os novos endpoints estão listados
    const hasTestCreditsAdmin = result.data.available_endpoints.test_credits_admin;
    const hasTestCreditsUser = result.data.available_endpoints.test_credits_user;
    
    if (hasTestCreditsAdmin && hasTestCreditsUser) {
      console.log('✅ Endpoints de crédito teste encontrados');
      console.log(`   Admin: ${hasTestCreditsAdmin.length} endpoints`);
      console.log(`   User: ${hasTestCreditsUser.length} endpoints`);
    } else {
      console.log('❌ Endpoints de crédito teste NÃO encontrados');
    }
  } else {
    console.log('❌ Lista de endpoints FALHOU');
    console.log(`   Status: ${result.status}`);
  }
  
  return result.success;
}

async function testCreditStats() {
  console.log('\n3️⃣ Testando estatísticas de crédito...');
  
  const result = await makeRequest('GET', '/api/admin/test-credits/stats', null, adminHeaders);
  
  if (result.success) {
    console.log('✅ Estatísticas OK');
    console.log(`   Total créditos: ${result.data.stats?.total_credits_granted?.count || 0}`);
    console.log(`   Valor BRL: R$ ${result.data.stats?.total_credits_granted?.amount_brl || 0}`);
    console.log(`   Taxa de uso: ${result.data.stats?.usage_stats?.usage_rate || 0}%`);
  } else {
    console.log('❌ Estatísticas FALHARAM');
    console.log(`   Status: ${result.status}`);
    console.log(`   Erro: ${JSON.stringify(result.error, null, 2)}`);
  }
  
  return result.success;
}

async function testCreditList() {
  console.log('\n4️⃣ Testando listagem de créditos...');
  
  const result = await makeRequest('GET', '/api/admin/test-credits?page=1&limit=5', null, adminHeaders);
  
  if (result.success) {
    console.log('✅ Listagem OK');
    console.log(`   Registros: ${result.data.data?.length || 0}`);
    console.log(`   Total: ${result.data.pagination?.total_items || 0}`);
    console.log(`   Páginas: ${result.data.pagination?.total_pages || 0}`);
  } else {
    console.log('❌ Listagem FALHOU');
    console.log(`   Status: ${result.status}`);
    console.log(`   Erro: ${JSON.stringify(result.error, null, 2)}`);
  }
  
  return result.success;
}

async function testUserSearch() {
  console.log('\n5️⃣ Testando busca de usuários...');
  
  const result = await makeRequest('GET', '/api/admin/users/search?q=test&limit=3', null, adminHeaders);
  
  if (result.success) {
    console.log('✅ Busca de usuários OK');
    console.log(`   Usuários encontrados: ${result.data.users?.length || 0}`);
    console.log(`   Query: "${result.data.query}"`);
  } else {
    console.log('❌ Busca de usuários FALHOU');
    console.log(`   Status: ${result.status}`);
    console.log(`   Erro: ${JSON.stringify(result.error, null, 2)}`);
  }
  
  return result.success;
}

async function testEligibilityCheck() {
  console.log('\n6️⃣ Testando verificação de elegibilidade...');
  
  const testData = {
    user_id: 1  // ID de teste
  };
  
  const result = await makeRequest('POST', '/api/test-credits/check-eligibility', testData);
  
  if (result.success) {
    console.log('✅ Verificação de elegibilidade OK');
    console.log(`   Elegível: ${result.data.eligible ? 'SIM' : 'NÃO'}`);
    console.log(`   Motivo: ${result.data.reason || 'N/A'}`);
  } else {
    console.log('❌ Verificação de elegibilidade FALHOU');
    console.log(`   Status: ${result.status}`);
    console.log(`   Erro: ${JSON.stringify(result.error, null, 2)}`);
  }
  
  return result.success;
}

// Função principal de teste
async function runAllTests() {
  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'Endpoints List', fn: testEndpointsList },
    { name: 'Credit Stats', fn: testCreditStats },
    { name: 'Credit List', fn: testCreditList },
    { name: 'User Search', fn: testUserSearch },
    { name: 'Eligibility Check', fn: testEligibilityCheck }
  ];
  
  const results = [];
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const success = await test.fn();
      results.push({ name: test.name, success });
      
      if (success) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`❌ Erro no teste ${test.name}: ${error.message}`);
      results.push({ name: test.name, success: false, error: error.message });
      failed++;
    }
    
    // Pequena pausa entre testes
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Relatório final
  console.log('\n' + '=' * 60);
  console.log('📊 RELATÓRIO FINAL DOS TESTES');
  console.log('=' * 60);
  
  results.forEach((result, index) => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${index + 1}. ${result.name}`);
    if (result.error) {
      console.log(`   Erro: ${result.error}`);
    }
  });
  
  console.log('\n📈 RESUMO:');
  console.log(`✅ Passou: ${passed} testes`);
  console.log(`❌ Falhou: ${failed} testes`);
  console.log(`📊 Taxa de sucesso: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (passed === tests.length) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM! Sistema funcionando corretamente.');
  } else if (failed === tests.length) {
    console.log('\n🚨 TODOS OS TESTES FALHARAM! Verificar se o servidor está rodando.');
  } else {
    console.log('\n⚠️  ALGUNS TESTES FALHARAM. Verificar logs acima para detalhes.');
  }
  
  console.log('\n💡 Para testar manualmente:');
  console.log(`   - Endpoints: ${BASE_URL}/api/test/endpoints`);
  console.log(`   - Estatísticas: ${BASE_URL}/api/admin/test-credits/stats`);
  console.log(`   - Health: ${BASE_URL}/health`);
  
  process.exit(failed > 0 ? 1 : 0);
}

// Verificar se o módulo está sendo executado diretamente
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('❌ Erro fatal nos testes:', error);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  makeRequest,
  BASE_URL,
  adminHeaders
};
