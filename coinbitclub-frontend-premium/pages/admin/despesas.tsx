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
import { expenseService, downloadFile } from '../../src/services/api';
import { useNotifications } from '../../src/contexts/NotificationContext.simple';
import { expenseValidator, useFormValidation } from '../../src/utils/validation';

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
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'Infraestrutura',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'PIX',
    status: 'COMPLETED',
    notes: '',
    isSubscription: false,
    subscriptionType: 'monthly',
    nextDueDate: ''
  });
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Hooks de integração
  const { addNotification } = useNotifications();
  const { validateForm, getFieldError } = useFormValidation(expenseValidator, 
    (isValid, errors) => setValidationErrors(errors)
  );

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
    'Tecnologia',
    'Jurídico',
    'Contabilidade',
    'Operacional',
    'Outros'
  ];

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      
      // Integração real com API
      const data = await expenseService.getAll({
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        search: searchTerm || undefined
      });
      
      setExpenses(data);
      
      addNotification({
        type: 'success',
        title: 'Despesas Carregadas',
        message: `${data.length} despesas carregadas com sucesso`,
        duration: 3000
      });
    } catch (error) {
      console.error('Erro ao carregar despesas:', error);
      addNotification({
        type: 'error',
        title: 'Erro ao Carregar',
        message: 'Não foi possível carregar as despesas. Usando dados locais.',
        duration: 5000
      });
      
      // Fallback para dados mock se a API falhar
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
        }
      ];
      
      setExpenses(mockExpenses);
    } finally {
      setLoading(false);
    }
  };

  const deleteExpense = async (expenseId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta despesa?')) return;
    
    try {
      await expenseService.delete(expenseId);
      setExpenses(prev => prev.filter(expense => expense.id !== expenseId));
      
      addNotification({
        type: 'success',
        title: 'Despesa Excluída',
        message: 'A despesa foi removida com sucesso',
        duration: 3000
      });
    } catch (error) {
      console.error('Erro ao excluir despesa:', error);
      addNotification({
        type: 'error',
        title: 'Erro ao Excluir',
        message: 'Não foi possível excluir a despesa. Tente novamente.',
        duration: 5000
      });
    }
  };

  const handleCancelSubscription = async (expenseId: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta assinatura? As próximas renovações serão interrompidas.')) return;
    
    try {
      await expenseService.cancelSubscription(expenseId);
      
      setExpenses(prev => prev.map(expense => 
        expense.id === expenseId 
          ? { ...expense, subscriptionActive: false, nextDueDate: undefined }
          : expense
      ));
      
      addNotification({
        type: 'warning',
        title: 'Assinatura Cancelada',
        message: 'A assinatura foi cancelada com sucesso',
        duration: 4000
      });
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      addNotification({
        type: 'error',
        title: 'Erro ao Cancelar',
        message: 'Não foi possível cancelar a assinatura. Tente novamente.',
        duration: 5000
      });
    }
  };

  const exportExpenses = async () => {
    try {
      addNotification({
        type: 'info',
        title: 'Gerando Exportação',
        message: 'Preparando arquivo CSV das despesas...',
        duration: 2000
      });

      const blob = await expenseService.exportCsv({
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        search: searchTerm || undefined
      });
      
      const filename = `despesas_${new Date().toISOString().split('T')[0]}.csv`;
      downloadFile(blob, filename);
      
      addNotification({
        type: 'success',
        title: 'Exportação Concluída',
        message: 'Arquivo CSV foi baixado com sucesso',
        duration: 4000
      });
    } catch (error) {
      console.error('Erro ao exportar:', error);
      
      // Fallback para exportação manual
      const csvContent = "data:text/csv;charset=utf-8," + 
        "Descrição,Valor,Categoria,Data,Método de Pagamento,Status,Observações,Tipo,Próx. Vencimento\n" +
        filteredExpenses.map(expense => 
          `"${expense.description}","R$ ${expense.amount.toFixed(2)}","${expense.category}","${expense.date}","${expense.paymentMethod}","${expense.status}","${expense.notes || ''}","${expense.isSubscription ? expense.subscriptionType : 'Única'}","${expense.nextDueDate || ''}"`
        ).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `despesas_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      addNotification({
        type: 'success',
        title: 'Exportação Local',
        message: 'Arquivo CSV foi gerado localmente',
        duration: 4000
      });
    }
  };

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateForm({
      ...formData,
      amount: parseFloat(formData.amount) || 0
    });
    
    if (!validation.isValid) {
      addNotification({
        type: 'error',
        title: 'Dados Inválidos',
        message: 'Por favor, corrija os erros no formulário antes de continuar',
        duration: 5000
      });
      return;
    }

    try {
      setSubmitting(true);
      
      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount),
        nextDueDate: formData.isSubscription && formData.nextDueDate ? formData.nextDueDate : undefined
      };

      if (editingExpense) {
        await expenseService.update(editingExpense.id, expenseData);
        setExpenses(prev => prev.map(exp => 
          exp.id === editingExpense.id 
            ? { ...exp, ...expenseData } 
            : exp
        ));
        
        addNotification({
          type: 'success',
          title: 'Despesa Atualizada',
          message: 'A despesa foi atualizada com sucesso',
          duration: 4000
        });
      } else {
        const newExpense = await expenseService.create(expenseData);
        setExpenses(prev => [newExpense, ...prev]);
        
        addNotification({
          type: 'success',
          title: 'Despesa Criada',
          message: 'Nova despesa foi adicionada com sucesso',
          duration: 4000
        });
      }

      // Reset form
      setFormData({
        description: '',
        amount: '',
        category: 'Infraestrutura',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'PIX',
        status: 'COMPLETED',
        notes: '',
        isSubscription: false,
        subscriptionType: 'monthly',
        nextDueDate: ''
      });
      setShowExpenseModal(false);
      setEditingExpense(null);
      
    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
      addNotification({
        type: 'error',
        title: 'Erro ao Salvar',
        message: 'Não foi possível salvar a despesa. Tente novamente.',
        duration: 5000
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      date: expense.date,
      paymentMethod: expense.paymentMethod,
      status: expense.status,
      notes: expense.notes || '',
      isSubscription: expense.isSubscription || false,
      subscriptionType: expense.subscriptionType || 'monthly',
      nextDueDate: expense.nextDueDate || ''
    });
    setShowExpenseModal(true);
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
  const subscriptionExpenses = filteredExpenses.filter(e => e.isSubscription && e.subscriptionActive).length;
  const expensesByCategory = categories.map(cat => ({
    category: cat,
    total: filteredExpenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0)
  })).filter(item => item.total > 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'px-2 py-1 bg-green-900/50 text-green-300 rounded text-xs';
      case 'PENDING':
        return 'px-2 py-1 bg-yellow-900/50 text-yellow-300 rounded text-xs';
      case 'CANCELLED':
        return 'px-2 py-1 bg-red-900/50 text-red-300 rounded text-xs';
      default:
        return 'px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs';
    }
  };

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
    <AdminLayout>
      <Head>
        <title>Gestão de Despesas - CoinBit Club</title>
      </Head>

      <div className="min-h-screen p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <TrendingDownIcon className="w-8 h-8 text-red-400" />
                <div>
                  <h1 className="text-3xl font-bold text-white">Gestão de Despesas</h1>
                  <p className="text-gray-400">Controle completo de gastos operacionais</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={exportExpenses}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
                >
                  <DocumentArrowDownIcon className="w-5 h-5" />
                  Exportar CSV
                </button>
                <button
                  onClick={() => setShowExpenseModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-500 transition-colors"
                >
                  <PlusIcon className="w-5 h-5" />
                  Nova Despesa
                </button>
              </div>
            </div>
          </div>

          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div style={cardStyle}>
              <div className="flex items-center gap-4">
                <BanknotesIcon className="w-8 h-8 text-red-400" />
                <div>
                  <p className="text-gray-400 text-sm">Total Despesas</p>
                  <p className="text-2xl font-bold text-red-400">
                    R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-gray-400">{filteredExpenses.length} lançamentos</p>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <div className="flex items-center gap-4">
                <CalendarIcon className="w-8 h-8 text-green-400" />
                <div>
                  <p className="text-gray-400 text-sm">Concluídas</p>
                  <p className="text-2xl font-bold text-green-400">{completedExpenses}</p>
                  <p className="text-sm text-gray-400">de {filteredExpenses.length} total</p>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <div className="flex items-center gap-4">
                <svg className="w-8 h-8 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-gray-400 text-sm">Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-400">{pendingExpenses}</p>
                  <p className="text-sm text-gray-400">aguardando pagamento</p>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <div className="flex items-center gap-4">
                <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-gray-400 text-sm">Assinaturas Ativas</p>
                  <p className="text-2xl font-bold text-blue-400">{subscriptionExpenses}</p>
                  <p className="text-sm text-gray-400">renovações automáticas</p>
                </div>
              </div>
            </div>
          </div>

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
              <table className="w-full">
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
                            onClick={() => openEditModal(expense)}
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
                <p className="text-gray-500">Não há despesas para os filtros selecionados.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Nova Despesa */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-2xl border border-yellow-500/30">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                {editingExpense ? 'Editar Despesa' : 'Nova Despesa'}
              </h3>
              <button
                onClick={() => {
                  setShowExpenseModal(false);
                  setEditingExpense(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmitExpense} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Descrição *</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${
                      getFieldError('description', validationErrors) ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="Ex: Licença Software..."
                  />
                  {getFieldError('description', validationErrors) && (
                    <p className="text-red-400 text-xs mt-1">{getFieldError('description', validationErrors)}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Valor *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${
                      getFieldError('amount', validationErrors) ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="0,00"
                  />
                  {getFieldError('amount', validationErrors) && (
                    <p className="text-red-400 text-xs mt-1">{getFieldError('amount', validationErrors)}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Categoria *</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Data *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${
                      getFieldError('date', validationErrors) ? 'border-red-500' : 'border-gray-600'
                    }`}
                  />
                  {getFieldError('date', validationErrors) && (
                    <p className="text-red-400 text-xs mt-1">{getFieldError('date', validationErrors)}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Método de Pagamento *</label>
                  <select 
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  >
                    <option value="PIX">PIX</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="TED">TED</option>
                    <option value="Boleto">Boleto</option>
                    <option value="Dinheiro">Dinheiro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Status *</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  >
                    <option value="COMPLETED">Concluída</option>
                    <option value="PENDING">Pendente</option>
                    <option value="CANCELLED">Cancelada</option>
                  </select>
                </div>
              </div>

              {/* Assinatura */}
              <div className="border-t border-gray-700 pt-4">
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="isSubscription"
                    checked={formData.isSubscription}
                    onChange={(e) => setFormData(prev => ({ ...prev, isSubscription: e.target.checked }))}
                    className="mr-2 rounded border-gray-600 bg-gray-700 text-yellow-500 focus:ring-yellow-500"
                  />
                  <label htmlFor="isSubscription" className="text-sm font-medium text-gray-300">
                    Despesa por Assinatura (Recorrente)
                  </label>
                </div>
                
                {formData.isSubscription && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Recorrência</label>
                      <select 
                        value={formData.subscriptionType}
                        onChange={(e) => setFormData(prev => ({ ...prev, subscriptionType: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      >
                        <option value="monthly">Mensal</option>
                        <option value="quarterly">Trimestral</option>
                        <option value="yearly">Anual</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Próximo Vencimento</label>
                      <input
                        type="date"
                        value={formData.nextDueDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, nextDueDate: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Observações</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${
                    getFieldError('notes', validationErrors) ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="Observações adicionais..."
                />
                {getFieldError('notes', validationErrors) && (
                  <p className="text-red-400 text-xs mt-1">{getFieldError('notes', validationErrors)}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowExpenseModal(false);
                    setEditingExpense(null);
                    setFormData({
                      description: '',
                      amount: '',
                      category: 'Infraestrutura',
                      date: new Date().toISOString().split('T')[0],
                      paymentMethod: 'PIX',
                      status: 'COMPLETED',
                      notes: '',
                      isSubscription: false,
                      subscriptionType: 'monthly',
                      nextDueDate: ''
                    });
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || validationErrors.length > 0}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  {editingExpense ? 'Atualizar' : 'Salvar'} Despesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ExpensesManagement;
