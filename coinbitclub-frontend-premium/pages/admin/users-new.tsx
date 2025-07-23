import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import AdminLayout from '../../src/components/AdminLayout';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  UserCircleIcon,
  BanknotesIcon,
  CreditCardIcon,
  DocumentTextIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface UserData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  cpf: string;
  planType: 'monthly_brazil' | 'prepaid_brazil' | 'monthly_international' | 'prepaid_international';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'TRIAL';
  createdAt: string;
  lastLogin?: string;
  tradingBalance: number;
  prepaidBalance: number;
  totalProfit: number;
  totalLoss: number;
  successRate: number;
  totalOperations: number;
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
  // Subscription data
  subscription?: {
    id: string;
    status: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  };
  // KYC Data
  kycStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_SUBMITTED';
  kycDocuments?: {
    identityDocument?: string;
    proofOfAddress?: string;
    selfie?: string;
  };
}

const AdminUsers: NextPage = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPlan, setFilterPlan] = useState('');
  const [filterKYC, setFilterKYC] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Simular dados - substituir por chamada real da API
      const mockUsers: UserData[] = [
        {
          id: 'user1',
          name: 'João Silva',
          email: 'joao.silva@email.com',
          phone: '+55 11 99999-9999',
          cpf: '123.456.789-00',
          planType: 'monthly_brazil',
          status: 'ACTIVE',
          createdAt: '2024-01-15T10:30:00Z',
          lastLogin: '2024-07-20T08:15:00Z',
          tradingBalance: 5000.00,
          prepaidBalance: 1200.50,
          totalProfit: 3450.80,
          totalLoss: 890.20,
          successRate: 78.5,
          totalOperations: 45,
          bankData: {
            bank: 'Banco do Brasil',
            agency: '1234-5',
            account: '12345-6',
            accountType: 'corrente',
            accountHolder: 'João Silva'
          },
          pixData: {
            type: 'cpf',
            key: '123.456.789-00',
            holder: 'João Silva'
          },
          subscription: {
            id: 'sub_123',
            status: 'active',
            currentPeriodEnd: '2024-08-15T23:59:59Z',
            cancelAtPeriodEnd: false
          },
          kycStatus: 'APPROVED',
          kycDocuments: {
            identityDocument: 'rg_123456.pdf',
            proofOfAddress: 'comprovante_123.pdf',
            selfie: 'selfie_123.jpg'
          }
        },
        {
          id: 'user2',
          name: 'Maria Santos',
          email: 'maria.santos@email.com',
          phone: '+55 21 88888-8888',
          cpf: '987.654.321-00',
          planType: 'prepaid_brazil',
          status: 'ACTIVE',
          createdAt: '2024-02-10T14:20:00Z',
          lastLogin: '2024-07-19T16:45:00Z',
          tradingBalance: 3200.00,
          prepaidBalance: 850.30,
          totalProfit: 2100.60,
          totalLoss: 450.80,
          successRate: 82.3,
          totalOperations: 32,
          bankData: {
            bank: 'Itaú',
            agency: '5678',
            account: '98765-4',
            accountType: 'poupanca',
            accountHolder: 'Maria Santos'
          },
          pixData: {
            type: 'email',
            key: 'maria.santos@email.com',
            holder: 'Maria Santos'
          },
          kycStatus: 'PENDING'
        },
        {
          id: 'user3',
          name: 'Pedro Costa',
          email: 'pedro.costa@email.com',
          phone: '+55 31 77777-7777',
          cpf: '456.789.123-00',
          planType: 'monthly_international',
          status: 'TRIAL',
          createdAt: '2024-07-15T09:00:00Z',
          lastLogin: '2024-07-20T10:30:00Z',
          tradingBalance: 1500.00,
          prepaidBalance: 0,
          totalProfit: 125.40,
          totalLoss: 75.20,
          successRate: 65.0,
          totalOperations: 8,
          kycStatus: 'NOT_SUBMITTED'
        }
      ];

      setUsers(mockUsers);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.cpf.includes(searchTerm);
    
    const matchesStatus = !filterStatus || user.status === filterStatus;
    const matchesPlan = !filterPlan || user.planType === filterPlan;
    const matchesKYC = !filterKYC || user.kycStatus === filterKYC;
    
    return matchesSearch && matchesStatus && matchesPlan && matchesKYC;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-900 text-green-300';
      case 'INACTIVE': return 'bg-gray-900 text-gray-300';
      case 'SUSPENDED': return 'bg-red-900 text-red-300';
      case 'TRIAL': return 'bg-blue-900 text-blue-300';
      default: return 'bg-gray-900 text-gray-300';
    }
  };

  const getKYCStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-900 text-green-300';
      case 'PENDING': return 'bg-yellow-900 text-yellow-300';
      case 'REJECTED': return 'bg-red-900 text-red-300';
      case 'NOT_SUBMITTED': return 'bg-gray-900 text-gray-300';
      default: return 'bg-gray-900 text-gray-300';
    }
  };

  const openUserModal = (user: UserData) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  return (
    <>
      <Head>
        <title>Gestão de Usuários - Admin CoinBitClub</title>
      </Head>
      
      <AdminLayout title="Gestão de Usuários">
        <div className="space-y-6">
          
          {/* Filtros */}
          <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">Filtros e Busca</h3>
            
            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <label className="mb-1 block text-sm text-gray-400">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                >
                  <option value="">Todos</option>
                  <option value="ACTIVE">Ativo</option>
                  <option value="INACTIVE">Inativo</option>
                  <option value="SUSPENDED">Suspenso</option>
                  <option value="TRIAL">Trial</option>
                </select>
              </div>
              
              <div>
                <label className="mb-1 block text-sm text-gray-400">Plano</label>
                <select
                  value={filterPlan}
                  onChange={(e) => setFilterPlan(e.target.value)}
                  className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                >
                  <option value="">Todos</option>
                  <option value="monthly_brazil">Mensal Brasil</option>
                  <option value="prepaid_brazil">Pré-pago Brasil</option>
                  <option value="monthly_international">Mensal Internacional</option>
                  <option value="prepaid_international">Pré-pago Internacional</option>
                </select>
              </div>
              
              <div>
                <label className="mb-1 block text-sm text-gray-400">KYC Status</label>
                <select
                  value={filterKYC}
                  onChange={(e) => setFilterKYC(e.target.value)}
                  className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                >
                  <option value="">Todos</option>
                  <option value="APPROVED">Aprovado</option>
                  <option value="PENDING">Pendente</option>
                  <option value="REJECTED">Rejeitado</option>
                  <option value="NOT_SUBMITTED">Não Enviado</option>
                </select>
              </div>
              
              <div>
                <label className="mb-1 block text-sm text-gray-400">Buscar</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Nome, email ou CPF..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-lg border border-gray-600 bg-gray-700 py-2 pl-10 pr-3 text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tabela de Usuários */}
          <div className="overflow-hidden rounded-xl border border-gray-700 bg-gray-800">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-4 text-left font-medium text-gray-400">Usuário</th>
                    <th className="px-6 py-4 text-left font-medium text-gray-400">CPF</th>
                    <th className="px-6 py-4 text-left font-medium text-gray-400">Plano</th>
                    <th className="px-6 py-4 text-left font-medium text-gray-400">Status</th>
                    <th className="px-6 py-4 text-left font-medium text-gray-400">KYC</th>
                    <th className="px-6 py-4 text-left font-medium text-gray-400">Saldo Trading</th>
                    <th className="px-6 py-4 text-left font-medium text-gray-400">Taxa Acerto</th>
                    <th className="px-6 py-4 text-left font-medium text-gray-400">Último Login</th>
                    <th className="px-6 py-4 text-left font-medium text-gray-400">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center">
                        <div className="mx-auto size-8 animate-spin rounded-full border-b-2 border-yellow-400"></div>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-gray-400">
                        Nenhum usuário encontrado
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <UserCircleIcon className="size-8 text-gray-400" />
                            <div>
                              <div className="font-medium text-white">{user.name}</div>
                              <div className="text-sm text-gray-400">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-white">{user.cpf}</td>
                        <td className="px-6 py-4">
                          <span className="rounded bg-blue-900 px-2 py-1 text-xs text-blue-300">
                            {user.planType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`rounded px-2 py-1 text-xs ${getStatusColor(user.status)}`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`rounded px-2 py-1 text-xs ${getKYCStatusColor(user.kycStatus)}`}>
                            {user.kycStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-white">R$ {user.tradingBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4 text-white">{user.successRate.toFixed(1)}%</td>
                        <td className="px-6 py-4 text-gray-400">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('pt-BR') : 'Nunca'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openUserModal(user)}
                              className="p-1 text-blue-400 hover:text-blue-300"
                            >
                              <EyeIcon className="size-4" />
                            </button>
                            <button className="p-1 text-green-400 hover:text-green-300">
                              <PencilIcon className="size-4" />
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

          {/* Estatísticas Resumidas */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total de Usuários</p>
                  <p className="text-2xl font-bold text-white">{users.length}</p>
                </div>
                <UserCircleIcon className="size-8 text-blue-400" />
              </div>
            </div>

            <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Usuários Ativos</p>
                  <p className="text-2xl font-bold text-green-400">
                    {users.filter(u => u.status === 'ACTIVE').length}
                  </p>
                </div>
                <CheckCircleIcon className="size-8 text-green-400" />
              </div>
            </div>

            <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">KYC Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {users.filter(u => u.kycStatus === 'PENDING').length}
                  </p>
                </div>
                <ExclamationTriangleIcon className="size-8 text-yellow-400" />
              </div>
            </div>

            <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Usuários Trial</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {users.filter(u => u.status === 'TRIAL').length}
                  </p>
                </div>
                <CalendarIcon className="size-8 text-blue-400" />
              </div>
            </div>
          </div>

        </div>

        {/* Modal de Detalhes do Usuário */}
        {showModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-gray-800">
              <div className="border-b border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Detalhes do Usuário</h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <XCircleIcon className="size-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  
                  {/* Informações Pessoais */}
                  <div className="space-y-4">
                    <h3 className="flex items-center text-lg font-semibold text-white">
                      <UserCircleIcon className="mr-2 size-5" />
                      Informações Pessoais
                    </h3>
                    
                    <div className="space-y-3 rounded-lg bg-gray-900 p-4">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Nome:</span>
                        <span className="text-white">{selectedUser.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Email:</span>
                        <span className="text-white">{selectedUser.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Telefone:</span>
                        <span className="text-white">{selectedUser.phone || 'Não informado'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">CPF:</span>
                        <span className="font-mono text-white">{selectedUser.cpf}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Cadastro:</span>
                        <span className="text-white">{new Date(selectedUser.createdAt).toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Último Login:</span>
                        <span className="text-white">
                          {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString('pt-BR') : 'Nunca'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dados Bancários */}
                  <div className="space-y-4">
                    <h3 className="flex items-center text-lg font-semibold text-white">
                      <BanknotesIcon className="mr-2 size-5" />
                      Dados Bancários
                    </h3>
                    
                    {selectedUser.bankData ? (
                      <div className="space-y-3 rounded-lg bg-gray-900 p-4">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Banco:</span>
                          <span className="text-white">{selectedUser.bankData.bank}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Agência:</span>
                          <span className="text-white">{selectedUser.bankData.agency}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Conta:</span>
                          <span className="text-white">{selectedUser.bankData.account}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Tipo:</span>
                          <span className="capitalize text-white">{selectedUser.bankData.accountType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Titular:</span>
                          <span className="text-white">{selectedUser.bankData.accountHolder}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg bg-gray-900 p-4">
                        <p className="text-center text-gray-400">Dados bancários não cadastrados</p>
                      </div>
                    )}

                    {/* Dados PIX */}
                    <h3 className="flex items-center text-lg font-semibold text-white">
                      <CreditCardIcon className="mr-2 size-5" />
                      Dados PIX
                    </h3>
                    
                    {selectedUser.pixData ? (
                      <div className="space-y-3 rounded-lg bg-gray-900 p-4">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Tipo:</span>
                          <span className="uppercase text-white">{selectedUser.pixData.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Chave:</span>
                          <span className="text-white">{selectedUser.pixData.key}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Titular:</span>
                          <span className="text-white">{selectedUser.pixData.holder}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg bg-gray-900 p-4">
                        <p className="text-center text-gray-400">Dados PIX não cadastrados</p>
                      </div>
                    )}
                  </div>

                  {/* Estatísticas de Trading */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Estatísticas de Trading</h3>
                    
                    <div className="space-y-3 rounded-lg bg-gray-900 p-4">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Saldo Trading:</span>
                        <span className="text-white">R$ {selectedUser.tradingBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Saldo Pré-pago:</span>
                        <span className="text-white">R$ {selectedUser.prepaidBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Lucro:</span>
                        <span className="text-green-400">R$ {selectedUser.totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Prejuízo:</span>
                        <span className="text-red-400">R$ {selectedUser.totalLoss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Taxa de Acerto:</span>
                        <span className="text-white">{selectedUser.successRate.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Operações:</span>
                        <span className="text-white">{selectedUser.totalOperations}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status da Conta */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Status da Conta</h3>
                    
                    <div className="space-y-3 rounded-lg bg-gray-900 p-4">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        <span className={`rounded px-2 py-1 text-xs ${getStatusColor(selectedUser.status)}`}>
                          {selectedUser.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Plano:</span>
                        <span className="text-white">
                          {selectedUser.planType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">KYC Status:</span>
                        <span className={`rounded px-2 py-1 text-xs ${getKYCStatusColor(selectedUser.kycStatus)}`}>
                          {selectedUser.kycStatus}
                        </span>
                      </div>
                      
                      {selectedUser.subscription && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Assinatura:</span>
                            <span className="text-white">{selectedUser.subscription.status}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Próximo Vencimento:</span>
                            <span className="text-white">
                              {new Date(selectedUser.subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </>
                      )}
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

export default AdminUsers;
