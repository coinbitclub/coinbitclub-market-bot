import React from 'react';
/**
 * PÁGINA DE LOGIN ADMIN
 */
import { NextPage } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import { authService } from '../../src/services/auth';

const AdminLogin: NextPage = () => {
  const [email, setEmail] = useState('admin@coinbitclub.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authService.login({ email, password });
      // Redirecionar para dashboard real
      window.location.href = '/admin/dashboard-real';
    } catch (error) {
      setError('Email ou senha incorretos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login Admin | CoinBitClub</title>
      </Head>
      
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, #000000 0%, #111111 100%)'
      }}>
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2" style={{
              background: 'linear-gradient(45deg, #FFD700, #FF69B4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              🚀 CoinBitClub
            </h1>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
              Painel Administrativo
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
                  onChange={(e) = /> setEmail(e.target.value)}
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
                  onChange={(e) = /> setPassword(e.target.value)}
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
                {loading ? 'Entrando...' : 'Entrar no Painel Admin'}
              </button>
            </div>
          </form>
          
          {/* Credenciais para teste */}
          <div className="mt-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
            <h3 className="text-sm font-medium text-yellow-400 mb-2">Credenciais de Teste:</h3>
            <div className="space-y-1 text-xs text-gray-300">
              <p><strong>Email:</strong> admin@coinbitclub.com</p>
              <p><strong>Senha:</strong> admin123</p>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              * Use estas credenciais para acessar o painel administrativo
            </p>
          </div>

          {/* Informações do sistema */}
          <div className="mt-6 p-4 bg-blue-900/20 rounded-lg border border-blue-700">
            <h3 className="text-sm font-medium text-blue-400 mb-2">Status do Sistema:</h3>
            <div className="space-y-1 text-xs text-gray-300">
              <p>🟢 Frontend: Online</p>
              <p>🟢 Backend API: localhost:8085</p>
              <p>🟢 Database: PostgreSQL Connected</p>
              <p>🔴 RabbitMQ: Disconnected (não crítico)</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminLogin;
