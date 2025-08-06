import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../src/store/authStore';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated && user) {
        // Redirecionar para dashboard baseado no role
        const redirectMap = {
          admin: '/admin/dashboard',
          affiliate: '/affiliate/dashboard',
          user: '/dashboard-premium',
          operator: '/operator/dashboard',
          manager: '/manager/dashboard'
        };
        
        const redirectPath = redirectMap[user.role] || '/dashboard-premium';
        router.replace(redirectPath);
      } else {
        // Redirecionar para login premium
        router.replace('/auth/login-integrated');
      }
    }
  }, [isAuthenticated, user, loading, router]);

  // Página de loading enquanto determina redirecionamento
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <div className="mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center text-black font-bold text-xl mx-auto mb-4">
            ₿
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent">
            CoinBitClub
          </h1>
        </div>
        <p className="text-white mb-2">Iniciando MarketBot Premium...</p>
        <p className="text-gray-400 text-sm">Conectando com sistemas de trading</p>
      </div>
    </div>
  );
}
