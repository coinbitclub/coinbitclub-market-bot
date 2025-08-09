export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'premium';
  avatar?: string;
  createdAt?: Date;
  subscription?: {
    plan: string;
    status: 'active' | 'canceled' | 'expired';
    expiresAt: Date;
  };
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Simulação de autenticação para desenvolvimento
export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    // Simular chamada de API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Dados mockados para desenvolvimento
    const user: User = {
      id: '1',
      email: credentials.email,
      name: 'Usuário Demo',
      role: credentials.email.includes('admin') ? 'admin' : 'user',
      avatar: 'https://via.placeholder.com/40',
      createdAt: new Date(),
      subscription: {
        plan: 'premium',
        status: 'active',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
      }
    };

    const token = 'mock-jwt-token-' + Date.now();
    
    // Salvar no localStorage para persistência
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { user, token };
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    // Simular chamada de API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const user: User = {
      id: Date.now().toString(),
      email: data.email,
      name: data.name,
      role: 'user',
      createdAt: new Date()
    };

    const token = 'mock-jwt-token-' + Date.now();
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { user, token };
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  },

  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false;
    
    return !!localStorage.getItem('token');
  }
};

export default authService;
