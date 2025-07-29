# 📐 ESTRUTURAS DE DADOS E MODELOS - FRONTEND

## 🔧 MODELOS DE DADOS TYPESCRIPT

### **1. USER MODEL**
```typescript
interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'GESTOR' | 'OPERADOR' | 'AFILIADO' | 'USUARIO';
  access_level: 1 | 2 | 3 | 4 | 5;
  status: 'active' | 'inactive' | 'suspended';
  vip_status: boolean;
  commission_rate?: number;
  affiliate_level?: string;
  created_at: string;
  last_login?: string;
  permissions: string[];
  avatar?: string;
  phone?: string;
  country?: string;
}
```

### **2. OPERATION MODEL**
```typescript
interface Operation {
  id: number;
  user_id: number;
  user_name: string;
  symbol: string;
  type: 'LONG' | 'SHORT';
  entry_price: number;
  exit_price?: number;
  current_price?: number;
  quantity: number;
  leverage: number;
  take_profit: number;
  stop_loss: number;
  pnl?: number;
  unrealized_pnl?: number;
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  revenue_type: 'REAL' | 'BONUS';
  signal_source: 'TradingView' | 'Manual' | 'System';
  signal_type?: string;
  opened_at: string;
  closed_at?: string;
  time_open?: string;
  reason?: 'TAKE_PROFIT' | 'STOP_LOSS' | 'MANUAL' | 'SIGNAL';
  fear_greed_value?: number;
  commission_generated?: number;
  metadata?: {
    [key: string]: any;
  };
}
```

### **3. FINANCIAL MODELS**
```typescript
interface FinancialSummary {
  revenue: {
    real: {
      total: number;
      current_month: number;
      previous_month: number;
      growth_rate: number;
    };
    bonus: {
      total: number;
      current_month: number;
      note: string;
    };
  };
  expenses: {
    total: number;
    current_month: number;
    categories: {
      infrastructure: number;
      apis: number;
      marketing: number;
      others: number;
    };
  };
  commissions: {
    total_paid: number;
    current_month: number;
    pending: number;
    next_payment_date: string;
  };
  profit: {
    gross: number;
    net: number;
    margin_percent: number;
  };
}

interface RevenueClassification {
  user_id: number;
  user_name: string;
  type: 'REAL' | 'BONUS';
  payment_method: 'STRIPE' | 'SYSTEM_CREDIT' | 'OTHER';
  generates_commission: boolean;
  total_operations: number;
  total_revenue: number;
  last_payment?: string;
}
```

### **4. AFFILIATE MODELS**
```typescript
interface Affiliate {
  id: number;
  user_id: number;
  name: string;
  email: string;
  commission_rate: number;
  vip_status: boolean;
  referral_code: string;
  total_referrals: number;
  active_referrals: number;
  total_earned: number;
  current_month_earned: number;
  pending_commission: number;
  last_payment_date?: string;
  conversion_rate: number;
  status: 'active' | 'inactive';
  created_at: string;
}

interface Referral {
  id: number;
  user_id: number;
  affiliate_id: number;
  user_name: string;
  signup_date: string;
  first_operation_date?: string;
  status: 'active' | 'inactive';
  revenue_type: 'REAL' | 'BONUS';
  total_operations: number;
  total_revenue: number;
  generated_commission: number;
  last_activity: string;
}

interface Commission {
  id: number;
  affiliate_id: number;
  affiliate_name: string;
  user_id: number;
  user_name: string;
  operation_id: number;
  amount: number;
  rate: number;
  currency: 'USD' | 'BRL';
  status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
  paid_at?: string;
  operation_pnl: number;
  revenue_type: 'REAL' | 'BONUS';
}
```

### **5. TRADING CONFIGURATION**
```typescript
interface TradingConfig {
  user_id: number;
  leverage_default: number;
  leverage_max: number;
  take_profit_multiplier: number;
  stop_loss_multiplier: number;
  take_profit_max_multiplier: number;
  stop_loss_max_multiplier: number;
  balance_percentage_per_trade: number;
  max_open_positions: number;
  trailing_stop: boolean;
  risk_reward_ratio: number;
  min_signal_confidence: number;
  max_slippage_percent: number;
  auto_close_enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface CalculatedValues {
  tp_percent: number;
  sl_percent: number;
  max_tp_percent: number;
  max_sl_percent: number;
  position_size_usd: number;
}
```

