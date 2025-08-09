import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { 
  FiHome, 
  FiUsers, 
  FiBarChart, 
  FiSettings, 
  FiLogOut,
  FiMenu,
  FiX,
  FiUserCheck,
  FiDollarSign,
  FiActivity,
  FiAlertTriangle,
  FiCreditCard,
  FiTrendingUp,
  FiDatabase,
  FiRefreshCw
} from 'react-icons/fi';

interface DashboardData {
  timestamp: string;
  
  // LEITURA DO MERCADO
  marketReading: {
    direction: 'LONG' | 'SHORT' | 'NEUTRO';
    justification: string;
    confidence: number;
    lastUpdate: string;
  };
  
  // SINAIS
  signals: {
    coinStars: Array<{
      id: string;
      symbol: string;
      signal: string;
      time: string;
      confidence: number;
    }>;
    tradingView: Array<{
      id: string;
      symbol: string;
      action: string;
      time: string;
      source: string;
    }>;
    total: number;
    processed: number;
    pending: number;
    avgConfidence: number;
  };
  
  // MICROSERVIÇOS
  microservices: {
    signalIngestor: {
      status: string;
      lastReport: string;
      processed24h: number;
      errors24h: number;
    };
    signalProcessor: {
      status: string;
      lastReport: string;
      processed24h: number;
      avgProcessingTime: number;
    };
    decisionEngine: {
      status: string;
      lastReport: string;
      decisions24h: number;
      accuracy: number;
    };
    orderExecutor: {
      status: string;
      lastReport: string;
      executed24h: number;
      successRate: number;
    };
  };
  
  // RELATÓRIOS IA
  aiReports: Array<{
    id: string;
    type: string;
    summary: string;
    confidence: number;
    generatedAt: string;
  }>;
  
  // ATIVIDADES DO SISTEMA
  systemActivities: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    severity: 'info' | 'warning' | 'error' | 'success';
  }>;
  
  // OPERAÇÕES EM ANDAMENTO
  liveOperations: Array<{
    id: string;
    symbol: string;
    side: string;
    status: 'OPEN' | 'PENDING' | 'EXECUTING' | 'MONITORING';
    entryPrice: number;
    currentPrice: number;
    unrealizedPnL: number;
    startTime: string;
    environment: 'testnet' | 'mainnet';
  }>;
  
  // ASSERTIVIDADE E RETORNO
  performance: {
    accuracy: {
      today: number;
      historical: number;
    };
    returns: {
      today: number;
      historical: number;
    };
  };
  
  // USUÁRIOS
  users: {
    total: number;
    active: number;
    newToday: number;
    newThisMonth: number;
    activeTestnet: number;
    activeMainnet: number;
    totalBalance: number;
    growth: {
      daily: number;
      weekly: number;
      monthly: number;
    };
  };
  
  // EVOLUÇÃO DOS INDICADORES
  growthIndicators: {
    userGrowth: Array<{ date: string; count: number }>;
    performanceGrowth: Array<{ date: string; accuracy: number; returns: number }>;
    operationsGrowth: Array<{ date: string; count: number; volume: number }>;
  };
  
  trading: {
    totalOperations: number;
    openOperations: number;
    profitableOperations: number;
    avgProfitLoss: number;
    totalProfitLoss: number;
    recentOperations: Array<{
      id: string;
      symbol: string;
      side: string;
      profit_loss: number;
      user_email: string;
      created_at: string;
    }>;
  };
  
  affiliates: {
    total: number;
    active: number;
    totalCommissions: number;
    pendingCommissions: number;
  };
  
  system: {
    services: Array<{
      service_name: string;
      status: string;
      last_heartbeat: string;
      response_time_ms: number;
    }>;
  };
  
  financial: {
    totalDeposits: number;
    totalWithdrawals: number;
    activeSubscriptions: number;
    monthlyRevenue: number;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  user_type: 'admin' | 'user' | 'affiliate';
}

