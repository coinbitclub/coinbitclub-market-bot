import React, { useState, useEffect } from 'react';
import {
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiActivity,
  FiClock,
  FiCheckCircle,
  FiPlus,
  FiAlertCircle,
  FiBarChart,
  FiUsers,
  FiLink,
  FiCopy,
  FiEye
} from 'react-icons/fi';

interface User {
  id: string;
  name: string;
  email: string;
  user_type: string;
}

interface AffiliateDashboardProps {
  user: User;
}

interface AffiliateData {
  affiliateCode: string;
  affiliateLink: string;
  totalReferrals: number;
  activeReferrals: number;
  totalCommissions: number;
  pendingCommissions: number;
  paidCommissions: number;
  monthlyCommissions: number;
}

interface UserBalance {
  prepaidBalance: number;
  exchangeBalance: {
    binance: { testnet: number; production: number; };
    bybit: { testnet: number; production: number; };
  };
  totalProfit: number;
  totalLoss: number;
}

interface Operation {
  id: string;
  symbol: string;
  type: 'LONG' | 'SHORT';
  status: 'ACTIVE' | 'CLOSED';
  exchange: string;
  environment: 'TESTNET' | 'PRODUCTION';
  amount: number;
  profit: number;
  date: string;
}

interface UserMetrics {
  dailyAccuracy: number;
  historicalAccuracy: number;
  dailyReturn: number;
  historicalReturn: number;
  totalOperations: number;
  activeOperations: number;
}

interface Referral {
  id: string;
  name: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE';
  plan: string;
  commission: number;
  joinDate: string;
}

