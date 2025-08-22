// ========================================
// MARKETBOT - TRADING TYPES
// Definições de tipos para o sistema de trading
// ========================================

// ========================================
// ENUMS DE TRADING
// ========================================

export enum ExchangeType {
  BINANCE = 'BINANCE',
  BYBIT = 'BYBIT',
  BINANCE_TESTNET = 'BINANCE_TESTNET',
  BYBIT_TESTNET = 'BYBIT_TESTNET'
}

export enum OrderType {
  MARKET = 'MARKET',
  LIMIT = 'LIMIT',
  STOP_MARKET = 'STOP_MARKET',
  STOP_LIMIT = 'STOP_LIMIT',
  TAKE_PROFIT = 'TAKE_PROFIT'
}

export enum OrderSide {
  BUY = 'BUY',
  SELL = 'SELL'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  FILLED = 'FILLED',
  PARTIALLY_FILLED = 'PARTIALLY_FILLED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED'
}

export enum PositionStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  LIQUIDATED = 'LIQUIDATED'
}

export enum SignalType {
  LONG = 'LONG',
  SHORT = 'SHORT',
  CLOSE_LONG = 'CLOSE_LONG',
  CLOSE_SHORT = 'CLOSE_SHORT'
}

export enum SignalStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  EXECUTED = 'EXECUTED',
  FAILED = 'FAILED',
  IGNORED = 'IGNORED'
}

// ========================================
// INTERFACES PRINCIPAIS
// ========================================

export interface UserExchangeAccount {
  id: string;
  userId: string;
  exchange: ExchangeType;
  accountName: string;
  apiKey: string; // Será criptografado
  apiSecret: string; // Será criptografado
  passphrase?: string;
  isTestnet: boolean;
  isActive: boolean;
  isVerified: boolean;
  
  // Permissões
  canRead: boolean;
  canTrade: boolean;
  canWithdraw: boolean;
  
  // Configurações
  maxPositionSizeUsd: number;
  dailyLossLimitUsd: number;
  maxDrawdownPercent: number;
  
  // Metadados
  lastConnectionTest?: Date;
  lastSyncAt?: Date;
  totalPositions: number;
  totalPnlUsd: number;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface TradingSignal {
  id: string;
  
  // Origem
  source: string; // 'TRADINGVIEW', 'MANUAL', 'BOT'
  webhookId?: string | undefined;
  
  // Dados do sinal
  symbol: string;
  signalType: SignalType;
  leverage: number;
  
  // Preços
  entryPrice?: number | undefined;
  stopLoss?: number | undefined;
  takeProfit1?: number | undefined;
  takeProfit2?: number | undefined;
  takeProfit3?: number | undefined;
  
  // Configurações
  positionSizePercent: number;
  riskRewardRatio?: number | undefined;
  
  // Status
  status: SignalStatus;
  receivedAt: Date;
  processedAt?: Date | undefined;
  expiresAt?: Date | undefined;
  
  // Metadados
  rawData?: any;
  notes?: string | undefined;
}

export interface TradingPosition {
  id: string;
  userId: string;
  exchangeAccountId: string;
  signalId?: string | undefined;
  
  // Dados da posição
  symbol: string;
  side: OrderSide;
  size: number;
  entryPrice: number;
  currentPrice?: number | undefined;
  
  // Configurações
  leverage: number;
  stopLoss?: number | undefined;
  takeProfit?: number | undefined;
  
  // Status
  status: PositionStatus;
  openedAt: Date;
  closedAt?: Date | undefined;
  
  // PnL
  unrealizedPnlUsd: number;
  realizedPnlUsd: number;
  feesPaidUsd: number;
  
