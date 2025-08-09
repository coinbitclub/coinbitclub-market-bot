// Auth Types
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'affiliate' | 'admin';
  plan_id: number;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  affiliate_code?: string;
}

// Plan Types
export interface Plan {
  id: number;
  name: string;
  description: string;
  price: number;
  features: string[];
  max_balance: number;
  commission_rate: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// Credential Types
export interface Credential {
  id: number;
  user_id: number;
  exchange: 'bybit' | 'binance';
  api_key: string;
  api_secret: string;
  environment: 'testnet' | 'production';
  status: 'active' | 'inactive' | 'error';
  last_validation: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCredentialRequest {
  exchange: 'bybit' | 'binance';
  api_key: string;
  api_secret: string;
  environment: 'testnet' | 'production';
}

// CoinStats Types
export interface Cointar {
  id: number;
  symbol: string;
  name: string;
  price: number;
  change_24h: number;
  volume_24h: number;
  market_cap: number;
  rank: number;
  last_updated: string;
}

// Dashboard Types
export interface DashboardMetrics {
  accuracy_percentage: number;
  daily_return_pct: number;
  lifetime_return_pct: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  total_pnl_usd: number;
  avg_trade_duration: number;
}

export interface DashboardBalance {
  id: number;
  user_id: number;
  exchange: string;
  environment: 'testnet' | 'production';
  asset: string;
  total_balance: number;
  available_balance: number;
  locked_balance: number;
  usd_value: number;
  last_updated: string;
}

export interface EquityPoint {
  timestamp: string;
  balance: number;
  pnl: number;
  trade_count: number;
}

export interface DashboardPerformance {
  equity_curve: EquityPoint[];
  daily_returns: Array<{
    date: string;
    return_pct: number;
    trades: number;
  }>;
  monthly_summary: Array<{
    month: string;
    return_pct: number;
    trades: number;
    win_rate: number;
  }>;
}

// Order Types
export interface Order {
  id: number;
  user_id: number;
  exchange: string;
  environment: string;
  order_id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  quantity: number;
  price: number;
  filled_quantity: number;
  filled_price: number;
  status: 'pending' | 'filled' | 'cancelled' | 'rejected';
  take_profit: number;
  stop_loss: number;
  pnl_usd: number;
  pnl_percentage: number;
  entry_reason: string;
  exit_reason: string;
  opened_at: string;
  closed_at: string;
  created_at: string;
  updated_at: string;
}

export interface OpenPosition extends Order {
  unrealized_pnl: number;
  unrealized_pnl_pct: number;
  current_price: number;
  duration: string;
}

export interface ClosedPosition extends Order {
  realized_pnl: number;
  realized_pnl_pct: number;
  exit_price: number;
  hold_duration: string;
  ai_reason: string;
}

// IA Logs Types
export interface IaLog {
  id: number;
  user_id: number;
  request_type: 'signal_analysis' | 'risk_management' | 'position_sizing';
  prompt: string;
  response: string;
  model_used: string;
  tokens_used: number;
  cost_usd: number;
  confidence_score: number;
  fallback_reason: string;
  created_at: string;
}

// Reports Types
export interface FinancialReport {
  period: string;
  total_revenue: number;
  total_costs: number;
  net_profit: number;
  user_commissions: number;
  affiliate_commissions: number;
  ai_costs: number;
  infrastructure_costs: number;
  breakdown_by_user: Array<{
    user_id: number;
    username: string;
    revenue: number;
    costs: number;
    profit: number;
  }>;
}

export interface AffiliateReport {
  affiliate_id: number;
  affiliate_name: string;
  total_referrals: number;
  active_referrals: number;
  total_commission: number;
  pending_commission: number;
  paid_commission: number;
  referrals: Array<{
    user_id: number;
    username: string;
    signup_date: string;
    status: string;
    plan_name: string;
    commission_earned: number;
  }>;
}

export interface Report {
  financial: FinancialReport;
  affiliate: AffiliateReport[];
  ia_logs: IaLog[];
}

// SSE Events Types
export interface EventMessage {
  type: 'order_update' | 'balance_update' | 'signal_received' | 'ai_fallback';
  data: any;
  timestamp: string;
  user_id?: number;
}

// Affiliate Types
export interface AffiliateMetrics {
  total_referrals: number;
  active_referrals: number;
  pending_commission: number;
  paid_commission: number;
  monthly_commission: Array<{
    month: string;
    amount: number;
    referrals: number;
  }>;
}

export interface ReferralLink {
  code: string;
  url: string;
  qr_code: string;
  clicks: number;
  conversions: number;
  created_at: string;
}

// Admin Types
export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  plan: string;
  status: string;
  total_trades: number;
  total_pnl: number;
  last_activity: string;
  created_at: string;
}

export interface SystemMetrics {
  total_users: number;
  active_users: number;
  total_trades_today: number;
  total_pnl_today: number;
  api_calls_today: number;
  errors_today: number;
  uptime_percentage: number;
}

export interface SignalMetrics {
  total_signals_received: number;
  signals_processed: number;
  signals_filtered: number;
  average_latency_ms: number;
  success_rate: number;
  by_source: Array<{
    source: string;
    count: number;
    success_rate: number;
  }>;
}

// Error Types
export interface ApiError {
  message: string;
  code: string;
  status: number;
  details?: any;
}

// Request/Response wrapper types
export interface ApiResponse<T> {
  data: T;
  message: string;
  status: 'success' | 'error';
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  affiliateCode?: string;
}

export interface CredentialFormData {
  exchange: 'bybit' | 'binance';
  apiKey: string;
  apiSecret: string;
  environment: 'testnet' | 'production';
}

// Filter Types
export interface OrderFilters {
  exchange?: string;
  environment?: string;
  symbol?: string;
  status?: string;
  side?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface ReportFilters {
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  start_date?: string;
  end_date?: string;
  user_id?: number;
  exchange?: string;
  environment?: string;
}

// Chart Data Types
export interface ChartDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface PieChartData {
  name: string;
  value: number;
  color: string;
}

export interface BarChartData {
  category: string;
  value: number;
  color?: string;
}
