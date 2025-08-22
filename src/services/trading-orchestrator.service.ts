// ========================================
// MARKETBOT - TRADING ORCHESTRATOR
// Sistema principal de orquestração de trading multiusuários
// FASE 5 - Coração e pulmão do projeto
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
  ExchangeType
} from '../types/trading.types.js';
import { DatabaseService } from './database.service.js';
import { ExchangeService } from './exchange.service.js';
import TradingService from './trading.service.js';
import { logger } from '../utils/logger.js';

interface UserTradingConfig {
  userId: string;
  exchangeAccountId: string;
  exchange: ExchangeType;
  autoTradingEnabled: boolean;
  maxPositionSizeUsd: number;
  dailyLossLimitUsd: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  leverage: number;
  maxConcurrentPositions: number;
}

interface RiskValidation {
  canTrade: boolean;
  reason?: string;
  dailyPnl: number;
  dailyTrades: number;
  openPositions: number;
  accountBalance: number;
}

interface PositionCalculation {
  positionSizeUsd: number;
  positionSizeBase: number;
  leverageToUse: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  riskRewardRatio: number;
}

export class TradingOrchestrator {
  private static instance: TradingOrchestrator;
  private tradingService: TradingService;
  private exchangeService: ExchangeService;
  private activeMonitoring: Map<string, NodeJS.Timeout> = new Map();
  private isRunning: boolean = false;

  constructor() {
    this.tradingService = TradingService.getInstance();
    this.exchangeService = ExchangeService.getInstance();
  }

  static getInstance(): TradingOrchestrator {
    if (!TradingOrchestrator.instance) {
      TradingOrchestrator.instance = new TradingOrchestrator();
    }
    return TradingOrchestrator.instance;
  }

  // ========================================
  // INICIALIZAÇÃO DO SISTEMA
  // ========================================

  async initialize(): Promise<void> {
    try {
      logger.info('🚀 Inicializando Trading Orchestrator - Sistema Multiusuários');
      
      this.isRunning = true;
      
      // Inicializar monitoramento de posições abertas
      await this.initializePositionMonitoring();
      
      // Verificar configurações padrão do admin
      await this.ensureAdminDefaultSettings();
      
      // Validar IP fixo
      await this.validateFixedIP();
      
      logger.info('✅ Trading Orchestrator inicializado com sucesso');
    } catch (error) {
      logger.error('❌ Erro ao inicializar Trading Orchestrator:', error);
      throw error;
    }
  }

  private async validateFixedIP(): Promise<void> {
    try {
      // Verificar se o IP fixo está configurado
      const ipFixo = process.env.NGROK_IP_FIXO;
      if (!ipFixo) {
        throw new Error('IP fixo NGROK não configurado');
      }
      
      logger.info(`🌐 IP Fixo NGROK validado: ${ipFixo}`);
    } catch (error) {
      logger.error('❌ Erro na validação do IP fixo:', error);
      throw error;
    }
  }

  // ========================================
  // SISTEMA DE PRIORIDADES (CONFORME PLANO)
  // ========================================

  private async determineUserPriority(userId: string): Promise<number> {
    try {
      const query = `
        SELECT 
          u.user_type,
          u.plan_type,
          u.account_balance_usd,
          u.prepaid_credits,
          uea.is_testnet
        FROM users u
        LEFT JOIN user_exchange_accounts uea ON u.id = uea.user_id AND uea.is_active = true
        WHERE u.id = $1
        LIMIT 1
      `;
      
      const result = await DatabaseService.getInstance().query(query, [userId]);
      
      if (result.rows.length === 0) {
        return 3; // Prioridade mais baixa se usuário não encontrado
      }
      
      const user = result.rows[0];
      
      // PRIORIDADE 1: MAINNET + Saldo Real (Stripe)
      if (!user.is_testnet && user.account_balance_usd > 0) {
        return 1;
      }
      
      // PRIORIDADE 2: MAINNET + Saldo Administrativo (Cupons)
      if (!user.is_testnet && user.prepaid_credits > 0) {
        return 2;
      }
      
      // PRIORIDADE 3: TESTNET + Qualquer usuário
      return 3;
      
    } catch (error) {
      logger.error('Erro ao determinar prioridade do usuário:', error);
      return 3; // Prioridade mais baixa em caso de erro
    }
  }

