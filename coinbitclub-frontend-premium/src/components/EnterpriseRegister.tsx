/**
 * COMPONENTE DE REGISTRO ENTERPRISE
 * CoinBitClub Market Bot v6.0.0 Enterprise
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const PROFILE_TYPES = {
  basic: {
    label: 'Básico',
    description: 'Acesso básico ao sistema',
    features: ['Dashboard básico', 'Sinais limitados', 'Suporte padrão']
  },
  premium: {
    label: 'Premium',
    description: 'Acesso premium com recursos avançados',
    features: ['Dashboard completo', 'Sinais ilimitados', 'Suporte prioritário', 'Análises avançadas']
  },
  enterprise: {
    label: 'Enterprise',
    description: 'Acesso completo para empresas',
    features: ['Multi-usuários', 'API dedicada', 'Suporte 24/7', 'Customizações']
  },
  affiliate_normal: {
    label: 'Afiliado Normal',
    description: 'Sistema de afiliados padrão',
    features: ['Comissão 5%', 'Dashboard afiliado', 'Relatórios mensais']
  },
  affiliate_vip: {
    label: 'Afiliado VIP',
    description: 'Sistema de afiliados VIP',
    features: ['Comissão 10%', 'Dashboard avançado', 'Relatórios em tempo real', 'Bônus especiais']
  }
};

const COUNTRIES = [
  { code: 'BR', name: 'Brasil', flag: '🇧🇷', currency: 'BRL' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸', currency: 'USD' },
  { code: 'CA', name: 'Canadá', flag: '🇨🇦', currency: 'CAD' },
  { code: 'UK', name: 'Reino Unido', flag: '🇬🇧', currency: 'GBP' },
  { code: 'AU', name: 'Austrália', flag: '🇦🇺', currency: 'AUD' },
  { code: 'DE', name: 'Alemanha', flag: '🇩🇪', currency: 'EUR' },
  { code: 'FR', name: 'França', flag: '🇫🇷', currency: 'EUR' },
  { code: 'ES', name: 'Espanha', flag: '🇪🇸', currency: 'EUR' },
  { code: 'IT', name: 'Itália', flag: '🇮🇹', currency: 'EUR' },
  { code: 'JP', name: 'Japão', flag: '🇯🇵', currency: 'JPY' }
];

export default function EnterpriseRegister() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nome_completo: '',
    whatsapp: '',
    profile_type: 'basic',
    pais: 'BR',
    cidade: '',
    data_nascimento: '',
    aceita_termos: false
  });
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [smsCode, setSmsCode] = useState('');
  const [userId, setUserId] = useState(null);

  const validateForm = () => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.email) newErrors.email = 'Email é obrigatório';
      if (!formData.email.includes('@')) newErrors.email = 'Email inválido';
      if (!formData.password) newErrors.password = 'Senha é obrigatória';
      if (formData.password.length < 8) newErrors.password = 'Senha deve ter pelo menos 8 caracteres';
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Senhas não coincidem';
      }
    }

    if (step === 2) {
      if (!formData.nome_completo) newErrors.nome_completo = 'Nome completo é obrigatório';
      if (!formData.whatsapp) newErrors.whatsapp = 'WhatsApp é obrigatório';
      if (!formData.cidade) newErrors.cidade = 'Cidade é obrigatória';
      if (!formData.data_nascimento) newErrors.data_nascimento = 'Data de nascimento é obrigatória';
      if (!formData.aceita_termos) newErrors.aceita_termos = 'Você deve aceitar os termos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    setStep(step - 1);
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/enterprise/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setUserId(data.userId);
        setStep(3); // Ir para verificação SMS
      } else {
        setErrors({ submit: data.error || 'Erro no registro' });
      }
    } catch (error) {
      setErrors({ submit: 'Erro de conexão' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySMS = async () => {
    if (!smsCode) {
      setErrors({ sms: 'Código SMS é obrigatório' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/enterprise/verify-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          code: smsCode
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Sucesso - redirecionar para login ou dashboard
        router.push('/login?registered=true');
      } else {
        setErrors({ sms: data.error || 'Código inválido' });
      }
    } catch (error) {
      setErrors({ sms: 'Erro de conexão' });
    } finally {
      setLoading(false);
    }
  };

  const selectedCountry = COUNTRIES.find(c => c.code === formData.pais);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-2xl p-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            CoinBitClub Enterprise
          </h1>
          <p className="text-gray-600">
            Registro no Sistema Enterprise
          </p>
          
          {/* Progress Bar */}
          <div className="mt-6 flex justify-center">
            <div className="flex space-x-2">
              {[1, 2, 3].map((stepNumber) => (
                <div
                  key={stepNumber}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNumber
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {stepNumber}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step 1: Credenciais */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Credenciais de Acesso
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="seu@email.com"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mínimo 8 caracteres"
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Senha
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Repita a senha"
              />
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Perfil
              </label>
              <select
                value={formData.profile_type}
                onChange={(e) => setFormData({...formData, profile_type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(PROFILE_TYPES).map(([key, profile]) => (
                  <option key={key} value={key}>
                    {profile.label} - {profile.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Mostrar recursos do perfil selecionado */}
            <div className="bg-blue-50 p-3 rounded-md">
              <h4 className="font-medium text-blue-800 mb-2">
                Recursos incluídos:
              </h4>
              <ul className="text-sm text-blue-700">
                {PROFILE_TYPES[formData.profile_type].features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={handleNext}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition duration-200 font-medium"
            >
              Próximo
            </button>
          </div>
        )}

        {/* Step 2: Dados Pessoais */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Dados Pessoais
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo
              </label>
              <input
                type="text"
                value={formData.nome_completo}
                onChange={(e) => setFormData({...formData, nome_completo: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Seu nome completo"
              />
              {errors.nome_completo && <p className="text-red-500 text-sm mt-1">{errors.nome_completo}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp
              </label>
              <input
                type="tel"
                value={formData.whatsapp}
                onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+55 11 99999-9999"
              />
              {errors.whatsapp && <p className="text-red-500 text-sm mt-1">{errors.whatsapp}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                País
              </label>
              <select
                value={formData.pais}
                onChange={(e) => setFormData({...formData, pais: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cidade
              </label>
              <input
                type="text"
                value={formData.cidade}
                onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Sua cidade"
              />
              {errors.cidade && <p className="text-red-500 text-sm mt-1">{errors.cidade}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Nascimento
              </label>
              <input
                type="date"
                value={formData.data_nascimento}
                onChange={(e) => setFormData({...formData, data_nascimento: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.data_nascimento && <p className="text-red-500 text-sm mt-1">{errors.data_nascimento}</p>}
            </div>

            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="aceita_termos"
                checked={formData.aceita_termos}
                onChange={(e) => setFormData({...formData, aceita_termos: e.target.checked})}
                className="mt-1"
              />
              <label htmlFor="aceita_termos" className="text-sm text-gray-700">
                Aceito os{' '}
                <a href="/termos" className="text-blue-600 hover:underline">
                  Termos de Uso
                </a>{' '}
                e{' '}
                <a href="/privacidade" className="text-blue-600 hover:underline">
                  Política de Privacidade
                </a>
              </label>
            </div>
            {errors.aceita_termos && <p className="text-red-500 text-sm">{errors.aceita_termos}</p>}

            <div className="flex space-x-4">
              <button
                onClick={handlePrevious}
                className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-400 transition duration-200 font-medium"
              >
                Anterior
              </button>
              <button
                onClick={handleRegister}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition duration-200 font-medium disabled:opacity-50"
              >
                {loading ? 'Registrando...' : 'Registrar'}
              </button>
            </div>

            {errors.submit && (
              <p className="text-red-500 text-sm text-center">{errors.submit}</p>
            )}
          </div>
        )}

        {/* Step 3: Verificação SMS */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Verificação SMS
            </h2>
            
            <div className="text-center">
              <div className="bg-green-100 text-green-800 p-4 rounded-md mb-4">
                ✅ Registro realizado com sucesso!
              </div>
              
              <p className="text-gray-600 mb-4">
                Enviamos um código de verificação para o WhatsApp{' '}
                <strong>{formData.whatsapp}</strong>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código de Verificação
              </label>
              <input
                type="text"
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl font-mono"
                placeholder="000000"
                maxLength="6"
              />
              {errors.sms && <p className="text-red-500 text-sm mt-1">{errors.sms}</p>}
            </div>

            <button
              onClick={handleVerifySMS}
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition duration-200 font-medium disabled:opacity-50"
            >
              {loading ? 'Verificando...' : 'Verificar Código'}
            </button>

            <div className="text-center">
              <button
                onClick={() => {
                  // Implementar reenvio de código
                  console.log('Reenviar código');
                }}
                className="text-blue-600 hover:underline text-sm"
              >
                Não recebeu o código? Reenviar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
