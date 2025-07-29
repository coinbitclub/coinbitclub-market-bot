import React, { useState, useEffect } from 'react';
import GestorLayout from '../../src/components/Layout/GestorLayout';
import RobotOperationTimeline from '../../src/components/trading/RobotOperationTimeline';
import CompactRobotStatus from '../../src/components/trading/CompactRobotStatus';
import { 
  FiTrendingUp, 
  FiUsers, 
  FiDollarSign, 
  FiBarChart, 
  FiActivity,
  FiArrowUp,
  FiArrowDown
} from 'react-icons/fi';

interface DashboardData {
  operations: {
    total: number;
    active: number;
    today: number;
    profit: number;
  };
  affiliates: {
    total: number;
    active: number;
    commissions: number;
    conversion: number;
  };
  financial: {
    revenue: number;
    commissions: number;
    profit_margin: number;
    pending: number;
  };
  users: {
    total: number;
    active: number;
    new_today: number;
    retention: number;
  };
}

const GestorDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/gestor/dashboard?period=${selectedPeriod}`);
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        // Dados mock para demonstração
        setDashboardData({
          operations: {
            total: 1250,
            active: 85,
            today: 24,
            profit: 15.8
          },
          affiliates: {
            total: 156,
            active: 98,
            commissions: 12350.75,
            conversion: 18.5
          },
          financial: {
            revenue: 89500.50,
            commissions: 12350.75,
            profit_margin: 22.5,
            pending: 2150.25
          },
          users: {
            total: 445,
            active: 267,
            new_today: 12,
            retention: 76.3
          }
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <GestorLayout title="Dashboard Gestor">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
        </div>
      </GestorLayout>
    );
  }

  return (
    <GestorLayout title="Dashboard Gestor">
      <div className="space-y-6">
        {/* Timeline do Robô */}
        <div className="mb-8">
          <RobotOperationTimeline 
            isActive={true} 
            speed="normal"
            compact={false}
          />
        </div>

        {/* Period Selector */}
        <div className="flex justify-end mb-6">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-blue-800/50 border border-blue-600 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400"
          >
            <option value="1d">Último dia</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
          </select>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Operations Card */}
          <div className="bg-gradient-to-br from-blue-800/50 to-blue-900/50 backdrop-blur-sm border border-blue-600/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <FiTrendingUp className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex items-center text-green-400 text-sm">
                <FiArrowUp className="w-4 h-4 mr-1" />
                +{dashboardData?.operations.profit}%
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Operações</h3>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-blue-400">{dashboardData?.operations.total}</p>
              <p className="text-sm text-gray-400">
                {dashboardData?.operations.active} ativas • {dashboardData?.operations.today} hoje
              </p>
            </div>
          </div>

          {/* Affiliates Card */}
          <div className="bg-gradient-to-br from-purple-800/50 to-purple-900/50 backdrop-blur-sm border border-purple-600/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <FiUsers className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex items-center text-green-400 text-sm">
                <FiArrowUp className="w-4 h-4 mr-1" />
                +{dashboardData?.affiliates.conversion}%
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Afiliados</h3>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-purple-400">{dashboardData?.affiliates.total}</p>
              <p className="text-sm text-gray-400">
                {dashboardData?.affiliates.active} ativos
              </p>
            </div>
          </div>

          {/* Financial Card */}
          <div className="bg-gradient-to-br from-green-800/50 to-green-900/50 backdrop-blur-sm border border-green-600/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <FiDollarSign className="w-6 h-6 text-green-400" />
              </div>
              <div className="flex items-center text-green-400 text-sm">
                <FiArrowUp className="w-4 h-4 mr-1" />
                +{dashboardData?.financial.profit_margin}%
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Receita</h3>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-green-400">
                ${dashboardData?.financial.revenue.toLocaleString()}
              </p>
              <p className="text-sm text-gray-400">
                ${dashboardData?.financial.commissions.toLocaleString()} comissões
              </p>
            </div>
          </div>

          {/* Users Card */}
          <div className="bg-gradient-to-br from-yellow-800/50 to-yellow-900/50 backdrop-blur-sm border border-yellow-600/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <FiBarChart className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="flex items-center text-green-400 text-sm">
                <FiArrowUp className="w-4 h-4 mr-1" />
                +{dashboardData?.users.retention}%
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Usuários</h3>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-yellow-400">{dashboardData?.users.total}</p>
              <p className="text-sm text-gray-400">
                {dashboardData?.users.active} ativos • +{dashboardData?.users.new_today} hoje
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Operations Management */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <FiActivity className="mr-3 text-blue-400" />
              Gestão de Operações
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-900/30 rounded-lg">
                <span className="text-gray-300">Operações ativas</span>
                <span className="text-blue-400 font-bold">{dashboardData?.operations.active}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-900/30 rounded-lg">
                <span className="text-gray-300">Lucro médio</span>
                <span className="text-green-400 font-bold">+{dashboardData?.operations.profit}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-900/30 rounded-lg">
                <span className="text-gray-300">Operações hoje</span>
                <span className="text-purple-400 font-bold">{dashboardData?.operations.today}</span>
              </div>
            </div>
          </div>

          {/* Affiliate Management */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <FiUsers className="mr-3 text-purple-400" />
              Gestão de Afiliados
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-purple-900/30 rounded-lg">
                <span className="text-gray-300">Total de afiliados</span>
                <span className="text-purple-400 font-bold">{dashboardData?.affiliates.total}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-900/30 rounded-lg">
                <span className="text-gray-300">Comissões pagas</span>
                <span className="text-green-400 font-bold">
                  ${dashboardData?.affiliates.commissions.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-900/30 rounded-lg">
                <span className="text-gray-300">Taxa de conversão</span>
                <span className="text-blue-400 font-bold">{dashboardData?.affiliates.conversion}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
              Gerenciar Operações
            </button>
            <button className="p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium">
              Revisar Afiliados
            </button>
            <button className="p-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium">
              Relatório Financeiro
            </button>
          </div>
        </div>
      </div>
    </GestorLayout>
  );
};

export default GestorDashboard;
