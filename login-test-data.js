// Teste de login integrado com o sistema OTP
// Para usar na página de login atual

const loginData = {
  // Usuário configurado para OTP SMS
  email: 'faleconosco@coinbitclub.vip',
  password: 'password', // Senha padrão
  
  // Dados para teste OTP
  phone: '5521987386645', // Telefone cadastrado
  
  // URLs dos endpoints
  loginEndpoint: '/api/auth/login',
  otpRequestEndpoint: '/api/auth/request-otp',
  otpVerifyEndpoint: '/api/auth/verify-otp',
  
  // Dados esperados
  expectedUser: {
    name: 'ERICA ANDRADE',
    email: 'faleconosco@coinbitclub.vip',
    role: 'admin',
    status: 'trial_active'
  }
};

console.log('📋 Dados de teste para login:');
console.log('Email:', loginData.email);
console.log('Senha:', loginData.password);
console.log('Telefone SMS:', loginData.phone);
console.log('Role esperada:', loginData.expectedUser.role);

// Para testar na página atual:
// 1. Digite: faleconosco@coinbitclub.vip
// 2. Senha: password
// 3. Se houver opção OTP SMS, use o telefone: 5521987386645
