import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../src/contexts/AuthContextIntegrated';
import { SMSVerificationComponent } from '../../src/components/SMSVerificationIntegrated';
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

  const handleSMSSuccess = async () => {
    // Código já foi verificado pelo componente interno
    // Apenas limpar estado e redirecionar
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
      <SMSVerificationComponent
        phoneNumber={tempPhone}
        onVerified={handleSMSSuccess}
        onBack={() => {/* voltar ao login */}}
        title="Verificação SMS"
        subtitle="Digite o código enviado para concluir seu login"
      />
    );
  }

  return (
    <>
      <Head>
        <title>Login Premium - CoinBitClub</title>
        <meta name="description" content="Faça login na sua conta CoinBitClub Premium" />
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-gray-800 p-4">
        <div className="w-full max-w-md">
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
            {/* Logo e Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-black">₿</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">⚡ CoinBitClub Premium ⚡</h1>
              <p className="text-gray-400">Entre na sua conta premium</p>
            </div>

            {/* Mensagens */}
            {error && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-600 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-900/50 border border-green-600 rounded-lg">
                <p className="text-green-400 text-sm">{success}</p>
              </div>
            )}

            {/* Formulário de Login */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                    placeholder="seu@email.com"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Senha */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                    placeholder="Sua senha"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                    ) : (
                      <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                    )}
                  </button>
                </div>
              </div>

              {/* Lembrar-me */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                    className="h-4 w-4 text-yellow-500 focus:ring-yellow-500 border-gray-600 rounded bg-gray-700"
                    disabled={loading}
                  />
                  <label className="ml-2 block text-sm text-gray-300">
                    Lembrar-me
                  </label>
                </div>
                <Link
                  href="/auth/forgot-password-integrated"
                  className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors"
                >
                  Esqueceu a senha?
                </Link>
              </div>

              {/* Botão de Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-black bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                    Entrando...
                  </div>
                ) : (
                  '🚀 Entrar'
                )}
              </button>
            </form>

            {/* Links */}
            <div className="mt-6 text-center space-y-2">
              <p className="text-gray-400 text-sm">
                Não tem uma conta?{' '}
                <Link
                  href="/auth/register"
                  className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors"
                >
                  Criar conta gratuita
                </Link>
              </p>
              <p className="text-gray-500 text-xs">
                Ao entrar, você concorda com nossos{' '}
                <Link href="/terms" className="text-yellow-400 hover:text-yellow-300">
                  Termos de Uso
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              © 2025 CoinBitClub. Sistema premium de trading automatizado.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPremiumPage;
