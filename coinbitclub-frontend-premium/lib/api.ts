/**
 * Configuração da API para integração Frontend-Backend
 */

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  plan: string;
  balance: number;
  created_at: string;
}

export interface Signal {
  id: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  price: number;
  confidence: number;
  timestamp: string;
  source: string;
}

export interface TradePosition {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  amount: number;
  entry_price: number;
  current_price: number;
  pnl: number;
  status: 'OPEN' | 'CLOSED';
  opened_at: string;
}

// Configuração da API baseada no ambiente
const API_CONFIG: ApiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8085',
  timeout: 30000, // 30 segundos
  retries: 3
};

class ApiClient {
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = config;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error(`API Error on ${endpoint}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Métodos de autenticação
  async login(email: string, password: string): Promise<ApiResponse<{ token: string; user: UserProfile }>> {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(data: {
    email: string;
    password: string;
    name: string;
    referral_code?: string;
  }): Promise<ApiResponse<{ token: string; user: UserProfile }>> {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProfile(token: string): Promise<ApiResponse<UserProfile>> {
    return this.request('/api/user/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // Métodos de sinais
  async getSignals(token: string, limit = 50): Promise<ApiResponse<Signal[]>> {
    return this.request(`/api/signals?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async getRealtimeSignals(token: string): Promise<ApiResponse<Signal[]>> {
    return this.request('/api/signals/realtime', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // Métodos de trading
  async getPositions(token: string): Promise<ApiResponse<TradePosition[]>> {
    return this.request('/api/trading/positions', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async createPosition(
    token: string, 
    data: {
      symbol: string;
      side: 'BUY' | 'SELL';
      amount: number;
      price?: number;
    }
  ): Promise<ApiResponse<TradePosition>> {
    return this.request('/api/trading/positions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  }

  async closePosition(token: string, positionId: string): Promise<ApiResponse<void>> {
    return this.request(`/api/trading/positions/${positionId}/close`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // Métodos de dashboard
  async getDashboardData(token: string): Promise<ApiResponse<{
    balance: number;
    positions: TradePosition[];
    recent_signals: Signal[];
    statistics: {
      total_trades: number;
      winning_trades: number;
      total_pnl: number;
      win_rate: number;
    };
  }>> {
    return this.request('/api/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // Método de health check
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.request('/api/health');
  }

  // Método para verificar conectividade
  async checkConnection(): Promise<boolean> {
    try {
      const response = await this.healthCheck();
      return response.success;
    } catch {
      return false;
    }
  }
}

// Instância singleton do cliente API
export const apiClient = new ApiClient(API_CONFIG);

// Hook para verificar status da API
export async function checkApiStatus(): Promise<{
  status: 'online' | 'offline' | 'error';
  latency?: number;
  error?: string;
}> {
  const startTime = performance.now();
  
  try {
    const response = await apiClient.healthCheck();
    const latency = performance.now() - startTime;
    
    if (response.success) {
      return {
        status: 'online',
        latency: Math.round(latency),
      };
    } else {
      return {
        status: 'error',
        error: response.error,
      };
    }
  } catch (error) {
    return {
      status: 'offline',
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

export default apiClient;
