"use client";

import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';

const LoginPage: NextPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Integração real com backend
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Salvar dados de autenticação
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_data', JSON.stringify(data.user));
        
        // Salvar cookies para middleware
        document.cookie = `auth_token=${data.token}; path=/; max-age=86400`;
        document.cookie = `user_data=${JSON.stringify(data.user)}; path=/; max-age=86400`;
        
        toast.success('Login realizado com sucesso!');
        
        // Redirecionamento baseado no role do usuário
        const userRole = data.user.role || data.user.user_type || 'user';
        let redirectPath = '/dashboard';
        
        switch (userRole.toLowerCase()) {
          case 'admin':
            redirectPath = '/admin/dashboard';
            break;
          case 'affiliate':
          case 'afiliado':
            redirectPath = '/affiliate/dashboard';
            break;
          case 'gestor':
          case 'manager':
            redirectPath = '/gestor/dashboard';
            break;
          case 'operador':
          case 'operator':
            redirectPath = '/operador/dashboard';
            break;
          default:
            redirectPath = '/user/dashboard';
        }
        
        router.push(redirectPath);
      } else {
        setError(data.message || 'Credenciais inválidas');
        toast.error(data.message || 'Erro ao fazer login');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      setError('Erro de conexão com o servidor');
      toast.error('Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login - CoinBitClub</title>
      </Head>
      
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="max-w-md w-full bg-gray-800 p-8 rounded-lg">
          <h1 className="text-3xl font-bold text-center mb-8 text-yellow-400">
            Login CoinBitClub
          </h1>
          
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
            
            <div>
              <label className="block text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="seu@email.com"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-300 mb-2">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="Sua senha"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-500 text-black py-3 rounded-lg font-bold hover:bg-yellow-400 transition-colors disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
          
          <div className="mt-6 p-4 bg-gray-900 rounded-lg text-center">
            <p className="text-sm text-gray-400">Credenciais de teste:</p>
            <p className="text-sm text-gray-300">admin@coinbitclub.com / admin123</p>
            <p className="text-sm text-gray-300">user@coinbitclub.com / user123</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;