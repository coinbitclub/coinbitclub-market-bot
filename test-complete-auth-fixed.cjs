const axios = require('axios');

const API_BASE = 'http://localhost:9997/api';

// Função para gerar email único
const generateEmail = (prefix = 'teste') => `${prefix}${Date.now()}@coinbitclub.com`;

// Cores para console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = (color, message) => console.log(`${color}${message}${colors.reset}`);

async function testRegistration(userData) {
  try {
    log(colors.blue, `\n📝 Testando registro: ${userData.role} - ${userData.email}`);
    
    const response = await axios.post(`${API_BASE}/auth/register`, userData);
    
    if (response.data.success) {
      log(colors.green, `✅ Registro realizado com sucesso!`);
      log(colors.yellow, `   👤 Nome: ${response.data.user.name}`);
      log(colors.yellow, `   📧 Email: ${response.data.user.email}`);
      log(colors.yellow, `   🎭 Role: ${response.data.user.role}`);
      log(colors.yellow, `   🔗 Redirect: ${response.data.redirectUrl}`);
      log(colors.yellow, `   🎯 Token: ${response.data.token ? 'Gerado' : 'Não gerado'}`);
      return { success: true, data: response.data };
    }
  } catch (error) {
    log(colors.red, `❌ Erro no registro: ${error.response?.data?.error || error.message}`);
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

async function testLogin(credentials) {
  try {
    log(colors.blue, `\n🔐 Testando login: ${credentials.email}`);
    
    const response = await axios.post(`${API_BASE}/auth/login`, credentials);
    
    if (response.data.success) {
      log(colors.green, `✅ Login realizado com sucesso!`);
      log(colors.yellow, `   👤 Nome: ${response.data.user.name}`);
      log(colors.yellow, `   📧 Email: ${response.data.user.email}`);
      log(colors.yellow, `   🎭 Role: ${response.data.user.role}`);
      log(colors.yellow, `   🔗 Redirect: ${response.data.redirectUrl}`);
      log(colors.yellow, `   🎯 Token: ${response.data.token ? 'Válido' : 'Inválido'}`);
      return { success: true, data: response.data };
    }
  } catch (error) {
    log(colors.red, `❌ Erro no login: ${error.response?.data?.error || error.message}`);
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

async function testDashboard(token, userType) {
  try {
    log(colors.blue, `\n📊 Testando dashboard ${userType}`);
    
    const endpoint = userType === 'user' ? '/user/dashboard' : 
                    userType === 'affiliate' ? '/affiliate/dashboard' : 
                    '/admin/dashboard';
    
    const response = await axios.get(`${API_BASE}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      log(colors.green, `✅ Dashboard ${userType} carregado com sucesso!`);
      
      if (userType === 'user') {
        log(colors.yellow, `   📊 Operações: ${response.data.statistics?.totalOperations || 0}`);
        log(colors.yellow, `   📈 Taxa sucesso: ${response.data.statistics?.successRate || 0}%`);
        log(colors.yellow, `   💰 Lucro total: R$ ${response.data.statistics?.totalProfit || 0}`);
        log(colors.yellow, `   💳 Saldos: ${response.data.balances?.length || 0} exchanges`);
      } else if (userType === 'affiliate') {
        log(colors.yellow, `   👥 Indicados: ${response.data.statistics?.totalReferrals || 0}`);
        log(colors.yellow, `   💰 Comissões pagas: R$ ${response.data.statistics?.totalCommissions || 0}`);
        log(colors.yellow, `   ⏳ Comissões pendentes: R$ ${response.data.statistics?.pendingCommissions || 0}`);
      }
      
      return { success: true, data: response.data };
    }
  } catch (error) {
    log(colors.red, `❌ Erro no dashboard ${userType}: ${error.response?.data?.error || error.message}`);
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

async function runTests() {
  log(colors.bold, '🚀 ===== TESTE COMPLETO: LOGIN E CADASTRO =====');
  log(colors.yellow, '🔗 API Base: ' + API_BASE);
  log(colors.yellow, '📅 Data: ' + new Date().toLocaleString('pt-BR'));
  
  const results = {
    registrations: { success: 0, failed: 0 },
    logins: { success: 0, failed: 0 },
    dashboards: { success: 0, failed: 0 }
  };

  // 1. TESTE DE REGISTRO - USUÁRIO COMUM
  log(colors.bold, '\n🧪 1. TESTANDO REGISTRO DE USUÁRIOS');
  
  const userEmail = generateEmail('user');
  const userResult = await testRegistration({
    name: 'Usuário Teste Comum',
    email: userEmail,
    password: 'test123',
    phone: '+5511999999999',
    country: 'BR',
    role: 'user'
  });
  
  if (userResult.success) results.registrations.success++;
  else results.registrations.failed++;

  // 2. TESTE DE REGISTRO - AFILIADO
  log(colors.bold, '\n🧪 2. TESTANDO REGISTRO DE AFILIADOS');
  
  const affiliateEmail = generateEmail('affiliate');
  const affiliateResult = await testRegistration({
    name: 'Afiliado Teste',
    email: affiliateEmail,
    password: 'test123',
    phone: '+5511888888888',
    country: 'BR',
    role: 'affiliate'
  });
  
  if (affiliateResult.success) results.registrations.success++;
  else results.registrations.failed++;

  // 3. TESTE DE LOGIN - USUÁRIO EXISTENTE
  log(colors.bold, '\n🧪 3. TESTANDO LOGIN COM USUÁRIO EXISTENTE');
  
  const existingUserLogin = await testLogin({
    email: 'teste1753396801233@coinbitclub.com',
    password: 'test123'
  });
  
  if (existingUserLogin.success) results.logins.success++;
  else results.logins.failed++;

  // 4. TESTE DE LOGIN - USUÁRIO RECÉM CRIADO
  if (userResult.success) {
    log(colors.bold, '\n🧪 4. TESTANDO LOGIN COM USUÁRIO RECÉM CRIADO');
    
    const newUserLogin = await testLogin({
      email: userEmail,
      password: 'test123'
    });
    
    if (newUserLogin.success) {
      results.logins.success++;
      
      // 5. TESTE DASHBOARD USUÁRIO
      log(colors.bold, '\n🧪 5. TESTANDO DASHBOARD DO USUÁRIO');
      const dashboardResult = await testDashboard(newUserLogin.data.token, 'user');
      if (dashboardResult.success) results.dashboards.success++;
      else results.dashboards.failed++;
    } else {
      results.logins.failed++;
    }
  }

  // 6. TESTE DE LOGIN - AFILIADO RECÉM CRIADO
  if (affiliateResult.success) {
    log(colors.bold, '\n🧪 6. TESTANDO LOGIN COM AFILIADO RECÉM CRIADO');
    
    const newAffiliateLogin = await testLogin({
      email: affiliateEmail,
      password: 'test123'
    });
    
    if (newAffiliateLogin.success) {
      results.logins.success++;
      
      // 7. TESTE DASHBOARD AFILIADO
      log(colors.bold, '\n🧪 7. TESTANDO DASHBOARD DO AFILIADO');
      const dashboardResult = await testDashboard(newAffiliateLogin.data.token, 'affiliate');
      if (dashboardResult.success) results.dashboards.success++;
      else results.dashboards.failed++;
    } else {
      results.logins.failed++;
    }
  }

  // 8. TESTE DE LOGIN COM CREDENCIAIS INVÁLIDAS
  log(colors.bold, '\n🧪 8. TESTANDO LOGIN COM CREDENCIAIS INVÁLIDAS');
  
  const invalidLogin = await testLogin({
    email: 'usuario@inexistente.com',
    password: 'senhaerrada'
  });
  
  if (!invalidLogin.success) {
    log(colors.green, '✅ Erro esperado para credenciais inválidas - Funcionando corretamente!');
  }

  // RESUMO DOS RESULTADOS
  log(colors.bold, '\n📊 ===== RESUMO DOS TESTES =====');
  log(colors.yellow, `📝 Registros: ${results.registrations.success} ✅ | ${results.registrations.failed} ❌`);
  log(colors.yellow, `🔐 Logins: ${results.logins.success} ✅ | ${results.logins.failed} ❌`);
  log(colors.yellow, `📊 Dashboards: ${results.dashboards.success} ✅ | ${results.dashboards.failed} ❌`);
  
  const totalTests = results.registrations.success + results.registrations.failed + 
                    results.logins.success + results.logins.failed +
                    results.dashboards.success + results.dashboards.failed;
  const totalSuccess = results.registrations.success + results.logins.success + results.dashboards.success;
  
  log(colors.bold, `\n🎯 RESULTADO GERAL: ${totalSuccess}/${totalTests} testes passaram`);
  
  if (totalSuccess === totalTests) {
    log(colors.green, '🎉 TODOS OS TESTES PASSARAM! Sistema funcionando perfeitamente!');
  } else {
    log(colors.yellow, '⚠️  Alguns testes falharam. Verificar logs acima.');
  }
  
  log(colors.bold, '\n🔗 CREDENCIAIS PARA TESTE MANUAL:');
  log(colors.blue, `📧 Usuário existente: teste1753396801233@coinbitclub.com`);
  log(colors.blue, `🔑 Senha: test123`);
  if (userResult.success) {
    log(colors.blue, `📧 Novo usuário: ${userEmail}`);
    log(colors.blue, `🔑 Senha: test123`);
  }
  if (affiliateResult.success) {
    log(colors.blue, `📧 Novo afiliado: ${affiliateEmail}`);
    log(colors.blue, `🔑 Senha: test123`);
  }
  
  log(colors.bold, '\n🌐 URLs para teste:');
  log(colors.blue, '🔐 Login: http://localhost:3001/auth/login');
  log(colors.blue, '📝 Registro: http://localhost:3001/auth/register');
  log(colors.blue, '👤 Dashboard Usuário: http://localhost:3001/user/dashboard');
  log(colors.blue, '🏢 Dashboard Afiliado: http://localhost:3001/affiliate/dashboard');
}

// Executar testes
runTests().catch(error => {
  log(colors.red, `💥 Erro geral nos testes: ${error.message}`);
  process.exit(1);
});
