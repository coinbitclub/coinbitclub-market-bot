"use client";

import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';

const LoginPage: NextPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulação de login - substituir por API real
    setTimeout(() => {
      if (email === 'admin@coinbitclub.com' && password === 'admin123') {
        router.push('/dashboard-simple');
      } else {
        alert('Credenciais inválidas');
      }
      setLoading(false);
    }, 1000);
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
            <p className="text-sm text-gray-400">Demo:</p>
            <p className="text-sm text-gray-300">admin@coinbitclub.com / admin123</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;