  // Fila de processamento com prioridades
  private signalQueue: Map<number, Array<{signal: CreateSignalDTO, userId: string}>> = new Map([
    [1, []], // PRIORIDADE 1: MAINNET + Saldo Real
    [2, []], // PRIORIDADE 2: MAINNET + Cupons
    [3, []]  // PRIORIDADE 3: TESTNET
  ]);

  private isProcessingQueue = false;

  private async addToQueue(signal: CreateSignalDTO, userId: string): Promise<void> {
    const priority = await this.determineUserPriority(userId);
    
    const queue = this.signalQueue.get(priority) || [];
    queue.push({ signal, userId });
    this.signalQueue.set(priority, queue);
    
    logger.info(`📥 Sinal adicionado à fila - Prioridade ${priority}, Queue size: ${queue.length}`);
    
    // Processar fila se não estiver processando
    if (!this.isProcessingQueue) {
      this.processSignalQueue();
    }
  }

  private async processSignalQueue(): Promise<void> {
    if (this.isProcessingQueue) return;
    
    this.isProcessingQueue = true;
    
    try {
      // Processar por ordem de prioridade (1 -> 2 -> 3)
      for (const priority of [1, 2, 3]) {
        const queue = this.signalQueue.get(priority) || [];
        
        while (queue.length > 0) {
          const item = queue.shift();
          if (item) {
            try {
              await this.executeSignalProcessing(item.signal, item.userId);
              
              // Rate limiting entre processamentos
              await new Promise(resolve => setTimeout(resolve, 1000));
              
            } catch (error) {
              logger.error(`❌ Erro ao processar sinal prioridade ${priority}:`, error);
            }
          }
        }
      }
    } finally {
      this.isProcessingQueue = false;
      
      // Verificar se há mais itens na fila
      const totalItems = Array.from(this.signalQueue.values())
        .reduce((total, queue) => total + queue.length, 0);
      
      if (totalItems > 0) {
        // Reprocessar após um intervalo
        setTimeout(() => this.processSignalQueue(), 2000);
      }
    }
  }

  private async executeSignalProcessing(signal: CreateSignalDTO, userId: string): Promise<void> {
    try {
      logger.info(`🔄 Processando sinal para usuário ${userId}`);
      
      // Processar o sinal (usar método público)
      const internalSignal = {
        ...signal,
        userId: userId
      };
      
      await this.processSignal(internalSignal);
      
    } catch (error) {
      logger.error('Erro na execução do sinal:', error);
      throw error;
    }
  }

  async processSignal(signalData: CreateSignalDTO): Promise<{
    success: boolean;
    signalId?: string;
    usersProcessed: number;
    positionsOpened: number;
    errors: string[];
  }> {
    try {
      logger.info(`📡 Processando sinal: ${signalData.symbol} ${signalData.signalType}`);
      
      // 1. Criar sinal no banco de dados
      const signal = await this.tradingService.createSignal(signalData);
      
      // 2. Buscar usuários elegíveis
      const eligibleUsers = await this.getEligibleUsers(signal);
      
      let usersProcessed = 0;
      let positionsOpened = 0;
      const errors: string[] = [];
      
      // 3. Adicionar cada usuário à fila com prioridades
      for (const user of eligibleUsers) {
        try {
          await this.addToQueue(signalData, user.userId);
          usersProcessed++;
        } catch (error) {
          const errorMsg = `Erro ao adicionar usuário ${user.userId} à fila: ${error}`;
          errors.push(errorMsg);
          logger.error(errorMsg);
        }
      }
      
      return {
        success: errors.length === 0,
        signalId: signal.id,
        usersProcessed,
        positionsOpened, // Será atualizado durante o processamento da fila
        errors
      };
      
    } catch (error) {
      logger.error('❌ Erro ao processar sinal:', error);
      throw error;
    }
  }