### **6. SIGNAL MODELS**
```typescript
interface Signal {
  id: number;
  source: 'TradingView' | 'Manual' | 'System';
  symbol: string;
  action: 'SINAL LONG' | 'SINAL SHORT' | 'FECHE LONG' | 'FECHE SHORT' | 'CONFIRMAÇÃO LONG' | 'CONFIRMAÇÃO SHORT';
  timestamp: string;
  processed: boolean;
  processing_time?: number;
  operations_opened?: number;
  operations_closed?: number;
  fear_greed_value?: number;
  rejection_reason?: string;
  metadata?: {
    original_data: any;
    validation_result: any;
  };
}

interface SignalStatistics {
  total_received: number;
  total_processed: number;
  total_rejected: number;
  rejection_reasons: {
    timeout: number;
    invalid_format: number;
    system_error: number;
    market_conditions: number;
  };
  success_rate: number;
  average_processing_time: number;
  performance_by_symbol: {
    symbol: string;
    total_signals: number;
    success_rate: number;
    total_pnl: number;
  }[];
}
```

### **7. SYSTEM MONITORING**
```typescript
interface SystemStatus {
  system_health: {
    webhook_service: {
      status: 'active' | 'inactive' | 'error';
      port: number;
      last_signal?: string;
      uptime: string;
    };
    central_indicators: {
      status: 'active' | 'inactive' | 'error';
      port: number;
      response_time: string;
      requests_per_minute: number;
    };
    ai_supervisor: {
      status: 'operational' | 'warning' | 'error';
      last_activity: string;
      monitoring_interval: string;
      alerts_count: number;
    };
    database: {
      status: 'connected' | 'disconnected' | 'slow';
      connection_pool: 'healthy' | 'warning' | 'critical';
      response_time: string;
      active_connections: number;
    };
  };
  integrations: {
    fear_greed_api: {
      status: 'active' | 'inactive' | 'error';
      current_value: number;
      classification: string;
      last_update: string;
    };
    tradingview_webhook: {
      status: 'ready' | 'error';
      endpoint: string;
      last_received: string;
    };
  };
}

interface Activity {
  id: number;
  timestamp: string;
  type: 'SIGNAL_RECEIVED' | 'OPERATION_OPENED' | 'OPERATION_CLOSED' | 'COMMISSION_PAID' | 'USER_LOGIN' | 'SYSTEM_ALERT';
  description: string;
  user?: string;
  amount?: number;
  status: 'success' | 'warning' | 'error';
  metadata?: {
    [key: string]: any;
  };
}
```

---

## 🎨 COMPONENTES DE INTERFACE

### **1. DASHBOARD COMPONENTS**
```typescript
interface DashboardProps {
  user: User;
  data: any;
  loading: boolean;
  onRefresh: () => void;
}

interface CardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: string;
  color?: string;
  loading?: boolean;
  onClick?: () => void;
}

interface ChartProps {
  data: any[];
  type: 'line' | 'bar' | 'pie' | 'area';
  xAxis: string;
  yAxis: string;
  color?: string;
  height?: number;
  loading?: boolean;
}
```

### **2. TABLE COMPONENTS**
```typescript
interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface TableProps {
  columns: TableColumn[];
  data: any[];
  loading?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  filters?: {
    [key: string]: any;
  };
  onFiltersChange?: (filters: any) => void;
  onRowClick?: (row: any) => void;
  selectable?: boolean;
  onSelectionChange?: (selected: any[]) => void;
}
```

### **3. FORM COMPONENTS**
```typescript
interface FormFieldProps {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'radio' | 'date';
  value: any;
  onChange: (value: any) => void;
  options?: { value: any; label: string }[];
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: RegExp;
  };
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  help?: string;
}

interface TradingConfigFormProps {
  userId: number;
  initialValues: TradingConfig;
  onSubmit: (values: TradingConfig) => void;
  canEdit: boolean;
  loading?: boolean;
}
```

