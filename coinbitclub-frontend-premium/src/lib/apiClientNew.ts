import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string>;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  user: any;
  token: string;
  refreshToken: string;
}

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  country: string;
  plan: string;
}

interface TradingStatus {
  isActive: boolean;
  connectedExchanges: string[];
  lastOperation?: any;
  totalProfit: number;
  successRate: number;
}

interface DashboardData {
  overview: {
    totalProfit: number;
    totalOperations: number;
    successRate: number;
    currentBalance: number;
  };
  recentOperations: any[];
  chartData: any[];
  performance: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{ resolve: Function; reject: Function }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      timeout: 15000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add request timestamp for debugging
        config.metadata = { startTime: new Date() };
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then(token => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.client(originalRequest);
            }).catch(err => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshToken();
            this.processQueue(null, newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            this.clearAuth();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private processQueue(error: any, token: string | null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    
    this.failedQueue = [];
  }

  private getToken(): string | null {
    return typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  }

  private setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth-token', token);
    }
  }

  private clearAuth(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-token');
      localStorage.removeItem('refresh-token');
    }
  }

  // Authentication Methods
  async login(credentials: LoginRequest): Promise<AxiosResponse<ApiResponse<LoginResponse>>> {
    const response = await this.client.post('/api/auth/login', credentials);
    
    if (response.data.success && response.data.data.token) {
      this.setToken(response.data.data.token);
    }
    
    return response;
  }

  async register(userData: RegisterRequest): Promise<AxiosResponse<ApiResponse<LoginResponse>>> {
    const response = await this.client.post('/api/auth/register', userData);
    
    if (response.data.success && response.data.data.token) {
      this.setToken(response.data.data.token);
    }
    
    return response;
  }

  async logout(): Promise<AxiosResponse<ApiResponse>> {
    try {
      const response = await this.client.post('/api/auth/logout');
      return response;
    } finally {
      this.clearAuth();
    }
  }

  async refreshToken(): Promise<string> {
    const response = await this.client.post('/api/auth/refresh');
    const { token } = response.data.data;
    this.setToken(token);
    return token;
  }

  async forgotPassword(email: string): Promise<AxiosResponse<ApiResponse>> {
    return this.client.post('/api/auth/forgot-password', { email });
  }

  async resetPassword(token: string, password: string): Promise<AxiosResponse<ApiResponse>> {
    return this.client.post('/api/auth/reset-password', { token, password });
  }

  // User Management Methods
  async getProfile(): Promise<AxiosResponse<ApiResponse<{ user: any }>>> {
    return this.client.get('/api/user/profile');
  }

  async updateProfile(data: any): Promise<AxiosResponse<ApiResponse<{ user: any }>>> {
    return this.client.put('/api/user/profile', data);
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<AxiosResponse<ApiResponse>> {
    return this.client.put('/api/user/password', { currentPassword, newPassword });
  }

  async uploadAvatar(file: File): Promise<AxiosResponse<ApiResponse<{ avatarUrl: string }>>> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    return this.client.post('/api/user/upload-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Trading Methods - Updated for current backend structure
  async getTradingStatus(): Promise<AxiosResponse<ApiResponse<TradingStatus>>> {
    return this.client.get('/api/status');
  }

  async startTrading(): Promise<AxiosResponse<ApiResponse>> {
    return this.client.post('/api/trading/start');
  }

  async stopTrading(): Promise<AxiosResponse<ApiResponse>> {
    return this.client.post('/api/trading/stop');
  }

  async getOperations(params?: {
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
    symbol?: string;
    status?: string;
  }): Promise<AxiosResponse<ApiResponse<{ operations: any[]; total: number }>>> {
    return this.client.get('/api/data', { params });
  }

  async getPerformance(period?: string): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.client.get('/api/data', { params: { type: 'performance', period } });
  }

  async getBalance(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.client.get('/api/data', { params: { type: 'balance' } });
  }

  async setApiKeys(exchange: string, apiKey: string, secretKey: string, isTestnet = true): Promise<AxiosResponse<ApiResponse>> {
    return this.client.post('/api/data', {
      type: 'api-keys',
      exchange,
      apiKey,
      secretKey,
      isTestnet
    });
  }

  async getTradingSettings(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.client.get('/api/data', { params: { type: 'settings' } });
  }

  async updateTradingSettings(settings: any): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.client.post('/api/data', { type: 'settings', ...settings });
  }

  // Dashboard Methods
  async getDashboardData(): Promise<AxiosResponse<ApiResponse<DashboardData>>> {
    return this.client.get('/api/dashboard/overview');
  }

  async getChartData(period: string = '7d'): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.client.get('/api/dashboard/charts', { params: { period } });
  }

  async getRecentOperations(limit = 10): Promise<AxiosResponse<ApiResponse<any[]>>> {
    return this.client.get('/api/dashboard/recent', { params: { limit } });
  }

  // Analytics Methods
  async getProfitAnalysis(period?: string): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.client.get('/api/analytics/profit', { params: { period } });
  }

  async getPairPerformance(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.client.get('/api/analytics/pairs');
  }

  async getPeriodPerformance(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.client.get('/api/analytics/periods');
  }

  // Plans & Billing Methods
  async getPlans(): Promise<AxiosResponse<ApiResponse<any[]>>> {
    return this.client.get('/api/plans');
  }

  async getCurrentSubscription(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.client.get('/api/subscriptions/current');
  }

  async createSubscription(planId: string): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.client.post('/api/subscriptions/create', { planId });
  }

  async cancelSubscription(): Promise<AxiosResponse<ApiResponse>> {
    return this.client.put('/api/subscriptions/cancel');
  }

  async getInvoices(): Promise<AxiosResponse<ApiResponse<any[]>>> {
    return this.client.get('/api/invoices');
  }

  async processPayment(paymentData: any): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.client.post('/api/payments/process', paymentData);
  }
}

export const apiClient = new ApiClient();
export default apiClient;