  // Método para processar sinal individual do usuário (usado pela fila)
  private async processUserSignal(signalData: CreateSignalDTO, userId: string): Promise<void> {
    try {
      logger.info(`👤 Processando sinal para usuário ${userId}`);
      
      // 1. Buscar configuração do usuário
      const userConfig = await this.getUserTradingConfig(userId);
      if (!userConfig) {
        throw new Error(`Configuração do usuário ${userId} não encontrada`);
      }
      
      // 2. Validar usuário e risco
      const riskValidation = await this.validateUserRisk(userConfig);
      if (!riskValidation.canTrade) {
        logger.warn(`⚠️ Usuário ${userId} não pode operar: ${riskValidation.reason}`);
        return;
      }
      
      // 3. Buscar preço atual
      const currentPrice = await this.getCurrentPrice(userConfig.exchangeAccountId, signalData.symbol);
      
      // 4. Calcular posição
      const positionCalc = await this.calculatePosition(userConfig, {
        ...signalData,
        id: '',
        status: SignalStatus.PENDING,
        receivedAt: new Date(),
        leverage: signalData.leverage || userConfig.leverage,
        positionSizePercent: signalData.positionSizePercent || 30,
        notes: signalData.notes
      }, currentPrice, riskValidation.accountBalance);
      
      // 5. Criar posição temporária para executar ordem
      const tempSignal: TradingSignal = {
        ...signalData,
        id: '',
        status: SignalStatus.PENDING,
        receivedAt: new Date(),
        leverage: signalData.leverage || userConfig.leverage,
        positionSizePercent: signalData.positionSizePercent || 30,
        notes: signalData.notes
      };

      // 6. Criar posição no banco
      const position = await this.tradingService.createPosition({
        userId: userConfig.userId,
        exchangeAccountId: userConfig.exchangeAccountId,
        signalId: undefined,
        symbol: signalData.symbol,
        side: signalData.signalType === SignalType.LONG ? OrderSide.BUY : OrderSide.SELL,
        size: positionCalc.positionSizeBase,
        entryPrice: signalData.entryPrice || currentPrice,
        leverage: positionCalc.leverageToUse,
        stopLoss: positionCalc.stopLossPrice,
        takeProfit: positionCalc.takeProfitPrice
      });

      // 7. Executar ordem de entrada
      await this.executeEntryOrder(position, tempSignal, positionCalc);

      // 8. Configurar ordens de Stop Loss e Take Profit
      await this.setupRiskManagementOrders(position, positionCalc);

      // 9. Iniciar monitoramento da posição
      this.startPositionMonitoring(position.id);

      logger.info(`✅ Posição aberta para usuário ${userId}: ${position.symbol} ${position.side}`);

    } catch (error) {
      logger.error(`❌ Erro ao processar sinal para usuário ${userId}:`, error);
      throw error;
    }
  }

  // ========================================
  // PROCESSAMENTO INDIVIDUAL
  // ========================================

  private async processSignalForUser(
    signal: TradingSignal, 
    userConfig: UserTradingConfig
  ): Promise<{ positionOpened: boolean; positionId?: string }> {
    try {
      // 1. Validação de risco
      const riskValidation = await this.validateUserRisk(userConfig);
      if (!riskValidation.canTrade) {
        throw new Error(`Risco: ${riskValidation.reason}`);
      }

      // 2. Buscar preço atual
      const currentPrice = await this.getCurrentPrice(userConfig.exchangeAccountId, signal.symbol);
      if (currentPrice <= 0) {
        throw new Error('Preço atual não disponível');
      }

      // 3. Calcular posição com Stop Loss e Take Profit OBRIGATÓRIOS
      const positionCalc = await this.calculatePosition(
        userConfig, 
        signal, 
        currentPrice, 
        riskValidation.accountBalance
      );

      // 4. Criar posição no banco
      const position = await this.tradingService.createPosition({
        userId: userConfig.userId,
        exchangeAccountId: userConfig.exchangeAccountId,
        signalId: signal.id,
        symbol: signal.symbol,
        side: signal.signalType === SignalType.LONG ? OrderSide.BUY : OrderSide.SELL,
        size: positionCalc.positionSizeBase,
        entryPrice: signal.entryPrice || currentPrice,
        leverage: positionCalc.leverageToUse,
        stopLoss: positionCalc.stopLossPrice, // OBRIGATÓRIO
        takeProfit: positionCalc.takeProfitPrice // OBRIGATÓRIO
      });

      // 5. Executar ordem de entrada
      await this.executeEntryOrder(position, signal, positionCalc);

      // 6. Configurar ordens de Stop Loss e Take Profit
      await this.setupRiskManagementOrders(position, positionCalc);

      // 7. Iniciar monitoramento da posição
      this.startPositionMonitoring(position.id);

      logger.info(`✅ Posição aberta: ${signal.symbol} ${position.side} ${position.size} para usuário ${userConfig.userId}`);

      return { positionOpened: true, positionId: position.id };

    } catch (error) {
      logger.error('❌ Erro ao processar sinal para usuário:', error);
      throw error;
    }
  }

  // ========================================
  // VALIDAÇÃO DE RISCO E CONFIGURAÇÕES
  // ========================================

