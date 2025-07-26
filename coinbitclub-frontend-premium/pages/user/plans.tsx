import React from 'react';

export default function UserPlans() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Planos e Assinaturas</h1>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-zinc-900 p-6 rounded-lg">
          <h3 className="text-xl font-bold mb-4">Básico</h3>
          <p className="text-3xl font-bold text-blue-400 mb-4">$97/mês</p>
          <ul className="space-y-2 mb-6">
            <li>• Até 5 operações simultâneas</li>
            <li>• Suporte básico</li>
            <li>• Relatórios mensais</li>
          </ul>
          <button className="w-full bg-blue-500 hover:bg-blue-600 py-2 px-4 rounded">
            Assinar
          </button>
        </div>
        <div className="bg-zinc-900 p-6 rounded-lg border border-blue-500">
          <h3 className="text-xl font-bold mb-4">Premium</h3>
          <p className="text-3xl font-bold text-blue-400 mb-4">$197/mês</p>
          <ul className="space-y-2 mb-6">
            <li>• Operações ilimitadas</li>
            <li>• Suporte prioritário</li>
            <li>• Relatórios em tempo real</li>
            <li>• API avançada</li>
          </ul>
          <button className="w-full bg-blue-500 hover:bg-blue-600 py-2 px-4 rounded">
            Assinar
          </button>
        </div>
      </div>
    </div>
      </div>
    </>
  );
}

export default function UserPlans() {
  return (
    <>
      <Head>
        <title>Planos | CoinBitClub</title>
      </Head>
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <h1 className="text-4xl font-bold text-yellow-400">Página de Planos</h1>
      </div>
    </>
  );
}
  FiCalendar, FiDollarSign, FiTrendingUp, FiGift, FiCrown,
  FiZap, FiPackage, FiLock, FiUnlock, FiClock, FiInfo
} from 'react-icons/fi';

interface Plan {
  id: string;
  name: string;
  type: 'basic' | 'premium' | 'professional' | 'enterprise';
  price_monthly: number;
  price_yearly: number;
  max_operations: number;
  max_exchanges: number;
  support_level: string;
  ai_analysis: boolean;
  features: string[];
  recommended: boolean;
  popular: boolean;
  stripe_price_id_monthly: string;
  stripe_price_id_yearly: string;
}

interface UserSubscription {
  id: string;
  plan_name: string;
  plan_type: string;
  status: 'active' | 'cancelled' | 'past_due' | 'incomplete';
  current_period_start: string;
  current_period_end: string;
  payment_method: string;
  billing_cycle: 'monthly' | 'yearly';
  amount: number;
  next_payment_date: string;
  auto_renewal: boolean;
}

interface PlansData {
  available_plans: Plan[];
  current_subscription?: UserSubscription;
  user: {
    name: string;
    plan_type: string;
    account_type: string;
  };
}

