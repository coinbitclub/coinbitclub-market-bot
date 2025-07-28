import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { 
  User, TrendingUp, DollarSign, Activity, Clock, AlertTriangle, 
  Eye, Settings, CreditCard, BarChart3, Users, Percent,
  Plus, ExternalLink, Bell, Shield, Zap
} from 'lucide-react';

// Componentes básicos
const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, className = '', disabled = false }: { 
  children: React.ReactNode, 
  onClick?: () => void, 
  className?: string,
  disabled?: boolean 
}) => (
  <button 
    onClick={onClick} 
    disabled={disabled}
    className={`px-4 py-2 rounded-md font-medium transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
  >
    {children}
  </button>
);

interface UserData {
  id: string;
  name: string;
  email: string;
  country: string;
  role: 'user' | 'affiliate';
  status: string;
  planType: string;
  trialEndsAt?: string;
}

interface DashboardMetrics {
  // Saldos
  prepaidBalance: number;
  binanceBalance: number;
  bybitBalance: number;
  
  // Performance
  dayReturn: number;
  historicalReturn: number;
  dayAccuracy: number;
  historicalAccuracy: number;
  
  // Operações
  activeOperations: number;
  totalOperations: number;
  
  // Específico para afiliados
  totalCommissions?: number;
  pendingCommissions?: number;
  referredUsers?: number;
}

interface Operation {
  id: string;
  symbol: string;
  signal: 'LONG' | 'SHORT';
  return: number;
  exchange: 'binance' | 'bybit';
  environment: 'testnet' | 'production';
  date: string;
  status: 'open' | 'closed';
}

interface AffiliateData {
  referredUsers: Array<{
    id: string;
    name: string;
    email: string;
    status: 'active' | 'inactive';
    totalProfit: number;
    commission: number;
    joinedAt: string;
  }>;
  commissions: {
    total: number;
    paid: number;
    pending: number;
  };
  performance: {
    ranking: number;
    totalReferrals: number;
  };
}

const UserDashboard: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [affiliateData, setAffiliateData] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('operations');
  const [showLowBalanceAlert, setShowLowBalanceAlert] = useState(false);

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    try {
      // Verificar usuário logado
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        router.push('/auth/login');
        return;
      }

      const userData = JSON.parse(userStr);
      setUser(userData);

      // Carregar dados do dashboard
      await loadDashboardData(userData);
      
      // Se for afiliado, carregar dados específicos
      if (userData.role === 'affiliate' || router.query.type === 'affiliate') {
        await loadAffiliateData(userData.id);
      }
    } catch (error) {
      console.error('Erro ao inicializar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async (userData: UserData) => {
    try {
      // Simular dados para desenvolvimento
      const mockMetrics: DashboardMetrics = {
        prepaidBalance: 150.00,
        binanceBalance: 1250.00,
        bybitBalance: 850.00,
        dayReturn: 2.3,
        historicalReturn: 15.7,
        dayAccuracy: 68.5,
        historicalAccuracy: 72.1,
        activeOperations: 2,
        totalOperations: 45,
        totalCommissions: userData.role === 'affiliate' ? 320.50 : undefined,
        pendingCommissions: userData.role === 'affiliate' ? 125.30 : undefined,
        referredUsers: userData.role === 'affiliate' ? 8 : undefined
      };

      const mockOperations: Operation[] = [
        {
          id: '1',
          symbol: 'BTCUSDT',
          signal: 'LONG',
          return: 2.1,
          exchange: 'binance',
          environment: 'production',
          date: new Date().toISOString(),
          status: 'open'
        },
        {
          id: '2',
          symbol: 'ETHUSDT',
          signal: 'SHORT',
          return: -0.8,
          exchange: 'bybit',
          environment: 'testnet',
          date: new Date(Date.now() - 3600000).toISOString(),
          status: 'closed'
        }
      ];

      setMetrics(mockMetrics);
      setOperations(mockOperations);

      // Verificar saldo baixo
      const minBalance = userData.country === 'Brasil' ? 60 : 30;
      if (mockMetrics.prepaidBalance < minBalance) {
        setShowLowBalanceAlert(true);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const loadAffiliateData = async (userId: string) => {
    try {
      // Simular dados de afiliado
      const mockAffiliateData: AffiliateData = {
        referredUsers: [
          {
            id: '1',
            name: 'João Silva',
            email: 'joao@email.com',
            status: 'active',
            totalProfit: 450.30,
            commission: 6.75,
            joinedAt: '2024-01-15'
          },
          {
            id: '2',
            name: 'Maria Santos',
            email: 'maria@email.com',
            status: 'active',
            totalProfit: 280.50,
            commission: 4.21,
            joinedAt: '2024-02-20'
          }
        ],
        commissions: {
          total: 320.50,
          paid: 195.20,
          pending: 125.30
        },
        performance: {
          ranking: 15,
          totalReferrals: 8
        }
      };

      setAffiliateData(mockAffiliateData);
    } catch (error) {
      console.error('Erro ao carregar dados de afiliado:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !metrics) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Erro ao carregar dashboard
          </h2>
          <Button 
            onClick={() => router.push('/auth/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }

  const isAffiliate = user.role === 'affiliate' || router.query.type === 'affiliate';
  const minBalance = user.country === 'Brasil' ? 60 : 30;
  const currency = user.country === 'Brasil' ? 'R$' : 'USD';

  return (
    <>
      <Head>
        <title>Dashboard - CoinBitClub MarketBot</title>
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  ⚡ CoinBitClub MarketBot
                </h1>
                {isAffiliate && (
                  <span className="ml-3 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                    💰 Afiliado
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Olá, {user.name}
                </span>
                <Button 
                  onClick={() => router.push('/auth/login')}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Sair
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8">
              {['operations', 'plans', 'settings'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab === 'operations' && 'Operações'}
                  {tab === 'plans' && 'Planos'}
                  {tab === 'settings' && 'Configurações'}
                </button>
              ))}
              
              {isAffiliate && (
                <>
                  <button
                    onClick={() => setActiveTab('referrals')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'referrals'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Gestão de Indicados
                  </button>
                  <button
                    onClick={() => setActiveTab('commissions')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'commissions'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Comissões
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Alerts */}
          {showLowBalanceAlert && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Saldo Baixo Detectado
                  </h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    Seu saldo pré-pago está abaixo do mínimo ({currency}{minBalance}). 
                    O robô só abre novas operações com saldo mínimo disponível.
                  </p>
                  <div className="mt-2">
                    <Button 
                      className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm"
                      onClick={() => setActiveTab('plans')}
                    >
                      Adicionar Saldo
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content based on active tab */}
          {activeTab === 'operations' && (
            <div className="space-y-6">
              {/* Dashboard Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Relatório IA */}
                <Card className="p-6">
                  <div className="flex items-center">
                    <Zap className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Relatório IA 4h</p>
                      <p className="text-2xl font-semibold text-gray-900">LONG</p>
                      <p className="text-xs text-green-600">Tendência de alta detectada</p>
                    </div>
                  </div>
                </Card>

                {/* Assertividade Dia */}
                <Card className="p-6">
                  <div className="flex items-center">
                    <Percent className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Assertividade Dia</p>
                      <p className="text-2xl font-semibold text-gray-900">{metrics.dayAccuracy}%</p>
                      <p className="text-xs text-gray-500">Histórica: {metrics.historicalAccuracy}%</p>
                    </div>
                  </div>
                </Card>

                {/* Retorno Dia */}
                <Card className="p-6">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Retorno Dia</p>
                      <p className="text-2xl font-semibold text-gray-900">{metrics.dayReturn}%</p>
                      <p className="text-xs text-gray-500">Histórico: {metrics.historicalReturn}%</p>
                    </div>
                  </div>
                </Card>

                {/* Saldo Pré-pago */}
                <Card className="p-6">
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-yellow-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Saldo Pré-pago</p>
                      <p className="text-2xl font-semibold text-gray-900">{formatCurrency(metrics.prepaidBalance)}</p>
                      <Button 
                        className="mt-1 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => setActiveTab('plans')}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Exchange Balances */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Saldos Exchange</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Binance (Produção)</span>
                      <span className="font-medium">{formatCurrency(metrics.binanceBalance)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Bybit (Testnet)</span>
                      <span className="font-medium">{formatCurrency(metrics.bybitBalance)}</span>
                    </div>
                  </div>
                </Card>

                {/* Migration Notice */}
                <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    🚀 Migração para Conta Paga
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Migre da conta gratuita (testnet) para a conta paga e comece a operar com dinheiro real.
                  </p>
                  <Button 
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                    onClick={() => setActiveTab('plans')}
                  >
                    Migrar Agora
                  </Button>
                </Card>
              </div>

              {/* Operations */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Operações em Andamento ({metrics.activeOperations})
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Moeda</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sinal</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Retorno</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exchange</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ambiente</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {operations.map((operation) => (
                        <tr key={operation.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {operation.symbol}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              operation.signal === 'LONG' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {operation.signal}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className={operation.return >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {operation.return >= 0 ? '+' : ''}{operation.return}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {operation.exchange}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              operation.environment === 'production' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {operation.environment}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(operation.date)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* Outras abas do conteúdo */}
          {activeTab === 'plans' && (
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Planos Disponíveis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border rounded-lg p-6">
                    <h4 className="text-xl font-semibold mb-2">Plano Mensal</h4>
                    <p className="text-gray-600 mb-4">R$ 200/mês + 10% sobre lucros</p>
                    <ul className="text-sm text-gray-600 mb-4">
                      <li>• Comissão reduzida de 10%</li>
                      <li>• Cobrança apenas sobre lucros</li>
                      <li>• Suporte prioritário</li>
                    </ul>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      Assinar Plano
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg p-6">
                    <h4 className="text-xl font-semibold mb-2">Plano Pré-pago</h4>
                    <p className="text-gray-600 mb-4">20% sobre lucros (sem mensalidade)</p>
                    <ul className="text-sm text-gray-600 mb-4">
                      <li>• Sem cobrança mensal</li>
                      <li>• 20% sobre lucros apenas</li>
                      <li>• Flexibilidade total</li>
                    </ul>
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                      Escolher Plano
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Outras implementações de abas... */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações</h3>
                <p className="text-gray-600">Página de configurações em desenvolvimento...</p>
              </Card>
            </div>
          )}

          {/* Afiliado específico */}
          {isAffiliate && activeTab === 'referrals' && (
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Gestão de Indicados</h3>
                <p className="text-gray-600">Página de indicados em desenvolvimento...</p>
              </Card>
            </div>
          )}

          {isAffiliate && activeTab === 'commissions' && (
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Comissões</h3>
                <p className="text-gray-600">Página de comissões em desenvolvimento...</p>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UserDashboard;