  private async validateUserRisk(userConfig: UserTradingConfig): Promise<RiskValidation> {
    try {
      // 1. Verificar limites diários
      const dailyLimits = await this.checkDailyLimits(userConfig.userId);
      
      // 2. Verificar saldo na exchange
      const balances = await this.exchangeService.getBalance(userConfig.exchangeAccountId);
      const usdtBalance = balances.find(b => b.asset === 'USDT')?.free || 0;

      // 3. Validações
      if (!dailyLimits.canTrade) {
        return {
          ...dailyLimits,
          canTrade: false,
          reason: 'Limites diários atingidos',
          accountBalance: usdtBalance
        };
      }

      if (usdtBalance < 10) {
        return {
          ...dailyLimits,
          canTrade: false,
          reason: 'Saldo insuficiente (mínimo $10 USDT)',
          accountBalance: usdtBalance
        };
      }

      if (dailyLimits.openPositions >= userConfig.maxConcurrentPositions) {
        return {
          ...dailyLimits,
          canTrade: false,
          reason: 'Máximo de posições simultâneas atingido',
          accountBalance: usdtBalance
        };
      }

      return {
        ...dailyLimits,
        canTrade: true,
        accountBalance: usdtBalance
      };

    } catch (error) {
      logger.error('❌ Erro na validação de risco:', error);
      return {
        canTrade: false,
        reason: 'Erro na validação de risco',
        dailyPnl: 0,
        dailyTrades: 0,
        openPositions: 0,
        accountBalance: 0
      };
    }
  }

  private async calculatePosition(
    userConfig: UserTradingConfig,
    signal: TradingSignal,
    currentPrice: number,
    accountBalance: number
  ): Promise<PositionCalculation> {
    try {
      // 1. Calcular tamanho da posição baseado no saldo
      const maxPositionUsd = Math.min(
        userConfig.maxPositionSizeUsd,
        accountBalance * 0.95 // Deixar 5% de margem
      );

      const positionSizePercent = signal.positionSizePercent || 30; // Default 30%
      const positionSizeUsd = maxPositionUsd * (positionSizePercent / 100);
      const positionSizeBase = positionSizeUsd / currentPrice;

      // 2. Determinar leverage a usar
      const signalLeverage = signal.leverage || 1;
      const userMaxLeverage = userConfig.leverage || 5;
      const leverageToUse = Math.min(signalLeverage, userMaxLeverage);

      // 3. Calcular Stop Loss e Take Profit OBRIGATÓRIOS
      let stopLossPrice: number;
      let takeProfitPrice: number;

      if (signal.stopLoss && signal.takeProfit1) {
        // Usar valores do sinal
        stopLossPrice = signal.stopLoss;
        takeProfitPrice = signal.takeProfit1;
      } else {
        // Usar configurações do usuário (OBRIGATÓRIO)
        const stopLossPercent = userConfig.stopLossPercent;
        const takeProfitPercent = userConfig.takeProfitPercent;

        if (signal.signalType === SignalType.LONG) {
          stopLossPrice = currentPrice * (1 - stopLossPercent / 100);
          takeProfitPrice = currentPrice * (1 + takeProfitPercent / 100);
        } else {
          stopLossPrice = currentPrice * (1 + stopLossPercent / 100);
          takeProfitPrice = currentPrice * (1 - takeProfitPercent / 100);
        }
      }

      // 4. Calcular Risk/Reward Ratio
      const riskRewardRatio = signal.signalType === SignalType.LONG
        ? Math.abs((takeProfitPrice - currentPrice) / (currentPrice - stopLossPrice))
        : Math.abs((currentPrice - takeProfitPrice) / (stopLossPrice - currentPrice));

      return {
        positionSizeUsd,
        positionSizeBase,
        leverageToUse,
        stopLossPrice,
        takeProfitPrice,
        riskRewardRatio
      };

    } catch (error) {
      logger.error('❌ Erro no cálculo da posição:', error);
      throw error;
    }
  }

  // ========================================
  // EXECUÇÃO DE ORDENS
  // ========================================

