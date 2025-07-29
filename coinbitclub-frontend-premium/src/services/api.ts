import axios from 'axios';

// ============================================================================
// 🚀 COINBITCLUB MARKET BOT - API SERVICE PREMIUM INTEGRATION
// ============================================================================
// Conecta o frontend Premium com o backend Railway 100% funcional
// Backend URL: https://coinbitclub-market-bot.up.railway.app
// Frontend URL: Vercel Deploy
// Status: INTEGRAÇÃO PREMIUM COMPLETA
// ============================================================================

// 🔧 Configuração da API - Backend Railway 100% Testado
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://coinbitclub-market-bot.up.railway.app';

console.log('🔗 API Service Premium Configuration:');
console.log('- Backend URL:', API_BASE_URL);
console.log('- Frontend URL:', process.env.NEXT_PUBLIC_APP_URL);
console.log('- Integration Status: PREMIUM ACTIVE');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// 🔐 Interceptor para adicionar token JWT automaticamente
api.interceptors.request.use(
  (config) => {
    // Prioridade: 1. localStorage, 2. sessionStorage, 3. zustand store
    let token = null;
    
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('auth_token') || 
              localStorage.getItem('admin_token') ||
              sessionStorage.getItem('auth_token');
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 Token JWT adicionado ao request');
    }
    
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      hasToken: !!token,
      url: config.url
    });
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// 🛡️ Interceptor para tratar respostas e erros
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      hasData: !!response.data
    });
    return response;
  },
  async (error) => {
    console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });

    // 🔄 Se token expirou (401), tentar renovar
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      
      try {
        const refreshResponse = await api.post('/api/auth/refresh');
        const newToken = refreshResponse.data.token;
        
        if (newToken && typeof window !== 'undefined') {
          localStorage.setItem('auth_token', newToken);
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return api.request(error.config);
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        // Limpar dados de autenticação e redirecionar
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          window.location.href = '/auth/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// 🎯 SERVIÇOS DE AUTENTICAÇÃO
export class AuthService {
  // Login integrado com backend Railway
  static async login(credentials: { email: string; password: string }) {
    try {
      console.log('🔐 Tentando login para:', credentials.email);
      const response = await api.post('/api/auth/login', credentials);
      
      console.log('✅ Login bem-sucedido:', {
        hasToken: !!response.data.token,
        userRole: response.data.user?.role,
        email: response.data.user?.email
      });
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro no login:', error.response?.data || error.message);
      throw error;
    }
  }

  // Cadastro integrado
  static async register(data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    referralCode?: string;
  }) {
    try {
      console.log('📝 Tentando cadastro para:', data.email);
      const response = await api.post('/api/auth/register', data);
      
      console.log('✅ Cadastro bem-sucedido');
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro no cadastro:', error.response?.data || error.message);
      throw error;
    }
  }

  // Esqueci senha
  static async forgotPassword(email: string) {
    return api.post('/api/auth/forgot-password', { email });
  }

  // Reset senha
  static async resetPassword(token: string, password: string) {
    return api.post('/api/auth/reset-password', { token, password });
  }

  // Solicitar OTP via SMS
  static async requestOTP(phone: string) {
    return api.post('/api/auth/request-otp', { phone });
  }

  // Verificar OTP
  static async verifyOTP(phone: string, code: string) {
    return api.post('/api/auth/verify-otp', { phone, code });
  }

  // Obter perfil
  static async getProfile() {
    return api.get('/api/auth/profile');
  }
}

// 📊 SERVIÇOS DE DASHBOARD
export class DashboardService {
  // Dashboard do usuário
  static async getUserDashboard() {
    try {
      console.log('📊 Buscando dashboard do usuário...');
      const response = await api.get('/api/user/dashboard');
      console.log('✅ Dashboard do usuário obtido com sucesso');
      return response.data;
    } catch (error) {
      console.error('❌ Get User Dashboard Error:', error);
      throw error;
    }
  }

  // Dashboard do admin
  static async getAdminDashboard() {
    try {
      console.log('🔧 Buscando dashboard administrativo...');
      const response = await api.get('/api/admin/dashboard');
      console.log('✅ Dashboard admin obtido com sucesso');
      return response.data;
    } catch (error) {
      console.error('❌ Get Admin Dashboard Error:', error);
      throw error;
    }
  }

  // Dashboard do afiliado
  static async getAffiliateDashboard() {
    try {
      console.log('🤝 Buscando dashboard do afiliado...');
      const response = await api.get('/api/affiliate/dashboard');
      console.log('✅ Dashboard afiliado obtido com sucesso');
      return response.data;
    } catch (error) {
      console.error('❌ Get Affiliate Dashboard Error:', error);
      throw error;
    }
  }

  // Status do sistema
  static async getSystemHealth() {
    return api.get('/api/system/health');
  }
}

// 🔄 SERVIÇOS DE OPERAÇÕES
export class OperationsService {
  // Operações do usuário
  static async getUserOperations(params?: any) {
    return api.get('/api/user/operations', { params });
  }

  // Operações admin
  static async getAdminOperations(params?: any) {
    return api.get('/api/admin/operations', { params });
  }

  // Fechar operação
  static async closeOperation(operationId: string) {
    return api.post(`/api/operations/${operationId}/close`);
  }

  // Detalhes da operação
  static async getOperationDetails(operationId: string) {
    return api.get(`/api/operations/${operationId}`);
  }
}

// 👥 SERVIÇOS DE USUÁRIOS (Admin)
export class UsersService {
  // Listar usuários
  static async getUsers(params?: any) {
    return api.get('/api/admin/users', { params });
  }

  // Detalhes do usuário
  static async getUserDetails(userId: string) {
    return api.get(`/api/admin/users/${userId}`);
  }

  // Criar usuário
  static async createUser(userData: any) {
    return api.post('/api/admin/users', userData);
  }

  // Atualizar usuário
  static async updateUser(userId: string, userData: any) {
    return api.put(`/api/admin/users/${userId}`, userData);
  }

  // Deletar usuário
  static async deleteUser(userId: string) {
    return api.delete(`/api/admin/users/${userId}`);
  }
}

// 🤝 SERVIÇOS DE AFILIADOS
export class AffiliateService {
  // Dashboard
  static async getDashboard() {
    return api.get('/api/affiliate/dashboard');
  }

  // Comissões
  static async getCommissions(params?: any) {
    return api.get('/api/affiliate/commissions', { params });
  }

  // Solicitar pagamento
  static async requestPayment(amount: number) {
    return api.post('/api/affiliate/request-payment', { amount });
  }

  // Link de afiliado
  static async getAffiliateLink() {
    return api.get('/api/affiliate/link');
  }

  // Analytics
  static async getAnalytics() {
    return api.get('/api/affiliate/analytics');
  }
}

// 💰 SERVIÇOS FINANCEIROS
export class FinancialService {
  // Saldo
  static async getBalance() {
    return api.get('/api/financial/balance');
  }

  // Transações
  static async getTransactions(params?: any) {
    return api.get('/api/financial/transactions', { params });
  }

  // Relatórios financeiros
  static async getFinancialReports(params?: any) {
    return api.get('/api/admin/financial/reports', { params });
  }
}

// ⚙️ SERVIÇOS DE CONFIGURAÇÕES
export class SettingsService {
  // Configurações do usuário
  static async getUserSettings() {
    return api.get('/api/user/settings');
  }

  // Atualizar configurações do usuário
  static async updateUserSettings(settings: any) {
    return api.put('/api/user/settings', settings);
  }

  // Configurações do sistema
  static async getSystemSettings() {
    return api.get('/api/admin/settings');
  }

  // Atualizar configurações do sistema
  static async updateSystemSettings(settings: any) {
    return api.put('/api/admin/settings', settings);
  }
}

// 🔧 FUNÇÕES UTILITÁRIAS
export const apiUtils = {
  // Helper para requests GET
  get: async (url: string, params?: any) => {
    const response = await api.get(url, { params });
    return response.data;
  },

  // Helper para requests POST
  post: async (url: string, data?: any) => {
    const response = await api.post(url, data);
    return response.data;
  },

  // Helper para requests PUT
  put: async (url: string, data?: any) => {
    const response = await api.put(url, data);
    return response.data;
  },

  // Helper para requests DELETE
  delete: async (url: string) => {
    const response = await api.delete(url);
    return response.data;
  },

  // Configurar token manualmente
  setAuthToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  },

  // Limpar token
  clearAuthToken: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    }
  },

  // Verificar se está autenticado
  isAuthenticated: () => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('auth_token');
    }
    return false;
  }
};

// Export da instância principal
export default api;
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
