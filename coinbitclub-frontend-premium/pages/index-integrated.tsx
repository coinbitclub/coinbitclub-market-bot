// ============================================================================
// 🏠 PÁGINA INDEX INTEGRADA - SEM DADOS MOCK
// ============================================================================
// Página inicial com redirecionamento automático
// Integração completa com Railway backend
// Status: INTEGRAÇÃO COMPLETA
// ============================================================================

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../src/contexts/AuthContextIntegrated';

const HomePage: React.FC = () => {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated && user) {
        // Redirecionar baseado no papel do usuário
        const redirectPath = user.role === 'admin' ? '/admin/dashboard-integrated' :
                            user.role === 'affiliate' ? '/affiliate/dashboard-integrated' :
                            '/user/dashboard-integrated';
        router.replace(redirectPath);
      } else {
        // Redirecionar para login
        router.replace('/login-integrated');
      }
    }
  }, [loading, isAuthenticated, user, router]);

  // Loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span className="text-2xl font-bold text-black">₿</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">CoinBitClub</h1>
        <p className="text-gray-400">Carregando...</p>
      </div>
    </div>
  );
};

export default HomePage;