  private async executeEntryOrder(
    position: TradingPosition,
    signal: TradingSignal,
    positionCalc: PositionCalculation
  ): Promise<void> {
    try {
      // Determinar tipo de ordem
      const orderType = signal.entryPrice ? OrderType.LIMIT : OrderType.MARKET;
      const orderPrice = signal.entryPrice || undefined;

      // Executar ordem de entrada
      const order = await this.tradingService.createAndExecuteOrder({
        exchangeAccountId: position.exchangeAccountId,
        symbol: position.symbol,
        type: orderType,
        side: position.side,
        amount: position.size,
        price: orderPrice,
        positionId: position.id,
        signalId: signal.id
      });

      logger.info(`📈 Ordem de entrada executada: ${order.symbol} ${order.side} ${order.amount}`);

    } catch (error) {
      logger.error('❌ Erro na execução da ordem de entrada:', error);
      throw error;
    }
  }

  private async setupRiskManagementOrders(
    position: TradingPosition,
    positionCalc: PositionCalculation
  ): Promise<void> {
    try {
      // Stop Loss Order (OBRIGATÓRIA)
      const stopLossOrder = await this.tradingService.createAndExecuteOrder({
        exchangeAccountId: position.exchangeAccountId,
        symbol: position.symbol,
        type: OrderType.STOP_MARKET,
        side: position.side === OrderSide.BUY ? OrderSide.SELL : OrderSide.BUY,
        amount: position.size,
        price: positionCalc.stopLossPrice,
        positionId: position.id
      });

      // Take Profit Order (OBRIGATÓRIA)
      const takeProfitOrder = await this.tradingService.createAndExecuteOrder({
        exchangeAccountId: position.exchangeAccountId,
        symbol: position.symbol,
        type: OrderType.TAKE_PROFIT,
        side: position.side === OrderSide.BUY ? OrderSide.SELL : OrderSide.BUY,
        amount: position.size,
        price: positionCalc.takeProfitPrice,
        positionId: position.id
      });

      logger.info(`🛡️ Ordens de risco configuradas: SL ${positionCalc.stopLossPrice}, TP ${positionCalc.takeProfitPrice}`);

    } catch (error) {
      logger.error('❌ Erro na configuração das ordens de risco:', error);
      // Não fazer throw aqui para não impedir a abertura da posição
      // Apenas registrar o erro
    }
  }

  // ========================================
  // MONITORAMENTO EM TEMPO REAL
  // ========================================

  private async initializePositionMonitoring(): Promise<void> {
    try {
      // Buscar todas as posições abertas
      const openPositions = await this.getOpenPositions();
      
      for (const position of openPositions) {
        this.startPositionMonitoring(position.id);
      }

      logger.info(`📊 Monitoramento iniciado para ${openPositions.length} posições abertas`);
    } catch (error) {
      logger.error('❌ Erro ao inicializar monitoramento:', error);
    }
  }

  private startPositionMonitoring(positionId: string): void {
    // Evitar duplicar monitoramento
    if (this.activeMonitoring.has(positionId)) {
      return;
    }

    // Monitorar a cada 30 segundos
    const interval = setInterval(async () => {
      try {
        await this.monitorPosition(positionId);
      } catch (error) {
        logger.error(`❌ Erro no monitoramento da posição ${positionId}:`, error);
      }
    }, 30000);

    this.activeMonitoring.set(positionId, interval);
    logger.info(`📊 Monitoramento iniciado para posição ${positionId}`);
  }

  private async monitorPosition(positionId: string): Promise<void> {
    try {
      // Buscar posição atual
      const position = await this.getPosition(positionId);
      if (!position || position.status !== PositionStatus.OPEN) {
        this.stopPositionMonitoring(positionId);
        return;
      }

      // Atualizar PnL da posição
      await this.tradingService.updatePositionPnL(positionId);

      // Verificar se atingiu Stop Loss ou Take Profit via orders
      const orders = await this.getPositionOrders(positionId);
      const hasFilledStopOrTakeProfit = orders.some(order => 
        (order.type === OrderType.STOP_MARKET || order.type === OrderType.TAKE_PROFIT) &&
        order.status === OrderStatus.FILLED
      );

      if (hasFilledStopOrTakeProfit) {
        await this.closePosition(positionId, 'STOP_LOSS_OR_TAKE_PROFIT');
        return;
      }

      // Verificar sinais de fechamento
      await this.checkForCloseSignals(position);

    } catch (error) {
      logger.error(`❌ Erro no monitoramento da posição ${positionId}:`, error);
    }
  }

  private stopPositionMonitoring(positionId: string): void {
    const interval = this.activeMonitoring.get(positionId);
    if (interval) {
      clearInterval(interval);
      this.activeMonitoring.delete(positionId);
      logger.info(`📊 Monitoramento parado para posição ${positionId}`);
    }
  }

