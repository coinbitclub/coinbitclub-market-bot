import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { apiClient } from '../lib/apiClientNew';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  country: string;
  plan: 'brasil-flex' | 'brasil-pro' | 'global-flex' | 'global-pro';
  status: 'active' | 'trial' | 'suspended' | 'cancelled';
  trialEndsAt?: string;
  avatar_url?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<AuthUser>) => Promise<void>;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface RegisterData {
  nome: string;
  email: string;
  whatsapp?: string;
  senha: string;
  pais: string;
  plan?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth-token');
      
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await apiClient.getProfile();
      setUser(response.data.user);
      setError(null);
    } catch (error: any) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('auth-token');
      setUser(null);
      
      if (error.response?.status === 401) {
        setError('Sessão expirada. Faça login novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiClient.login(email, password);
      const { user, token } = response.data;
      
      localStorage.setItem('auth-token', token);
      setUser(user);
      
      // Redirect based on user status
      if (user.status === 'trial' && !user.trialEndsAt) {
        router.push('/configuracao-inicial');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao fazer login';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiClient.register({
        name: userData.nome,
        email: userData.email,
        phone: userData.whatsapp,
        password: userData.senha,
        country: userData.pais,
        plan: userData.plan || 'brasil-flex'
      });
      
      const { user, token } = response.data;
      
      localStorage.setItem('auth-token', token);
      setUser(user);
      
      // Redirect to initial setup
      router.push('/configuracao-inicial');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao criar conta';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth-token');
      setUser(null);
      setError(null);
      router.push('/');
    }
  };

  const updateProfile = async (data: Partial<AuthUser>) => {
    try {
      setError(null);
      const response = await apiClient.updateProfile(data);
      setUser(response.data.user);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao atualizar perfil';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await apiClient.getProfile();
      setUser(response.data.user);
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
    isLoading,
    isAuthenticated: !!user,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;
