import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FiCheck, 
  FiX, 
  FiArrowLeft, 
  FiStar,
  FiZap,
  FiGlobe,
  FiShield,
  FiTrendingUp,
  FiUsers,
  FiClock,
  FiTarget,
  FiLoader
} from 'react-icons/fi';
interface Plan {
  id: string;
  name: string;
  subtitle: string;
  region: string;
  price?: string;
  originalPrice?: string;
  commission: string;
  trial: string;
  badge?: string;
  popular?: boolean;
  features: {
    category: string;
    items: { name: string; included: boolean; highlight?: boolean }[];
  }[];
  cta: string;
  ctaLink: string;
}

const PlanosPage: NextPage = () => {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handlePlanSelection = async (planId: string) => {
    // Redirecionar diretamente para a página de pagamento
    window.location.href = `/payment?plan=${planId}`;
  };

  const plans: Plan[] = [
    {
      id: 'brasil-flex',
      name: 'BRASIL FLEX',
      subtitle: 'Pré-pago - Ideal para testes',
      region: 'Brasil',
      price: 'Sem mensalidade',
      commission: '20% de comissão sobre lucros',
      trial: 'Todas as funcionalidades incluídas',
      features: [
        {
          category: 'Trading Automatizado',
          items: [
            { name: 'Bot MARKETBOT completo', included: true },
            { name: 'Sinais de entrada e saída', included: true },
            { name: 'Stop Loss automático', included: true },
            { name: 'Take Profit inteligente', included: true },
            { name: 'Trading 24/7', included: true },
            { name: 'Múltiplas exchanges', included: true },
            { name: 'Trading multi-pares', included: true }
          ]
        },
        {
          category: 'Análise e Monitoramento',
          items: [
            { name: 'Dashboard premium', included: true },
            { name: 'Relatórios em tempo real', included: true },
            { name: 'Análise técnica básica', included: true },
            { name: 'Análise técnica avançada', included: true },
            { name: 'Backtesting', included: true },
            { name: 'Análise de sentimento', included: true }
          ]
        },
        {
          category: 'Suporte e Atendimento',
          items: [
            { name: 'Suporte por email', included: true },
            { name: 'Central de ajuda', included: true },
            { name: 'Materiais educativos avançados', included: true },
            { name: 'Suporte prioritário', included: true },
            { name: 'Consultoria especializada', included: true }
          ]
        }
      ],
      cta: 'Começar Grátis',
      ctaLink: 'brasil-flex'
    },
    {
      id: 'brasil-pro',
      name: 'BRASIL PRO',
      subtitle: 'Recomendado para R$ 5.000+',
      region: 'Brasil',
      price: 'R$ 297',
      originalPrice: 'R$ 497',
      commission: 'R$ 297/mês + 10% de comissão sobre lucros',
      trial: 'Mesmas funcionalidades, comissão menor',
      badge: 'MELHOR CUSTO-BENEFÍCIO',
      popular: true,
      features: [
        {
          category: 'Trading Automatizado',
          items: [
            { name: 'Bot MARKETBOT completo', included: true, highlight: true },
            { name: 'Sinais de entrada e saída', included: true },
            { name: 'Stop Loss automático', included: true },
            { name: 'Take Profit inteligente', included: true },
            { name: 'Trading 24/7', included: true },
            { name: 'Múltiplas exchanges', included: true, highlight: true },
            { name: 'Trading multi-pares', included: true, highlight: true }
          ]
        },
        {
          category: 'Análise e Monitoramento',
          items: [
            { name: 'Dashboard premium', included: true, highlight: true },
            { name: 'Relatórios em tempo real', included: true },
            { name: 'Análise técnica básica', included: true },
            { name: 'Análise técnica avançada', included: true, highlight: true },
            { name: 'Backtesting', included: true, highlight: true },
            { name: 'Análise de sentimento', included: true, highlight: true }
          ]
        },
        {
          category: 'Suporte e Atendimento',
          items: [
            { name: 'Suporte por email', included: true },
            { name: 'Central de ajuda', included: true },
            { name: 'Materiais educativos avançados', included: true },
            { name: 'Suporte prioritário', included: true, highlight: true },
            { name: 'Consultoria especializada', included: true, highlight: true }
          ]
        },
        {
          category: 'Vantagem Financeira',
          items: [
            { name: '50% menos comissão que o FLEX', included: true, highlight: true },
            { name: 'Ideal para capital > R$ 5.000', included: true, highlight: true },
            { name: 'ROI otimizado', included: true, highlight: true }
          ]
        }
      ],
      cta: 'Assine Já',
      ctaLink: 'brasil-pro'
    },
    {
      id: 'global-flex',
      name: 'GLOBAL FLEX',
      subtitle: 'Prepaid - Ideal for testing',
      region: 'Global',
      price: 'No monthly fee',
      commission: '20% commission on profits',
      trial: 'All features included',
      features: [
        {
          category: 'Automated Trading',
          items: [
            { name: 'Complete MARKETBOT', included: true },
            { name: 'Entry and exit signals', included: true },
            { name: 'Automatic Stop Loss', included: true },
            { name: 'Smart Take Profit', included: true },
            { name: '24/7 Trading', included: true },
            { name: 'Multiple exchanges', included: true },
            { name: 'Multi-pair trading', included: true }
          ]
        },
        {
          category: 'Analysis & Monitoring',
          items: [
            { name: 'Premium dashboard', included: true },
            { name: 'Real-time reports', included: true },
            { name: 'Basic technical analysis', included: true },
            { name: 'Advanced technical analysis', included: true },
            { name: 'Backtesting', included: true },
            { name: 'Sentiment analysis', included: true }
          ]
        },
        {
          category: 'Support & Service',
          items: [
            { name: 'Email support', included: true },
            { name: 'Help center', included: true },
            { name: 'Advanced educational materials', included: true },
            { name: 'Priority support', included: true },
            { name: 'Personal consulting', included: true }
          ]
        }
      ],
      cta: 'Start Free',
      ctaLink: 'global-flex'
    },
    {
      id: 'global-pro',
      name: 'GLOBAL PRO',
      subtitle: 'Recommended for USD 5,000+',
      region: 'Global',
      price: 'USD 60',
      originalPrice: 'USD 100',
      commission: 'USD 60/month + 10% commission on profits',
      trial: 'Same features, lower commission',
      badge: 'BEST VALUE',
      features: [
        {
          category: 'Automated Trading',
          items: [
            { name: 'Complete MARKETBOT', included: true, highlight: true },
            { name: 'Entry and exit signals', included: true },
            { name: 'Automatic Stop Loss', included: true },
            { name: 'Smart Take Profit', included: true },
            { name: '24/7 Trading', included: true },
            { name: 'Multiple exchanges', included: true, highlight: true },
            { name: 'Multi-pair trading', included: true, highlight: true }
          ]
        },
        {
          category: 'Analysis & Monitoring',
          items: [
            { name: 'Premium dashboard', included: true, highlight: true },
            { name: 'Real-time reports', included: true },
            { name: 'Basic technical analysis', included: true },
            { name: 'Advanced technical analysis', included: true, highlight: true },
            { name: 'Backtesting', included: true, highlight: true },
            { name: 'Sentiment analysis', included: true, highlight: true }
          ]
        },
        {
          category: 'Support & Service',
          items: [
            { name: 'Email support', included: true },
            { name: 'Help center', included: true },
            { name: 'Advanced educational materials', included: true },
            { name: 'Priority support', included: true, highlight: true },
            { name: 'Personal consulting', included: true, highlight: true }
          ]
        },
        {
          category: 'Financial Advantage',
          items: [
            { name: '50% less commission than FLEX', included: true, highlight: true },
            { name: 'Ideal for capital > USD 5,000', included: true, highlight: true },
            { name: 'Optimized ROI', included: true, highlight: true }
          ]
        }
      ],
      cta: 'Subscribe Now',
      ctaLink: 'global-pro'
    }
  ];

  return (
    <div>
      <Head>
        <title>Planos e Preços - CoinBitClub MARKETBOT</title>
        <meta name="description" content="Escolha o plano ideal para você. Brasil ou Global, FLEX ou PRO. Teste grátis por 7 dias e comece a lucrar com trading automatizado." />
        <link rel="icon" href="/logo-nova.jpg" />
        <link rel="apple-touch-icon" href="/logo-nova.jpg" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-slate-900">
        {/* Header */}
        <div className="container mx-auto px-4 py-8">
          {/* Logo e Navegação */}
          <div className="flex items-center justify-between mb-8">
            <Link href="/" className="flex items-center space-x-3">
              <img 
                src="/logo-nova.jpg" 
                alt="CoinBitClub MARKETBOT" 
                className="h-12 w-12 rounded-lg object-cover"
              />
              <div>
                <h1 className="text-xl font-bold text-white">CoinBitClub</h1>
                <p className="text-sm text-yellow-400">MARKETBOT</p>
              </div>
            </Link>
            
            <Link href="/" className="inline-flex items-center text-yellow-400 hover:text-yellow-300 transition-colors">
              <FiArrowLeft className="w-5 h-5 mr-2" />
              Voltar para Home
            </Link>
          </div>

          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Escolha seu <span className="text-yellow-400">Plano</span>
              </h1>
              <p className="text-xl text-gray-300 mb-4 max-w-3xl mx-auto">
                <span className="text-yellow-400 font-semibold block mb-2">
                  Ambos os planos têm as MESMAS funcionalidades completas!
                </span>
                A diferença está apenas na estrutura de comissão:
              </p>
              <div className="bg-black/30 border border-yellow-400/30 rounded-lg p-6 mb-8 max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                  <div className="border-r border-yellow-400/20 pr-6">
                    <h3 className="text-yellow-400 font-bold text-lg mb-3">🔸 FLEX (Pré-pago)</h3>
                    <p className="text-gray-300 text-sm mb-2">• Sem mensalidade</p>
                    <p className="text-gray-300 text-sm mb-2">• 20% de comissão sobre lucros</p>
                    <p className="text-blue-400 text-sm italic">Ideal para testes e investimentos menores</p>
                  </div>
                  <div className="pl-6">
                    <h3 className="text-yellow-400 font-bold text-lg mb-3">🔸 PRO (Assinatura)</h3>
                    <p className="text-gray-300 text-sm mb-2">• Taxa mensal fixa</p>
                    <p className="text-gray-300 text-sm mb-2">• Apenas 10% de comissão sobre lucros</p>
                    <p className="text-green-400 text-sm italic font-semibold">Mais rentável para capital &gt; R$ 5k / USD 5k</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative bg-gray-900/50 border rounded-2xl p-6 ${
                  plan.popular 
                    ? 'border-yellow-400 ring-2 ring-yellow-400/20' 
                    : 'border-gray-700'
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-4 py-1 rounded-full text-sm font-bold">
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Header */}
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center mb-2">
                    {plan.region === 'Brasil' ? (
                      <span className="text-2xl mr-2">🇧🇷</span>
                    ) : (
                      <FiGlobe className="w-6 h-6 text-yellow-400 mr-2" />
                    )}
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  </div>
                  <p className="text-gray-400 text-sm mb-4">{plan.subtitle}</p>
                  
                  <div className="mb-4">
                    {/* Pricing Display */}
                    {plan.price && (
                      <div className="text-center mb-4">
                        <div className="text-sm text-gray-400 uppercase tracking-wider mb-2">
                          {plan.price === 'Grátis' || plan.price === 'Free' ? 'Sem Mensalidade' : 'Valor Mensal'}
                        </div>
                        <div className="flex items-center justify-center gap-2 mb-2">
                          {plan.originalPrice && (
                            <span className="text-lg text-gray-500 line-through">
                              {plan.originalPrice}
                            </span>
                          )}
                          <span className="text-4xl font-bold text-yellow-400">
                            {plan.price}
                          </span>
                          {plan.price !== 'Grátis' && plan.price !== 'Free' && (
                            <span className="text-gray-400">/mês</span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Commission Info */}
                    <div className="text-center mb-2">
                      <span className="text-sm text-gray-400 uppercase tracking-wider">
                        Estrutura de Pagamento
                      </span>
                    </div>
                    <div className="text-center mb-2">
                      <span className="text-lg font-semibold text-green-400">
                        {plan.commission}
                      </span>
                    </div>
                    <p className="text-center text-sm text-gray-400 mb-2">
                      {plan.price === 'Grátis' || plan.price === 'Free' ? 'Você só paga se lucrar' : 'Mensalidade + comissão sobre lucros'}
                    </p>
                    <p className="text-green-400 text-sm font-semibold text-center">
                      {plan.trial}
                    </p>
                  </div>

                  <button 
                    onClick={() => handlePlanSelection(plan.id)}
                    disabled={loadingPlan === plan.id}
                    className={`block w-full py-3 px-4 rounded-lg font-bold transition-all text-center relative ${
                      plan.popular
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:from-yellow-500 hover:to-orange-600'
                        : 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-600'
                    } ${loadingPlan === plan.id ? 'opacity-75 cursor-not-allowed' : ''}`}
                  >
                    {loadingPlan === plan.id ? (
                      <div className="flex items-center justify-center">
                        <FiLoader className="w-4 h-4 mr-2 animate-spin" />
                        Processando...
                      </div>
                    ) : (
                      plan.cta
                    )}
                  </button>
                </div>

                {/* Features */}
                <div className="space-y-6">
                  {plan.features.map((category, catIndex) => (
                    <div key={catIndex}>
                      <h4 className="text-white font-semibold mb-3 text-sm flex items-center">
                        {catIndex === 0 && <FiZap className="w-4 h-4 mr-2 text-yellow-400" />}
                        {catIndex === 1 && <FiTrendingUp className="w-4 h-4 mr-2 text-yellow-400" />}
                        {catIndex === 2 && <FiUsers className="w-4 h-4 mr-2 text-yellow-400" />}
                        {category.category}
                      </h4>
                      <ul className="space-y-2">
                        {category.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-start text-sm">
                            {item.included ? (
                              <FiCheck className={`w-4 h-4 mr-3 mt-0.5 flex-shrink-0 ${
                                item.highlight ? 'text-yellow-400' : 'text-green-400'
                              }`} />
                            ) : (
                              <FiX className="w-4 h-4 mr-3 mt-0.5 flex-shrink-0 text-gray-500" />
                            )}
                            <span className={`${
                              item.included 
                                ? item.highlight 
                                  ? 'text-yellow-300 font-medium' 
                                  : 'text-gray-300'
                                : 'text-gray-500'
                            }`}>
                              {item.name}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Additional Info */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FiShield className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-white font-bold mb-2">100% Seguro</h3>
              <p className="text-gray-400 text-sm">
                Seus fundos ficam na sua exchange. Nunca transferimos seu dinheiro.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FiClock className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-white font-bold mb-2">7 Dias Grátis</h3>
              <p className="text-gray-400 text-sm">
                Teste qualquer plano por 7 dias sem pagar nada. Cancele quando quiser.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FiTarget className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-white font-bold mb-2">Só Ganha se Você Ganhar</h3>
              <p className="text-gray-400 text-sm">
                Cobramos apenas 1,5% sobre o lucro real que geramos para você.
              </p>
            </div>
          </motion.div>

          {/* FAQ Link */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="text-center mt-16"
          >
            <p className="text-gray-400 mb-4">
              Ainda tem dúvidas sobre os planos?
            </p>
            <Link 
              href="/#faq" 
              className="inline-flex items-center text-yellow-400 hover:text-yellow-300 transition-colors font-medium"
            >
              <FiStar className="w-5 h-5 mr-2" />
              Ver Perguntas Frequentes
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PlanosPage;
