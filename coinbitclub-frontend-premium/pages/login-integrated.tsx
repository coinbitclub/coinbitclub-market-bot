// ============================================================================
// 🔐 PÁGINA LOGIN PRINCIPAL INTEGRADA - SEM DADOS MOCK
// ============================================================================
// Página de login 100% integrada com backend Railway
// SMS + Email + JWT Authentication
// Status: INTEGRAÇÃO COMPLETA
// ============================================================================

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../src/contexts/AuthContextIntegrated';
import { SMSVerificationComponent } from '../src/components/SMSVerificationIntegrated';
import { 
  FiMail, 
  FiLock, 
  FiEye, 
  FiEyeOff, 
  FiArrowRight,
  FiShield,
  FiSmartphone,
  FiCheckCircle,
  FiAlertTriangle
} from 'react-icons/fi';

// 📱 Interface do componente
interface LoginState {
  email: string;
  password: string;
  showPassword: boolean;
  loading: boolean;
  error: string;
  step: 'login' | 'sms_verification';
  phoneNumber: string;
}

const LoginPage: React.FC = () => {
  const router = useRouter();
  const { login, user, isAuthenticated } = useAuth();
  
  const [state, setState] = useState<LoginState>({
    email: '',
    password: '',
    showPassword: false,
    loading: false,
    error: '',
    step: 'login',
    phoneNumber: ''
  });

  // 🔄 Redirect se já autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = user.role === 'admin' ? '/admin/dashboard-integrated' :
                          user.role === 'affiliate' ? '/affiliate/dashboard-integrated' :
                          '/user/dashboard-integrated';
      router.replace(redirectPath);
    }
  }, [isAuthenticated, user, router]);

  // 🚀 Função de login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!state.email || !state.password) {
      setState(prev => ({ ...prev, error: 'Preencha todos os campos' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: '' }));

    try {
      const result = await login(state.email, state.password);
      
      if (result.requiresSMS) {
        setState(prev => ({ 
          ...prev, 
          step: 'sms_verification',
          phoneNumber: user?.phone || '',
          loading: false 
        }));
      } else {
        // Login completo - redirect será feito pelo useEffect
        console.log('✅ Login successful:', result);
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Erro no login. Verifique suas credenciais.' 
      }));
    }
  };

  // 📱 Função de verificação SMS
  const handleSMSVerified = () => {
    console.log('✅ SMS verification completed');
    // Redirect será feito pelo useEffect quando user for atualizado
  };

  // 🎨 Renderizar verificação SMS
  if (state.step === 'sms_verification') {
    return (
      <>
        <Head>
          <title>Verificação SMS - CoinBitClub</title>
          <meta name="description" content="Verificação de SMS para acesso seguro" />
        </Head>

        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black px-4">
          <div className="max-w-md w-full">
            <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiSmartphone className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Verificação SMS</h1>
                <p className="text-gray-400">
                  Enviamos um código para {state.phoneNumber}
                </p>
              </div>

              <SMSVerificationComponent
                phoneNumber={state.phoneNumber}
                onVerified={handleSMSVerified}
                onBack={() => setState(prev => ({ ...prev, step: 'login' }))}
              />
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Login - CoinBitClub</title>
        <meta name="description" content="Acesse sua conta CoinBitClub com segurança" />
        <meta property="og:title" content="Login - CoinBitClub" />
        <meta property="og:description" content="Plataforma de trading e investimentos em criptomoedas" />
      </Head>

      <div className="min-h-screen flex">
        {/* Left Side - Login Form */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
          <div className="max-w-sm w-full space-y-8">
            {/* Logo */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-black">₿</span>
              </div>
              <h2 className="text-3xl font-bold text-white">Bem-vindo de volta</h2>
              <p className="mt-2 text-gray-400">
                Entre na sua conta CoinBitClub
              </p>
            </div>

            {/* Error Message */}
            {state.error && (
              <div className="bg-red-900/50 border border-red-600 rounded-lg p-4 flex items-center">
                <FiAlertTriangle className="w-5 h-5 text-red-400 mr-3 flex-shrink-0" />
                <span className="text-red-400 text-sm">{state.error}</span>
              </div>
            )}

            {/* Login Form */}
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    disabled={state.loading}
                    value={state.email}
                    onChange={(e) => setState(prev => ({ ...prev, email: e.target.value }))}
                    className="appearance-none relative block w-full px-4 py-3 pl-12 border border-gray-600 placeholder-gray-400 text-white rounded-lg bg-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent disabled:opacity-50"
                    placeholder="seu@email.com"
                  />
                  <FiMail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={state.showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    disabled={state.loading}
                    value={state.password}
                    onChange={(e) => setState(prev => ({ ...prev, password: e.target.value }))}
                    className="appearance-none relative block w-full px-4 py-3 pl-12 pr-12 border border-gray-600 placeholder-gray-400 text-white rounded-lg bg-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent disabled:opacity-50"
                    placeholder="Sua senha"
                  />
                  <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <button
                    type="button"
                    onClick={() => setState(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {state.showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-600 rounded bg-gray-700"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400">
                    Lembrar de mim
                  </label>
                </div>

                <div className="text-sm">
                  <Link href="/forgot-password" className="font-medium text-yellow-400 hover:text-yellow-300">
                    Esqueceu a senha?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={state.loading || !state.email || !state.password}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-black bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {state.loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                      Entrando...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      Entrar
                      <FiArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </button>
              </div>
            </form>

            {/* Security Features */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center mb-3">
                <FiShield className="w-5 h-5 text-green-400 mr-2" />
                <span className="text-sm font-medium text-gray-300">Login Seguro</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center text-xs text-gray-400">
                  <FiCheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Autenticação JWT
                </div>
                <div className="flex items-center text-xs text-gray-400">
                  <FiCheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Verificação SMS
                </div>
                <div className="flex items-center text-xs text-gray-400">
                  <FiCheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Criptografia SSL
                </div>
              </div>
            </div>

            {/* Register Link */}
            <div className="text-center">
              <span className="text-gray-400">Não tem uma conta? </span>
              <Link 
                href="/register-integrated" 
                className="font-medium text-yellow-400 hover:text-yellow-300 transition-colors"
              >
                Criar conta
              </Link>
            </div>
          </div>
        </div>

        {/* Right Side - Background */}
        <div className="hidden lg:block relative w-0 flex-1">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10"></div>
            
            {/* Animated Background Elements */}
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-yellow-500/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
            
            {/* Content */}
            <div className="relative h-full flex items-center justify-center p-12">
              <div className="text-center max-w-md">
                <h1 className="text-4xl font-bold text-white mb-6">
                  Sua Plataforma de Cripto Trading
                </h1>
                <p className="text-xl text-gray-300 mb-8">
                  Invista, trade e ganhe com as melhores estratégias do mercado
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center p-4 bg-white/5 rounded-lg backdrop-blur-sm">
                    <div className="text-2xl font-bold text-yellow-400">24/7</div>
                    <div className="text-gray-300">Suporte</div>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-lg backdrop-blur-sm">
                    <div className="text-2xl font-bold text-green-400">+15%</div>
                    <div className="text-gray-300">ROI Médio</div>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-lg backdrop-blur-sm">
                    <div className="text-2xl font-bold text-blue-400">1000+</div>
                    <div className="text-gray-300">Usuários</div>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-lg backdrop-blur-sm">
                    <div className="text-2xl font-bold text-purple-400">SSL</div>
                    <div className="text-gray-300">Segurança</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
