import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { useAuth } from '../../src/providers/AuthProvider';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft } from 'react-icons/fi';

const LoginPremiumPage: NextPage = () => {
  const router = useRouter();
  const { login, error, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    if (!formData.email || !formData.password) {
      setFormErrors({
        form: 'Por favor, preencha todos os campos'
      });
      return;
    }

    try {
      await login(formData.email, formData.password);
      // AuthProvider will handle redirect
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div>
      <Head>
        <title>Login Premium - CoinBitClub MARKETBOT</title>
        <meta name="description" content="Acesse sua conta premium CoinBitClub e monitore suas operações de trading em tempo real." />
        <link rel="icon" href="/logo-nova.jpg" />
        <link rel="apple-touch-icon" href="/logo-nova.jpg" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-slate-900 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <Link href="/" className="inline-flex items-center mb-6 text-yellow-400 hover:text-yellow-300 transition-colors">
              <FiArrowLeft className="w-5 h-5 mr-2" />
              Voltar para Home
            </Link>
            
            <div className="flex justify-center mb-6">
              <Link href="/" className="flex items-center space-x-3">
                <img 
                  src="/logo-nova.jpg" 
                  alt="CoinBitClub MARKETBOT" 
                  className="w-20 h-20 rounded-xl object-cover border-2 border-yellow-400/20"
                />
              </Link>
            </div>
            
            <div className="mb-6">
              <Link href="/" className="text-center">
                <h1 className="text-2xl font-bold text-white">CoinBitClub</h1>
                <p className="text-lg text-yellow-400 font-semibold">MARKETBOT PREMIUM</p>
              </Link>
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-2">
              Acesso Premium
            </h2>
            <p className="text-gray-400">
              Entre na plataforma de trading automatizado
            </p>
          </div>

          {/* Form */}
          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mt-8 space-y-6" 
            onSubmit={handleSubmit}
          >
            {(error || formErrors.form) && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error || formErrors.form}</p>
              </div>
            )}

            <div className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="email" className="sr-only">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-lg bg-gray-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    placeholder="Seu email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="sr-only">Senha</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="block w-full pl-10 pr-10 py-3 border border-gray-600 rounded-lg bg-gray-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    placeholder="Sua senha"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <FiEyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <FiEye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Link 
                href="/esqueci-senha" 
                className="text-sm text-yellow-400 hover:text-yellow-300"
              >
                Esqueci minha senha
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-black bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                  Entrando...
                </div>
              ) : (
                'Acessar Dashboard'
              )}
            </button>

            <div className="text-center">
              <p className="text-gray-400">
                Não tem uma conta?{' '}
                <Link href="/cadastro" className="text-yellow-400 hover:text-yellow-300 font-medium">
                  Cadastre-se grátis
                </Link>
              </p>
            </div>
          </motion.form>
        </div>
      </div>
    </div>
  );
};

export default LoginPremiumPage;
