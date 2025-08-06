/**
 * SERVIÇO DE API CORRIGIDO - INTEGRAÇÃO REAL COM BACKEND
 * Substitui os dados mock por chamadas reais ao backend
 */
import axios from 'axios';

// Configuração base do axios com as rotas corretas
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// ========== SERVIÇOS ADMIN DASHBOARD ==========
export const adminDashboardService = {
  // ROTAS CORRETAS conforme backend dashboardController.js
  getDashboardData: () => api.get('/dashboard/admin'),
  getMarketReading: () => api.get('/dashboard/market-reading'),
  getSystemMetrics: () => api.get('/dashboard/metrics'),
  getOperations: () => api.get('/dashboard/operations'),
  getTradingViewSignals: () => api.get('/dashboard/tradingview-signals'),
  getCointarsSignals: () => api.get('/dashboard/cointars-signals'),
  getSystemLogs: () => api.get('/dashboard/system-logs'),
  getIngestorStrategies: () => api.get('/dashboard/ingestor-strategies'),
  
  // Métricas de retorno e assertividade
  getReturnMetrics: () => api.get('/dashboard/metrics'),
  getAccuracyMetrics: () => api.get('/dashboard/metrics'),
};

// ========== SERVIÇOS USUÁRIOS ==========
export const usersService = {
  // ROTAS CORRETAS conforme adminController.js
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserDetails: (userId) => api.get(`/admin/users/${userId}`),
  createUser: (userData) => api.post('/admin/users', userData),
  updateUser: (userId, userData) => api.put(`/admin/users/${userId}`, userData),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  resetPassword: (userId) => api.post(`/admin/users/${userId}/reset-password`),
  getUserActivity: (userId) => api.get(`/admin/users/${userId}/activity`),
};

// ========== SERVIÇOS OPERAÇÕES ==========  
export const operationsService = {
  // ROTA CORRIGIDA: /admin/operations
  getOperations: (params) => api.get('/admin/operations', { params }),
  getOperationDetails: (operationId) => api.get(`/admin/operations/${operationId}`),
  closeOperation: (operationId) => api.post(`/admin/operations/${operationId}/close`),
  getOperationsStats: () => api.get('/admin/operations/stats'),
};

// ========== SERVIÇOS AFILIADOS ==========
export const affiliatesService = {
  // ROTA CORRIGIDA: /admin/affiliates
  getAffiliates: (params) => api.get('/admin/affiliates', { params }),
  getAffiliateDetails: (affiliateId) => api.get(`/admin/affiliates/${affiliateId}`),
  updateCommissionRate: (affiliateId, rate) => api.put(`/admin/affiliates/${affiliateId}/commission`, { rate }),
  processCommissionPayment: (affiliateId, amount) => api.post(`/admin/affiliates/${affiliateId}/pay`, { amount }),
  getCommissionsReport: () => api.get('/admin/affiliates/commissions'),
};

// ========== SERVIÇOS CONTABILIDADE ==========
export const accountingService = {
  // ROTA CORRIGIDA: /admin/accounting
  getFinancialSummary: () => api.get('/admin/accounting'),
  getTransactions: (params) => api.get('/admin/accounting/transactions', { params }),
  createTransaction: (transactionData) => api.post('/admin/accounting/transactions', transactionData),
  getReports: (period) => api.get('/admin/accounting/reports', { params: { period } }),
  exportReport: (format, period) => api.get(`/admin/accounting/export/${format}`, { 
    params: { period },
    responseType: 'blob'
  }),
};

// ========== SERVIÇOS CONFIGURAÇÕES ==========
export const settingsService = {
  // ROTA CORRIGIDA: /admin/settings
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (settings) => api.put('/admin/settings', settings),
  getSystemLogs: (params) => api.get('/admin/logs', { params }),
};

// ========== SERVIÇOS RELATÓRIOS AI ==========
export const aiReportsService = {
  // ROTA CORRIGIDA: /admin/ai-reports
  getReports: (params) => api.get('/admin/ai-reports', { params }),
  getReportDetails: (reportId) => api.get(`/admin/ai-reports/${reportId}`),
  generateReport: (type) => api.post('/admin/ai-reports/generate', { type }),
};

// ========== UTILITÁRIOS ==========
export const downloadFile = async (url, filename) => {
  try {
    const response = await api.get(url, { responseType: 'blob' });
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Erro ao baixar arquivo:', error);
    throw error;
  }
};

// Função para verificar conectividade com backend
export const testBackendConnection = async () => {
  try {
    const response = await axios.get('http://localhost:8080/health');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export default api;
