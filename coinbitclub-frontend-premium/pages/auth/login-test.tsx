import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';

const LoginTestPage: NextPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Login bem-sucedido
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirecionar baseado no role
        const redirectMap = {
          'admin': '/admin/dashboard',
          'user': '/user/dashboard',
          'affiliate': '/affiliate/dashboard',
          'gestor': '/gestor/dashboard',
          'operador': '/operador/dashboard',
          'supervisor': '/supervisor/dashboard'
        };
        
        const redirectPath = redirectMap[data.user.role as keyof typeof redirectMap] || '/user/dashboard';
        router.replace(redirectPath);
      } else {
        setError(data.message || 'Erro no login');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login Teste - CoinBitClub</title>
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-800 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              🧪 Login Teste Simples
            </h1>
            <p className="text-gray-300">
              Versão sem Zustand para debug
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-white font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="admin@coinbitclub.com"
                required
              />
            </div>

            <div>
              <label className="block text-white font-medium mb-2">
                Senha
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Admin123!"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-violet-600 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-violet-700 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-300 text-sm">
              🔍 Credenciais de teste:
            </p>
            <p className="text-gray-400 text-xs mt-2">
              admin@coinbitclub.com / Admin123!<br/>
              user@coinbitclub.com / User123!
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginTestPage;
