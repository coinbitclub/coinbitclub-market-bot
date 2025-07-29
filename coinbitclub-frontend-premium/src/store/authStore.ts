import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'ADMIN' | 'GESTOR' | 'OPERADOR' | 'AFILIADO' | 'USUARIO';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  access_level: number;
  permissions: string[];
  profile?: {
    avatar?: string;
    phone?: string;
    country?: string;
    timezone?: string;
  };
}

// Configuração de rotas por perfil
const ROLE_ROUTES = {
  ADMIN: ['/admin/**'],
  GESTOR: ['/gestor/**', '/admin/operations', '/admin/affiliates'],  
  OPERADOR: ['/operador/**'],
  AFILIADO: ['/affiliate/**'],
  USUARIO: ['/user/**']
};

// Permissões por perfil
const ROLE_PERMISSIONS = {
  ADMIN: ['view_all', 'financial_data', 'user_management', 'system_config', 'affiliate_data'],
  GESTOR: ['view_operations', 'financial_data', 'user_data', 'affiliate_data'],
  OPERADOR: ['view_operations', 'basic_financial', 'user_data'],
  AFILIADO: ['view_own_data', 'affiliate_earnings', 'referral_data'],
  USUARIO: ['view_own_operations']
};

interface AuthState {
  // Estado
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;

  // Ações
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  setUser: (user: User) => void;
  clearError: () => void;
  
  // Novas ações para controle de acesso
  hasPermission: (permission: string) => boolean;
  canAccessRoute: (route: string) => boolean;
  getDashboardRoute: () => string;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false,
      error: null,

      // Login integrado com backend Railway
      login: async (credentials) => {
        set({ loading: true, error: null });
        
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || data.error || 'Erro no login');
          }

          // Sucesso: salvar dados
          set({
            isAuthenticated: true,
            user: data.user,
            token: data.token || data.tokens?.accessToken,
            loading: false,
            error: null,
          });

          // Log para debug
          console.log('✅ Login realizado com sucesso:', {
            email: data.user?.email,
            role: data.user?.role,
            hasToken: !!data.token
          });

        } catch (error: any) {
          console.error('❌ Erro no login:', error);
          set({
            loading: false,
            error: error.message || 'Erro inesperado no login',
            isAuthenticated: false,
            user: null,
            token: null,
          });
          throw error;
        }
      },

      // Logout
      logout: () => {
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          error: null,
        });
        
        // Limpar localStorage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        
        console.log('👋 Logout realizado');
      },

      // Refresh token
      refreshToken: async () => {
        const { token } = get();
        
        if (!token) {
          throw new Error('Token não encontrado');
        }

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Erro ao renovar token');
          }

          set({
            token: data.token || data.tokens?.accessToken,
            user: data.user || get().user,
          });

        } catch (error) {
          console.error('❌ Erro ao renovar token:', error);
          // Se falhar, deslogar usuário
          get().logout();
          throw error;
        }
      },

      // Setar usuário
      setUser: (user) => {
        set({ user });
      },

      // Limpar erro
      clearError: () => {
        set({ error: null });
      },
      
      // Verificar permissões
      hasPermission: (permission: string) => {
        const { user } = get();
        if (!user) return false;
        
        const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
        return rolePermissions.includes(permission) || (user.permissions && user.permissions.includes(permission));
      },
      
      // Verificar acesso a rota
      canAccessRoute: (route: string) => {
        const { user } = get();
        if (!user) return false;
        
        const allowedRoutes = ROLE_ROUTES[user.role] || [];
        
        return allowedRoutes.some(allowedRoute => {
          if (allowedRoute.endsWith('/**')) {
            const basePath = allowedRoute.slice(0, -3);
            return route.startsWith(basePath);
          }
          return route === allowedRoute;
        });
      },
      
      // Obter rota do dashboard por perfil
      getDashboardRoute: () => {
        const { user } = get();
        if (!user) return '/auth/login';
        
        const dashboardRoutes = {
          ADMIN: '/admin/dashboard',
          GESTOR: '/gestor/dashboard',
          OPERADOR: '/operador/dashboard', 
          AFILIADO: '/affiliate/dashboard',
          USUARIO: '/user/dashboard'
        };
        
        return dashboardRoutes[user.role] || '/user/dashboard';
      },
    }),
    {
      name: 'coinbitclub-auth',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        token: state.token,
      }),
    }
  )
);

// Hook para facilitar uso
export const useAuth = () => {
  const store = useAuthStore();
  
  return {
    ...store,
    // Computed properties atualizadas para os 5 perfis
    isAdmin: store.user?.role === 'ADMIN',
    isGestor: store.user?.role === 'GESTOR',
    isOperador: store.user?.role === 'OPERADOR',
    isAffiliate: store.user?.role === 'AFILIADO',
    isUser: store.user?.role === 'USUARIO',
    userRole: store.user?.role,
    userName: store.user?.name || 'Usuário',
    userEmail: store.user?.email,
    userAccessLevel: store.user?.access_level || 1,
    userPermissions: store.user?.permissions || [],
  };
};
