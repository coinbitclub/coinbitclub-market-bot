import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BellIcon,
  ChartBarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CalculatorIcon,
  CogIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import AdminLayout from '../../src/components/AdminLayout';

// Interfaces para tipagem
interface MarketReading {
  direction: 'LONG' | 'SHORT' | 'NEUTRO';
  confidence: number;
  justification: string;
  lastUpdate: string;
}

interface Operation {
  id: string;
  symbol: string;
  entryValue: number;
  exchange: string;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
  timestamp: string;
}

interface Signal {
  id: string;
  datetime: string;
  symbol: string;
  signal: string;
  source: 'TRADINGVIEW' | 'COINSTATS';
  indicator?: string;
  data?: string;
}

interface SystemStatus {
  api: 'online' | 'offline';
  database: 'online' | 'offline';
  payments: 'online' | 'offline';
  email: 'online' | 'offline';
}

interface DashboardData {
  returnToday: number;
  returnHistorical: number;
  accuracyToday: number;
  accuracyHistorical: number;
  marketReading: MarketReading;
  recentActivities: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
  }>;
  activeOperations: Operation[];
  tradingViewSignals: Signal[];
  coinStarsSignals: Signal[];
  refundRequests: number;
  affiliateRequests: number;
  systemStatus: SystemStatus;
}

