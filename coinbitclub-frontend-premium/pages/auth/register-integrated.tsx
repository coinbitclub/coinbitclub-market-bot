import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../../src/contexts/AuthContextIntegrated';
import SmsVerification from '../../src/components/SmsVerification';
import { FiUser, FiMail, FiLock, FiPhone, FiEye, FiEyeOff, FiCheck } from 'react-icons/fi';

const RegisterPage: NextPage = () => {
  const { register, sendSMSVerification, verifySMSCode, loading, smsStep, tempPhone } = useAuth();
  
  const [step, setStep] = useState(1); // 1: dados, 2: sms, 3: sucesso
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    location: 'brasil' as 'brasil' | 'exterior',
    referral_code: '',
    terms_accepted: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const formatPhone = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Aplica máscara (XX) XXXXX-XXXX
    if (numbers.length <= 2) {
      return `(${numbers}`;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Nome é obrigatório');
      return false;
    }

    if (!formData.email.trim()) {
      setError('Email é obrigatório');
      return false;
    }

    if (!formData.email.includes('@')) {
      setError('Email inválido');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Senhas não conferem');
      return false;
    }

    const phoneNumbers = formData.phone.replace(/\D/g, '');
    if (phoneNumbers.length !== 11) {
      setError('Telefone deve ter 11 dígitos');
      return false;
    }

    if (!formData.terms_accepted) {
      setError('Você deve aceitar os termos de uso');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setError('');
    setSuccess('');

    try {
      // Formatar telefone para o padrão internacional
      const phoneNumbers = formData.phone.replace(/\D/g, '');
      const formattedPhone = `+55${phoneNumbers}`;

      const result = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formattedPhone,
        terms_accepted: formData.terms_accepted,
        location: formData.location,
        referral_code: formData.referral_code || undefined
      });
      
      if (result.requiresSMS) {
        setSuccess(result.message || 'Código SMS enviado!');
        setStep(2);
      } else {
        setSuccess('Cadastro realizado com sucesso!');
        setStep(3);
      }
    } catch (error: any) {
      setError(error.message || 'Erro no cadastro');
    }
  };

  const handleSMSSuccess = async (code: string) => {
    if (!tempPhone) throw new Error('Telefone não encontrado');
    
    await verifySMSCode(tempPhone, code);
    setStep(3);
  };

  const handleSMSResend = async () => {
    if (!tempPhone) throw new Error('Telefone não encontrado');
    
    const result = await sendSMSVerification(tempPhone);
    if (!result.success) {
      throw new Error(result.message);
    }
  };

  // Etapa 2: Verificação SMS
  if (step === 2 || (smsStep === 'pending' && tempPhone)) {
    return (
      <SmsVerification
        phone={tempPhone || formData.phone}
        onSuccess={handleSMSSuccess}
        onResend={handleSMSResend}
        loading={loading}
        title="Verificação SMS"
        subtitle="Digite o código enviado para ativar sua conta"
      />
    );
  }

  // Etapa 3: Sucesso
  if (step === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-gray-800 p-4">
        <div className="w-full max-w-md">
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700 text-center">
            <div className="w-20 h-20 bg-green-600 rounded-full mx-auto mb-6 flex items-center justify-center">
              <FiCheck className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Cadastro Concluído!</h2>
            <p className="text-gray-400 mb-6">
              Sua conta foi criada com sucesso. Você já pode começar a usar a plataforma.
            </p>
            <Link 
              href="/auth/login"
              className="inline-block w-full py-3 px-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-medium rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all"
            >
              Fazer Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Etapa 1: Formulário de Cadastro
  return (
    <>
      <Head>
        <title>Cadastro - CoinBitClub</title>
        <meta name="description" content="Crie sua conta CoinBitClub" />
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-gray-800 p-4">
        <div className="w-full max-w-md">
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-black">₿</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Criar Conta</h1>
              <p className="text-gray-400">Junte-se ao CoinBitClub</p>
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

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Nome Completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                    placeholder="Seu nome completo"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
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

              {/* Telefone */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Telefone (com DDD)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiPhone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', formatPhone(e.target.value))}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Localização */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Localização
                </label>
                <select
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="block w-full py-3 px-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                  disabled={loading}
                >
                  <option value="brasil">Brasil</option>
                  <option value="exterior">Exterior</option>
                </select>
              </div>

              {/* Senha */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
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
                    placeholder="Mínimo 6 caracteres"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                    ) : (
                      <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirmar Senha */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                    placeholder="Repita sua senha"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                    ) : (
                      <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                    )}
                  </button>
                </div>
              </div>

              {/* Código de Indicação (Opcional) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Código de Indicação (Opcional)
                </label>
                <input
                  type="text"
                  value={formData.referral_code}
                  onChange={(e) => handleInputChange('referral_code', e.target.value.toUpperCase())}
                  className="block w-full py-3 px-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                  placeholder="Ex: ABC123"
                  disabled={loading}
                />
              </div>

              {/* Termos */}
              <div className="flex items-start">
                <input
                  id="terms"
                  type="checkbox"
                  checked={formData.terms_accepted}
                  onChange={(e) => handleInputChange('terms_accepted', e.target.checked)}
                  className="mt-1 h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-600 rounded bg-gray-700"
                  disabled={loading}
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-300">
                  Aceito os{' '}
                  <Link href="/terms" className="text-yellow-400 hover:text-yellow-300">
                    termos de uso
                  </Link>{' '}
                  e{' '}
                  <Link href="/privacy" className="text-yellow-400 hover:text-yellow-300">
                    política de privacidade
                  </Link>
                </label>
              </div>

              {/* Botão de Cadastro */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-black bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                    Criando conta...
                  </div>
                ) : (
                  'Criar Conta'
                )}
              </button>
            </form>

            {/* Link para Login */}
            <div className="mt-6 text-center">
              <p className="text-gray-400">
                Já tem uma conta?{' '}
                <Link href="/auth/login" className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors">
                  Fazer login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterPage;
