import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import AdminLayout from '../../src/components/AdminLayout';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  BanknotesIcon,
  CreditCardIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface AffiliateData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  cpf: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  joinDate: string;
  totalReferrals: number;
  activeReferrals: number;
  totalCommission: number;
  pendingCommission: number;
  paidCommission: number;
  conversionRate: number;
  // Dados bancários
  bankData?: {
    bank: string;
    agency: string;
    account: string;
    accountType: 'corrente' | 'poupanca';
    accountHolder: string;
  };
  // Dados PIX
  pixData?: {
    type: 'cpf' | 'email' | 'phone' | 'random';
    key: string;
    holder: string;
  };
  // Histórico de comissões
  commissionHistory: CommissionRecord[];
}

interface CommissionRecord {
  id: string;
  date: string;
  referredUserId: string;
  referredUserName: string;
  amount: number;
  type: 'MONTHLY_FEE' | 'PROFIT_SHARE';
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  description: string;
}

interface PayoutRequest {
  id: string;
  affiliateId: string;
  affiliateName: string;
  amount: number;
  requestDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED';
  bankInfo: string;
  processedDate?: string;
  rejectionReason?: string;
}

const AdminAffiliates: NextPage = () => {
  const [affiliates, setAffiliates] = useState<AffiliateData[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAffiliate, setSelectedAffiliate] = useState<AffiliateData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'affiliates' | 'payouts'>('affiliates');
  const [filterStatus, setFilterStatus] = useState('');

  const loadAffiliatesData = async () => {
    setLoading(true);
    try {
      // Simular dados - substituir por chamada real da API
      const mockAffiliates: AffiliateData[] = [
        {
          id: 'aff1',
          name: 'Carlos Mentor',
          email: 'carlos.mentor@email.com',
          phone: '+55 11 99999-1234',
          cpf: '111.222.333-44',
          status: 'ACTIVE',
          joinDate: '2024-01-10T10:00:00Z',
          totalReferrals: 15,
          activeReferrals: 12,
          totalCommission: 4500.80,
          pendingCommission: 320.50,
          paidCommission: 4180.30,
          conversionRate: 80.0,
          bankData: {
            bank: 'Banco do Brasil',
            agency: '1234-5',
            account: '54321-0',
            accountType: 'corrente',
            accountHolder: 'Carlos Mentor'
          },
          pixData: {
            type: 'cpf',
            key: '111.222.333-44',
            holder: 'Carlos Mentor'
          },
          commissionHistory: [
            {
              id: 'comm1',
              date: '2024-07-20T10:00:00Z',
              referredUserId: 'user1',
              referredUserName: 'João Silva',
              amount: 125.50,
              type: 'PROFIT_SHARE',
              status: 'PENDING',
              description: 'Comissão sobre lucro de trading - Julho/2024'
            },
            {
              id: 'comm2',
              date: '2024-07-15T08:30:00Z',
              referredUserId: 'user2',
              referredUserName: 'Maria Santos',
              amount: 18.00,
              type: 'MONTHLY_FEE',
              status: 'PAID',
              description: 'Comissão mensalidade - Julho/2024'
            }
          ]
        },
        {
          id: 'aff2',
          name: 'Ana Influencer',
          email: 'ana.influencer@email.com',
          phone: '+55 21 88888-5678',
          cpf: '555.666.777-88',
          status: 'ACTIVE',
          joinDate: '2024-02-15T14:30:00Z',
          totalReferrals: 8,
          activeReferrals: 6,
          totalCommission: 2100.40,
          pendingCommission: 180.20,
          paidCommission: 1920.20,
          conversionRate: 75.0,
          pixData: {
            type: 'email',
            key: 'ana.influencer@email.com',
            holder: 'Ana Influencer'
          },
          commissionHistory: [
            {
              id: 'comm3',
              date: '2024-07-18T16:45:00Z',
              referredUserId: 'user3',
              referredUserName: 'Pedro Costa',
              amount: 85.30,
              type: 'PROFIT_SHARE',
              status: 'PENDING',
              description: 'Comissão sobre lucro de trading - Julho/2024'
            }
          ]
        }
      ];

      const mockPayoutRequests: PayoutRequest[] = [
        {
          id: 'payout1',
          affiliateId: 'aff1',
          affiliateName: 'Carlos Mentor',
          amount: 320.50,
          requestDate: '2024-07-19T10:30:00Z',
          status: 'PENDING',
          bankInfo: 'Banco do Brasil - Ag: 1234-5 - Conta: 54321-0'
        },
        {
          id: 'payout2',
          affiliateId: 'aff2',
          affiliateName: 'Ana Influencer',
          amount: 180.20,
          requestDate: '2024-07-18T14:20:00Z',
          status: 'APPROVED',
          bankInfo: 'PIX: ana.influencer@email.com'
        }
      ];

      setAffiliates(mockAffiliates);
      setPayoutRequests(mockPayoutRequests);
    } catch (error) {
      console.error('Erro ao carregar dados de afiliados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAffiliatesData();
  }, []);

  const filteredAffiliates = affiliates.filter(affiliate => {
    const matchesSearch = affiliate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         affiliate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         affiliate.cpf.includes(searchTerm);
    
    const matchesStatus = !filterStatus || affiliate.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-900 text-green-300';
      case 'INACTIVE': return 'bg-gray-900 text-gray-300';
      case 'SUSPENDED': return 'bg-red-900 text-red-300';
      case 'PENDING': return 'bg-yellow-900 text-yellow-300';
      case 'APPROVED': return 'bg-blue-900 text-blue-300';
      case 'REJECTED': return 'bg-red-900 text-red-300';
      case 'PROCESSED': return 'bg-green-900 text-green-300';
      default: return 'bg-gray-900 text-gray-300';
    }
  };

  const openAffiliateModal = (affiliate: AffiliateData) => {
    setSelectedAffiliate(affiliate);
    setShowModal(true);
  };

  const exportAffiliateStatement = (affiliate: AffiliateData) => {
    const headers = ['Data', 'Usuário Indicado', 'Tipo', 'Valor', 'Status', 'Descrição'];
    const csvData = affiliate.commissionHistory.map(comm => [
      new Date(comm.date).toLocaleDateString('pt-BR'),
      comm.referredUserName,
      comm.type === 'MONTHLY_FEE' ? 'Mensalidade' : 'Lucro Trading',
      `R$ ${comm.amount.toFixed(2)}`,
      comm.status,
      comm.description
    ]);
    
    const csvContent = [
      [`Extrato do Afiliado: ${affiliate.name}`],
      [`Período: ${new Date().toLocaleDateString('pt-BR')}`],
      [],
      headers,
      ...csvData,
      [],
      [`Total Pago: R$ ${affiliate.paidCommission.toFixed(2)}`],
      [`Pendente: R$ ${affiliate.pendingCommission.toFixed(2)}`],
      [`Total Geral: R$ ${affiliate.totalCommission.toFixed(2)}`]
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `extrato_afiliado_${affiliate.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <>
      <Head>
        <title>Gestão de Afiliados - Admin CoinBitClub</title>
      </Head>
      
      <AdminLayout title="Gestão de Afiliados">
        <div className="space-y-6">
          
          {/* Tabs */}
          <div className="flex space-x-1 rounded-lg bg-gray-800 p-1">
            <button
              onClick={() => setActiveTab('affiliates')}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'affiliates'
                  ? 'bg-yellow-500 text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Gestão de Afiliados
            </button>
            <button
              onClick={() => setActiveTab('payouts')}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'payouts'
                  ? 'bg-yellow-500 text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Solicitações de Saque
            </button>
          </div>

          {activeTab === 'affiliates' && (
            <>
              {/* Estatísticas Resumidas */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Total de Afiliados</p>
                      <p className="text-2xl font-bold text-white">{affiliates.length}</p>
                    </div>
                    <UserGroupIcon className="size-8 text-blue-400" />
                  </div>
                </div>

                <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Afiliados Ativos</p>
                      <p className="text-2xl font-bold text-green-400">
                        {affiliates.filter(a => a.status === 'ACTIVE').length}
                      </p>
                    </div>
                    <CheckCircleIcon className="size-8 text-green-400" />
                  </div>
                </div>

                <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Total Indicações</p>
                      <p className="text-2xl font-bold text-white">
                        {affiliates.reduce((sum, a) => sum + a.totalReferrals, 0)}
                      </p>
                    </div>
                    <ChartBarIcon className="size-8 text-yellow-400" />
                  </div>
                </div>

                <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Comissões Pendentes</p>
                      <p className="text-2xl font-bold text-yellow-400">
                        R$ {affiliates.reduce((sum, a) => sum + a.pendingCommission, 0).toFixed(2)}
                      </p>
                    </div>
                    <CurrencyDollarIcon className="size-8 text-yellow-400" />
                  </div>
                </div>
              </div>

              {/* Filtros */}
              <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
                <div className="flex flex-col gap-4 md:flex-row">
                  <div className="flex-1">
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar por nome, email ou CPF..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-lg border border-gray-600 bg-gray-700 py-2 pl-10 pr-3 text-white"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                    >
                      <option value="">Todos os Status</option>
                      <option value="ACTIVE">Ativo</option>
                      <option value="INACTIVE">Inativo</option>
                      <option value="SUSPENDED">Suspenso</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Tabela de Afiliados */}
              <div className="overflow-hidden rounded-xl border border-gray-700 bg-gray-800">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-900">
                      <tr>
                        <th className="px-6 py-4 text-left font-medium text-gray-400">Afiliado</th>
                        <th className="px-6 py-4 text-left font-medium text-gray-400">CPF</th>
                        <th className="px-6 py-4 text-left font-medium text-gray-400">Status</th>
                        <th className="px-6 py-4 text-left font-medium text-gray-400">Indicações</th>
                        <th className="px-6 py-4 text-left font-medium text-gray-400">Conversão</th>
                        <th className="px-6 py-4 text-left font-medium text-gray-400">Total Comissão</th>
                        <th className="px-6 py-4 text-left font-medium text-gray-400">Pendente</th>
                        <th className="px-6 py-4 text-left font-medium text-gray-400">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center">
                            <div className="mx-auto size-8 animate-spin rounded-full border-b-2 border-yellow-400"></div>
                          </td>
                        </tr>
                      ) : filteredAffiliates.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-gray-400">
                            Nenhum afiliado encontrado
                          </td>
                        </tr>
                      ) : (
                        filteredAffiliates.map((affiliate) => (
                          <tr key={affiliate.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <UserGroupIcon className="size-8 text-gray-400" />
                                <div>
                                  <div className="font-medium text-white">{affiliate.name}</div>
                                  <div className="text-sm text-gray-400">{affiliate.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-mono text-white">{affiliate.cpf}</td>
                            <td className="px-6 py-4">
                              <span className={`rounded px-2 py-1 text-xs ${getStatusColor(affiliate.status)}`}>
                                {affiliate.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-white">
                              {affiliate.activeReferrals}/{affiliate.totalReferrals}
                            </td>
                            <td className="px-6 py-4 text-white">{affiliate.conversionRate.toFixed(1)}%</td>
                            <td className="px-6 py-4 font-medium text-green-400">
                              R$ {affiliate.totalCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4 font-medium text-yellow-400">
                              R$ {affiliate.pendingCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => openAffiliateModal(affiliate)}
                                  className="p-1 text-blue-400 hover:text-blue-300"
                                >
                                  <EyeIcon className="size-4" />
                                </button>
                                <button
                                  onClick={() => exportAffiliateStatement(affiliate)}
                                  className="p-1 text-green-400 hover:text-green-300"
                                >
                                  <DocumentArrowDownIcon className="size-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'payouts' && (
            <div className="space-y-6">
              {/* Tabela de Solicitações de Saque */}
              <div className="overflow-hidden rounded-xl border border-gray-700 bg-gray-800">
                <div className="border-b border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-white">Solicitações de Saque de Afiliados</h3>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-900">
                      <tr>
                        <th className="px-6 py-4 text-left font-medium text-gray-400">Afiliado</th>
                        <th className="px-6 py-4 text-left font-medium text-gray-400">Valor</th>
                        <th className="px-6 py-4 text-left font-medium text-gray-400">Data Solicitação</th>
                        <th className="px-6 py-4 text-left font-medium text-gray-400">Status</th>
                        <th className="px-6 py-4 text-left font-medium text-gray-400">Dados Bancários</th>
                        <th className="px-6 py-4 text-left font-medium text-gray-400">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payoutRequests.map((request) => (
                        <tr key={request.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                          <td className="px-6 py-4 font-medium text-white">{request.affiliateName}</td>
                          <td className="px-6 py-4 font-medium text-green-400">
                            R$ {request.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-gray-400">
                            {new Date(request.requestDate).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`rounded px-2 py-1 text-xs ${getStatusColor(request.status)}`}>
                              {request.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-white">{request.bankInfo}</td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              {request.status === 'PENDING' && (
                                <>
                                  <button className="rounded bg-green-900 px-2 py-1 text-xs text-green-400 hover:text-green-300">
                                    Aprovar
                                  </button>
                                  <button className="rounded bg-red-900 px-2 py-1 text-xs text-red-400 hover:text-red-300">
                                    Rejeitar
                                  </button>
                                </>
                              )}
                              <button className="p-1 text-blue-400 hover:text-blue-300">
                                <EyeIcon className="size-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal de Detalhes do Afiliado */}
        {showModal && selectedAffiliate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-xl bg-gray-800">
              <div className="border-b border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Detalhes do Afiliado - {selectedAffiliate.name}</h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <XCircleIcon className="size-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  
                  {/* Informações Pessoais */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Informações Pessoais</h3>
                    
                    <div className="space-y-3 rounded-lg bg-gray-900 p-4">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Nome:</span>
                        <span className="text-white">{selectedAffiliate.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Email:</span>
                        <span className="text-white">{selectedAffiliate.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Telefone:</span>
                        <span className="text-white">{selectedAffiliate.phone || 'Não informado'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">CPF:</span>
                        <span className="font-mono text-white">{selectedAffiliate.cpf}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Desde:</span>
                        <span className="text-white">{new Date(selectedAffiliate.joinDate).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>

                    {/* Dados de Pagamento */}
                    <h3 className="text-lg font-semibold text-white">Dados de Pagamento</h3>
                    
                    {selectedAffiliate.bankData && (
                      <div className="rounded-lg bg-gray-900 p-4">
                        <h4 className="mb-2 flex items-center font-medium text-white">
                          <BanknotesIcon className="mr-2 size-4" />
                          Dados Bancários
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Banco:</span>
                            <span className="text-white">{selectedAffiliate.bankData.bank}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Agência:</span>
                            <span className="text-white">{selectedAffiliate.bankData.agency}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Conta:</span>
                            <span className="text-white">{selectedAffiliate.bankData.account}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedAffiliate.pixData && (
                      <div className="rounded-lg bg-gray-900 p-4">
                        <h4 className="mb-2 flex items-center font-medium text-white">
                          <CreditCardIcon className="mr-2 size-4" />
                          Dados PIX
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Tipo:</span>
                            <span className="uppercase text-white">{selectedAffiliate.pixData.type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Chave:</span>
                            <span className="text-white">{selectedAffiliate.pixData.key}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Estatísticas */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Performance</h3>
                    
                    <div className="space-y-3 rounded-lg bg-gray-900 p-4">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Indicações:</span>
                        <span className="text-white">{selectedAffiliate.totalReferrals}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Indicações Ativas:</span>
                        <span className="text-green-400">{selectedAffiliate.activeReferrals}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Taxa de Conversão:</span>
                        <span className="text-white">{selectedAffiliate.conversionRate.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Comissões:</span>
                        <span className="text-green-400">R$ {selectedAffiliate.totalCommission.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Comissões Pagas:</span>
                        <span className="text-white">R$ {selectedAffiliate.paidCommission.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Pendente Pagamento:</span>
                        <span className="text-yellow-400">R$ {selectedAffiliate.pendingCommission.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Histórico de Comissões */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">Histórico de Comissões</h3>
                      <button
                        onClick={() => exportAffiliateStatement(selectedAffiliate)}
                        className="flex items-center text-sm text-green-400 hover:text-green-300"
                      >
                        <DocumentArrowDownIcon className="mr-1 size-4" />
                        Extrato
                      </button>
                    </div>
                    
                    <div className="rounded-lg bg-gray-900 p-4">
                      <div className="max-h-64 space-y-3 overflow-y-auto">
                        {selectedAffiliate.commissionHistory.map((commission) => (
                          <div key={commission.id} className="border-b border-gray-700 pb-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-white">
                                  {commission.referredUserName}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {commission.description}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(commission.date).toLocaleDateString('pt-BR')}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-green-400">
                                  R$ {commission.amount.toFixed(2)}
                                </div>
                                <span className={`rounded px-1 py-0.5 text-xs ${getStatusColor(commission.status)}`}>
                                  {commission.status}
                                </span>
                              </div>
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
        )}
      </AdminLayout>
    </>
  );
};

export default AdminAffiliates;
