import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';

export default function LoginPremiumSimple() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Simulação de login para demonstração
      console.log('Login attempt:', formData);
      
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Para demonstração, vamos redirecionar para dashboard
      router.push('/dashboard-premium');
      
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setFormData({
      email: 'admin@coinbitclub.com',
      password: 'admin123'
    });
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-slate-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Login Premium - CoinBitClub MarketBot</title>
        <meta name="description" content="Acesse sua conta premium do CoinBitClub MarketBot" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-slate-900 flex items-center justify-center p-4">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-pink-500/10 to-yellow-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center text-black font-bold text-3xl mx-auto mb-6 shadow-2xl">
              ₿
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent mb-2">
              CoinBitClub
            </h1>
            <p className="text-gray-400">MarketBot Premium Access</p>
          </div>

          {/* Login Form */}
          <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl p-8 rounded-2xl border border-gray-700/50 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Bem-vindo de volta!</h2>
              <p className="text-gray-400">Acesse sua conta premium para continuar</p>
            </div>

            {/* Demo Credentials */}
            {formData.email === '' && (
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl border border-blue-700/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-sm">
                    🎯
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Demonstração</h3>
                    <p className="text-gray-400 text-sm">Credenciais para teste</p>
                  </div>
                </div>
                <button
                  onClick={handleDemoLogin}
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
                >
                  Usar credenciais de demonstração
                </button>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Email ou Usuário
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all duration-300"
                  placeholder="Digite seu email"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Senha
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all duration-300"
                  placeholder="Digite sua senha"
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-600 bg-black/30 text-yellow-400 focus:ring-yellow-400/20" />
                  <span className="ml-2 text-gray-300 text-sm">Lembrar-me</span>
                </label>
                <a href="#" className="text-yellow-400 hover:text-yellow-300 text-sm transition-colors">
                  Esqueceu a senha?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold rounded-xl hover:shadow-lg hover:shadow-yellow-400/25 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                    Entrando...
                  </div>
                ) : (
                  'Entrar no Sistema Premium'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                Não tem uma conta?{' '}
                <a href="/auth/register" className="text-yellow-400 hover:text-yellow-300 transition-colors">
                  Cadastre-se aqui
                </a>
              </p>
            </div>
          </div>

          {/* System Status */}
          <div className="mt-6 text-center">
            <div className="flex items-center justify-center gap-2 text-green-400 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              Todos os sistemas operacionais
            </div>
            <p className="text-gray-500 text-xs mt-2">
              Conectado ao servidor Railway: https://coinbitclub-market-bot.up.railway.app
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
