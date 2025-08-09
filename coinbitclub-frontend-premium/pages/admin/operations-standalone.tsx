import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { 
  FiHome, FiUsers, FiUserCheck, FiTrendingUp, FiAlertTriangle, 
  FiBarChart, FiDollarSign, FiSettings, FiSearch, FiFilter,
  FiEdit, FiTrash2, FiPlus, FiEye, FiActivity, FiClock,
  FiCheckCircle, FiXCircle, FiPauseCircle
} from 'react-icons/fi';

interface Operation {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  symbol: string;
  operation_type: 'buy' | 'sell';
  amount: number;
  entry_price: number;
  exit_price: number | null;
  status: 'open' | 'closed' | 'cancelled';
  profit_loss: number;
  profit_percentage: number;
  created_at: string;
  closed_at: string | null;
  signal_source: string;
  execution_time: number;
  fees: number;
}

export default function OperationsManagementStandalone() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [filteredOperations, setFilteredOperations] = useState<Operation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [operationsPerPage] = useState(15);

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
        await loadOperations();
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const loadOperations = async () => {
    try {
      const response = await fetch('/api/admin/operations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOperations(data.operations || []);
        setFilteredOperations(data.operations || []);
      } else {
        // Dados mock em caso de erro
        const mockOperations: Operation[] = [
          {
            id: '1',
            user_id: '1',
            user_name: 'João Silva',
            user_email: 'joao@coinbitclub.com',
            symbol: 'BTCUSDT',
            operation_type: 'buy',
            amount: 0.5,
            entry_price: 42500.00,
            exit_price: 43200.00,
            status: 'closed',
            profit_loss: 350.00,
            profit_percentage: 1.65,
            created_at: '2025-01-25T08:30:00Z',
            closed_at: '2025-01-25T09:15:00Z',
            signal_source: 'TradingView Alert',
            execution_time: 2700000, // 45 minutos em ms
            fees: 15.75
          },
          {
            id: '2',
            user_id: '2',
            user_name: 'Maria Santos',
            user_email: 'maria@coinbitclub.com',
            symbol: 'ETHUSDT',
            operation_type: 'sell',
            amount: 2.0,
            entry_price: 2340.50,
            exit_price: null,
            status: 'open',
            profit_loss: -45.20,
            profit_percentage: -0.97,
            created_at: '2025-01-25T07:45:00Z',
            closed_at: null,
            signal_source: 'Decision Engine',
            execution_time: 0,
            fees: 0
          },
          {
            id: '3',
            user_id: '3',
            user_name: 'Carlos Oliveira',
            user_email: 'carlos@coinbitclub.com',
            symbol: 'ADAUSDT',
            operation_type: 'buy',
            amount: 1000.0,
            entry_price: 0.485,
            exit_price: 0.492,
            status: 'closed',
            profit_loss: 7.00,
            profit_percentage: 1.44,
            created_at: '2025-01-25T06:20:00Z',
            closed_at: '2025-01-25T08:10:00Z',
            signal_source: 'CoinStats API',
            execution_time: 6600000, // 110 minutos em ms
            fees: 2.25
          },
          {
            id: '4',
            user_id: '4',
            user_name: 'Ana Costa',
            user_email: 'ana@coinbitclub.com',
            symbol: 'BNBUSDT',
            operation_type: 'buy',
            amount: 5.0,
            entry_price: 315.80,
            exit_price: null,
            status: 'open',
            profit_loss: 23.50,
            profit_percentage: 1.49,
            created_at: '2025-01-25T09:00:00Z',
            closed_at: null,
            signal_source: 'Manual',
            execution_time: 0,
            fees: 0
          },
          {
            id: '5',
            user_id: '1',
            user_name: 'João Silva',
            user_email: 'joao@coinbitclub.com',
            symbol: 'DOTUSDT',
            operation_type: 'sell',
            amount: 50.0,
            entry_price: 7.25,
            exit_price: 6.95,
            status: 'cancelled',
            profit_loss: -15.00,
            profit_percentage: -4.14,
            created_at: '2025-01-24T15:30:00Z',
            closed_at: '2025-01-24T16:45:00Z',
            signal_source: 'Stop Loss',
            execution_time: 4500000, // 75 minutos em ms
            fees: 1.80
          }
        ];
        setOperations(mockOperations);
        setFilteredOperations(mockOperations);
      }
    } catch (error) {
      console.error('Erro ao carregar operações:', error);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    filterOperations(term, filterType);
  };

  const handleFilter = (type: string) => {
    setFilterType(type);
    filterOperations(searchTerm, type);
  };

  const filterOperations = (search: string, type: string) => {
    let filtered = operations;

    if (search) {
      filtered = filtered.filter(operation => 
        operation.user_name.toLowerCase().includes(search.toLowerCase()) ||
        operation.symbol.toLowerCase().includes(search.toLowerCase()) ||
        operation.signal_source.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (type !== 'all') {
      filtered = filtered.filter(operation => {
        switch (type) {
          case 'open': return operation.status === 'open';
          case 'closed': return operation.status === 'closed';
          case 'cancelled': return operation.status === 'cancelled';
          case 'buy': return operation.operation_type === 'buy';
          case 'sell': return operation.operation_type === 'sell';
          case 'profitable': return operation.profit_loss > 0;
          case 'loss': return operation.profit_loss < 0;
          default: return true;
        }
      });
    }

    setFilteredOperations(filtered);
    setCurrentPage(1);
  };

  const handleOperationAction = async (operationId: string, action: string) => {
    try {
      const response = await fetch(`/api/admin/operations/${operationId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await loadOperations();
        alert(`Ação "${action}" executada com sucesso!`);
      } else {
        alert('Erro ao executar ação');
      }
    } catch (error) {
      console.error('Erro ao executar ação:', error);
      alert('Erro ao executar ação');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatDuration = (ms: number) => {
    if (ms === 0) return '-';
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#4A9EDB';
      case 'closed': return '#2ECC71';
      case 'cancelled': return '#E74C3C';
      default: return '#95A5A6';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <FiActivity />;
      case 'closed': return <FiCheckCircle />;
      case 'cancelled': return <FiXCircle />;
      default: return <FiPauseCircle />;
    }
  };

  const getProfitColor = (profit: number) => {
    return profit >= 0 ? '#2ECC71' : '#E74C3C';
  };

  // Paginação
  const indexOfLastOperation = currentPage * operationsPerPage;
  const indexOfFirstOperation = indexOfLastOperation - operationsPerPage;
  const currentOperations = filteredOperations.slice(indexOfFirstOperation, indexOfLastOperation);
  const totalPages = Math.ceil(filteredOperations.length / operationsPerPage);

  // Estatísticas
  const stats = {
    total: filteredOperations.length,
    open: filteredOperations.filter(op => op.status === 'open').length,
    closed: filteredOperations.filter(op => op.status === 'closed').length,
    cancelled: filteredOperations.filter(op => op.status === 'cancelled').length,
    totalProfit: filteredOperations.reduce((sum, op) => sum + op.profit_loss, 0),
    totalFees: filteredOperations.reduce((sum, op) => sum + op.fees, 0)
  };

  const navigationItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: FiHome },
    { name: 'Gestão de Usuários', href: '/admin/users', icon: FiUsers },
    { name: 'Gestão de Afiliados', href: '/admin/affiliates', icon: FiUserCheck },
    { name: 'Operações', href: '/admin/operations', icon: FiTrendingUp, active: true },
    { name: 'Alertas', href: '/admin/alerts', icon: FiAlertTriangle },
    { name: 'Acertos', href: '/admin/acertos', icon: FiBarChart },
    { name: 'Contabilidade', href: '/admin/accounting', icon: FiDollarSign },
    { name: 'Configurações', href: '/admin/settings', icon: FiSettings },
  ];

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #000000 0%, #111111 100%)',
        color: '#FFFFFF'
      }}>
        <div style={{ fontSize: '1.2rem' }}>⚡ Carregando Operações...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Gestão de Operações - CoinBitClub Admin</title>
        <meta name="description" content="Gestão de operações do CoinBitClub" />
      </Head>

      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #000000 0%, #111111 100%)',
        color: '#FFFFFF',
        fontFamily: "'Inter', sans-serif",
        display: 'flex' 
      }}>
        {/* Sidebar */}
        <div style={{ 
          width: '280px', 
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(17, 17, 17, 0.9))',
          borderRight: '1px solid #333333',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          height: '100vh',
          left: 0,
          top: 0,
          zIndex: 30
        }}>
          {/* Header */}
          <div style={{ 
            padding: '2rem 1.5rem',
            background: 'linear-gradient(135deg, #E6C200, #D4AF37)',
            margin: '1rem',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <h1 style={{ 
              margin: 0, 
              fontSize: '1.5rem', 
              fontWeight: 'bold',
              color: '#000000'
            }}>
              🏛️ CoinBitClub
            </h1>
            <p style={{ 
              margin: '0.5rem 0 0 0', 
              fontSize: '0.9rem',
              color: '#000000',
              opacity: 0.8
            }}>
              Painel Administrativo
            </p>
          </div>

          {/* Navigation */}
          <nav style={{ flex: 1, padding: '0 1rem' }}>
            {navigationItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.875rem 1rem',
                  margin: '0.25rem 0',
                  borderRadius: '8px',
                  color: item.active ? '#000000' : '#FFFFFF',
                  background: item.active 
                    ? 'linear-gradient(135deg, #E6C200, #D4AF37)' 
                    : 'transparent',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  fontWeight: item.active ? 'bold' : 'normal',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!item.active) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!item.active) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <item.icon size={18} />
                {item.name}
              </a>
            ))}
          </nav>

          {/* User Info */}
          <div style={{ 
            padding: '1rem',
            borderTop: '1px solid #333333',
            background: 'rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #4A9EDB, #BA55D3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem'
              }}>
                👨‍💼
              </div>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{user?.name || 'Admin'}</div>
                <div style={{ color: '#B0B3B8', fontSize: '0.8rem' }}>Administrador</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'linear-gradient(135deg, #D9534F, #C9302C)',
                border: 'none',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              🚪 Sair
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ marginLeft: '280px', flex: 1, padding: '2rem' }}>
          {/* Header */}
          <div style={{ 
            background: 'linear-gradient(135deg, #E6C200, #D4AF37)',
            padding: '1.5rem 2rem',
            borderRadius: '16px',
            marginBottom: '2rem',
            color: '#000000'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <FiTrendingUp size={32} />
              <div>
                <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>
                  Gestão de Operações
                </h1>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.1rem', opacity: 0.8 }}>
                  Monitore todas as operações de trading
                </p>
              </div>
            </div>
          </div>

          {/* Estatísticas */}
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(74, 158, 219, 0.2), rgba(74, 158, 219, 0.1))',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid rgba(74, 158, 219, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <FiActivity color="#4A9EDB" size={20} />
                <span style={{ color: '#B0B3B8', fontSize: '0.9rem' }}>Total</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FFFFFF' }}>
                {stats.total}
              </div>
            </div>

            <div style={{ 
              background: 'linear-gradient(135deg, rgba(46, 204, 113, 0.2), rgba(46, 204, 113, 0.1))',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid rgba(46, 204, 113, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <FiCheckCircle color="#2ECC71" size={20} />
                <span style={{ color: '#B0B3B8', fontSize: '0.9rem' }}>Fechadas</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FFFFFF' }}>
                {stats.closed}
              </div>
            </div>

            <div style={{ 
              background: 'linear-gradient(135deg, rgba(230, 194, 0, 0.2), rgba(230, 194, 0, 0.1))',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid rgba(230, 194, 0, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <FiActivity color="#E6C200" size={20} />
                <span style={{ color: '#B0B3B8', fontSize: '0.9rem' }}>Abertas</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FFFFFF' }}>
                {stats.open}
              </div>
            </div>

            <div style={{ 
              background: 'linear-gradient(135deg, rgba(186, 85, 211, 0.2), rgba(186, 85, 211, 0.1))',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid rgba(186, 85, 211, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <FiDollarSign color="#BA55D3" size={20} />
                <span style={{ color: '#B0B3B8', fontSize: '0.9rem' }}>Lucro Total</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: getProfitColor(stats.totalProfit) }}>
                {formatCurrency(stats.totalProfit)}
              </div>
            </div>
          </div>

          {/* Filtros e Busca */}
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.1))',
            padding: '1.5rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '300px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.1)', padding: '0.75rem', borderRadius: '8px' }}>
                  <FiSearch color="#B0B3B8" />
                  <input
                    type="text"
                    placeholder="Buscar por usuário, símbolo ou fonte..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#FFFFFF',
                      outline: 'none',
                      flex: 1,
                      fontSize: '0.95rem'
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <FiFilter color="#B0B3B8" />
                <select
                  value={filterType}
                  onChange={(e) => handleFilter(e.target.value)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#FFFFFF',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.95rem'
                  }}
                >
                  <option value="all">Todas</option>
                  <option value="open">Abertas</option>
                  <option value="closed">Fechadas</option>
                  <option value="cancelled">Canceladas</option>
                  <option value="buy">Compras</option>
                  <option value="sell">Vendas</option>
                  <option value="profitable">Lucro</option>
                  <option value="loss">Prejuízo</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span style={{ color: '#B0B3B8', fontSize: '0.9rem' }}>
                Mostrando {currentOperations.length} de {filteredOperations.length} operações
              </span>
            </div>
          </div>

          {/* Tabela de Operações */}
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.1))',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ 
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))'
                }}>
                  <tr>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: 'bold', color: '#FFFFFF' }}>Usuário</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: 'bold', color: '#FFFFFF' }}>Símbolo</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: 'bold', color: '#FFFFFF' }}>Tipo</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: 'bold', color: '#FFFFFF' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: 'bold', color: '#FFFFFF' }}>Valores</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: 'bold', color: '#FFFFFF' }}>Resultado</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: 'bold', color: '#FFFFFF' }}>Duração</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: 'bold', color: '#FFFFFF' }}>Fonte</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.9rem', fontWeight: 'bold', color: '#FFFFFF' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {currentOperations.map((operation, index) => (
                    <tr key={operation.id} style={{ 
                      borderTop: index > 0 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                      background: index % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent'
                    }}>
                      <td style={{ padding: '1rem' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', color: '#FFFFFF', marginBottom: '0.25rem' }}>{operation.user_name}</div>
                          <div style={{ color: '#B0B3B8', fontSize: '0.85rem' }}>{operation.user_email}</div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          background: 'linear-gradient(135deg, #4A9EDB, #357ABD)',
                          color: '#FFFFFF',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: 'bold'
                        }}>
                          {operation.symbol}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          background: operation.operation_type === 'buy' 
                            ? 'linear-gradient(135deg, #5CB85C, #4A9E4A)' 
                            : 'linear-gradient(135deg, #D9534F, #C9302C)',
                          color: '#FFFFFF',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          textTransform: 'uppercase'
                        }}>
                          {operation.operation_type}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: getStatusColor(operation.status) }}>
                            {getStatusIcon(operation.status)}
                          </span>
                          <span style={{ 
                            color: getStatusColor(operation.status), 
                            fontSize: '0.9rem', 
                            fontWeight: 'bold',
                            textTransform: 'capitalize'
                          }}>
                            {operation.status === 'open' ? 'Aberta' : operation.status === 'closed' ? 'Fechada' : 'Cancelada'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div>
                          <div style={{ color: '#FFFFFF', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                            <strong>Entrada:</strong> {formatCurrency(operation.entry_price)}
                          </div>
                          {operation.exit_price && (
                            <div style={{ color: '#FFFFFF', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                              <strong>Saída:</strong> {formatCurrency(operation.exit_price)}
                            </div>
                          )}
                          <div style={{ color: '#B0B3B8', fontSize: '0.8rem' }}>
                            Quantidade: {operation.amount}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div>
                          <div style={{ 
                            color: getProfitColor(operation.profit_loss), 
                            fontWeight: 'bold',
                            marginBottom: '0.25rem'
                          }}>
                            {formatCurrency(operation.profit_loss)}
                          </div>
                          <div style={{ 
                            color: getProfitColor(operation.profit_percentage), 
                            fontSize: '0.85rem',
                            fontWeight: 'bold'
                          }}>
                            {operation.profit_percentage > 0 ? '+' : ''}{operation.profit_percentage.toFixed(2)}%
                          </div>
                          {operation.fees > 0 && (
                            <div style={{ color: '#B0B3B8', fontSize: '0.8rem' }}>
                              Taxa: {formatCurrency(operation.fees)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div>
                          <div style={{ color: '#FFFFFF', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                            {formatDuration(operation.execution_time)}
                          </div>
                          <div style={{ color: '#B0B3B8', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <FiClock size={12} />
                            {formatDate(operation.created_at)}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          background: 'rgba(186, 85, 211, 0.2)',
                          border: '1px solid rgba(186, 85, 211, 0.3)',
                          color: '#BA55D3',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: 'bold'
                        }}>
                          {operation.signal_source}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleOperationAction(operation.id, 'view')}
                            style={{
                              background: 'rgba(74, 158, 219, 0.2)',
                              border: '1px solid rgba(74, 158, 219, 0.3)',
                              color: '#4A9EDB',
                              padding: '0.5rem',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                            title="Visualizar"
                          >
                            <FiEye size={14} />
                          </button>
                          {operation.status === 'open' && (
                            <button
                              onClick={() => handleOperationAction(operation.id, 'close')}
                              style={{
                                background: 'rgba(46, 204, 113, 0.2)',
                                border: '1px solid rgba(46, 204, 113, 0.3)',
                                color: '#2ECC71',
                                padding: '0.5rem',
                                borderRadius: '6px',
                                cursor: 'pointer'
                              }}
                              title="Fechar Operação"
                            >
                              <FiCheckCircle size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div style={{ 
                padding: '1rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                justifyContent: 'center',
                gap: '0.5rem'
              }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{
                      background: page === currentPage 
                        ? 'linear-gradient(135deg, #E6C200, #D4AF37)' 
                        : 'rgba(255, 255, 255, 0.1)',
                      color: page === currentPage ? '#000000' : '#FFFFFF',
                      border: 'none',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
