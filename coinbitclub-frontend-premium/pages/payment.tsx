import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { 
  FiArrowLeft, 
  FiCreditCard, 
  FiCheck,
  FiLoader,
  FiShield,
  FiZap
} from 'react-icons/fi';

interface PlanDetails {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  type: 'flex' | 'pro';
}

const PaymentPage: NextPage = () => {
  const router = useRouter();
  const { plan } = router.query;
  const [selectedPlan, setSelectedPlan] = useState<PlanDetails | null>(null);
  const [loading, setLoading] = useState(false);

  const planDetails: Record<string, PlanDetails> = {
    'brasil-flex': {
      id: 'brasil-flex',
      name: 'BRASIL FLEX',
      price: 'Sem mensalidade',
      description: '20% de comissão sobre lucros (pré-pago)',
      features: [
        'Bot MARKETBOT completo com todas as funcionalidades',
        'Trading automatizado 24/7 em múltiplas exchanges',
        'Dashboard premium e relatórios em tempo real',
        'Análise técnica avançada e backtesting',
        'Suporte prioritário e consultoria especializada',
        '✅ Ideal para testes e investimentos até R$ 5.000'
      ],
      type: 'flex'
    },
    'brasil-pro': {
      id: 'brasil-pro',
      name: 'BRASIL PRO',
      price: 'R$ 297/mês',
      description: 'Mensalidade + apenas 10% de comissão sobre lucros',
      features: [
        'Bot MARKETBOT completo com todas as funcionalidades',
        'Trading automatizado 24/7 em múltiplas exchanges',
        'Dashboard premium e relatórios em tempo real',
        'Análise técnica avançada e backtesting',
        'Suporte prioritário e consultoria especializada',
        '🚀 50% menos comissão = maior rentabilidade',
        '💰 Ideal para investimentos acima de R$ 5.000'
      ],
      type: 'pro'
    },
    'global-flex': {
      id: 'global-flex',
      name: 'GLOBAL FLEX',
      price: 'No monthly fee',
      description: '20% commission on profits (prepaid)',
      features: [
        'Complete MARKETBOT with all functionalities',
        '24/7 automated trading on multiple exchanges',
        'Premium dashboard and real-time reports',
        'Advanced technical analysis and backtesting',
        'Priority support and specialized consulting',
        '✅ Ideal for testing and investments up to USD 5,000'
      ],
      type: 'flex'
    },
    'global-pro': {
      id: 'global-pro',
      name: 'GLOBAL PRO',
      price: 'USD 60/month',
      description: 'Monthly fee + only 10% commission on profits',
      features: [
        'Complete MARKETBOT with all functionalities',
        '24/7 automated trading on multiple exchanges',
        'Premium dashboard and real-time reports',
        'Advanced technical analysis and backtesting',
        'Priority support and specialized consulting',
        '🚀 50% less commission = higher profitability',
        '💰 Ideal for investments above USD 5,000'
      ],
      type: 'pro'
    }
  };

  useEffect(() => {
    if (plan && typeof plan === 'string') {
      const planData = planDetails[plan];
      if (planData) {
        setSelectedPlan(planData);
      }
    }
  }, [plan]);

  const handlePayment = async () => {
    if (!selectedPlan) return;

    setLoading(true);

    // Para planos FLEX (sem mensalidade), apenas redirecionar para cadastro
    if (selectedPlan.type === 'flex') {
      router.push(`/auth/register?plan=${selectedPlan.id}`);
      return;
    }

    // Para planos PRO (com mensalidade), processar com Stripe
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
        }),
      });

      const data = await response.json();

      if (data.success && data.url) {
        // Redirecionar diretamente para o Stripe Checkout
        window.location.href = data.url;
      } else {
        console.error('Error creating checkout session:', data.message || data.error);
        alert('Erro ao processar pagamento. Tente novamente.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <FiLoader className="w-16 h-16 text-yellow-400 animate-spin mx-auto mb-6" />
          <p className="text-yellow-400 text-2xl font-bold mb-2">⚡ CoinBitClub ⚡</p>
          <p className="text-blue-400 text-lg">Carregando plano...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Pagamento - {selectedPlan.name} | CoinBitClub</title>
        <meta name="description" content={`Contratar plano ${selectedPlan.name} - CoinBitClub MARKETBOT`} />
      </Head>

      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Link href="/planos" className="flex items-center space-x-3">
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
            
            <Link href="/planos" className="inline-flex items-center text-yellow-400 hover:text-yellow-300 transition-colors">
              <FiArrowLeft className="w-5 h-5 mr-2" />
              Voltar aos Planos
            </Link>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  Contratar <span className="text-yellow-400">{selectedPlan.name}</span>
                </h1>
                <p className="text-xl text-gray-300 mb-8">
                  {selectedPlan.description}
                </p>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Plan Details */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-gray-900/50 border border-gray-700 rounded-2xl p-8"
              >
                <h3 className="text-2xl font-bold text-white mb-6">Detalhes do Plano</h3>
                
                <div className="mb-6">
                  <h4 className="text-4xl font-bold text-yellow-400 mb-2">
                    {selectedPlan.price}
                  </h4>
                  <p className="text-gray-300">
                    {selectedPlan.description}
                  </p>
                </div>

                <div className="space-y-4">
                  <h5 className="text-lg font-semibold text-white">Funcionalidades incluídas:</h5>
                  {selectedPlan.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <FiCheck className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-4 bg-blue-900/20 border border-blue-400/30 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <FiShield className="w-5 h-5 text-blue-400" />
                    <span className="text-blue-400 font-semibold">Garantia de Segurança</span>
                  </div>
                  <p className="text-gray-300 text-sm">
                    Seus dados e investimentos estão protegidos com criptografia de ponta e auditoria contínua.
                  </p>
                </div>
              </motion.div>

              {/* Payment Action */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-gray-900/50 border border-gray-700 rounded-2xl p-8"
              >
                <h3 className="text-2xl font-bold text-white mb-6">
                  {selectedPlan.type === 'flex' ? 'Ativar Plano' : 'Finalizar Pagamento'}
                </h3>

                {selectedPlan.type === 'flex' ? (
                  <div className="space-y-6">
                    <div className="bg-green-900/20 border border-green-400/30 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <FiZap className="w-5 h-5 text-green-400" />
                        <span className="text-green-400 font-semibold">Plano Pré-pago</span>
                      </div>
                      <p className="text-gray-300 text-sm">
                        Este plano não tem mensalidade. Você paga apenas 20% sobre os lucros reais gerados pelo bot.
                      </p>
                    </div>

                    <div className="bg-blue-900/20 border border-blue-400/30 rounded-lg p-4">
                      <h4 className="text-blue-400 font-semibold mb-2">📊 Análise de Custo-Benefício</h4>
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-300">• <strong>Capital até R$ 5.000:</strong> Plano FLEX é mais vantajoso</p>
                        <p className="text-gray-300">• <strong>Sem risco de taxa fixa</strong> - pague só quando lucrar</p>
                        <p className="text-gray-300">• <strong>Ideal para:</strong> Iniciantes e testes do sistema</p>
                      </div>
                    </div>

                    <ul className="space-y-2 text-gray-300">
                      <li>✓ Sem taxas mensais</li>
                      <li>✓ Todas as funcionalidades incluídas</li>
                      <li>✓ Pague apenas quando lucrar</li>
                      <li>✓ Teste grátis por 7 dias</li>
                      <li>✓ Cancele quando quiser</li>
                    </ul>

                    <button
                      onClick={handlePayment}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-bold py-4 px-6 rounded-xl hover:from-yellow-300 hover:to-orange-300 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <FiLoader className="w-5 h-5 animate-spin" />
                          <span>Processando...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <FiZap className="w-5 h-5" />
                          <span>Ativar Plano FLEX</span>
                        </div>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-blue-900/20 border border-blue-400/30 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <FiCreditCard className="w-5 h-5 text-blue-400" />
                        <span className="text-blue-400 font-semibold">Plano PRO - Maior Rentabilidade</span>
                      </div>
                      <p className="text-gray-300 text-sm">
                        Mensalidade fixa + apenas 10% de comissão. Mais lucrativo para investimentos maiores.
                      </p>
                    </div>

                    <div className="bg-green-900/20 border border-green-400/30 rounded-lg p-4">
                      <h4 className="text-green-400 font-semibold mb-2">💰 Vantagem Financeira</h4>
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-300">• <strong>50% menos comissão</strong> que o plano FLEX</p>
                        <p className="text-gray-300">• <strong>Capital &gt; R$ 5.000:</strong> Plano PRO é mais rentável</p>
                        <p className="text-gray-300">• <strong>ROI otimizado</strong> para investidores sérios</p>
                      </div>
                    </div>

                    <ul className="space-y-2 text-gray-300">
                      <li>✓ Todas as funcionalidades incluídas</li>
                      <li>✓ Comissão 50% menor (10% vs 20%)</li>
                      <li>✓ Ideal para capital alto</li>
                      <li>✓ Suporte prioritário</li>
                      <li>✓ 7 dias de teste grátis</li>
                      <li>✓ Cancele quando quiser</li>
                    </ul>

                    <button
                      onClick={handlePayment}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-bold py-4 px-6 rounded-xl hover:from-yellow-300 hover:to-orange-300 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <FiLoader className="w-5 h-5 animate-spin" />
                          <span>Processando...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <FiZap className="w-5 h-5" />
                          <span>Assine Já - Escolha como Pagar</span>
                        </div>
                      )}
                    </button>
                  </div>
                )}

                <div className="mt-6 text-center text-gray-400 text-sm">
                  <p>
                    Ao continuar, você concorda com nossos{' '}
                    <Link href="/terms" className="text-yellow-400 hover:underline">
                      Termos de Serviço
                    </Link>{' '}
                    e{' '}
                    <Link href="/privacy" className="text-yellow-400 hover:underline">
                      Política de Privacidade
                    </Link>
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentPage;
