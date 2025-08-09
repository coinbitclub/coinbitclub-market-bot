import { apiUtils } from '../utils/api';

// Serviço de Autenticação
export const authService = {
  // Login
  login: async (email, password) => {
    return await apiUtils.post('/auth/login', { email, password });
  },

  // Registro
  register: async (userData) => {
    return await apiUtils.post('/auth/register', userData);
  },

  // Reset de senha
  resetPassword: async (email) => {
    return await apiUtils.post('/auth/reset-password', { email });
  },

  // Forgot password via WhatsApp
  forgotPasswordWhatsApp: async (phone) => {
    return await apiUtils.post('/auth/forgot-password-whatsapp', { phone });
  },

  // Reset password with token
  resetPasswordWithToken: async (token, newPassword) => {
    return await apiUtils.post('/auth/reset-password', { token, password: newPassword });
  }
};

// Serviço de Usuário
export const userService = {
  // Obter perfil
  getProfile: async () => {
    return await apiUtils.get('/api/user/profile');
  },

  // Atualizar perfil
  updateProfile: async (profileData) => {
    return await apiUtils.put('/api/user/profile', profileData);
  },

  // Obter configurações
  getSettings: async () => {
    return await apiUtils.get('/api/settings/user');
  },

  // Atualizar configurações
  updateSettings: async (settings) => {
    return await apiUtils.put('/api/settings/user', settings);
  }
};

// Serviço de Dashboard
export const dashboardService = {
  // Dashboard do usuário
  getUserDashboard: async () => {
    return await apiUtils.get('/api/dashboard/user');
  },

  // Dashboard do admin
  getAdminDashboard: async () => {
    return await apiUtils.get('/api/dashboard/admin');
  },

  // Dashboard do afiliado
  getAffiliateDashboard: async () => {
    return await apiUtils.get('/api/dashboard/affiliate');
  }
};

// Serviço Financeiro
export const financialService = {
  // Obter saldo
  getBalance: async () => {
    return await apiUtils.get('/api/financial/balance');
  },

  // Obter transações
  getTransactions: async (page = 1, limit = 20) => {
    return await apiUtils.get(`/api/financial/transactions?page=${page}&limit=${limit}`);
  },

  // Processar pagamento
  processPayment: async (paymentData) => {
    return await apiUtils.post('/api/payments/process', paymentData);
  },

  // Obter métodos de pagamento
  getPaymentMethods: async () => {
    return await apiUtils.get('/api/payments/methods');
  },

  // Solicitar reembolso
  requestRefund: async (refundData) => {
    return await apiUtils.post('/api/financial/refunds', refundData);
  }
};

// Serviço de Operações/Trading
export const tradingService = {
  // Obter operações
  getOperations: async (page = 1, limit = 20) => {
    return await apiUtils.get(`/api/operations?page=${page}&limit=${limit}`);
  },

  // Obter sinais de trading
  getSignals: async (page = 1, limit = 20) => {
    return await apiUtils.get(`/api/trading/signals?page=${page}&limit=${limit}`);
  },

  // Obter dados de mercado
  getMarketData: async () => {
    return await apiUtils.get('/api/market/current');
  },

  // Obter análise de performance
  getPerformanceAnalytics: async () => {
    return await apiUtils.get('/api/analytics/performance');
  },

  // Obter resumo de análise
  getAnalyticsSummary: async () => {
    return await apiUtils.get('/api/analytics/summary');
  }
};

// Serviço de Assinatura
export const subscriptionService = {
  // Obter assinatura atual
  getCurrentSubscription: async () => {
    return await apiUtils.get('/api/subscriptions/current');
  },

  // Obter planos disponíveis
  getPlans: async () => {
    return await apiUtils.get('/api/plans');
  },

  // Criar assinatura
  createSubscription: async (planId, paymentMethod) => {
    return await apiUtils.post('/api/subscription/create', {
      plan_id: planId,
      payment_method: paymentMethod
    });
  },

  // Cancelar assinatura
  cancelSubscription: async () => {
    return await apiUtils.post('/api/subscription/cancel');
  }
};

