import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    // Verificar status do backend
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setStatus('connected'))
      .catch(() => setStatus('error'));
  }, []);

  return (
    <>
      <Head>
        <title>CoinbitClub MarketBot</title>
        <meta name="description" content="Sistema de Trading Automatizado" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center text-white">
            <h1 className="text-5xl font-bold mb-6">
              CoinbitClub MarketBot
            </h1>
            <p className="text-xl mb-8">
              Sistema de Trading Automatizado com IA
            </p>
            
            <div className="mb-8">
              <div className={`inline-flex items-center px-4 py-2 rounded-full ${
                status === 'connected' ? 'bg-green-500' : 
                status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
              }`}>
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  status === 'connected' ? 'bg-green-200' : 
                  status === 'error' ? 'bg-red-200' : 'bg-yellow-200'
                }`}></div>
                Sistema: {status === 'connected' ? 'Online' : 
                         status === 'error' ? 'Offline' : 'Verificando...'}
              </div>
            </div>

            <div className="space-x-4">
              <Link href="/login">
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg">
                  Fazer Login
                </button>
              </Link>
              <Link href="/register">
                <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg">
                  Criar Conta
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}