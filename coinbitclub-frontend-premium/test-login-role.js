const https = require('http');

const postData = JSON.stringify({
  email: 'faleconosco@coinbitclub.vip',
  password: 'password'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🔍 Testando login para verificar role do usuário...');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('📊 Status:', res.statusCode);
      console.log('📋 Resposta completa:', JSON.stringify(response, null, 2));
      
      if (response.user) {
        console.log('\n👤 DADOS DO USUÁRIO:');
        console.log('  📧 Email:', response.user.email);
        console.log('  📝 Nome:', response.user.name);
        console.log('  👔 Role:', response.user.role);
        console.log('  🔧 UserType:', response.user.userType);
        
        // Mostrar redirecionamento correto
        const role = response.user.role || response.user.userType;
        console.log('\n🎯 REDIRECIONAMENTO BASEADO NO PERFIL:');
        switch (role?.toLowerCase()) {
          case 'admin':
            console.log('  ➡️ Deveria ir para: /admin/dashboard');
            break;
          case 'affiliate':
          case 'afiliado':
            console.log('  ➡️ Deveria ir para: /affiliate/dashboard');
            break;
          case 'gestor':
          case 'manager':
            console.log('  ➡️ Deveria ir para: /gestor/dashboard');
            break;
          case 'operador':
          case 'operator':
            console.log('  ➡️ Deveria ir para: /operador/dashboard');
            break;
          case 'user':
          case 'usuario':
          default:
            console.log('  ➡️ Deveria ir para: /user/dashboard');
            break;
        }
      }
    } catch (error) {
      console.error('❌ Erro ao parsear resposta:', error.message);
      console.log('📄 Resposta bruta:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erro na requisição:', error.message);
});

req.write(postData);
req.end();
