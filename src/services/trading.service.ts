// ========================================
// MARKETBOT - TRADING SERVICE
// Serviço principal para operações de trading
// ========================================

import { 
  TradingSignal, 
  TradingPosition, 
  TradingOrder, 
  TradingSettings,
  SignalType,
  SignalStatus,
  OrderType,
  OrderSide,
  OrderStatus,
  PositionStatus,
  CreateSignalDTO,
  CreateOrderDTO,
  ExchangeType
} from '../types/trading.types.js';
import { DatabaseService } from './database.service.js';
import { ExchangeService } from './exchange.service.js';
import { logger } from '../utils/logger.js';

export class TradingService {
  private static instance: TradingService;
  private exchangeService: ExchangeService;

  constructor() {
    this.exchangeService = ExchangeService.getInstance();
  }

  static getInstance(): TradingService {
    if (!TradingService.instance) {
      TradingService.instance = new TradingService();
    }
    return TradingService.instance;
  }

  // ========================================
  // GERENCIAMENTO DE SINAIS
  // ========================================

  async createSignal(signalData: CreateSignalDTO): Promise<TradingSignal> {
    try {
      const query = `
        INSERT INTO trading_signals (
          source, symbol, signal_type, leverage, entry_price,
          stop_loss, take_profit_1, take_profit_2, take_profit_3,
          position_size_percent, risk_reward_ratio, expires_at, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;

      // Calcular risk/reward ratio se não fornecido
      let riskRewardRatio = signalData.entryPrice && signalData.stopLoss && signalData.takeProfit1 
        ? Math.abs((signalData.takeProfit1 - signalData.entryPrice) / (signalData.entryPrice - signalData.stopLoss))
        : null;

      const values = [
        signalData.source,
        signalData.symbol.toUpperCase(),
        signalData.signalType,
        signalData.leverage || 1,
        signalData.entryPrice,
        signalData.stopLoss,
        signalData.takeProfit1,
        signalData.takeProfit2,
        signalData.takeProfit3,
        signalData.positionSizePercent || 1.0,
        riskRewardRatio,
        signalData.expiresAt,
        signalData.notes
      ];

      const result = await DatabaseService.getInstance().query(query, values);
      
      const signal = this.formatSignal(result.rows[0]);
      
      logger.info(`Novo sinal criado: ${signal.symbol} ${signal.signalType} - ID: ${signal.id}`);
      
      // Processar sinal automaticamente se configurado
      this.processSignalAsync(signal.id);
      
      return signal;
    } catch (error) {
      logger.error('Erro ao criar sinal:', error);
      throw error;
    }
  }

  async getSignal(signalId: string): Promise<TradingSignal | null> {
    try {
      const query = `SELECT * FROM trading_signals WHERE id = $1`;
      const result = await DatabaseService.getInstance().query(query, [signalId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.formatSignal(result.rows[0]);
    } catch (error) {
      logger.error('Erro ao buscar sinal:', error);
      throw error;
    }
  }

  async getUserSignals(userId: string, limit: number = 50): Promise<TradingSignal[]> {
    try {
      const query = `
        SELECT s.* FROM trading_signals s
        LEFT JOIN trading_positions p ON p.signal_id = s.id
        WHERE p.user_id = $1 OR s.created_at >= NOW() - INTERVAL '24 hours'
        ORDER BY s.created_at DESC
        LIMIT $2
      `;
      
      const result = await DatabaseService.getInstance().query(query, [userId, limit]);
      
      return result.rows.map((row: any) => this.formatSignal(row));
    } catch (error) {
      logger.error('Erro ao buscar sinais do usuário:', error);
      throw error;
    }
  }

  async updateSignalStatus(signalId: string, status: SignalStatus, notes?: string): Promise<void> {
    try {
      const query = `
        UPDATE trading_signals 
        SET status = $1, processed_at = CURRENT_TIMESTAMP, notes = COALESCE($2, notes)
        WHERE id = $3
      `;
      
      await DatabaseService.getInstance().query(query, [status, notes, signalId]);
      
      logger.info(`Status do sinal ${signalId} atualizado para ${status}`);
    } catch (error) {
      logger.error('Erro ao atualizar status do sinal:', error);
      throw error;
    }
  }

  // ========================================
  // PROCESSAMENTO DE SINAIS
  // ========================================

  private async processSignalAsync(signalId: string): Promise<void> {
    try {
      // Buscar sinal
      const signal = await this.getSignal(signalId);
      if (!signal) {
        throw new Error('Sinal não encontrado');
      }

      // Verificar se já foi processado
      if (signal.status !== SignalStatus.PENDING) {
        return;
      }

      // Marcar como processando
      await this.updateSignalStatus(signalId, SignalStatus.PROCESSING);

      // Buscar usuários com auto-trading habilitado
      const eligibleUsers = await this.getEligibleUsersForSignal(signal);

      for (const user of eligibleUsers) {
        try {
          await this.executeSignalForUser(signal, user);
        } catch (error) {
          logger.error(`Erro ao executar sinal ${signalId} para usuário ${user.userId}:`, error);
        }
      }

      // Marcar como executado
      await this.updateSignalStatus(signalId, SignalStatus.EXECUTED);

    } catch (error) {
      logger.error(`Erro ao processar sinal ${signalId}:`, error);
      await this.updateSignalStatus(signalId, SignalStatus.FAILED, (error as Error).message);
    }
  }

  private async getEligibleUsersForSignal(signal: TradingSignal): Promise<any[]> {
    try {
      const query = `
        SELECT 
          ts.*,
          uea.id as account_id,
          uea.exchange,
          uea.max_position_size_usd,
          uea.daily_loss_limit_usd
        FROM trading_settings ts
        JOIN user_exchange_accounts uea ON uea.user_id = ts.user_id
        WHERE ts.auto_trading_enabled = true
          AND uea.is_active = true
          AND uea.can_trade = true
          AND (ts.allowed_symbols IS NULL OR $1 = ANY(ts.allowed_symbols))
          AND (ts.blocked_symbols IS NULL OR NOT ($1 = ANY(ts.blocked_symbols)))
          AND ts.min_risk_reward_ratio <= $2
      `;
      
      const result = await DatabaseService.getInstance().query(query, [
        signal.symbol,
        signal.riskRewardRatio || 0
      ]);
      
      return result.rows;
    } catch (error) {
      logger.error('Erro ao buscar usuários elegíveis:', error);
      return [];
    }
  }

  private async executeSignalForUser(signal: TradingSignal, userConfig: any): Promise<void> {
    try {
      // Verificar limites diários
      const canTrade = await this.checkDailyLimits(userConfig.user_id);
      if (!canTrade.canTrade) {
        logger.warn(`Usuário ${userConfig.user_id} atingiu limites diários`);
        return;
      }

      // Calcular tamanho da posição baseado no saldo real da exchange
      const positionSize = await this.calculatePositionSize(userConfig, signal);
      
      if (positionSize <= 0) {
        logger.warn(`Tamanho de posição inválido para usuário ${userConfig.user_id}`);
        return;
      }

      // OBRIGATÓRIO: Calcular TP e SL baseado na alavancagem
      const leverage = userConfig.default_leverage || 5;
      const entryPrice = signal.entryPrice || await this.getCurrentPrice(userConfig.account_id, signal.symbol);
      
      // TP = 3x alavancagem (15% para 5x leverage)
      const takeProfitPercent = userConfig.default_take_profit_percent || (leverage * 3);
      // SL = 2x alavancagem (10% para 5x leverage)  
      const stopLossPercent = userConfig.default_stop_loss_percent || (leverage * 2);

      let takeProfit: number, stopLoss: number;
      
      if (signal.signalType === SignalType.LONG) {
        takeProfit = entryPrice * (1 + takeProfitPercent / 100);
        stopLoss = entryPrice * (1 - stopLossPercent / 100);
      } else { // SHORT
        takeProfit = entryPrice * (1 - takeProfitPercent / 100);
        stopLoss = entryPrice * (1 + stopLossPercent / 100);
      }

      logger.info(`Configuração: Leverage ${leverage}x, TP ${takeProfitPercent}%, SL ${stopLossPercent}%, Position ${positionSize}`);

      // Criar posição com TP/SL OBRIGATÓRIOS
      const position = await this.createPosition({
        userId: userConfig.user_id,
        exchangeAccountId: userConfig.account_id,
        signalId: signal.id,
        symbol: signal.symbol,
        side: signal.signalType === SignalType.LONG ? OrderSide.BUY : OrderSide.SELL,
        size: positionSize,
        entryPrice: entryPrice,
        leverage: leverage,
        stopLoss: stopLoss,     // OBRIGATÓRIO
        takeProfit: takeProfit  // OBRIGATÓRIO
      });

      // Executar ordem de entrada
      if (signal.signalType === SignalType.LONG || signal.signalType === SignalType.SHORT) {
        await this.createAndExecuteOrder({
          exchangeAccountId: userConfig.account_id,
          symbol: signal.symbol,
          type: signal.entryPrice ? OrderType.LIMIT : OrderType.MARKET,
          side: signal.signalType === SignalType.LONG ? OrderSide.BUY : OrderSide.SELL,
          amount: positionSize,
          price: signal.entryPrice || undefined,
          positionId: position.id,
          signalId: signal.id
        });
      }

    } catch (error) {
      logger.error('Erro ao executar sinal para usuário:', error);
      throw error;
    }
  }

  // ========================================
  // GERENCIAMENTO DE POSIÇÕES
  // ========================================

  async createPosition(positionData: {
    userId: string;
    exchangeAccountId: string;
    signalId?: string;
    symbol: string;
    side: OrderSide;
    size: number;
    entryPrice: number;
    leverage: number;
    stopLoss?: number;
    takeProfit?: number;
  }): Promise<TradingPosition> {
    try {
      const query = `
        INSERT INTO trading_positions (
          user_id, exchange_account_id, signal_id, symbol, side,
          size, entry_price, leverage, stop_loss, take_profit
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const values = [
        positionData.userId,
        positionData.exchangeAccountId,
        positionData.signalId,
        positionData.symbol.toUpperCase(),
        positionData.side,
        positionData.size,
        positionData.entryPrice,
        positionData.leverage,
        positionData.stopLoss,
        positionData.takeProfit
      ];

      const result = await DatabaseService.getInstance().query(query, values);
      
      const position = this.formatPosition(result.rows[0]);
      
      logger.info(`Nova posição criada: ${position.symbol} ${position.side} ${position.size} - ID: ${position.id}`);
      
      return position;
    } catch (error) {
      logger.error('Erro ao criar posição:', error);
      throw error;
    }
  }

  async getUserPositions(userId: string, status?: PositionStatus): Promise<TradingPosition[]> {
    try {
      let query = `
        SELECT * FROM trading_positions 
        WHERE user_id = $1
      `;
      const values: any[] = [userId];

      if (status) {
        query += ` AND status = $2`;
        values.push(status);
      }

      query += ` ORDER BY created_at DESC`;

      const result = await DatabaseService.getInstance().query(query, values);
      
      return result.rows.map((row: any) => this.formatPosition(row));
    } catch (error) {
      logger.error('Erro ao buscar posições do usuário:', error);
      throw error;
    }
  }

  async updatePositionPnL(positionId: string): Promise<void> {
    try {
      // Esta função será chamada periodicamente para atualizar PnL
      const position = await this.getPosition(positionId);
      if (!position) return;

      // Buscar preço atual da exchange
      const currentPrice = await this.getCurrentPrice(position.exchangeAccountId, position.symbol);
      
      // Calcular PnL não realizado
      const unrealizedPnl = this.calculateUnrealizedPnL(position, currentPrice);

      const query = `
        UPDATE trading_positions 
        SET current_price = $1, unrealized_pnl_usd = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `;

      await DatabaseService.getInstance().query(query, [currentPrice, unrealizedPnl, positionId]);

    } catch (error) {
      logger.error('Erro ao atualizar PnL da posição:', error);
    }
  }

  async closePosition(positionId: string, reason: string = 'MANUAL'): Promise<void> {
    try {
      const position = await this.getPosition(positionId);
      if (!position || position.status === PositionStatus.CLOSED) {
        return;
      }

      // Criar ordem de fechamento
      const closeOrder = await this.createAndExecuteOrder({
        exchangeAccountId: position.exchangeAccountId,
        symbol: position.symbol,
        type: OrderType.MARKET,
        side: position.side === OrderSide.BUY ? OrderSide.SELL : OrderSide.BUY,
        amount: position.size,
        positionId: position.id
      });

      // Marcar posição como fechada
      const query = `
        UPDATE trading_positions 
        SET status = $1, closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `;

      await DatabaseService.getInstance().query(query, [PositionStatus.CLOSED, positionId]);

      logger.info(`Posição ${positionId} fechada - Razão: ${reason}`);

    } catch (error) {
      logger.error('Erro ao fechar posição:', error);
      throw error;
    }
  }

  // ========================================
  // GERENCIAMENTO DE ORDENS
  // ========================================

  async createAndExecuteOrder(orderData: CreateOrderDTO): Promise<TradingOrder> {
    try {
      // Criar ordem no banco
      const order = await this.createOrder(orderData);

      // Executar na exchange
      try {
        const exchangeOrder = await this.exchangeService.createOrder(
          orderData.exchangeAccountId,
          orderData.symbol,
          orderData.type,
          orderData.side,
          orderData.amount,
          orderData.price
        );

        // Atualizar com dados da exchange
        await this.updateOrderFromExchange(order.id, exchangeOrder);

        logger.info(`Ordem executada: ${order.symbol} ${order.side} ${order.amount}`);

      } catch (exchangeError) {
        // Marcar ordem como rejeitada
        await this.updateOrderStatus(order.id, OrderStatus.REJECTED, (exchangeError as Error).message);
        throw exchangeError;
      }

      return order;
    } catch (error) {
      logger.error('Erro ao criar e executar ordem:', error);
      throw error;
    }
  }

  private async createOrder(orderData: CreateOrderDTO): Promise<TradingOrder> {
    try {
      const query = `
        INSERT INTO trading_orders (
          user_id, exchange_account_id, position_id, signal_id,
          symbol, type, side, amount, price, client_order_id
        ) VALUES (
          (SELECT user_id FROM user_exchange_accounts WHERE id = $1),
          $1, $2, $3, $4, $5, $6, $7, $8, $9
        )
        RETURNING *
      `;

      const clientOrderId = `MB_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const values = [
        orderData.exchangeAccountId,
        orderData.positionId,
        orderData.signalId,
        orderData.symbol.toUpperCase(),
        orderData.type,
        orderData.side,
        orderData.amount,
        orderData.price,
        clientOrderId
      ];

      const result = await DatabaseService.getInstance().query(query, values);
      
      return this.formatOrder(result.rows[0]);
    } catch (error) {
      logger.error('Erro ao criar ordem no banco:', error);
      throw error;
    }
  }

  // ========================================
  // UTILITÁRIOS E CÁLCULOS
  // ========================================

  private async calculatePositionSize(userConfig: any, signal: TradingSignal): Promise<number> {
    try {
      // Buscar saldo REAL da exchange
      const balances = await this.exchangeService.getBalance(userConfig.account_id);
      const usdtBalance = balances.find(b => b.asset === 'USDT')?.free || 0;

      if (usdtBalance <= 0) {
        logger.warn(`Saldo insuficiente na exchange para usuário ${userConfig.user_id}: $${usdtBalance}`);
        return 0;
      }

      // Calcular tamanho baseado APENAS no saldo da exchange
      // Usar max_position_size_percent (30% por padrão) do saldo real na exchange
      const positionSizePercent = userConfig.max_position_size_percent || 30.0;
      const positionSizeUsd = usdtBalance * (positionSizePercent / 100);

      // Aplicar limite máximo em USD se configurado (segurança adicional)
      const finalPositionUsd = userConfig.max_position_size_usd 
        ? Math.min(positionSizeUsd, userConfig.max_position_size_usd)
        : positionSizeUsd;

      // Converter para quantidade de moedas
      const entryPrice = signal.entryPrice || await this.getCurrentPrice(userConfig.account_id, signal.symbol);
      const positionSize = finalPositionUsd / entryPrice;

      logger.info(`Position calculation: Exchange balance $${usdtBalance}, Position ${positionSizePercent}% = $${finalPositionUsd}`);
      
      return Math.floor(positionSize * 100000) / 100000; // Arredondar para 5 casas decimais
    } catch (error) {
      logger.error('Erro ao calcular tamanho da posição:', error);
      return 0;
    }
  }

  private async getCurrentPrice(accountId: string, symbol: string): Promise<number> {
    try {
      const exchange = await this.exchangeService.getExchangeConnection(accountId);
      const ticker = await exchange.fetchTicker(symbol);
      return ticker.last || ticker.close || 0;
    } catch (error) {
      logger.error('Erro ao obter preço atual:', error);
      return 0;
    }
  }

  private calculateUnrealizedPnL(position: TradingPosition, currentPrice: number): number {
    if (currentPrice <= 0) return 0;

    const priceDiff = position.side === OrderSide.BUY 
      ? currentPrice - position.entryPrice
      : position.entryPrice - currentPrice;

    return (priceDiff / position.entryPrice) * position.size * position.entryPrice * position.leverage;
  }

  private async checkDailyLimits(userId: string): Promise<{ canTrade: boolean; dailyPnl: number; dailyTrades: number; openPositions: number }> {
    try {
      const query = `
        SELECT * FROM get_daily_trading_limits($1)
      `;
      
      const result = await DatabaseService.getInstance().query(query, [userId]);
      return result.rows[0] || { canTrade: false, dailyPnl: 0, dailyTrades: 0, openPositions: 0 };
    } catch (error) {
      logger.error('Erro ao verificar limites diários:', error);
      return { canTrade: false, dailyPnl: 0, dailyTrades: 0, openPositions: 0 };
    }
  }

  // ========================================
  // FORMATTERS
  // ========================================

  private formatSignal(row: any): TradingSignal {
    return {
      id: row.id,
      source: row.source,
      webhookId: row.webhook_id,
      symbol: row.symbol,
      signalType: row.signal_type,
      leverage: row.leverage,
      entryPrice: row.entry_price ? parseFloat(row.entry_price) : undefined,
      stopLoss: row.stop_loss ? parseFloat(row.stop_loss) : undefined,
      takeProfit1: row.take_profit_1 ? parseFloat(row.take_profit_1) : undefined,
      takeProfit2: row.take_profit_2 ? parseFloat(row.take_profit_2) : undefined,
      takeProfit3: row.take_profit_3 ? parseFloat(row.take_profit_3) : undefined,
      positionSizePercent: parseFloat(row.position_size_percent),
      riskRewardRatio: row.risk_reward_ratio ? parseFloat(row.risk_reward_ratio) : undefined,
      status: row.status,
      receivedAt: row.received_at,
      processedAt: row.processed_at,
      expiresAt: row.expires_at,
      rawData: row.raw_data,
      notes: row.notes
    };
  }

  private formatPosition(row: any): TradingPosition {
    return {
      id: row.id,
      userId: row.user_id,
      exchangeAccountId: row.exchange_account_id,
      signalId: row.signal_id,
      symbol: row.symbol,
      side: row.side,
      size: parseFloat(row.size),
      entryPrice: parseFloat(row.entry_price),
      currentPrice: row.current_price ? parseFloat(row.current_price) : undefined,
      leverage: row.leverage,
      stopLoss: row.stop_loss ? parseFloat(row.stop_loss) : undefined,
      takeProfit: row.take_profit ? parseFloat(row.take_profit) : undefined,
      status: row.status,
      openedAt: row.opened_at,
      closedAt: row.closed_at,
      unrealizedPnlUsd: parseFloat(row.unrealized_pnl_usd) || 0,
      realizedPnlUsd: parseFloat(row.realized_pnl_usd) || 0,
      feesPaidUsd: parseFloat(row.fees_paid_usd) || 0,
      exchangePositionId: row.exchange_position_id,
      exchangeOrderIds: row.exchange_order_ids || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private formatOrder(row: any): TradingOrder {
    return {
      id: row.id,
      userId: row.user_id,
      exchangeAccountId: row.exchange_account_id,
      positionId: row.position_id,
      signalId: row.signal_id,
      symbol: row.symbol,
      type: row.type,
      side: row.side,
      amount: parseFloat(row.amount),
      price: row.price ? parseFloat(row.price) : undefined,
      status: row.status,
      filledAmount: parseFloat(row.filled_amount) || 0,
      averagePrice: row.average_price ? parseFloat(row.average_price) : undefined,
      exchangeOrderId: row.exchange_order_id,
      clientOrderId: row.client_order_id,
      submittedAt: row.submitted_at,
      filledAt: row.filled_at,
      cancelledAt: row.cancelled_at,
      feeAmount: parseFloat(row.fee_amount) || 0,
      feeCurrency: row.fee_currency,
      rawResponse: row.raw_response,
      errorMessage: row.error_message,
      retryCount: row.retry_count || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // ========================================
  // MÉTODOS AUXILIARES
  // ========================================

  private async getPosition(positionId: string): Promise<TradingPosition | null> {
    try {
      const query = `SELECT * FROM trading_positions WHERE id = $1`;
      const result = await DatabaseService.getInstance().query(query, [positionId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.formatPosition(result.rows[0]);
    } catch (error) {
      logger.error('Erro ao buscar posição:', error);
      return null;
    }
  }

  private async updateOrderFromExchange(orderId: string, exchangeOrder: any): Promise<void> {
    try {
      const query = `
        UPDATE trading_orders 
        SET 
          exchange_order_id = $1,
          status = $2,
          filled_amount = $3,
          average_price = $4,
          fee_amount = $5,
          fee_currency = $6,
          raw_response = $7,
          submitted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $8
      `;

      const values = [
        exchangeOrder.orderId,
        exchangeOrder.status.toUpperCase(),
        exchangeOrder.filled,
        exchangeOrder.price,
        exchangeOrder.fee?.amount || 0,
        exchangeOrder.fee?.currency,
        JSON.stringify(exchangeOrder.rawResponse),
        orderId
      ];

      await DatabaseService.getInstance().query(query, values);
    } catch (error) {
      logger.error('Erro ao atualizar ordem com dados da exchange:', error);
    }
  }

  private async updateOrderStatus(orderId: string, status: OrderStatus, errorMessage?: string): Promise<void> {
    try {
      const query = `
        UPDATE trading_orders 
        SET status = $1, error_message = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `;

      await DatabaseService.getInstance().query(query, [status, errorMessage, orderId]);
    } catch (error) {
      logger.error('Erro ao atualizar status da ordem:', error);
    }
  }
}

export default TradingService;
