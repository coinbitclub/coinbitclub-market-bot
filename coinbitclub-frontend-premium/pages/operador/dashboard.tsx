import React, { useState, useEffect } from 'react';
import OperadorLayout from '../../src/components/Layout/OperadorLayout';
import RobotOperationTimeline from '../../src/components/trading/RobotOperationTimeline';
import CompactRobotStatus from '../../src/components/trading/CompactRobotStatus';
import { 
  FiTrendingUp, 
  FiActivity, 
  FiMonitor, 
  FiBarChart3,
  FiPlay,
  FiPause,
  FiStop,
  FiArrowUp,
  FiArrowDown,
  FiAlertCircle
} from 'react-icons/fi';

interface TradingData {
  active_operations: number;
  total_profit: number;
  win_rate: number;
  signals_today: number;
  exchanges_status: {
    binance: boolean;
    bybit: boolean;
    okx: boolean;
  };
  recent_operations: Array<{
    id: string;
    symbol: string;
    type: 'BUY' | 'SELL';
    amount: number;
    profit: number;
    status: 'open' | 'closed';
    timestamp: string;
  }>;
}

const OperadorDashboard: React.FC = () => {
  const [tradingData, setTradingData] = useState<TradingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiveMode, setIsLiveMode] = useState(false);

  useEffect(() => {
    loadTradingData();
    
    // Atualizar dados a cada 30 segundos
    const interval = setInterval(loadTradingData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadTradingData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/operador/dashboard');
      if (response.ok) {
        const data = await response.json();
        setTradingData(data);
      } else {
        // Dados mock para demonstração
        setTradingData({
          active_operations: 12,
          total_profit: 2845.75,
          win_rate: 73.5,
          signals_today: 47,
          exchanges_status: {
            binance: true,
            bybit: true,
            okx: false
          },
          recent_operations: [
            {
              id: 'OP001',
              symbol: 'BTCUSDT',
              type: 'BUY',
              amount: 0.1,
              profit: 125.50,
              status: 'closed',
              timestamp: '2024-01-15T10:30:00Z'
            },
            {
              id: 'OP002',
              symbol: 'ETHUSDT',
              type: 'SELL',
              amount: 2.5,
              profit: -45.20,
              status: 'closed',
              timestamp: '2024-01-15T10:25:00Z'
            },
            {
              id: 'OP003',
              symbol: 'ADAUSDT',
              type: 'BUY',
              amount: 1000,
              profit: 0,
              status: 'open',
              timestamp: '2024-01-15T10:20:00Z'
            }
          ]
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados de trading:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLiveMode = async () => {
    try {
      const action = isLiveMode ? 'stop' : 'start';
      const response = await fetch(`/api/operador/trading/${action}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setIsLiveMode(!isLiveMode);
      }
    } catch (error) {
      console.error('Erro ao alterar modo de trading:', error);
    }
  };

  if (loading) {
    return (
      <OperadorLayout title="Dashboard Operador">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
        </div>
      </OperadorLayout>
    );
  }

  return (
    <OperadorLayout title="Dashboard Operador">
      <div className="space-y-6">
        {/* Timeline do Robô */}
        <div className="mb-8">
          <RobotOperationTimeline 
            isActive={isLiveMode} 
            speed={isLiveMode ? "fast" : "normal"}
            compact={false}
          />
        </div>

        {/* Trading Controls */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">Controles de Trading</h3>
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                isLiveMode 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {isLiveMode ? 'LIVE' : 'PARADO'}
              </div>
              <button
                onClick={toggleLiveMode}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isLiveMode
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isLiveMode ? (
                  <>
                    <FiStop className="inline mr-2" />
                    Parar Trading
                  </>
                ) : (
                  <>
                    <FiPlay className="inline mr-2" />
                    Iniciar Trading
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Real-time Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Active Operations */}
          <div className="bg-gradient-to-br from-green-800/50 to-green-900/50 backdrop-blur-sm border border-green-600/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <FiActivity className="w-6 h-6 text-green-400" />
              </div>
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Operações Ativas</h3>
            <p className="text-2xl font-bold text-green-400">{tradingData?.active_operations}</p>
          </div>

          {/* Total Profit */}
          <div className="bg-gradient-to-br from-blue-800/50 to-blue-900/50 backdrop-blur-sm border border-blue-600/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <FiTrendingUp className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex items-center text-green-400 text-sm">
                <FiArrowUp className="w-4 h-4 mr-1" />
                +15.2%
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Lucro Total</h3>
            <p className="text-2xl font-bold text-blue-400">
              ${tradingData?.total_profit.toLocaleString()}
            </p>
          </div>

          {/* Win Rate */}
          <div className="bg-gradient-to-br from-purple-800/50 to-purple-900/50 backdrop-blur-sm border border-purple-600/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <FiBarChart3 className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex items-center text-green-400 text-sm">
                <FiArrowUp className="w-4 h-4 mr-1" />
                +2.1%
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Taxa de Acerto</h3>
            <p className="text-2xl font-bold text-purple-400">{tradingData?.win_rate}%</p>
          </div>

          {/* Signals Today */}
          <div className="bg-gradient-to-br from-yellow-800/50 to-yellow-900/50 backdrop-blur-sm border border-yellow-600/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <FiMonitor className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Sinais Hoje</h3>
            <p className="text-2xl font-bold text-yellow-400">{tradingData?.signals_today}</p>
          </div>
        </div>

        {/* Exchange Status */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Status das Exchanges</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(tradingData?.exchanges_status || {}).map(([exchange, status]) => (
              <div
                key={exchange}
                className={`p-4 rounded-lg border ${
                  status
                    ? 'bg-green-900/30 border-green-600/30'
                    : 'bg-red-900/30 border-red-600/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium capitalize">{exchange}</span>
                  <div className={`w-3 h-3 rounded-full ${
                    status ? 'bg-green-400' : 'bg-red-400'
                  }`}></div>
                </div>
                <p className={`text-sm mt-1 ${
                  status ? 'text-green-400' : 'text-red-400'
                }`}>
                  {status ? 'Conectado' : 'Desconectado'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Operations */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Operações Recentes</h3>
          <div className="space-y-3">
            {tradingData?.recent_operations.map((operation) => (
              <div
                key={operation.id}
                className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    operation.type === 'BUY' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {operation.type === 'BUY' ? <FiArrowUp /> : <FiArrowDown />}
                  </div>
                  <div>
                    <p className="text-white font-medium">{operation.symbol}</p>
                    <p className="text-gray-400 text-sm">
                      {operation.type} {operation.amount}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${
                    operation.profit > 0 
                      ? 'text-green-400' 
                      : operation.profit < 0 
                        ? 'text-red-400' 
                        : 'text-gray-400'
                  }`}>
                    {operation.profit > 0 ? '+' : ''}{operation.profit.toFixed(2)}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {operation.status === 'open' ? 'Aberta' : 'Fechada'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Alerts */}
        <div className="bg-red-900/20 border border-red-600/30 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <FiAlertCircle className="mr-3 text-red-400" />
            Alertas do Sistema
          </h3>
          <div className="space-y-2">
            <div className="flex items-center text-yellow-400">
              <FiAlertCircle className="mr-2" size={16} />
              <span>OKX exchange desconectada - reconectando...</span>
            </div>
            <div className="flex items-center text-green-400">
              <FiActivity className="mr-2" size={16} />
              <span>Sistema funcionando normalmente</span>
            </div>
          </div>
        </div>
      </div>
    </OperadorLayout>
  );
};

export default OperadorDashboard;
