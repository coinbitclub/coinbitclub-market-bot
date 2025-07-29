# 🛠️ GUIA PRÁTICO DE IMPLEMENTAÇÃO FRONTEND

## 🚀 SETUP INICIAL DO PROJETO

### **1. Criação do Projeto**
```bash
# Criar projeto com Vite + React + TypeScript
npm create vite@latest coinbitclub-frontend -- --template react-ts

cd coinbitclub-frontend

# Instalar dependências essenciais
npm install \
  react-router-dom \
  axios \
  @tanstack/react-query \
  socket.io-client \
  styled-components \
  @types/styled-components \
  recharts \
  react-hook-form \
  @hookform/resolvers \
  yup \
  react-hot-toast \
  lucide-react \
  framer-motion

# Dependências de desenvolvimento
npm install -D \
  @types/node \
  eslint \
  prettier \
  eslint-config-prettier
```

### **2. Estrutura de Pastas**
```
src/
├── components/
│   ├── common/
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── Table/
│   │   └── Modal/
│   ├── dashboard/
│   │   ├── AdminDashboard/
│   │   ├── AffiliateDashboard/
│   │   └── UserDashboard/
│   ├── operations/
│   │   ├── OperationsTable/
│   │   ├── OperationDetails/
│   │   └── TradingConfig/
│   └── layout/
│       ├── Header/
│       ├── Sidebar/
│       └── Layout/
├── pages/
│   ├── Dashboard/
│   ├── Operations/
│   ├── Financial/
│   ├── Affiliates/
│   └── Settings/
├── hooks/
│   ├── useAuth.ts
│   ├── useWebSocket.ts
│   └── usePermissions.ts
├── services/
│   ├── api.ts
│   ├── websocket.ts
│   └── auth.ts
├── store/
│   ├── authStore.ts
│   ├── operationsStore.ts
│   └── index.ts
├── types/
│   ├── user.ts
│   ├── operation.ts
│   └── api.ts
├── utils/
│   ├── formatters.ts
│   ├── validators.ts
│   └── constants.ts
└── styles/
    ├── theme.ts
    ├── globals.css
    └── components.css
```

---

## 🔐 IMPLEMENTAÇÃO DE AUTENTICAÇÃO

### **1. Auth Service**
```typescript
// src/services/auth.ts
import axios from 'axios';
import { User } from '../types/user';

class AuthService {
  private baseURL = import.meta.env.VITE_API_BASE_URL;

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const response = await axios.post(`${this.baseURL}/auth/login`, {
      email,
      password
    });
    
    if (response.data.success) {
      const { user, token } = response.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      return { user, token };
    }
    
    throw new Error(response.data.message || 'Login failed');
  }

  async logout(): Promise<void> {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getCurrentUser(): User | null {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  }
}

export const authService = new AuthService();
```

### **2. Auth Hook**
```typescript
// src/hooks/useAuth.ts
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/user';
import { authService } from '../services/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  isRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const { user: loggedUser } = await authService.login(email, password);
    setUser(loggedUser);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const hasPermission = (permission: string): boolean => {
    return user?.permissions?.includes(permission) || false;
  };

  const isRole = (role: string): boolean => {
    return user?.role === role;
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      loading,
      login,
      logout,
      hasPermission,
      isRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

---

## 📊 IMPLEMENTAÇÃO DE DASHBOARD

### **1. Dashboard Principal**
```typescript
// src/pages/Dashboard/Dashboard.tsx
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { AdminDashboard } from '../../components/dashboard/AdminDashboard';
import { GestorDashboard } from '../../components/dashboard/GestorDashboard';
import { AffiliateDashboard } from '../../components/dashboard/AffiliateDashboard';
import { UserDashboard } from '../../components/dashboard/UserDashboard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const Dashboard: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;

  const renderDashboard = () => {
    switch (user?.role) {
      case 'ADMIN':
        return <AdminDashboard />;
      case 'GESTOR':
        return <GestorDashboard />;
      case 'OPERADOR':
        return <GestorDashboard />; // Mesma interface que gestor
      case 'AFILIADO':
        return <AffiliateDashboard />;
      case 'USUARIO':
        return <UserDashboard />;
      default:
        return <div>Acesso negado</div>;
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard - {user?.name}</h1>
        <span className="role-badge" data-role={user?.role}>
          {user?.role}
        </span>
      </div>
      {renderDashboard()}
    </div>
  );
};
```

### **2. Admin Dashboard**
```typescript
// src/components/dashboard/AdminDashboard.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Card } from '../common/Card';
import { Chart } from '../common/Chart';
import { RecentActivities } from './RecentActivities';
import { SystemHealth } from './SystemHealth';

