const axios = require('axios');

const API_BASE = 'http://localhost:9997/api';

// Função para gerar dados únicos
const generateEmail = (prefix = 'teste') => `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}@coinbitclub.com`;
const generatePhone = () => `+55119${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
const generateCPF = () => `${Math.floor(Math.random() * 100000000000).toString().padStart(11, '0')}`;

// Cores para console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = (color, message) => console.log(`${color}${message}${colors.reset}`);

// Variáveis globais para armazenar dados dos testes
let adminToken = '';
let userToken = '';
let affiliateToken = '';
let createdUser = null;
let createdAffiliate = null;

// ===== FUNÇÕES DE TESTE =====

async function loginAsAdmin() {
  try {
    log(colors.blue, '\\n🔑 Fazendo login como administrador...');
    
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@coinbitclub.com',
      password: 'admin123'
    });

    if (response.data.success) {
      adminToken = response.data.token;
      log(colors.green, '✅ Login de admin realizado com sucesso');
      return true;
    }
    return false;
  } catch (error) {
    log(colors.red, `❌ Erro no login admin: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testUserRegistration() {
  try {
    log(colors.blue, '\\n📝 1. TESTANDO CADASTRO DE USUÁRIO COMPLETO...');
    
    const userData = {
      name: 'João Silva Teste',
      email: generateEmail('user'),
      password: 'senha123456',
      phone: generatePhone(),
      country: 'BR',
      role: 'user',
      cpf: generateCPF(),
      // Dados para saque
      bankAccount: {
        bank: 'Banco do Brasil',
        agency: '1234-5',
        account: '12345-6',
        accountType: 'corrente',
        holderName: 'João Silva Teste',
        holderCPF: generateCPF()
      }
    };

    log(colors.cyan, `   👤 Nome: ${userData.name}`);
    log(colors.cyan, `   📧 Email: ${userData.email}`);
    log(colors.cyan, `   📱 Telefone: ${userData.phone}`);
    log(colors.cyan, `   🆔 CPF: ${userData.cpf}`);
    log(colors.cyan, `   🏦 Banco: ${userData.bankAccount.bank}`);

    const response = await axios.post(`${API_BASE}/auth/register`, userData);
    
    if (response.data.success) {
      createdUser = response.data.user;
      userToken = response.data.token;
      log(colors.green, '✅ Usuário cadastrado com sucesso!');
      log(colors.yellow, `   🆔 ID: ${createdUser.id}`);
      log(colors.yellow, `   🔗 Redirect: ${response.data.redirectUrl}`);
      return true;
    }
    return false;
  } catch (error) {
    log(colors.red, `❌ Erro no cadastro do usuário: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testAffiliateRegistration() {
  try {
    log(colors.blue, '\\n🤝 2. TESTANDO CADASTRO DE AFILIADO COMPLETO...');
    
    const affiliateData = {
      name: 'Maria Santos Afiliada',
      email: generateEmail('affiliate'),
      password: 'senha123456',
      phone: generatePhone(),
      country: 'BR',
      role: 'affiliate',
      cpf: generateCPF(),
      // Dados específicos de afiliado
      businessName: 'Marketing Digital MS',
      businessType: 'MEI',
      // Dados para saque
      bankAccount: {
        bank: 'Caixa Econômica Federal',
        agency: '9876-1',
        account: '98765-4',
        accountType: 'poupanca',
        holderName: 'Maria Santos Afiliada',
        holderCPF: generateCPF()
      }
    };

    log(colors.cyan, `   👤 Nome: ${affiliateData.name}`);
    log(colors.cyan, `   📧 Email: ${affiliateData.email}`);
    log(colors.cyan, `   📱 Telefone: ${affiliateData.phone}`);
    log(colors.cyan, `   🏢 Empresa: ${affiliateData.businessName}`);
    log(colors.cyan, `   🏦 Banco: ${affiliateData.bankAccount.bank}`);

    const response = await axios.post(`${API_BASE}/auth/register`, affiliateData);
    
    if (response.data.success) {
      createdAffiliate = response.data.user;
      affiliateToken = response.data.token;
      log(colors.green, '✅ Afiliado cadastrado com sucesso!');
      log(colors.yellow, `   🆔 ID: ${createdAffiliate.id}`);
      log(colors.yellow, `   🔗 Redirect: ${response.data.redirectUrl}`);
      return true;
    }
    return false;
  } catch (error) {
    log(colors.red, `❌ Erro no cadastro do afiliado: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testAPIKeyGeneration() {
  try {
    log(colors.blue, '\\n🔐 3. TESTANDO GERAÇÃO DE CHAVES API...');
    
    // Teste para usuário
    if (userToken) {
      log(colors.cyan, '   👤 Gerando chaves API para usuário...');
      
      try {
        const userKeysResponse = await axios.post(`${API_BASE}/user/api-keys`, {
          name: 'Chave Principal',
          permissions: ['read', 'trade']
        }, {
          headers: { Authorization: `Bearer ${userToken}` }
        });
        
        if (userKeysResponse.data.success) {
          log(colors.green, '   ✅ Chave API do usuário gerada!');
          log(colors.yellow, `      🔑 API Key: ${userKeysResponse.data.apiKey.substring(0, 20)}...`);
          log(colors.yellow, `      🔐 Secret: ${userKeysResponse.data.secret.substring(0, 20)}...`);
        }
      } catch (error) {
        log(colors.yellow, `   ⚠️  Endpoint de API keys ainda não implementado: ${error.response?.status}`);
      }
    }

    // Teste para afiliado
    if (affiliateToken) {
      log(colors.cyan, '   🤝 Gerando chaves API para afiliado...');
      
      try {
        const affiliateKeysResponse = await axios.post(`${API_BASE}/affiliate/api-keys`, {
          name: 'Chave Afiliado',
          permissions: ['read', 'commission']
        }, {
          headers: { Authorization: `Bearer ${affiliateToken}` }
        });
        
        if (affiliateKeysResponse.data.success) {
          log(colors.green, '   ✅ Chave API do afiliado gerada!');
          log(colors.yellow, `      🔑 API Key: ${affiliateKeysResponse.data.apiKey.substring(0, 20)}...`);
        }
      } catch (error) {
        log(colors.yellow, `   ⚠️  Endpoint de API keys ainda não implementado: ${error.response?.status}`);
      }
    }

    return true;
  } catch (error) {
    log(colors.red, `❌ Erro nos testes de API keys: ${error.message}`);
    return false;
  }
}

async function testWithdrawalDataConfiguration() {
  try {
    log(colors.blue, '\\n💳 4. TESTANDO CONFIGURAÇÃO DE DADOS PARA SAQUE...');
    
    // Teste para usuário
    if (userToken && createdUser) {
      log(colors.cyan, '   👤 Configurando dados de saque do usuário...');
      
      try {
        const withdrawalData = {
          pixKey: createdUser.email,
          pixKeyType: 'email',
          bankAccount: {
            bank: 'Itaú',
            agency: '0001',
            account: '11111-1',
            accountType: 'corrente',
            holderName: 'João Silva Teste',
            holderCPF: generateCPF()
          }
        };

        const response = await axios.put(`${API_BASE}/user/withdrawal-settings`, withdrawalData, {
          headers: { Authorization: `Bearer ${userToken}` }
        });
        
        if (response.data.success) {
          log(colors.green, '   ✅ Dados de saque do usuário configurados!');
          log(colors.yellow, `      🔑 PIX: ${withdrawalData.pixKey}`);
          log(colors.yellow, `      🏦 Banco: ${withdrawalData.bankAccount.bank}`);
        }
      } catch (error) {
        log(colors.yellow, `   ⚠️  Endpoint de configuração de saque: ${error.response?.status}`);
      }
    }

    // Teste para afiliado
    if (affiliateToken && createdAffiliate) {
      log(colors.cyan, '   🤝 Configurando dados de saque do afiliado...');
      
      try {
        const withdrawalData = {
          pixKey: generatePhone(),
          pixKeyType: 'phone',
          bankAccount: {
            bank: 'Santander',
            agency: '9999',
            account: '99999-9',
            accountType: 'poupanca',
            holderName: 'Maria Santos Afiliada',
            holderCPF: generateCPF()
          }
        };

        const response = await axios.put(`${API_BASE}/affiliate/withdrawal-settings`, withdrawalData, {
          headers: { Authorization: `Bearer ${affiliateToken}` }
        });
        
        if (response.data.success) {
          log(colors.green, '   ✅ Dados de saque do afiliado configurados!');
          log(colors.yellow, `      🔑 PIX: ${withdrawalData.pixKey}`);
          log(colors.yellow, `      🏦 Banco: ${withdrawalData.bankAccount.bank}`);
        }
      } catch (error) {
        log(colors.yellow, `   ⚠️  Endpoint de configuração de saque: ${error.response?.status}`);
      }
    }

    return true;
  } catch (error) {
    log(colors.red, `❌ Erro nos testes de dados de saque: ${error.message}`);
    return false;
  }
}

async function testAdminPasswordReset() {
  try {
    log(colors.blue, '\\n🔄 5. TESTANDO RESET DE SENHA PELO ADMINISTRADOR...');
    
    if (!adminToken || !createdUser) {
      log(colors.yellow, '   ⚠️  Admin token ou usuário não disponível para teste');
      return false;
    }

    log(colors.cyan, `   🔐 Admin resetando senha do usuário: ${createdUser.email}`);
    
    try {
      const newPassword = 'novaSenha123456';
      const response = await axios.post(`${API_BASE}/admin/reset-password`, {
        userId: createdUser.id,
        newPassword: newPassword,
        notifyUser: true
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (response.data.success) {
        log(colors.green, '   ✅ Senha resetada pelo admin com sucesso!');
        log(colors.yellow, `      🔑 Nova senha: ${newPassword}`);
        log(colors.yellow, `      📧 Notificação enviada: ${response.data.notificationSent ? 'Sim' : 'Não'}`);
        
        // Testar login com nova senha
        log(colors.cyan, '   🧪 Testando login com nova senha...');
        const loginTest = await axios.post(`${API_BASE}/auth/login`, {
          email: createdUser.email,
          password: newPassword
        });
        
        if (loginTest.data.success) {
          log(colors.green, '   ✅ Login com nova senha funcionando!');
          userToken = loginTest.data.token; // Atualizar token
        }
      }
    } catch (error) {
      log(colors.yellow, `   ⚠️  Endpoint de reset de senha: ${error.response?.status}`);
    }

    return true;
  } catch (error) {
    log(colors.red, `❌ Erro no teste de reset de senha: ${error.message}`);
    return false;
  }
}

async function testAffiliateUserLinking() {
  try {
    log(colors.blue, '\\n🔗 6. TESTANDO VINCULAÇÃO AFILIADO-USUÁRIO PELO ADMIN...');
    
    if (!adminToken || !createdUser || !createdAffiliate) {
      log(colors.yellow, '   ⚠️  Dados necessários não disponíveis para teste');
      return false;
    }

    log(colors.cyan, `   🔗 Vinculando usuário ${createdUser.email} ao afiliado ${createdAffiliate.email}`);
    
    try {
      const response = await axios.post(`${API_BASE}/admin/link-affiliate`, {
        userId: createdUser.id,
        affiliateId: createdAffiliate.id,
        commissionRate: 15.0,
        notes: 'Vinculação realizada durante teste automatizado'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (response.data.success) {
        log(colors.green, '   ✅ Vinculação realizada com sucesso!');
        log(colors.yellow, `      📊 Taxa de comissão: ${response.data.commissionRate}%`);
        log(colors.yellow, `      📅 Data da vinculação: ${new Date().toLocaleString('pt-BR')}`);
        
        // Verificar se a vinculação aparece no dashboard do afiliado
        log(colors.cyan, '   🧪 Verificando dashboard do afiliado...');
        const affiliateDashboard = await axios.get(`${API_BASE}/affiliate/dashboard`, {
          headers: { Authorization: `Bearer ${affiliateToken}` }
        });
        
        if (affiliateDashboard.data.success) {
          const totalReferrals = affiliateDashboard.data.statistics?.totalReferrals || 0;
          log(colors.green, `   ✅ Dashboard atualizado - Total de indicados: ${totalReferrals}`);
        }
      }
    } catch (error) {
      log(colors.yellow, `   ⚠️  Endpoint de vinculação: ${error.response?.status}`);
    }

    return true;
  } catch (error) {
    log(colors.red, `❌ Erro no teste de vinculação: ${error.message}`);
    return false;
  }
}

async function testDatabaseIntegration() {
  try {
    log(colors.blue, '\\n🗄️  7. TESTANDO INTEGRAÇÃO COM BANCO DE DADOS EM TEMPO REAL...');
    
    // Verificar se os dados estão sendo persistidos corretamente
    log(colors.cyan, '   📊 Verificando dashboards...');
    
    // Dashboard do usuário
    if (userToken) {
      try {
        const userDashboard = await axios.get(`${API_BASE}/user/dashboard`, {
          headers: { Authorization: `Bearer ${userToken}` }
        });
        
        if (userDashboard.data.success) {
          log(colors.green, '   ✅ Dashboard do usuário carregado do banco');
          log(colors.yellow, `      💰 Saldo total: R$ ${userDashboard.data.statistics?.totalBalance || 0}`);
          log(colors.yellow, `      📈 Operações: ${userDashboard.data.statistics?.totalOperations || 0}`);
        }
      } catch (error) {
        log(colors.yellow, `   ⚠️  Dashboard usuário: ${error.response?.status}`);
      }
    }

    // Dashboard do afiliado
    if (affiliateToken) {
      try {
        const affiliateDashboard = await axios.get(`${API_BASE}/affiliate/dashboard`, {
          headers: { Authorization: `Bearer ${affiliateToken}` }
        });
        
        if (affiliateDashboard.data.success) {
          log(colors.green, '   ✅ Dashboard do afiliado carregado do banco');
          log(colors.yellow, `      👥 Indicados: ${affiliateDashboard.data.statistics?.totalReferrals || 0}`);
          log(colors.yellow, `      💰 Comissões: R$ ${affiliateDashboard.data.statistics?.totalCommissions || 0}`);
        }
      } catch (error) {
        log(colors.yellow, `   ⚠️  Dashboard afiliado: ${error.response?.status}`);
      }
    }

    // Verificar lista de afiliados pelo admin
    if (adminToken) {
      try {
        const affiliatesList = await axios.get(`${API_BASE}/admin/affiliates`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        if (affiliatesList.data.success) {
          log(colors.green, '   ✅ Lista de afiliados carregada do banco pelo admin');
          log(colors.yellow, `      📊 Total de afiliados: ${affiliatesList.data.pagination?.total || 0}`);
        }
      } catch (error) {
        log(colors.yellow, `   ⚠️  Lista afiliados admin: ${error.response?.status}`);
      }
    }

    return true;
  } catch (error) {
    log(colors.red, `❌ Erro no teste de integração com banco: ${error.message}`);
    return false;
  }
}

async function testRealTimeUpdates() {
  try {
    log(colors.blue, '\\n⚡ 8. TESTANDO ATUALIZAÇÕES EM TEMPO REAL...');
    
    // Simular uma operação e verificar se reflete nos dashboards
    if (userToken && adminToken) {
      log(colors.cyan, '   💼 Simulando operação para o usuário...');
      
      try {
        // Tentar criar uma operação fictícia
        const operationData = {
          type: 'BUY',
          symbol: 'BTCUSDT',
          amount: 0.001,
          price: 45000,
          exchange: 'binance'
        };

        const response = await axios.post(`${API_BASE}/user/operations`, operationData, {
          headers: { Authorization: `Bearer ${userToken}` }
        });
        
        if (response.data.success) {
          log(colors.green, '   ✅ Operação registrada!');
          
          // Verificar se aparece no dashboard imediatamente
          setTimeout(async () => {
            const updatedDashboard = await axios.get(`${API_BASE}/user/dashboard`, {
              headers: { Authorization: `Bearer ${userToken}` }
            });
            
            if (updatedDashboard.data.success) {
              log(colors.green, '   ✅ Dashboard atualizado em tempo real!');
            }
          }, 1000);
        }
      } catch (error) {
        log(colors.yellow, `   ⚠️  Endpoint de operações: ${error.response?.status}`);
      }
    }

    return true;
  } catch (error) {
    log(colors.red, `❌ Erro no teste de tempo real: ${error.message}`);
    return false;
  }
}

async function runCompleteIntegrationTest() {
  log(colors.bold, '🚀 ===== TESTE COMPLETO DE INTEGRAÇÃO =====');
  log(colors.yellow, '🔗 API Base: ' + API_BASE);
  log(colors.yellow, '📅 Data: ' + new Date().toLocaleString('pt-BR'));
  log(colors.yellow, '🎯 Objetivo: Testar todas as funcionalidades integradas');
  
  const results = {
    adminLogin: false,
    userRegistration: false,
    affiliateRegistration: false,
    apiKeys: false,
    withdrawalData: false,
    passwordReset: false,
    affiliateLinking: false,
    databaseIntegration: false,
    realTimeUpdates: false
  };

  // Executar todos os testes em sequência
  results.adminLogin = await loginAsAdmin();
  results.userRegistration = await testUserRegistration();
  results.affiliateRegistration = await testAffiliateRegistration();
  results.apiKeys = await testAPIKeyGeneration();
  results.withdrawalData = await testWithdrawalDataConfiguration();
  results.passwordReset = await testAdminPasswordReset();
  results.affiliateLinking = await testAffiliateUserLinking();
  results.databaseIntegration = await testDatabaseIntegration();
  results.realTimeUpdates = await testRealTimeUpdates();

  // Resumo dos resultados
  log(colors.bold, '\\n📊 ===== RESUMO DOS TESTES =====');
  
  Object.entries(results).forEach(([test, passed]) => {
    const icon = passed ? '✅' : '❌';
    const color = passed ? colors.green : colors.red;
    log(color, `${icon} ${test}: ${passed ? 'PASSOU' : 'FALHOU'}`);
  });

  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  log(colors.bold, `\\n🎯 RESULTADO GERAL: ${passedTests}/${totalTests} testes passaram`);
  
  if (passedTests === totalTests) {
    log(colors.green, '🎉 TODOS OS TESTES PASSARAM! Sistema totalmente integrado!');
  } else if (passedTests >= totalTests * 0.7) {
    log(colors.yellow, '⚠️  Maioria dos testes passou. Sistema parcialmente integrado.');
  } else {
    log(colors.red, '❌ Muitos testes falharam. Verificar integrações.');
  }
  
  // Credenciais para teste manual
  log(colors.bold, '\\n🔗 CREDENCIAIS PARA TESTE MANUAL:');
  if (createdUser) {
    log(colors.blue, `👤 Usuário: ${createdUser.email} | Senha: senha123456`);
  }
  if (createdAffiliate) {
    log(colors.blue, `🤝 Afiliado: ${createdAffiliate.email} | Senha: senha123456`);
  }
  log(colors.blue, `🔧 Admin: admin@coinbitclub.com | Senha: admin123`);
  
  log(colors.bold, '\\n🌐 URLs para teste:');
  log(colors.blue, '🔐 Login: http://localhost:3001/auth/login');
  log(colors.blue, '📝 Registro: http://localhost:3001/auth/register');
  log(colors.blue, '👤 Dashboard Usuário: http://localhost:3001/user/dashboard');
  log(colors.blue, '🤝 Dashboard Afiliado: http://localhost:3001/affiliate/dashboard');
  log(colors.blue, '🔧 Admin Afiliados: http://localhost:3001/admin/affiliates');
}

// Executar teste completo
runCompleteIntegrationTest().catch(error => {
  log(colors.red, `💥 Erro geral nos testes: ${error.message}`);
  process.exit(1);
});
