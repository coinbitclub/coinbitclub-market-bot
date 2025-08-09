// Teste completo de login e redirecionamento
const https = require('http');

console.log('🔧 Iniciando teste completo de login...');

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

console.log('📤 Enviando requisição de login...');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      console.log('📥 Resposta recebida');
      console.log('📊 Status:', res.statusCode);
      
      const response = JSON.parse(data);
      console.log('📋 Dados:', JSON.stringify(response, null, 2));
      
      if (res.statusCode === 200 && response.success !== false) {
        console.log('✅ LOGIN BEM-SUCEDIDO!');
        
        const userRole = response.user?.role || response.user?.userType || 'user';
        console.log('👔 Role:', userRole);
        
        let redirectUrl;
        switch (userRole.toLowerCase()) {
          case 'admin':
            redirectUrl = '/admin/dashboard';
            break;
          case 'affiliate':
          case 'afiliado':
            redirectUrl = '/affiliate/dashboard';
            break;
          case 'gestor':
          case 'manager':
            redirectUrl = '/gestor/dashboard';
            break;
          case 'operador':
          case 'operator':
            redirectUrl = '/operador/dashboard';
            break;
          case 'user':
          case 'usuario':
          default:
            redirectUrl = '/user/dashboard';
            break;
        }
        
        console.log('🎯 URL de redirecionamento:', redirectUrl);
        console.log('🌐 URL completa:', `http://localhost:3001${redirectUrl}`);
        
        // Teste se a página de destino existe
        console.log('🧪 Testando se a página de destino existe...');
        
        const testOptions = {
          hostname: 'localhost',
          port: 3001,
          path: redirectUrl,
          method: 'GET'
        };
        
        const testReq = https.request(testOptions, (testRes) => {
          console.log('📊 Status da página de destino:', testRes.statusCode);
          
          if (testRes.statusCode === 200) {
            console.log('✅ Página de destino existe e está acessível!');
            console.log('');
            console.log('🎯 RESULTADO FINAL:');
            console.log('   ✅ Login API: Funcionando');
            console.log('   ✅ Autenticação: OK');
            console.log('   ✅ Role detectado: ' + userRole);
            console.log('   ✅ URL destino: ' + redirectUrl);
            console.log('   ✅ Página destino: Acessível');
            console.log('');
            console.log('🚀 O redirecionamento DEVERIA funcionar!');
            console.log('   Se não está funcionando, pode ser:');
            console.log('   1. Problema no JavaScript do navegador');
            console.log('   2. Erro de execução do window.location.href');
            console.log('   3. Interferência do Next.js');
            console.log('   4. Cache do navegador');
            console.log('');
            console.log('💡 SOLUÇÕES:');
            console.log('   - Limpe o cache do navegador (Ctrl+F5)');
            console.log('   - Use o debug-login.html para ver logs detalhados');
            console.log('   - Verifique o console do navegador (F12)');
            
          } else if (testRes.statusCode === 404) {
            console.log('❌ Página de destino não encontrada!');
            console.log('🔧 Isso explica por que o redirecionamento não funciona');
          } else {
            console.log('⚠️ Página de destino retornou status:', testRes.statusCode);
          }
        });
        
        testReq.on('error', (error) => {
          console.error('❌ Erro ao testar página de destino:', error.message);
        });
        
        testReq.end();
        
      } else {
        console.log('❌ ERRO NO LOGIN:', response.message || response.error);
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
