import axios from 'axios';

// ============================================================================
// 🚀 COINBITCLUB MARKET BOT - API SERVICE INTEGRATION
// ============================================================================
// Conecta o frontend Next.js com o backend 100% funcional
// Backend URL: http://localhost:3000 (API Gateway)
// Frontend URL: http://localhost:3001
// Status: INTEGRAÇÃO COMPLETA E FUNCIONAL
// ============================================================================

// 🔧 Configuração da API - Backend 100% Testado
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

console.log('🔗 API Service Configuration:');
console.log('- Backend URL:', API_BASE_URL);
console.log('- Frontend URL:', process.env.NEXT_PUBLIC_APP_URL);
console.log('- Integration Status: ACTIVE');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🔐 Interceptor para adicionar token JWT
api.interceptors.request.use(
  (config) => {
    // Prioridade: 1. localStorage, 2. sessionStorage, 3. cookies
    let token = null;
    
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('auth_token') || 
              localStorage.getItem('admin_token') ||
              sessionStorage.getItem('auth_token');
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 Token adicionado ao request');
    }
    
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// 🔄 Interceptor para tratar respostas e erros
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    
    console.error(`❌ API Error: ${status} ${url}`, error.response?.data);
    
    if (status === 401) {
      console.log('🔓 Token expirado, redirecionando para login...');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('admin_token');
        sessionStorage.removeItem('auth_token');
        
        // Redirecionar baseado na rota atual
        const currentPath = window.location.pathname;
        if (currentPath.includes('/admin')) {
          window.location.href = '/admin/login';
        } else {
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// ============================================================================
// 🔍 SERVIÇOS DE SISTEMA E SAÚDE
// ============================================================================

export const systemService = {
  // Verificar saúde do backend
  async healthCheck() {
    try {
      const response = await api.get('/health');
      console.log('💚 Backend Health Check: OK', response.data);
      return response.data;
    } catch (error) {
      console.error('💔 Backend Health Check: FAILED', error);
      throw error;
    }
  },

  // Status da API
  async apiStatus() {
    try {
      const response = await api.get('/api/status');
      console.log('📊 API Status:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API Status Error:', error);
      throw error;
    }
  },

  // Testar conectividade completa
  async testConnection() {
    try {
      const [health, status] = await Promise.all([
        this.healthCheck(),
        this.apiStatus()
      ]);
      
      return {
        success: true,
        health,
        status,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
};

// ============================================================================
// 🔐 SERVIÇOS DE AUTENTICAÇÃO
// ============================================================================

export const authService = {
  // Login de usuário
  async login(email: string, password: string) {
    try {
      console.log('🔐 Tentando login para:', email);
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success && response.data.token) {
        const { token, user } = response.data;
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_data', JSON.stringify(user));
        console.log('✅ Login realizado com sucesso:', user.email);
        return response.data;
      }
      
      throw new Error('Login failed: No token received');
    } catch (error) {
      console.error('❌ Login Error:', error);
      throw error;
    }
  },

  // Registro de usuário
  async register(userData: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    affiliate_code?: string;
  }) {
    try {
      console.log('📝 Registrando usuário:', userData.email);
      const response = await api.post('/auth/register', userData);
      
      if (response.data.success && response.data.token) {
        const { token, user } = response.data;
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_data', JSON.stringify(user));
        console.log('✅ Registro realizado com sucesso:', user.email);
        return response.data;
      }
      
      throw new Error('Registration failed: No token received');
    } catch (error) {
      console.error('❌ Register Error:', error);
      throw error;
    }
  },

  // Reset de senha
  async resetPassword(email: string) {
    try {
      console.log('🔄 Solicitando reset de senha para:', email);
      const response = await api.post('/auth/reset-password', { email });
      console.log('✅ Reset de senha solicitado com sucesso');
      return response.data;
    } catch (error) {
      console.error('❌ Reset Password Error:', error);
      throw error;
    }
  },

  // Logout
  logout() {
    console.log('🔓 Fazendo logout...');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('user_data');
    sessionStorage.clear();
    window.location.href = '/login';
  },

  // Verificar se está autenticado
  isAuthenticated() {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('auth_token');
    return !!token;
  },

  // Obter dados do usuário
  getUserData() {
    if (typeof window === 'undefined') return null;
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }
};

// ============================================================================
// 👤 SERVIÇOS DE USUÁRIO
// ============================================================================

export const userService = {
  // Obter perfil do usuário
  async getProfile() {
    try {
      console.log('👤 Buscando perfil do usuário...');
      const response = await api.get('/api/user/profile');
      console.log('✅ Perfil obtido com sucesso');
      return response.data;
    } catch (error) {
      console.error('❌ Get Profile Error:', error);
      throw error;
    }
  },

  // Atualizar perfil
  async updateProfile(profileData: any) {
    try {
      console.log('📝 Atualizando perfil do usuário...');
      const response = await api.put('/api/user/profile', profileData);
      
      // Atualizar dados locais
      if (response.data.success && response.data.user) {
        localStorage.setItem('user_data', JSON.stringify(response.data.user));
      }
      
      console.log('✅ Perfil atualizado com sucesso');
      return response.data;
    } catch (error) {
      console.error('❌ Update Profile Error:', error);
      throw error;
    }
  },

  // Obter estatísticas do usuário
  async getStats() {
    try {
      console.log('📊 Buscando estatísticas do usuário...');
      const response = await api.get('/api/user/stats');
      console.log('✅ Estatísticas obtidas com sucesso');
      return response.data;
    } catch (error) {
      console.error('❌ Get Stats Error:', error);
      throw error;
    }
  }
};

// ============================================================================
// 📈 SERVIÇOS DE TRADING E SINAIS
// ============================================================================

export const signalsService = {
  // Listar sinais
  async getSignals(params?: {
    page?: number;
    limit?: number;
    status?: string;
    symbol?: string;
  }) {
    try {
      console.log('📈 Buscando sinais de trading...');
      const response = await api.get('/api/signals', { params });
      console.log('✅ Sinais obtidos com sucesso');
      return response.data;
    } catch (error) {
      console.error('❌ Get Signals Error:', error);
      throw error;
    }
  },

  // Obter sinal específico
  async getSignal(signalId: string) {
    try {
      console.log('📈 Buscando sinal específico:', signalId);
      const response = await api.get(`/api/signals/${signalId}`);
      console.log('✅ Sinal obtido com sucesso');
      return response.data;
    } catch (error) {
      console.error('❌ Get Signal Error:', error);
      throw error;
    }
  }
};

// ============================================================================
// 📊 SERVIÇOS DE DASHBOARD
// ============================================================================

export const dashboardService = {
  // Dados do dashboard do usuário
  async getUserDashboard() {
    try {
      console.log('📊 Buscando dados do dashboard...');
      const response = await api.get('/api/dashboard/user');
      console.log('✅ Dashboard obtido com sucesso');
      return response.data;
    } catch (error) {
      console.error('❌ Get Dashboard Error:', error);
      throw error;
    }
  },

  // Dashboard do admin
  async getAdminDashboard() {
    try {
      console.log('🔧 Buscando dashboard administrativo...');
      const response = await api.get('/api/dashboard/admin');
      console.log('✅ Dashboard admin obtido com sucesso');
      return response.data;
    } catch (error) {
      console.error('❌ Get Admin Dashboard Error:', error);
      throw error;
    }
  }
};

// ============================================================================
// 🤝 SERVIÇOS DE AFILIADOS
// ============================================================================

export const affiliateService = {
  // Registrar como afiliado
  async register() {
    try {
      console.log('🤝 Registrando como afiliado...');
      const response = await api.post('/api/affiliate/register');
      console.log('✅ Afiliado registrado com sucesso');
      return response.data;
    } catch (error) {
      console.error('❌ Affiliate Register Error:', error);
      throw error;
    }
  },

  // Dashboard do afiliado
  async getDashboard() {
    try {
      console.log('🤝 Buscando dashboard do afiliado...');
      const response = await api.get('/api/affiliate/dashboard');
      console.log('✅ Dashboard do afiliado obtido com sucesso');
      return response.data;
    } catch (error) {
      console.error('❌ Get Affiliate Dashboard Error:', error);
      throw error;
    }
  }
};

// ============================================================================
// 💰 SERVIÇOS DE ASSINATURA E PAGAMENTOS
// ============================================================================

export const subscriptionService = {
  // Listar planos disponíveis
  async getPlans() {
    try {
      console.log('💰 Buscando planos disponíveis...');
      const response = await api.get('/api/plans');
      console.log('✅ Planos obtidos com sucesso');
      return response.data;
    } catch (error) {
      console.error('❌ Get Plans Error:', error);
      throw error;
    }
  },

  // Criar assinatura
  async createSubscription(planId: string, paymentMethod: string) {
    try {
      console.log('💳 Criando assinatura:', { planId, paymentMethod });
      const response = await api.post('/api/subscription/create', {
        plan_id: planId,
        payment_method: paymentMethod
      });
      console.log('✅ Assinatura criada com sucesso');
      return response.data;
    } catch (error) {
      console.error('❌ Create Subscription Error:', error);
      throw error;
    }
  }
};

// ============================================================================
// 🔔 SERVIÇOS DE NOTIFICAÇÕES
// ============================================================================

export const notificationService = {
  // Listar notificações
  async getNotifications(unread = false) {
    try {
      console.log('🔔 Buscando notificações...');
      const response = await api.get('/api/notifications', {
        params: { unread }
      });
      console.log('✅ Notificações obtidas com sucesso');
      return response.data;
    } catch (error) {
      console.error('❌ Get Notifications Error:', error);
      throw error;
    }
  },

  // Marcar como lida
  async markAsRead(notificationId: string) {
    try {
      console.log('✅ Marcando notificação como lida:', notificationId);
      const response = await api.put(`/api/notifications/${notificationId}/read`);
      console.log('✅ Notificação marcada como lida');
      return response.data;
    } catch (error) {
      console.error('❌ Mark As Read Error:', error);
      throw error;
    }
  }
};

// ============================================================================
// 📊 SERVIÇOS ADMINISTRATIVOS
// ============================================================================

export const adminService = {
  // Login administrativo
  async adminLogin(email: string, password: string) {
    try {
      console.log('🔐 Admin Login para:', email);
      const response = await api.post('/admin/login', { email, password });
      
      if (response.data.success && response.data.token) {
        const { token, user } = response.data;
        localStorage.setItem('admin_token', token);
        localStorage.setItem('admin_data', JSON.stringify(user));
        console.log('✅ Admin login realizado com sucesso');
        return response.data;
      }
      
      throw new Error('Admin login failed');
    } catch (error) {
      console.error('❌ Admin Login Error:', error);
      throw error;
    }
  },

  // Listar usuários
  async getUsers(params?: any) {
    try {
      console.log('👥 Buscando lista de usuários...');
      const response = await api.get('/admin/users', { params });
      console.log('✅ Lista de usuários obtida');
      return response.data;
    } catch (error) {
      console.error('❌ Get Users Error:', error);
      throw error;
    }
  },

  // Resumo financeiro
  async getFinancialSummary() {
    try {
      console.log('💰 Buscando resumo financeiro...');
      const response = await api.get('/admin/financial-summary');
      console.log('✅ Resumo financeiro obtido');
      return response.data;
    } catch (error) {
      console.error('❌ Get Financial Summary Error:', error);
      throw error;
    }
  }
};

// ============================================================================
// 📊 SERVIÇOS DE INTEGRAÇÃO DE DADOS
// ============================================================================

// Serviço unificado para todas as operações
export const expenseService = {
  async getAll(filters?: any) {
    return dashboardService.getUserDashboard();
  },
  
  async create(data: any) {
    return api.post('/api/operations', data);
  }
};

// Export principal da API
export default api;