---

## 🔄 API RESPONSE TYPES

### **1. STANDARD API RESPONSES**
```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}
```

### **2. DASHBOARD RESPONSES**
```typescript
interface AdminDashboardResponse {
  user: User;
  financial_summary: FinancialSummary;
  operations_summary: {
    total_operations: number;
    open_positions: number;
    closed_positions: number;
    success_rate: number;
    total_pnl: number;
  };
  users_summary: {
    total_users: number;
    active_users: number;
    vip_users: number;
    affiliates: number;
  };
  recent_activities: Activity[];
  system_health: SystemStatus;
}

interface AffiliateDashboardResponse {
  user: User;
  affiliate_stats: {
    total_referrals: number;
    active_referrals: number;
    total_commissions: number;
    pending_commissions: number;
    commission_rate: string;
  };
  referral_performance: Referral[];
  commission_history: Commission[];
  monthly_chart_data: {
    month: string;
    referrals: number;
    commissions: number;
  }[];
}
```

---

## 📱 STATE MANAGEMENT

### **1. REDUX/ZUSTAND STORE STRUCTURE**
```typescript
interface AppState {
  auth: {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
  };
  dashboard: {
    data: any;
    loading: boolean;
    lastUpdate: string;
  };
  operations: {
    list: Operation[];
    filters: any;
    loading: boolean;
    selected: Operation | null;
  };
  affiliates: {
    list: Affiliate[];
    commissions: Commission[];
    loading: boolean;
  };
  system: {
    status: SystemStatus;
    notifications: Notification[];
    loading: boolean;
  };
  ui: {
    sidebarOpen: boolean;
    theme: 'light' | 'dark';
    notifications: boolean;
  };
}
```

### **2. CONTEXT PROVIDERS**
```typescript
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  isRole: (role: string) => boolean;
}

interface WebSocketContextType {
  socket: WebSocket | null;
  connected: boolean;
  subscribe: (event: string, callback: Function) => void;
  unsubscribe: (event: string) => void;
  emit: (event: string, data: any) => void;
}
```

---

## 🎯 HOOKS CUSTOMIZADOS

### **1. DATA FETCHING HOOKS**
```typescript
function useOperations(userId?: number, filters?: any) {
  return useQuery({
    queryKey: ['operations', userId, filters],
    queryFn: () => api.getOperations(userId, filters),
    refetchInterval: 30000, // 30 segundos
  });
}

function useDashboard(userId: number) {
  return useQuery({
    queryKey: ['dashboard', userId],
    queryFn: () => api.getDashboard(userId),
    refetchInterval: 60000, // 1 minuto
  });
}

function useAffiliateStats(affiliateId: number) {
  return useQuery({
    queryKey: ['affiliate-stats', affiliateId],
    queryFn: () => api.getAffiliateStats(affiliateId),
    refetchInterval: 120000, // 2 minutos
  });
}
```

### **2. REAL-TIME HOOKS**
```typescript
function useRealTimeOperations() {
  const [operations, setOperations] = useState<Operation[]>([]);
  const { socket } = useWebSocket();

  useEffect(() => {
    if (socket) {
      socket.on('operation_update', (operation: Operation) => {
        setOperations(prev => 
          prev.map(op => op.id === operation.id ? operation : op)
        );
      });

      socket.on('new_operation', (operation: Operation) => {
        setOperations(prev => [operation, ...prev]);
      });
    }

    return () => {
      socket?.off('operation_update');
      socket?.off('new_operation');
    };
  }, [socket]);

  return operations;
}
```

### **3. PERMISSION HOOKS**
```typescript
function usePermissions() {
  const { user } = useAuth();

  return {
    canViewFinancial: user?.permissions.includes('financial_data') || false,
    canManageUsers: user?.permissions.includes('user_management') || false,
    canViewAllOperations: user?.permissions.includes('view_all_data') || false,
    isAdmin: user?.role === 'ADMIN',
    isAffiliate: user?.role === 'AFILIADO',
  };
}
```

---

## 🎨 STYLING E TEMAS