export const AdminDashboard: React.FC = () => {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.getDashboard(),
    refetchInterval: 60000, // 1 minuto
  });

  if (isLoading) return <div>Carregando...</div>;

  const {
    financial_summary,
    operations_summary,
    users_summary,
    recent_activities,
    system_health
  } = dashboardData || {};

  return (
    <div className="admin-dashboard">
      {/* Cards de resumo */}
      <div className="dashboard-grid">
        <Card
          title="Receita Total (REAL)"
          value={`$${financial_summary?.revenue?.real?.total?.toFixed(2) || '0.00'}`}
          change={financial_summary?.revenue?.real?.growth_rate}
          changeType="positive"
          icon="dollar-sign"
        />
        
        <Card
          title="Operações Totais"
          value={operations_summary?.total_operations || 0}
          icon="trending-up"
        />
        
        <Card
          title="Usuários Ativos"
          value={users_summary?.active_users || 0}
          icon="users"
        />
        
        <Card
          title="Taxa de Sucesso"
          value={`${operations_summary?.success_rate || 0}%`}
          icon="target"
        />
      </div>

      {/* Gráficos */}
      <div className="charts-section">
        <div className="chart-container">
          <Chart
            title="Receita Mensal"
            type="line"
            data={financial_summary?.monthly_revenue || []}
            height={300}
          />
        </div>
        
        <div className="chart-container">
          <Chart
            title="Operações por Dia"
            type="bar"
            data={operations_summary?.daily_operations || []}
            height={300}
          />
        </div>
      </div>

      {/* Seções adicionais */}
      <div className="dashboard-sections">
        <RecentActivities activities={recent_activities} />
        <SystemHealth status={system_health} />
      </div>
    </div>
  );
};
```

### **3. Affiliate Dashboard**
```typescript
// src/components/dashboard/AffiliateDashboard.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { Card } from '../common/Card';
import { ReferralTable } from './ReferralTable';
import { CommissionChart } from './CommissionChart';

