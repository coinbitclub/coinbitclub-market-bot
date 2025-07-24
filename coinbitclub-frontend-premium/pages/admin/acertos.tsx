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
  CalendarIcon,
  BanknotesIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import AdminLayout from '../../src/components/AdminLayout';

interface Commission {
  id: string;
  affiliateId: string;
  affiliateName: string;
  affiliateEmail: string;
  affiliateType: 'common' | 'vip';
  userId: string;
  userName: string;
  userEmail: string;
  commissionType: 'SUBSCRIPTION' | 'RENEWAL' | 'UPGRADE' | 'TRADING' | 'DEPOSIT';
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
  bankData?: {
    bank: string;
    agency: string;
    account: string;
    pixKey?: string;
  };
}

interface CommissionSummary {
  totalPending: number;
  totalApproved: number;
  totalPaid: number;
  totalRejected: number;
  monthlyTotal: number;
  avgCommissionRate: number;
}

const AcertosAdmin: NextPage = () => {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [summary, setSummary] = useState<CommissionSummary>({
    totalPending: 0,
    totalApproved: 0,
    totalPaid: 0,
    totalRejected: 0,
    monthlyTotal: 0,
    avgCommissionRate: 0
  });
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'paid' | 'rejected'>('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'common' | 'vip'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    fetchCommissions();
  }, [filter, dateFilter, typeFilter]);

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      
      // Simular API call com dados reais do backend
      const mockCommissions: Commission[] = [
        {
          id: 'comm_001',
          affiliateId: 'aff_001',
          affiliateName: 'Marcos Afiliado',
          affiliateEmail: 'marcos@email.com',
          affiliateType: 'vip',
          userId: 'user_001',
          userName: 'João Silva',
          userEmail: 'joao@email.com',
          commissionType: 'SUBSCRIPTION',
          subscriptionPlan: 'PREMIUM',
          baseAmount: 197.00,
          commissionRate: 5.0,
          commissionAmount: 9.85,
          status: 'PENDING',
          requestDate: '2024-01-20T10:30:00Z',
          bankData: {
            bank: 'Banco do Brasil',
            agency: '1234-5',
            account: '98765-4',
            pixKey: 'marcos@email.com'
          }
        },
        {
          id: 'comm_002',
          affiliateId: 'aff_002',
          affiliateName: 'Ana Silva',
          affiliateEmail: 'ana@email.com',
          affiliateType: 'common',
          userId: 'user_002',
          userName: 'Maria Santos',
          userEmail: 'maria@email.com',
          commissionType: 'TRADING',
          subscriptionPlan: 'VIP',
          baseAmount: 1500.00,
          commissionRate: 1.5,
          commissionAmount: 22.50,
          status: 'APPROVED',
          requestDate: '2024-01-19T14:15:00Z',
          processedDate: '2024-01-20T09:00:00Z',
          bankData: {
            bank: 'Itaú',
            agency: '5678-9',
            account: '12345-6',
            pixKey: '+5511888888888'
          }
        },
        {
          id: 'comm_003',
          affiliateId: 'aff_001',
          affiliateName: 'Marcos Afiliado',
          affiliateEmail: 'marcos@email.com',
          affiliateType: 'vip',
          userId: 'user_003',
          userName: 'Carlos Oliveira',
          userEmail: 'carlos@email.com',
          commissionType: 'UPGRADE',
          subscriptionPlan: 'VIP',
          baseAmount: 397.00,
          commissionRate: 5.0,
          commissionAmount: 19.85,
          status: 'PAID',
          requestDate: '2024-01-18T11:20:00Z',
          processedDate: '2024-01-19T16:30:00Z',
          paymentMethod: 'PIX',
          paymentDetails: 'Transferência realizada via PIX',
          bankData: {
            bank: 'Banco do Brasil',
            agency: '1234-5',
            account: '98765-4',
            pixKey: 'marcos@email.com'
          }
        }
      ];

      const mockSummary: CommissionSummary = {
        totalPending: 125.50,
        totalApproved: 89.75,
        totalPaid: 1250.30,
        totalRejected: 15.00,
        monthlyTotal: 1480.55,
        avgCommissionRate: 3.2
      };

      setCommissions(mockCommissions);
      setSummary(mockSummary);
    } catch (error) {
      console.error('Erro ao buscar comissões:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCommission = async (commissionId: string) => {
    try {
      setProcessingId(commissionId);
      
      // API call para aprovar comissão
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay
      
      setCommissions(prev => prev.map(comm => 
        comm.id === commissionId 
          ? { ...comm, status: 'APPROVED', processedDate: new Date().toISOString() }
          : comm
      ));
      
      alert('Comissão aprovada com sucesso!');
    } catch (error) {
      alert('Erro ao aprovar comissão');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectCommission = async (commissionId: string, reason: string) => {
    try {
      setProcessingId(commissionId);
      
      // API call para rejeitar comissão
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCommissions(prev => prev.map(comm => 
        comm.id === commissionId 
          ? { ...comm, status: 'REJECTED', processedDate: new Date().toISOString(), notes: reason }
          : comm
      ));
      
      alert('Comissão rejeitada');
    } catch (error) {
      alert('Erro ao rejeitar comissão');
    } finally {
      setProcessingId(null);
    }
  };

  const handlePayCommission = async (commissionId: string, paymentData: any) => {
    try {
      setProcessingId(commissionId);
      
      // API call para pagar comissão
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCommissions(prev => prev.map(comm => 
        comm.id === commissionId 
          ? { 
              ...comm, 
              status: 'PAID', 
              processedDate: new Date().toISOString(),
              paymentMethod: paymentData.method,
              paymentDetails: paymentData.details
            }
          : comm
      ));
      
      setShowPaymentModal(false);
      alert('Pagamento processado com sucesso!');
    } catch (error) {
      alert('Erro ao processar pagamento');
    } finally {
      setProcessingId(null);
    }
  };

  const exportCommissions = () => {
    const csvData = filteredCommissions.map(comm => ({
      'ID': comm.id,
      'Afiliado': comm.affiliateName,
      'Tipo Afiliado': comm.affiliateType === 'vip' ? 'VIP (5%)' : 'Comum (1.5%)',
      'Usuário': comm.userName,
      'Tipo Comissão': comm.commissionType,
      'Plano': comm.subscriptionPlan,
      'Valor Base': comm.baseAmount,
      'Taxa (%)': comm.commissionRate,
      'Comissão': comm.commissionAmount,
      'Status': comm.status,
      'Data Solicitação': new Date(comm.requestDate).toLocaleDateString('pt-BR'),
      'Data Processamento': comm.processedDate ? new Date(comm.processedDate).toLocaleDateString('pt-BR') : '-'
    }));
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + Object.keys(csvData[0]).join(",") + "\n"
      + csvData.map(row => Object.values(row).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `acertos_comissoes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-blue-100 text-blue-800';
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'vip': return 'bg-purple-100 text-purple-800';
      case 'common': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredCommissions = commissions.filter(comm => {
    if (filter !== 'all' && comm.status !== filter.toUpperCase()) return false;
    if (typeFilter !== 'all' && comm.affiliateType !== typeFilter) return false;
    
    if (dateFilter !== 'all') {
      const commDate = new Date(comm.requestDate);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - commDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      switch (dateFilter) {
        case 'today': if (diffDays > 1) return false; break;
        case 'week': if (diffDays > 7) return false; break;
        case 'month': if (diffDays > 30) return false; break;
      }
    }
    
    return true;
  });

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
        <title>Acertos de Comissões - CoinBitClub Admin</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-yellow-400">Acertos de Comissões</h1>
            <p className="text-gray-400 mt-2">Gerencie e processe pagamentos de comissões dos afiliados</p>
          </div>
          
          <button
            onClick={exportCommissions}
            className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-semibold rounded-lg hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200 flex items-center"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Exportar Relatório
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">Pendentes</p>
                <p className="text-2xl font-bold">R$ {summary.totalPending.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
              </div>
              <ClockIcon className="h-8 w-8 text-yellow-200" />
            </div>
            <p className="text-yellow-100 text-xs mt-2">Aguardando aprovação</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Aprovadas</p>
                <p className="text-2xl font-bold">R$ {summary.totalApproved.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-blue-200" />
            </div>
            <p className="text-blue-100 text-xs mt-2">Prontas para pagamento</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Pagas</p>
                <p className="text-2xl font-bold">R$ {summary.totalPaid.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
              </div>
              <BanknotesIcon className="h-8 w-8 text-green-200" />
            </div>
            <p className="text-green-100 text-xs mt-2">Este mês</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Taxa Média</p>
                <p className="text-2xl font-bold">{summary.avgCommissionRate}%</p>
              </div>
              <CurrencyDollarIcon className="h-8 w-8 text-purple-200" />
            </div>
            <p className="text-purple-100 text-xs mt-2">Comissão média</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-black/30 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-400"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendentes</option>
                <option value="approved">Aprovadas</option>
                <option value="paid">Pagas</option>
                <option value="rejected">Rejeitadas</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Período</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-400"
              >
                <option value="all">Todos</option>
                <option value="today">Hoje</option>
                <option value="week">Esta Semana</option>
                <option value="month">Este Mês</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Afiliado</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-400"
              >
                <option value="all">Todos</option>
                <option value="common">Comum (1.5%)</option>
                <option value="vip">VIP (5%)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Resultados</label>
              <div className="text-white text-sm pt-2">
                {filteredCommissions.length} comissões encontradas
              </div>
            </div>
          </div>
        </div>

        {/* Commissions Table */}
        <div className="bg-black/30 rounded-lg p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-300">Afiliado</th>
                  <th className="text-left py-3 px-4 text-gray-300">Usuário</th>
                  <th className="text-left py-3 px-4 text-gray-300">Tipo</th>
                  <th className="text-right py-3 px-4 text-gray-300">Valor Base</th>
                  <th className="text-right py-3 px-4 text-gray-300">Taxa</th>
                  <th className="text-right py-3 px-4 text-gray-300">Comissão</th>
                  <th className="text-center py-3 px-4 text-gray-300">Status</th>
                  <th className="text-left py-3 px-4 text-gray-300">Data</th>
                  <th className="text-center py-3 px-4 text-gray-300">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredCommissions.map((commission) => (
                  <tr key={commission.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-white font-medium">{commission.affiliateName}</p>
                        <p className="text-gray-400 text-xs">{commission.affiliateEmail}</p>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getTypeColor(commission.affiliateType)}`}>
                          {commission.affiliateType === 'vip' ? 'VIP (5%)' : 'Comum (1.5%)'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-white">{commission.userName}</p>
                        <p className="text-gray-400 text-xs">{commission.userEmail}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-white text-sm">{commission.commissionType}</p>
                        <p className="text-gray-400 text-xs">{commission.subscriptionPlan}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-white">
                      R$ {commission.baseAmount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                    </td>
                    <td className="py-3 px-4 text-right text-yellow-400 font-semibold">
                      {commission.commissionRate}%
                    </td>
                    <td className="py-3 px-4 text-right text-green-400 font-semibold">
                      R$ {commission.commissionAmount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(commission.status)}`}>
                        {commission.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-300 text-sm">
                      {new Date(commission.requestDate).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2 justify-center">
                        <button
                          onClick={() => setSelectedCommission(commission)}
                          className="text-blue-400 hover:text-blue-300"
                          title="Ver Detalhes"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        
                        {commission.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApproveCommission(commission.id)}
                              disabled={processingId === commission.id}
                              className="text-green-400 hover:text-green-300 disabled:opacity-50"
                              title="Aprovar"
                            >
                              <CheckCircleIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Motivo da rejeição:');
                                if (reason) handleRejectCommission(commission.id, reason);
                              }}
                              disabled={processingId === commission.id}
                              className="text-red-400 hover:text-red-300 disabled:opacity-50"
                              title="Rejeitar"
                            >
                              <XCircleIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}

                        {commission.status === 'APPROVED' && (
                          <button
                            onClick={() => {
                              setSelectedCommission(commission);
                              setShowPaymentModal(true);
                            }}
                            disabled={processingId === commission.id}
                            className="text-yellow-400 hover:text-yellow-300 disabled:opacity-50"
                            title="Pagar"
                          >
                            <BanknotesIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-black/30 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-yellow-400 mb-4">Ações em Lote</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => {
                const pendingCommissions = filteredCommissions.filter(c => c.status === 'PENDING');
                if (confirm(`Aprovar ${pendingCommissions.length} comissões pendentes?`)) {
                  pendingCommissions.forEach(c => handleApproveCommission(c.id));
                }
              }}
              className="p-4 bg-gradient-to-r from-green-600 to-green-700 rounded-lg text-white hover:from-green-700 hover:to-green-800 transition-all"
            >
              <CheckCircleIcon className="h-6 w-6 mx-auto mb-2" />
              <span className="text-sm font-medium">Aprovar Todas Pendentes</span>
            </button>
            
            <button
              onClick={() => {
                const approvedCommissions = filteredCommissions.filter(c => c.status === 'APPROVED');
                if (confirm(`Processar pagamento de ${approvedCommissions.length} comissões aprovadas?`)) {
                  // Implementar pagamento em lote
                  alert('Pagamentos processados em lote!');
                }
              }}
              className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg text-white hover:from-blue-700 hover:to-blue-800 transition-all"
            >
              <BanknotesIcon className="h-6 w-6 mx-auto mb-2" />
              <span className="text-sm font-medium">Pagar Todas Aprovadas</span>
            </button>
            
            <button
              onClick={exportCommissions}
              className="p-4 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg text-white hover:from-purple-700 hover:to-purple-800 transition-all"
            >
              <ArrowDownTrayIcon className="h-6 w-6 mx-auto mb-2" />
              <span className="text-sm font-medium">Exportar Filtradas</span>
            </button>
          </div>
        </div>
      </div>

      {/* Commission Details Modal */}
      {selectedCommission && !showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-2xl mx-4">
            <h3 className="text-xl font-semibold text-yellow-400 mb-4">Detalhes da Comissão</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-white font-medium mb-2">Informações do Afiliado</h4>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-300">Nome: {selectedCommission.affiliateName}</p>
                  <p className="text-gray-300">Email: {selectedCommission.affiliateEmail}</p>
                  <p className="text-gray-300">Tipo: {selectedCommission.affiliateType === 'vip' ? 'VIP (5%)' : 'Comum (1.5%)'}</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-white font-medium mb-2">Informações do Usuário</h4>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-300">Nome: {selectedCommission.userName}</p>
                  <p className="text-gray-300">Email: {selectedCommission.userEmail}</p>
                  <p className="text-gray-300">Plano: {selectedCommission.subscriptionPlan}</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-white font-medium mb-2">Dados Financeiros</h4>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-300">Valor Base: R$ {selectedCommission.baseAmount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                  <p className="text-gray-300">Taxa: {selectedCommission.commissionRate}%</p>
                  <p className="text-green-400 font-semibold">Comissão: R$ {selectedCommission.commissionAmount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                </div>
              </div>
              
              {selectedCommission.bankData && (
                <div>
                  <h4 className="text-white font-medium mb-2">Dados Bancários</h4>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-300">Banco: {selectedCommission.bankData.bank}</p>
                    <p className="text-gray-300">Agência: {selectedCommission.bankData.agency}</p>
                    <p className="text-gray-300">Conta: {selectedCommission.bankData.account}</p>
                    {selectedCommission.bankData.pixKey && (
                      <p className="text-gray-300">PIX: {selectedCommission.bankData.pixKey}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setSelectedCommission(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedCommission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold text-yellow-400 mb-4">Processar Pagamento</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-white">Afiliado: {selectedCommission.affiliateName}</p>
                <p className="text-green-400 font-semibold text-xl">R$ {selectedCommission.commissionAmount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Método de Pagamento</label>
                <select className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white">
                  <option value="PIX">PIX</option>
                  <option value="BANK_TRANSFER">Transferência Bancária</option>
                  <option value="CRYPTO">Criptomoeda</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Observações</label>
                <textarea
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                  rows={3}
                  placeholder="Detalhes do pagamento..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => handlePayCommission(selectedCommission.id, {
                  method: 'PIX',
                  details: 'Pagamento processado via PIX'
                })}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Confirmar Pagamento
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AcertosAdmin;
