import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  FiHome, FiUsers, FiBarChart, FiSettings, FiLogOut, FiMenu, FiX,
  FiSearch, FiFilter, FiPlus, FiEdit, FiTrash2, FiEye, FiDownload,
  FiActivity, FiAlertTriangle, FiDollarSign, FiTrendingUp, FiShare2,
  FiRefreshCw, FiCalendar, FiFileText, FiPieChart, FiTarget,
  FiCreditCard, FiArrowUp, FiArrowDown, FiZap, FiGift, FiUser,
  FiCheck, FiX as FiCancel, FiCopy, FiSave, FiAlertCircle
} from 'react-icons/fi';
import {
  MobileNav, MobileCard, ResponsiveGrid, MobileInput,
  MobileButton, MobileModal, MobileTabs, MobileAlert
} from '../../components/mobile/MobileComponents';

interface User {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  balance: number;
  currency: string;
  plan: string;
  status: string;
}

interface CreditCoupon {
  id: string;
  code: string;
  amount: number;
  currency: string;
  description: string;
  usage_limit: number;
  used_count: number;
  expires_at: string;
  created_at: string;
  status: 'active' | 'expired' | 'disabled';
  created_by: string;
  type: 'single_use' | 'multi_use' | 'unlimited';
}

interface BalanceAdjustment {
  id: string;
  user_id: string;
  user_name: string;
  amount: number;
  currency: string;
  type: 'manual_credit' | 'coupon_credit' | 'manual_debit';
  description: string;
  admin_id: string;
  admin_name: string;
  created_at: string;
  withdrawable: boolean;
}

