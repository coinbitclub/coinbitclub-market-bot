import axios from 'axios';

// Configuração da API centralizada
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas de erro
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// ====== SERVIÇOS DE DESPESAS ======
export const expenseService = {
  async getAll(filters?: {
    category?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }) {
    const response = await api.get('/expenses', { params: filters });
    return response.data;
  },

  async create(expense: {
    description: string;
    amount: number;
    category: string;
    date: string;
    paymentMethod: string;
    status: string;
    notes?: string;
    isSubscription?: boolean;
    subscriptionType?: string;
    nextDueDate?: string;
  }) {
    const response = await api.post('/expenses', expense);
    return response.data;
  },

  async update(id: string, expense: Partial<any>) {
    const response = await api.put(`/expenses/${id}`, expense);
    return response.data;
  },

  async delete(id: string) {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  },

  async cancelSubscription(id: string) {
    const response = await api.patch(`/expenses/${id}/cancel-subscription`);
    return response.data;
  },

  async getUpcoming() {
    const response = await api.get('/expenses/upcoming');
    return response.data;
  },

  async exportCsv(filters?: any) {
    const response = await api.get('/expenses/export', { 
      params: filters,
      responseType: 'blob'
    });
    return response.data;
  }
};

// ====== SERVIÇOS DE AFILIADOS ======
export const affiliateService = {
  async getAll(filters?: {
    status?: string;
    plan?: string;
    search?: string;
    isVip?: boolean;
  }) {
    const response = await api.get('/affiliates', { params: filters });
    return response.data;
  },

  async create(affiliate: {
    name: string;
    email: string;
    phone?: string;
    country?: string;
    isVip: boolean;
    commission_rate?: number;
    vipCommissionRate?: number;
    userId?: string;
  }) {
    const response = await api.post('/affiliates', affiliate);
    return response.data;
  },

  async update(id: string, affiliate: Partial<any>) {
    const response = await api.put(`/affiliates/${id}`, affiliate);
    return response.data;
  },

  async delete(id: string) {
    const response = await api.delete(`/affiliates/${id}`);
    return response.data;
  },

  async getReferrals(affiliateId: string) {
    const response = await api.get(`/affiliates/${affiliateId}/referrals`);
    return response.data;
  },

  async getCommissions(affiliateId?: string) {
    const url = affiliateId ? `/affiliates/${affiliateId}/commissions` : '/commissions';
    const response = await api.get(url);
    return response.data;
  },

  async payCommission(commissionId: string, paymentData: {
    amount: number;
    paymentMethod: string;
    notes?: string;
  }) {
    const response = await api.post(`/commissions/${commissionId}/pay`, paymentData);
    return response.data;
  },

  async linkUser(affiliateId: string, userId: string) {
    const response = await api.post(`/affiliates/${affiliateId}/link-user`, { userId });
    return response.data;
  },

  async generateReport(affiliateId: string, period: string) {
    const response = await api.get(`/affiliates/${affiliateId}/report`, {
      params: { period },
      responseType: 'blob'
    });
    return response.data;
  }
};

// ====== SERVIÇOS DE CONTABILIDADE ======
export const accountingService = {
  async getFinancialSummary(period: string = 'month') {
    const response = await api.get('/accounting/summary', { params: { period } });
    return response.data;
  },

  async getMonthlyView(year: number, month: number) {
    const response = await api.get('/accounting/monthly', { 
      params: { year, month } 
    });
    return response.data;
  },

  async getTransactions(filters?: {
    type?: string;
    dateFrom?: string;
    dateTo?: string;
    category?: string;
  }) {
    const response = await api.get('/accounting/transactions', { params: filters });
    return response.data;
  },

  async exportReport(type: string, period: string) {
    const response = await api.get('/accounting/export', {
      params: { type, period },
      responseType: 'blob'
    });
    return response.data;
  },

  async getBalanceSheet() {
    const response = await api.get('/accounting/balance-sheet');
    return response.data;
  },

  async getProfitLoss(period: string) {
    const response = await api.get('/accounting/profit-loss', { params: { period } });
    return response.data;
  }
};

// ====== SERVIÇOS DE SISTEMA ======
export const systemService = {
  async getLogs(filters?: {
    level?: string;
    service?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }) {
    const response = await api.get('/system/logs', { params: filters });
    return response.data;
  },

  async getSystemHealth() {
    const response = await api.get('/system/health');
    return response.data;
  },

  async stopAllOperations() {
    const response = await api.post('/system/emergency/stop-all');
    return response.data;
  },

  async restartTrading() {
    const response = await api.post('/system/emergency/restart-trading');
    return response.data;
  },

  async restartServices() {
    const response = await api.post('/system/emergency/restart-services');
    return response.data;
  },

  async getSystemMetrics() {
    const response = await api.get('/system/metrics');
    return response.data;
  },

  async exportLogs(filters?: any) {
    const response = await api.get('/system/logs/export', {
      params: filters,
      responseType: 'blob'
    });
    return response.data;
  }
};

// ====== SERVIÇOS DE CONFIGURAÇÕES ======
export const settingsService = {
  async getConfig() {
    const response = await api.get('/settings');
    return response.data;
  },

  async getSystemConfig() {
    const response = await api.get('/admin/system-config');
    return response.data;
  },

  async updateConfig(section: string, data: any) {
    const response = await api.patch(`/settings/${section}`, data);
    return response.data;
  },

  async updateSystemConfig(config: any) {
    const response = await api.put('/admin/system-config', config);
    return response.data;
  },

  async testEmailConfig(config: any) {
    const response = await api.post('/settings/test-email', config);
    return response.data;
  },

  async testConnection(type: string, config: any) {
    const response = await api.post(`/settings/test-${type}`, config);
    return response.data;
  },

  async backup() {
    const response = await api.post('/settings/backup', {}, {
      responseType: 'blob'
    });
    return response.data;
  },

  async restore(file: File) {
    const formData = new FormData();
    formData.append('backup', file);
    const response = await api.post('/settings/restore', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};

// ====== SERVIÇOS DE NOTIFICAÇÕES ======
export const notificationService = {
  async getAll(filters?: {
    type?: string;
    read?: boolean;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const response = await api.get('/notifications', { params: filters });
    return response.data;
  },

  async markAsRead(id: string) {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  async markAllAsRead() {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },

  async send(notification: {
    type: string;
    title: string;
    message: string;
    recipients?: string[];
    data?: any;
  }) {
    const response = await api.post('/notifications', notification);
    return response.data;
  },

  async delete(id: string) {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  }
};

// ====== SERVIÇOS DE USUÁRIOS ======
export const userService = {
  async getAll(filters?: {
    status?: string;
    plan?: string;
    search?: string;
  }) {
    const response = await api.get('/users', { params: filters });
    return response.data;
  },

  async getById(id: string) {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  async update(id: string, data: any) {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  async getTradingHistory(userId: string, filters?: any) {
    const response = await api.get(`/users/${userId}/trading-history`, { params: filters });
    return response.data;
  },

  async getWallet(userId: string) {
    const response = await api.get(`/users/${userId}/wallet`);
    return response.data;
  },

  async searchUsers(query: string) {
    const response = await api.get('/users/search', { params: { q: query } });
    return response.data;
  }
};

// ====== UTILITÁRIOS ======
export const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const formatError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'Erro desconhecido';
};

export default api;
