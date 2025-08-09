// Script para testar login de admin
const testAdminLogin = async () => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@coinbitclub.com',
        password: 'admin123'
      }),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Login successful:', result);
      
      // Salvar no localStorage
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      
      // Redirecionar para dashboard
      window.location.href = '/admin/dashboard-premium-fixed';
    } else {
      console.error('❌ Login failed:', result);
      alert('Falha no login: ' + result.message);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    alert('Erro de conexão');
  }
};

// Executar teste quando página carregar
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', testAdminLogin);
}

// Exportar para uso manual
window.testAdminLogin = testAdminLogin;
