// Teste automatizado de login
console.log('🔧 Iniciando teste de login automatizado...');

async function testLogin() {
  try {
    // Testar API de login
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'faleconosco@coinbitclub.vip',
        password: 'password'
      })
    });

    const data = await response.json();
    
    if (response.ok && data.token) {
      console.log('✅ Login API funcionando!');
      console.log('Token recebido:', data.token.substring(0, 50) + '...');
      console.log('Usuário:', data.user);
      
      // Salvar no localStorage
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_data', JSON.stringify(data.user));
      
      console.log('✅ Dados salvos no localStorage');
      
      // Testar redirecionamento baseado no role
      const userRole = data.user.role;
      let redirectUrl = '/dashboard';
      
      switch (userRole) {
        case 'admin':
          redirectUrl = '/admin/dashboard';
          break;
        case 'affiliate':
          redirectUrl = '/affiliate/dashboard';
          break;
        default:
          redirectUrl = '/dashboard';
      }
      
      console.log(`✅ Redirecionamento sugerido: ${redirectUrl}`);
      console.log('🎉 TESTE DE LOGIN COMPLETO: SUCESSO!');
      
      return { success: true, data, redirectUrl };
      
    } else {
      console.log('❌ Erro no login:', data);
      return { success: false, error: data };
    }
    
  } catch (error) {
    console.log('❌ Erro na requisição:', error);
    return { success: false, error: error.message };
  }
}

// Executar teste
testLogin().then(result => {
  console.log('Resultado final:', result);
});
