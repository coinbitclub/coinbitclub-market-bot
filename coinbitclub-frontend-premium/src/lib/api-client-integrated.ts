// ============================================================================
// 🚀 COINBITCLUB MARKET BOT - API CLIENT INTEGRADO
// ============================================================================
// Cliente unificado para todas as chamadas de API
// Backend Railway: https://coinbitclub-market-bot.up.railway.app
// Status: INTEGRAÇÃO COMPLETA
// ============================================================================

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// 🔧 Configuração de URLs
const API_CONFIG = {
  production: 'https://coinbitclub-market-bot.up.railway.app',
  development: 'http://localhost:8080',
  websocket: 'wss://coinbitclub-market-bot.up.railway.app'
};

// 🌐 URL da API baseada no ambiente
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? API_CONFIG.production 
  : API_CONFIG.development;

console.log('🔗 API Client Configuration:');
console.log('- Environment:', process.env.NODE_ENV);
console.log('- Backend URL:', API_BASE_URL);
console.log('- Integration Status: ACTIVE');

// 📊 Interfaces para respostas da API
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    timestamp?: string;
  };
}

interface LoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  refresh_token?: string;
  user?: User;
  requiresSMS?: boolean;
}

interface RegisterResponse {
  success: boolean;
  message?: string;
  requiresSMS?: boolean;
  user?: User;
}

interface SMSResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
}

// 🔐 Interface para dados de autenticação
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'user' | 'affiliate';
  user_type: 'admin' | 'user' | 'affiliate';
  status: 'active' | 'inactive' | 'pending';
  email_verified: boolean;
  phone_verified: boolean;
  created_at: string;
  last_login?: string;
}

// 🏗️ Classe principal do cliente API
class ApiClient {
  private api: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Client': 'CoinBitClub-Frontend'
      }
    });

    this.setupInterceptors();
  }

  // 🔧 Configurar interceptors
  private setupInterceptors(): void {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshToken();
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            this.logout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // 🔑 Gerenciamento de tokens
  private getStoredToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  private setStoredToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token);
    }
  }

  private getStoredRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refresh_token');
    }
    return null;
  }

  private setStoredRefreshToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('refresh_token', token);
    }
  }

  // 🔄 Refresh token
  private async refreshToken(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();
    
    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<string | null> {
    const refreshToken = this.getStoredRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
        refresh_token: refreshToken
      });

      const { access_token, refresh_token: newRefreshToken } = response.data;
      
      this.setStoredToken(access_token);
      if (newRefreshToken) {
        this.setStoredRefreshToken(newRefreshToken);
      }

      return access_token;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      throw error;
    }
  }

  // 🚪 Logout
  private logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login-integrated';
    }
  }

  // 📡 Métodos HTTP genéricos
  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.api.get<T>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.api.post<T>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.api.put<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.api.delete<T>(url);
    return response.data;
  }
}

// 🏭 Instância global do cliente
const apiClient = new ApiClient();

// 🔐 Serviço de Autenticação
export class AuthService {
  async login(email: string, password: string): Promise<{ requiresSMS: boolean; message?: string }> {
    try {
      const response = await apiClient.post<LoginResponse>('/api/auth/login', {
        email,
        password
      });

      if (response.token) {
        apiClient['setStoredToken'](response.token);
      }

      if (response.refresh_token) {
        apiClient['setStoredRefreshToken'](response.refresh_token);
      }

      if (response.user) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('user_data', JSON.stringify(response.user));
        }
      }

      return {
        requiresSMS: response.requiresSMS || false,
        message: response.message
      };
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || 'Erro no login');
    }
  }

  async register(userData: any): Promise<{ requiresSMS: boolean; message?: string }> {
    try {
      const response = await apiClient.post<RegisterResponse>('/api/auth/register', userData);

      return {
        requiresSMS: response.requiresSMS || true,
        message: response.message
      };
    } catch (error: any) {
      console.error('Register error:', error);
      throw new Error(error.response?.data?.message || 'Erro no registro');
    }
  }

  async verifySMS(phone: string, code: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiClient.post<SMSResponse>('/api/auth/verify-sms', {
        phone,
        code
      });

      if (response.token) {
        apiClient['setStoredToken'](response.token);
      }

      if (response.user) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('user_data', JSON.stringify(response.user));
        }
      }

      return {
        success: true,
        message: response.message
      };
    } catch (error: any) {
      console.error('SMS verification error:', error);
      throw new Error(error.response?.data?.message || 'Erro na verificação SMS');
    }
  }

  async sendSMS(phone: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post<SMSResponse>('/api/auth/send-sms', { phone });
      return {
        success: true,
        message: response.message || 'SMS enviado com sucesso'
      };
    } catch (error: any) {
      console.error('Send SMS error:', error);
      throw new Error(error.response?.data?.message || 'Erro ao enviar SMS');
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiClient.get<{user: User}>('/api/auth/me');
      return response.user;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  logout(): void {
    apiClient['logout']();
  }
}

