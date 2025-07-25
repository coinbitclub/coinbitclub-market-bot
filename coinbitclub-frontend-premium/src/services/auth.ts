import axios from 'axios';

// ========== TIPOS ==========
interface LoginCredentials {
  email: string;
  password: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
}

interface AuthResponse {
  token: string;
  user: User;
}

// ========== CONFIGURAÇÃO DO AXIOS ==========
const authApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para adicionar token automaticamente
authApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar respostas de erro
authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// ========== SERVIÇO DE AUTENTICAÇÃO ==========
export const authService = {
  // Login do usuário
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await authApi.post('/auth/login', credentials);
      const { token, user } = response.data;
      
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      return { token, user };
    } catch (error) {
      console.error('Erro no login:', error);
      throw new Error('Credenciais inválidas');
    }
  },

  // Logout do usuário
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    sessionStorage.clear();
    window.location.href = '/auth/login';
  },

  // Verificar se o usuário está autenticado
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('authToken');
    return !!token;
  },

  // Obter token atual
  getToken: (): string | null => {
    return localStorage.getItem('authToken');
  },

  // Obter usuário atual
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Verificar se o usuário é admin
  isAdmin: (): boolean => {
    const user = authService.getCurrentUser();
    return user?.role === 'admin';
  },

  // Registrar novo usuário
  register: async (userData: any): Promise<AuthResponse> => {
    try {
      const response = await authApi.post('/auth/register', userData);
      const { token, user } = response.data;
      
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      return { token, user };
    } catch (error) {
      console.error('Erro no registro:', error);
      throw new Error('Erro ao criar conta');
    }
  },

  // Verificar token válido
  verifyToken: async (): Promise<boolean> => {
    try {
      const token = authService.getToken();
      if (!token) return false;

      const response = await authApi.get('/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.status === 200;
    } catch (error) {
      // Token inválido - limpar localStorage
      authService.logout();
      return false;
    }
  }
};

export default authService;
