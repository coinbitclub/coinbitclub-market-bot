import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function LoginPremium() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const login = async (email: string, password: string) => {
    // Simulação de login
    if (email && password) {
      // Aqui você pode adicionar a lógica real de login
      return Promise.resolve({ success: true });
    }
    throw new Error('Email e senha são obrigatórios');
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
      setSuccess('Login realizado com sucesso!');
    } catch (error: any) {
      setError(error.message || 'Erro no login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login | CoinBitClub</title>
        <meta name="description" content="Faça login na CoinBitClub" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-blue-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-black/90 backdrop-blur-sm rounded-2xl border border-yellow-400/30 p-8 shadow-[0_0_50px_rgba(255,215,0,0.3)]">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-yellow-400 mb-2">⚡ CoinBitClub ⚡</h1>
              <p className="text-blue-400">Faça login em sua conta</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-green-400 text-sm">{success}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-blue-400 text-sm font-bold mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 placeholder-blue-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-blue-400 text-sm font-bold mb-2">
                  Senha
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className="w-full px-4 py-3 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 placeholder-blue-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                  placeholder="Sua senha"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !formData.email || !formData.password}
                className="w-full py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold rounded-lg hover:from-yellow-300 hover:to-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-[0_0_20px_rgba(255,215,0,0.3)]"
              >
                {isLoading ? 'Entrando...' : 'ENTRAR'}
              </button>
            </form>

            <div className="mt-6 text-center space-y-4">
              <Link
                href="/auth/forgot-password"
                className="text-blue-400 hover:text-yellow-400 text-sm transition-colors"
              >
                Esqueceu sua senha?
              </Link>

              <div className="border-t border-yellow-400/30 pt-4">
                <p className="text-blue-400 text-sm">
                  Não tem uma conta?{' '}
                  <Link
                    href="/auth/register"
                    className="text-yellow-400 hover:text-yellow-300 font-bold transition-colors"
                  >
                    Cadastre-se
                  </Link>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-blue-300 text-sm">
              Sistema seguro com verificação SMS
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
