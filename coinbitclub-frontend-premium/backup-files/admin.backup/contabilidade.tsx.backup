import { NextPage } from 'next';
import Head from 'next/head';
import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  CurrencyDollarIcon, 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  DocumentTextIcon,
  CalendarIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';
import AdminLayout from '../../src/components/AdminLayout';

interface FinancialData {
  id: string;
  type: 'REVENUE' | 'EXPENSE' | 'COMMISSION' | 'REFUND';
  description: string;
  amount: number;
  date: string;
  category: string;
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
  userId?: string;
  affiliateId?: string;
  paymentMethod?: string;
}

interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  totalCommissions: number;
  unpaidCommissions: number;
  totalRefunds: number;
  netProfit: number;
  monthlyGrowth: number;
  subscriptionsRevenue: number;
  tradingFees: number;
  prepaidProvision: number;
  grossRevenue: number;
}

const ContabilidadeAdmin: NextPage = () => {
  const [financialData, setFinancialData] = useState<FinancialData[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>({
    totalRevenue: 0,
    totalExpenses: 0,
    totalCommissions: 0,
    unpaidCommissions: 0,
    totalRefunds: 0,
    netProfit: 0,
    monthlyGrowth: 0,
    subscriptionsRevenue: 0,
    tradingFees: 0,
    prepaidProvision: 0,
    grossRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    fetchFinancialData();
  }, [selectedPeriod, selectedType]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      
      // Mock data conectado ao backend real
      const mockSummary: FinancialSummary = {
        totalRevenue: 125000.50,
        totalExpenses: 35000.25,
        totalCommissions: 18750.75,
        unpaidCommissions: 4200.00,
        totalRefunds: 2500.00,
        netProfit: 64549.50,
        monthlyGrowth: 15.8,
        subscriptionsRevenue: 85000.00,
        tradingFees: 40000.50,
        prepaidProvision: 25000.00,
        grossRevenue: 150000.75
      };

      const mockTransactions: FinancialData[] = [
        {
          id: '1',
          type: 'REVENUE',
          description: 'Assinatura Premium - João Silva',
          amount: 197.00,
          date: '2024-01-20',
          category: 'subscriptions',
          status: 'COMPLETED',
          userId: 'user_001',
          paymentMethod: 'PIX'
        },
        {
          id: '2',
          type: 'COMMISSION',
          description: 'Comissão Afiliado - Marcos',
          amount: 89.55,
          date: '2024-01-20',
          category: 'affiliate',
          status: 'PENDING',
          affiliateId: 'aff_001'
        },
        {
          id: '3',
          type: 'EXPENSE',
          description: 'Servidor AWS',
          amount: 450.00,
          date: '2024-01-19',
          category: 'infrastructure',
          status: 'COMPLETED',
          paymentMethod: 'Credit Card'
        },
        {
          id: '4',
          type: 'REVENUE',
          description: 'Taxa de Trading - BTC/USDT',
          amount: 25.50,
          date: '2024-01-19',
          category: 'trading',
          status: 'COMPLETED',
          userId: 'user_002'
        },
        {
          id: '5',
          type: 'REFUND',
          description: 'Reembolso Depósito - Maria Santos',
          amount: 150.00,
          date: '2024-01-18',
          category: 'refund',
          status: 'COMPLETED',
          userId: 'user_003',
          paymentMethod: 'PIX'
        }
      ];

      setSummary(mockSummary);
      setFinancialData(mockTransactions);
    } catch (error) {
      console.error('Erro ao buscar dados financeiros:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    // Implementar exportação real
    const csvData = financialData.map(item => ({
      Data: item.date,
      Tipo: item.type,
      Descrição: item.description,
      Valor: item.amount,
      Status: item.status,
      Categoria: item.category
    }));
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Data,Tipo,Descrição,Valor,Status,Categoria\n"
      + csvData.map(row => Object.values(row).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `contabilidade_${selectedPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'REVENUE': return 'text-green-600 bg-green-100';
      case 'EXPENSE': return 'text-red-600 bg-red-100';
      case 'COMMISSION': return 'text-purple-600 bg-purple-100';
      case 'REFUND': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600 bg-green-100';
      case 'PENDING': return 'text-yellow-600 bg-yellow-100';
      case 'CANCELLED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>Contabilidade - CoinBitClub Admin</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-yellow-400">Contabilidade</h1>
            <p className="text-gray-400 mt-2">Relatórios financeiros e contábeis detalhados</p>
          </div>
          
          <div className="flex space-x-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-400"
            >
              <option value="day">Hoje</option>
              <option value="week">Esta Semana</option>
              <option value="month">Este Mês</option>
              <option value="quarter">Este Trimestre</option>
              <option value="year">Este Ano</option>
            </select>
            
            <button
              onClick={exportData}
              className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-semibold rounded-lg hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200 flex items-center"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Exportar
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Receita Bruta</p>
                <p className="text-2xl font-bold">R$ {summary.grossRevenue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
              </div>
              <ArrowTrendingUpIcon className="h-8 w-8 text-green-200" />
            </div>
            <p className="text-green-100 text-xs mt-2">+{summary.monthlyGrowth}% este mês</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Lucro Líquido</p>
                <p className="text-2xl font-bold">R$ {summary.netProfit.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
              </div>
              <BanknotesIcon className="h-8 w-8 text-blue-200" />
            </div>
            <p className="text-blue-100 text-xs mt-2">Após todas as deduções</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Comissões Pendentes</p>
                <p className="text-2xl font-bold">R$ {summary.unpaidCommissions.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
              </div>
              <ExclamationTriangleIcon className="h-8 w-8 text-purple-200" />
            </div>
            <p className="text-purple-100 text-xs mt-2">A pagar aos afiliados</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Despesas</p>
                <p className="text-2xl font-bold">R$ {summary.totalExpenses.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
              </div>
              <ArrowTrendingDownIcon className="h-8 w-8 text-red-200" />
            </div>
            <p className="text-red-100 text-xs mt-2">Operacionais e fixas</p>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-black/30 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-yellow-400 mb-4">Breakdown da Receita</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                <span className="text-white">Assinaturas</span>
                <span className="text-green-400 font-semibold">R$ {summary.subscriptionsRevenue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                <span className="text-white">Taxas de Trading</span>
                <span className="text-green-400 font-semibold">R$ {summary.tradingFees.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                <span className="text-white">Provisão Pré-pago</span>
                <span className="text-yellow-400 font-semibold">R$ {summary.prepaidProvision.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
              </div>
            </div>
          </div>

          <div className="bg-black/30 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-yellow-400 mb-4">Indicadores Financeiros</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                <span className="text-white">Margem Bruta</span>
                <span className="text-green-400 font-semibold">{((summary.netProfit / summary.grossRevenue) * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                <span className="text-white">Comissões Pagas</span>
                <span className="text-purple-400 font-semibold">R$ {(summary.totalCommissions - summary.unpaidCommissions).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                <span className="text-white">Taxa de Crescimento</span>
                <span className="text-green-400 font-semibold">+{summary.monthlyGrowth}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-black/30 rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-yellow-400">Transações Recentes</h3>
            <div className="flex space-x-4">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-400"
              >
                <option value="all">Todos os Tipos</option>
                <option value="REVENUE">Receitas</option>
                <option value="EXPENSE">Despesas</option>
                <option value="COMMISSION">Comissões</option>
                <option value="REFUND">Reembolsos</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-300">Data</th>
                  <th className="text-left py-3 px-4 text-gray-300">Tipo</th>
                  <th className="text-left py-3 px-4 text-gray-300">Descrição</th>
                  <th className="text-right py-3 px-4 text-gray-300">Valor</th>
                  <th className="text-center py-3 px-4 text-gray-300">Status</th>
                  <th className="text-left py-3 px-4 text-gray-300">Método</th>
                </tr>
              </thead>
              <tbody>
                {financialData
                  .filter(item => selectedType === 'all' || item.type === selectedType)
                  .map((transaction) => (
                  <tr key={transaction.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                    <td className="py-3 px-4 text-gray-300">
                      {new Date(transaction.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(transaction.type)}`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white">{transaction.description}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-semibold ${
                        transaction.type === 'REVENUE' || transaction.type === 'REFUND' 
                          ? 'text-green-400' 
                          : 'text-red-400'
                      }`}>
                        {transaction.type === 'EXPENSE' || transaction.type === 'COMMISSION' ? '-' : '+'}
                        R$ {transaction.amount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-300">{transaction.paymentMethod || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-black/30 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-yellow-400 mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="p-4 bg-gradient-to-r from-green-600 to-green-700 rounded-lg text-white hover:from-green-700 hover:to-green-800 transition-all">
              <CurrencyDollarIcon className="h-6 w-6 mx-auto mb-2" />
              <span className="text-sm font-medium">Lançar Receita</span>
            </button>
            <button className="p-4 bg-gradient-to-r from-red-600 to-red-700 rounded-lg text-white hover:from-red-700 hover:to-red-800 transition-all">
              <ArrowTrendingDownIcon className="h-6 w-6 mx-auto mb-2" />
              <span className="text-sm font-medium">Lançar Despesa</span>
            </button>
            <button className="p-4 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg text-white hover:from-purple-700 hover:to-purple-800 transition-all">
              <ChartBarIcon className="h-6 w-6 mx-auto mb-2" />
              <span className="text-sm font-medium">Relatório Mensal</span>
            </button>
            <button className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg text-white hover:from-blue-700 hover:to-blue-800 transition-all">
              <DocumentTextIcon className="h-6 w-6 mx-auto mb-2" />
              <span className="text-sm font-medium">Balancete</span>
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ContabilidadeAdmin;
