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

  // Removido o useEffect problemático que causava loops
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setMarketData(prev => ({
  //       ...prev,
  //       lastUpdate: new Date().toLocaleString('pt-BR')
  //     }));
  //     setOperations(prev => prev.map(op => 
  //       op.status === 'ACTIVE' ? {
  //         ...op,
  //         profit: op.profit + (Math.random() - 0.5) * 10
  //       } : op
  //     ));
  //   }, 30000);
  //   return () => clearInterval(interval);
  // }, []);

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
    <div className="space-y-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen p-6">
      {/* Header com informações do usuário */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 shadow-2xl rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              🎯 Bem-vindo, {user.name}
            </h1>
            <p className="text-xl text-blue-100 mb-4">Dashboard Administrativo - CoinBitClub</p>
            <div className="bg-green-400 text-green-900 px-4 py-2 rounded-full text-sm font-bold inline-flex items-center">
              <div className="h-2 w-2 bg-green-600 rounded-full mr-2 animate-pulse"></div>
              ✅ Sistema Online e Funcionando
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-right bg-white/10 backdrop-blur rounded-lg p-4">
              <p className="text-blue-100 text-sm">Última atualização</p>
              <p className="text-xl font-bold">{marketData.lastUpdate}</p>
            </div>
            <button className="p-4 bg-white/20 hover:bg-white/30 rounded-full transition-all duration-300 transform hover:scale-110">
              <FiRefreshCw className="h-8 w-8" />
            </button>
          </div>
        </div>
      </div>

      {/* Leitura do Mercado */}
      <div className="bg-white shadow-2xl rounded-2xl p-8 border-l-8 border-blue-500">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            📊 Leitura do Mercado
          </h2>
          <p className="text-gray-600">Análise em tempo real dos sinais de trading</p>
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl mb-8 border border-blue-200">
          <div className="flex items-center justify-center mb-4">
            <div className="h-4 w-4 bg-green-500 rounded-full mr-3 animate-pulse"></div>
            <p className="text-blue-800 font-bold text-xl">🚀 Sistema Operacional</p>
          </div>
          <p className="text-blue-700 text-center font-medium">
            Todos os sinais sendo processados em tempo real • IA ativa • Decisões automáticas
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Direção Atual */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-2xl border-2 border-gray-200 hover:border-gray-300 transition-all duration-300 transform hover:scale-105">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">🎯 Direção Atual</h3>
              <div className="flex justify-center mb-4">
                <span className={`inline-flex items-center px-6 py-3 rounded-full text-xl font-bold shadow-lg ${getDirectionColor(marketData.direction)}`}>
                  {marketData.direction === 'LONG' && <FiTrendingUp className="mr-3 h-6 w-6" />}
                  {marketData.direction === 'SHORT' && <FiTrendingDown className="mr-3 h-6 w-6" />}
                  {marketData.direction === 'NEUTRO' && <FiActivity className="mr-3 h-6 w-6" />}
                  {marketData.direction}
                </span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border shadow-sm">
              <p className="text-gray-700 font-medium leading-relaxed">{marketData.justification}</p>
            </div>
          </div>
          
          {/* Sinais Constantes */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-8 rounded-2xl border-2 border-green-200 hover:border-green-300 transition-all duration-300 transform hover:scale-105">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-green-800 mb-2">📈 Sinais Constantes</h3>
              <p className="text-green-600 text-sm">Algoritmos proprietários</p>
            </div>
            <div className="space-y-4">
              {marketData.signals.constant.map((signal, index) => (
                <div key={index} className="flex justify-between items-center p-4 bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow">
                  <span className="text-green-900 font-bold text-lg">{signal.value}</span>
                  <span className="text-green-600 font-semibold bg-green-100 px-3 py-1 rounded-full text-sm">{signal.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sinais TradingView */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-100 p-8 rounded-2xl border-2 border-purple-200 hover:border-purple-300 transition-all duration-300 transform hover:scale-105">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-purple-800 mb-2">📊 Sinais TradingView</h3>
              <p className="text-purple-600 text-sm">Análise técnica avançada</p>
            </div>
            <div className="space-y-4">
              {marketData.signals.tradingView.map((signal, index) => (
                <div key={index} className="flex justify-between items-center p-4 bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow">
                  <span className="text-purple-900 font-bold text-lg">{signal.value}</span>
                  <span className="text-purple-600 font-semibold bg-purple-100 px-3 py-1 rounded-full text-sm">{signal.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Métricas do Sistema */}
      <div className="bg-white shadow-2xl rounded-2xl p-8 border-l-8 border-green-500">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
            📈 Métricas do Sistema
          </h2>
          <p className="text-gray-600">Performance e estatísticas em tempo real</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Card 1 - Total de Usuários */}
          <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-2xl transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-blue-100 text-sm font-medium opacity-90">Total de Usuários</p>
                <p className="text-4xl font-black">{metrics.totalUsers.toLocaleString()}</p>
              </div>
              <div className="bg-white/20 p-4 rounded-xl">
                <FiUsers className="h-10 w-10" />
              </div>
            </div>
            <div className="flex items-center bg-white/10 rounded-lg p-3">
              <div className="h-2 w-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              <span className="text-green-300 font-bold">+{metrics.newUsersToday}</span>
              <span className="text-blue-100 ml-1">hoje</span>
            </div>
          </div>

          {/* Card 2 - Usuários Ativos */}
          <div className="bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700 rounded-2xl p-8 text-white shadow-2xl transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-green-100 text-sm font-medium opacity-90">Usuários Ativos</p>
                <p className="text-4xl font-black">{metrics.activeUsers}</p>
              </div>
              <div className="bg-white/20 p-4 rounded-xl">
                <FiActivity className="h-10 w-10" />
              </div>
            </div>
            <div className="flex items-center justify-between bg-white/10 rounded-lg p-3">
              <div className="flex items-center">
                <span className="text-yellow-300 font-bold">{metrics.testAccountUsers}</span>
                <span className="text-green-100 text-sm ml-1">teste</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-300 font-bold">{metrics.productionUsers}</span>
                <span className="text-green-100 text-sm ml-1">produção</span>
              </div>
            </div>
          </div>

          {/* Card 3 - Precisão Diária */}
          <div className="bg-gradient-to-br from-purple-500 via-violet-600 to-purple-700 rounded-2xl p-8 text-white shadow-2xl transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-purple-100 text-sm font-medium opacity-90">Precisão Diária</p>
                <p className="text-4xl font-black">{metrics.dailyAccuracy}%</p>
              </div>
              <div className="bg-white/20 p-4 rounded-xl">
                <FiBarChart className="h-10 w-10" />
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <span className="text-purple-100">Histórico: </span>
              <span className="text-purple-300 font-bold">{metrics.historicalAccuracy}%</span>
            </div>
          </div>

          {/* Card 4 - Retorno Diário */}
          <div className="bg-gradient-to-br from-orange-500 via-amber-600 to-yellow-600 rounded-2xl p-8 text-white shadow-2xl transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-orange-100 text-sm font-medium opacity-90">Retorno Diário</p>
                <p className="text-4xl font-black">+{metrics.dailyReturn}%</p>
              </div>
              <div className="bg-white/20 p-4 rounded-xl">
                <FiDollarSign className="h-10 w-10" />
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <span className="text-orange-100">Histórico: </span>
              <span className="text-yellow-300 font-bold">+{metrics.historicalReturn}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status dos Microserviços */}
      <div className="bg-white shadow-2xl rounded-2xl p-8 border-l-8 border-yellow-500">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-2">
            🔧 Status dos Microserviços
          </h2>
          <p className="text-gray-600">Monitoramento em tempo real da infraestrutura</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(microservicesStatus).map(([service, data]) => (
            <div key={service} className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl p-6 hover:border-green-300 transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 capitalize">
                  {service.replace(/([A-Z])/g, ' $1').trim()}
                </h3>
                <div className="bg-green-100 p-2 rounded-full">
                  {getStatusIcon(data.status)}
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-green-800 font-bold text-sm">ONLINE</span>
                  <span className="text-green-600 font-medium text-xs">{data.lastUpdate}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Operações Ativas */}
      <div className="bg-white shadow-2xl rounded-2xl p-8 border-l-8 border-purple-500">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            ⚡ Operações em Tempo Real
          </h2>
          <p className="text-gray-600">Trading automático e resultados ao vivo</p>
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b-2 border-purple-200">
                <th className="px-6 py-4 text-left text-sm font-bold text-purple-800 uppercase tracking-wider">
                  Símbolo
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-purple-800 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-purple-800 uppercase tracking-wider">
                  Exchange
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-purple-800 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-purple-800 uppercase tracking-wider">
                  P&L
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-purple-800 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-purple-800 uppercase tracking-wider">
                  Hora
                </th>
              </tr>
            </thead>
            <tbody className="space-y-2">
              {operations.map((operation, index) => (
                <tr key={operation.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-purple-25'} hover:bg-purple-100 transition-colors duration-200 border-b border-purple-100`}>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="font-bold text-lg text-gray-900">{operation.symbol}</div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-sm ${
                      operation.type === 'LONG' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {operation.type === 'LONG' ? <FiTrendingUp className="mr-2 h-4 w-4" /> : <FiTrendingDown className="mr-2 h-4 w-4" />}
                      {operation.type}
                    </span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="bg-gray-100 text-gray-800 px-3 py-1 rounded-lg text-sm font-medium">
                      {operation.exchange}
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="text-lg font-bold text-gray-900">${operation.amount.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className={`text-lg font-black px-3 py-1 rounded-lg ${operation.profit >= 0 ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}`}>
                      {operation.profit >= 0 ? '+' : ''}${operation.profit.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-sm ${
                      operation.status === 'ACTIVE' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      {operation.status === 'ACTIVE' ? <FiClock className="mr-2 h-4 w-4" /> : <FiCheckCircle className="mr-2 h-4 w-4" />}
                      {operation.status === 'ACTIVE' ? 'Ativa' : 'Fechada'}
                    </span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="bg-purple-100 text-purple-800 px-3 py-2 rounded-lg text-sm font-bold">
                      {operation.startTime}
                    </div>
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


