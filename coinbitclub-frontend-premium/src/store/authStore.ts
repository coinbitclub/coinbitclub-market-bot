import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'affiliate' | 'operator' | 'manager';
  profile?: {
    avatar?: string;
    phone?: string;
    country?: string;
    timezone?: string;
  };
}

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
    // Computed properties
    isAdmin: store.user?.role === 'admin',
    isAffiliate: store.user?.role === 'affiliate',
    isUser: store.user?.role === 'user',
    userRole: store.user?.role,
    userName: store.user?.name || 'Usuário',
    userEmail: store.user?.email,
  };
};
