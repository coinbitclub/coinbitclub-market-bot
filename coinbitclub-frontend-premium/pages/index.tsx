import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiArrowRight, 
  FiCheck, 
  FiDollarSign, 
  FiEye, 
  FiTarget, 
  FiTrendingUp,
  FiGlobe,
  FiMessageCircle,
  FiMail,
  FiX,
  FiChevronDown,
  FiUsers,
  FiShield,
  FiZap
} from 'react-icons/fi';
import RobotOperationTimeline from '../src/components/trading/RobotOperationTimeline';

interface FAQ {
  question: string;
  answer: string;
}

const LandingPage: NextPage = () => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [language, setLanguage] = useState<'pt-BR' | 'en-US'>('pt-BR');
  const [showFAQ, setShowFAQ] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    // Auto-detecção de idioma via navigator
    const browserLang = navigator.language;
    if (browserLang.startsWith('en')) {
      setLanguage('en-US');
    }
  }, []);

  const content = {
    'pt-BR': {
      hero: {
        title: "MARKETBOT: o robô de trade automático que só lucra se você lucrar.",
        subtitle: "Monitoramento de mercado com IA para entrada e saída dos sinais certos.",
        btnTest: "🎯 Quero Testar Grátis",
        btnPlans: "📊 Conhecer os Planos"
      },
      howItWorks: {
        title: "Como Funciona",
        subtitle: "6 etapas simples para multiplicar seus resultados",
        steps: [
          {
            icon: "🔍",
            title: "Análise de Mercado",
            description: "IA monitora milhares de sinais em tempo real 24/7"
          },
          {
            icon: "📊", 
            title: "Detecção de Oportunidades",
            description: "Algoritmos identificam os melhores pontos de entrada"
          },
          {
            icon: "⚡",
            title: "Execução Automática", 
            description: "Robô executa operações instantaneamente"
          },
          {
            icon: "👁️",
            title: "Monitoramento Contínuo",
            description: "Acompanhamento em tempo real de todas as posições"
          },
          {
            icon: "💰",
            title: "Gestão de Lucros",
            description: "Stop loss e take profit automatizados"
          },
          {
            icon: "📈",
            title: "Relatórios Detalhados",
            description: "Dashboard completo com performance e analytics"
          }
        ]
      },
      timeline: {
        title: "Veja o Robô em Ação",
        subtitle: "Timeline em tempo real de uma operação completa"
      },
      plans: {
        title: "Escolha Seu Plano",
        subtitle: "Opções para todos os perfis de investidor",
        brasil: {
          title: "🇧🇷 Brasil",
          pro: {
            name: "PRO",
            price: "R$ 297",
            period: "/mês",
            features: [
              "Trading automático 24/7",
              "IA avançada de análise",
              "Suporte prioritário",
              "Dashboard premium",
              "Relatórios avançados"
            ]
          },
          flex: {
            name: "FLEX", 
            price: "R$ 197",
            period: "/mês",
            features: [
              "Trading básico",
              "IA de análise",
              "Suporte padrão",
              "Dashboard básico",
              "Relatórios simples"
            ]
          }
        },
        global: {
          title: "🌍 Global",
          pro: {
            name: "PRO",
            price: "$97",
            period: "/month",
            features: [
              "24/7 Automated Trading",
              "Advanced AI Analysis", 
              "Priority Support",
              "Premium Dashboard",
              "Advanced Reports"
            ]
          },
          flex: {
            name: "FLEX",
            price: "$67", 
            period: "/month",
            features: [
              "Basic Trading",
              "AI Analysis",
              "Standard Support", 
              "Basic Dashboard",
              "Simple Reports"
            ]
          }
        }
      },
      commission: {
        title: "Programa de Comissionamento",
        subtitle: "Ganhe 1,5% sobre o lucro real de cada indicado",
        features: [
          "💰 1,5% de comissão sobre lucro real",
          "🚫 Sem esquema de pirâmide",
          "💳 Saque ou crédito na plataforma", 
          "📊 Dashboard de acompanhamento",
          "🎯 Sem limite de indicações"
        ]
      },
      contact: {
        whatsapp: "WhatsApp",
        email: "E-mail: faleconosco@coinbitclub.vip"
      },
      footer: {
        terms: "Termos de Uso",
        privacy: "Política de Privacidade", 
        support: "Suporte"
      }
    },
    'en-US': {
      hero: {
        title: "MARKETBOT: the automated trading robot that only profits if you profit.",
        subtitle: "AI-powered market monitoring for precise entry and exit signals.",
        btnTest: "🎯 Try Free Now",
        btnPlans: "📊 View Plans"
      },
      howItWorks: {
        title: "How It Works",
        subtitle: "6 simple steps to multiply your results",
        steps: [
          {
            icon: "🔍",
            title: "Market Analysis", 
            description: "AI monitors thousands of signals in real-time 24/7"
          },
          {
            icon: "📊",
            title: "Opportunity Detection",
            description: "Algorithms identify the best entry points"
          },
          {
            icon: "⚡", 
            title: "Automatic Execution",
            description: "Robot executes operations instantly"
          },
          {
            icon: "👁️",
            title: "Continuous Monitoring", 
            description: "Real-time tracking of all positions"
          },
          {
            icon: "💰",
            title: "Profit Management",
            description: "Automated stop loss and take profit"
          },
          {
            icon: "📈",
            title: "Detailed Reports",
            description: "Complete dashboard with performance and analytics"
          }
        ]
      },
      timeline: {
        title: "See the Robot in Action",
        subtitle: "Real-time timeline of a complete operation"
      },
      plans: {
        title: "Choose Your Plan", 
        subtitle: "Options for all investor profiles",
        brasil: {
          title: "🇧🇷 Brazil",
          pro: {
            name: "PRO",
            price: "R$ 297",
            period: "/month",
            features: [
              "24/7 Automated Trading",
              "Advanced AI Analysis",
              "Priority Support", 
              "Premium Dashboard",
              "Advanced Reports"
            ]
          },
          flex: {
            name: "FLEX",
            price: "R$ 197", 
            period: "/month",
            features: [
              "Basic Trading",
              "AI Analysis",
              "Standard Support",
              "Basic Dashboard", 
              "Simple Reports"
            ]
          }
        },
        global: {
          title: "🌍 Global", 
          pro: {
            name: "PRO",
            price: "$97",
            period: "/month",
            features: [
              "24/7 Automated Trading",
              "Advanced AI Analysis",
              "Priority Support",
              "Premium Dashboard", 
              "Advanced Reports"
            ]
          },
          flex: {
            name: "FLEX",
            price: "$67",
            period: "/month", 
            features: [
              "Basic Trading",
              "AI Analysis", 
              "Standard Support",
              "Basic Dashboard",
              "Simple Reports"
            ]
          }
        }
      },
      commission: {
        title: "Commission Program",
        subtitle: "Earn 1.5% on real profit of each referral",
        features: [
          "💰 1.5% commission on real profit",
          "🚫 No pyramid scheme",
          "💳 Withdraw or platform credit",
          "📊 Tracking dashboard", 
          "🎯 Unlimited referrals"
        ]
      },
      contact: {
        whatsapp: "WhatsApp",
        email: "Email: faleconosco@coinbitclub.vip"
      },
      footer: {
        terms: "Terms of Use",
        privacy: "Privacy Policy",
        support: "Support"
      }
    }
  };

  const faqs: Record<string, FAQ[]> = {
    'pt-BR': [
      {
        question: "Como funciona o período de teste grátis?",
        answer: "Você tem 7 dias para testar todas as funcionalidades sem custo. Não é necessário cartão de crédito para começar."
      },
      {
        question: "O robô realmente só lucra se eu lucrar?",
        answer: "Sim! Nosso modelo de negócio é baseado no seu sucesso. Só recebemos quando você obtém lucros reais."
      },
      {
        question: "Qual o valor mínimo para começar?",
        answer: "Recomendamos um capital inicial de pelo menos $100 para operações seguras e diversificadas."
      },
      {
        question: "Como funciona o programa de afiliados?",
        answer: "Você recebe 1,5% sobre o lucro real de cada pessoa que indicar. Sem esquemas de pirâmide, apenas comissão sobre resultados reais."
      },
      {
        question: "Posso cancelar a qualquer momento?",
        answer: "Sim, você pode cancelar sua assinatura a qualquer momento sem taxas ou multas."
      }
    ],
    'en-US': [
      {
        question: "How does the free trial period work?",
        answer: "You have 7 days to test all features at no cost. No credit card required to start."
      },
      {
        question: "Does the robot really only profit if I profit?", 
        answer: "Yes! Our business model is based on your success. We only receive payment when you achieve real profits."
      },
      {
        question: "What's the minimum amount to start?",
        answer: "We recommend an initial capital of at least $100 for safe and diversified operations."
      },
      {
        question: "How does the affiliate program work?",
        answer: "You receive 1.5% on the real profit of each person you refer. No pyramid schemes, only commission on real results."
      },
      {
        question: "Can I cancel at any time?",
        answer: "Yes, you can cancel your subscription at any time without fees or penalties."
      }
    ]
  };

  const t = content[language];
  // Se estiver carregando, mostrar loading
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <div className="mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center text-black font-bold text-xl mx-auto mb-4">
              ₿
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent">
              CoinBitClub
            </h1>
          </div>
          <p className="text-white mb-2">Carregando página inicial...</p>
          <p className="text-gray-400 text-sm">Sistema premium iniciando</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Head>
        <title>CoinBitClub - MARKETBOT: Robô de Trade Automático</title>
        <meta name="description" content="MARKETBOT: o robô de trade automático que só lucra se você lucrar. Monitoramento de mercado com IA para entrada e saída dos sinais certos." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/logo-nova.jpg" />
        <link rel="apple-touch-icon" href="/logo-nova.jpg" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-slate-900 text-white">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-sm border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <Link href="/" className="flex items-center space-x-3">
                <img 
                  src="/logo-nova.jpg" 
                  alt="CoinBitClub MARKETBOT" 
                  className="w-12 h-12 rounded-lg object-cover border-2 border-yellow-400/20 hover:border-yellow-400/40 transition-all"
                />
                <div>
                  <span className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                    CoinBitClub
                  </span>
                  <p className="text-sm text-yellow-400 font-medium">MARKETBOT</p>
                </div>
              </Link>

              <div className="flex items-center space-x-4">
                {/* Language Selector */}
                <div className="flex items-center space-x-2">
                  <FiGlobe className="w-4 h-4 text-gray-400" />
                  <select 
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as 'pt-BR' | 'en-US')}
                    className="bg-gray-800 border border-gray-700 rounded-md px-2 py-1 text-sm text-white focus:outline-none focus:border-yellow-400"
                  >
                    <option value="pt-BR">🇧🇷 PT</option>
                    <option value="en-US">🇺🇸 EN</option>
                  </select>
                </div>

                <Link 
                  href="/auth/login-integrated" 
                  className="px-4 py-2 border border-blue-500 text-blue-400 rounded-lg hover:bg-blue-500/10 transition-colors"
                >
                  🔑 LOGIN
                </Link>
                
                <Link 
                  href="/auth/register" 
                  className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-lg font-semibold hover:from-yellow-500 hover:to-orange-600 transition-all"
                >
                  🚀 {language === 'pt-BR' ? 'Cadastrar' : 'Sign Up'}
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center">
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
              >
                <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent">
                  {t.hero.title}
                </span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto"
              >
                {t.hero.subtitle}
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6"
              >
                <Link 
                  href="/auth/register"
                  className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-xl font-bold text-lg hover:from-yellow-500 hover:to-orange-600 transform hover:scale-105 transition-all shadow-lg shadow-yellow-400/25"
                >
                  {t.hero.btnTest}
                </Link>
                
                <Link 
                  href="/planos"
                  className="px-8 py-4 border-2 border-blue-500 text-blue-400 rounded-xl font-bold text-lg hover:bg-blue-500/10 transition-all"
                >
                  {t.hero.btnPlans}
                </Link>
              </motion.div>
            </div>
          </div>

          {/* Background Elements */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-20 left-10 w-20 h-20 bg-yellow-400/10 rounded-full blur-xl"></div>
            <div className="absolute top-40 right-20 w-32 h-32 bg-blue-500/10 rounded-full blur-xl"></div>
            <div className="absolute bottom-20 left-1/3 w-24 h-24 bg-pink-500/10 rounded-full blur-xl"></div>
          </div>
        </section>

        {/* Robot Timeline Section */}
        <section className="py-20 bg-gradient-to-r from-gray-900/50 to-slate-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                {t.timeline.title}
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                {t.timeline.subtitle}
              </p>
            </div>
            
            <div className="bg-slate-800/50 rounded-2xl p-8 border border-gray-700">
              <RobotOperationTimeline 
                isActive={true}
                speed="normal"
                compact={false}
              />
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                {t.howItWorks.title}
              </h2>
              <p className="text-xl text-gray-300">
                {t.howItWorks.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {t.howItWorks.steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl border border-gray-700 hover:border-yellow-400/50 transition-all group"
                >
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">
                    {step.title}
                  </h3>
                  <p className="text-gray-300">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Plans Section */}
        <section className="py-20 bg-gradient-to-r from-gray-900/50 to-slate-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                {t.plans.title}
              </h2>
              <p className="text-xl text-gray-300">
                {t.plans.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Brasil Plans */}
              <div>
                <h3 className="text-2xl font-bold mb-6 text-center text-yellow-400">
                  {t.plans.brasil.title}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-yellow-400/10 to-orange-500/10 p-6 rounded-xl border border-yellow-400/30">
                    <div className="text-center mb-6">
                      <h4 className="text-xl font-bold text-yellow-400 mb-2">
                        {t.plans.brasil.pro.name}
                      </h4>
                      <div className="text-3xl font-bold mb-1">
                        {t.plans.brasil.pro.price}
                      </div>
                      <div className="text-gray-400">
                        {t.plans.brasil.pro.period}
                      </div>
                    </div>
                    <ul className="space-y-3 mb-6">
                      {t.plans.brasil.pro.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <FiCheck className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/planos"
                      className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black py-3 px-6 rounded-lg font-bold text-center block hover:from-yellow-500 hover:to-orange-600 transition-all"
                    >
                      {language === 'pt-BR' ? 'Escolher Plano' : 'Choose Plan'}
                    </Link>
                  </div>

                  <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl border border-gray-600">
                    <div className="text-center mb-6">
                      <h4 className="text-xl font-bold text-gray-300 mb-2">
                        {t.plans.brasil.flex.name}
                      </h4>
                      <div className="text-3xl font-bold mb-1">
                        {t.plans.brasil.flex.price}
                      </div>
                      <div className="text-gray-400">
                        {t.plans.brasil.flex.period}
                      </div>
                    </div>
                    <ul className="space-y-3 mb-6">
                      {t.plans.brasil.flex.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <FiCheck className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/planos"
                      className="w-full bg-gray-700 text-white py-3 px-6 rounded-lg font-bold text-center block hover:bg-gray-600 transition-all"
                    >
                      {language === 'pt-BR' ? 'Escolher Plano' : 'Choose Plan'}
                    </Link>
                  </div>
                </div>
              </div>

              {/* Global Plans */}
              <div>
                <h3 className="text-2xl font-bold mb-6 text-center text-blue-400">
                  {t.plans.global.title}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-400/10 to-purple-500/10 p-6 rounded-xl border border-blue-400/30">
                    <div className="text-center mb-6">
                      <h4 className="text-xl font-bold text-blue-400 mb-2">
                        {t.plans.global.pro.name}
                      </h4>
                      <div className="text-3xl font-bold mb-1">
                        {t.plans.global.pro.price}
                      </div>
                      <div className="text-gray-400">
                        {t.plans.global.pro.period}
                      </div>
                    </div>
                    <ul className="space-y-3 mb-6">
                      {t.plans.global.pro.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <FiCheck className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/planos"
                      className="w-full bg-gradient-to-r from-blue-400 to-purple-500 text-white py-3 px-6 rounded-lg font-bold text-center block hover:from-blue-500 hover:to-purple-600 transition-all"
                    >
                      {language === 'pt-BR' ? 'Escolher Plano' : 'Choose Plan'}
                    </Link>
                  </div>

                  <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-xl border border-gray-600">
                    <div className="text-center mb-6">
                      <h4 className="text-xl font-bold text-gray-300 mb-2">
                        {t.plans.global.flex.name}
                      </h4>
                      <div className="text-3xl font-bold mb-1">
                        {t.plans.global.flex.price}
                      </div>
                      <div className="text-gray-400">
                        {t.plans.global.flex.period}
                      </div>
                    </div>
                    <ul className="space-y-3 mb-6">
                      {t.plans.global.flex.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <FiCheck className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/planos"
                      className="w-full bg-gray-700 text-white py-3 px-6 rounded-lg font-bold text-center block hover:bg-gray-600 transition-all"
                    >
                      {language === 'pt-BR' ? 'Escolher Plano' : 'Choose Plan'}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Commission Program Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                {t.commission.title}
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                {t.commission.subtitle}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-8 rounded-2xl border border-purple-500/30 max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <FiUsers className="w-12 h-12 text-purple-400 mb-4" />
                  <h3 className="text-2xl font-bold mb-4 text-white">
                    {language === 'pt-BR' ? 'Como Funciona' : 'How It Works'}
                  </h3>
                  <ul className="space-y-3">
                    {t.commission.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-lg mr-3">{feature.split(' ')[0]}</span>
                        <span className="text-gray-300">{feature.substring(2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="text-center">
                  <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-6 rounded-xl mb-6">
                    <div className="text-4xl font-bold text-white mb-2">1,5%</div>
                  <div className="text-purple-200">
                      {language === 'pt-BR' ? 'sobre lucro real' : 'on real profit'}
                    </div>
                  </div>
                  <Link
                    href="/auth/register"
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-bold hover:from-purple-600 hover:to-pink-600 transition-all"
                  >
                    <FiArrowRight className="w-5 h-5 mr-2" />
                    {language === 'pt-BR' ? 'Começar Agora' : 'Start Now'}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-20 bg-gradient-to-r from-gray-900/50 to-slate-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              {language === 'pt-BR' ? 'Contato e Suporte' : 'Contact & Support'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
              <a
                href="https://wa.me/5521995966652"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center p-6 bg-green-600/20 border border-green-600/30 rounded-xl hover:bg-green-600/30 transition-all group"
              >
                <FiMessageCircle className="w-8 h-8 text-green-400 mr-3 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="text-lg font-bold text-white">{t.contact.whatsapp}</div>
                  <div className="text-green-400">+55 21 99596-6652</div>
                </div>
              </a>
              
              <a
                href="mailto:faleconosco@coinbitclub.vip"
                className="flex items-center justify-center p-6 bg-blue-600/20 border border-blue-600/30 rounded-xl hover:bg-blue-600/30 transition-all group"
              >
                <FiMail className="w-8 h-8 text-blue-400 mr-3 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="text-lg font-bold text-white">Email</div>
                  <div className="text-blue-400">faleconosco@coinbitclub.vip</div>
                </div>
              </a>
            </div>
          </div>
        </section>

        {/* FAQ Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setShowFAQ(true)}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black p-4 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110"
          >
            <FiMessageCircle className="w-6 h-6" />
          </button>
        </div>

        {/* FAQ Modal */}
        <AnimatePresence>
          {showFAQ && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowFAQ(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-white">
                    {language === 'pt-BR' ? 'Perguntas Frequentes' : 'Frequently Asked Questions'}
                  </h3>
                  <button
                    onClick={() => setShowFAQ(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  {faqs[language].map((faq, index) => (
                    <div key={index} className="border border-gray-700 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                        className="w-full text-left p-4 bg-gray-800 hover:bg-gray-700 transition-colors flex justify-between items-center"
                      >
                        <span className="font-medium text-white">{faq.question}</span>
                        <FiChevronDown
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            openFAQ === index ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      <AnimatePresence>
                        {openFAQ === index && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 bg-gray-900 text-gray-300">
                              {faq.answer}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className="bg-black border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center space-x-2 mb-4">
                  <img 
                    src="/logo-nova.jpg" 
                    alt="CoinBitClub" 
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                  <span className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                    CoinBitClub
                  </span>
                </div>
                <p className="text-gray-400 max-w-md">
                  {language === 'pt-BR'
                    ? 'MARKETBOT: o robô de trade automático que só lucra se você lucrar. Tecnologia de ponta para maximizar seus resultados no mercado de criptomoedas.'
                    : 'MARKETBOT: the automated trading robot that only profits if you profit. Cutting-edge technology to maximize your results in the cryptocurrency market.'
                  }
                </p>
              </div>

              <div>
                <h4 className="text-white font-bold mb-4">
                  {language === 'pt-BR' ? 'Links Úteis' : 'Useful Links'}
                </h4>
                <ul className="space-y-2">
                  <li>
                    <Link href="/politicas" className="text-gray-400 hover:text-white transition-colors">
                      {t.footer.terms}
                    </Link>
                  </li>
                  <li>
                    <Link href="/politicas" className="text-gray-400 hover:text-white transition-colors">
                      {t.footer.privacy}
                    </Link>
                  </li>
                  <li>
                    <a
                      href="https://wa.me/5521995966652"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {t.footer.support}
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-bold mb-4">
                  {language === 'pt-BR' ? 'Contato' : 'Contact'}
                </h4>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="https://wa.me/5521995966652"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      WhatsApp: +55 21 99596-6652
                    </a>
                  </li>
                  <li>
                    <a
                      href="mailto:faleconosco@coinbitclub.vip"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      faleconosco@coinbitclub.vip
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-800 mt-8 pt-8 text-center">
              <p className="text-gray-400">
                © 2025 CoinBitClub. {language === 'pt-BR' ? 'Todos os direitos reservados.' : 'All rights reserved.'}
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
