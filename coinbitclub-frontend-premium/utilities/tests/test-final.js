const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

// Dados de teste
const testUsers = [
  {
    fullName: 'João Silva',
    email: 'joao.teste.final@coinbitclub.com',
    phone: '(11) 99999-1234',
    password: 'senha123',
    userType: 'user'
  },
  {
    fullName: 'Maria Afiliada',
    email: 'maria.afiliada.final@coinbitclub.com',
    phone: '(11) 99999-5678',
    password: 'senha456',
    userType: 'affiliate'
  },
  {
    fullName: 'Admin Sistema',
    email: 'admin.final@coinbitclub.com',
    phone: '(11) 99999-9999',
    password: 'admin789',
    userType: 'admin'
  }
];

async function testCompleteFlow() {
  console.log('🎯 TESTE FINAL DO SISTEMA COINBITCLUB');
  console.log('=====================================\n');

  let successCount = 0;
  let totalTests = 0;

  for (const user of testUsers) {
    totalTests++;
    console.log(`🧪 Testando usuário: ${user.fullName} (${user.userType})`);
    
    try {
      // 1. Registro
      console.log('   📝 Registrando usuário...');
      const registerResponse = await fetch(`${BASE_URL}/api/auth/register-real`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });

      if (!registerResponse.ok) {
        throw new Error(`Registro falhou: ${registerResponse.status}`);
      }

      const registerData = await registerResponse.json();
      console.log(`   ✅ Registro bem-sucedido! Token: ${registerData.token ? 'OK' : 'FALTANDO'}`);

      // 2. Login
      console.log('   🔑 Fazendo login...');
      const loginResponse = await fetch(`${BASE_URL}/api/auth/login-real`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          password: user.password
        })
      });

      if (!loginResponse.ok) {
        throw new Error(`Login falhou: ${loginResponse.status}`);
      }

      const loginData = await loginResponse.json();
      console.log(`   ✅ Login bem-sucedido! User ID: ${loginData.user.id}`);
      console.log(`   📊 Dados: ${loginData.user.name} - ${loginData.user.userType}`);

      successCount++;
      console.log(`   🎉 USUÁRIO ${user.userType.toUpperCase()} FUNCIONANDO PERFEITAMENTE!\n`);

    } catch (error) {
      console.log(`   ❌ ERRO: ${error.message}\n`);
    }
  }

  // Resumo final
  console.log('=====================================');
  console.log('📊 RESULTADO FINAL');
  console.log('=====================================');
  console.log(`✅ Testes Bem-sucedidos: ${successCount}/${totalTests}`);
  console.log(`📈 Taxa de Sucesso: ${((successCount/totalTests) * 100).toFixed(1)}%`);
  
  if (successCount === totalTests) {
    console.log('🎉 SISTEMA COMPLETAMENTE FUNCIONAL!');
    console.log('🚀 Pronto para produção!');
  } else {
    console.log('⚠️ Ainda há problemas para resolver.');
  }
}

testCompleteFlow().catch(console.error);
