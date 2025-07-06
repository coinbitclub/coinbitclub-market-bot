import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050C23] to-[#0A1123] flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-[#0F141D] rounded-2xl p-8 shadow-2xl">
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-2xl font-bold text-yellow-400">MarketBot</h1>
          <nav className="space-x-6 flex items-center">
            <Link to="/como-funciona" className="text-gray-300 hover:text-white">
              Como Funciona
            </Link>
            <Link
              to="/login"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Login
            </Link>
            <Link to="/termos-de-uso" className="text-gray-300 hover:text-white">
              Termos de Uso
            </Link>
            <Link
              to="/register"
              className="bg-yellow-400 text-black px-4 py-2 rounded-lg hover:bg-yellow-500"
            >
              Cadastrar-se
            </Link>
          </nav>
        </header>

        {/* Hero */}
        <section className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
            MARKETBOT{' '}
            <span className="text-yellow-400">é a IA de trade automático</span> que só{' '}
            <span className="text-yellow-400">lucra</span> se você lucrar!
          </h2>
          <p className="mt-4 text-gray-300 text-lg">
            Teste grátis 7 dias: seu <strong>saldo sempre seguro</strong> na sua
            exchange.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/register"
              className="bg-yellow-400 text-black font-semibold px-6 py-3 rounded-full hover:bg-yellow-500 transition"
            >
              Quero Testar Grátis
            </Link>
            <Link
              to="/como-funciona"
              className="text-gray-300 hover:text-white flex items-center gap-1"
            >
              🔧 Como Funciona o MarketBot
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            {
              icon: '🔒',
              title: 'Saldo Sempre Seguro',
              desc: 'Seu dinheiro nunca sai da exchange. Total controle e transparência.',
            },
            {
              icon: '🧠',
              title: 'IA 24/7 em Ação',
              desc: 'Análise em tempo real com inteligência artificial de leitura de mercado.',
            },
            {
              icon: '📈',
              title: 'Visualize Lucros em Tempo Real',
              desc: 'Dashboard com operações, performance e estratégias da IA.',
            },
          ].map((feature, idx) => (
            <div key={idx} className="bg-[#1E293B] p-6 rounded-xl shadow-lg">
              <h3 className="font-semibold text-white mb-2">
                {feature.icon} {feature.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </section>

        {/* Steps */}
        <section className="text-center mb-16">
          <h4 className="text-2xl font-bold text-white mb-6">
            🚀 O SETUP da IA que gera Lucro Dólar:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="bg-yellow-400 text-black py-4 rounded-lg font-medium transition hover:bg-yellow-500">
              📊 Leitura de Mercado
            </button>
            <button className="bg-red-500 text-white py-4 rounded-lg font-medium transition hover:bg-red600">
              💎 Seleção de Ativos
            </button>
            <button className="bg-purple-600 text-white py-4 rounded-lg font-medium transition hover:bg-purple-700">
              🤖 Escolha do Robô
            </button>
            <button className="bg-blue-600 text-white py-4 rounded-lg font-medium transition hover:bg-blue-700">
              🛡️ Gestão de Riscos
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
