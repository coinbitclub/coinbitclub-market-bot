/**
 * SISTEMA DE AUTENTICAÇÃO PARA FRONTEND
 * Implementa login e gestão de tokens para conectar com backend
 */
import axios from 'axios';

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

// Configuração do axios para autenticação
const authApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 10000,
});

// ========== SERVIÇOS DE AUTENTICAÇÃO ==========
export const authService = {
  // Login do usuário
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await authApi.post('/auth/login', credentials);
      const { token, user } = response.data;
      
      // Armazenar token no localStorage
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

// ========== COMPONENTE DE LOGIN ==========
export const LoginForm = ({ onLogin }: { onLogin?: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authService.login({ email, password });
      onLogin?.();
      window.location.href = '/admin/dashboard-real';
    } catch (error) {
      setError('Email ou senha incorretos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Admin - CoinBitClub
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Entre com suas credenciais de administrador
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-md p-3">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 relative block w-full px-3 py-2 border border-gray-600 rounded-md placeholder-gray-400 text-white bg-gray-800 focus:outline-none focus:ring-yellow-400 focus:border-yellow-400 focus:z-10 sm:text-sm"
                placeholder="admin@coinbitclub.com"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 relative block w-full px-3 py-2 border border-gray-600 rounded-md placeholder-gray-400 text-white bg-gray-800 focus:outline-none focus:ring-yellow-400 focus:border-yellow-400 focus:z-10 sm:text-sm"
                placeholder="Sua senha"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-black bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </form>
        
        {/* Credenciais para teste */}
        <div className="mt-6 p-4 bg-gray-900/50 rounded-lg">
          <p className="text-xs text-gray-400 text-center">
            Para teste, use:<br/>
            Email: admin@coinbitclub.com<br/>
            Senha: admin123
          </p>
        </div>
      </div>
    </div>
  );
};

// ========== PROTEÇÃO DE ROTAS ==========
export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await authService.verifyToken();
      setIsAuthenticated(authenticated);
      
      if (!authenticated) {
        window.location.href = '/auth/login';
      }
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-white">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
};

// ========== ADMIN GUARD ==========
export const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdmin = () => {
      const user = authService.getCurrentUser();
      const adminStatus = user?.role === 'admin';
      setIsAdmin(adminStatus);
      
      if (!adminStatus) {
        window.location.href = '/dashboard';
      }
    };

    checkAdmin();
  }, []);

  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-white">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  return isAdmin ? <>{children}</> : null;
};

export default authService;