  // ========================================
  // FECHAMENTO E COMISSIONAMENTO
  // ========================================

  private async closePosition(positionId: string, reason: string): Promise<void> {
    try {
      // Fechar posição
      await this.tradingService.closePosition(positionId, reason);
      
      // Parar monitoramento
      this.stopPositionMonitoring(positionId);
      
      // Calcular e aplicar comissão
      await this.calculateAndApplyCommission(positionId);
      
      logger.info(`✅ Posição ${positionId} fechada: ${reason}`);

    } catch (error) {
      logger.error(`❌ Erro ao fechar posição ${positionId}:`, error);
      throw error;
    }
  }

  private async calculateAndApplyCommission(positionId: string): Promise<void> {
    try {
      const position = await this.getPosition(positionId);
      if (!position) return;

      // Buscar configurações de comissão do usuário
      const userPlan = await this.getUserPlan(position.userId);
      
      // Calcular comissão baseada no PnL realizado
      if (position.realizedPnlUsd > 0) {
        const commissionRate = userPlan === 'MONTHLY' ? 0.10 : 0.20; // 10% ou 20%
        const commissionAmount = position.realizedPnlUsd * commissionRate;
        
        // Aplicar comissão
        await this.applyCommission(position.userId, commissionAmount, positionId);
        
        logger.info(`💰 Comissão aplicada: $${commissionAmount.toFixed(2)} (${commissionRate * 100}%)`);
      }

    } catch (error) {
      logger.error('❌ Erro no cálculo da comissão:', error);
    }
  }

  // ========================================
  // CONFIGURAÇÕES ADMINISTRATIVAS
  // ========================================

  private async ensureAdminDefaultSettings(): Promise<void> {
    try {
      const query = `
        INSERT INTO admin_trading_defaults (
          default_stop_loss_percent,
          default_take_profit_percent,
          default_leverage,
          default_position_size_percent,
          max_concurrent_positions,
          daily_loss_limit_usd,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO NOTHING
      `;

      await DatabaseService.getInstance().query(query, [
        2.0,   // 2% Stop Loss default
        4.0,   // 4% Take Profit default
        5,     // 5x Leverage default
        30.0,  // 30% Position Size default
        3,     // 3 posições simultâneas
        500.0  // $500 limite diário
      ]);

      logger.info('⚙️ Configurações padrão do admin verificadas');
    } catch (error) {
      logger.error('❌ Erro ao verificar configurações padrão:', error);
    }
  }

  async updateAdminDefaults(settings: {
    stopLossPercent?: number;
    takeProfitPercent?: number;
    leverage?: number;
    positionSizePercent?: number;
    maxConcurrentPositions?: number;
    dailyLossLimitUsd?: number;
  }): Promise<void> {
    try {
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (settings.stopLossPercent !== undefined) {
        updates.push(`default_stop_loss_percent = $${paramIndex++}`);
        values.push(settings.stopLossPercent);
      }

      if (settings.takeProfitPercent !== undefined) {
        updates.push(`default_take_profit_percent = $${paramIndex++}`);
        values.push(settings.takeProfitPercent);
      }

      if (settings.leverage !== undefined) {
        updates.push(`default_leverage = $${paramIndex++}`);
        values.push(settings.leverage);
      }

      if (settings.positionSizePercent !== undefined) {
        updates.push(`default_position_size_percent = $${paramIndex++}`);
        values.push(settings.positionSizePercent);
      }

      if (settings.maxConcurrentPositions !== undefined) {
        updates.push(`max_concurrent_positions = $${paramIndex++}`);
        values.push(settings.maxConcurrentPositions);
      }

      if (settings.dailyLossLimitUsd !== undefined) {
        updates.push(`daily_loss_limit_usd = $${paramIndex++}`);
        values.push(settings.dailyLossLimitUsd);
      }

      if (updates.length === 0) return;

      updates.push('updated_at = CURRENT_TIMESTAMP');

      const query = `
        UPDATE admin_trading_defaults 
        SET ${updates.join(', ')}
        WHERE id = 1
      `;

      await DatabaseService.getInstance().query(query, values);
      
      logger.info('⚙️ Configurações padrão do admin atualizadas');
    } catch (error) {
      logger.error('❌ Erro ao atualizar configurações padrão:', error);
      throw error;
    }
  }

  // ========================================
  // MÉTODOS AUXILIARES
  // ========================================

