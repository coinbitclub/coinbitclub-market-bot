import { useState, useEffect, createContext, useContext } from 'react';
import { apiUtils } from '../utils/api';
import Cookies from 'js-cookie';

// Context de Autenticação
const AuthContext = createContext(null);

// Provider de Autenticação
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar autenticação ao carregar
  useEffect(() => {
    console.log('🔐 Auth Context integrado carregado com sucesso');
    checkAuthStatus();
  }, []);

  // Verificar status de autenticação
  const checkAuthStatus = async () => {
    const token = Cookies.get('auth_token');
    
    if (token) {
      try {
        await fetchUserProfile();
      } catch (error) {
        console.error('Error fetching user profile:', error);
        logout();
      }
    } else {
      setLoading(false);
    }
  };

  // Buscar perfil do usuário
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await apiUtils.get('/api/user/profile');
      
      if (response.success && response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
      } else {
        throw new Error('Invalid user data');
      }
    } catch (error) {
      console.error('Fetch user profile error:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Login do usuário
  const login = async (email, password) => {
    try {
      setLoading(true);
      
      const response = await apiUtils.post('/auth/login', {
        email,
        password
      });

      if (response.success && response.token && response.user) {
        // Salvar token
        Cookies.set('auth_token', response.token, { 
          expires: 7, // 7 dias
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
        
        // Atualizar estado
        setUser(response.user);
        setIsAuthenticated(true);
        
        console.log('✅ Login successful:', response.user.email);
        return response;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Registro do usuário
  const register = async (userData) => {
    try {
      setLoading(true);
      
      const response = await apiUtils.post('/auth/register', userData);

      if (response.success && response.token && response.user) {
        // Salvar token
        Cookies.set('auth_token', response.token, { 
          expires: 7,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
        
        // Atualizar estado
        setUser(response.user);
        setIsAuthenticated(true);
        
        console.log('✅ Registration successful:', response.user.email);
        return response;
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout do usuário
  const logout = () => {
    Cookies.remove('auth_token');
    setUser(null);
    setIsAuthenticated(false);
    console.log('🚪 User logged out');
  };

  // Reset de senha
  const resetPassword = async (email) => {
    try {
      const response = await apiUtils.post('/auth/reset-password', { email });
      return response;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  };

  // Atualizar perfil
  const updateProfile = async (profileData) => {
    try {
      const response = await apiUtils.put('/api/user/profile', profileData);
      
      if (response.success && response.user) {
        setUser(response.user);
        return response;
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    register,
    resetPassword,
    updateProfile,
    fetchUserProfile,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar o contexto de autenticação
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === null) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  
  return context;
};

// Hook para proteção de rotas
export const useRequireAuth = (redirectTo = '/login') => {
  const { isAuthenticated, loading } = useAuth();
  
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      if (typeof window !== 'undefined') {
        window.location.href = redirectTo;
      }
    }
  }, [isAuthenticated, loading, redirectTo]);
  
  return { isAuthenticated, loading };
};

export default useAuth;
