/**
 * Sistema de Créditos de Teste - Área Administrativa
 * Permite liberação e controle de créditos de teste para usuários
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../src/components/AdminLayout';
import { 
  FiSearch, FiFilter, FiPlus, FiEdit, FiTrash2, FiEye, FiDownload,
  FiDollarSign, FiTrendingUp, FiZap, FiGift, FiUser,
  FiCheck, FiX as FiCancel, FiCopy, FiSave, FiAlertCircle
} from 'react-icons/fi';

// Tipos para TypeScript
interface TestCreditUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface TestCredit {
  id: string;
  user: TestCreditUser;
  amount: number;
  currency: 'USD' | 'BRL';
  type: TestCreditType;
  status: TestCreditStatus;
  description?: string;
  createdAt: string;
  expiresAt: string;
  usedAt?: string;
  revokedAt?: string;
  createdBy: string;
}

type TestCreditType = 'INDIVIDUAL' | 'BULK' | 'PROMOTIONAL';
type TestCreditStatus = 'ATIVO' | 'USADO' | 'EXPIRADO' | 'REVOGADO';

// Dados mock para desenvolvimento
const MOCK_TEST_CREDITS: TestCredit[] = [
  {
    id: 'tc-001',
    user: {
      id: 'u-001',
      name: 'João Silva',
      email: 'joao@email.com'
    },
    amount: 100,
    currency: 'USD',
    type: 'INDIVIDUAL',
    status: 'ATIVO',
    description: 'Crédito de teste para avaliação da plataforma',
    createdAt: '2024-01-15T10:30:00Z',
    expiresAt: '2024-02-15T10:30:00Z',
    createdBy: 'admin'
  },
  {
    id: 'tc-002',
    user: {
      id: 'u-002',
      name: 'Maria Santos',
      email: 'maria@email.com'
    },
    amount: 250,
    currency: 'USD',
    type: 'PROMOTIONAL',
    status: 'USADO',
    description: 'Promoção de boas-vindas',
    createdAt: '2024-01-10T14:20:00Z',
    expiresAt: '2024-02-10T14:20:00Z',
    usedAt: '2024-01-20T16:45:00Z',
    createdBy: 'admin'
  },
  {
    id: 'tc-003',
    user: {
      id: 'u-003',
      name: 'Carlos Oliveira',
      email: 'carlos@email.com'
    },
    amount: 50,
    currency: 'USD',
    type: 'INDIVIDUAL',
    status: 'EXPIRADO',
    description: 'Teste de funcionalidades',
    createdAt: '2023-12-01T09:15:00Z',
    expiresAt: '2024-01-01T09:15:00Z',
    createdBy: 'admin'
  }
];

/**
 * Componente principal da página de créditos de teste
 */
