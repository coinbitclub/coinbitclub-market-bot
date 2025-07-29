import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { GlobalPremiumStyles } from '../src/styles/GlobalPremiumStyles';
import { useAuth } from '../src/store/authStore';
import '../styles/globals.css';

// Páginas que não precisam de autenticação
const publicPages = [
  '/',
  '/auth/login',
  '/auth/login-premium',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/privacy',
  '/terms',
  '/contact'
];

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { isAuthenticated, user, loading } = useAuth();

  // Verificar autenticação e redirecionar conforme necessário
  useEffect(() => {
    const isPublicPage = publicPages.includes(router.pathname);
    
    // Se não estiver carregando e não for página pública
    if (!loading && !isPublicPage) {
      if (!isAuthenticated) {
        // Redirecionar para login se não autenticado
        router.replace('/auth/login-premium');
      } else if (isAuthenticated && user) {
        // Redirecionar para dashboard apropriado se na página de login
        if (router.pathname === '/auth/login-premium' || router.pathname === '/auth/login') {
          const redirectMap = {
            admin: '/admin/dashboard',
            affiliate: '/affiliate/dashboard',
            user: '/dashboard-premium',
            operator: '/operator/dashboard',
            manager: '/manager/dashboard'
          };
          
          const redirectPath = redirectMap[user.role] || '/dashboard-premium';
          router.replace(redirectPath);
        }
      }
    }
  }, [isAuthenticated, user, loading, router]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-slate-900 flex items-center justify-center">
        <GlobalPremiumStyles />
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
          <p className="text-white mb-2">Carregando MarketBot Premium...</p>
          <p className="text-gray-400 text-sm">Conectando com sistemas de trading</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <GlobalPremiumStyles />
      <Component {...pageProps} />
    </>
  );
}