### **1. THEME CONFIGURATION**
```typescript
interface Theme {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    danger: string;
    info: string;
    light: string;
    dark: string;
    // Cores por perfil
    admin: string;
    gestor: string;
    operador: string;
    afiliado: string;
    usuario: string;
  };
  fonts: {
    primary: string;
    secondary: string;
    mono: string;
  };
  breakpoints: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}
```

### **2. STYLED COMPONENTS**
```typescript
const Container = styled.div<{ userRole: string }>`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${props => props.theme.spacing.md};
  border-left: 4px solid ${props => props.theme.colors[props.userRole]};
`;

const Card = styled.div<{ variant?: string }>`
  background: white;
  border-radius: 8px;
  padding: ${props => props.theme.spacing.lg};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid ${props => 
    props.variant === 'success' ? props.theme.colors.success :
    props.variant === 'warning' ? props.theme.colors.warning :
    '#e9ecef'
  };
`;
```

---

## 🔔 NOTIFICATIONS SYSTEM

### **1. NOTIFICATION TYPES**
```typescript
interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actions?: {
    label: string;
    action: () => void;
  }[];
  autoClose?: boolean;
  duration?: number;
}

interface NotificationByRole {
  ADMIN: [
    'system_alert',
    'financial_milestone',
    'user_signup',
    'technical_issue'
  ];
  GESTOR: [
    'operation_alert',
    'commission_update',
    'affiliate_activity'
  ];
  AFILIADO: [
    'commission_received',
    'new_referral',
    'payment_processed'
  ];
  USUARIO: [
    'operation_closed',
    'profit_achieved',
    'account_update'
  ];
}
```

---

## 📊 CHART CONFIGURATIONS

### **1. CHART DATA STRUCTURES**
```typescript
interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    borderWidth?: number;
  }[];
}

interface OperationChartData {
  date: string;
  operations: number;
  profit: number;
  loss: number;
  success_rate: number;
}

interface CommissionChartData {
  month: string;
  commissions: number;
  referrals: number;
  revenue: number;
}
```

---

## 🛡️ VALIDATION SCHEMAS

### **1. FORM VALIDATIONS**
```typescript
const tradingConfigValidation = {
  leverage_default: {
    required: true,
    min: 1,
    max: 10,
    type: 'number'
  },
  take_profit_multiplier: {
    required: true,
    min: 1,
    max: 5,
    type: 'number'
  },
  stop_loss_multiplier: {
    required: true,
    min: 1,
    max: 4,
    type: 'number'
  },
  balance_percentage_per_trade: {
    required: true,
    min: 1,
    max: 100,
    type: 'number'
  }
};

const userValidation = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  role: {
    required: true,
    enum: ['ADMIN', 'GESTOR', 'OPERADOR', 'AFILIADO', 'USUARIO']
  }
};
```

---

## 🚀 PERFORMANCE OPTIMIZATION

### **1. MEMOIZATION PATTERNS**
```typescript
const MemoizedOperationRow = React.memo(({ operation, onClick }) => {
  return (
    <tr onClick={() => onClick(operation)}>
      <td>{operation.symbol}</td>
      <td>{operation.type}</td>
      <td>{operation.pnl}</td>
    </tr>
  );
});

const useOptimizedOperations = (operations: Operation[]) => {
  return useMemo(() => {
    return operations.map(op => ({
      ...op,
      formattedPnl: formatCurrency(op.pnl),
      statusColor: getStatusColor(op.status)
    }));
  }, [operations]);
};
```

### **2. LAZY LOADING**
```typescript
const LazyAdminDashboard = lazy(() => import('./AdminDashboard'));
const LazyAffiliateDashboard = lazy(() => import('./AffiliateDashboard'));

const DashboardRouter = ({ userRole }) => (
  <Suspense fallback={<DashboardSkeleton />}>
    {userRole === 'ADMIN' && <LazyAdminDashboard />}
    {userRole === 'AFILIADO' && <LazyAffiliateDashboard />}
  </Suspense>
);
```

---

*Documentação completa de estruturas de dados para desenvolvimento frontend*
*CoinBitClub System v1.0.0*