// 👑 Serviço de Admin
export class AdminService {
  async getAdminStats(): Promise<any> {
    try {
      const response = await apiClient.get('/api/admin/stats');
      return response;
    } catch (error: any) {
      console.error('Admin stats error:', error);
      throw new Error(error.response?.data?.message || 'Erro ao carregar estatísticas');
    }
  }

  async getDashboardStats(): Promise<any> {
    try {
      const response = await apiClient.get('/api/admin/dashboard');
      return response;
    } catch (error: any) {
      console.error('Dashboard stats error:', error);
      throw new Error(error.response?.data?.message || 'Erro ao carregar dashboard');
    }
  }

  async getRecentActivities(limit: number = 10): Promise<any> {
    try {
      const response = await apiClient.get('/api/admin/activities', { limit });
      return response;
    } catch (error: any) {
      console.error('Recent activities error:', error);
      throw new Error(error.response?.data?.message || 'Erro ao carregar atividades');
    }
  }

  async getUsers(params?: any): Promise<any> {
    try {
      const response = await apiClient.get('/api/admin/users', params);
      return response;
    } catch (error: any) {
      console.error('Get users error:', error);
      throw new Error(error.response?.data?.message || 'Erro ao carregar usuários');
    }
  }

  async getSystemHealth(): Promise<any> {
    try {
      const response = await apiClient.get('/api/admin/health');
      return response;
    } catch (error: any) {
      console.error('System health error:', error);
      throw new Error(error.response?.data?.message || 'Erro ao verificar saúde do sistema');
    }
  }
}

// 👤 Serviço de Usuário
export class UserService {
  async getUserStats(): Promise<any> {
    try {
      const response = await apiClient.get('/api/user/stats');
      return response;
    } catch (error: any) {
      console.error('User stats error:', error);
      throw new Error(error.response?.data?.message || 'Erro ao carregar dados do usuário');
    }
  }

  async getUserOperations(params?: any): Promise<any> {
    try {
      const response = await apiClient.get('/api/user/operations', params);
      return response;
    } catch (error: any) {
      console.error('User operations error:', error);
      throw new Error(error.response?.data?.message || 'Erro ao carregar operações');
    }
  }

  async getUserPortfolio(): Promise<any> {
    try {
      const response = await apiClient.get('/api/user/portfolio');
      return response;
    } catch (error: any) {
      console.error('User portfolio error:', error);
      throw new Error(error.response?.data?.message || 'Erro ao carregar portfolio');
    }
  }
}

// 🤝 Serviço de Afiliado
export class AffiliateService {
  async getAffiliateStats(): Promise<any> {
    try {
      const response = await apiClient.get('/api/affiliate/stats');
      return response;
    } catch (error: any) {
      console.error('Affiliate stats error:', error);
      throw new Error(error.response?.data?.message || 'Erro ao carregar dados do afiliado');
    }
  }

  async getReferrals(params?: any): Promise<any> {
    try {
      const response = await apiClient.get('/api/affiliate/referrals', params);
      return response;
    } catch (error: any) {
      console.error('Get referrals error:', error);
      throw new Error(error.response?.data?.message || 'Erro ao carregar indicações');
    }
  }

  async getCommissions(params?: any): Promise<any> {
    try {
      const response = await apiClient.get('/api/affiliate/commissions', params);
      return response;
    } catch (error: any) {
      console.error('Get commissions error:', error);
      throw new Error(error.response?.data?.message || 'Erro ao carregar comissões');
    }
  }
}

// 📤 Instâncias dos serviços
export const authService = new AuthService();
export const adminService = new AdminService();
export const userService = new UserService();
export const affiliateService = new AffiliateService();

// 📤 Exportar cliente principal
export default apiClient;
