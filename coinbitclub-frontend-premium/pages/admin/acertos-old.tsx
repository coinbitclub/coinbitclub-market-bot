import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  ClockIcon,
  XCircleIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  EyeIcon,
  FunnelIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import AdminLayout from '../../src/components/AdminLayout';

interface Commission {
  id: string;
  affiliateId: string;
  affiliateName: string;
  affiliateEmail: string;
  userId: string;
  userName: string;
  userEmail: string;
  commissionType: 'SUBSCRIPTION' | 'RENEWAL' | 'UPGRADE';
  subscriptionPlan: 'BASIC' | 'PREMIUM' | 'VIP';
  baseAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';
  requestDate: string;
  processedDate?: string;
  paymentMethod?: 'PIX' | 'BANK_TRANSFER' | 'CRYPTO';
  paymentDetails?: string;
  notes?: string;
}

const AcertosAdmin: NextPage = () => {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'paid' | 'rejected'>('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const cardStyle = {
    background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(17, 17, 17, 0.9))',
    border: '1px solid rgba(255, 215, 0, 0.3)',
    borderRadius: '16px',
    padding: '1.5rem',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 0 20px rgba(255, 215, 0, 0.1)',
  };

  useEffect(() => {
    fetchCommissions();
  }, []);

  const fetchCommissions = async () => {
    try {
      // Mock data - integração real será feita aqui
      const mockCommissions: Commission[] = [
        {
          id: '1',
          affiliateId: 'AFF001',
          affiliateName: 'João Silva',
          affiliateEmail: 'joao@email.com',
          userId: 'USER001',
          userName: 'Maria Santos',
          userEmail: 'maria@email.com',
          commissionType: 'SUBSCRIPTION',
          subscriptionPlan: 'PREMIUM',
          baseAmount: 197.00,
          commissionRate: 30,
          commissionAmount: 59.10,
          status: 'PENDING',
          requestDate: '2024-01-20 10:30:00',
          paymentMethod: 'PIX',
          paymentDetails: 'joao.silva@email.com'
        },
        {
          id: '2',
          affiliateId: 'AFF002',
          affiliateName: 'Ana Costa',
          affiliateEmail: 'ana@email.com',
          userId: 'USER002',
          userName: 'Pedro Oliveira',
          userEmail: 'pedro@email.com',
          commissionType: 'RENEWAL',
          subscriptionPlan: 'VIP',
          baseAmount: 497.00,
          commissionRate: 25,
          commissionAmount: 124.25,
          status: 'APPROVED',
          requestDate: '2024-01-19 15:20:00',
          processedDate: '2024-01-20 09:15:00',
          paymentMethod: 'BANK_TRANSFER',
          paymentDetails: 'Banco: 001 - Agência: 1234 - Conta: 12345-6'
        },
        {
          id: '3',
          affiliateId: 'AFF003',
          affiliateName: 'Carlos Mendes',
          affiliateEmail: 'carlos@email.com',
          userId: 'USER003',
          userName: 'Julia Ferreira',
          userEmail: 'julia@email.com',
          commissionType: 'UPGRADE',
          subscriptionPlan: 'VIP',
          baseAmount: 300.00,
          commissionRate: 20,
          commissionAmount: 60.00,
          status: 'PAID',
          requestDate: '2024-01-18 11:45:00',
          processedDate: '2024-01-19 14:30:00',
          paymentMethod: 'PIX',
          paymentDetails: 'carlos.mendes@email.com',
          notes: 'Pagamento processado via PIX automaticamente'
        },
        {
          id: '4',
          affiliateId: 'AFF001',
          affiliateName: 'João Silva',
          affiliateEmail: 'joao@email.com',
          userId: 'USER004',
          userName: 'Roberto Lima',
          userEmail: 'roberto@email.com',
          commissionType: 'SUBSCRIPTION',
          subscriptionPlan: 'BASIC',
          baseAmount: 97.00,
          commissionRate: 30,
          commissionAmount: 29.10,
          status: 'REJECTED',
          requestDate: '2024-01-17 16:20:00',
          processedDate: '2024-01-18 10:00:00',
          notes: 'Usuário solicitou reembolso dentro de 24h'
        }
      ];
      
      setCommissions(mockCommissions);
    } catch (error) {
      console.error('Erro ao carregar comissões:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCommissionStatus = async (commissionId: string, newStatus: Commission['status']) => {
    setProcessingId(commissionId);
    try {
      // Aqui seria feita a integração real com a API
      setCommissions(prev => prev.map(comm => 
        comm.id === commissionId 
          ? { 
              ...comm, 
              status: newStatus, 
              processedDate: new Date().toISOString()
            } 
          : comm
      ));
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <ClockIcon className="w-5 h-5 text-yellow-400" />;
      case 'APPROVED':
        return <CheckCircleIcon className="w-5 h-5 text-blue-400" />;
      case 'PAID':
        return <CheckCircleIcon className="w-5 h-5 text-green-400" />;
      case 'REJECTED':
        return <XCircleIcon className="w-5 h-5 text-red-400" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-400';
      case 'APPROVED': return 'text-blue-400';
      case 'PAID': return 'text-green-400';
      case 'REJECTED': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 rounded text-xs font-medium';
    switch (status) {
      case 'PENDING': return `${baseClasses} bg-yellow-900/50 text-yellow-300 border border-yellow-700`;
      case 'APPROVED': return `${baseClasses} bg-blue-900/50 text-blue-300 border border-blue-700`;
      case 'PAID': return `${baseClasses} bg-green-900/50 text-green-300 border border-green-700`;
      case 'REJECTED': return `${baseClasses} bg-red-900/50 text-red-300 border border-red-700`;
      default: return `${baseClasses} bg-gray-900/50 text-gray-300 border border-gray-700`;
    }
  };

  const filteredCommissions = commissions.filter(comm => {
    if (filter !== 'all' && comm.status.toLowerCase() !== filter) return false;
    
    if (dateFilter !== 'all') {
      const requestDate = new Date(comm.requestDate);
      const now = new Date();
      const diffTime = now.getTime() - requestDate.getTime();
      const diffDays = diffTime / (1000 * 3600 * 24);
      
      switch (dateFilter) {
        case 'today':
          if (diffDays > 1) return false;
          break;
        case 'week':
          if (diffDays > 7) return false;
          break;
        case 'month':
          if (diffDays > 30) return false;
          break;
      }
    }
    
    return true;
  });

  const pendingCommissions = commissions.filter(c => c.status === 'PENDING').length;
  const totalPending = commissions
    .filter(c => c.status === 'PENDING')
    .reduce((sum, c) => sum + c.commissionAmount, 0);
  const totalPaid = commissions
    .filter(c => c.status === 'PAID')
    .reduce((sum, c) => sum + c.commissionAmount, 0);
  const totalCommissions = filteredCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
            <p className="text-white">Carregando acertos...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Acertos de Afiliados - Administração CoinBitClub</title>
      </Head>
      
      <AdminLayout title="Acertos">
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
              Acertos de Afiliados
            </h1>
            <p className="text-gray-400">Gestão de comissões e pagamentos de afiliados</p>
          </div>

          {/* Estatísticas Resumidas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div style={cardStyle}>
              <h3 className="text-lg font-semibold mb-2 text-yellow-400">Pendentes</h3>
              <p className="text-2xl font-bold text-white">{pendingCommissions}</p>
              <p className="text-sm text-gray-400">R$ {totalPending.toFixed(2)}</p>
            </div>
            
            <div style={cardStyle}>
              <h3 className="text-lg font-semibold mb-2 text-green-400">Total Pago</h3>
              <p className="text-2xl font-bold text-white">R$ {totalPaid.toFixed(2)}</p>
              <p className="text-sm text-gray-400">Este mês</p>
            </div>
            
            <div style={cardStyle}>
              <h3 className="text-lg font-semibold mb-2 text-blue-400">Total do Filtro</h3>
              <p className="text-2xl font-bold text-white">R$ {totalCommissions.toFixed(2)}</p>
              <p className="text-sm text-gray-400">{filteredCommissions.length} itens</p>
            </div>
            
            <div style={cardStyle}>
              <h3 className="text-lg font-semibold mb-2 text-purple-400">Afiliados Ativos</h3>
              <p className="text-2xl font-bold text-white">
                {new Set(commissions.map(c => c.affiliateId)).size}
              </p>
              <p className="text-sm text-gray-400">Este mês</p>
            </div>
          </div>

          {/* Filtros */}
          <div style={cardStyle} className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <FunnelIcon className="w-5 h-5 text-yellow-400" />
              <h3 className="text-lg font-semibold text-white">Filtros</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  <option value="all">Todos</option>
                  <option value="pending">Pendentes</option>
                  <option value="approved">Aprovados</option>
                  <option value="paid">Pagos</option>
                  <option value="rejected">Rejeitados</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Período</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  <option value="all">Todos</option>
                  <option value="today">Hoje</option>
                  <option value="week">Esta semana</option>
                  <option value="month">Este mês</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabela de Comissões */}
          <div style={cardStyle}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                Comissões ({filteredCommissions.length})
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-3 text-gray-300">Status</th>
                    <th className="text-left p-3 text-gray-300">Afiliado</th>
                    <th className="text-left p-3 text-gray-300">Cliente</th>
                    <th className="text-left p-3 text-gray-300">Plano</th>
                    <th className="text-left p-3 text-gray-300">Tipo</th>
                    <th className="text-left p-3 text-gray-300">Valor Base</th>
                    <th className="text-left p-3 text-gray-300">Comissão</th>
                    <th className="text-left p-3 text-gray-300">Data</th>
                    <th className="text-left p-3 text-gray-300">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCommissions.map((commission) => (
                    <tr key={commission.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(commission.status)}
                          <span className={getStatusBadge(commission.status)}>
                            {commission.status}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="text-white font-semibold">{commission.affiliateName}</p>
                          <p className="text-xs text-gray-400">{commission.affiliateEmail}</p>
                          <p className="text-xs text-gray-500">ID: {commission.affiliateId}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="text-white">{commission.userName}</p>
                          <p className="text-xs text-gray-400">{commission.userEmail}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          commission.subscriptionPlan === 'VIP' ? 'bg-purple-900/50 text-purple-300' :
                          commission.subscriptionPlan === 'PREMIUM' ? 'bg-blue-900/50 text-blue-300' :
                          'bg-gray-900/50 text-gray-300'
                        }`}>
                          {commission.subscriptionPlan}
                        </span>
                      </td>
                      <td className="p-3 text-gray-300">{commission.commissionType}</td>
                      <td className="p-3 text-gray-300">R$ {commission.baseAmount.toFixed(2)}</td>
                      <td className="p-3">
                        <div>
                          <p className="text-green-400 font-semibold">
                            R$ {commission.commissionAmount.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {commission.commissionRate}%
                          </p>
                        </div>
                      </td>
                      <td className="p-3 text-gray-400 text-xs">
                        {new Date(commission.requestDate).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedCommission(commission)}
                            className="flex items-center gap-1 px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
                          >
                            <EyeIcon className="w-4 h-4" />
                            Ver
                          </button>
                          
                          {commission.status === 'PENDING' && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => updateCommissionStatus(commission.id, 'APPROVED')}
                                disabled={processingId === commission.id}
                                className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-500 transition-colors disabled:opacity-50"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => updateCommissionStatus(commission.id, 'REJECTED')}
                                disabled={processingId === commission.id}
                                className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-500 transition-colors disabled:opacity-50"
                              >
                                ✗
                              </button>
                            </div>
                          )}
                          
                          {commission.status === 'APPROVED' && (
                            <button
                              onClick={() => updateCommissionStatus(commission.id, 'PAID')}
                              disabled={processingId === commission.id}
                              className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors disabled:opacity-50"
                            >
                              Pagar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredCommissions.length === 0 && (
              <div className="text-center py-8">
                <CurrencyDollarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">Nenhuma comissão encontrada</h3>
                <p className="text-gray-500">Não há comissões para os filtros selecionados.</p>
              </div>
            )}
          </div>

          {/* Modal de Detalhes */}
          {selectedCommission && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div style={cardStyle} className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Detalhes da Comissão</h3>
                  <button
                    onClick={() => setSelectedCommission(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Informações do Afiliado */}
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <UserGroupIcon className="w-5 h-5 text-yellow-400" />
                      Afiliado
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Nome</label>
                        <p className="text-white">{selectedCommission.affiliateName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">E-mail</label>
                        <p className="text-white">{selectedCommission.affiliateEmail}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">ID do Afiliado</label>
                        <p className="text-white">{selectedCommission.affiliateId}</p>
                      </div>
                    </div>
                  </div>

                  {/* Informações do Cliente */}
                  <div className="border-t border-gray-700 pt-4">
                    <h4 className="text-lg font-semibold text-white mb-3">Cliente</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Nome</label>
                        <p className="text-white">{selectedCommission.userName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">E-mail</label>
                        <p className="text-white">{selectedCommission.userEmail}</p>
                      </div>
                    </div>
                  </div>

                  {/* Detalhes da Comissão */}
                  <div className="border-t border-gray-700 pt-4">
                    <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <CurrencyDollarIcon className="w-5 h-5 text-green-400" />
                      Comissão
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Tipo</label>
                        <p className="text-white">{selectedCommission.commissionType}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Plano</label>
                        <span className={`px-2 py-1 rounded text-sm ${
                          selectedCommission.subscriptionPlan === 'VIP' ? 'bg-purple-900/50 text-purple-300' :
                          selectedCommission.subscriptionPlan === 'PREMIUM' ? 'bg-blue-900/50 text-blue-300' :
                          'bg-gray-900/50 text-gray-300'
                        }`}>
                          {selectedCommission.subscriptionPlan}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Valor Base</label>
                        <p className="text-white">R$ {selectedCommission.baseAmount.toFixed(2)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Taxa de Comissão</label>
                        <p className="text-white">{selectedCommission.commissionRate}%</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Valor da Comissão</label>
                        <p className="text-green-400 text-xl font-bold">
                          R$ {selectedCommission.commissionAmount.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(selectedCommission.status)}
                          <span className={getStatusColor(selectedCommission.status)}>
                            {selectedCommission.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Informações de Pagamento */}
                  {selectedCommission.paymentMethod && (
                    <div className="border-t border-gray-700 pt-4">
                      <h4 className="text-lg font-semibold text-white mb-3">Informações de Pagamento</h4>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Método</label>
                          <p className="text-white">{selectedCommission.paymentMethod}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Detalhes</label>
                          <p className="text-white">{selectedCommission.paymentDetails}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Datas */}
                  <div className="border-t border-gray-700 pt-4">
                    <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5 text-blue-400" />
                      Datas
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Data da Solicitação</label>
                        <p className="text-white">{new Date(selectedCommission.requestDate).toLocaleString('pt-BR')}</p>
                      </div>
                      {selectedCommission.processedDate && (
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Data do Processamento</label>
                          <p className="text-white">{new Date(selectedCommission.processedDate).toLocaleString('pt-BR')}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Observações */}
                  {selectedCommission.notes && (
                    <div className="border-t border-gray-700 pt-4">
                      <h4 className="text-lg font-semibold text-white mb-3">Observações</h4>
                      <p className="text-gray-300 bg-black/30 p-3 rounded-lg">
                        {selectedCommission.notes}
                      </p>
                    </div>
                  )}

                  {/* Ações */}
                  {selectedCommission.status === 'PENDING' && (
                    <div className="border-t border-gray-700 pt-4">
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            updateCommissionStatus(selectedCommission.id, 'APPROVED');
                            setSelectedCommission(null);
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 transition-colors"
                        >
                          Aprovar
                        </button>
                        <button
                          onClick={() => {
                            updateCommissionStatus(selectedCommission.id, 'REJECTED');
                            setSelectedCommission(null);
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500 transition-colors"
                        >
                          Rejeitar
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedCommission.status === 'APPROVED' && (
                    <div className="border-t border-gray-700 pt-4">
                      <button
                        onClick={() => {
                          updateCommissionStatus(selectedCommission.id, 'PAID');
                          setSelectedCommission(null);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
                      >
                        Marcar como Pago
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </>
  );
};

export default AcertosAdmin;
