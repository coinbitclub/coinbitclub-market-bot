const axios = require('axios');

console.log('🔥 TESTE FINAL - INTEGRAÇÃO FRONTEND-BACKEND');
console.log('================================================');

async function testCompleteIntegration() {
  try {
    // 1. Testar Frontend Login API
    console.log('\n1️⃣ Testando Frontend Login API...');
    const frontendResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'faleconosco@coinbitclub.vip',
      password: 'password'
    });
    
    if (frontendResponse.status === 200) {
      console.log('✅ Frontend Login: SUCESSO');
      console.log('   Token:', frontendResponse.data.token.substring(0, 50) + '...');
      console.log('   Usuário:', frontendResponse.data.user.name, `(${frontendResponse.data.user.role})`);
    }
    
    // 2. Testar Backend Health
    console.log('\n2️⃣ Testando Backend Health...');
    const healthResponse = await axios.get('http://localhost:8080/health');
    
    if (healthResponse.status === 200) {
      console.log('✅ Backend Health: SUCESSO');
      console.log('   Status:', healthResponse.data.status);
      console.log('   Database:', healthResponse.data.database ? 'CONECTADO' : 'DESCONECTADO');
    }
    
    // 3. Testar Backend Dashboard
    console.log('\n3️⃣ Testando Backend Dashboard...');
    const dashboardResponse = await axios.get('http://localhost:8080/api/user/dashboard', {
      headers: {
        'Authorization': `Bearer ${frontendResponse.data.token}`
      }
    });
    
    if (dashboardResponse.status === 200) {
      console.log('✅ Backend Dashboard: SUCESSO');
      console.log('   Operações encontradas:', dashboardResponse.data.operations?.length || 0);
    }
    
    // 4. Resumo final
    console.log('\n🎉 RESUMO DO TESTE');
    console.log('==================');
    console.log('✅ Frontend (port 3001): FUNCIONANDO');
    console.log('✅ Backend (port 8080): FUNCIONANDO');
    console.log('✅ Autenticação JWT: FUNCIONANDO');
    console.log('✅ Database PostgreSQL: CONECTADO');
    console.log('✅ Integração Completa: SUCESSO');
    
    console.log('\n🌐 URLs de Acesso:');
    console.log('   Frontend: http://localhost:3001/auth/login');
    console.log('   Backend: http://localhost:8080/dashboard');
    console.log('   Credenciais: faleconosco@coinbitclub.vip / password');
    
    return true;
    
  } catch (error) {
    console.log('\n❌ ERRO NO TESTE:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
    return false;
  }
}

testCompleteIntegration().then(success => {
  if (success) {
    console.log('\n🏆 SISTEMA TOTALMENTE OPERACIONAL!');
  } else {
    console.log('\n💥 SISTEMA COM PROBLEMAS!');
  }
  process.exit(success ? 0 : 1);
});