const UserPlans: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [plansData, setPlansData] = useState<PlansData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/plans');
      
      if (response.ok) {
        const data = await response.json();
        setPlansData(data);
      } else {
        console.error('Erro ao buscar planos');
        setPlansData(getMockData());
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
      setPlansData(getMockData());
    } finally {
      setLoading(false);
    }
  };

  const getMockData = (): PlansData => ({
    available_plans: [
      {
        id: '1',
        name: 'Basic',
        type: 'basic',
        price_monthly: 49.90,
        price_yearly: 499.00,
        max_operations: 10,
        max_exchanges: 1,
        support_level: 'Suporte básico por e-mail',
        ai_analysis: false,
        features: [
          'Até 10 operações simultâneas',
          '1 exchange conectada',
          'Sinais básicos de trading',
          'Dashboard básico',
          'Suporte por e-mail'
        ],
        recommended: false,
        popular: false,
        stripe_price_id_monthly: 'price_basic_monthly',
        stripe_price_id_yearly: 'price_basic_yearly'
      },
      {
        id: '2',
        name: 'Premium',
        type: 'premium',
        price_monthly: 149.90,
        price_yearly: 1499.00,
        max_operations: 50,
        max_exchanges: 2,
        support_level: 'Suporte prioritário',
        ai_analysis: true,
        features: [
          'Até 50 operações simultâneas',
          '2 exchanges conectadas',
          'Análise AI avançada',
          'Sinais premium',
          'Dashboard completo',
          'Suporte prioritário',
          'Análises de mercado',
          'Relatórios detalhados'
        ],
        recommended: true,
        popular: true,
        stripe_price_id_monthly: 'price_premium_monthly',
        stripe_price_id_yearly: 'price_premium_yearly'
      },
      {
        id: '3',
        name: 'Professional',
        type: 'professional',
        price_monthly: 299.90,
        price_yearly: 2999.00,
        max_operations: 100,
        max_exchanges: 5,
        support_level: 'Suporte VIP 24/7',
        ai_analysis: true,
        features: [
          'Até 100 operações simultâneas',
          '5 exchanges conectadas',
          'AI Analysis Pro',
          'Copy Trading',
          'Gestão de risco avançada',
          'Sinais exclusivos',
          'Suporte VIP 24/7',
          'Consultoria personalizada',
          'Backtesting avançado'
        ],
        recommended: false,
        popular: false,
        stripe_price_id_monthly: 'price_professional_monthly',
        stripe_price_id_yearly: 'price_professional_yearly'
      }
    ],
    current_subscription: {
      id: 'sub_123',
      plan_name: 'Premium',
      plan_type: 'premium',
      status: 'active',
      current_period_start: '2024-07-01T00:00:00Z',
      current_period_end: '2024-08-01T00:00:00Z',
      payment_method: 'Cartão ****1234',
      billing_cycle: 'monthly',
      amount: 149.90,
      next_payment_date: '2024-08-01T00:00:00Z',
      auto_renewal: true
    },
    user: {
      name: 'João Silva',
      plan_type: 'premium',
      account_type: 'production'
    }
  });

  const handleSubscribe = async (planId: string) => {
    try {
      setProcessingPayment(planId);
      
      const response = await fetch('/api/user/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_id: planId,
          billing_cycle: selectedBilling
        }),
      });

      if (response.ok) {
        const { checkout_url } = await response.json();
        window.location.href = checkout_url;
      } else {
        console.error('Erro ao processar assinatura');
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
    } finally {
      setProcessingPayment(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Tem certeza que deseja cancelar sua assinatura?')) return;

    try {
      const response = await fetch('/api/user/subscription/cancel', {
        method: 'POST',
      });

      if (response.ok) {
        fetchPlans();
      } else {
        console.error('Erro ao cancelar assinatura');
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const data = plansData || getMockData();

  const getPlanColor = (type: string) => {
    switch (type) {
      case 'basic': return 'border-blue-400/50 bg-blue-400/10';
      case 'premium': return 'border-yellow-400/50 bg-yellow-400/10';
      case 'professional': return 'border-purple-400/50 bg-purple-400/10';
      case 'enterprise': return 'border-pink-400/50 bg-pink-400/10';
      default: return 'border-gray-400/50 bg-gray-400/10';
    }
  };

  const getPlanTextColor = (type: string) => {
    switch (type) {
      case 'basic': return 'text-blue-400';
      case 'premium': return 'text-yellow-400';
      case 'professional': return 'text-purple-400';
      case 'enterprise': return 'text-pink-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-400/20 text-green-400 border border-green-400/50';
      case 'cancelled': return 'bg-red-400/20 text-red-400 border border-red-400/50';
      case 'past_due': return 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50';
      default: return 'bg-gray-400/20 text-gray-400 border border-gray-400/50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <FiRefreshCw className="w-16 h-16 text-yellow-400 animate-spin mx-auto mb-6" />
          <p className="text-yellow-400 text-2xl font-bold mb-2">⚡ CoinBitClub ⚡</p>
          <p className="text-blue-400 text-lg">Carregando Planos...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Planos e Assinatura | CoinBitClub</title>
        <meta name="description" content="Gerencie seu plano e assinatura - CoinBitClub" />
      </Head>

      <div className="min-h-screen bg-black flex">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-black/95 backdrop-blur-sm border-r border-yellow-400/30 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:relative lg:flex lg:flex-col lg:w-64`}>
          <div className="flex items-center justify-center h-16 px-4 bg-gradient-to-r from-yellow-400/20 to-pink-400/20 border-b border-yellow-400/30">
            <h1 className="text-xl font-bold text-yellow-400">⚡ CoinBitClub</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="ml-auto lg:hidden text-yellow-400 hover:text-pink-400"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          <nav className="mt-8 px-4">
            <div className="space-y-3">
              <a href="/user/dashboard" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiHome className="w-6 h-6 mr-4" />
                <span>Dashboard</span>
              </a>
              <a href="/user/operations" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiActivity className="w-6 h-6 mr-4" />
                <span>Operações</span>
              </a>
              <a href="/user/plans" className="flex items-center px-6 py-4 text-yellow-400 bg-yellow-400/20 rounded-xl border-2 border-yellow-400/50 shadow-lg shadow-yellow-400/20 font-bold">
                <FiCreditCard className="w-6 h-6 mr-4" />
                <span>Planos</span>
              </a>
              <a href="/user/settings" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiSettings className="w-6 h-6 mr-4" />
                <span>Configurações</span>
              </a>
            </div>
          </nav>

          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-black/70 border border-yellow-400/30 rounded-lg p-3">
              <div className="flex items-center text-sm text-yellow-400">
                <FiShield className="w-4 h-4 mr-2 text-pink-400" />
                {data.user.name}
              </div>
              <p className="text-xs text-blue-400 mt-1">
                {data.user.plan_type} • {data.user.account_type}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:w-0">
          {/* Header */}
          <header className="bg-black/90 backdrop-blur-sm border-b border-yellow-400/30">
            <div className="flex items-center justify-between px-8 py-6">
              <div className="flex items-center space-x-6">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden text-blue-400 hover:text-yellow-400 transition-colors"
                >
                  <FiMenu className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold text-yellow-400">Planos e Assinatura</h2>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={fetchPlans}
                  className="flex items-center px-4 py-2 text-blue-400 hover:text-yellow-400 bg-black/80 hover:bg-yellow-400/10 border border-blue-400/50 hover:border-yellow-400/70 rounded-lg transition-all duration-300"
                >
                  <FiRefreshCw className="w-4 h-4 mr-2" />
                  <span>Atualizar</span>
                </button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="p-6 bg-black min-h-screen">
            {/* Assinatura Atual */}
            {data.current_subscription && (
              <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border border-yellow-400/30 mb-8">
                <h3 className="text-xl font-bold text-yellow-400 mb-6 flex items-center">
                  <FiPackage className="w-6 h-6 mr-3" />
                  Sua Assinatura Atual
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-black/50 rounded-lg p-4 border border-blue-400/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-blue-300 text-sm">Plano</span>
                      <FiCrown className="w-5 h-5 text-yellow-400" />
                    </div>
                    <p className="text-xl font-bold text-yellow-400">{data.current_subscription.plan_name}</p>
                  </div>

                  <div className="bg-black/50 rounded-lg p-4 border border-green-400/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-green-300 text-sm">Status</span>
                      <FiShield className="w-5 h-5 text-green-400" />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(data.current_subscription.status)}`}>
                      {data.current_subscription.status === 'active' ? 'Ativa' : 
                       data.current_subscription.status === 'cancelled' ? 'Cancelada' : 'Pendente'}
                    </span>
                  </div>

                  <div className="bg-black/50 rounded-lg p-4 border border-purple-400/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-purple-300 text-sm">Próximo Pagamento</span>
                      <FiCalendar className="w-5 h-5 text-purple-400" />
                    </div>
                    <p className="text-lg font-bold text-purple-400">
                      {new Date(data.current_subscription.next_payment_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  <div className="bg-black/50 rounded-lg p-4 border border-pink-400/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-pink-300 text-sm">Valor</span>
                      <FiDollarSign className="w-5 h-5 text-pink-400" />
                    </div>
                    <p className="text-lg font-bold text-pink-400">
                      R$ {data.current_subscription.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-between items-center">
                  <div>
                    <p className="text-blue-400 text-sm">
                      Método de pagamento: {data.current_subscription.payment_method}
                    </p>
                    <p className="text-blue-300 text-xs mt-1">
                      Renovação automática: {data.current_subscription.auto_renewal ? 'Ativada' : 'Desativada'}
                    </p>
                  </div>
                  
                  <button
                    onClick={handleCancelSubscription}
                    className="px-4 py-2 text-red-400 bg-red-400/20 border border-red-400/50 rounded-lg hover:bg-red-400/30 transition-colors"
                  >
                    Cancelar Assinatura
                  </button>
                </div>
              </div>
            )}

            {/* Seletor de Ciclo de Cobrança */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center bg-black/80 border border-yellow-400/30 rounded-lg p-1">
                <button
                  onClick={() => setSelectedBilling('monthly')}
                  className={`px-6 py-2 rounded-lg transition-all ${
                    selectedBilling === 'monthly'
                      ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50'
                      : 'text-blue-400 hover:text-yellow-400'
                  }`}
                >
                  Mensal
                </button>
                <button
                  onClick={() => setSelectedBilling('yearly')}
                  className={`px-6 py-2 rounded-lg transition-all ${
                    selectedBilling === 'yearly'
                      ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50'
                      : 'text-blue-400 hover:text-yellow-400'
                  }`}
                >
                  Anual
                  <span className="ml-2 px-2 py-1 bg-green-400/20 text-green-400 text-xs rounded-full">
                    -17%
                  </span>
                </button>
              </div>
            </div>

            {/* Planos Disponíveis */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {data.available_plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`bg-black/80 backdrop-blur-sm rounded-xl p-6 border-2 relative ${getPlanColor(plan.type)} ${
                    plan.recommended ? 'ring-2 ring-yellow-400/50 shadow-lg shadow-yellow-400/20' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-yellow-400 to-pink-400 text-black px-4 py-1 rounded-full text-sm font-bold">
                        MAIS POPULAR
                      </span>
                    </div>
                  )}

                  {plan.recommended && (
                    <div className="absolute -top-4 right-4">
                      <span className="bg-green-400 text-black px-3 py-1 rounded-full text-xs font-bold">
                        RECOMENDADO
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className={`text-2xl font-bold mb-2 ${getPlanTextColor(plan.type)}`}>
                      {plan.name}
                    </h3>
                    
                    <div className="mb-4">
                      <span className={`text-4xl font-bold ${getPlanTextColor(plan.type)}`}>
                        R$ {selectedBilling === 'monthly' 
                          ? plan.price_monthly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                          : plan.price_yearly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                        }
                      </span>
                      <span className="text-blue-400 text-lg">
                        /{selectedBilling === 'monthly' ? 'mês' : 'ano'}
                      </span>
                    </div>

                    {selectedBilling === 'yearly' && (
                      <p className="text-green-400 text-sm">
                        Economia de R$ {((plan.price_monthly * 12) - plan.price_yearly).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} por ano
                      </p>
                    )}
                  </div>

                  <div className="space-y-4 mb-8">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center">
                        <FiCheck className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                        <span className="text-blue-400">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-blue-300">Operações simultâneas:</span>
                      <span className={`font-bold ${getPlanTextColor(plan.type)}`}>
                        {plan.max_operations}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-blue-300">Exchanges:</span>
                      <span className={`font-bold ${getPlanTextColor(plan.type)}`}>
                        {plan.max_exchanges}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-blue-300">Análise AI:</span>
                      <span className={`font-bold ${plan.ai_analysis ? 'text-green-400' : 'text-red-400'}`}>
                        {plan.ai_analysis ? 'Sim' : 'Não'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={processingPayment === plan.id || data.current_subscription?.plan_type === plan.type}
                    className={`w-full py-3 px-6 rounded-lg font-bold transition-all duration-300 flex items-center justify-center ${
                      data.current_subscription?.plan_type === plan.type
                        ? 'bg-gray-400/20 text-gray-400 border border-gray-400/50 cursor-not-allowed'
                        : processingPayment === plan.id
                        ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50 cursor-not-allowed'
                        : `${getPlanColor(plan.type)} ${getPlanTextColor(plan.type)} border hover:opacity-80`
                    }`}
                  >
                    {processingPayment === plan.id ? (
                      <>
                        <FiRefreshCw className="w-5 h-5 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : data.current_subscription?.plan_type === plan.type ? (
                      <>
                        <FiCheck className="w-5 h-5 mr-2" />
                        Plano Atual
                      </>
                    ) : (
                      <>
                        {data.current_subscription ? 'Mudar para este Plano' : 'Assinar Agora'}
                        <FiArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>

            {/* Informações Adicionais */}
            <div className="mt-12 bg-black/80 backdrop-blur-sm rounded-xl p-6 border border-blue-400/30">
              <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center">
                <FiInfo className="w-6 h-6 mr-3" />
                Informações Importantes
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-yellow-400 font-bold mb-2">Política de Cancelamento</h4>
                  <ul className="text-blue-300 text-sm space-y-1">
                    <li>• Cancele a qualquer momento</li>
                    <li>• Acesso mantido até o fim do período</li>
                    <li>• Sem taxas de cancelamento</li>
                    <li>• Reembolso proporcional disponível</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-yellow-400 font-bold mb-2">Métodos de Pagamento</h4>
                  <ul className="text-blue-300 text-sm space-y-1">
                    <li>• Cartão de crédito (Visa, Master, Elo)</li>
                    <li>• PIX (processamento instantâneo)</li>
                    <li>• Boleto bancário</li>
                    <li>• PayPal internacional</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
                <p className="text-yellow-400 text-sm flex items-center">
                  <FiShield className="w-4 h-4 mr-2" />
                  <strong>Garantia de 7 dias:</strong> Teste sem riscos. Se não ficar satisfeito, devolvemos 100% do seu dinheiro.
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default UserPlans;
