import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { withAuth } from '../../src/components/withAuth';
import {
  UsersIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  CogIcon,
  DocumentTextIcon,
  BellIcon,
  ShieldCheckIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import type { User } from '../../src/lib/auth';

interface DashboardProps {
  user: User | null;
  isLoading: boolean;
  trialDaysRemaining: number;
}

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  churnRate: number;
  conversionRate: number;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  planType: string;
  status: string;
  createdAt: string;
  lastLogin: string;
  revenue: number;
}

const AdminDashboard: NextPage<DashboardProps> = ({ user, isLoading, trialDaysRemaining }) => {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 1248,
    activeUsers: 892,
    totalRevenue: 125670.50,
    monthlyRevenue: 38240.00,
    totalSubscriptions: 567,
    activeSubscriptions: 432,
    churnRate: 3.2,
    conversionRate: 18.5
  });
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  // Verificar se é admin
  if (user?.role !== 'admin') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #000000 0%, #0a0a0b 25%, #1a1a1c 50%, #0a0a0b 75%, #000000 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ff6b6b'
      }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <ShieldCheckIcon style={{ width: '64px', height: '64px', margin: '0 auto 1rem', color: '#ff6b6b' }} />
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Acesso Negado</h1>
          <p>Você não tem permissão para acessar esta área.</p>
        </div>
      </div>
    );
  }

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #000000 0%, #0a0a0b 25%, #1a1a1c 50%, #0a0a0b 75%, #000000 100%)',
    color: '#FAFBFD',
    fontFamily: "'Inter', sans-serif"
  };

  const headerStyle = {
    padding: '2rem',
    borderBottom: '1px solid rgba(255, 215, 0, 0.3)',
    background: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(20px)'
  };

  const tabsStyle = {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
    borderBottom: '1px solid rgba(255, 215, 0, 0.3)',
    paddingBottom: '1rem',
    flexWrap: 'wrap' as const
  };

  const tabStyle = (isActive: boolean) => ({
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    border: isActive ? '1px solid #FFD700' : '1px solid transparent',
    background: isActive ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
    color: isActive ? '#FFD700' : '#B0B3B8',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '0.875rem',
    fontWeight: isActive ? '600' : '400',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  });

  const statCardStyle = {
    background: 'rgba(0, 0, 0, 0.8)',
    border: '1px solid rgba(255, 215, 0, 0.3)',
    borderRadius: '12px',
    padding: '1.5rem',
    backdropFilter: 'blur(20px)'
  };

  const modalStyle = {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '2rem'
  };

  const modalContentStyle = {
    background: 'rgba(0, 0, 0, 0.95)',
    border: '1px solid rgba(255, 215, 0, 0.3)',
    borderRadius: '12px',
    padding: '2rem',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '80vh',
    overflowY: 'auto' as const
  };

  const StatCard = ({ title, value, change, icon: Icon, isPositive }: any) => (
    <div style={statCardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <p style={{ color: '#B0B3B8', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{title}</p>
          <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#FAFBFD' }}>{value}</p>
        </div>
        <Icon style={{ width: '32px', height: '32px', color: '#FFD700' }} />
      </div>
      {change && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isPositive ? (
            <ArrowTrendingUpIcon style={{ width: '16px', height: '16px', color: '#00ff00' }} />
          ) : (
            <ArrowTrendingDownIcon style={{ width: '16px', height: '16px', color: '#ff6b6b' }} />
          )}
          <span style={{ color: isPositive ? '#00ff00' : '#ff6b6b', fontSize: '0.875rem' }}>
            {change}
          </span>
        </div>
      )}
    </div>
  );

  // Mock users data
  const mockUsers = [
    { id: '1', name: 'João Silva', email: 'joao@example.com', planType: 'PRO', status: 'Ativo', createdAt: '2025-01-10', lastLogin: '2025-01-20', revenue: 197.00 },
    { id: '2', name: 'Maria Santos', email: 'maria@example.com', planType: 'BASIC', status: 'Ativo', createdAt: '2025-01-15', lastLogin: '2025-01-19', revenue: 97.00 },
    { id: '3', name: 'Pedro Costa', email: 'pedro@example.com', planType: 'ENTERPRISE', status: 'Ativo', createdAt: '2025-01-12', lastLogin: '2025-01-20', revenue: 497.00 },
    { id: '4', name: 'Ana Oliveira', email: 'ana@example.com', planType: 'TRIAL', status: 'Trial', createdAt: '2025-01-18', lastLogin: '2025-01-20', revenue: 0 },
    { id: '5', name: 'Carlos Ferreira', email: 'carlos@example.com', planType: 'PRO', status: 'Cancelado', createdAt: '2024-12-01', lastLogin: '2025-01-15', revenue: 394.00 }
  ];

  const handleViewUser = (user: UserData) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
    setShowUserModal(false);
  };

  return (
    <>
      <Head>
        <title>Admin Dashboard - CoinBitClub</title>
        <meta name="description" content="Painel administrativo do CoinBitClub" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={containerStyle}>
        {/* Header */}
        <header style={headerStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #FFD700, #FF69B4)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                marginBottom: '0.5rem'
              }}>
                🛡️ Admin Dashboard
              </h1>
              <p style={{ color: '#B0B3B8' }}>
                Bem-vindo, {user?.name}! Gerencie a plataforma CoinBitClub
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                background: 'rgba(255, 215, 0, 0.1)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem'
              }}>
                <ShieldCheckIcon style={{ width: '16px', height: '16px', display: 'inline', marginRight: '0.5rem' }} />
                Administrador
              </div>
              <div style={{
                background: 'rgba(0, 255, 0, 0.1)',
                border: '1px solid rgba(0, 255, 0, 0.3)',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                color: '#00ff00'
              }}>
                Sistema Online
              </div>
            </div>
          </div>
        </header>

        <div style={{ padding: '2rem' }}>
          {/* Tabs */}
          <div style={tabsStyle}>
            <div 
              style={tabStyle(activeTab === 'overview')}
              onClick={() => setActiveTab('overview')}
            >
              <ChartBarIcon style={{ width: '16px', height: '16px' }} />
              Visão Geral
            </div>
            <div 
              style={tabStyle(activeTab === 'users')}
              onClick={() => setActiveTab('users')}
            >
              <UsersIcon style={{ width: '16px', height: '16px' }} />
              Usuários ({stats.totalUsers})
            </div>
            <div 
              style={tabStyle(activeTab === 'revenue')}
              onClick={() => setActiveTab('revenue')}
            >
              <CurrencyDollarIcon style={{ width: '16px', height: '16px' }} />
              Receita
            </div>
            <div 
              style={tabStyle(activeTab === 'affiliates')}
              onClick={() => setActiveTab('affiliates')}
            >
              <DocumentTextIcon style={{ width: '16px', height: '16px' }} />
              Afiliados
            </div>
            <div 
              style={tabStyle(activeTab === 'settings')}
              onClick={() => setActiveTab('settings')}
            >
              <CogIcon style={{ width: '16px', height: '16px' }} />
              Configurações
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
              }}>
                <StatCard
                  title="Total de Usuários"
                  value={stats.totalUsers.toLocaleString()}
                  change="+12% este mês"
                  icon={UsersIcon}
                  isPositive={true}
                />
                <StatCard
                  title="Usuários Ativos"
                  value={stats.activeUsers.toLocaleString()}
                  change="+8% este mês"
                  icon={ArrowTrendingUpIcon}
                  isPositive={true}
                />
                <StatCard
                  title="Receita Total"
                  value={`R$ ${stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  change="+25% este mês"
                  icon={CurrencyDollarIcon}
                  isPositive={true}
                />
                <StatCard
                  title="Taxa de Conversão"
                  value={`${stats.conversionRate.toFixed(1)}%`}
                  change="+3.2% este mês"
                  icon={ChartBarIcon}
                  isPositive={true}
                />
              </div>

              {/* Quick Actions */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
              }}>
                <div style={statCardStyle}>
                  <h3 style={{ color: '#FFD700', marginBottom: '1rem', fontSize: '1.25rem' }}>
                    🚀 Ações Rápidas
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button style={{
                      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                      color: '#000',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}>
                      📧 Enviar Email para Todos
                    </button>
                    <button style={{
                      background: 'linear-gradient(135deg, #00BFFF, #0080FF)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}>
                      💰 Gerar Relatório de Receita
                    </button>
                    <button style={{
                      background: 'linear-gradient(135deg, #FF69B4, #FF1493)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}>
                      🎯 Criar Campanha
                    </button>
                  </div>
                </div>

                <div style={statCardStyle}>
                  <h3 style={{ color: '#FFD700', marginBottom: '1rem', fontSize: '1.25rem' }}>
                    📊 Atividade Recente
                  </h3>
                  <div style={{ color: '#B0B3B8', fontSize: '0.875rem' }}>
                    <p style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: '#00ff00' }}>•</span> 5 novos usuários registrados hoje
                    </p>
                    <p style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: '#FFD700' }}>•</span> 12 assinaturas convertidas esta semana
                    </p>
                    <p style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: '#00BFFF' }}>•</span> R$ 2.340,00 em receita hoje
                    </p>
                    <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: '#FF69B4' }}>•</span> 234 sinais de trading processados
                    </p>
                  </div>
                </div>
              </div>

              {/* System Status */}
              <div style={statCardStyle}>
                <h3 style={{ color: '#FFD700', marginBottom: '1rem', fontSize: '1.25rem' }}>
                  🔧 Status do Sistema
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem'
                }}>
                  <div>
                    <p style={{ color: '#B0B3B8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>API Status</p>
                    <p style={{ color: '#00ff00', fontSize: '0.875rem', fontWeight: '600' }}>✅ Online</p>
                  </div>
                  <div>
                    <p style={{ color: '#B0B3B8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Database</p>
                    <p style={{ color: '#00ff00', fontSize: '0.875rem', fontWeight: '600' }}>✅ Conectado</p>
                  </div>
                  <div>
                    <p style={{ color: '#B0B3B8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Payments</p>
                    <p style={{ color: '#00ff00', fontSize: '0.875rem', fontWeight: '600' }}>✅ Stripe OK</p>
                  </div>
                  <div>
                    <p style={{ color: '#B0B3B8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Email</p>
                    <p style={{ color: '#00ff00', fontSize: '0.875rem', fontWeight: '600' }}>✅ SMTP OK</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div style={statCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ color: '#FFD700', fontSize: '1.25rem' }}>👥 Gestão de Usuários</h3>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button style={{
                    background: 'linear-gradient(135deg, #00BFFF, #0080FF)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.5rem 1rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}>
                    📥 Importar
                  </button>
                  <button style={{
                    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                    color: '#000',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.5rem 1rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}>
                    📤 Exportar
                  </button>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 215, 0, 0.3)' }}>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: '#FFD700', fontSize: '0.875rem' }}>Nome</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: '#FFD700', fontSize: '0.875rem' }}>Email</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: '#FFD700', fontSize: '0.875rem' }}>Plano</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: '#FFD700', fontSize: '0.875rem' }}>Status</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: '#FFD700', fontSize: '0.875rem' }}>Receita</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: '#FFD700', fontSize: '0.875rem' }}>Registro</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: '#FFD700', fontSize: '0.875rem' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockUsers.map((user) => (
                      <tr key={user.id} style={{ borderBottom: '1px solid rgba(255, 215, 0, 0.1)' }}>
                        <td style={{ padding: '0.75rem', color: '#FAFBFD', fontSize: '0.875rem' }}>
                          {user.name}
                        </td>
                        <td style={{ padding: '0.75rem', color: '#B0B3B8', fontSize: '0.875rem' }}>
                          {user.email}
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                          <span style={{
                            background: user.planType === 'ENTERPRISE' ? 'rgba(255, 105, 180, 0.1)' : 
                                      user.planType === 'PRO' ? 'rgba(0, 255, 0, 0.1)' : 
                                      user.planType === 'BASIC' ? 'rgba(255, 215, 0, 0.1)' : 'rgba(128, 128, 128, 0.1)',
                            color: user.planType === 'ENTERPRISE' ? '#FF69B4' : 
                                  user.planType === 'PRO' ? '#00ff00' : 
                                  user.planType === 'BASIC' ? '#FFD700' : '#808080',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            {user.planType}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                          <span style={{
                            background: user.status === 'Ativo' ? 'rgba(0, 255, 0, 0.1)' : 
                                      user.status === 'Trial' ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)',
                            color: user.status === 'Ativo' ? '#00ff00' : 
                                  user.status === 'Trial' ? '#FFD700' : '#ff6b6b',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem'
                          }}>
                            {user.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', color: '#00ff00', fontSize: '0.875rem', fontWeight: '600' }}>
                          R$ {user.revenue.toFixed(2)}
                        </td>
                        <td style={{ padding: '0.75rem', color: '#B0B3B8', fontSize: '0.875rem' }}>
                          {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                              onClick={() => handleViewUser(user)}
                              style={{
                                background: 'transparent',
                                border: '1px solid #00BFFF',
                                borderRadius: '4px',
                                padding: '0.25rem',
                                cursor: 'pointer',
                                color: '#00BFFF'
                              }}
                              title="Ver detalhes"
                            >
                              <EyeIcon style={{ width: '16px', height: '16px' }} />
                            </button>
                            <button style={{
                              background: 'transparent',
                              border: '1px solid #FFD700',
                              borderRadius: '4px',
                              padding: '0.25rem',
                              cursor: 'pointer',
                              color: '#FFD700'
                            }}
                            title="Editar usuário"
                            >
                              <PencilIcon style={{ width: '16px', height: '16px' }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Revenue Tab */}
          {activeTab === 'revenue' && (
            <div style={statCardStyle}>
              <h3 style={{ color: '#FFD700', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
                💰 Análise de Receita
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
              }}>
                <div style={statCardStyle}>
                  <h4 style={{ color: '#FFD700', marginBottom: '0.5rem' }}>💵 Receita Hoje</h4>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>R$ 2.340,00</p>
                  <p style={{ color: '#00ff00', fontSize: '0.875rem' }}>+15% vs ontem</p>
                </div>
                <div style={statCardStyle}>
                  <h4 style={{ color: '#FFD700', marginBottom: '0.5rem' }}>📅 Este Mês</h4>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>R$ 45.680,00</p>
                  <p style={{ color: '#00ff00', fontSize: '0.875rem' }}>+25% vs mês anterior</p>
                </div>
                <div style={statCardStyle}>
                  <h4 style={{ color: '#FFD700', marginBottom: '0.5rem' }}>🔄 MRR</h4>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>R$ 38.240,00</p>
                  <p style={{ color: '#00ff00', fontSize: '0.875rem' }}>+18% crescimento</p>
                </div>
                <div style={statCardStyle}>
                  <h4 style={{ color: '#FFD700', marginBottom: '0.5rem' }}>📈 LTV</h4>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>R$ 1.245,00</p>
                  <p style={{ color: '#00ff00', fontSize: '0.875rem' }}>Lifetime Value</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <div>
                  <h4 style={{ color: '#FFD700', marginBottom: '1rem' }}>📊 Distribuição por Plano:</h4>
                  <div style={{ color: '#B0B3B8' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span>• Basic:</span>
                      <span style={{ color: '#FAFBFD', fontWeight: '600' }}>R$ 12.450,00 (32%)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span>• Pro:</span>
                      <span style={{ color: '#FAFBFD', fontWeight: '600' }}>R$ 22.130,00 (58%)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>• Enterprise:</span>
                      <span style={{ color: '#FAFBFD', fontWeight: '600' }}>R$ 4.100,00 (10%)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ color: '#FFD700', marginBottom: '1rem' }}>🎯 Métricas de Conversão:</h4>
                  <div style={{ color: '#B0B3B8' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span>• Trial → Paid:</span>
                      <span style={{ color: '#00ff00', fontWeight: '600' }}>18.5%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span>• Basic → Pro:</span>
                      <span style={{ color: '#00ff00', fontWeight: '600' }}>12.3%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>• Churn Rate:</span>
                      <span style={{ color: '#ff6b6b', fontWeight: '600' }}>3.2%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Affiliates Tab */}
          {activeTab === 'affiliates' && (
            <div style={statCardStyle}>
              <h3 style={{ color: '#FFD700', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
                🤝 Sistema de Afiliados
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
              }}>
                <div style={statCardStyle}>
                  <h4 style={{ color: '#FFD700', marginBottom: '0.5rem' }}>👥 Total de Afiliados</h4>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>156</p>
                  <p style={{ color: '#00ff00', fontSize: '0.875rem' }}>+8 este mês</p>
                </div>
                <div style={statCardStyle}>
                  <h4 style={{ color: '#FFD700', marginBottom: '0.5rem' }}>💰 Comissões Pagas</h4>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>R$ 8.234,00</p>
                  <p style={{ color: '#00ff00', fontSize: '0.875rem' }}>Este mês</p>
                </div>
                <div style={statCardStyle}>
                  <h4 style={{ color: '#FFD700', marginBottom: '0.5rem' }}>📈 Indicações</h4>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>342</p>
                  <p style={{ color: '#00ff00', fontSize: '0.875rem' }}>Total este mês</p>
                </div>
              </div>

              <div>
                <h4 style={{ color: '#FFD700', marginBottom: '1rem' }}>🏆 Top Afiliados:</h4>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {[
                    { name: 'Carlos Mendes', referrals: 23, commission: 1240.00, code: 'CBC123' },
                    { name: 'Fernanda Lima', referrals: 19, commission: 980.50, code: 'CBC456' },
                    { name: 'Roberto Silva', referrals: 15, commission: 765.00, code: 'CBC789' }
                  ].map((affiliate, index) => (
                    <div key={index} style={{
                      background: 'rgba(255, 215, 0, 0.05)',
                      border: '1px solid rgba(255, 215, 0, 0.2)',
                      borderRadius: '8px',
                      padding: '1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '1rem'
                    }}>
                      <div>
                        <p style={{ color: '#FAFBFD', fontWeight: '600', marginBottom: '0.25rem' }}>
                          #{index + 1} {affiliate.name}
                        </p>
                        <p style={{ color: '#B0B3B8', fontSize: '0.875rem' }}>
                          Código: {affiliate.code}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ color: '#FFD700', fontWeight: '600' }}>
                          {affiliate.referrals} indicações
                        </p>
                        <p style={{ color: '#00ff00', fontSize: '0.875rem' }}>
                          R$ {affiliate.commission.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div style={statCardStyle}>
              <h3 style={{ color: '#FFD700', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
                ⚙️ Configurações do Sistema
              </h3>
              
              <div style={{ display: 'grid', gap: '2rem' }}>
                <div>
                  <h4 style={{ color: '#FAFBFD', marginBottom: '1rem', fontSize: '1.1rem' }}>🔧 Configurações Gerais</h4>
                  <div style={{ color: '#B0B3B8', display: 'grid', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>• Plataforma:</span>
                      <span style={{ color: '#00ff00', fontWeight: '600' }}>Online</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>• Último backup:</span>
                      <span style={{ color: '#FAFBFD' }}>{new Date().toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>• Versão:</span>
                      <span style={{ color: '#FAFBFD' }}>v1.0.0</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>• Uptime:</span>
                      <span style={{ color: '#00ff00', fontWeight: '600' }}>99.9%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ color: '#FAFBFD', marginBottom: '1rem', fontSize: '1.1rem' }}>📧 Notificações</h4>
                  <div style={{ color: '#B0B3B8', display: 'grid', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>• Email:</span>
                      <span style={{ color: '#00ff00', fontWeight: '600' }}>Ativo</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>• SMS:</span>
                      <span style={{ color: '#FFD700', fontWeight: '600' }}>Configurar</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>• Push:</span>
                      <span style={{ color: '#00ff00', fontWeight: '600' }}>Ativo</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ color: '#FAFBFD', marginBottom: '1rem', fontSize: '1.1rem' }}>🛡️ Segurança</h4>
                  <div style={{ color: '#B0B3B8', display: 'grid', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>• SSL:</span>
                      <span style={{ color: '#00ff00', fontWeight: '600' }}>Ativo</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>• 2FA para admins:</span>
                      <span style={{ color: '#00ff00', fontWeight: '600' }}>Obrigatório</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>• Rate limiting:</span>
                      <span style={{ color: '#00ff00', fontWeight: '600' }}>Ativo</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>• Firewall:</span>
                      <span style={{ color: '#00ff00', fontWeight: '600' }}>Proteção máxima</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ color: '#FAFBFD', marginBottom: '1rem', fontSize: '1.1rem' }}>💳 Pagamentos</h4>
                  <div style={{ color: '#B0B3B8', display: 'grid', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>• Stripe:</span>
                      <span style={{ color: '#00ff00', fontWeight: '600' }}>Conectado</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>• PagSeguro:</span>
                      <span style={{ color: '#FFD700', fontWeight: '600' }}>Configurar</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>• PIX:</span>
                      <span style={{ color: '#00ff00', fontWeight: '600' }}>Ativo</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Details Modal */}
        {showUserModal && selectedUser && (
          <div style={modalStyle}>
            <div style={modalContentStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#FFD700', fontSize: '1.25rem' }}>👤 Detalhes do Usuário</h3>
                <button
                  onClick={handleCloseModal}
                  style={{
                    background: 'transparent',
                    border: '1px solid #ff6b6b',
                    borderRadius: '4px',
                    padding: '0.25rem',
                    cursor: 'pointer',
                    color: '#ff6b6b'
                  }}
                >
                  <XMarkIcon style={{ width: '20px', height: '20px' }} />
                </button>
              </div>

              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label style={{ color: '#B0B3B8', fontSize: '0.875rem' }}>Nome:</label>
                  <p style={{ color: '#FAFBFD', fontWeight: '600' }}>{selectedUser.name}</p>
                </div>
                <div>
                  <label style={{ color: '#B0B3B8', fontSize: '0.875rem' }}>Email:</label>
                  <p style={{ color: '#FAFBFD', fontWeight: '600' }}>{selectedUser.email}</p>
                </div>
                <div>
                  <label style={{ color: '#B0B3B8', fontSize: '0.875rem' }}>Plano:</label>
                  <p style={{ color: '#FFD700', fontWeight: '600' }}>{selectedUser.planType}</p>
                </div>
                <div>
                  <label style={{ color: '#B0B3B8', fontSize: '0.875rem' }}>Status:</label>
                  <p style={{ color: selectedUser.status === 'Ativo' ? '#00ff00' : '#ff6b6b', fontWeight: '600' }}>
                    {selectedUser.status}
                  </p>
                </div>
                <div>
                  <label style={{ color: '#B0B3B8', fontSize: '0.875rem' }}>Receita Total:</label>
                  <p style={{ color: '#00ff00', fontWeight: '600' }}>R$ {selectedUser.revenue.toFixed(2)}</p>
                </div>
                <div>
                  <label style={{ color: '#B0B3B8', fontSize: '0.875rem' }}>Data de Registro:</label>
                  <p style={{ color: '#FAFBFD' }}>{new Date(selectedUser.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <label style={{ color: '#B0B3B8', fontSize: '0.875rem' }}>Último Login:</label>
                  <p style={{ color: '#FAFBFD' }}>{new Date(selectedUser.lastLogin).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button style={{
                  background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                  color: '#000',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  ✏️ Editar
                </button>
                <button style={{
                  background: 'linear-gradient(135deg, #00BFFF, #0080FF)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  📧 Enviar Email
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default withAuth(AdminDashboard, {
  requireTrial: false // Admins não precisam de trial
});