const AdminDashboard: NextPage = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Aqui será feita a integração real com o backend
      const mockData: DashboardData = {
        returnToday: 2.45,
        returnHistorical: 18.67,
        accuracyToday: 78.5,
        accuracyHistorical: 82.3,
        marketReading: {
          direction: 'LONG',
          confidence: 85,
          justification: 'Forte suporte em $42,000. RSI oversold, volume crescente, tendência de alta confirmada.',
          lastUpdate: new Date().toLocaleString('pt-BR')
        },
        recentActivities: [
          { id: '1', type: 'operation', message: 'Nova operação BTCUSDT LONG aberta', timestamp: '10:30' },
          { id: '2', type: 'user', message: 'Novo usuário cadastrado: João Silva', timestamp: '10:15' },
          { id: '3', type: 'payout', message: 'Comissão paga ao afiliado AFF123', timestamp: '09:45' }
        ],
        activeOperations: [
          { id: '1', symbol: 'BTCUSDT', entryValue: 42500, exchange: 'Binance', currentValue: 43200, pnl: 700, pnlPercent: 1.65, timestamp: '2024-01-20 09:30' },
          { id: '2', symbol: 'ETHUSDT', entryValue: 2580, exchange: 'Bybit', currentValue: 2620, pnl: 40, pnlPercent: 1.55, timestamp: '2024-01-20 08:15' }
        ],
        tradingViewSignals: [
          { id: '1', datetime: '2024-01-20 10:45', symbol: 'BTCUSDT', signal: 'STRONG_BUY', source: 'TRADINGVIEW' },
          { id: '2', datetime: '2024-01-20 10:30', symbol: 'ETHUSDT', signal: 'BUY', source: 'TRADINGVIEW' }
        ],
        coinStarsSignals: [
          { id: '1', datetime: '2024-01-20 10:50', symbol: 'BTC', signal: 'RSI', source: 'COINSTATS', indicator: 'RSI', data: 'Oversold (28)' },
          { id: '2', datetime: '2024-01-20 10:45', symbol: 'ETH', signal: 'VOLUME', source: 'COINSTATS', indicator: 'Volume', data: '+45% increase' }
        ],
        refundRequests: 3,
        affiliateRequests: 2,
        systemStatus: {
          api: 'online',
          database: 'online', 
          payments: 'online',
          email: 'online'
        }
      };
      
      setDashboardData(mockData);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
            <p className="text-white">Carregando dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case 'LONG': return 'text-green-400';
      case 'SHORT': return 'text-red-400';
      case 'NEUTRO': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'online' ? 'text-green-400' : 'text-red-400';
  };

  const cardStyle = {
    background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(17, 17, 17, 0.9))',
    border: '1px solid rgba(255, 215, 0, 0.3)',
    borderRadius: '16px',
    padding: '1.5rem',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 0 20px rgba(255, 215, 0, 0.1)',
  };

  return (
    <>
      <Head>
        <title>Dashboard Administrativo - CoinBitClub</title>
      </Head>
      
      <AdminLayout title="Dashboard">
        <div className="min-h-screen" style={{ 
          background: 'linear-gradient(135deg, #000000 0%, #111111 100%)',
          color: '#FFFFFF',
          fontFamily: "'Inter', sans-serif"
        }}>
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{
              background: 'linear-gradient(45deg, #FFD700, #FF69B4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Dashboard Administrativo
            </h1>
            <p className="text-gray-400">Visão geral do sistema em tempo real</p>
          </div>

          {/* Métricas principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div style={cardStyle}>
              <h3 className="text-lg font-semibold mb-2 text-green-400">Retorno % Dia</h3>
              <p className="text-2xl font-bold text-white">+{dashboardData?.returnToday}%</p>
              <p className="text-sm text-gray-400 mt-1">Últimas 24h</p>
            </div>
            
            <div style={cardStyle}>
              <h3 className="text-lg font-semibold mb-2 text-blue-400">Retorno % Histórico</h3>
              <p className="text-2xl font-bold text-white">+{dashboardData?.returnHistorical}%</p>
              <p className="text-sm text-gray-400 mt-1">Acumulado</p>
            </div>
            
            <div style={cardStyle}>
              <h3 className="text-lg font-semibold mb-2 text-purple-400">Assertividade % Dia</h3>
              <p className="text-2xl font-bold text-white">{dashboardData?.accuracyToday}%</p>
              <p className="text-sm text-gray-400 mt-1">Últimas 24h</p>
            </div>
            
            <div style={cardStyle}>
              <h3 className="text-lg font-semibold mb-2 text-pink-400">Assertividade % Histórica</h3>
              <p className="text-2xl font-bold text-white">{dashboardData?.accuracyHistorical}%</p>
              <p className="text-sm text-gray-400 mt-1">Acumulado</p>
            </div>
          </div>

          {/* Leitura do Mercado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div style={cardStyle}>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <ChartBarIcon className="w-6 h-6 text-yellow-400" />
                Leitura do Mercado
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Direção:</span>
                  <span className={`font-bold text-lg ${getDirectionColor(dashboardData?.marketReading.direction || '')}`}>
                    {dashboardData?.marketReading.direction}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Confiança:</span>
                  <span className="text-white font-semibold">{dashboardData?.marketReading.confidence}%</span>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-300 mb-2">Justificativa IA:</p>
                  <p className="text-sm text-white bg-black/30 p-3 rounded-lg">
                    {dashboardData?.marketReading.justification}
                  </p>
                </div>
                <p className="text-xs text-gray-500">
                  Última atualização: {dashboardData?.marketReading.lastUpdate}
                </p>
              </div>
            </div>

            {/* Status do Sistema */}
            <div style={cardStyle}>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CogIcon className="w-6 h-6 text-yellow-400" />
                Status do Sistema
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">API Status:</span>
                  <span className={getStatusColor(dashboardData?.systemStatus.api || '')}>
                    {dashboardData?.systemStatus.api?.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Database:</span>
                  <span className={getStatusColor(dashboardData?.systemStatus.database || '')}>
                    {dashboardData?.systemStatus.database?.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Payments:</span>
                  <span className={getStatusColor(dashboardData?.systemStatus.payments || '')}>
                    {dashboardData?.systemStatus.payments?.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">E-mail:</span>
                  <span className={getStatusColor(dashboardData?.systemStatus.email || '')}>
                    {dashboardData?.systemStatus.email?.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Alertas e Solicitações */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div style={cardStyle}>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />
                Solicitações Pendentes
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-red-900/20 rounded-lg border border-red-700/30">
                  <span className="text-gray-300">Reembolsos não atendidos:</span>
                  <span className="text-red-400 font-bold">{dashboardData?.refundRequests}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-900/20 rounded-lg border border-yellow-700/30">
                  <span className="text-gray-300">Acertos de afiliado:</span>
                  <span className="text-yellow-400 font-bold">{dashboardData?.affiliateRequests}</span>
                </div>
              </div>
            </div>

            {/* Atividades Recentes */}
            <div style={cardStyle}>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <ClockIcon className="w-6 h-6 text-blue-400" />
                Atividades Recentes
              </h3>
              <div className="space-y-2">
                {dashboardData?.recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-2 bg-black/20 rounded">
                    <span className="text-sm text-gray-300">{activity.message}</span>
                    <span className="text-xs text-gray-500">{activity.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Operações em Andamento */}
          <div style={cardStyle} className="mb-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <ArrowTrendingUpIcon className="w-6 h-6 text-green-400" />
              Operações em Andamento
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-2 text-gray-300">Moeda</th>
                    <th className="text-left p-2 text-gray-300">Valor Entrada</th>
                    <th className="text-left p-2 text-gray-300">Exchange</th>
                    <th className="text-left p-2 text-gray-300">Valor Atual</th>
                    <th className="text-left p-2 text-gray-300">P&L</th>
                    <th className="text-left p-2 text-gray-300">Data/Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData?.activeOperations.map((op) => (
                    <tr key={op.id} className="border-b border-gray-800">
                      <td className="p-2 text-white font-semibold">{op.symbol}</td>
                      <td className="p-2 text-gray-300">${op.entryValue.toLocaleString()}</td>
                      <td className="p-2 text-gray-300">{op.exchange}</td>
                      <td className="p-2 text-gray-300">${op.currentValue.toLocaleString()}</td>
                      <td className={`p-2 font-semibold ${op.pnl > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${op.pnl} ({op.pnlPercent > 0 ? '+' : ''}{op.pnlPercent}%)
                      </td>
                      <td className="p-2 text-gray-400 text-xs">{op.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sinais */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sinais TradingView */}
            <div style={cardStyle}>
              <h3 className="text-xl font-bold mb-4 text-blue-400">Sinais TradingView</h3>
              <div className="space-y-2">
                {dashboardData?.tradingViewSignals.map((signal) => (
                  <div key={signal.id} className="flex items-center justify-between p-2 bg-blue-900/20 rounded">
                    <div>
                      <span className="text-white font-semibold">{signal.symbol}</span>
                      <span className="ml-2 text-blue-400">{signal.signal}</span>
                    </div>
                    <span className="text-xs text-gray-400">{signal.datetime}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sinais CoinStars */}
            <div style={cardStyle}>
              <h3 className="text-xl font-bold mb-4 text-purple-400">Sinais CoinStats</h3>
              <div className="space-y-2">
                {dashboardData?.coinStarsSignals.map((signal) => (
                  <div key={signal.id} className="flex items-center justify-between p-2 bg-purple-900/20 rounded">
                    <div>
                      <span className="text-white font-semibold">{signal.symbol}</span>
                      <span className="ml-2 text-purple-400">{signal.indicator}</span>
                      <div className="text-xs text-gray-300">{signal.data}</div>
                    </div>
                    <span className="text-xs text-gray-400">{signal.datetime}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </>
  );
};

export default AdminDashboard;
