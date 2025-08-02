import React from 'react';
import { useEffect, useState } from 'react';
import { fetchPublicStats } from '../lib/api';
import Head from 'next/head';
import Link from 'next/link';
import useSWR from 'swr';
import { FiLoader, FiAlertTriangle } from 'react-icons/fi';

const fetcher = (url) => fetch(url).then((res) => res.json());

const testimonials = [
    {
        name: 'Carlos H.',
        role: 'Investidor',
        quote: 'A plataforma é incrivelmente poderosa e fácil de usar. Meus resultados melhoraram significativamente desde que comecei a usar o MarketBot.',
        avatar: '/avatars/avatar1.png',
    },
    {
        name: 'Juliana M.',
        role: 'Trader',
        quote: 'O nível de automação e a inteligência por trás das estratégias são de outro mundo. Finalmente posso ter tranquilidade enquanto meu portfólio cresce.',
        avatar: '/avatars/avatar2.png',
    },
    {
        name: 'Fernando P.',
        role: 'Entusiasta Cripto',
        quote: 'O suporte é fantástico e a comunidade é muito ativa. O MarketBot não é apenas uma ferramenta, é um ecossistema completo para traders.',
        avatar: '/avatars/avatar3.png',
    },
];

export default function Home() {
  const { data: stats, error } = useSWR('publicStats', fetcher);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <>
      <Head>
        <title>CoinbitClub MarketBot Premium - Trading Automatizado com IA</title>
        <meta
          name="description"
          content="Plataforma premium de trading automatizado com IA 24/7. Robôs inteligentes conectados às principais exchanges."
        />
        <meta property="og:title" content="CoinbitClub MarketBot Premium" />
        <meta
          property="og:description"
          content="Trading automatizado com IA 24/7 conectado às principais exchanges"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Hero Section */}
        <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-8 text-center">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-500/10"></div>
          <div className="absolute left-1/4 top-1/4 size-96 animate-pulse rounded-full bg-emerald-500/20 blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 size-96 animate-pulse rounded-full bg-teal-500/20 blur-3xl delay-1000"></div>

          {/* Content */}
          <div className="relative z-10 mx-auto max-w-4xl">
            <div className="mb-6">
              <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400">
                🚀 Plataforma Premium
              </span>
            </div>

            <h1 className="mb-6 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-6xl font-bold text-transparent md:text-7xl">
              MarketBot Premium
            </h1>

            <p className="mx-auto mb-8 max-w-3xl text-xl leading-relaxed text-slate-300 md:text-2xl">
              Robôs de trading com{' '}
              <span className="font-semibold text-emerald-400">
                Inteligência Artificial 24/7
              </span>{' '}
              conectados às principais exchanges do mundo
            </p>

            <div className="mb-12 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/dashboard"
                className="premium-button rounded-xl px-8 py-4 text-lg font-semibold shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                🎯 Quero Testar Grátis
              </Link>
              <Link
                href="#como-funciona"
                className="inline-flex items-center justify-center rounded-xl border-2 border-emerald-500/30 px-8 py-4 font-semibold text-emerald-400 transition-all duration-300 hover:bg-emerald-500/10"
              >
                ⚡ Como Funciona
              </Link>
            </div>

            {/* Stats */}
            <div className="mx-auto grid max-w-3xl grid-cols-2 gap-6 md:grid-cols-4">
              {!isClient ? (
                <div className="col-span-full flex items-center justify-center">
                  <FiLoader className="animate-spin text-3xl text-emerald-400" />
                </div>
              ) : error ? (
                <div className="col-span-full flex items-center justify-center space-x-2 text-center text-red-400">
                  <FiAlertTriangle />
                  <span>Falha ao carregar estatísticas.</span>
                </div>
              ) : !stats ? (
                <div className="col-span-full flex items-center justify-center">
                  <FiLoader className="animate-spin text-3xl text-emerald-400" />
                </div>
              ) : (
                <>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-400">
                      {stats.operationTime}
                    </div>
                    <div className="text-sm text-slate-400">Operação Contínua</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-400">
                      {stats.uptime}%
                    </div>
                    <div className="text-sm text-slate-400">Uptime</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-400">
                      {stats.exchanges}+
                    </div>
                    <div className="text-sm text-slate-400">Exchanges</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-400">
                      {stats.activeUsers}+
                    </div>
                    <div className="text-sm text-slate-400">Usuários Ativos</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="como-funciona" className="bg-slate-800/50 px-8 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-4xl font-bold text-white">
                Como Funciona o MarketBot
              </h2>
              <p className="text-xl text-slate-300">
                Tecnologia de ponta para maximizar seus resultados
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="premium-card group transition-all duration-300 hover:scale-105">
                <div className="mb-4 text-4xl">🔒</div>
                <h3 className="mb-3 text-xl font-semibold text-emerald-400">
                  Saldo Seguro
                </h3>  
                <p className="text-slate-300">
                  Custódia totalmente em sua exchange favorita. Seus fundos
                  nunca saem de sua conta.
                </p>
              </div>
              <div className="premium-card group transition-all duration-300 hover:scale-105">
                <div className="mb-4 text-4xl">🤖</div>
                <h3 className="mb-3 text-xl font-semibold text-emerald-400">
                  IA Avançada 24/7
                </h3>
                <p className="text-slate-300">
                  Algoritmos de machine learning operando continuamente, dia e
                  noite, sem descanso.
                </p>
              </div>
              <div className="premium-card group transition-all duration-300 hover:scale-105">
                <div className="mb-4 text-4xl">📈</div>
                <h3 className="mb-3 text-xl font-semibold text-emerald-400">
                  Lucros em Tempo Real
                </h3>
                <p className="text-slate-300">
                  Acompanhe cada trade, performance e lucros através do
                  dashboard premium.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Setup Process */}
        <section className="px-8 py-20">
          <div className="mx-auto max-w-6xl text-center">
            <h2 className="mb-4 text-4xl font-bold text-white">
              Configure sua IA em 4 passos
            </h2>
            <p className="mb-12 text-xl text-slate-300">
              Processo simples e intuitivo para começar
            </p>
            <div className="grid gap-6 md:grid-cols-4">
              <div className="premium-card group text-center transition-all duration-300 hover:scale-105">
                <div className="mb-4 text-3xl">📊</div>
                <h4 className="mb-2 font-semibold text-emerald-400">
                  1. Leitura de Mercado
                </h4>
                <p className="text-sm text-slate-300">
                  Análise técnica e fundamental automática
                </p>
              </div>
              <div className="premium-card group text-center transition-all duration-300 hover:scale-105">
                <div className="mb-4 text-3xl">🎯</div>
                <h4 className="mb-2 font-semibold text-emerald-400">
                  2. Seleção de Ativos
                </h4>
                <p className="text-sm text-slate-300">
                  Escolha automática dos melhores pares
                </p>
              </div>
              <div className="premium-card group text-center transition-all duration-300 hover:scale-105">
                <div className="mb-4 text-3xl">⚙️</div>
                <h4 className="mb-2 font-semibold text-emerald-400">
                  3. Escolha do Robô
                </h4>
                <p className="text-sm text-slate-300">
                  Algoritmos especializados por estratégia
                </p>
              </div>
              <div className="premium-card group text-center transition-all duration-300 hover:scale-105">
                <div className="mb-4 text-3xl">🛡️</div>
                <h4 className="mb-2 font-semibold text-emerald-400">
                  4. Gestão de Riscos
                </h4>
                <p className="text-sm text-slate-300">
                  Stop loss inteligente e proteção do capital
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="bg-slate-800/50 px-8 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-4xl font-bold text-white">
                Planos para todos os perfis
              </h2>
              <p className="text-xl text-slate-300">
                Escolha o plano ideal para seus objetivos
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {/* Starter Plan */}
              <div className="premium-card group relative overflow-hidden transition-all duration-300 hover:scale-105">
                <div className="mb-6 text-center">
                  <h3 className="mb-2 text-2xl font-bold text-emerald-400">
                    Iniciante
                  </h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-white">$49</span>
                    <span className="text-slate-400">/mês</span>
                  </div>
                  <p className="mb-6 text-slate-300">
                    Perfeito para quem está começando no mundo do trading automatizado
                  </p>
                </div>
                <ul className="mb-8 space-y-4">
                  <li className="flex items-center">
                    <svg className="mr-2 h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-300">3 robôs automáticos</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="mr-2 h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-300">1 exchange conectada</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="mr-2 h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-300">Suporte por email</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="mr-2 h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-300">Atualizações mensais</span>
                  </li>
                </ul>
                <div className="mt-auto text-center">
                  <Link
                    href="/auth?plan=starter"
                    className="inline-block w-full rounded-lg bg-emerald-500/20 px-6 py-3 font-semibold text-emerald-400 transition-all duration-300 hover:bg-emerald-500/30"
                  >
                    Começar Agora
                  </Link>
                </div>
              </div>

              {/* Pro Plan */}
              <div className="premium-card group relative overflow-hidden transition-all duration-300 hover:scale-105">
                <div className="absolute -right-10 top-5 rotate-45 bg-emerald-500 px-10 py-1 text-sm font-bold text-black">
                  POPULAR
                </div>
                <div className="mb-6 text-center">
                  <h3 className="mb-2 text-2xl font-bold text-emerald-400">
                    Profissional
                  </h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-white">$99</span>
                    <span className="text-slate-400">/mês</span>
                  </div>
                  <p className="mb-6 text-slate-300">
                    Para traders que buscam resultados consistentes e diversificação
                  </p>
                </div>
                <ul className="mb-8 space-y-4">
                  <li className="flex items-center">
                    <svg className="mr-2 h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-300">10 robôs automáticos</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="mr-2 h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-300">3 exchanges conectadas</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="mr-2 h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-300">Suporte prioritário</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="mr-2 h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-300">Estratégias avançadas</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="mr-2 h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-300">Acompanhamento semanal</span>
                  </li>
                </ul>
                <div className="mt-auto text-center">
                  <Link
                    href="/auth?plan=professional"
                    className="inline-block w-full rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:from-emerald-600 hover:to-cyan-600 hover:shadow-xl"
                  >
                    Escolher Plano
                  </Link>
                </div>
              </div>

              {/* Enterprise Plan */}
              <div className="premium-card group relative overflow-hidden transition-all duration-300 hover:scale-105">
                <div className="mb-6 text-center">
                  <h3 className="mb-2 text-2xl font-bold text-emerald-400">
                    Enterprise
                  </h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-white">$249</span>
                    <span className="text-slate-400">/mês</span>
                  </div>
                  <p className="mb-6 text-slate-300">
                    Solução completa para traders profissionais e institucionais
                  </p>
                </div>
                <ul className="mb-8 space-y-4">
                  <li className="flex items-center">
                    <svg className="mr-2 h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-300">Robôs ilimitados</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="mr-2 h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-300">Exchanges ilimitadas</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="mr-2 h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-300">Suporte 24/7 dedicado</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="mr-2 h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-300">API personalizada</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="mr-2 h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-300">Estratégias exclusivas</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="mr-2 h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-300">Consultoria mensal</span>
                  </li>
                </ul>
                <div className="mt-auto text-center">
                  <Link
                    href="/auth?plan=enterprise"
                    className="inline-block w-full rounded-lg bg-emerald-500/20 px-6 py-3 font-semibold text-emerald-400 transition-all duration-300 hover:bg-emerald-500/30"
                  >
                    Falar com Consultor
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="bg-slate-800/50 px-8 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-6 text-center md:grid-cols-4">
              <div className="premium-card">
                <div className="mb-4 text-3xl">🏆</div>
                <h4 className="font-semibold text-emerald-400">
                  Certificado Premium
                </h4>
                <p className="mt-2 text-sm text-slate-300">
                  Plataforma licenciada e auditada
                </p>
              </div>
              <div className="premium-card">
                <div className="mb-4 text-3xl">📅</div>
                <h4 className="font-semibold text-emerald-400">
                  Suporte 12 meses
                </h4>
                <p className="mt-2 text-sm text-slate-300">
                  Assistência técnica completa
                </p>
              </div>
              <div className="premium-card">
                <div className="mb-4 text-3xl">🎁</div>
                <h4 className="font-semibold text-emerald-400">
                  30 dias grátis
                </h4>
                <p className="mt-2 text-sm text-slate-300">
                  Teste sem compromisso
                </p>
              </div>
              <div className="premium-card">
                <div className="mb-4 text-3xl">💎</div>
                <h4 className="font-semibold text-emerald-400">
                  Bônus exclusivo
                </h4>
                <p className="mt-2 text-sm text-slate-300">
                  Estratégias VIP incluídas
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="px-8 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-4xl font-bold text-white">
                O que dizem nossos usuários
              </h2>
              <p className="text-xl text-slate-300">
                Depoimentos de traders que transformaram seus investimentos
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="premium-card relative">
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 transform">
                    <div className="h-16 w-16 overflow-hidden rounded-full border-4 border-emerald-500/30 bg-slate-800">
                      <img
                        src={testimonial.avatar || `https://randomuser.me/api/portraits/${index % 2 ? 'women' : 'men'}/${index + 20}.jpg`}
                        alt={testimonial.name}
                        className="h-full w-full object-cover"
                        onError={(e) = /> {
                          e.currentTarget.src = `https://randomuser.me/api/portraits/${index % 2 ? 'women' : 'men'}/${index + 20}.jpg`;
                        }}
                      />
                    </div>
                  </div>
                  <div className="mt-8 pt-4 text-center">
                    <p className="mb-6 italic text-slate-300">"{testimonial.quote}"</p>
                    <h4 className="font-semibold text-emerald-400">{testimonial.name}</h4>
                    <p className="text-sm text-slate-400">{testimonial.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Terms and Privacy Section */}
        <section className="bg-slate-900 px-8 py-20">
          <div className="mx-auto max-w-4xl">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-4xl font-bold text-white">
                Termos e Políticas
              </h2>
              <p className="text-xl text-slate-300">
                Transparência e segurança em primeiro lugar
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2">  
              {/* Terms of Use */}
              <div className="premium-card">
                <h3 className="mb-6 text-center text-2xl font-bold text-emerald-400">
                  📋 Termos de Uso
                </h3>
                <div className="max-h-96 space-y-4 overflow-y-auto text-sm text-slate-300">
                  {/* … conteúdo completo dos termos … */}
                </div>
              </div>
              {/* Privacy Policy */}
              <div className="premium-card">
                <h3 className="mb-6 text-center text-2xl font-bold text-cyan-400">
                  🔒 Política de Privacidade
                </h3>
                <div className="space-y-4 text-sm text-slate-300">
                  {/* … conteúdo completo da política … */}
                </div>
                <div className="mt-6 text-center">
                  <Link
                    href="/dashboard"
                    className="inline-block rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:from-emerald-600 hover:to-cyan-600 hover:shadow-xl"
                  >
                    🚀 Aceito os Termos - Começar Agora
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}




