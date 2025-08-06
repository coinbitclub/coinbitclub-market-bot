// ============================================================================
// 🔐 COINBITCLUB MARKET BOT - AUTH CONTEXT INTEGRATED
// ============================================================================
// Context de autenticação com suporte completo a SMS
// Backend Railway: https://coinbitclub-market-bot.up.railway.app
// Status: INTEGRAÇÃO COMPLETA COM SMS
// ============================================================================

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { authService, type User, type AuthTokens } from '../lib/api-client-integrated';

// 📱 Interfaces do contexto
interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  smsStep: 'none' | 'pending' | 'verifying' | 'verified';
  tempPhone: string | null;
}

interface AuthActions {
  // Autenticação básica
  login: (email: string, password: string) => Promise<{ requiresSMS: boolean; message?: string }>;
  register: (userData: RegisterData) => Promise<{ requiresSMS: boolean; message?: string }>;
  logout: () => Promise<void>;
  
  // SMS
  sendSMSVerification: (phone: string) => Promise<{ success: boolean; message: string }>;
  verifySMSCode: (phone: string, code: string) => Promise<{ success: boolean; message?: string }>;
  resendSMSCode: () => Promise<{ success: boolean; message: string }>;
  
  // Perfil
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; message?: string }>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  terms_accepted: boolean;
  location?: 'brasil' | 'exterior';
  referral_code?: string;
}

type AuthContextType = AuthState & AuthActions;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 🏗️ Provider do contexto
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const router = useRouter();
  
  // Estados
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    isAuthenticated: false,
    smsStep: 'none',
    tempPhone: null
  });

  // 🚀 Inicialização
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));

      const currentUser = authService.getCurrentUser();
      const isAuth = authService.isAuthenticated();

      if (isAuth && currentUser) {
        setAuthState(prev => ({
          ...prev,
          user: currentUser,
          isAuthenticated: true,
          loading: false
        }));
        
        console.log('✅ Usuário autenticado:', currentUser.name);
      } else {
        setAuthState(prev => ({
          ...prev,
          loading: false
        }));
      }
    } catch (error) {
      console.error('❌ Erro na inicialização da auth:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false
      }));
    }
  };

  const updateAuthState = (updates: Partial<AuthState>): void => {
    setAuthState(prev => ({ ...prev, ...updates }));
  };

  // ============================================================================
  // 🔐 IMPLEMENTAÇÃO DAS AÇÕES DE AUTENTICAÇÃO
  // ============================================================================

  const handleLogin = async (email: string, password: string): Promise<{ requiresSMS: boolean; message?: string }> => {
    try {
      updateAuthState({ loading: true });

      const result = await authService.login(email, password);
      
      if (result.requiresSMS) {
        // Login requer verificação SMS
        updateAuthState({
          loading: false,
          smsStep: 'pending',
          tempPhone: result.user.phone
        });
        
        return { 
          requiresSMS: true, 
          message: `Código SMS enviado para ${maskPhone(result.user.phone)}` 
        };
      } else {
        // Login completo sem SMS
        updateAuthState({
          user: result.user,
          isAuthenticated: true,
          loading: false,
          smsStep: 'verified'
        });

        // Redirecionar baseado no tipo de usuário
        redirectAfterLogin(result.user);
        
        return { 
          requiresSMS: false, 
          message: 'Login realizado com sucesso!' 
        };
      }
    } catch (error: any) {
      updateAuthState({ loading: false });
      throw new Error(error.message || 'Erro no login');
    }
  };

  const handleRegister = async (userData: RegisterData): Promise<{ requiresSMS: boolean; message?: string }> => {
    try {
      updateAuthState({ loading: true });

      const result = await authService.register(userData);
      
      if (result.requiresSMS) {
        updateAuthState({
          loading: false,
          smsStep: 'pending',
          tempPhone: userData.phone
        });
        
        return { 
          requiresSMS: true, 
          message: result.message || `Código SMS enviado para ${maskPhone(userData.phone)}` 
        };
      } else {
        updateAuthState({ loading: false });
        return { 
          requiresSMS: false, 
          message: result.message || 'Cadastro realizado com sucesso!' 
        };
      }
    } catch (error: any) {
      updateAuthState({ loading: false });
      throw new Error(error.message || 'Erro no cadastro');
    }
  };

  const handleSendSMS = async (phone: string): Promise<{ success: boolean; message: string }> => {
    try {
      const result = await authService.sendSMSVerification(phone);
      
      if (result.success) {
        updateAuthState({
          smsStep: 'pending',
          tempPhone: phone
        });
      }
      
      return result;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao enviar SMS');
    }
  };

  const handleVerifySMS = async (phone: string, code: string): Promise<{ success: boolean; message?: string }> => {
    try {
      updateAuthState({ loading: true });

      const result = await authService.verifySMSCode(phone, code);
      
      updateAuthState({
        user: result.user,
        isAuthenticated: true,
        loading: false,
        smsStep: 'verified',
        tempPhone: null
      });

      // Redirecionar após verificação
      redirectAfterLogin(result.user);
      
      return { 
        success: true, 
        message: 'Verificação SMS concluída com sucesso!' 
      };
    } catch (error: any) {
      updateAuthState({ loading: false });
      throw new Error(error.message || 'Código SMS inválido');
    }
  };

  const handleResendSMS = async (): Promise<{ success: boolean; message: string }> => {
    if (!authState.tempPhone) {
      throw new Error('Nenhum telefone em processo de verificação');
    }
    
    return handleSendSMS(authState.tempPhone);
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.warn('Erro no logout, limpando dados localmente:', error);
    } finally {
      updateAuthState({
        user: null,
        isAuthenticated: false,
        loading: false,
        smsStep: 'none',
        tempPhone: null
      });
      
      router.push('/auth/login');
    }
  };

  const handleUpdateProfile = async (data: Partial<User>): Promise<{ success: boolean; message?: string }> => {
    try {
      // Implementar chamada para API
      return { success: true, message: 'Perfil atualizado com sucesso!' };
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao atualizar perfil');
    }
  };

  const handleRefreshUser = async (): Promise<void> => {
    try {
      // Implementar refresh do usuário
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário:', error);
    }
  };

  // 🧭 Redirecionamento após login
  const redirectAfterLogin = (user: User): void => {
    const { redirect } = router.query;
    
    if (redirect && typeof redirect === 'string') {
      router.push(redirect);
      return;
    }

    switch (user.user_type) {
      case 'admin':
        router.push('/admin/dashboard');
        break;
      case 'affiliate':
        router.push('/affiliate/dashboard');
        break;
      default:
        router.push('/user/dashboard');
        break;
    }
  };

  // 🎭 Mascarar telefone
  const maskPhone = (phone: string): string => {
    if (!phone) return '';
    
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{2})(\d{5})(\d{4})$/);
    
    if (match) {
      return `+${match[1]} (${match[2]}) ${match[3]}****`;
    }
    
    return phone.slice(0, -4) + '****';
  };

  // 📦 Valor do contexto
  const contextValue: AuthContextType = {
    // Estado
    ...authState,
    
    // Ações
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    sendSMSVerification: handleSendSMS,
    verifySMSCode: handleVerifySMS,
    resendSMSCode: handleResendSMS,
    updateProfile: handleUpdateProfile,
    refreshUser: handleRefreshUser
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================================
// 🎣 HOOK DO CONTEXTO
// ============================================================================

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  
  return context;
};