const AffiliateDashboard: React.FC<AffiliateDashboardProps> = ({ user }) => {
  const [affiliateData, setAffiliateData] = useState<AffiliateData>({
    affiliateCode: 'CBC123456',
    affiliateLink: 'https://coinbitclub.com/ref/CBC123456',
    totalReferrals: 12,
    activeReferrals: 8,
    totalCommissions: 1250.00,
    pendingCommissions: 340.50,
    paidCommissions: 909.50,
    monthlyCommissions: 445.20
  });

  const [balance, setBalance] = useState<UserBalance>({
    prepaidBalance: 280.00,
    exchangeBalance: {
      binance: { testnet: 1500.00, production: 250.00 },
      bybit: { testnet: 800.00, production: 150.00 }
    },
    totalProfit: 567.80,
    totalLoss: -89.20
  });

  const [metrics, setMetrics] = useState<UserMetrics>({
    dailyAccuracy: 85.2,
    historicalAccuracy: 79.4,
    dailyReturn: 4.1,
    historicalReturn: 22.8,
    totalOperations: 324,
    activeOperations: 5
  });

  const [operations, setOperations] = useState<Operation[]>([
    {
      id: '1',
      symbol: 'BTC/USDT',
      type: 'LONG',
      status: 'ACTIVE',
      exchange: 'Binance',
      environment: 'PRODUCTION',
      amount: 200,
      profit: 24.60,
      date: '2025-01-25 10:30'
    },
    {
      id: '2',
      symbol: 'ETH/USDT',
      type: 'SHORT',
      status: 'ACTIVE',
      exchange: 'Bybit',
      environment: 'PRODUCTION',
      amount: 150,
      profit: -8.40,
      date: '2025-01-25 10:15'
    }
  ]);

  const [referrals, setReferrals] = useState<Referral[]>([
    {
      id: '1',
      name: 'João Silva',
      email: 'joao@email.com',
      status: 'ACTIVE',
      plan: 'Premium',
      commission: 45.00,
      joinDate: '2025-01-20'
    },
    {
      id: '2',
      name: 'Maria Santos',
      email: 'maria@email.com',
      status: 'ACTIVE',
      plan: 'Basic',
      commission: 25.00,
      joinDate: '2025-01-18'
    },
    {
      id: '3',
      name: 'Pedro Costa',
      email: 'pedro@email.com',
      status: 'INACTIVE',
      plan: 'Basic',
      commission: 0.00,
      joinDate: '2025-01-15'
    }
  ]);

  const [aiReport, setAiReport] = useState({
    lastUpdate: '10:00',
    summary: 'Mercado favorável para estratégias de afiliados. Período ideal para captação.',
    confidence: 82,
    nextUpdate: '14:00'
  });

  const [showAddBalance, setShowAddBalance] = useState(false);
  const [addBalanceAmount, setAddBalanceAmount] = useState('');
  const [showCommissionRequest, setShowCommissionRequest] = useState(false);

  const isLowBalance = balance.prepaidBalance < 60;
  const totalActiveProfit = operations
    .filter(op => op.status === 'ACTIVE')
    .reduce((sum, op) => sum + op.profit, 0);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Aqui você poderia adicionar uma notificação de sucesso
  };

  const handleAddBalance = () => {
    const amount = parseFloat(addBalanceAmount);
    if (amount > 0) {
      setBalance(prev => ({
        ...prev,
        prepaidBalance: prev.prepaidBalance + amount
      }));
      setAddBalanceAmount('');
      setShowAddBalance(false);
    }
  };

  const handleCommissionRequest = () => {
    // Lógica para solicitar saque de comissões
    setShowCommissionRequest(false);
    // Aqui você faria a requisição para o backend
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Olá, {user.name}!
            </h1>
            <p className="text-gray-600">Área do Afiliado - CoinBitClub</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Código de Afiliado:</p>
            <div className="flex items-center space-x-2">
              <p className="text-lg font-semibold text-blue-600">{affiliateData.affiliateCode}</p>
              <button
                onClick={() => copyToClipboard(affiliateData.affiliateCode)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <FiCopy className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Link de Afiliado em Destaque */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-2">🔗 Seu Link de Afiliado</h2>
            <div className="bg-white bg-opacity-20 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2">
                <FiLink className="h-5 w-5" />
                <span className="text-sm font-mono break-all">{affiliateData.affiliateLink}</span>
                <button
                  onClick={() => copyToClipboard(affiliateData.affiliateLink)}
                  className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                >
                  <FiCopy className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="text-blue-100 text-sm">
              Compartilhe este link para ganhar comissões por cada indicação!
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{affiliateData.totalReferrals}</div>
            <div className="text-blue-200">Indicações</div>
          </div>
        </div>
      </div>

      {/* Alerta de Saldo Baixo */}
      {isLowBalance && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <FiAlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Saldo Baixo Detectado
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                Seu saldo está baixo (R$ {balance.prepaidBalance.toFixed(2)}). 
                O robô precisa de um saldo mínimo de R$ 60,00 para abrir novas operações.
              </p>
              <button
                onClick={() => setShowAddBalance(true)}
                className="mt-2 text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded-md hover:bg-yellow-200"
              >
                Adicionar Saldo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Métricas de Comissões */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiUsers className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Indicados Ativos</dt>
                  <dd className="text-lg font-medium text-gray-900">{affiliateData.activeReferrals}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-gray-500">Total: </span>
              <span className="text-blue-600 font-medium">{affiliateData.totalReferrals}</span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiDollarSign className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Comissões Pendentes</dt>
                  <dd className="text-lg font-medium text-gray-900">R$ {affiliateData.pendingCommissions.toFixed(2)}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <button
              onClick={() => setShowCommissionRequest(true)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Solicitar Saque
            </button>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiTrendingUp className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Comissões do Mês</dt>
                  <dd className="text-lg font-medium text-gray-900">R$ {affiliateData.monthlyCommissions.toFixed(2)}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-green-600 font-medium">+15.8%</span>
              <span className="text-gray-500"> vs mês anterior</span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiCheckCircle className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Pago</dt>
                  <dd className="text-lg font-medium text-gray-900">R$ {affiliateData.paidCommissions.toFixed(2)}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-gray-500">Total: </span>
              <span className="text-green-600 font-medium">R$ {affiliateData.totalCommissions.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas de Performance Pessoal */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiBarChart className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Assertividade Hoje</dt>
                  <dd className="text-lg font-medium text-gray-900">{metrics.dailyAccuracy}%</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-gray-500">Histórica: </span>
              <span className="text-green-600 font-medium">{metrics.historicalAccuracy}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiTrendingUp className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Retorno Hoje</dt>
                  <dd className="text-lg font-medium text-gray-900">+{metrics.dailyReturn}%</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-gray-500">Histórico: </span>
              <span className="text-green-600 font-medium">+{metrics.historicalReturn}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiActivity className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Operações</dt>
                  <dd className="text-lg font-medium text-gray-900">{metrics.totalOperations}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-blue-600 font-medium">{metrics.activeOperations}</span>
              <span className="text-gray-500"> ativas</span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiDollarSign className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">P&L Total</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    R$ {(balance.totalProfit + balance.totalLoss).toFixed(2)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-green-600 font-medium">+R$ {balance.totalProfit.toFixed(2)}</span>
              <span className="text-gray-500"> / </span>
              <span className="text-red-600 font-medium">R$ {balance.totalLoss.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Indicados Recentes */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">👥 Seus Indicados</h2>
          <button className="text-blue-600 hover:text-blue-700 text-sm">
            Ver Todos
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plano
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comissão
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {referrals.map((referral) => (
                <tr key={referral.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {referral.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {referral.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {referral.plan}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      referral.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {referral.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    R$ {referral.commission.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(referral.joinDate).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modais */}
      {showAddBalance && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Adicionar Saldo Pré-pago</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Valor (R$)
                </label>
                <input
                  type="number"
                  value={addBalanceAmount}
                  onChange={(e) => setAddBalanceAmount(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="0.00"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleAddBalance}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Adicionar
                </button>
                <button
                  onClick={() => setShowAddBalance(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCommissionRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Solicitar Saque de Comissões</h3>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  Valor disponível para saque:
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  R$ {affiliateData.pendingCommissions.toFixed(2)}
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleCommissionRequest}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Solicitar Saque
                </button>
                <button
                  onClick={() => setShowCommissionRequest(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AffiliateDashboard;