const AdminDashboard = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const userData = localStorage.getItem('user_data');

        if (!token || !userData) {
          router.push('/auth/login');
          return;
        }

        const parsedUser = JSON.parse(userData);
        
        if (parsedUser.user_type !== 'admin') {
          router.push('/dashboard');
          return;
        }

        setUser(parsedUser);
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      
      // Auto-refresh a cada 30 segundos
      const interval = setInterval(fetchDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      console.log('🔄 Buscando dados reais do dashboard...');
      const response = await fetch('/api/admin/dashboard-real');
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      setDashboardData(data);
      setLastUpdate(new Date().toLocaleTimeString('pt-BR'));
      setError(null);
      console.log('✅ Dados do dashboard carregados:', data);
      
    } catch (err) {
      console.error('❌ Erro ao carregar dashboard:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setDataLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      router.push('/auth/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0B0F1E 0%, #1a1a2e 50%, #16213e 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            border: '4px solid rgba(255, 255, 255, 0.1)',
            borderTop: '4px solid #E6C200',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ color: '#FFFFFF', fontSize: '1.1rem' }}>
            Verificando autenticação...
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <Head>
        <title>Dashboard Admin - CoinBitClub</title>
        <meta name="description" content="Painel administrativo com dados reais do PostgreSQL" />
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0B0F1E 0%, #1a1a2e 50%, #16213e 100%)',
        display: 'flex'
      }}>
        {/* Sidebar */}
        <div style={{
          width: sidebarOpen ? '250px' : '80px',
          background: 'linear-gradient(180deg, rgba(11, 15, 30, 0.95) 0%, rgba(26, 26, 46, 0.95) 100%)',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          transition: 'width 0.3s ease',
          position: 'fixed',
          height: '100vh',
          zIndex: 1000
        }}>
          <div style={{ padding: '20px' }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: 'none',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '1.5rem',
                cursor: 'pointer',
                marginBottom: '20px'
              }}
            >
              {sidebarOpen ? <FiX /> : <FiMenu />}
            </button>

            <nav style={{ marginTop: '20px' }}>
              <div style={{ marginBottom: '30px' }}>
                <Link href="/admin/dashboard-new" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '12px', 
                  color: '#E6C200',
                  textDecoration: 'none',
                  background: 'rgba(230, 194, 0, 0.1)',
                  borderRadius: '8px'
                }}>
                  <FiHome style={{ fontSize: '1.2rem' }} />
                  {sidebarOpen && <span style={{ marginLeft: '12px' }}>Dashboard</span>}
                </Link>
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <Link href="/admin/users-real" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '12px', 
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  transition: 'background 0.3s ease'
                }}>
                  <FiUsers style={{ fontSize: '1.2rem' }} />
                  {sidebarOpen && <span style={{ marginLeft: '12px' }}>Usuários</span>}
                </Link>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <Link href="/admin/operations-real" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '12px', 
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  borderRadius: '8px'
                }}>
                  <FiBarChart style={{ fontSize: '1.2rem' }} />
                  {sidebarOpen && <span style={{ marginLeft: '12px' }}>Operações</span>}
                </Link>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <Link href="/admin/affiliates-real" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '12px', 
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  borderRadius: '8px'
                }}>
                  <FiUserCheck style={{ fontSize: '1.2rem' }} />
                  {sidebarOpen && <span style={{ marginLeft: '12px' }}>Afiliados</span>}
                </Link>
              </div>
            </nav>

            <div style={{ position: 'absolute', bottom: '20px', left: '20px' }}>
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'none',
                  border: 'none',
                  color: '#FF6B6B',
                  cursor: 'pointer',
                  padding: '8px'
                }}
              >
                <FiLogOut style={{ fontSize: '1.2rem' }} />
                {sidebarOpen && <span style={{ marginLeft: '12px' }}>Sair</span>}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{
          marginLeft: sidebarOpen ? '250px' : '80px',
          flex: 1,
          padding: '20px',
          transition: 'margin-left 0.3s ease'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '30px'
          }}>
            <div>
              <h1 style={{ 
                color: '#FFFFFF', 
                fontSize: '2rem', 
                margin: 0,
                background: 'linear-gradient(135deg, #E6C200, #FFF700)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Dashboard Admin
              </h1>
              <p style={{ color: '#B0B3B8', margin: '5px 0 0 0' }}>
                🔗 PostgreSQL: yamabiko.proxy.rlwy.net | Última atualização: {lastUpdate}
              </p>
            </div>
            
            <button
              onClick={fetchDashboardData}
              disabled={dataLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: dataLoading ? 'rgba(255, 255, 255, 0.1)' : 'linear-gradient(135deg, #4A9EDB, #74B9FF)',
                color: '#FFFFFF',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '8px',
                cursor: dataLoading ? 'not-allowed' : 'pointer',
                fontWeight: '600'
              }}
            >
              <FiRefreshCw style={{ 
                fontSize: '1rem',
                animation: dataLoading ? 'spin 1s linear infinite' : 'none'
              }} />
              {dataLoading ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>

          {/* Loading State */}
          {dataLoading && !dashboardData && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '400px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  border: '4px solid rgba(255, 255, 255, 0.1)',
                  borderTop: '4px solid #E6C200',
                  borderRadius: '50%',
                  width: '50px',
                  height: '50px',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 20px'
                }}></div>
                <p style={{ color: '#FFFFFF', fontSize: '1.1rem' }}>
                  Carregando dados reais do PostgreSQL...
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div style={{
              background: 'rgba(255, 107, 107, 0.1)',
              border: '1px solid rgba(255, 107, 107, 0.3)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <h3 style={{ color: '#FF6B6B', margin: '0 0 10px 0' }}>
                ❌ Erro na Conexão
              </h3>
              <p style={{ color: '#FFFFFF', margin: 0 }}>
                {error}
              </p>
            </div>
          )}

          {/* Dashboard Data */}
          {dashboardData && (
            <div>
              {/* KPI Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px',
                marginBottom: '30px'
              }}>
                {/* Usuários */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(74, 158, 219, 0.15), rgba(74, 158, 219, 0.08))',
                  border: '1px solid rgba(74, 158, 219, 0.3)',
                  borderRadius: '12px',
                  padding: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                    <FiUsers style={{ fontSize: '1.5rem', color: '#4A9EDB', marginRight: '10px' }} />
                    <h3 style={{ color: '#FFFFFF', margin: 0 }}>Usuários</h3>
                  </div>
                  <div style={{ color: '#E6C200', fontSize: '2rem', fontWeight: 'bold', marginBottom: '5px' }}>
                    {dashboardData.users.total.toLocaleString()}
                  </div>
                  <div style={{ color: '#B0B3B8', fontSize: '0.9rem' }}>
                    {dashboardData.users.active} ativos • {dashboardData.users.newThisMonth} novos este mês
                  </div>
                  <div style={{ color: '#4A9EDB', fontSize: '0.9rem', marginTop: '8px' }}>
                    Saldo Total: ${dashboardData.users.totalBalance.toLocaleString()}
                  </div>
                </div>

                {/* Trading */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(0, 255, 127, 0.15), rgba(0, 255, 127, 0.08))',
                  border: '1px solid rgba(0, 255, 127, 0.3)',
                  borderRadius: '12px',
                  padding: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                    <FiTrendingUp style={{ fontSize: '1.5rem', color: '#00FF7F', marginRight: '10px' }} />
                    <h3 style={{ color: '#FFFFFF', margin: 0 }}>Trading</h3>
                  </div>
                  <div style={{ color: '#E6C200', fontSize: '2rem', fontWeight: 'bold', marginBottom: '5px' }}>
                    {dashboardData.trading.totalOperations}
                  </div>
                  <div style={{ color: '#B0B3B8', fontSize: '0.9rem' }}>
                    {dashboardData.trading.openOperations} abertas • {dashboardData.trading.profitableOperations} lucrativas
                  </div>
                  <div style={{ 
                    color: dashboardData.trading.totalProfitLoss >= 0 ? '#00FF7F' : '#FF6B6B', 
                    fontSize: '0.9rem', 
                    marginTop: '8px' 
                  }}>
                    P&L Total: ${dashboardData.trading.totalProfitLoss.toFixed(2)}
                  </div>
                </div>

                {/* Sinais */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(186, 85, 211, 0.15), rgba(186, 85, 211, 0.08))',
                  border: '1px solid rgba(186, 85, 211, 0.3)',
                  borderRadius: '12px',
                  padding: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                    <FiActivity style={{ fontSize: '1.5rem', color: '#BA55D3', marginRight: '10px' }} />
                    <h3 style={{ color: '#FFFFFF', margin: 0 }}>Sinais IA</h3>
                  </div>
                  <div style={{ color: '#E6C200', fontSize: '2rem', fontWeight: 'bold', marginBottom: '5px' }}>
                    {dashboardData.signals.total}
                  </div>
                  <div style={{ color: '#B0B3B8', fontSize: '0.9rem' }}>
                    {dashboardData.signals.processed} processados • {dashboardData.signals.pending} pendentes
                  </div>
                  <div style={{ color: '#BA55D3', fontSize: '0.9rem', marginTop: '8px' }}>
                    Confiança Média: {dashboardData.signals.avgConfidence.toFixed(1)}%
                  </div>
                </div>

                {/* Financeiro */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(230, 194, 0, 0.15), rgba(230, 194, 0, 0.08))',
                  border: '1px solid rgba(230, 194, 0, 0.3)',
                  borderRadius: '12px',
                  padding: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                    <FiDollarSign style={{ fontSize: '1.5rem', color: '#E6C200', marginRight: '10px' }} />
                    <h3 style={{ color: '#FFFFFF', margin: 0 }}>Financeiro</h3>
                  </div>
                  <div style={{ color: '#E6C200', fontSize: '2rem', fontWeight: 'bold', marginBottom: '5px' }}>
                    ${dashboardData.financial.monthlyRevenue.toLocaleString()}
                  </div>
                  <div style={{ color: '#B0B3B8', fontSize: '0.9rem' }}>
                    Receita mensal • {dashboardData.financial.activeSubscriptions} assinaturas ativas
                  </div>
                  <div style={{ color: '#E6C200', fontSize: '0.9rem', marginTop: '8px' }}>
                    Depósitos: ${dashboardData.financial.totalDeposits.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Operações Recentes */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '30px'
              }}>
                <h3 style={{ color: '#FFFFFF', marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
                  <FiBarChart style={{ marginRight: '10px', color: '#4A9EDB' }} />
                  Operações Recentes
                </h3>
                
                {dashboardData.trading.recentOperations.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', color: '#FFFFFF' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                          <th style={{ padding: '12px', textAlign: 'left', color: '#B0B3B8' }}>Par</th>
                          <th style={{ padding: '12px', textAlign: 'left', color: '#B0B3B8' }}>Lado</th>
                          <th style={{ padding: '12px', textAlign: 'left', color: '#B0B3B8' }}>Usuário</th>
                          <th style={{ padding: '12px', textAlign: 'right', color: '#B0B3B8' }}>P&L</th>
                          <th style={{ padding: '12px', textAlign: 'left', color: '#B0B3B8' }}>Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardData.trading.recentOperations.map((op, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <td style={{ padding: '12px', fontWeight: '600' }}>{op.symbol}</td>
                            <td style={{ 
                              padding: '12px',
                              color: op.side === 'BUY' ? '#00FF7F' : '#FF6B6B'
                            }}>
                              {op.side}
                            </td>
                            <td style={{ padding: '12px' }}>{op.user_email}</td>
                            <td style={{ 
                              padding: '12px', 
                              textAlign: 'right',
                              color: parseFloat(op.profit_loss.toString()) >= 0 ? '#00FF7F' : '#FF6B6B',
                              fontWeight: '600'
                            }}>
                              ${parseFloat(op.profit_loss.toString()).toFixed(2)}
                            </td>
                            <td style={{ padding: '12px', color: '#B0B3B8' }}>
                              {new Date(op.created_at).toLocaleDateString('pt-BR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ color: '#B0B3B8', textAlign: 'center', padding: '20px' }}>
                    Nenhuma operação recente encontrada
                  </p>
                )}
              </div>

              {/* Status dos Microserviços */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '20px'
              }}>
                <h3 style={{ color: '#FFFFFF', marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
                  <FiDatabase style={{ marginRight: '10px', color: '#BA55D3' }} />
                  Status dos Microserviços
                </h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '15px'
                }}>
                  {dashboardData.system.services.length > 0 ? (
                    dashboardData.system.services.map((service, index) => (
                      <div key={index} style={{
                        background: service.status === 'online' 
                          ? 'linear-gradient(135deg, rgba(0, 255, 127, 0.15), rgba(0, 255, 127, 0.08))'
                          : 'linear-gradient(135deg, rgba(255, 107, 107, 0.15), rgba(255, 107, 107, 0.08))',
                        border: service.status === 'online' 
                          ? '1px solid rgba(0, 255, 127, 0.3)'
                          : '1px solid rgba(255, 107, 107, 0.3)',
                        borderRadius: '8px',
                        padding: '15px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <h4 style={{ color: '#FFFFFF', margin: 0, fontSize: '0.9rem' }}>
                            {service.service_name}
                          </h4>
                          <div style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: service.status === 'online' ? '#00FF7F' : '#FF6B6B'
                          }}></div>
                        </div>
                        <div style={{ color: '#B0B3B8', fontSize: '0.8rem', marginTop: '8px' }}>
                          Status: {service.status} • {service.response_time_ms}ms
                        </div>
                        <div style={{ color: '#B0B3B8', fontSize: '0.8rem' }}>
                          Último heartbeat: {new Date(service.last_heartbeat).toLocaleTimeString('pt-BR')}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px' }}>
                      <p style={{ color: '#B0B3B8' }}>
                        ⚠️ Nenhum microserviço reportando status
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default AdminDashboard;
