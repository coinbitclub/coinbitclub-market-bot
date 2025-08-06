/**
 * Teste de Registro de Usuário
 * Sistema CoinBitClub - API Railway
 */

const fetch = require('node-fetch');

async function testRegister() {
  console.log('🧪 Testando registro de usuário...');
  
  const testUser = {
    name: 'Usuário Teste',
    email: `teste${Date.now()}@coinbitclub.com`,
    password: 'test123',
    phone: '(11) 99999-9999',
    country: 'Brasil',
    referralCode: 'COINBIT2024',
    role: 'user'
  };

  try {
    const response = await fetch('http://localhost:9997/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Registro bem-sucedido!');
      console.log('📄 Resposta:', JSON.stringify(data, null, 2));
      console.log('🔗 URL de redirecionamento:', data.redirectUrl);
      
      // Testar login com o usuário criado
      console.log('\n🔐 Testando login...');
      const loginResponse = await fetch('http://localhost:9997/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password
        }),
      });

      const loginData = await loginResponse.json();
      
      if (loginResponse.ok) {
        console.log('✅ Login bem-sucedido!');
        console.log('📄 Resposta:', JSON.stringify(loginData, null, 2));
      } else {
        console.log('❌ Erro no login:', loginData);
      }
    } else {
      console.log('❌ Erro no registro:', data);
    }
  } catch (error) {
    console.error('💥 Erro de conexão:', error.message);
  }
}

testRegister();
