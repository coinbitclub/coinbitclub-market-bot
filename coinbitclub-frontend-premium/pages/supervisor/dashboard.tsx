import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  FiHome, FiUsers, FiSettings, FiMenu, FiX, FiShield,
  FiTrendingUp, FiBarChart, FiActivity, FiEye, FiAward,
  FiClock, FiCheckCircle, FiAlertTriangle, FiTarget
} from 'react-icons/fi';

interface SupervisorDashboardData {
  supervisor: {
    id: string;
    name: string;
    department: string;
    level: string;
    supervised_teams: number;
    total_operators: number;
    active_operations: number;
    compliance_score: number;
    performance_rating: number;
  };
  team_overview: Array<{
    team_id: string;
    team_name: string;
    gestor: string;
    operators_count: number;
    active_operations: number;
    success_rate: number;
    monthly_profit: number;
    status: string;
  }>;
  compliance_alerts: Array<{
    id: string;
    type: string;
    severity: string;
    description: string;
    team_affected: string;
    timestamp: string;
    status: string;
  }>;
  performance_metrics: {
    overall_success_rate: number;
    total_profit: number;
    risk_compliance: number;
    operational_efficiency: number;
  };
}

export default function SupervisorDashboard() {
  const [data, setData] = useState&lt;SupervisorDashboardData | null&gt;(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/supervisor/dashboard', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar dados do dashboard');
      }

      const result = await response.json();
      setData(result.data);
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao buscar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      &lt;div className="min-h-screen bg-gray-100 flex items-center justify-center"&gt;
        &lt;div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"&gt;&lt;/div&gt;
      &lt;/div&gt;
    );
  }

  if (error) {
    return (
      &lt;div className="min-h-screen bg-gray-100 flex items-center justify-center"&gt;
        &lt;div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md"&gt;
          &lt;h2 className="text-red-800 text-xl font-semibold mb-2"&gt;Erro&lt;/h2&gt;
          &lt;p className="text-red-600"&gt;{error}&lt;/p&gt;
          &lt;button 
            onClick={fetchDashboardData}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          &gt;
            Tentar Novamente
          &lt;/button&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    );
  }

  return (
    &lt;&gt;
      &lt;Head&gt;
        &lt;title&gt;Supervisor Dashboard - CoinBitClub&lt;/title&gt;
        &lt;meta name="description" content="Dashboard do Supervisor CoinBitClub" /&gt;
      &lt;/Head&gt;

      &lt;div className="min-h-screen bg-gray-100"&gt;
        {/* Sidebar */}
        &lt;div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}&gt;
          &lt;div className="flex items-center justify-center h-16 px-4 bg-blue-600"&gt;
            &lt;h1 className="text-xl font-bold text-white"&gt;Supervisor Panel&lt;/h1&gt;
          &lt;/div&gt;
          
          &lt;nav className="mt-8"&gt;
            &lt;a href="#" className="flex items-center px-6 py-3 text-gray-700 bg-gray-100"&gt;
              &lt;FiHome className="w-5 h-5 mr-3" /&gt;
              Dashboard
            &lt;/a&gt;
            &lt;a href="#" className="flex items-center px-6 py-3 text-gray-600 hover:bg-gray-100"&gt;
              &lt;FiUsers className="w-5 h-5 mr-3" /&gt;
              Equipes
            &lt;/a&gt;
            &lt;a href="#" className="flex items-center px-6 py-3 text-gray-600 hover:bg-gray-100"&gt;
              &lt;FiShield className="w-5 h-5 mr-3" /&gt;
              Compliance
            &lt;/a&gt;
            &lt;a href="#" className="flex items-center px-6 py-3 text-gray-600 hover:bg-gray-100"&gt;
              &lt;FiBarChart className="w-5 h-5 mr-3" /&gt;
              Relatórios
            &lt;/a&gt;
            &lt;a href="#" className="flex items-center px-6 py-3 text-gray-600 hover:bg-gray-100"&gt;
              &lt;FiSettings className="w-5 h-5 mr-3" /&gt;
              Configurações
            &lt;/a&gt;
          &lt;/nav&gt;
        &lt;/div&gt;

        {/* Main Content */}
        &lt;div className="lg:ml-64"&gt;
          {/* Header */}
          &lt;header className="bg-white shadow-sm border-b border-gray-200"&gt;
            &lt;div className="flex items-center justify-between px-6 py-4"&gt;
              &lt;div className="flex items-center"&gt;
                &lt;button
                  onClick={() =&gt; setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden text-gray-600 hover:text-gray-900"
                &gt;
                  {sidebarOpen ? &lt;FiX className="w-6 h-6" /&gt; : &lt;FiMenu className="w-6 h-6" /&gt;}
                &lt;/button&gt;
                &lt;h2 className="ml-4 text-xl font-semibold text-gray-800"&gt;
                  Dashboard do Supervisor
                &lt;/h2&gt;
              &lt;/div&gt;
              
              &lt;div className="flex items-center space-x-4"&gt;
                &lt;div className="text-sm text-gray-600"&gt;
                  &lt;span className="font-medium"&gt;{data?.supervisor.name}&lt;/span&gt;
                  &lt;span className="block text-xs"&gt;{data?.supervisor.department}&lt;/span&gt;
                &lt;/div&gt;
                &lt;div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center"&gt;
                  &lt;span className="text-white font-semibold"&gt;
                    {data?.supervisor.name?.charAt(0) || 'S'}
                  &lt;/span&gt;
                &lt;/div&gt;
              &lt;/div&gt;
            &lt;/div&gt;
          &lt;/header&gt;

          {/* Dashboard Content */}
          &lt;main className="p-6"&gt;
            {/* Stats Cards */}
            &lt;div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"&gt;
              &lt;div className="bg-white rounded-lg shadow p-6"&gt;
                &lt;div className="flex items-center"&gt;
                  &lt;div className="p-2 bg-blue-100 rounded-lg"&gt;
                    &lt;FiUsers className="w-6 h-6 text-blue-600" /&gt;
                  &lt;/div&gt;
                  &lt;div className="ml-4"&gt;
                    &lt;p className="text-sm font-medium text-gray-600"&gt;Equipes Supervisionadas&lt;/p&gt;
                    &lt;p className="text-2xl font-semibold text-gray-900"&gt;{data?.supervisor.supervised_teams}&lt;/p&gt;
                  &lt;/div&gt;
                &lt;/div&gt;
              &lt;/div&gt;

              &lt;div className="bg-white rounded-lg shadow p-6"&gt;
                &lt;div className="flex items-center"&gt;
                  &lt;div className="p-2 bg-green-100 rounded-lg"&gt;
                    &lt;FiActivity className="w-6 h-6 text-green-600" /&gt;
                  &lt;/div&gt;
                  &lt;div className="ml-4"&gt;
                    &lt;p className="text-sm font-medium text-gray-600"&gt;Operadores Ativos&lt;/p&gt;
                    &lt;p className="text-2xl font-semibold text-gray-900"&gt;{data?.supervisor.total_operators}&lt;/p&gt;
                  &lt;/div&gt;
                &lt;/div&gt;
              &lt;/div&gt;

              &lt;div className="bg-white rounded-lg shadow p-6"&gt;
                &lt;div className="flex items-center"&gt;
                  &lt;div className="p-2 bg-yellow-100 rounded-lg"&gt;
                    &lt;FiShield className="w-6 h-6 text-yellow-600" /&gt;
                  &lt;/div&gt;
                  &lt;div className="ml-4"&gt;
                    &lt;p className="text-sm font-medium text-gray-600"&gt;Score Compliance&lt;/p&gt;
                    &lt;p className="text-2xl font-semibold text-gray-900"&gt;{data?.supervisor.compliance_score}%&lt;/p&gt;
                  &lt;/div&gt;
                &lt;/div&gt;
              &lt;/div&gt;

              &lt;div className="bg-white rounded-lg shadow p-6"&gt;
                &lt;div className="flex items-center"&gt;
                  &lt;div className="p-2 bg-purple-100 rounded-lg"&gt;
                    &lt;FiAward className="w-6 h-6 text-purple-600" /&gt;
                  &lt;/div&gt;
                  &lt;div className="ml-4"&gt;
                    &lt;p className="text-sm font-medium text-gray-600"&gt;Performance Rating&lt;/p&gt;
                    &lt;p className="text-2xl font-semibold text-gray-900"&gt;{data?.supervisor.performance_rating}/10&lt;/p&gt;
                  &lt;/div&gt;
                &lt;/div&gt;
              &lt;/div&gt;
            &lt;/div&gt;

            {/* Teams Overview */}
            &lt;div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"&gt;
              &lt;div className="bg-white rounded-lg shadow"&gt;
                &lt;div className="p-6 border-b border-gray-200"&gt;
                  &lt;h3 className="text-lg font-semibold text-gray-900"&gt;Visão Geral das Equipes&lt;/h3&gt;
                &lt;/div&gt;
                &lt;div className="p-6"&gt;
                  &lt;div className="space-y-4"&gt;
                    {data?.team_overview.map((team) =&gt; (
                      &lt;div key={team.team_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"&gt;
                        &lt;div&gt;
                          &lt;h4 className="font-medium text-gray-900"&gt;{team.team_name}&lt;/h4&gt;
                          &lt;p className="text-sm text-gray-600"&gt;Gestor: {team.gestor}&lt;/p&gt;
                          &lt;p className="text-sm text-gray-600"&gt;Operadores: {team.operators_count}&lt;/p&gt;
                        &lt;/div&gt;
                        &lt;div className="text-right"&gt;
                          &lt;p className="font-semibold text-green-600"&gt;{team.success_rate.toFixed(1)}%&lt;/p&gt;
                          &lt;p className="text-sm text-gray-600"&gt;Taxa de Sucesso&lt;/p&gt;
                        &lt;/div&gt;
                      &lt;/div&gt;
                    ))}&lt;/div&gt;
                &lt;/div&gt;
              &lt;/div&gt;

              {/* Compliance Alerts */}
              &lt;div className="bg-white rounded-lg shadow"&gt;
                &lt;div className="p-6 border-b border-gray-200"&gt;
                  &lt;h3 className="text-lg font-semibold text-gray-900"&gt;Alertas de Compliance&lt;/h3&gt;
                &lt;/div&gt;
                &lt;div className="p-6"&gt;
                  &lt;div className="space-y-4"&gt;
                    {data?.compliance_alerts.map((alert) =&gt; (
                      &lt;div key={alert.id} className="flex items-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg"&gt;
                        &lt;FiAlertTriangle className="w-5 h-5 text-yellow-600 mr-3" /&gt;
                        &lt;div className="flex-1"&gt;
                          &lt;h4 className="font-medium text-gray-900"&gt;{alert.type}&lt;/h4&gt;
                          &lt;p className="text-sm text-gray-600"&gt;{alert.description}&lt;/p&gt;
                          &lt;p className="text-xs text-gray-500"&gt;Equipe: {alert.team_affected}&lt;/p&gt;
                        &lt;/div&gt;
                        &lt;span className={`px-2 py-1 text-xs rounded-full ${
                          alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                          alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}&gt;
                          {alert.severity}
                        &lt;/span&gt;
                      &lt;/div&gt;
                    ))}
                  &lt;/div&gt;
                &lt;/div&gt;
              &lt;/div&gt;
            &lt;/div&gt;

            {/* Performance Metrics */}
            &lt;div className="bg-white rounded-lg shadow"&gt;
              &lt;div className="p-6 border-b border-gray-200"&gt;
                &lt;h3 className="text-lg font-semibold text-gray-900"&gt;Métricas de Performance Geral&lt;/h3&gt;
              &lt;/div&gt;
              &lt;div className="p-6"&gt;
                &lt;div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"&gt;
                  &lt;div className="text-center"&gt;
                    &lt;p className="text-3xl font-bold text-blue-600"&gt;{data?.performance_metrics.overall_success_rate.toFixed(1)}%&lt;/p&gt;
                    &lt;p className="text-sm text-gray-600"&gt;Taxa de Sucesso Geral&lt;/p&gt;
                  &lt;/div&gt;
                  &lt;div className="text-center"&gt;
                    &lt;p className="text-3xl font-bold text-green-600"&gt;
                      ${data?.performance_metrics.total_profit.toLocaleString()}
                    &lt;/p&gt;
                    &lt;p className="text-sm text-gray-600"&gt;Lucro Total&lt;/p&gt;
                  &lt;/div&gt;
                  &lt;div className="text-center"&gt;
                    &lt;p className="text-3xl font-bold text-yellow-600"&gt;{data?.performance_metrics.risk_compliance.toFixed(1)}%&lt;/p&gt;
                    &lt;p className="text-sm text-gray-600"&gt;Conformidade de Risco&lt;/p&gt;
                  &lt;/div&gt;
                  &lt;div className="text-center"&gt;
                    &lt;p className="text-3xl font-bold text-purple-600"&gt;{data?.performance_metrics.operational_efficiency.toFixed(1)}%&lt;/p&gt;
                    &lt;p className="text-sm text-gray-600"&gt;Eficiência Operacional&lt;/p&gt;
                  &lt;/div&gt;
                &lt;/div&gt;
              &lt;/div&gt;
            &lt;/div&gt;
          &lt;/main&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    &lt;/&gt;
  );
}
