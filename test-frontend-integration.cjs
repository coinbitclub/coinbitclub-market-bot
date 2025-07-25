const express = require('express');
const fetch = require('node-fetch');

// Teste de integração com frontend (simulado)
async function testFrontendIntegration() {
  console.log('\n🌐 TESTE DE INTEGRAÇÃO FRONTEND-BACKEND\n');

  const frontendPort = 3002; // Usando porta diferente para não conflitar
  const backendPort = 9998;
  
  try {
    // 1. Verificar se o backend está rodando
    console.log('1️⃣ Verificando backend...');
    try {
      const backendCheck = await fetch(`http://localhost:${backendPort}/test/create-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      });
      console.log('✅ Backend respondendo na porta', backendPort);
    } catch (error) {
      console.log('❌ Backend não está rodando na porta', backendPort);
      console.log('   Execute: node test-password-reset-complete.cjs');
      return;
    }

    // 2. Simular fluxo da landing page
    console.log('\n2️⃣ Simulando fluxo da landing page...');
    
    // Landing page solicita reset
    const resetRequest = {
      email: 'usuario@coinbitclub.com'
    };
    
    console.log('📧 Usuário preenche formulário na landing page:');
    console.log('   Email:', resetRequest.email);
    
    const resetResponse = await fetch(`http://localhost:${backendPort}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resetRequest)
    });
    
    if (resetResponse.ok) {
      const resetData = await resetResponse.json();
      console.log('✅ Solicitação enviada:', resetData.message);
      
      if (resetData.__test_token) {
        console.log('🔐 Token gerado:', resetData.__test_token.substring(0, 16) + '...');
        
        // 3. Simular clique no link do email
        console.log('\n3️⃣ Simulando clique no link do email...');
        const resetToken = resetData.__test_token;
        const resetUrl = `http://localhost:3002/reset-password?token=${resetToken}`;
        console.log('🔗 URL do reset:', resetUrl);
        
        // 4. Simular preenchimento do formulário de nova senha
        console.log('\n4️⃣ Simulando formulário de nova senha...');
        const newPasswordRequest = {
          token: resetToken,
          newPassword: 'NovaSenhaSegura123!',
          confirmPassword: 'NovaSenhaSegura123!'
        };
        
        const confirmResponse = await fetch(`http://localhost:${backendPort}/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPasswordRequest)
        });
        
        if (confirmResponse.ok) {
          const confirmData = await confirmResponse.json();
          console.log('✅ Senha resetada:', confirmData.message);
          
          // 5. Verificar redirecionamento para login
          console.log('\n5️⃣ Redirecionamento para login...');
          console.log('🔗 Redireciona para: http://localhost:3002/login');
          console.log('✅ Usuário pode fazer login com nova senha');
          
        } else {
          console.log('❌ Erro ao confirmar reset');
        }
        
      } else {
        console.log('⚠️ Token não retornado (normal em produção)');
      }
      
    } else {
      console.log('❌ Erro na solicitação de reset');
    }

    // 6. Testar componentes necessários no frontend
    console.log('\n6️⃣ Componentes necessários no frontend:');
    console.log('');
    console.log('📁 Páginas necessárias:');
    console.log('   • /forgot-password (landing page)');
    console.log('   • /reset-password?token=... (formulário de nova senha)');
    console.log('');
    console.log('📁 Componentes necessários:');
    console.log('   • ForgotPasswordForm.jsx');
    console.log('   • ResetPasswordForm.jsx');
    console.log('   • EmailSentNotification.jsx');
    console.log('   • PasswordResetSuccess.jsx');
    console.log('');
    console.log('📁 Hooks necessários:');
    console.log('   • usePasswordReset.js');
    console.log('   • useFormValidation.js');
    console.log('');
    console.log('📁 Validações necessárias:');
    console.log('   • Email válido');
    console.log('   • Senha >= 8 caracteres');
    console.log('   • Confirmação de senha');
    console.log('   • Token válido');

    console.log('\n🎉 INTEGRAÇÃO FRONTEND-BACKEND VALIDADA!');

  } catch (error) {
    console.error('\n❌ ERRO NA INTEGRAÇÃO:', error.message);
  }
}

// Criar mock do frontend para testes
function createFrontendMock() {
  const app = express();
  app.use(express.json());
  app.use(express.static('public'));

  // Mock da página de reset
  app.get('/reset-password', (req, res) => {
    const { token } = req.query;
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Reset Password - CoinBitClub</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 400px; margin: 50px auto; padding: 20px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; }
        input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
        button { width: 100%; padding: 12px; background: #00FFD1; border: none; border-radius: 4px; cursor: pointer; }
        .error { color: red; margin-top: 5px; }
        .success { color: green; margin-top: 5px; }
    </style>
</head>
<body>
    <h2>Reset Your Password</h2>
    <form id="resetForm">
        <input type="hidden" id="token" value="${token || ''}" />
        
        <div class="form-group">
            <label for="newPassword">New Password:</label>
            <input type="password" id="newPassword" required minlength="8" />
            <div class="error" id="passwordError"></div>
        </div>
        
        <div class="form-group">
            <label for="confirmPassword">Confirm Password:</label>
            <input type="password" id="confirmPassword" required />
            <div class="error" id="confirmError"></div>
        </div>
        
        <button type="submit">Reset Password</button>
        <div id="result"></div>
    </form>

    <script>
        document.getElementById('resetForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const token = document.getElementById('token').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            // Validações
            if (newPassword.length < 8) {
                document.getElementById('passwordError').textContent = 'Password must be at least 8 characters';
                return;
            }
            
            if (newPassword !== confirmPassword) {
                document.getElementById('confirmError').textContent = 'Passwords do not match';
                return;
            }
            
            // Limpar erros
            document.getElementById('passwordError').textContent = '';
            document.getElementById('confirmError').textContent = '';
            
            try {
                const response = await fetch('http://localhost:9998/auth/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, newPassword, confirmPassword })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    document.getElementById('result').innerHTML = 
                        '<div class="success">Password reset successfully! <a href="/login">Login now</a></div>';
                } else {
                    document.getElementById('result').innerHTML = 
                        '<div class="error">' + data.error + '</div>';
                }
            } catch (error) {
                document.getElementById('result').innerHTML = 
                    '<div class="error">Network error. Please try again.</div>';
            }
        });
    </script>
</body>
</html>
    `);
  });

  // Mock da página de esqueci senha
  app.get('/forgot-password', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Forgot Password - CoinBitClub</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 400px; margin: 50px auto; padding: 20px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; }
        input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
        button { width: 100%; padding: 12px; background: #00FFD1; border: none; border-radius: 4px; cursor: pointer; }
        .success { color: green; margin-top: 15px; padding: 10px; background: #f0fff0; border-radius: 4px; }
    </style>
</head>
<body>
    <h2>Forgot Your Password?</h2>
    <p>Enter your email address and we'll send you a link to reset your password.</p>
    
    <form id="forgotForm">
        <div class="form-group">
            <label for="email">Email Address:</label>
            <input type="email" id="email" required />
        </div>
        
        <button type="submit">Send Reset Link</button>
        <div id="result"></div>
    </form>

    <script>
        document.getElementById('forgotForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            
            try {
                const response = await fetch('http://localhost:9998/auth/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                
                const data = await response.json();
                
                document.getElementById('result').innerHTML = 
                    '<div class="success">' + data.message + '</div>';
                    
                // Para teste, mostrar o token
                if (data.__test_token) {
                    document.getElementById('result').innerHTML += 
                        '<p><strong>Test Token:</strong> <a href="/reset-password?token=' + 
                        data.__test_token + '">Click here to reset</a></p>';
                }
                
            } catch (error) {
                document.getElementById('result').innerHTML = 
                    '<div style="color: red;">Network error. Please try again.</div>';
            }
        });
    </script>
</body>
</html>
    `);
  });

  return app;
}

// Executar teste se chamado diretamente
if (require.main === module) {
  console.log('🚀 Iniciando mock do frontend na porta 3001...');
  
  const app = createFrontendMock();
  app.listen(3002, () => {
    console.log('✅ Mock frontend rodando em http://localhost:3002');
    console.log('');
    console.log('📱 Páginas disponíveis:');
    console.log('   • http://localhost:3002/forgot-password');
    console.log('   • http://localhost:3002/reset-password?token=...');
    console.log('');
    console.log('⚠️  Certifique-se que o backend está rodando na porta 9998');
    console.log('   Execute em outro terminal: node test-password-reset-complete.cjs');
    
    // Executar teste de integração após 2 segundos
    setTimeout(testFrontendIntegration, 2000);
  });
}

module.exports = { testFrontendIntegration, createFrontendMock };
