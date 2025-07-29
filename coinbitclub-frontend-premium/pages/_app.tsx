import type { AppProps } from 'next/app';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AuthProvider } from '../src/providers/AuthProvider';
import { GlobalPremiumStyles } from '../src/styles/GlobalPremiumStyles';
import '../styles/globals.css';

// Páginas que não precisam de autenticação
const publicPages = [
  '/',
  '/planos',
  '/cadastro',
  '/politicas',
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
  const [mounted, setMounted] = useState(false);

  // Garantir que só executa no cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  // Loading state para SSR
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-slate-900 flex items-center justify-center">
        <GlobalPremiumStyles />
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <div className="mb-4">
            <img 
              src="/logo-nova.jpg" 
              alt="CoinBitClub" 
              className="w-16 h-16 rounded-xl object-cover border-2 border-yellow-400/20 mx-auto mb-4"
            />
            <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent">
              CoinBitClub
            </h1>
            <p className="text-sm text-yellow-400 font-semibold">MARKETBOT</p>
          </div>
          <p className="text-white mb-2">Carregando sistema...</p>
          <p className="text-gray-400 text-sm">Inicializando plataforma</p>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <GlobalPremiumStyles />
      <Component {...pageProps} />
    </AuthProvider>
  );
}