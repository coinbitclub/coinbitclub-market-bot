// ============================================================================
// 🚀 APP INTEGRADO COMPLETO - SEM DADOS MOCK
// ============================================================================
// App principal 100% integrado com backend
// Autenticação completa via Railway API
// Status: INTEGRAÇÃO COMPLETA
// ============================================================================

import type { AppProps } from 'next/app';
import Head from 'next/head';
import { AuthProvider } from '../src/contexts/AuthContextIntegrated';
import '../styles/globals.css';

// 🎯 Component da App Principal
function CoinBitClubApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#000000" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Meta Tags Globais */}
        <meta name="author" content="CoinBitClub" />
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="CoinBitClub" />
        <meta name="twitter:card" content="summary_large_image" />
        
        {/* Preconnect para APIs */}
        <link rel="preconnect" href="https://coinbitclub-market-bot.up.railway.app" />
        <link rel="dns-prefetch" href="https://coinbitclub-market-bot.up.railway.app" />
      </Head>

      {/* Provider de Autenticação Integrada */}
      <AuthProvider>
        <div className="min-h-screen bg-gray-900">
          <Component {...pageProps} />
        </div>
      </AuthProvider>
    </>
  );
}

export default CoinBitClubApp;