  // IDs externos
  exchangePositionId?: string | undefined;
  exchangeOrderIds?: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface TradingOrder {
  id: string;
  userId: string;
  exchangeAccountId: string;
  positionId?: string | undefined;
  signalId?: string | undefined;
  
  // Dados da ordem
  symbol: string;
  type: OrderType;
  side: OrderSide;
  amount: number;
  price?: number | undefined; // null para market orders
  
  // Status
  status: OrderStatus;
  filledAmount: number;
  averagePrice?: number | undefined;
  
  // IDs da exchange
  exchangeOrderId?: string | undefined;
  clientOrderId?: string | undefined;
  
  // Timestamps
  submittedAt?: Date | undefined;
  filledAt?: Date | undefined;
  cancelledAt?: Date | undefined;
  
  // Fees
  feeAmount: number;
  feeCurrency?: string | undefined;
  
  // Metadados
  rawResponse?: any;
  errorMessage?: string | undefined;
  retryCount: number;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface TradingSettings {
  id: string;
  userId: string;
  
  // Configurações gerais
  autoTradingEnabled: boolean;
  preferredExchange: ExchangeType;
  useTestnet: boolean;
  
  // Gerenciamento de risco
  maxConcurrentPositions: number;
  maxDailyTrades: number;
  dailyLossLimitUsd: number;
  maxPositionSizePercent: number;
  
  // Stop Loss e Take Profit
  defaultStopLossPercent: number;
  defaultTakeProfitPercent: number;
  useTrailingStop: boolean;
  trailingStopPercent: number;
  
  // Leverage
  defaultLeverage: number;
  maxAllowedLeverage: number;
  
  // Filtros
  minRiskRewardRatio: number;
  allowedSymbols?: string[];
  blockedSymbols?: string[];
  
  // Horários
  tradingStartHour: number; // UTC
  tradingEndHour: number; // UTC
  tradeOnWeekends: boolean;
  
  // Notificações
  notifyOnSignal: boolean;
  notifyOnFill: boolean;
  notifyOnStopLoss: boolean;
  notifyOnTakeProfit: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketData {
  id: string;
  symbol: string;
  exchange: ExchangeType;
  
  // OHLCV
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  closePrice: number;
  volume: number;
  
  timestamp: Date;
  timeframe: string; // '1m', '5m', '15m', '1h', '4h', '1d'
  
  createdAt: Date;
}

// ========================================
// INTERFACES PARA WEBHOOKS
// ========================================

export interface TradingViewWebhook {
  symbol: string;
  action: 'BUY' | 'SELL' | 'CLOSE';
  price?: number;
  leverage?: number;
  stop_loss?: number;
  take_profit?: number;
  position_size?: number;
  timeframe?: string;
  strategy?: string;
  timestamp?: string;
  [key: string]: any; // Para campos customizados
}

// ========================================
// INTERFACES PARA EXCHANGES
// ========================================

export interface ExchangeCredentials {
  apiKey: string;
  apiSecret: string;
  passphrase?: string;
  testnet?: boolean;
}

export interface ExchangeBalance {
  asset: string;
  free: number;
  locked: number;
  total: number;
}

export interface ExchangeOrderResponse {
  orderId: string;
  clientOrderId?: string;
  symbol: string;
  status: string;
  type: string;
  side: string;
  amount: number;
  price?: number;
  filled: number;
  remaining: number;
  cost: number;
  fee?: {
    amount: number;
    currency: string;
  };
  timestamp: number;
  rawResponse: any;
}

export interface ExchangePositionResponse {
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  markPrice: number;
  unrealizedPnl: number;
  percentage: number;
  timestamp: number;
}

// ========================================
// TIPOS PARA VALIDAÇÃO E DTOs
// ========================================

export interface CreateExchangeAccountDTO {
  exchange: ExchangeType;
  accountName: string;
  apiKey: string;
  apiSecret: string;
  passphrase?: string;
  isTestnet?: boolean;
  maxPositionSizeUsd?: number;
  dailyLossLimitUsd?: number;
}

export interface CreateSignalDTO {
  source: string;
  symbol: string;
  signalType: SignalType;
  leverage?: number | undefined;
  entryPrice?: number | undefined;
  stopLoss?: number | undefined;
  takeProfit1?: number | undefined;
  takeProfit2?: number | undefined;
  takeProfit3?: number | undefined;
  positionSizePercent?: number | undefined;
  expiresAt?: Date | undefined;
  notes?: string | undefined;
}

export interface CreateOrderDTO {
  exchangeAccountId: string;
  symbol: string;
  type: OrderType;
  side: OrderSide;
  amount: number;
  price?: number | undefined;
  positionId?: string | undefined;
  signalId?: string | undefined;
}

export interface UpdateTradingSettingsDTO {
  autoTradingEnabled?: boolean;
  preferredExchange?: ExchangeType;
  useTestnet?: boolean;
  maxConcurrentPositions?: number;
  maxDailyTrades?: number;
  dailyLossLimitUsd?: number;
  maxPositionSizePercent?: number;
  defaultStopLossPercent?: number;
  defaultTakeProfitPercent?: number;
  defaultLeverage?: number;
  allowedSymbols?: string[];
  blockedSymbols?: string[];
  tradingStartHour?: number;
  tradingEndHour?: number;
  tradeOnWeekends?: boolean;
  notifyOnSignal?: boolean;
  notifyOnFill?: boolean;
  notifyOnStopLoss?: boolean;
  notifyOnTakeProfit?: boolean;
}

// ========================================
// INTERFACES PARA RELATÓRIOS
// ========================================

export interface TradingStatistics {
  userId: string;
  email: string;
  totalPositions: number;
  openPositions: number;
  closedPositions: number;
  totalRealizedPnl: number;
  totalUnrealizedPnl: number;
  totalFeesPaid: number;
  winningTrades: number;
  losingTrades: number;
  winRatePercent: number;
}

export interface DailyTradingLimits {
  canTrade: boolean;
  dailyPnl: number;
  dailyTrades: number;
  openPositions: number;
}

// ========================================
// TIPOS PARA RESPOSTAS DA API
// ========================================

export interface TradingApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ========================================
// INTERFACES PARA EVENTOS DE TRADING
// ========================================

export interface TradingEvent {
  type: 'SIGNAL_RECEIVED' | 'ORDER_FILLED' | 'POSITION_OPENED' | 'POSITION_CLOSED' | 'STOP_LOSS_HIT' | 'TAKE_PROFIT_HIT';
  userId: string;
  data: any;
  timestamp: Date;
}

export interface SignalReceivedEvent extends TradingEvent {
  type: 'SIGNAL_RECEIVED';
  data: {
    signalId: string;
    symbol: string;
    signalType: SignalType;
    source: string;
  };
}

export interface OrderFilledEvent extends TradingEvent {
  type: 'ORDER_FILLED';
  data: {
    orderId: string;
    positionId?: string;
    symbol: string;
    side: OrderSide;
    amount: number;
    price: number;
  };
}

export interface PositionOpenedEvent extends TradingEvent {
  type: 'POSITION_OPENED';
  data: {
    positionId: string;
    symbol: string;
    side: OrderSide;
    size: number;
    entryPrice: number;
    leverage: number;
  };
}

export interface PositionClosedEvent extends TradingEvent {
  type: 'POSITION_CLOSED';
  data: {
    positionId: string;
    symbol: string;
    realizedPnl: number;
    reason: 'MANUAL' | 'STOP_LOSS' | 'TAKE_PROFIT' | 'LIQUIDATION';
  };
}

// ========================================
// TIPOS AUXILIARES
// ========================================

export type Timeframe = '1m' | '3m' | '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '6h' | '8h' | '12h' | '1d' | '3d' | '1w' | '1M';

export type TradingPair = string; // Ex: 'BTCUSDT', 'ETHUSDT'

export type PriceType = 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';

export interface OHLCV {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Ticker {
  symbol: string;
  bid: number;
  ask: number;
  last: number;
  change: number;
  percentage: number;
  average: number;
  baseVolume: number;
  quoteVolume: number;
  timestamp: number;
}

export interface OrderBook {
  symbol: string;
  bids: [number, number][]; // [price, amount]
  asks: [number, number][]; // [price, amount]
  timestamp: number;
}

export interface Trade {
  id: string;
  symbol: string;
  side: OrderSide;
  amount: number;
  price: number;
  timestamp: number;
}

// ========================================
// EXPORT ALL TYPES
// ========================================

export default {
  ExchangeType,
  OrderType,
  OrderSide,
  OrderStatus,
  PositionStatus,
  SignalType,
  SignalStatus
};
