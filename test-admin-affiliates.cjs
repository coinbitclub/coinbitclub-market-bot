const axios = require('axios');

// Configuração da API
const API_URL = 'http://localhost:9997/api';

// Token de admin (substitua pelo token real após login)
let adminToken = '';

// Função para fazer login como admin
async function loginAsAdmin() {
  try {
    console.log('🔑 Fazendo login como administrador...');
    
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@coinbitclub.com',
      password: 'admin123'
    });

    if (response.data.success) {
      adminToken = response.data.token;
      console.log('✅ Login de admin realizado com sucesso');
      console.log(`Token: ${adminToken.substring(0, 20)}...`);
      return true;
    } else {
      console.log('❌ Erro no login:', response.data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro de conexão no login:', error.message);
    return false;
  }
}

// Função para testar listagem de afiliados
async function testGetAffiliates() {
  try {
    console.log('\\n📋 Testando listagem de afiliados...');
    
    const response = await axios.get(`${API_URL}/admin/affiliates?page=1&limit=10`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      console.log('✅ Afiliados carregados com sucesso');
      console.log(`Total de afiliados: ${response.data.pagination.total}`);
      console.log('Primeiros afiliados:');
      response.data.affiliates.forEach((affiliate, index) => {
        console.log(`  ${index + 1}. ${affiliate.name} (${affiliate.affiliate_code}) - ${affiliate.account_type}`);
      });
    } else {
      console.log('❌ Erro ao carregar afiliados:', response.data.error);
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.response?.data?.error || error.message);
  }
}

// Função para testar criação de afiliado
async function testCreateAffiliate() {
  try {
    console.log('\\n➕ Testando criação de afiliado...');
    
    const newAffiliate = {
      name: 'João Teste Silva',
      email: `joao.teste.${Date.now()}@exemplo.com`,
      phone: '+5511987654321',
      country: 'BR',
      accountType: 'testnet'
    };

    console.log('Dados do novo afiliado:', newAffiliate);

    const response = await axios.post(`${API_URL}/admin/affiliates`, newAffiliate, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      console.log('✅ Afiliado criado com sucesso!');
      console.log(`ID: ${response.data.affiliate.id}`);
      console.log(`Código: ${response.data.affiliate.affiliateCode}`);
      console.log(`Senha temporária: ${response.data.affiliate.tempPassword}`);
      
      return response.data.affiliate;
    } else {
      console.log('❌ Erro ao criar afiliado:', response.data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.response?.data?.error || error.message);
    return null;
  }
}

// Função para testar alteração de status
async function testToggleAffiliateStatus(affiliateId) {
  try {
    console.log(`\\n🔄 Testando alteração de status do afiliado ${affiliateId}...`);
    
    // Primeiro desativa
    let response = await axios.patch(`${API_URL}/admin/affiliates/${affiliateId}/toggle`, {
      action: 'deactivate'
    }, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      console.log('✅ Afiliado desativado com sucesso');
    } else {
      console.log('❌ Erro ao desativar:', response.data.error);
      return;
    }

    // Aguarda um pouco e reativa
    await new Promise(resolve => setTimeout(resolve, 1000));

    response = await axios.patch(`${API_URL}/admin/affiliates/${affiliateId}/toggle`, {
      action: 'activate'
    }, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      console.log('✅ Afiliado reativado com sucesso');
    } else {
      console.log('❌ Erro ao reativar:', response.data.error);
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.response?.data?.error || error.message);
  }
}

// Função para testar autorização (deve falhar sem token admin)
async function testUnauthorizedAccess() {
  try {
    console.log('\\n🚫 Testando acesso não autorizado...');
    
    const response = await axios.get(`${API_URL}/admin/affiliates`, {
      headers: {
        'Authorization': 'Bearer token_invalido',
        'Content-Type': 'application/json'
      }
    });

    console.log('❌ Erro: acesso deveria ter sido negado');
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('✅ Acesso negado corretamente:', error.response.data.error);
    } else {
      console.log('❌ Erro inesperado:', error.message);
    }
  }
}

// Função principal de teste
async function runAdminAffiliateTests() {
  console.log('🚀 Iniciando testes da administração de afiliados...');
  console.log('='.repeat(50));

  // Teste de acesso não autorizado
  await testUnauthorizedAccess();

  // Login como admin
  const loginSuccess = await loginAsAdmin();
  if (!loginSuccess) {
    console.log('❌ Não foi possível fazer login como admin. Abortando testes.');
    return;
  }

  // Teste de listagem
  await testGetAffiliates();

  // Teste de criação
  const newAffiliate = await testCreateAffiliate();

  // Se criou com sucesso, testa alteração de status
  if (newAffiliate && newAffiliate.id) {
    await testToggleAffiliateStatus(newAffiliate.id);
  }

  // Lista novamente para ver as mudanças
  await testGetAffiliates();

  console.log('\\n' + '='.repeat(50));
  console.log('✅ Testes da administração de afiliados concluídos!');
}

// Executa os testes
runAdminAffiliateTests().catch(error => {
  console.error('❌ Erro geral nos testes:', error.message);
});
