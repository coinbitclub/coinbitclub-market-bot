import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { useAuth } from '../src/providers/AuthProvider';
import { 
  FiUser, 
  FiMail, 
  FiLock, 
  FiPhone, 
  FiGlobe, 
  FiEye, 
  FiEyeOff,
  FiCheck,
  FiArrowLeft
} from 'react-icons/fi';

const CadastroPage: NextPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    whatsapp: '',
    senha: '',
    confirmarSenha: '',
    pais: 'BR',
    aceitarTermos: false,
    aceitarPrivacidade: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Validações
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome completo é obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.whatsapp.trim()) {
      newErrors.whatsapp = 'WhatsApp é obrigatório';
    }

    if (!formData.senha) {
      newErrors.senha = 'Senha é obrigatória';
    } else if (formData.senha.length < 8) {
      newErrors.senha = 'Senha deve ter pelo menos 8 caracteres';
    }

    if (formData.senha !== formData.confirmarSenha) {
      newErrors.confirmarSenha = 'Senhas não coincidem';
    }

    if (!formData.aceitarTermos) {
      newErrors.aceitarTermos = 'Você deve aceitar os Termos de Uso';
    }

    if (!formData.aceitarPrivacidade) {
      newErrors.aceitarPrivacidade = 'Você deve aceitar a Política de Privacidade';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      // Aqui você faria a requisição para o backend
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulação
      
      // Redirecionar para página de sucesso ou login
      router.push('/auth/login-premium?registered=true');
    } catch (error) {
      setErrors({ submit: 'Erro ao criar conta. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Head>
        <title>Cadastro - CoinBitClub MARKETBOT</title>
        <meta name="description" content="Crie sua conta no CoinBitClub e comece a usar o MARKETBOT hoje mesmo. 7 dias de teste gratuito." />
        <link rel="icon" href="/logo-nova.jpg" />
        <link rel="apple-touch-icon" href="/logo-nova.jpg" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
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
                <p className="text-lg text-yellow-400 font-semibold">MARKETBOT</p>
              </Link>
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-2">
              Criar Conta
            </h2>
            <p className="text-gray-400">
              Comece seu teste gratuito de 7 dias agora mesmo
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
            <div className="space-y-4">
              {/* Nome */}
              <div>
                <label htmlFor="nome" className="sr-only">
                  Nome completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="nome"
                    name="nome"
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-700 rounded-lg bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                    placeholder="Nome completo"
                  />
                </div>
                {errors.nome && <p className="text-red-400 text-sm mt-1">{errors.nome}</p>}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-700 rounded-lg bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                    placeholder="Seu email"
                  />
                </div>
                {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
              </div>

              {/* WhatsApp */}
              <div>
                <label htmlFor="whatsapp" className="sr-only">
                  WhatsApp
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiPhone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="whatsapp"
                    name="whatsapp"
                    type="tel"
                    required
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-700 rounded-lg bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                    placeholder="WhatsApp (com código do país)"
                  />
                </div>
                {errors.whatsapp && <p className="text-red-400 text-sm mt-1">{errors.whatsapp}</p>}
              </div>

              {/* País */}
              <div>
                <label htmlFor="pais" className="sr-only">
                  País
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiGlobe className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="pais"
                    name="pais"
                    value={formData.pais}
                    onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-700 rounded-lg bg-gray-900 text-white focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 appearance-none"
                  >
                    <option value="BR">🇧🇷 Brasil</option>
                    <option value="US">🇺🇸 Estados Unidos</option>
                    <option value="AR">🇦🇷 Argentina</option>
                    <option value="CL">🇨🇱 Chile</option>
                    <option value="CO">🇨🇴 Colômbia</option>
                    <option value="MX">🇲🇽 México</option>
                    <option value="PE">🇵🇪 Peru</option>
                    <option value="UY">🇺🇾 Uruguai</option>
                    <option value="OTHER">🌍 Outro</option>
                  </select>
                </div>
              </div>

              {/* Senha */}
              <div>
                <label htmlFor="senha" className="sr-only">
                  Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="senha"
                    name="senha"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.senha}
                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-700 rounded-lg bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                    placeholder="Senha (mínimo 8 caracteres)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <FiEyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <FiEye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.senha && <p className="text-red-400 text-sm mt-1">{errors.senha}</p>}
              </div>

              {/* Confirmar Senha */}
              <div>
                <label htmlFor="confirmarSenha" className="sr-only">
                  Confirmar senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmarSenha"
                    name="confirmarSenha"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={formData.confirmarSenha}
                    onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-700 rounded-lg bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                    placeholder="Confirmar senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <FiEyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <FiEye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmarSenha && <p className="text-red-400 text-sm mt-1">{errors.confirmarSenha}</p>}
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="aceitarTermos"
                    name="aceitarTermos"
                    type="checkbox"
                    checked={formData.aceitarTermos}
                    onChange={(e) => setFormData({ ...formData, aceitarTermos: e.target.checked })}
                    className="h-4 w-4 text-yellow-400 focus:ring-yellow-400 border-gray-700 rounded bg-gray-900"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="aceitarTermos" className="text-gray-300">
                    Eu aceito os{' '}
                    <Link href="/politicas" className="text-yellow-400 hover:text-yellow-300">
                      Termos de Uso
                    </Link>
                  </label>
                </div>
              </div>
              {errors.aceitarTermos && <p className="text-red-400 text-sm">{errors.aceitarTermos}</p>}

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="aceitarPrivacidade"
                    name="aceitarPrivacidade"
                    type="checkbox"
                    checked={formData.aceitarPrivacidade}
                    onChange={(e) => setFormData({ ...formData, aceitarPrivacidade: e.target.checked })}
                    className="h-4 w-4 text-yellow-400 focus:ring-yellow-400 border-gray-700 rounded bg-gray-900"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="aceitarPrivacidade" className="text-gray-300">
                    Eu aceito a{' '}
                    <Link href="/politicas" className="text-yellow-400 hover:text-yellow-300">
                      Política de Privacidade
                    </Link>
                  </label>
                </div>
              </div>
              {errors.aceitarPrivacidade && <p className="text-red-400 text-sm">{errors.aceitarPrivacidade}</p>}
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-black bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <FiCheck className="w-5 h-5 mr-2" />
                    Criar Conta - Teste Grátis 7 Dias
                  </>
                )}
              </button>
            </div>

            {errors.submit && (
              <div className="text-red-400 text-sm text-center">{errors.submit}</div>
            )}

            {/* Login Link */}
            <div className="text-center">
              <p className="text-gray-400 text-sm">
                Já tem uma conta?{' '}
                <Link href="/auth/login-premium" className="text-yellow-400 hover:text-yellow-300">
                  Fazer login
                </Link>
              </p>
            </div>
          </motion.form>

          {/* Benefits */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-8 bg-gray-900/50 rounded-xl p-6 border border-gray-700"
          >
            <h3 className="text-white font-bold mb-4 text-center">
              🎯 O que você ganha com o teste gratuito:
            </h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-center">
                <FiCheck className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                7 dias de acesso completo ao MARKETBOT
              </li>
              <li className="flex items-center">
                <FiCheck className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                Trading automatizado com IA avançada
              </li>
              <li className="flex items-center">
                <FiCheck className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                Dashboard premium em tempo real
              </li>
              <li className="flex items-center">
                <FiCheck className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                Suporte especializado via WhatsApp
              </li>
              <li className="flex items-center">
                <FiCheck className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                Sem compromisso - cancele quando quiser
              </li>
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CadastroPage;