  private async getUserTradingConfig(userId: string): Promise<UserTradingConfig | null> {
    try {
      const query = `
        SELECT 
          ts.user_id,
          uea.id as exchange_account_id,
          uea.exchange,
          ts.auto_trading_enabled,
          uea.max_position_size_usd,
          uea.daily_loss_limit_usd,
          COALESCE(ts.default_stop_loss_percent, ad.default_stop_loss_percent) as stop_loss_percent,
          COALESCE(ts.default_take_profit_percent, ad.default_take_profit_percent) as take_profit_percent,
          COALESCE(ts.default_leverage, ad.default_leverage) as leverage,
          COALESCE(ts.max_concurrent_positions, ad.max_concurrent_positions) as max_concurrent_positions
        FROM trading_settings ts
        JOIN user_exchange_accounts uea ON uea.user_id = ts.user_id
        CROSS JOIN admin_trading_defaults ad
        WHERE ts.user_id = $1
          AND ts.auto_trading_enabled = true
          AND uea.is_active = true
          AND uea.can_trade = true
        LIMIT 1
      `;
      
      const result = await DatabaseService.getInstance().query(query, [userId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      return {
        userId: row.user_id,
        exchangeAccountId: row.exchange_account_id,
        exchange: row.exchange,
        autoTradingEnabled: row.auto_trading_enabled,
        maxPositionSizeUsd: parseFloat(row.max_position_size_usd),
        dailyLossLimitUsd: parseFloat(row.daily_loss_limit_usd),
        stopLossPercent: parseFloat(row.stop_loss_percent),
        takeProfitPercent: parseFloat(row.take_profit_percent),
        leverage: parseInt(row.leverage),
        maxConcurrentPositions: parseInt(row.max_concurrent_positions)
      };
    } catch (error) {
      logger.error('❌ Erro ao buscar configuração do usuário:', error);
      return null;
    }
  }

  private async getEligibleUsers(signal: TradingSignal): Promise<UserTradingConfig[]> {
    try {
      const query = `
        SELECT 
          ts.user_id,
          uea.id as exchange_account_id,
          uea.exchange,
          ts.auto_trading_enabled,
          uea.max_position_size_usd,
          uea.daily_loss_limit_usd,
          COALESCE(ts.default_stop_loss_percent, ad.default_stop_loss_percent) as stop_loss_percent,
          COALESCE(ts.default_take_profit_percent, ad.default_take_profit_percent) as take_profit_percent,
          COALESCE(ts.default_leverage, ad.default_leverage) as leverage,
          COALESCE(ts.max_concurrent_positions, ad.max_concurrent_positions) as max_concurrent_positions
        FROM trading_settings ts
        JOIN user_exchange_accounts uea ON uea.user_id = ts.user_id
        CROSS JOIN admin_trading_defaults ad
        WHERE ts.auto_trading_enabled = true
          AND uea.is_active = true
          AND uea.can_trade = true
          AND (ts.allowed_symbols IS NULL OR $1 = ANY(ts.allowed_symbols))
          AND (ts.blocked_symbols IS NULL OR NOT ($1 = ANY(ts.blocked_symbols)))
          AND (ts.min_risk_reward_ratio <= $2 OR $2 IS NULL)
      `;
      
      const result = await DatabaseService.getInstance().query(query, [
        signal.symbol,
        signal.riskRewardRatio
      ]);
      
      return result.rows.map(row => ({
        userId: row.user_id,
        exchangeAccountId: row.exchange_account_id,
        exchange: row.exchange,
        autoTradingEnabled: row.auto_trading_enabled,
        maxPositionSizeUsd: parseFloat(row.max_position_size_usd),
        dailyLossLimitUsd: parseFloat(row.daily_loss_limit_usd),
        stopLossPercent: parseFloat(row.stop_loss_percent),
        takeProfitPercent: parseFloat(row.take_profit_percent),
        leverage: parseInt(row.leverage),
        maxConcurrentPositions: parseInt(row.max_concurrent_positions)
      }));
    } catch (error) {
      logger.error('❌ Erro ao buscar usuários elegíveis:', error);
      return [];
    }
  }

  private async getCurrentPrice(accountId: string, symbol: string): Promise<number> {
    try {
      const exchange = await this.exchangeService.getExchangeConnection(accountId);
      const ticker = await exchange.fetchTicker(symbol);
      return ticker.last || ticker.close || 0;
    } catch (error) {
      logger.error('❌ Erro ao obter preço atual:', error);
      return 0;
    }
  }

  private async checkDailyLimits(userId: string): Promise<{
    canTrade: boolean;
    dailyPnl: number;
    dailyTrades: number;
    openPositions: number;
  }> {
    try {
      const query = `SELECT * FROM check_daily_trading_limits($1)`;
      const result = await DatabaseService.getInstance().query(query, [userId]);
      return result.rows[0] || { canTrade: false, dailyPnl: 0, dailyTrades: 0, openPositions: 0 };
    } catch (error) {
      logger.error('❌ Erro ao verificar limites diários:', error);
      return { canTrade: false, dailyPnl: 0, dailyTrades: 0, openPositions: 0 };
    }
  }

  private async getOpenPositions(): Promise<TradingPosition[]> {
    try {
      const query = `SELECT * FROM trading_positions WHERE status = 'OPEN'`;
      const result = await DatabaseService.getInstance().query(query);
      return result.rows.map(row => this.formatPosition(row));
    } catch (error) {
      logger.error('❌ Erro ao buscar posições abertas:', error);
      return [];
    }
  }

  private async getPosition(positionId: string): Promise<TradingPosition | null> {
    try {
      const query = `SELECT * FROM trading_positions WHERE id = $1`;
      const result = await DatabaseService.getInstance().query(query, [positionId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.formatPosition(result.rows[0]);
    } catch (error) {
      logger.error('❌ Erro ao buscar posição:', error);
      return null;
    }
  }

  private async getPositionOrders(positionId: string): Promise<TradingOrder[]> {
    try {
      const query = `SELECT * FROM trading_orders WHERE position_id = $1`;
      const result = await DatabaseService.getInstance().query(query, [positionId]);
      return result.rows.map(row => this.formatOrder(row));
    } catch (error) {
      logger.error('❌ Erro ao buscar ordens da posição:', error);
      return [];
    }
  }

  private async checkForCloseSignals(position: TradingPosition): Promise<void> {
    try {
      // Verificar se há sinais de fechamento para esta posição
      const closeSignalType = position.side === OrderSide.BUY ? SignalType.CLOSE_LONG : SignalType.CLOSE_SHORT;
      
      const query = `
        SELECT * FROM trading_signals 
        WHERE symbol = $1 
          AND signal_type = $2 
          AND status = 'PENDING'
          AND created_at > $3
        ORDER BY created_at DESC
        LIMIT 1
      `;
      
      const result = await DatabaseService.getInstance().query(query, [
        position.symbol,
        closeSignalType,
        position.openedAt
      ]);
      
      if (result.rows.length > 0) {
        await this.closePosition(position.id, 'CLOSE_SIGNAL');
      }
    } catch (error) {
      logger.error('❌ Erro ao verificar sinais de fechamento:', error);
    }
  }

  private async getUserPlan(userId: string): Promise<string> {
    try {
      const query = `SELECT plan_type FROM user_subscriptions WHERE user_id = $1 AND is_active = true`;
      const result = await DatabaseService.getInstance().query(query, [userId]);
      return result.rows[0]?.plan_type || 'MONTHLY';
    } catch (error) {
      logger.error('❌ Erro ao buscar plano do usuário:', error);
      return 'MONTHLY';
    }
  }

  private async applyCommission(userId: string, amount: number, positionId: string): Promise<void> {
    try {
      const query = `
        INSERT INTO commission_transactions (
          user_id, position_id, amount_usd, commission_type, 
          created_at, processed_at
        ) VALUES ($1, $2, $3, 'TRADING_SUCCESS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;
      
      await DatabaseService.getInstance().query(query, [userId, positionId, amount]);
    } catch (error) {
      logger.error('❌ Erro ao aplicar comissão:', error);
    }
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
  // SHUTDOWN GRACEFUL
  // ========================================

  async shutdown(): Promise<void> {
    try {
      logger.info('🛑 Iniciando shutdown do Trading Orchestrator');
      
      this.isRunning = false;
      
      // Parar todos os monitoramentos
      for (const [positionId, interval] of this.activeMonitoring) {
        clearInterval(interval);
        logger.info(`📊 Monitoramento parado para posição ${positionId}`);
      }
      
      this.activeMonitoring.clear();
      
      logger.info('✅ Trading Orchestrator finalizado');
    } catch (error) {
      logger.error('❌ Erro no shutdown do Trading Orchestrator:', error);
    }
  }
}

export default TradingOrchestrator;
