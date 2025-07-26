import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiPhone, FiCheck, FiAlertCircle, FiLoader, FiArrowLeft } from 'react-icons/fi';
import {
  MobileCard, MobileInput, MobileButton, MobileAlert
} from '../../components/mobile/MobileComponents';

interface FormData {
  fullName: string;
  email: string;
  whatsapp: string;
  password: string;
  confirmPassword: string;
  userType: 'individual' | 'business';
}

const RegisterPage: NextPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    whatsapp: '',
    password: '',
    confirmPassword: '',
    userType: 'individual'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validações básicas
    if (!formData.fullName || !formData.email || !formData.whatsapp || !formData.password) {
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
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          whatsapp: formData.whatsapp,
          password: formData.password,
          userType: formData.userType
        }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/auth/login?message=Conta criada com sucesso! Faça login para continuar.');
      } else {
        setError(data.message || 'Erro ao criar conta');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Erro de conexão. Tente novamente.');
    }

    setLoading(false);
  };

  return (
    <div>
      <Head>
        <title>Cadastro - CoinBitClub</title>
        <meta name="description" content="Crie sua conta no CoinBitClub e comece seu teste gratuito" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-4 lg:p-8">
        {/* Mobile Back Button */}
        <div className="lg:hidden mb-4">
          <Link href="/" className="inline-flex items-center text-blue-400 hover:text-yellow-400 transition-colors">
            <FiArrowLeft className="w-5 h-5 mr-2" />
            Voltar ao início
          </Link>
        </div>

        <div className="max-w-md mx-auto">
          <MobileCard className="border-yellow-400/30 shadow-[0_0_30px_rgba(255,215,0,0.2)]">
            {/* Logo */}
            <div className="text-center mb-6">
              <Link href="/" className="inline-block">
                <h1 className="text-3xl font-bold text-yellow-400 mb-2">⚡ CoinBitClub</h1>
              </Link>
              <p className="text-blue-400">Crie sua conta gratuita</p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-6">
                <MobileAlert type="error">
                  {error}
                </MobileAlert>
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <MobileInput
                label="Nome Completo"
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Seu nome completo"
                required
              />

              <MobileInput
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="seu@email.com"
                required
              />

              <MobileInput
                label="WhatsApp"
                type="tel"
                value={formData.whatsapp}
                onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                placeholder="+55 11 99999-9999"
                icon={<FiPhone className="w-5 h-5" />}
                required
              />

              <div>
                <label className="block text-blue-400 text-sm font-bold mb-2">
                  Tipo de Conta
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, userType: 'individual' }))}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      formData.userType === 'individual'
                        ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                        : 'border-blue-400/30 text-blue-400 hover:border-blue-400/50'
                    }`}
                  >
                    Pessoa Física
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, userType: 'business' }))}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      formData.userType === 'business'
                        ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                        : 'border-blue-400/30 text-blue-400 hover:border-blue-400/50'
                    }`}
                  >
                    Pessoa Jurídica
                  </button>
                </div>
              </div>

              <MobileInput
                label="Senha"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Mínimo 6 caracteres"
                required
              />

              <MobileInput
                label="Confirmar Senha"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Digite a senha novamente"
                required
              />

              <MobileButton
                type="submit"
                fullWidth
                disabled={loading}
                className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <FiLoader className="w-5 h-5 mr-2 animate-spin" />
                    Criando conta...
                  </div>
                ) : (
                  'Criar Conta Gratuita'
                )}
              </MobileButton>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center border-t border-yellow-400/30 pt-6">
              <p className="text-blue-400 text-sm">
                Já tem uma conta?{' '}
                <Link href="/auth/login" className="text-yellow-400 hover:text-pink-400 font-bold transition-colors">
                  Faça login
                </Link>
              </p>
            </div>
          </MobileCard>

          {/* Terms */}
          <div className="mt-6 text-center text-xs text-blue-400">
            <p>
              Ao criar sua conta, você concorda com nossos{' '}
              <Link href="/terms" className="text-yellow-400 hover:underline">
                Termos de Uso
              </Link>{' '}
              e{' '}
              <Link href="/privacy" className="text-yellow-400 hover:underline">
                Política de Privacidade
              </Link>
            </p>
          </div>

          {/* Desktop Back Link */}
          <div className="hidden lg:block mt-8 text-center">
            <Link href="/" className="inline-flex items-center text-blue-400 hover:text-yellow-400 transition-colors">
              <FiArrowLeft className="w-5 h-5 mr-2" />
              Voltar para o início
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;