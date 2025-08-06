export interface TradeOperation {
  id: string;
  userId: string;
  exchange: 'binance' | 'bybit';
  symbol: string;
  type: 'LONG' | 'SHORT';
  status: 'open' | 'closed' | 'cancelled';
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  leverage: number;
  stopLoss: number;
  takeProfit?: number;
  result?: number; // Lucro/prejuízo
  resultPercentage?: number;
  openedAt: string;
  closedAt?: string;
  aiJustification?: string; // Justificativa da IA para operações negativas
  commission: number;
  fees: number;
}

export interface UserTradingSettings {
  userId: string;
  maxLeverage: number;
  maxStopLoss: number; // Porcentagem
  maxPercentPerTrade: number; // Porcentagem do saldo
  binanceApiKey?: string;
  binanceApiSecret?: string;
  bybitApiKey?: string;
  bybitApiSecret?: string;
  isActive: boolean;
  updatedAt: string;
}

export interface UserBalance {
  userId: string;
  planType: 'monthly' | 'prepaid';
  prepaidBalance: number; // Saldo pré-pago disponível
  totalProfit: number; // Lucro total acumulado
  totalLoss: number; // Prejuízo total acumulado
  pendingCommission: number; // Comissão pendente a pagar
  paidCommission: number; // Comissão já paga
  lastUpdated: string;
}

export interface AIReport {
  id: string;
  title: string;
  content: string;
  marketScenario: 'alta' | 'baixa' | 'lateralizacao_alta_volatilidade' | 'alta_pullback_tecnico' | 'baixa_suporte_forte';
  mainNews: string[];
  holidays: {
    china: string;
    usa: string;
  };
  potentialImpact: string[];
  trend: string;
  createdAt: string;
  publishedAt: string;
}

export interface DailyStats {
  date: string;
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  successRate: number; // Taxa de assertividade
  totalProfit: number;
  totalLoss: number;
  netResult: number;
}

export interface HistoricalStats {
  userId: string;
  totalOperations: number;
  successfulOperations: number;
  overallSuccessRate: number;
  totalProfit: number;
  totalLoss: number;
  netResult: number;
  averageOperationResult: number;
  bestOperation: {
    result: number;
    date: string;
    symbol: string;
  };
  worstOperation: {
    result: number;
    date: string;
    symbol: string;
  };
  monthlyStats: {
    month: string;
    profit: number;
    operations: number;
    successRate: number;
  }[];
}

export const DEFAULT_TRADING_LIMITS = {
  maxConcurrentTrades: 2,
  maxLeverage: 10,
  maxStopLoss: 5,
  maxPercentPerTrade: 2,
  minBalanceForTrade: 10 // USD/BRL mínimo para abrir operação
};

export function validateTradingSettings(settings: Partial<UserTradingSettings>): string[] {
  const errors: string[] = [];

  if (settings.maxLeverage && (settings.maxLeverage < 1 || settings.maxLeverage > 100)) {
    errors.push('Alavancagem deve estar entre 1x e 100x');
  }

  if (settings.maxStopLoss && (settings.maxStopLoss < 0.1 || settings.maxStopLoss > 50)) {
    errors.push('Stop Loss deve estar entre 0.1% e 50%');
  }

  if (settings.maxPercentPerTrade && (settings.maxPercentPerTrade < 0.1 || settings.maxPercentPerTrade > 20)) {
    errors.push('Porcentagem por operação deve estar entre 0.1% e 20%');
  }

  return errors;
}

export function canOpenNewTrade(
  openTrades: TradeOperation[],
  userSettings: UserTradingSettings,
  exchange: 'binance' | 'bybit'
): { canOpen: boolean; reason?: string } {
  // Verificar se não excede o limite total de 2 operações
  if (openTrades.length >= DEFAULT_TRADING_LIMITS.maxConcurrentTrades) {
    return {
      canOpen: false,
      reason: 'Limite máximo de 2 operações simultâneas atingido'
    };
  }

  // Verificar se tem API configurada para a exchange
  const hasApiKey = exchange === 'binance' 
    ? !!(userSettings.binanceApiKey && userSettings.binanceApiSecret)
    : !!(userSettings.bybitApiKey && userSettings.bybitApiSecret);

  if (!hasApiKey) {
    return {
      canOpen: false,
      reason: `Chaves API da ${exchange} não configuradas`
    };
  }

  return { canOpen: true };
}

export function calculateOperationResult(operation: TradeOperation): number {
  if (!operation.exitPrice || operation.status !== 'closed') return 0;

  const priceChange = operation.type === 'LONG' 
    ? operation.exitPrice - operation.entryPrice
    : operation.entryPrice - operation.exitPrice;

  const percentageChange = (priceChange / operation.entryPrice) * 100;
  const leveragedChange = percentageChange * operation.leverage;
  
  // Resultado baseado na quantidade investida
  const result = (leveragedChange / 100) * (operation.quantity * operation.entryPrice);
  
  return result - operation.fees - operation.commission;
}

export function calculateSuccessRate(operations: TradeOperation[]): number {
  const closedOps = operations.filter(op => op.status === 'closed');
  if (closedOps.length === 0) return 0;

  const successful = closedOps.filter(op => (op.result || 0) > 0).length;
  return (successful / closedOps.length) * 100;
}