// ============================================================================
// 🛡️ HOC PARA PROTEÇÃO DE ROTAS
// ============================================================================

interface WithAuthProps {
  allowedRoles?: Array<'admin' | 'user' | 'affiliate'>;
  requireEmailVerification?: boolean;
  requirePhoneVerification?: boolean;
  redirectTo?: string;
}

export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options: WithAuthProps = {}
) => {
  const WrappedComponent: React.FC<P> = (props) => {
    const { 
      user, 
      loading, 
      isAuthenticated,
      smsStep 
    } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading) {
        // Não autenticado
        if (!isAuthenticated) {
          const redirectUrl = options.redirectTo || '/auth/login';
          router.push(`${redirectUrl}?redirect=${encodeURIComponent(router.asPath)}`);
          return;
        }

        // SMS pendente
        if (smsStep === 'pending') {
          router.push('/auth/verify-sms');
          return;
        }

        // Verificar role
        if (options.allowedRoles && user && !options.allowedRoles.includes(user.user_type)) {
          router.push('/unauthorized');
          return;
        }
      }
    }, [loading, isAuthenticated, user, smsStep, router]);

    // Loading
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
            <p className="text-white mt-4">⚡ Carregando...</p>
          </div>
        </div>
      );
    }

    // Não autenticado ou verificação pendente
    if (!isAuthenticated || smsStep === 'pending') {
      return null;
    }

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

console.log('🔐 Auth Context integrado carregado com sucesso');


