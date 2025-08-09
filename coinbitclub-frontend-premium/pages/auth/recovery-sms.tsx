import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiPhone, FiLock, FiArrowLeft, FiCheck, FiShield } from 'react-icons/fi';

const RecoveryBySMS: NextPage = () => {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'code' | 'success'>('phone');
  const [formData, setFormData] = useState({
    phone: '',
    code: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sentToPhone, setSentToPhone] = useState('');

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/recovery-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: formData.phone }),
      });

      const data = await response.json();

      if (response.ok) {
        setSentToPhone(data.phone);
        setStep('code');
      } else {
        setError(data.message || 'Erro ao enviar SMS');
      }
    } catch (error) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Senhas não coincidem');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-sms-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: formData.phone,
          code: formData.code,
          newPassword: formData.newPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep('success');
      } else {
        setError(data.message || 'Código inválido');
      }
    } catch (error) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  return (
    <>
      <Head>
        <title>Recuperação por SMS - CoinBitClub</title>
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-800 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiPhone className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Recuperar Senha
            </h1>
            <p className="text-gray-300 text-sm">
              {step === 'phone' && 'Digite seu telefone para receber o código'}
              {step === 'code' && 'Digite o código recebido por SMS'}
              {step === 'success' && 'Senha alterada com sucesso!'}
            </p>
          </div>

          {/* Step 1: Phone */}
          {step === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-white font-medium mb-2">
                  Número do Celular
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({
                      ...formData, 
                      phone: formatPhone(e.target.value)
                    })}
                    className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Enviaremos um código de 6 dígitos para este número
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <FiPhone className="w-5 h-5 mr-2" />
                    Enviar Código SMS
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2: Code Verification */}
          {step === 'code' && (
            <form onSubmit={handleCodeSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="bg-green-500/20 border border-green-500 text-green-200 px-4 py-3 rounded-lg text-sm">
                <FiCheck className="w-4 h-4 inline mr-2" />
                Código enviado para: <strong>{sentToPhone}</strong>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Código de Verificação
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={formData.code}
                  onChange={(e) => setFormData({
                    ...formData, 
                    code: e.target.value.replace(/\D/g, '')
                  })}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white text-center text-2xl tracking-widest placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="000000"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Digite o código de 6 dígitos recebido por SMS
                </p>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Nova Senha
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Repita a senha"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <FiShield className="w-5 h-5 mr-2" />
                    Alterar Senha
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-full text-gray-300 hover:text-white transition-colors text-sm"
              >
                ← Voltar para inserir telefone
              </button>
            </form>
          )}

          {/* Step 3: Success */}
          {step === 'success' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                <FiCheck className="w-8 h-8 text-white" />
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Senha Alterada!
                </h3>
                <p className="text-gray-300">
                  Sua senha foi alterada com sucesso. Agora você pode fazer login com a nova senha.
                </p>
              </div>

              <button
                onClick={() => router.push('/auth/login-premium')}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200"
              >
                Ir para Login
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 text-center">
            <Link 
              href="/auth/login-premium"
              className="text-gray-300 hover:text-white transition-colors text-sm flex items-center justify-center"
            >
              <FiArrowLeft className="w-4 h-4 mr-1" />
              Voltar ao Login
            </Link>
          </div>

          {/* Security Info */}
          <div className="mt-6 bg-blue-500/20 border border-blue-500 text-blue-200 px-4 py-3 rounded-lg text-xs">
            <FiShield className="w-4 h-4 inline mr-2" />
            <strong>Seguro:</strong> O código SMS expira em 15 minutos e só pode ser usado uma vez.
          </div>
        </div>
      </div>
    </>
  );
};

export default RecoveryBySMS;