export const AffiliateDashboard: React.FC = () => {
  const { user } = useAuth();
  
  const { data: affiliateData, isLoading } = useQuery({
    queryKey: ['affiliate-dashboard', user?.id],
    queryFn: () => api.getAffiliateDashboard(user!.id),
    refetchInterval: 120000, // 2 minutos
    enabled: !!user?.id,
  });

  if (isLoading) return <div>Carregando...</div>;

  const {
    affiliate_stats,
    referral_performance,
    commission_history,
    monthly_chart_data
  } = affiliateData || {};

  return (
    <div className="affiliate-dashboard">
      {/* Header com informações do afiliado */}
      <div className="affiliate-header">
        <h2>Dashboard do Afiliado</h2>
        <div className="commission-rate">
          Taxa: {affiliate_stats?.commission_rate || '0%'}
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="stats-grid">
        <Card
          title="Total de Indicações"
          value={affiliate_stats?.total_referrals || 0}
          icon="users"
          color="blue"
        />
        
        <Card
          title="Indicações Ativas"
          value={affiliate_stats?.active_referrals || 0}
          icon="user-check"
          color="green"
        />
        
        <Card
          title="Comissões Totais"
          value={`R$ ${affiliate_stats?.total_commissions?.toFixed(2) || '0.00'}`}
          icon="dollar-sign"
          color="green"
        />
        
        <Card
          title="Comissões Pendentes"
          value={`R$ ${affiliate_stats?.pending_commissions?.toFixed(2) || '0.00'}`}
          icon="clock"
          color="yellow"
        />
      </div>

      {/* Gráfico de performance */}
      <div className="chart-section">
        <CommissionChart data={monthly_chart_data} />
      </div>

      {/* Tabela de indicações */}
      <div className="referrals-section">
        <h3>Suas Indicações</h3>
        <ReferralTable referrals={referral_performance} />
      </div>

      {/* Histórico de comissões */}
      <div className="commissions-section">
        <h3>Histórico de Comissões</h3>
        <div className="commission-list">
          {commission_history?.map((commission: any) => (
            <div key={commission.id} className="commission-item">
              <div className="commission-info">
                <span className="user-name">{commission.user_name}</span>
                <span className="operation-info">
                  Operação #{commission.operation_id}
                </span>
              </div>
              <div className="commission-amount">
                R$ {commission.amount.toFixed(2)}
              </div>
              <div className="commission-date">
                {new Date(commission.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

---

## 📋 IMPLEMENTAÇÃO DE TABELAS

### **1. Operations Table**
```typescript
// src/components/operations/OperationsTable.tsx
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { Operation } from '../../types/operation';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface OperationsTableProps {
  userId?: number;
  showAllUsers?: boolean;
}

export const OperationsTable: React.FC<OperationsTableProps> = ({
  userId,
  showAllUsers = false
}) => {
  const { user, hasPermission } = useAuth();
  const [filters, setFilters] = useState({
    symbol: '',
    type: '',
    status: '',
    revenue_type: ''
  });

  const { data: operations, isLoading } = useQuery({
    queryKey: ['operations', userId, filters],
    queryFn: () => api.getOperations(userId, filters),
    refetchInterval: 30000, // 30 segundos
  });

  const canViewRevenueType = hasPermission('financial_data') || user?.role === 'AFILIADO';
  const canViewAllUsers = hasPermission('view_all_data');

  const filteredOperations = useMemo(() => {
    if (!operations) return [];
    
    return operations.filter((op: Operation) => {
      if (filters.symbol && !op.symbol.includes(filters.symbol.toUpperCase())) return false;
      if (filters.type && op.type !== filters.type) return false;
      if (filters.status && op.status !== filters.status) return false;
      if (filters.revenue_type && op.revenue_type !== filters.revenue_type) return false;
      return true;
    });
  }, [operations, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) return <div>Carregando operações...</div>;

  return (
    <div className="operations-table">
      {/* Filtros */}
      <div className="table-filters">
        <input
          type="text"
          placeholder="Símbolo (ex: BTC)"
          value={filters.symbol}
          onChange={(e) => handleFilterChange('symbol', e.target.value)}
        />
        
        <select
          value={filters.type}
          onChange={(e) => handleFilterChange('type', e.target.value)}
        >
          <option value="">Todos os tipos</option>
          <option value="LONG">LONG</option>
          <option value="SHORT">SHORT</option>
        </select>
        
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="">Todos os status</option>
          <option value="OPEN">Aberta</option>
          <option value="CLOSED">Fechada</option>
          <option value="CANCELLED">Cancelada</option>
        </select>
        
        {canViewRevenueType && (
          <select
            value={filters.revenue_type}
            onChange={(e) => handleFilterChange('revenue_type', e.target.value)}
          >
            <option value="">Todos os tipos</option>
            <option value="REAL">REAL</option>
            <option value="BONUS">BONUS</option>
          </select>
        )}
      </div>

      {/* Tabela */}
      <div className="table-container">
        <table className="operations-table">
          <thead>
            <tr>
              {canViewAllUsers && <th>Usuário</th>}
              <th>Símbolo</th>
              <th>Tipo</th>
              <th>Entrada</th>
              <th>Saída</th>
              <th>P&L</th>
              <th>Status</th>
              {canViewRevenueType && <th>Receita</th>}
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {filteredOperations.map((operation: Operation) => (
              <tr 
                key={operation.id} 
                className={`operation-row ${operation.status.toLowerCase()}`}
              >
                {canViewAllUsers && (
                  <td className="user-name">{operation.user_name}</td>
                )}
                <td className="symbol">{operation.symbol}</td>
                <td className={`type ${operation.type.toLowerCase()}`}>
                  {operation.type}
                </td>
                <td className="price">{formatCurrency(operation.entry_price)}</td>
                <td className="price">
                  {operation.exit_price ? formatCurrency(operation.exit_price) : '-'}
                </td>
                <td className={`pnl ${operation.pnl && operation.pnl > 0 ? 'positive' : 'negative'}`}>
                  {operation.pnl ? formatCurrency(operation.pnl) : 
                   operation.unrealized_pnl ? formatCurrency(operation.unrealized_pnl) : '-'}
                </td>
                <td className="status">
                  <span className={`status-badge ${operation.status.toLowerCase()}`}>
                    {operation.status}
                  </span>
                </td>
                {canViewRevenueType && (
                  <td className="revenue-type">
                    <span className={`revenue-badge ${operation.revenue_type.toLowerCase()}`}>
                      {operation.revenue_type}
                    </span>
                  </td>
                )}
                <td className="date">
                  {formatDate(operation.opened_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```

---

## 🔄 IMPLEMENTAÇÃO WEBSOCKET

### **1. WebSocket Service**
```typescript
// src/services/websocket.ts
import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(this.url, {
        auth: {
          token
        }
      });

      this.socket.on('connect', () => {
        console.log('WebSocket connected');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  subscribe(event: string, callback: Function): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  unsubscribe(event: string): void {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  emit(event: string, data: any): void {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }
}

export const wsService = new WebSocketService(
  import.meta.env.VITE_WS_URL || 'ws://localhost:3003'
);
```

### **2. WebSocket Hook**
```typescript
// src/hooks/useWebSocket.ts
import { useEffect, useRef } from 'react';
import { wsService } from '../services/websocket';
import { useAuth } from './useAuth';

export const useWebSocket = () => {
  const { user, isAuthenticated } = useAuth();
  const isConnected = useRef(false);

  useEffect(() => {
    if (isAuthenticated && user && !isConnected.current) {
      const token = localStorage.getItem('token');
      if (token) {
        wsService.connect(token)
          .then(() => {
            isConnected.current = true;
          })
          .catch(console.error);
      }
    }

    return () => {
      if (isConnected.current) {
        wsService.disconnect();
        isConnected.current = false;
      }
    };
  }, [isAuthenticated, user]);

  return {
    subscribe: wsService.subscribe.bind(wsService),
    unsubscribe: wsService.unsubscribe.bind(wsService),
    emit: wsService.emit.bind(wsService),
    connected: isConnected.current
  };
};
```

### **3. Real-time Operations**
```typescript
// src/hooks/useRealTimeOperations.ts
import { useState, useEffect } from 'react';
import { useWebSocket } from './useWebSocket';
import { Operation } from '../types/operation';

export const useRealTimeOperations = (initialOperations: Operation[] = []) => {
  const [operations, setOperations] = useState<Operation[]>(initialOperations);
  const { subscribe, unsubscribe } = useWebSocket();

  useEffect(() => {
    const handleOperationUpdate = (updatedOperation: Operation) => {
      setOperations(prev =>
        prev.map(op =>
          op.id === updatedOperation.id ? updatedOperation : op
        )
      );
    };

    const handleNewOperation = (newOperation: Operation) => {
      setOperations(prev => [newOperation, ...prev]);
    };

    const handleOperationClosed = (closedOperation: Operation) => {
      setOperations(prev =>
        prev.map(op =>
          op.id === closedOperation.id ? { ...op, ...closedOperation } : op
        )
      );
    };

    subscribe('operation_update', handleOperationUpdate);
    subscribe('new_operation', handleNewOperation);
    subscribe('operation_closed', handleOperationClosed);

    return () => {
      unsubscribe('operation_update');
      unsubscribe('new_operation');
      unsubscribe('operation_closed');
    };
  }, [subscribe, unsubscribe]);

  return operations;
};
```

---

## 🎨 IMPLEMENTAÇÃO DE TEMAS

### **1. Theme Provider**
```typescript
// src/styles/theme.ts
export const theme = {
  colors: {
    primary: '#007bff',
    secondary: '#6c757d',
    success: '#28a745',
    warning: '#ffc107',
    danger: '#dc3545',
    info: '#17a2b8',
    light: '#f8f9fa',
    dark: '#343a40',
    
    // Cores por perfil
    admin: '#6f42c1',
    gestor: '#007bff',
    operador: '#17a2b8',
    afiliado: '#28a745',
    usuario: '#6c757d',
    
    // Estados de operação
    long: '#28a745',
    short: '#dc3545',
    profit: '#28a745',
    loss: '#dc3545',
    
    // Estados de receita
    real: '#28a745',
    bonus: '#ffc107'
  },
  
  fonts: {
    primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", monospace'
  },
  
  breakpoints: {
    xs: '576px',
    sm: '768px',
    md: '992px',
    lg: '1200px',
    xl: '1400px'
  },
  
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '3rem'
  },
  
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '1rem'
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
  }
};
```

### **2. Global Styles**
```css
/* src/styles/globals.css */
:root {
  /* Cores */
  --color-primary: #007bff;
  --color-success: #28a745;
  --color-warning: #ffc107;
  --color-danger: #dc3545;
  
  /* Cores por perfil */
  --color-admin: #6f42c1;
  --color-gestor: #007bff;
  --color-operador: #17a2b8;
  --color-afiliado: #28a745;
  --color-usuario: #6c757d;
  
  /* Estados */
  --color-real: #28a745;
  --color-bonus: #ffc107;
  --color-long: #28a745;
  --color-short: #dc3545;
  
  /* Espaçamentos */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 3rem;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #f8f9fa;
  color: #343a40;
  line-height: 1.6;
}

/* Utilities */
.text-success { color: var(--color-success); }
.text-danger { color: var(--color-danger); }
.text-warning { color: var(--color-warning); }

.bg-real { background-color: var(--color-real); }
.bg-bonus { background-color: var(--color-bonus); }

.role-admin { color: var(--color-admin); }
.role-gestor { color: var(--color-gestor); }
.role-operador { color: var(--color-operador); }
.role-afiliado { color: var(--color-afiliado); }
.role-usuario { color: var(--color-usuario); }

/* Componentes base */
.card {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
}

/* Status badges */
.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.open {
  background-color: #cff4fc;
  color: #055160;
}

.status-badge.closed {
  background-color: #d1ecf1;
  color: #0c5460;
}

.revenue-badge.real {
  background-color: #d4edda;
  color: #155724;
}

.revenue-badge.bonus {
  background-color: #fff3cd;
  color: #856404;
}

/* Responsividade */
@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .table-container {
    overflow-x: auto;
  }
}
```

---

## 📱 LAYOUT RESPONSIVO

### **1. Layout Principal**
```typescript
// src/components/layout/Layout.tsx
import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../hooks/useAuth';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="layout">
      <Header 
        user={user} 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <div className="layout-container">
        <Sidebar 
          userRole={user?.role || 'USUARIO'}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};
```

### **2. Sidebar Responsiva**
```typescript
// src/components/layout/Sidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Settings,
  BarChart3,
  UserPlus
} from 'lucide-react';

interface SidebarProps {
  userRole: string;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ userRole, isOpen, onClose }) => {
  const getMenuItems = (role: string) => {
    const baseItems = [
      { to: '/dashboard', icon: Home, label: 'Dashboard' }
    ];

    switch (role) {
      case 'ADMIN':
        return [
          ...baseItems,
          { to: '/operations', icon: TrendingUp, label: 'Operações' },
          { to: '/financial', icon: DollarSign, label: 'Financeiro' },
          { to: '/users', icon: Users, label: 'Usuários' },
          { to: '/affiliates', icon: UserPlus, label: 'Afiliados' },
          { to: '/system', icon: Settings, label: 'Sistema' }
        ];
      
      case 'GESTOR':
      case 'OPERADOR':
        return [
          ...baseItems,
          { to: '/operations', icon: TrendingUp, label: 'Operações' },
          { to: '/financial', icon: DollarSign, label: 'Financeiro' },
          { to: '/affiliates', icon: UserPlus, label: 'Afiliados' }
        ];
      
      case 'AFILIADO':
        return [
          ...baseItems,
          { to: '/referrals', icon: UserPlus, label: 'Indicações' },
          { to: '/commissions', icon: DollarSign, label: 'Comissões' },
          { to: '/performance', icon: BarChart3, label: 'Performance' }
        ];
      
      case 'USUARIO':
        return [
          ...baseItems,
          { to: '/my-operations', icon: TrendingUp, label: 'Minhas Operações' },
          { to: '/settings', icon: Settings, label: 'Configurações' }
        ];
      
      default:
        return baseItems;
    }
  };

  const menuItems = getMenuItems(userRole);

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div 
          className="sidebar-overlay"
          onClick={onClose}
        />
      )}
      
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>CoinBitClub</h2>
          <button 
            className="close-btn md:hidden"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => 
                `nav-item ${isActive ? 'active' : ''}`
              }
              onClick={onClose}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        
        <div className="sidebar-footer">
          <div className="user-role">
            <span className={`role-badge role-${userRole.toLowerCase()}`}>
              {userRole}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
```

---

## 🔧 UTILS E HELPERS

### **1. Formatters**
```typescript
// src/utils/formatters.ts
export const formatCurrency = (value: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(2)}%`;
};

export const formatDate = (date: string): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};

export const formatTimeAgo = (date: string): string => {
  const now = new Date();
  const operationDate = new Date(date);
  const diffMs = now.getTime() - operationDate.getTime();
  
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  
  if (minutes < 60) return `${minutes}min atrás`;
  if (hours < 24) return `${hours}h atrás`;
  return `${days}d atrás`;
};

export const formatPnL = (pnl: number): { formatted: string; color: string } => {
  const isProfit = pnl > 0;
  return {
    formatted: `${isProfit ? '+' : ''}${formatCurrency(pnl)}`,
    color: isProfit ? 'text-success' : 'text-danger'
  };
};
```

### **2. Constants**
```typescript
// src/utils/constants.ts
export const ROLES = {
  ADMIN: 'ADMIN',
  GESTOR: 'GESTOR', 
  OPERADOR: 'OPERADOR',
  AFILIADO: 'AFILIADO',
  USUARIO: 'USUARIO'
} as const;

export const OPERATION_STATUS = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED'
} as const;

export const OPERATION_TYPES = {
  LONG: 'LONG',
  SHORT: 'SHORT'
} as const;

export const REVENUE_TYPES = {
  REAL: 'REAL',
  BONUS: 'BONUS'
} as const;

export const SIGNAL_TYPES = {
  SINAL_LONG: 'SINAL LONG',
  SINAL_LONG_FORTE: 'SINAL LONG FORTE',
  SINAL_SHORT: 'SINAL SHORT',
  SINAL_SHORT_FORTE: 'SINAL SHORT FORTE',
  FECHE_LONG: 'FECHE LONG',
  FECHE_SHORT: 'FECHE SHORT',
  CONFIRMACAO_LONG: 'CONFIRMAÇÃO LONG',
  CONFIRMACAO_SHORT: 'CONFIRMAÇÃO SHORT'
} as const;

export const PERMISSIONS = {
  VIEW_ALL_DATA: 'view_all_data',
  USER_MANAGEMENT: 'user_management',
  FINANCIAL_DATA: 'financial_data',
  AFFILIATE_MANAGEMENT: 'affiliate_management',
  SYSTEM_CONFIGURATION: 'system_configuration'
} as const;

export const API_ENDPOINTS = {
  DASHBOARD: '/dashboard',
  OPERATIONS: '/operations',
  FINANCIAL: '/financial',
  AFFILIATES: '/affiliates',
  USERS: '/users',
  AUTH: '/auth'
} as const;
```

---

## 🎯 CHECKLIST FINAL DE DESENVOLVIMENTO

### **📋 Setup e Configuração**
- [ ] Projeto criado com Vite + React + TypeScript
- [ ] Dependências instaladas (router, query, socket.io, etc.)
- [ ] Estrutura de pastas organizada
- [ ] Variáveis de ambiente configuradas
- [ ] ESLint e Prettier configurados

### **🔐 Autenticação e Autorização**
- [ ] Serviço de autenticação implementado
- [ ] Context e hook de auth criados
- [ ] Proteção de rotas por perfil
- [ ] Sistema de permissões implementado
- [ ] Logout e refresh de token

### **📊 Dashboard por Perfil**
- [ ] Dashboard admin com métricas completas
- [ ] Dashboard gestor com operações
- [ ] Dashboard afiliado com comissões
- [ ] Dashboard usuário simplificado
- [ ] Cards adaptativos por perfil

### **📋 Tabelas e Dados**
- [ ] Tabela de operações com filtros
- [ ] Visualização de receita REAL vs BONUS
- [ ] Tabela de usuários (admin)
- [ ] Tabela de afiliados e comissões
- [ ] Paginação e busca implementadas

### **🔄 Tempo Real**
- [ ] WebSocket service implementado
- [ ] Hook para tempo real criado
- [ ] Updates de operações ao vivo
- [ ] Notificações em tempo real
- [ ] Reconexão automática

### **🎨 Interface e UX**
- [ ] Layout responsivo mobile-first
- [ ] Sidebar adaptativa por perfil
- [ ] Tema com cores por perfil
- [ ] Estados de loading implementados
- [ ] Feedback visual para ações

### **🛡️ Segurança**
- [ ] Validação de dados no frontend
- [ ] Sanitização de inputs
- [ ] Proteção contra XSS
- [ ] Headers de segurança
- [ ] Tratamento de erros

### **⚡ Performance**
- [ ] Code splitting implementado
- [ ] Lazy loading de componentes
- [ ] Memoização onde necessário
- [ ] Otimização de re-renders
- [ ] Cache de dados com React Query

---

*Guia completo para implementação do frontend CoinBitClub*
*Sistema v1.0.0 - Pronto para desenvolvimento*