const TestCreditsPage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [testCredits, setTestCredits] = useState<TestCredit[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<TestCredit | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'ativo' | 'usado' | 'expirado'>('todos');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sortBy, setSortBy] = useState<'createdAt' | 'amount' | 'expiresAt'>('createdAt');
  const [selectedCredits, setSelectedCredits] = useState<string[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [creditToDelete, setCreditToDelete] = useState<TestCredit | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isRevokingCredit, setIsRevokingCredit] = useState(false);
  const [creditToRevoke, setCreditToRevoke] = useState<TestCredit | null>(null);
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    amount: 100,
    type: 'INDIVIDUAL' as TestCreditType,
    description: '',
    expiresAt: ''
  });

  // Estados para estatísticas
  const [stats, setStats] = useState({
    totalCredits: 0,
    activeCredits: 0,
    usedCredits: 0,
    expiredCredits: 0,
    totalAmount: 0,
    totalUsedAmount: 0
  });

  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  /**
   * Buscar dados dos créditos de teste
   */
  const fetchTestCredits = async () => {
    try {
      setLoading(true);
      
      // TODO: Substituir por chamada real da API
      const response = await fetch('/api/admin/test-credits');
      if (response.ok) {
        const data = await response.json();
        setTestCredits(data.credits || []);
        setStats(data.stats || stats);
      } else {
        // Fallback com dados mock para desenvolvimento
        setTimeout(() => {
          setTestCredits(MOCK_TEST_CREDITS);
          calculateStats(MOCK_TEST_CREDITS);
        }, 1000);
      }
    } catch (error) {
      console.error('Erro ao buscar créditos de teste:', error);
      // Fallback com dados mock
      setTestCredits(MOCK_TEST_CREDITS);
      calculateStats(MOCK_TEST_CREDITS);
    } finally {
      setLoading(false);
      setIsStatsLoading(false);
      setLastUpdate(new Date());
    }
  };

  /**
   * Calcular estatísticas dos créditos
   */
  const calculateStats = (credits: TestCredit[]) => {
    const now = new Date();
    
    const activeCredits = credits.filter(c => c.status === 'ATIVO');
    const usedCredits = credits.filter(c => c.status === 'USADO');
    const expiredCredits = credits.filter(c => c.status === 'EXPIRADO' || new Date(c.expiresAt) < now);
    
    setStats({
      totalCredits: credits.length,
      activeCredits: activeCredits.length,
      usedCredits: usedCredits.length,
      expiredCredits: expiredCredits.length,
      totalAmount: credits.reduce((sum, c) => sum + c.amount, 0),
      totalUsedAmount: usedCredits.reduce((sum, c) => sum + c.amount, 0)
    });
  };

  useEffect(() => {
    fetchTestCredits();
  }, []);

  /**
   * Filtrar créditos baseado na pesquisa e filtros
   */
  const filteredCredits = testCredits
    .filter(credit => {
      const matchesSearch = 
        credit.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        credit.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        credit.id.includes(searchTerm);
      
      const matchesStatus = filterStatus === 'todos' || credit.status.toLowerCase() === filterStatus;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'expiresAt':
          comparison = new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
          break;
        case 'createdAt':
        default:
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  /**
   * Criar novo crédito de teste
   */
  const handleCreateCredit = async () => {
    try {
      // TODO: Implementar chamada real da API
      const response = await fetch('/api/admin/test-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchTestCredits();
        setIsCreateModalOpen(false);
        setFormData({
          userId: '',
          amount: 100,
          type: 'INDIVIDUAL',
          description: '',
          expiresAt: ''
        });
      } else {
        console.error('Erro ao criar crédito de teste');
      }
    } catch (error) {
      console.error('Erro ao criar crédito de teste:', error);
    }
  };

  /**
   * Editar crédito existente
   */
  const handleEditCredit = async () => {
    if (!selectedCredit) return;

    try {
      const response = await fetch(`/api/admin/test-credits/${selectedCredit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchTestCredits();
        setIsEditModalOpen(false);
        setSelectedCredit(null);
      }
    } catch (error) {
      console.error('Erro ao editar crédito:', error);
    }
  };

  /**
   * Deletar crédito
   */
  const handleDeleteCredit = async (creditId: string) => {
    try {
      const response = await fetch(`/api/admin/test-credits/${creditId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchTestCredits();
        setIsDeleteModalOpen(false);
        setCreditToDelete(null);
      }
    } catch (error) {
      console.error('Erro ao deletar crédito:', error);
    }
  };

  /**
   * Revogar crédito
   */
  const handleRevokeCredit = async (creditId: string) => {
    try {
      setIsRevokingCredit(true);
      
      const response = await fetch(`/api/admin/test-credits/${creditId}/revoke`, {
        method: 'PATCH'
      });

      if (response.ok) {
        await fetchTestCredits();
        setIsRevokeModalOpen(false);
        setCreditToRevoke(null);
      }
    } catch (error) {
      console.error('Erro ao revogar crédito:', error);
    } finally {
      setIsRevokingCredit(false);
    }
  };

  /**
   * Exportar dados
   */
  const handleExportData = () => {
    const csvContent = [
      ['ID', 'Usuário', 'Email', 'Valor', 'Tipo', 'Status', 'Criado em', 'Expira em', 'Usado em'].join(','),
      ...filteredCredits.map(credit => [
        credit.id,
        credit.user.name,
        credit.user.email,
        credit.amount,
        credit.type,
        credit.status,
        new Date(credit.createdAt).toLocaleDateString('pt-BR'),
        new Date(credit.expiresAt).toLocaleDateString('pt-BR'),
        credit.usedAt ? new Date(credit.usedAt).toLocaleDateString('pt-BR') : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `creditos-teste-${new Date().getTime()}.csv`;
    a.click();
  };

  /**
   * Formatar status para exibição
   */
  const getStatusBadge = (status: TestCreditStatus) => {
    const styles = {
      ATIVO: 'bg-green-100 text-green-800 border-green-200',
      USADO: 'bg-blue-100 text-blue-800 border-blue-200',
      EXPIRADO: 'bg-red-100 text-red-800 border-red-200',
      REVOGADO: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    const labels = {
      ATIVO: 'Ativo',
      USADO: 'Usado',
      EXPIRADO: 'Expirado',
      REVOGADO: 'Revogado'
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  /**
   * Formatação de moeda
   */
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  /**
   * Formatação de data
   */
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      // Verifica se a data é válida
      if (isNaN(date.getTime())) {
        return 'Data inválida';
      }
      
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data inválida';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiGift className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:leading-9 sm:truncate">
                  Créditos de Teste
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Gerencie e distribua créditos de teste para usuários da plataforma
                </p>
              </div>
            </div>
          </div>
          <div className="mt-6 flex space-x-3 md:mt-0 md:ml-4">
            <button
              onClick={handleExportData}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FiDownload className="mr-2 h-4 w-4" />
              Exportar
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FiPlus className="mr-2 h-4 w-4" />
              Novo Crédito
            </button>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FiDollarSign className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total de Créditos
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {isStatsLoading ? '...' : stats.totalCredits}
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
                  <FiZap className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Créditos Ativos
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {isStatsLoading ? '...' : stats.activeCredits}
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
                  <FiTrendingUp className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Valor Total
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {isStatsLoading ? '...' : formatCurrency(stats.totalAmount)}
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
                  <FiCheck className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Valor Utilizado
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {isStatsLoading ? '...' : formatCurrency(stats.totalUsedAmount)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and search */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="sm:flex sm:items-center sm:justify-between">
              <div className="flex flex-1 items-center">
                <div className="max-w-lg w-full lg:max-w-xs">
                  <label htmlFor="search" className="sr-only">
                    Buscar
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiSearch className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="search"
                      name="search"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Buscar por usuário, email ou ID..."
                      type="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="ml-4">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="todos">Todos os Status</option>
                    <option value="ativo">Ativos</option>
                    <option value="usado">Usados</option>
                    <option value="expirado">Expirados</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Credits table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Lista de Créditos de Teste
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {filteredCredits.length} créditos encontrados
            </p>
          </div>
          {loading ? (
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredCredits.map((credit) => (
                <li key={credit.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <FiUser className="h-5 w-5 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900">
                            {credit.user.name}
                          </p>
                          <div className="ml-2">
                            {getStatusBadge(credit.status)}
                          </div>
                        </div>
                        <p className="text-sm text-gray-500">{credit.user.email}</p>
                        <p className="text-xs text-gray-400">
                          {credit.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(credit.amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Criado: {formatDate(credit.createdAt)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Expira: {formatDate(credit.expiresAt)}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedCredit(credit);
                            setFormData({
                              userId: credit.user.id,
                              amount: credit.amount,
                              type: credit.type,
                              description: credit.description || '',
                              expiresAt: (credit.expiresAt || '').split('T')[0] || ''
                            });
                            setIsEditModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <FiEdit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setCreditToDelete(credit);
                            setIsDeleteModalOpen(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Create Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                      <FiPlus className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Criar Novo Crédito de Teste
                      </h3>
                      <div className="mt-4 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Valor (USD)
                          </label>
                          <input
                            type="number"
                            value={formData.amount}
                            onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Tipo
                          </label>
                          <select
                            value={formData.type}
                            onChange={(e) => setFormData({...formData, type: e.target.value as TestCreditType})}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          >
                            <option value="INDIVIDUAL">Individual</option>
                            <option value="BULK">Em Lote</option>
                            <option value="PROMOTIONAL">Promocional</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Descrição
                          </label>
                          <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            rows={3}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Data de Expiração
                          </label>
                          <input
                            type="date"
                            value={formData.expiresAt}
                            onChange={(e) => setFormData({...formData, expiresAt: e.target.value})}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={handleCreateCredit}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Criar Crédito
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {isDeleteModalOpen && creditToDelete && (
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <FiAlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Deletar Crédito de Teste
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Tem certeza de que deseja deletar o crédito de teste para {creditToDelete.user.name}? 
                          Esta ação não pode ser desfeita.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={() => handleDeleteCredit(creditToDelete.id)}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Deletar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDeleteModalOpen(false);
                      setCreditToDelete(null);
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default TestCreditsPage;
