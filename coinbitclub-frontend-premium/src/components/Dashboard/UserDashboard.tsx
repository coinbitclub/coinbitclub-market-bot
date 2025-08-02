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
  FiBarChart
} from 'react-icons/fi';

interface User {
  id: string;
  name: string;
  email: string;
  user_type: string;
}

interface UserDashboardProps {
  user: User;
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

const UserDashboard: React.FC<UserDashboardProps> = ({ user }) => {
  const [balance, setBalance] = useState<UserBalance>({
    prepaidBalance: 150.00,
    exchangeBalance: {
      binance: { testnet: 1000.00, production: 0.00 },
      bybit: { testnet: 500.00, production: 0.00 }
    },
    totalProfit: 234.50,
    totalLoss: -45.20
  });

  const [metrics, setMetrics] = useState<UserMetrics>({
    dailyAccuracy: 82.5,
    historicalAccuracy: 76.8,
    dailyReturn: 3.2,
    historicalReturn: 18.4,
    totalOperations: 156,
    activeOperations: 3
  });

  const [operations, setOperations] = useState<Operation[]>([
    {
      id: '1',
      symbol: 'BTC/USDT',
      type: 'LONG',
      status: 'ACTIVE',
      exchange: 'Binance',
      environment: 'TESTNET',
      amount: 100,
      profit: 12.30,
      date: '2025-01-25 10:30'
    },
    {
      id: '2',
      symbol: 'ETH/USDT',
      type: 'SHORT',
      status: 'ACTIVE',
      exchange: 'Bybit',
      environment: 'TESTNET',
      amount: 75,
      profit: -3.40,
      date: '2025-01-25 10:15'
    },
    {
      id: '3',
      symbol: 'ADA/USDT',
      type: 'LONG',
      status: 'CLOSED',
      exchange: 'Binance',
      environment: 'TESTNET',
      amount: 50,
      profit: 8.90,
      date: '2025-01-25 09:45'
    }
  ]);

  const [aiReport, setAiReport] = useState({
    lastUpdate: '10:00',
    summary: 'Mercado em tendência de alta. Estratégia conservadora recomendada para seu perfil.',
    confidence: 78,
    nextUpdate: '14:00'
  });

  const [showAddBalance, setShowAddBalance] = useState(false);
  const [addBalanceAmount, setAddBalanceAmount] = useState('');

  const isLowBalance = balance.prepaidBalance < 60;
  const totalActiveProfit = operations
    .filter(op => op.status === 'ACTIVE')
    .reduce((sum, op) => sum + op.profit, 0);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Olá, {user.name}!
            </h1>
            <p className="text-gray-600">Área do Usuário - CoinBitClub</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Conta:</p>
            <p className="text-lg font-semibold text-blue-600">Testnet</p>
            <p className="text-xs text-gray-500">
              Migração automática após assinatura
            </p>
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

      {/* Modal Adicionar Saldo */}
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

      {/* Métricas de Performance */}
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

      {/* Saldos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">💳 Saldo Pré-pago</h2>
            <button
              onClick={() => setShowAddBalance(true)}
              className="flex items-center text-blue-600 hover:text-blue-700"
            >
              <FiPlus className="h-4 w-4 mr-1" />
              Adicionar
            </button>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            R$ {balance.prepaidBalance.toFixed(2)}
          </div>
          {isLowBalance && (
            <p className="text-sm text-yellow-600">
              ⚠️ Saldo abaixo do mínimo recomendado
            </p>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 Saldos Exchange</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Binance (Testnet)</span>
              <span className="font-medium">$ {balance.exchangeBalance.binance.testnet.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Bybit (Testnet)</span>
              <span className="font-medium">$ {balance.exchangeBalance.bybit.testnet.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between items-center font-semibold">
                <span className="text-sm text-gray-900">Total Disponível</span>
                <span>$ {(balance.exchangeBalance.binance.testnet + balance.exchangeBalance.bybit.testnet).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Relatório IA */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">🤖 Relatório IA - 4h</h2>
          <span className="text-sm text-gray-500">Próxima atualização: {aiReport.nextUpdate}</span>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <FiActivity className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800">{aiReport.summary}</p>
              <div className="mt-2 flex items-center">
                <span className="text-xs text-blue-600">Confiança: {aiReport.confidence}%</span>
                <span className="ml-4 text-xs text-blue-500">Atualizado às {aiReport.lastUpdate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Operações */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">📈 Suas Operações</h2>
        
        {/* Resumo das operações ativas */}
        {operations.filter(op => op.status === 'ACTIVE').length > 0 && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Operações Ativas</h3>
            <div className="text-2xl font-bold text-blue-900">
              {totalActiveProfit >= 0 ? '+' : ''}R$ {totalActiveProfit.toFixed(2)}
            </div>
            <p className="text-sm text-blue-700">
              {operations.filter(op => op.status === 'ACTIVE').length} operação(ões) em andamento
            </p>
          </div>
        )}

        {/* Tabela de operações */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Par
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Exchange
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ambiente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  P&L
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {operations.map((operation) => (
                <tr key={operation.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {operation.symbol}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      operation.type === 'LONG' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {operation.type === 'LONG' ? <FiTrendingUp className="mr-1 h-3 w-3" /> : <FiTrendingDown className="mr-1 h-3 w-3" />}
                      {operation.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {operation.exchange}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      operation.environment === 'TESTNET' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {operation.environment}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    R$ {operation.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={operation.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {operation.profit >= 0 ? '+' : ''}R$ {operation.profit.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      operation.status === 'ACTIVE' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {operation.status === 'ACTIVE' ? <FiClock className="mr-1 h-3 w-3" /> : <FiCheckCircle className="mr-1 h-3 w-3" />}
                      {operation.status === 'ACTIVE' ? 'Ativa' : 'Fechada'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;


