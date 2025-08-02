import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../src/contexts/AuthContextIntegrated';
import SmsVerification from '../../src/components/SmsVerification';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

const LoginPremiumPage: NextPage = () => {
  const router = useRouter();
  const { login, sendSMSVerification, verifySMSCode, loading, smsStep, tempPhone } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(''); // Limpar erro ao digitar
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.requiresSMS) {
        setSuccess(result.message || 'Código SMS enviado!');
      } else {
        setSuccess('Login realizado com sucesso!');
        // Redirecionamento é feito automaticamente pelo AuthContext
      }
    } catch (error: any) {
      setError(error.message || 'Erro no login');
    }
  };

  const handleSMSSuccess = async (code: string) => {
    if (!tempPhone) throw new Error('Telefone não encontrado');
    
    await verifySMSCode(tempPhone, code);
  };

  const handleSMSResend = async () => {
    if (!tempPhone) throw new Error('Telefone não encontrado');
    
    const result = await sendSMSVerification(tempPhone);
    if (!result.success) {
      throw new Error(result.message);
    }
  };

  // Se estiver na etapa de SMS, mostrar componente de verificação
  if (smsStep === 'pending' && tempPhone) {
    return (
      <SmsVerification
        phone={tempPhone}
        onSuccess={handleSMSSuccess}
        onResend={handleSMSResend}
        loading={loading}
        title="Verificação SMS"
        subtitle="Digite o código enviado para concluir seu login"
      />
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      return;
    }

    setIsLoading(true);
    
    try {
      await login(formData);
      console.log('✅ Login realizado com sucesso');
    } catch (err: any) {
      console.error('❌ Erro no login:', err);
      // Erro já tratado pelo store
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setFormData({
      email: 'faleconosco@coinbitclub.vip',
      password: 'password'
    });
  };

  const isFormValid = formData.email && formData.password && formData.email.includes('@');

  return (
    <>
      <Head>
        <title>Login - CoinBitClub MarketBot</title>
        <meta name="description" content="Acesse sua conta CoinBitClub e comece a operar com IA" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-950 to-slate-900 p-4">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="relative w-full max-w-md">
          {/* Login Card */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center text-2xl font-bold text-black">
                ₿
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent">
                Bem-vindo de volta
              </h1>
              <p className="text-gray-400 text-sm mt-2">
                Entre na sua conta CoinBitClub
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center">
                  <div className="text-red-400 mr-3">⚠️</div>
                  <div className="text-red-300 text-sm">{error}</div>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="faleconosco@coinbitclub.vip"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all duration-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all duration-200"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center text-sm text-gray-400">
                  <input type="checkbox" className="mr-2 rounded" />
                  Lembrar de mim
                </label>
                <div className="flex flex-col space-y-1">
                  <Link href="/auth/forgot-password" className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors">
                    Esqueci a senha
                  </Link>
                  <Link href="/auth/recovery-sms" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                    📱 Recuperar por SMS
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={!isFormValid || isLoading}
                className={`w-full py-3 px-4 rounded-lg font-semibold text-black transition-all duration-200 ${
                  isFormValid && !isLoading
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 shadow-lg hover:shadow-yellow-400/25 transform hover:scale-[1.02]'
                    : 'bg-gray-600 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                    Entrando...
                  </div>
                ) : (
                  'Entrar →'
                )}
              </button>

              {/* Demo Login */}
              <button
                type="button"
                onClick={handleDemoLogin}
                className="w-full py-2 px-4 border border-yellow-400/30 rounded-lg text-yellow-400 hover:bg-yellow-400/10 transition-all duration-200 text-sm"
              >
                🚀 Usar Credenciais Demo
              </button>
            </form>

            {/* Security Info */}
            <div className="mt-8 p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg">
              <h4 className="text-green-400 font-semibold text-sm mb-2 flex items-center">
                🔒 Login Seguro
              </h4>
              <div className="text-xs text-gray-400 space-y-1">
                <div>✅ Autenticação JWT</div>
                <div>✅ Verificação SMS</div>
                <div>✅ SSL/TLS Encryption</div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-6">
              <p className="text-gray-400 text-sm">
                Não tem uma conta?{' '}
                <Link href="/auth/register" className="text-yellow-400 hover:text-yellow-300 transition-colors">
                  Cadastre-se
                </Link>
              </p>
            </div>
          </div>

          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl">
                <div className="w-8 h-8 border-3 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-white text-sm">Verificando credenciais...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default LoginPremiumPage;