// Serviço de Afiliados
export const affiliateService = {
  // Registrar como afiliado
  register: async () => {
    return await apiUtils.post('/api/affiliate/register');
  },

  // Obter dashboard do afiliado
  getDashboard: async () => {
    return await apiUtils.get('/api/affiliate/dashboard');
  },

  // Obter histórico de comissões
  getCommissionHistory: async (page = 1, limit = 20) => {
    return await apiUtils.get(`/api/affiliate/commission-history?page=${page}&limit=${limit}`);
  },

  // Obter créditos do afiliado
  getCredits: async () => {
    return await apiUtils.get('/api/affiliate/credits');
  }
};

// Serviço de Notificações
export const notificationService = {
  // Obter notificações
  getNotifications: async (unread = false) => {
    const url = unread ? '/api/notifications?unread=true' : '/api/notifications';
    return await apiUtils.get(url);
  },

  // Marcar notificação como lida
  markAsRead: async (notificationId) => {
    return await apiUtils.put(`/api/notifications/${notificationId}/read`);
  },

  // Marcar todas como lidas
  markAllAsRead: async () => {
    return await apiUtils.post('/api/notifications/mark-read');
  }
};

// Serviço de WhatsApp
export const whatsappService = {
  // Obter status do WhatsApp
  getStatus: async () => {
    return await apiUtils.get('/api/whatsapp/status');
  },

  // Enviar mensagem
  sendMessage: async (phone, message) => {
    return await apiUtils.post('/api/whatsapp/send-message', { phone, message });
  },

  // Enviar código de verificação
  sendVerification: async (whatsappNumber, message) => {
    return await apiUtils.post('/api/whatsapp/send-verification', {
      whatsappNumber,
      message
    });
  },

  // Iniciar verificação
  startVerification: async (whatsappNumber) => {
    return await apiUtils.post('/api/whatsapp/start-verification', {
      whatsappNumber
    });
  },

  // Enviar código de reset
  sendResetCode: async (phone) => {
    return await apiUtils.post('/api/whatsapp/send-reset-code', { phone });
  }
};

// Serviço de Administração
export const adminService = {
  // Obter usuários
  getUsers: async (page = 1, limit = 20) => {
    return await apiUtils.get(`/api/admin/users?page=${page}&limit=${limit}`);
  },

  // Buscar usuários
  searchUsers: async (query) => {
    return await apiUtils.get(`/api/admin/users/search?q=${encodeURIComponent(query)}`);
  },

  // Status do banco de dados
  getDatabaseStatus: async () => {
    return await apiUtils.get('/api/admin/db-status');
  },

  // Logs do sistema
  getSystemLogs: async () => {
    return await apiUtils.get('/api/admin/system-logs');
  },

  // Estatísticas do WhatsApp
  getWhatsAppStats: async () => {
    return await apiUtils.get('/api/admin/whatsapp-stats');
  },

  // Resumo financeiro
  getFinancialSummary: async () => {
    return await apiUtils.get('/api/admin/financial-summary');
  },

  // Relatórios de afiliados
  getAffiliateReports: async () => {
    return await apiUtils.get('/api/admin/affiliate-reports');
  }
};

// Serviço de Testes
export const testService = {
  // Testar banco de dados
  testDatabase: async () => {
    return await apiUtils.get('/api/test/database');
  },

  // Testar autenticação
  testAuth: async () => {
    return await apiUtils.get('/api/test/auth');
  },

  // Testar Zapi
  testZapi: async () => {
    return await apiUtils.get('/api/test/zapi');
  },

  // Obter endpoints disponíveis
  getEndpoints: async () => {
    return await apiUtils.get('/api/test/endpoints');
  }
};

export default {
  auth: authService,
  user: userService,
  dashboard: dashboardService,
  financial: financialService,
  trading: tradingService,
  subscription: subscriptionService,
  affiliate: affiliateService,
  notification: notificationService,
  whatsapp: whatsappService,
  admin: adminService,
  test: testService
};
