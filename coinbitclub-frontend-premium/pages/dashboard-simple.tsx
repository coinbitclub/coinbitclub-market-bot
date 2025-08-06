import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function DashboardSimple() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({
    balance: 15420.50,
    profit: 2840.25,
    operations: 42,
    success_rate: 94.2
  });

  useEffect(() => {
    setMounted(true);
  }, []);

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
        <title>Dashboard Premium - CoinBitClub MarketBot</title>
        <meta name="description" content="Dashboard executivo do CoinBitClub MarketBot" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-slate-900">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-yellow-400/10 to-orange-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
        </div>

        {/* Header */}
        <header className="relative z-10 bg-black/20 backdrop-blur-xl border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center text-black font-bold">
                  ₿
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">CoinBitClub</h1>
                  <p className="text-xs text-gray-400">MarketBot Premium</p>
                </div>
              </div>
              
              <nav className="hidden md:flex items-center space-x-8">
                <a href="#" className="text-yellow-400 hover:text-yellow-300 transition-colors">Dashboard</a>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">Operações</a>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">Relatórios</a>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">Configurações</a>
              </nav>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-white font-medium">Admin Premium</p>
                  <p className="text-xs text-gray-400">admin@coinbitclub.com</p>
                </div>
                <Link href="/auth/login-simple" className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm transition-colors">
                  Sair
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent mb-2">
              Dashboard Executivo
            </h1>
            <p className="text-gray-400">
              Bem-vindo ao sistema premium de trading automatizado. Monitoramento em tempo real dos seus investimentos.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl p-6 rounded-2xl border border-gray-700/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-2xl">
                  💰
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Saldo Total</p>
                  <p className="text-2xl font-bold text-green-400">
                    ${stats.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl p-6 rounded-2xl border border-gray-700/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-2xl">
                  📈
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Lucro Hoje</p>
                  <p className="text-2xl font-bold text-blue-400">
                    +${stats.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl p-6 rounded-2xl border border-gray-700/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center text-2xl">
                  🔄
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Operações</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats.operations}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl p-6 rounded-2xl border border-gray-700/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-red-500 rounded-xl flex items-center justify-center text-2xl">
                  🎯
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Taxa de Sucesso</p>
                  <p className="text-2xl font-bold text-pink-400">{stats.success_rate}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Trading Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl p-6 rounded-2xl border border-gray-700/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Status do Bot</h2>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-sm font-medium">ATIVO</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Última operação</span>
                  <span className="text-white">2 minutos atrás</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Par ativo</span>
                  <span className="text-yellow-400">BTC/USDT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Estratégia</span>
                  <span className="text-blue-400">Scalping Premium</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Risco</span>
                  <span className="text-green-400">Baixo (2%)</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl p-6 rounded-2xl border border-gray-700/50">
              <h2 className="text-xl font-bold text-white mb-6">Operações Recentes</h2>
              
              <div className="space-y-4">
                {[
                  { pair: 'BTC/USDT', type: 'COMPRA', profit: '+$124.50', time: '2min', status: 'success' },
                  { pair: 'ETH/USDT', type: 'VENDA', profit: '+$89.30', time: '5min', status: 'success' },
                  { pair: 'BNB/USDT', type: 'COMPRA', profit: '+$45.80', time: '8min', status: 'success' },
                  { pair: 'ADA/USDT', type: 'VENDA', profit: '-$12.20', time: '12min', status: 'loss' }
                ].map((op, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        op.type === 'COMPRA' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {op.type === 'COMPRA' ? '↗' : '↘'}
                      </div>
                      <div>
                        <p className="text-white font-medium">{op.pair}</p>
                        <p className="text-gray-400 text-sm">{op.time} atrás</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${op.status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                        {op.profit}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <button className="p-6 bg-gradient-to-br from-blue-900/50 to-blue-800/50 rounded-2xl border border-blue-700/50 hover:border-blue-500/50 transition-all duration-300 text-left group">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                ⚙️
              </div>
              <h3 className="text-white font-semibold mb-2">Configurar Bot</h3>
              <p className="text-gray-400 text-sm">Ajustar parâmetros e estratégias</p>
            </button>

            <button className="p-6 bg-gradient-to-br from-green-900/50 to-green-800/50 rounded-2xl border border-green-700/50 hover:border-green-500/50 transition-all duration-300 text-left group">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                📊
              </div>
              <h3 className="text-white font-semibold mb-2">Relatórios</h3>
              <p className="text-gray-400 text-sm">Análises e performance detalhada</p>
            </button>

            <button className="p-6 bg-gradient-to-br from-yellow-900/50 to-yellow-800/50 rounded-2xl border border-yellow-700/50 hover:border-yellow-500/50 transition-all duration-300 text-left group">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                💼
              </div>
              <h3 className="text-white font-semibold mb-2">Carteira</h3>
              <p className="text-gray-400 text-sm">Gerenciar fundos e depósitos</p>
            </button>

            <button className="p-6 bg-gradient-to-br from-purple-900/50 to-purple-800/50 rounded-2xl border border-purple-700/50 hover:border-purple-500/50 transition-all duration-300 text-left group">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                🔔
              </div>
              <h3 className="text-white font-semibold mb-2">Alertas</h3>
              <p className="text-gray-400 text-sm">Notificações e configurações</p>
            </button>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 border-t border-gray-800 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <p className="text-gray-400 text-sm">
                © 2025 CoinBitClub MarketBot Premium. Todos os direitos reservados.
              </p>
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                Sistema conectado ao Railway
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
