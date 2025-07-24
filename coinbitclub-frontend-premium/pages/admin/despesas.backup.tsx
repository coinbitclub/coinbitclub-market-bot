import { NextPage } from 'next';
import Head from 'next/head';
import React, { useState, useEffect } from 'react';
import {
  ArrowTrendingDownIcon as TrendingDownIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  BanknotesIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import AdminLayout from '../../src/components/AdminLayout';

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  paymentMethod: string;
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
  createdBy: string;
  notes?: string;
  isSubscription?: boolean;
  subscriptionType?: 'monthly' | 'quarterly' | 'yearly';
  nextDueDate?: string;
  originalSubscriptionId?: string;
  subscriptionActive?: boolean;
}

const ExpensesManagement: NextPage = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('month');
  const [typeFilter, setTypeFilter] = useState<string>('all'); // all, subscription, one-time, upcoming
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const cardStyle = {
    background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(17, 17, 17, 0.9))',
    border: '1px solid rgba(255, 215, 0, 0.3)',
    borderRadius: '16px',
    padding: '1.5rem',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 0 20px rgba(255, 215, 0, 0.1)',
  };

  const categories = [
    'Infraestrutura',
    'Marketing',
    'Pessoal',
    'Jurídico',
    'Contabilidade',
    'Tecnologia',
    'Operacional',
    'Outros'
  ];

  useEffect(() => {
    fetchExpenses();
  }, [dateFilter]);

  const fetchExpenses = async () => {
    try {
      // Mock data - integração real será feita aqui
      const mockExpenses: Expense[] = [
        {
          id: '1',
          description: 'Servidor AWS - Janeiro',
          amount: 450.00,
          category: 'Infraestrutura',
          date: '2024-01-15',
          paymentMethod: 'Cartão de Crédito',
          status: 'COMPLETED',
          createdBy: 'Admin',
          notes: 'Pagamento mensal do servidor principal',
          isSubscription: true,
          subscriptionType: 'monthly',
          nextDueDate: '2024-02-15',
          subscriptionActive: true
        },
        {
          id: '2',
          description: 'Marketing Google Ads',
          amount: 1200.00,
          category: 'Marketing',
          date: '2024-01-18',
          paymentMethod: 'PIX',
          status: 'COMPLETED',
          createdBy: 'Admin',
          notes: 'Campanha de aquisição Q1'
        },
        {
          id: '3',
          description: 'Salário - João Silva',
          amount: 5000.00,
          category: 'Pessoal',
          date: '2024-01-20',
          paymentMethod: 'TED',
          status: 'COMPLETED',
          createdBy: 'Admin',
          isSubscription: true,
          subscriptionType: 'monthly',
          nextDueDate: '2024-02-20',
          subscriptionActive: true
        },
        {
          id: '4',
          description: 'Licença Software Analytics',
          amount: 299.99,
          category: 'Tecnologia',
          date: '2024-01-22',
          paymentMethod: 'Cartão de Crédito',
          status: 'PENDING',
          createdBy: 'Admin',
          isSubscription: true,
          subscriptionType: 'monthly',
          nextDueDate: '2024-02-22',
          subscriptionActive: true
        },
        {
          id: '5',
          description: 'Consultoria Jurídica',
          amount: 800.00,
          category: 'Jurídico',
          date: '2024-01-19',
          paymentMethod: 'PIX',
          status: 'COMPLETED',
          createdBy: 'Admin'
        },
        {
          id: '6',
          description: 'Netflix Empresarial',
          amount: 45.90,
          category: 'Tecnologia',
          date: '2024-01-10',
          paymentMethod: 'Cartão de Crédito',
          status: 'COMPLETED',
          createdBy: 'Admin',
          isSubscription: true,
          subscriptionType: 'monthly',
          nextDueDate: '2024-02-10',
          subscriptionActive: true
        },
        {
          id: '7',
          description: 'Office 365 - Licenças Anuais',
          amount: 1200.00,
          category: 'Tecnologia',
          date: '2024-01-01',
          paymentMethod: 'Cartão de Crédito',
          status: 'COMPLETED',
          createdBy: 'Admin',
          isSubscription: true,
          subscriptionType: 'yearly',
          nextDueDate: '2025-01-01',
          subscriptionActive: true
        }
      ];
      
      setExpenses(mockExpenses);
    } catch (error) {
      console.error('Erro ao carregar despesas:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteExpense = async (expenseId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta despesa?')) return;
    
    try {
      setExpenses(prev => prev.filter(expense => expense.id !== expenseId));
    } catch (error) {
      console.error('Erro ao excluir despesa:', error);
    }
  };

  const handleCancelSubscription = async (expenseId: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta assinatura? As próximas renovações serão interrompidas.')) return;
    
    try {
      setExpenses(prev => prev.map(expense => 
        expense.id === expenseId 
          ? { ...expense, subscriptionActive: false, nextDueDate: undefined }
          : expense
      ));
      
      // Aqui seria feita a integração real com a API
      console.log('Assinatura cancelada:', expenseId);
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
    }
  };

  const exportExpenses = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Descrição,Valor,Categoria,Data,Método de Pagamento,Status,Observações\n" +
      filteredExpenses.map(expense => 
        `"${expense.description}","R$ ${expense.amount.toFixed(2)}","${expense.category}","${expense.date}","${expense.paymentMethod}","${expense.status}","${expense.notes || ''}"`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `despesas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 rounded text-xs font-medium';
    switch (status) {
      case 'COMPLETED': return `${baseClasses} bg-green-900/50 text-green-300 border border-green-700`;
      case 'PENDING': return `${baseClasses} bg-yellow-900/50 text-yellow-300 border border-yellow-700`;
      case 'CANCELLED': return `${baseClasses} bg-red-900/50 text-red-300 border border-red-700`;
      default: return `${baseClasses} bg-gray-900/50 text-gray-300 border border-gray-700`;
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    // Filtro por categoria
    if (categoryFilter !== 'all' && expense.category !== categoryFilter) return false;
    
    // Filtro por busca textual
    if (searchTerm && !expense.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !expense.category.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    
    // Filtro por tipo de despesa
    if (typeFilter !== 'all') {
      if (typeFilter === 'subscription' && !expense.isSubscription) return false;
      if (typeFilter === 'one-time' && expense.isSubscription) return false;
      if (typeFilter === 'upcoming') {
        // Despesas a vencer nos próximos 30 dias
        if (!expense.nextDueDate) return false;
        const today = new Date();
        const dueDate = new Date(expense.nextDueDate);
        const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
        if (daysDiff < 0 || daysDiff > 30) return false;
      }
    }
    
    return true;
  });

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const completedExpenses = filteredExpenses.filter(e => e.status === 'COMPLETED').length;
  const pendingExpenses = filteredExpenses.filter(e => e.status === 'PENDING').length;
  const expensesByCategory = categories.map(cat => ({
    category: cat,
    total: filteredExpenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0)
  })).filter(item => item.total > 0);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
            <p className="text-white">Carregando despesas...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Gestão de Despesas - Administração CoinBitClub</title>
      </Head>
      
      <AdminLayout title="Despesas">
        <div className="min-h-screen" style={{ 
          background: 'linear-gradient(135deg, #000000 0%, #111111 100%)',
          color: '#FFFFFF',
          fontFamily: "'Inter', sans-serif"
        }}>
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2" style={{
                  background: 'linear-gradient(45deg, #FFD700, #FF69B4)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Gestão de Despesas
                </h1>
                <p className="text-gray-400">Controle detalhado de todas as despesas da empresa</p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={exportExpenses}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                >
                  <DocumentArrowDownIcon className="w-5 h-5" />
                  Exportar
                </button>
                <button
                  onClick={() => setShowExpenseModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
                >
                  <PlusIcon className="w-5 h-5" />
                  Nova Despesa
                </button>
              </div>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div style={cardStyle}>
              <h3 className="text-lg font-semibold mb-2 text-red-400">Total de Despesas</h3>
              <p className="text-2xl font-bold text-white">R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p className="text-sm text-gray-400">{filteredExpenses.length} lançamentos</p>
            </div>
            
            <div style={cardStyle}>
              <h3 className="text-lg font-semibold mb-2 text-green-400">Pagas</h3>
              <p className="text-2xl font-bold text-white">{completedExpenses}</p>
              <p className="text-sm text-gray-400">Despesas concluídas</p>
            </div>
            
            <div style={cardStyle}>
              <h3 className="text-lg font-semibold mb-2 text-yellow-400">Pendentes</h3>
              <p className="text-2xl font-bold text-white">{pendingExpenses}</p>
              <p className="text-sm text-gray-400">Aguardando pagamento</p>
            </div>
            
            <div style={cardStyle}>
              <h3 className="text-lg font-semibold mb-2 text-purple-400">Média por Despesa</h3>
              <p className="text-2xl font-bold text-white">
                R$ {filteredExpenses.length > 0 ? (totalExpenses / filteredExpenses.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
              </p>
              <p className="text-sm text-gray-400">Valor médio</p>
            </div>
          </div>

          {/* Breakdown por Categoria */}
          {expensesByCategory.length > 0 && (
            <div style={cardStyle} className="mb-8">
              <h3 className="text-xl font-bold mb-4 text-white">Despesas por Categoria</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {expensesByCategory.map((item, index) => (
                  <div key={item.category} className="p-3 bg-gray-800/50 rounded-lg">
                    <p className="text-sm text-gray-300">{item.category}</p>
                    <p className="text-lg font-semibold text-white">R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <p className="text-xs text-gray-400">{((item.total / totalExpenses) * 100).toFixed(1)}%</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filtros */}
          <div style={cardStyle} className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <FunnelIcon className="w-5 h-5 text-yellow-400" />
              <h3 className="text-lg font-semibold text-white">Filtros de Despesas</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Buscar</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Descrição ou categoria..."
                    className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Categoria</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  <option value="all">Todas</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tipo</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  <option value="all">Todas</option>
                  <option value="one-time">Despesas Únicas</option>
                  <option value="subscription">Por Assinatura</option>
                  <option value="upcoming">Despesas a Vencer</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Período</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  <option value="week">Última semana</option>
                  <option value="month">Último mês</option>
                  <option value="quarter">Último trimestre</option>
                  <option value="year">Último ano</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={fetchExpenses}
                  className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-500 transition-colors font-medium"
                >
                  Atualizar
                </button>
              </div>
            </div>

            {/* Indicador de filtro ativo */}
            {typeFilter !== 'all' && (
              <div className="p-3 bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-300">
                  <strong>Filtro ativo:</strong> {
                    typeFilter === 'subscription' ? 'Exibindo apenas despesas por assinatura' :
                    typeFilter === 'upcoming' ? 'Exibindo apenas despesas a vencer nos próximos 30 dias' :
                    typeFilter === 'one-time' ? 'Exibindo apenas despesas únicas (não recorrentes)' :
                    'Todas as despesas'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Tabela de Despesas */}
          <div style={cardStyle}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                Despesas ({filteredExpenses.length})
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-3 text-gray-300">Descrição</th>
                    <th className="text-left p-3 text-gray-300">Categoria</th>
                    <th className="text-left p-3 text-gray-300">Tipo</th>
                    <th className="text-left p-3 text-gray-300">Valor</th>
                    <th className="text-left p-3 text-gray-300">Data</th>
                    <th className="text-left p-3 text-gray-300">Próx. Vencimento</th>
                    <th className="text-left p-3 text-gray-300">Pagamento</th>
                    <th className="text-left p-3 text-gray-300">Status</th>
                    <th className="text-left p-3 text-gray-300">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-3">
                        <div>
                          <p className="text-white font-semibold">{expense.description}</p>
                          {expense.notes && (
                            <p className="text-xs text-gray-400 mt-1">{expense.notes}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-blue-900/50 text-blue-300 rounded text-xs">
                          {expense.category}
                        </span>
                      </td>
                      <td className="p-3">
                        {expense.isSubscription ? (
                          <span className="px-2 py-1 bg-green-900/50 text-green-300 rounded text-xs flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                            </svg>
                            {expense.subscriptionType === 'monthly' ? 'Mensal' : 
                             expense.subscriptionType === 'yearly' ? 'Anual' : 'Trimestral'}
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                            Única
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-red-400 font-semibold">
                        R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-gray-300">
                        {new Date(expense.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-3">
                        {expense.nextDueDate ? (
                          <div>
                            <p className="text-orange-400 text-sm">
                              {new Date(expense.nextDueDate).toLocaleDateString('pt-BR')}
                            </p>
                            <p className="text-xs text-gray-400">
                              {Math.ceil((new Date(expense.nextDueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))} dias
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">-</span>
                        )}
                      </td>
                      <td className="p-3 text-gray-300">
                        {expense.paymentMethod}
                      </td>
                      <td className="p-3">
                        <span className={getStatusBadge(expense.status)}>
                          {expense.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingExpense(expense);
                              setShowExpenseModal(true);
                            }}
                            className="p-1 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
                            title="Editar"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          
                          {expense.isSubscription && expense.subscriptionActive && (
                            <button
                              onClick={() => handleCancelSubscription(expense.id)}
                              className="p-1 bg-orange-600 text-white rounded hover:bg-orange-500 transition-colors"
                              title="Cancelar Assinatura"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                              </svg>
                            </button>
                          )}
                          
                          <button
                            onClick={() => deleteExpense(expense.id)}
                            className="p-1 bg-red-600 text-white rounded hover:bg-red-500 transition-colors"
                            title="Excluir"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredExpenses.length === 0 && (
              <div className="text-center py-8">
                <BanknotesIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">Nenhuma despesa encontrada</h3>
                <p className="text-gray-500">Não há despesas para os filtros selecionados.</p>
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </>
  );
};

export default ExpensesManagement;
