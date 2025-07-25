import React from 'react';
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { 
  FiDollarSign, FiTrendingUp, FiTrendingDown, FiUsers, FiCalendar,
  FiBarChart2, FiPieChart, FiFilter, FiDownload, FiRefreshCw, FiEye 
} from 'react-icons/fi';
import Head from 'next/head';
import Sidebar from '../../components/Sidebar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface AccountingData {
  daily_revenue: number;
  total_revenue: number;
  growth_rate: number;
  monthly_users: number;
  prepaid_users: number;
  monthly_growth_rate: number;
  prepaid_growth_rate: number;
  affiliate_payments: number;
  user_refunds: number;
  net_balance: number;
  total_prepaid_balance: number;
  pending_commissions: number;
  effective_balance: number;
}

interface RevenueData {
  date: string;
  revenue: number;
  growth: number;
}

interface UserPlanData {
  plan_type: string;
  count: number;
  revenue: number;
  growth_rate: number;
}

export default function AccountingManagement() {
  const [dateRange, setDateRange] = useState('30d');
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  const { data: accountingData, error, mutate } = useSWR('/api/admin/accounting', {
    refreshInterval: 300000 // Refresh every 5 minutes
  });

  const { data: revenueHistory } = useSWR(`/api/admin/accounting/history?period=${dateRange}`);
  const { data: userPlansData } = useSWR('/api/admin/accounting/user-plans');

  const data: AccountingData = accountingData || {
    daily_revenue: 0,
    total_revenue: 0,
    growth_rate: 0,
    monthly_users: 0,
    prepaid_users: 0,
    monthly_growth_rate: 0,
    prepaid_growth_rate: 0,
    affiliate_payments: 0,
    user_refunds: 0,
    net_balance: 0,
    total_prepaid_balance: 0,
    pending_commissions: 0,
    effective_balance: 0
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const handleExportReport = async () => {
    try {
      const response = await fetch('/api/admin/accounting/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: dateRange })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `accounting-report-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Contabilidade - CoinBitClub Admin</title>
      </Head>

      <div className="flex">
        <Sidebar />
        
        <div className="flex-1 ml-64">
          {/* Header */}
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Contabilidade</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Visão financeira consolidada da empresa
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="7d">Últimos 7 dias</option>
                    <option value="30d">Últimos 30 dias</option>
                    <option value="90d">Últimos 90 dias</option>
                    <option value="1y">Último ano</option>
                  </select>
                  
                  <button
                    onClick={handleExportReport}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <FiDownload className="mr-2 h-4 w-4" />
                    Exportar
                  </button>
                  
                  <button
                    onClick={() => mutate()}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <FiRefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Financial Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FiDollarSign className="h-6 w-6 text-green-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Receita Diária</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {formatCurrency(data.daily_revenue)}
                        </dd>
                        <dd className={`text-sm ${data.growth_rate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercentage(data.growth_rate)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FiBarChart2 className="h-6 w-6 text-blue-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Receita Total</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {formatCurrency(data.total_revenue)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FiUsers className="h-6 w-6 text-purple-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Usuários Mensais</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {data.monthly_users}
                        </dd>
                        <dd className={`text-sm ${data.monthly_growth_rate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercentage(data.monthly_growth_rate)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FiUsers className="h-6 w-6 text-yellow-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Usuários Pré-pagos</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {data.prepaid_users}
                        </dd>
                        <dd className={`text-sm ${data.prepaid_growth_rate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercentage(data.prepaid_growth_rate)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Balance */}
            <div className="bg-white shadow rounded-lg mb-8">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
                  Balanço Financeiro da CoinBitClub
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <FiTrendingUp className="h-5 w-5 text-green-400 mr-2" />
                      <h4 className="text-sm font-medium text-green-900">Receitas Obtidas</h4>
                    </div>
                    <p className="text-2xl font-bold text-green-600 mt-2">
                      {formatCurrency(data.total_revenue)}
                    </p>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <FiUsers className="h-5 w-5 text-yellow-400 mr-2" />
                      <h4 className="text-sm font-medium text-yellow-900">Saldo Pré-pago</h4>
                    </div>
                    <p className="text-2xl font-bold text-yellow-600 mt-2">
                      -{formatCurrency(data.total_prepaid_balance)}
                    </p>
                    <p className="text-xs text-yellow-700">A devolver</p>
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <FiTrendingDown className="h-5 w-5 text-red-400 mr-2" />
                      <h4 className="text-sm font-medium text-red-900">Pagamentos Feitos</h4>
                    </div>
                    <p className="text-2xl font-bold text-red-600 mt-2">
                      -{formatCurrency(data.affiliate_payments + data.user_refunds)}
                    </p>
                    <p className="text-xs text-red-700">
                      Afiliados: {formatCurrency(data.affiliate_payments)} | 
                      Usuários: {formatCurrency(data.user_refunds)}
                    </p>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <FiDollarSign className="h-5 w-5 text-blue-400 mr-2" />
                      <h4 className="text-sm font-medium text-blue-900">Saldo Efetivo</h4>
                    </div>
                    <p className={`text-2xl font-bold mt-2 ${data.effective_balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {formatCurrency(data.effective_balance)}
                    </p>
                    <p className="text-xs text-blue-700">
                      Pendente: {formatCurrency(data.pending_commissions)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Revenue Chart */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Evolução da Receita
                  </h3>
                  
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueHistory || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Receita']} />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* User Plans Distribution */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Distribuição por Tipo de Plano
                  </h3>
                  
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={userPlansData || []}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ plan_type, count }) => `${plan_type}: ${count}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {(userPlansData || []).map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    {(userPlansData || []).map((plan: UserPlanData, index: number) => (
                      <div key={plan.plan_type} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm text-gray-600">{plan.plan_type}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">{plan.count} usuários</div>
                          <div className="text-xs text-gray-500">{formatCurrency(plan.revenue)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
                <td className="px-4 py-2">Relatório Fiscal Mensal</td>
                <td className="px-4 py-2 text-green-400">Pronto</td>
                <td className="px-4 py-2"><button className="rounded bg-blue-500 px-3 py-1 text-white hover:bg-blue-600">Baixar</button></td>
              </tr>
              <tr className="hover:bg-gray-900">
                <td className="px-4 py-2">20/07/2025</td>
                <td className="px-4 py-2">Contábil</td>
                <td className="px-4 py-2">Relatório Contábil Anual</td>
                <td className="px-4 py-2 text-yellow-400">Pendente</td>
                <td className="px-4 py-2"><button className="rounded bg-pink-500 px-3 py-1 text-white hover:bg-pink-600">Baixar</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
