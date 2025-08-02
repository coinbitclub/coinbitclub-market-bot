import React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import apiClient from '../lib/api';

export default function Auth() {
  const router = useRouter();
  const { plan, demo } = router.query;
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        // Tentativa de login
        await apiClient.login(email, password);
        router.push('/dashboard');
      } else {
        // Validações de registro
        if (password !== confirmPassword) {
          throw new Error('As senhas não coincidem');
        }

        if (password.length < 8) {
          throw new Error('A senha deve ter pelo menos 8 caracteres');
        }

        // Chamada API de registro (mockada para fins de demonstração)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Em um ambiente real, chamaria a API
        // await apiClient.register(name, email, password);
        
        // Após registro bem-sucedido, fazer login automaticamente
        await apiClient.login(email, password);
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('Erro de autenticação:', err);
      setError(err.message || 'Ocorreu um erro durante a autenticação. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      // Em um ambiente real, isso faria login com credenciais de demonstração
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simular login bem-sucedido com conta demo
      localStorage.setItem('accessToken', 'demo-token');
      localStorage.setItem('refreshToken', 'demo-refresh-token');
      
      router.push('/dashboard');
    } catch (err: any) {
      setError('Erro ao acessar conta de demonstração');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{isLogin ? 'Login' : 'Criar Conta'} | CoinBitClub MarketBot</title>
        <meta name="description" content="Faça login ou crie sua conta no CoinBitClub MarketBot" />
      </Head>

      <div className="min-h-screen bg-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Link href="/" className="inline-block">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                CoinBitClub
              </h2>
            </Link>
            <p className="mt-2 text-xl text-slate-300">
              {isLogin ? 'Entre na sua conta' : 'Crie sua conta'}
            </p>
            {plan && (
              <div className="mt-4 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <p className="text-emerald-400">
                  Plano selecionado: <span className="font-semibold">
                    {plan === 'starter' && 'Iniciante'}
                    {plan === 'professional' && 'Profissional'}
                    {plan === 'enterprise' && 'Enterprise'}
                  </span>
                </p>
              </div>
            )}
            {demo && (
              <div className="mt-4 p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-blue-400">
                  Você está prestes a acessar a versão demonstrativa
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-white p-4 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="premium-card">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {!isLogin && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">
                    Nome Completo
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required={!isLogin}
                    className="premium-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="premium-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
                  Senha
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  required
                  className="premium-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              {!isLogin && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1">
                    Confirmar Senha
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required={!isLogin}
                    className="premium-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              )}

              <div>
                <button
                  type="submit"
                  className="premium-button w-full py-3"
                  disabled={loading}
                >
                  {loading ? (
                    <svg className="animate-spin h-5 w-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : isLogin ? (
                    'Entrar'
                  ) : (
                    'Criar Conta'
                  )}
                </button>
              </div>

              {demo && (
                <div>
                  <button
                    type="button"
                    className="w-full border border-blue-500 text-blue-400 hover:bg-blue-500/10 rounded-lg p-3 font-medium transition-colors"
                    onClick={handleDemoLogin}
                    disabled={loading}
                  >
                    Acessar Demonstração
                  </button>
                </div>
              )}
            </form>

            <div className="mt-6 text-center">
              <button
                className="text-emerald-400 hover:text-emerald-300 text-sm font-medium"
                onClick={toggleAuthMode}
                disabled={loading}
              >
                {isLogin ? 'Não tem uma conta? Registre-se' : 'Já tem uma conta? Faça login'}
              </button>
            </div>

            {isLogin && (
              <div className="mt-3 text-center">
                <Link href="/esqueci-senha" className="text-slate-400 hover:text-slate-300 text-sm">
                  Esqueceu sua senha?
                </Link>
              </div>
            )}
          </div>

          <div className="text-center text-xs text-slate-500 space-y-2">
            <p>Ao continuar, você concorda com nossos</p>
            <p>
              <Link href="/terms" className="text-emerald-400 hover:underline">Termos de Serviço</Link>
              {' '}e{' '}
              <Link href="/privacy" className="text-emerald-400 hover:underline">Política de Privacidade</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}



