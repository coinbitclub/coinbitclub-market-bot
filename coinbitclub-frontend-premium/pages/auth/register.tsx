import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  FiUser, 
  FiMail, 
  FiLock, 
  FiPhone, 
  FiEye, 
  FiEyeOff,
  FiCheck,
  FiArrowLeft,
  FiShield,
  FiLoader,
  FiGlobe
} from 'react-icons/fi';

interface FormData {
  fullName: string;
  email: string;
  whatsapp: string;
  password: string;
  confirmPassword: string;
  country: string;
  userType: 'individual' | 'business';
  verificationCode: string;
}

const RegisterPage: NextPage = () => {
  const router = useRouter();
  const [step, setStep] = useState<'register' | 'verify' | 'success'>('register');
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    whatsapp: '',
    password: '',
    confirmPassword: '',
    country: 'Brasil',
    userType: 'individual',
    verificationCode: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [sentToPhone, setSentToPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validações básicas
    if (!formData.fullName || !formData.email || !formData.whatsapp || !formData.password || !formData.country) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem.');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      // Primeiro, enviar código SMS para o backend Railway
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://coinbitclub-market-bot.up.railway.app';
      const response = await fetch(`${apiUrl}/api/auth/verify-phone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: formData.whatsapp,
          email: formData.email
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSentToPhone(data.phone);
        setStep('verify');
      } else {
        setError(data.message || 'Erro ao enviar código SMS');
      }
    } catch (error) {
      console.error('Phone verification error:', error);
      setError('Erro de conexão. Tente novamente.');
    }

    setLoading(false);
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Confirmar código SMS no backend Railway
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://coinbitclub-market-bot.up.railway.app';
      const phoneResponse = await fetch(`${apiUrl}/api/auth/confirm-phone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: formData.whatsapp,
          code: formData.verificationCode
        }),
      });

      const phoneData = await phoneResponse.json();

      if (!phoneResponse.ok) {
        setError(phoneData.message || 'Código inválido');
        setLoading(false);
        return;
      }

      // Criar usuário no backend Railway
      const registerResponse = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          whatsapp: formData.whatsapp,
          password: formData.password,
          country: formData.country,
          userType: formData.userType,
          phoneVerified: true
        }),
      });

      const registerData = await registerResponse.json();

      if (registerResponse.ok) {
        setStep('success');
      } else {
        setError(registerData.message || 'Erro ao criar conta');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Erro de conexão. Tente novamente.');
    }

    setLoading(false);
  };

  return (
    <>
      <Head>
        <title>Cadastro - CoinBitClub MarketBot</title>
        <meta name="description" content="Crie sua conta na CoinBitClub e comece a operar com IA" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-950 to-slate-900 p-4">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="relative w-full max-w-md">
          {/* Back Button */}
          <div className="mb-6">
            <Link href="/" className="inline-flex items-center text-gray-400 hover:text-yellow-400 transition-colors">
              <FiArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao início
            </Link>
          </div>

          {/* Register Card */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
            {/* Logo and Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center text-2xl font-bold text-black">
                {step === 'register' && '₿'}
                {step === 'verify' && '📱'}
                {step === 'success' && '✅'}
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent">
                {step === 'register' && 'Criar Conta'}
                {step === 'verify' && 'Verificar Telefone'}
                {step === 'success' && 'Conta Criada!'}
              </h1>
              <p className="text-gray-400 text-sm mt-2">
                {step === 'register' && 'Junte-se à CoinBitClub e comece a operar'}
                {step === 'verify' && 'Digite o código enviado por SMS'}
                {step === 'success' && 'Bem-vindo à CoinBitClub!'}
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

            {/* Step 1: Registration Form */}
            {step === 'register' && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Seu nome completo"
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    País
                  </label>
                  <div className="relative">
                    <FiGlobe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <select
                      value={formData.country}
                      onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all duration-200 appearance-none"
                      required
                    >
                      <option value="Brasil" className="bg-gray-800">🇧🇷 Brasil</option>
                      <option value="Portugal" className="bg-gray-800">🇵🇹 Portugal</option>
                      <option value="Argentina" className="bg-gray-800">🇦🇷 Argentina</option>
                      <option value="Chile" className="bg-gray-800">🇨🇱 Chile</option>
                      <option value="Uruguai" className="bg-gray-800">🇺🇾 Uruguai</option>
                      <option value="Paraguay" className="bg-gray-800">🇵🇾 Paraguay</option>
                      <option value="Bolivia" className="bg-gray-800">🇧🇴 Bolivia</option>
                      <option value="Peru" className="bg-gray-800">🇵🇪 Peru</option>
                      <option value="Colombia" className="bg-gray-800">🇨🇴 Colombia</option>
                      <option value="Venezuela" className="bg-gray-800">🇻🇪 Venezuela</option>
                      <option value="Ecuador" className="bg-gray-800">🇪🇨 Ecuador</option>
                      <option value="Mexico" className="bg-gray-800">🇲🇽 México</option>
                      <option value="Estados Unidos" className="bg-gray-800">🇺🇸 Estados Unidos</option>
                      <option value="Canada" className="bg-gray-800">🇨🇦 Canadá</option>
                      <option value="Espanha" className="bg-gray-800">🇪🇸 Espanha</option>
                      <option value="Outro" className="bg-gray-800">🌍 Outro</option>
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    🌍 Selecione seu país de residência
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="seu@email.com"
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    WhatsApp
                  </label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        whatsapp: formatPhone(e.target.value)
                      }))}
                      placeholder="(11) 99999-9999"
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all duration-200"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    📱 Enviaremos um código de verificação por SMS
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all duration-200"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirmar Senha
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Repita a senha"
                      className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all duration-200"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tipo de Conta
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, userType: 'individual' }))}
                        className={`p-3 rounded-lg border text-center transition-all duration-200 ${
                          formData.userType === 'individual'
                            ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                            : 'border-white/10 text-gray-400 hover:border-yellow-400/50'
                        }`}
                      >
                        <FiUser className="w-5 h-5 mx-auto mb-1" />
                        <div className="text-sm">Individual</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, userType: 'business' }))}
                        className={`p-3 rounded-lg border text-center transition-all duration-200 ${
                          formData.userType === 'business'
                            ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                            : 'border-white/10 text-gray-400 hover:border-yellow-400/50'
                        }`}
                      >
                        <FiShield className="w-5 h-5 mx-auto mb-1" />
                        <div className="text-sm">Empresa</div>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-500/10 border border-blue-400/20 rounded-lg">
                  <div className="flex items-center">
                    <FiPhone className="w-4 h-4 text-blue-400 mr-2" />
                    <span className="text-blue-300 text-sm">
                      <strong>Verificação SMS:</strong> Enviaremos um código para verificar seu telefone
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 px-4 rounded-lg font-semibold text-black transition-all duration-200 ${
                    !loading
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 shadow-lg hover:shadow-yellow-400/25 transform hover:scale-[1.02]'
                      : 'bg-gray-600 cursor-not-allowed'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <FiLoader className="w-5 h-5 animate-spin mr-2" />
                      Enviando código...
                    </div>
                  ) : (
                    <>
                      <FiPhone className="w-5 h-5 inline mr-2" />
                      Enviar Código SMS
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Step 2: Phone Verification */}
            {step === 'verify' && (
              <form onSubmit={handleVerifySubmit} className="space-y-6">
                <div className="p-4 bg-green-500/10 border border-green-400/20 rounded-lg">
                  <div className="flex items-center">
                    <FiCheck className="w-4 h-4 text-green-400 mr-2" />
                    <span className="text-green-300 text-sm">
                      Código enviado para: <strong>{sentToPhone}</strong>
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Código de Verificação
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={formData.verificationCode}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      verificationCode: e.target.value.replace(/\D/g, '') 
                    }))}
                    placeholder="000000"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-center text-2xl tracking-widest placeholder-gray-500 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all duration-200"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    Digite o código de 6 dígitos recebido por SMS
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 px-4 rounded-lg font-semibold text-black transition-all duration-200 ${
                    !loading
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 shadow-lg hover:shadow-yellow-400/25 transform hover:scale-[1.02]'
                      : 'bg-gray-600 cursor-not-allowed'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <FiLoader className="w-5 h-5 animate-spin mr-2" />
                      Verificando...
                    </div>
                  ) : (
                    <>
                      <FiShield className="w-5 h-5 inline mr-2" />
                      Verificar e Criar Conta
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('register')}
                  className="w-full text-gray-400 hover:text-white transition-colors text-sm py-2"
                >
                  ← Voltar aos dados do cadastro
                </button>
              </form>
            )}

            {/* Step 3: Success */}
            {step === 'success' && (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto">
                  <FiCheck className="w-8 h-8 text-white" />
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Conta Criada com Sucesso!
                  </h3>
                  <p className="text-gray-400">
                    Bem-vindo à CoinBitClub! Sua conta foi criada e seu telefone verificado.
                  </p>
                </div>

                <button
                  onClick={() => router.push('/auth/login-premium')}
                  className="w-full py-3 px-4 rounded-lg font-semibold text-black bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-300 hover:to-blue-400 shadow-lg hover:shadow-green-400/25 transform hover:scale-[1.02] transition-all duration-200"
                >
                  Fazer Login →
                </button>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-gray-400 text-sm">
                Já tem uma conta?{' '}
                <Link 
                  href="/auth/login-premium"
                  className="text-yellow-400 hover:text-yellow-300 transition-colors"
                >
                  Faça login
                </Link>
              </p>
            </div>

            {/* Security Info */}
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-400/20 rounded-lg">
              <div className="flex items-center text-xs text-blue-300">
                <FiShield className="w-4 h-4 mr-2" />
                <span>
                  <strong>Seguro:</strong> Verificamos seu telefone para garantir a segurança da sua conta.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterPage;