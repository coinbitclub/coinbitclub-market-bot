const axios = require('axios');

async function testServer() {
  try {
    console.log('🔍 Testando servidor...');
    
    // Testa endpoint básico
    const response = await axios.get('http://localhost:9997/api/test');
    console.log('✅ Servidor respondeu:', response.data);
    
    // Testa login
    const loginResponse = await axios.post('http://localhost:9997/api/auth/login', {
      email: 'admin@coinbitclub.com',
      password: 'admin123'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Login funcionando');
      const token = loginResponse.data.token;
      
      // Testa endpoint de admin
      try {
        const adminResponse = await axios.get('http://localhost:9997/api/admin/affiliates', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('✅ Endpoint admin funcionando:', adminResponse.data);
      } catch (adminError) {
        console.log('❌ Erro no endpoint admin:', adminError.response?.status, adminError.response?.data);
      }
    }
    
  } catch (error) {
    console.log('❌ Erro:', error.response?.status, error.response?.data || error.message);
  }
}

testServer();