export default function CreditsManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('balances');
  const [loading, setLoading] = useState(true);
  
  // Balance Management
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [balanceForm, setBalanceForm] = useState({
    amount: '',
    description: '',
    type: 'manual_credit'
  });
  
  // Coupon Management
  const [coupons, setCoupons] = useState<CreditCoupon[]>([]);
  const [couponForm, setCouponForm] = useState({
    code: '',
    amount: '',
    currency: 'USD',
    description: '',
    usage_limit: '',
    expires_at: '',
    type: 'single_use'
  });
  
  // History
  const [adjustments, setAdjustments] = useState<BalanceAdjustment[]>([]);
  
  // UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);

  // Mock data
  useEffect(() => {
    setLoading(true);
    
    const mockUsers: User[] = [
      {
        id: '1',
        name: 'João Silva',
        email: 'joao@email.com',
        whatsapp: '+5511999999999',
        balance: 1250.50,
        currency: 'USD',
        plan: 'Premium',
        status: 'active'
      },
      {
        id: '2',
        name: 'Maria Santos',
        email: 'maria@email.com',
        whatsapp: '+5511888888888',
        balance: 750.25,
        currency: 'USD',
        plan: 'Standard',
        status: 'active'
      }
    ];

    const mockCoupons: CreditCoupon[] = [
      {
        id: '1',
        code: 'CBC50OFF',
        amount: 50,
        currency: 'USD',
        description: 'Cupom promocional de $50',
        usage_limit: 100,
        used_count: 23,
        expires_at: '2024-12-31T23:59:59Z',
        created_at: '2024-07-01T10:00:00Z',
        status: 'active',
        created_by: 'Admin',
        type: 'multi_use'
      }
    ];

    const mockAdjustments: BalanceAdjustment[] = [
      {
        id: '1',
        user_id: '1',
        user_name: 'João Silva',
        amount: 50,
        currency: 'USD',
        type: 'manual_credit',
        description: 'Bônus de boas-vindas',
        admin_id: 'admin_1',
        admin_name: 'Admin Sistema',
        created_at: '2024-07-25T10:30:00Z',
        withdrawable: true
      }
    ];

    setUsers(mockUsers);
    setCoupons(mockCoupons);
    setAdjustments(mockAdjustments);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <FiRefreshCw className="w-16 h-16 text-yellow-400 animate-spin mx-auto mb-6" />
          <p className="text-yellow-400 text-2xl font-bold mb-2">⚡ CoinBitClub ⚡</p>
          <p className="text-blue-400 text-lg">Carregando Gestão de Créditos...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Gestão de Créditos e Cupons | CoinBitClub Admin</title>
        <meta name="description" content="Gestão de Créditos e Cupons - CoinBitClub Admin" />
      </Head>

      <div className="min-h-screen bg-black">
        {/* Mobile Navigation */}
        <MobileNav 
          isOpen={mobileMenuOpen} 
          onToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          title="⚡ Admin Panel"
        >
          <nav className="px-4 py-4 space-y-3">
            <a href="/admin/dashboard-executive" className="flex items-center px-4 py-3 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 rounded-lg transition-all">
              <FiBarChart className="w-5 h-5 mr-3" />
              <span>Dashboard Executivo</span>
            </a>
            <a href="/admin/users" className="flex items-center px-4 py-3 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 rounded-lg transition-all">
              <FiUsers className="w-5 h-5 mr-3" />
              <span>Gestão de Usuários</span>
            </a>
            <a href="#" className="flex items-center px-4 py-3 text-yellow-400 bg-yellow-400/20 rounded-lg border border-yellow-400/50 font-bold">
              <FiGift className="w-5 h-5 mr-3" />
              <span>Gestão de Créditos</span>
            </a>
            <a href="/admin/settings" className="flex items-center px-4 py-3 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 rounded-lg transition-all">
              <FiSettings className="w-5 h-5 mr-3" />
              <span>Configurações</span>
            </a>
          </nav>
        </MobileNav>

        <div className="flex">
          {/* Desktop Sidebar */}
          <div className="hidden lg:flex flex-col w-64 bg-black/95 backdrop-blur-sm border-r border-yellow-400/30">
            <div className="flex items-center justify-center h-16 px-4 bg-gradient-to-r from-yellow-400/20 to-pink-400/20 border-b border-yellow-400/30">
              <h1 className="text-xl font-bold text-yellow-400">⚡ CoinBitClub</h1>
            </div>

            <nav className="mt-8 px-4 space-y-3">
              <a href="/admin/dashboard-executive" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiBarChart className="w-6 h-6 mr-4" />
                <span>Dashboard Executivo</span>
              </a>
              <a href="/admin/users" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiUsers className="w-6 h-6 mr-4" />
                <span>Gestão de Usuários</span>
              </a>
              <a href="#" className="flex items-center px-6 py-4 text-yellow-400 bg-yellow-400/20 rounded-xl border-2 border-yellow-400/50 shadow-lg shadow-yellow-400/20 font-bold">
                <FiGift className="w-6 h-6 mr-4" />
                <span>Gestão de Créditos</span>
              </a>
              <a href="/admin/settings" className="flex items-center px-6 py-4 text-blue-400 hover:text-yellow-400 hover:bg-blue-400/10 border-2 border-transparent hover:border-blue-400/50 rounded-xl transition-all duration-300 font-medium">
                <FiSettings className="w-6 h-6 mr-4" />
                <span>Configurações</span>
              </a>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 lg:w-0">
            {/* Header */}
            <header className="bg-black/90 backdrop-blur-sm border-b border-yellow-400/30">
              <div className="flex items-center justify-between px-4 lg:px-8 py-4 lg:py-6">
                <div className="flex items-center space-x-3 lg:space-x-6">
                  <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="lg:hidden text-blue-400 hover:text-yellow-400 transition-colors"
                  >
                    <FiMenu className="w-6 h-6" />
                  </button>
                  <h2 className="text-lg lg:text-2xl font-bold text-yellow-400">Gestão de Créditos</h2>
                </div>

                <div className="flex items-center space-x-3 lg:space-x-6">
                  <MobileButton
                    onClick={() => setShowCouponModal(true)}
                    className="bg-green-400 text-black hover:bg-green-300"
                    icon={<FiPlus className="w-4 h-4" />}
                  >
                    <span className="hidden lg:inline">Novo Cupom</span>
                  </MobileButton>
                  
                  <button className="flex items-center px-4 lg:px-6 py-2 lg:py-3 text-blue-400 hover:text-yellow-400 bg-blue-400/20 hover:bg-yellow-400/20 border-2 border-blue-400/50 hover:border-yellow-400/70 rounded-lg transition-all duration-300 font-bold">
                    <FiDownload className="w-4 lg:w-5 h-4 lg:h-5 lg:mr-2" />
                    <span className="hidden lg:inline">Relatório</span>
                  </button>
                </div>
              </div>
            </header>

            {/* Content */}
            <main className="p-4 lg:p-8 bg-black min-h-screen">
              {/* Tabs */}
              <MobileTabs
                tabs={[
                  { id: 'balances', label: 'Saldos', icon: <FiDollarSign className="w-4 h-4" /> },
                  { id: 'coupons', label: 'Cupons', icon: <FiGift className="w-4 h-4" /> },
                  { id: 'history', label: 'Histórico', icon: <FiFileText className="w-4 h-4" /> }
                ]}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />

              {/* Tab Content */}
              {activeTab === 'balances' && (
                <div className="space-y-6">
                  {/* Search and Filters */}
                  <MobileCard>
                    <div className="space-y-4 lg:space-y-0 lg:flex lg:items-center lg:space-x-4">
                      <div className="flex-1">
                        <MobileInput
                          label="Buscar usuário"
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Nome, email ou WhatsApp..."
                          icon={<FiSearch className="w-5 h-5" />}
                        />
                      </div>
                      
                      <div className="lg:w-48">
                        <label className="block text-blue-400 text-sm font-bold mb-2">Status</label>
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="w-full px-3 py-2 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                        >
                          <option value="all">Todos</option>
                          <option value="active">Ativos</option>
                          <option value="inactive">Inativos</option>
                        </select>
                      </div>
                    </div>
                  </MobileCard>

                  {/* Users List */}
                  <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 3 }}>
                    {users.map((user) => (
                      <MobileCard key={user.id} className="border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-yellow-400 font-bold">{user.name}</h3>
                              <p className="text-blue-400 text-sm">{user.email}</p>
                              <p className="text-blue-400 text-sm">{user.whatsapp}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.status === 'active' ? 'bg-green-400/20 text-green-400' : 'bg-red-400/20 text-red-400'}`}>
                              {user.status}
                            </span>
                          </div>
                          
                          <div className="border-t border-yellow-400/30 pt-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-blue-400 text-sm">Saldo:</span>
                              <span className="text-2xl font-bold text-green-400">
                                ${user.balance.toFixed(2)}
                              </span>
                            </div>
                            
                            <div className="flex space-x-2">
                              <MobileButton
                                size="sm"
                                variant="primary"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowBalanceModal(true);
                                }}
                                className="flex-1 bg-yellow-400/20 text-yellow-400 border-yellow-400/50"
                              >
                                Ajustar
                              </MobileButton>
                              <MobileButton
                                size="sm"
                                variant="secondary"
                                onClick={() => {}}
                                icon={<FiEye className="w-4 h-4" />}
                                className="px-3"
                              />
                            </div>
                          </div>
                        </div>
                      </MobileCard>
                    ))}
                  </ResponsiveGrid>
                </div>
              )}

              {activeTab === 'coupons' && (
                <div className="space-y-6">
                  <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 3 }}>
                    {coupons.map((coupon) => (
                      <MobileCard key={coupon.id} className="border-pink-400/50 shadow-[0_0_20px_rgba(236,72,153,0.3)]">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-yellow-400 font-bold text-lg">{coupon.code}</h3>
                              <p className="text-blue-400 text-sm">{coupon.description}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${coupon.status === 'active' ? 'bg-green-400/20 text-green-400' : 'bg-red-400/20 text-red-400'}`}>
                              {coupon.status}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-blue-400">Valor:</span>
                              <p className="text-green-400 font-bold">${coupon.amount}</p>
                            </div>
                            <div>
                              <span className="text-blue-400">Uso:</span>
                              <p className="text-yellow-400 font-bold">{coupon.used_count}/{coupon.usage_limit}</p>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <MobileButton
                              size="sm"
                              variant="primary"
                              onClick={() => navigator.clipboard.writeText(coupon.code)}
                              icon={<FiCopy className="w-4 h-4" />}
                              className="flex-1 bg-blue-400/20 text-blue-400 border-blue-400/50"
                            >
                              Copiar
                            </MobileButton>
                            <MobileButton
                              size="sm"
                              variant="secondary"
                              onClick={() => {}}
                              icon={<FiEdit className="w-4 h-4" />}
                              className="px-3"
                            />
                          </div>
                        </div>
                      </MobileCard>
                    ))}
                  </ResponsiveGrid>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-6">
                  <MobileCard>
                    {adjustments.map((adj) => (
                      <div key={adj.id} className="border-b border-yellow-400/30 pb-4 mb-4 last:border-b-0 last:mb-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-yellow-400 font-bold">{adj.user_name}</h3>
                            <p className="text-blue-400 text-sm">{adj.description}</p>
                          </div>
                          <span className={`text-lg font-bold ${adj.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {adj.amount >= 0 ? '+' : ''}${adj.amount}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-blue-400">
                          <span>Por: {adj.admin_name}</span>
                          <span>{new Date(adj.created_at).toLocaleString('pt-BR')}</span>
                        </div>
                      </div>
                    ))}
                  </MobileCard>
                </div>
              )}
            </main>
          </div>
        </div>

        {/* Balance Adjustment Modal */}
        {showBalanceModal && selectedUser && (
          <MobileModal
            isOpen={showBalanceModal}
            onClose={() => setShowBalanceModal(false)}
            title={`Ajustar Saldo - ${selectedUser.name}`}
          >
            <div className="space-y-4">
              <div className="text-center p-4 bg-blue-400/10 rounded-lg border border-blue-400/30">
                <p className="text-blue-400 text-sm">Saldo Atual</p>
                <p className="text-2xl font-bold text-green-400">${selectedUser.balance.toFixed(2)}</p>
              </div>
              
              <MobileInput
                label="Valor do Ajuste"
                type="number"
                value={balanceForm.amount}
                onChange={(e) => setBalanceForm(prev => ({...prev, amount: e.target.value}))}
                placeholder="0.00"
              />
              
              <div>
                <label className="block text-blue-400 text-sm font-bold mb-2">Tipo</label>
                <select
                  value={balanceForm.type}
                  onChange={(e) => setBalanceForm(prev => ({...prev, type: e.target.value}))}
                  className="w-full px-3 py-2 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                >
                  <option value="manual_credit">Crédito Manual</option>
                  <option value="manual_debit">Débito Manual</option>
                </select>
              </div>
              
              <MobileInput
                label="Descrição"
                type="text"
                value={balanceForm.description}
                onChange={(e) => setBalanceForm(prev => ({...prev, description: e.target.value}))}
                placeholder="Motivo do ajuste..."
              />
              
              <div className="flex space-x-4">
                <MobileButton
                  variant="secondary"
                  onClick={() => setShowBalanceModal(false)}
                  className="flex-1"
                >
                  Cancelar
                </MobileButton>
                <MobileButton
                  variant="primary"
                  onClick={() => {}}
                  className="flex-1 bg-yellow-400 text-black"
                >
                  Confirmar
                </MobileButton>
              </div>
            </div>
          </MobileModal>
        )}

        {/* Coupon Creation Modal */}
        {showCouponModal && (
          <MobileModal
            isOpen={showCouponModal}
            onClose={() => setShowCouponModal(false)}
            title="Criar Novo Cupom"
          >
            <div className="space-y-4">
              <div className="flex space-x-2">
                <MobileInput
                  label="Código do Cupom"
                  type="text"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm(prev => ({...prev, code: e.target.value}))}
                  placeholder="CBC123"
                  className="flex-1"
                />
                <MobileButton
                  variant="secondary"
                  onClick={() => {
                    const code = 'CBC' + Math.random().toString(36).substr(2, 8).toUpperCase();
                    setCouponForm(prev => ({ ...prev, code }));
                  }}
                  icon={<FiRefreshCw className="w-4 h-4" />}
                  className="mt-7"
                />
              </div>
              
              <MobileInput
                label="Valor"
                type="number"
                value={couponForm.amount}
                onChange={(e) => setCouponForm(prev => ({...prev, amount: e.target.value}))}
                placeholder="0.00"
              />
              
              <MobileInput
                label="Descrição"
                type="text"
                value={couponForm.description}
                onChange={(e) => setCouponForm(prev => ({...prev, description: e.target.value}))}
                placeholder="Descrição do cupom..."
              />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-blue-400 text-sm font-bold mb-2">Limite de Uso</label>
                  <input
                    type="number"
                    value={couponForm.usage_limit}
                    onChange={(e) => setCouponForm(prev => ({...prev, usage_limit: e.target.value}))}
                    placeholder="100"
                    className="w-full px-3 py-2 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-blue-400 text-sm font-bold mb-2">Tipo</label>
                  <select
                    value={couponForm.type}
                    onChange={(e) => setCouponForm(prev => ({...prev, type: e.target.value}))}
                    className="w-full px-3 py-2 bg-black/50 border-2 border-yellow-400/30 rounded-lg text-yellow-400 focus:border-yellow-400/70 focus:outline-none transition-colors"
                  >
                    <option value="single_use">Uso Único</option>
                    <option value="multi_use">Múltiplos Usos</option>
                  </select>
                </div>
              </div>
              
              <MobileInput
                label="Data de Expiração"
                type="datetime-local"
                value={couponForm.expires_at}
                onChange={(e) => setCouponForm(prev => ({...prev, expires_at: e.target.value}))}
              />
              
              <div className="flex space-x-4">
                <MobileButton
                  variant="secondary"
                  onClick={() => setShowCouponModal(false)}
                  className="flex-1"
                >
                  Cancelar
                </MobileButton>
                <MobileButton
                  variant="primary"
                  onClick={() => {}}
                  className="flex-1 bg-green-400 text-black"
                >
                  Criar Cupom
                </MobileButton>
              </div>
            </div>
          </MobileModal>
        )}
      </div>
    </>
  );
}
