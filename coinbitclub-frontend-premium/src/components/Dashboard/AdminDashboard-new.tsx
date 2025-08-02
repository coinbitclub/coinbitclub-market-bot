import React, { useState, useEffect } from 'react';
import {
  FiTrendingUp,
  FiTrendingDown,
  FiActivity,
  FiUsers,
  FiDollarSign,
  FiBarChart,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiRefreshCw
} from 'react-icons/fi';

interface User {
  id: string;
  name: string;
  email: string;
  user_type: string;
}

interface AdminDashboardProps {
  user: User;
}

interface MarketData {
  direction: 'LONG' | 'SHORT' | 'NEUTRO';
  justification: string;
  lastUpdate: string;
  signals: {
    constant: { value: string; time: string; }[];
    tradingView: { value: string; time: string; }[];
  };
}

interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  testAccountUsers: number;
  productionUsers: number;
  dailyAccuracy: number;
  historicalAccuracy: number;
  dailyReturn: number;
  historicalReturn: number;
}

interface Operation {
  id: string;
  symbol: string;
  type: 'LONG' | 'SHORT';
  status: 'ACTIVE' | 'CLOSED';
  exchange: string;
  amount: number;
  profit: number;
  startTime: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [marketData, setMarketData] = useState<MarketData>({
    direction: 'LONG',
    justification: 'Análise técnica indicando rompimento de resistência no BTC/USDT com volume consistente.',
    lastUpdate: new Date().toLocaleString('pt-BR'),
    signals: {
      constant: [
        { value: 'COMPRA', time: '10:30' },
        { value: 'COMPRA', time: '10:25' },
        { value: 'VENDA', time: '10:20' }
      ],
      tradingView: [
        { value: 'COMPRA FORTE', time: '10:35' },
        { value: 'COMPRA', time: '10:30' },
        { value: 'NEUTRO', time: '10:25' }
      ]
    }
  });

  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalUsers: 1247,
    activeUsers: 892,
    newUsersToday: 23,
    testAccountUsers: 456,
    productionUsers: 436,
    dailyAccuracy: 78.5,
    historicalAccuracy: 73.2,
    dailyReturn: 2.4,
    historicalReturn: 15.7
  });

  const [operations, setOperations] = useState<Operation[]>([
    {
      id: '1',
      symbol: 'BTC/USDT',
      type: 'LONG',
      status: 'ACTIVE',
      exchange: 'Binance',
      amount: 1000,
      profit: 45.50,
      startTime: '10:30'
    },
    {
      id: '2',
      symbol: 'ETH/USDT',
      type: 'SHORT',
      status: 'ACTIVE',
      exchange: 'Bybit',
      amount: 500,
      profit: -12.30,
      startTime: '10:25'
    },
    {
      id: '3',
      symbol: 'ADA/USDT',
      type: 'LONG',
      status: 'CLOSED',
      exchange: 'Binance',
      amount: 750,
      profit: 67.80,
      startTime: '09:45'
    }
  ]);

  const [microservicesStatus] = useState({
    signalIngestor: { status: 'online', lastUpdate: '10:35' },
    signalProcessor: { status: 'online', lastUpdate: '10:35' },
    decisionEngine: { status: 'online', lastUpdate: '10:34' },
    orderExecutor: { status: 'online', lastUpdate: '10:35' }
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMarketData(prev => ({
        ...prev,
        lastUpdate: new Date().toLocaleString('pt-BR')
      }));

      setOperations(prev => prev.map(op => 
        op.status === 'ACTIVE' ? {
          ...op,
          profit: op.profit + (Math.random() - 0.5) * 10
        } : op
      ));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case 'LONG': return 'text-green-600 bg-green-100';
      case 'SHORT': return 'text-red-600 bg-red-100';
      case 'NEUTRO': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <FiCheckCircle className="h-4 w-4 text-green-500" />;
      case 'offline': return <FiXCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <FiAlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <FiActivity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen p-4">
      {/* Header com informações do usuário */}
      <div className="bg-white shadow-xl rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              🎯 Bem-vindo, {user.name}
            </h1>
            <p className="text-xl text-gray-600">Dashboard Administrativo - CoinBitClub</p>
            <div className="mt-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium inline-block">
              ✅ Sistema Online e Funcionando
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Última atualização</p>
              <p className="text-lg font-medium">{marketData.lastUpdate}</p>
            </div>
            <button className="p-3 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full">
              <FiRefreshCw className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Leitura do Mercado */}
      <div className="bg-white shadow-xl rounded-lg p-6 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">📊 Leitura do Mercado</h2>
        
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <p className="text-blue-800 font-bold text-lg">🚀 Sistema funcionando corretamente!</p>
          <p className="text-blue-600">Dados em tempo real sendo processados e analisados...</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4 bg-gray-50 p-6 rounded-lg border">
            <div>
              <h3 className="text-lg font-bold text-gray-700 mb-4">Direção Atual</h3>
              <div className="flex items-center mb-4">
                <span className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-bold ${getDirectionColor(marketData.direction)}`}>
                  {marketData.direction === 'LONG' && <FiTrendingUp className="mr-2 h-5 w-5" />}
                  {marketData.direction === 'SHORT' && <FiTrendingDown className="mr-2 h-5 w-5" />}
                  {marketData.direction === 'NEUTRO' && <FiActivity className="mr-2 h-5 w-5" />}
                  {marketData.direction}
                </span>
              </div>
              <p className="text-gray-700 bg-white p-3 rounded border">{marketData.justification}</p>
            </div>
          </div>
          
          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <h3 className="text-lg font-bold text-green-800 mb-4">📈 Sinais Constantes</h3>
            <div className="space-y-3">
              {marketData.signals.constant.map((signal, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                  <span className="text-green-900 font-bold">{signal.value}</span>
                  <span className="text-green-600 font-medium">{signal.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
            <h3 className="text-lg font-bold text-purple-800 mb-4">📊 Sinais TradingView</h3>
            <div className="space-y-3">
              {marketData.signals.tradingView.map((signal, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                  <span className="text-purple-900 font-bold">{signal.value}</span>
                  <span className="text-purple-600 font-medium">{signal.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Métricas do Sistema */}
      <div className="bg-white shadow-xl rounded-lg p-6 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">📈 Métricas do Sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1 - Total de Usuários */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total de Usuários</p>
                <p className="text-3xl font-bold">{metrics.totalUsers.toLocaleString()}</p>
              </div>
              <FiUsers className="h-8 w-8 text-blue-200" />
            </div>
            <div className="mt-4 text-blue-100 text-sm">
              <span className="text-green-300 font-medium">+{metrics.newUsersToday}</span> hoje
            </div>
          </div>

          {/* Card 2 - Usuários Ativos */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Usuários Ativos</p>
                <p className="text-3xl font-bold">{metrics.activeUsers}</p>
              </div>
              <FiActivity className="h-8 w-8 text-green-200" />
            </div>
            <div className="mt-4 text-green-100 text-sm">
              <span className="text-yellow-300 font-medium">{metrics.testAccountUsers}</span> teste • <span className="text-green-300 font-medium">{metrics.productionUsers}</span> produção
            </div>
          </div>

          {/* Card 3 - Precisão Diária */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Precisão Diária</p>
                <p className="text-3xl font-bold">{metrics.dailyAccuracy}%</p>
              </div>
              <FiBarChart className="h-8 w-8 text-purple-200" />
            </div>
            <div className="mt-4 text-purple-100 text-sm">
              Histórico: <span className="text-purple-300 font-medium">{metrics.historicalAccuracy}%</span>
            </div>
          </div>

          {/* Card 4 - Retorno Diário */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Retorno Diário</p>
                <p className="text-3xl font-bold">{metrics.dailyReturn}%</p>
              </div>
              <FiDollarSign className="h-8 w-8 text-orange-200" />
            </div>
            <div className="mt-4 text-orange-100 text-sm">
              Histórico: <span className="text-orange-300 font-medium">{metrics.historicalReturn}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status dos Microserviços */}
      <div className="bg-white shadow-xl rounded-lg p-6 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">🔧 Status dos Microserviços</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(microservicesStatus).map(([service, data]) => (
            <div key={service} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900 capitalize">
                  {service.replace(/([A-Z])/g, ' $1').trim()}
                </h3>
                {getStatusIcon(data.status)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Última atualização: {data.lastUpdate}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Operações Ativas */}
      <div className="bg-white shadow-xl rounded-lg p-6 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">⚡ Operações em Tempo Real</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Símbolo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Exchange
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hora
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {operations.map((operation) => (
                <tr key={operation.id} className="hover:bg-gray-50">
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {operation.exchange}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${operation.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={operation.profit >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                      {operation.profit >= 0 ? '+' : ''}${operation.profit.toFixed(2)}
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {operation.startTime}
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

export default AdminDashboard;


