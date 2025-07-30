console.log('🔥 TESTE RÁPIDO DE LOGIN');
console.log('=========================');

async function testeRapido() {
  try {
    console.log('1. Testando conexão com o servidor...');
    
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'faleconosco@coinbitclub.vip',
        password: 'password'
      })
    });
    
    console.log('2. Status da resposta:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ LOGIN FUNCIONANDO!');
      console.log('   Usuário:', data.user.name);
      console.log('   Role:', data.user.role);
      console.log('   Token gerado:', data.token ? 'SIM' : 'NÃO');
      console.log('');
      console.log('🎯 RESULTADO: SISTEMA OPERACIONAL ✅');
    } else {
      console.log('❌ ERRO:', response.status);
      const errorData = await response.text();
      console.log('   Detalhes:', errorData);
    }
    
  } catch (error) {
    console.log('❌ ERRO DE CONEXÃO:', error.message);
  }
}

// Executar teste
testeRapido();
