// ========================================
// MARKETBOT - TRADING QUEUE SERVICE
// Sistema de fila inteligente com prioridades
// ========================================

import { Pool } from 'pg';
import { DatabaseService } from './database.service';
import { TradingConfigurationService } from './trading-configuration.service';
import { EventEmitter } from 'events';
import * as Queue from 'bull';
import { Redis } from 'ioredis';

export interface QueuedTrade {
  id: string;
  user_id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  leverage: number;
  position_size_percent: number;
  stop_loss_percent: number;
  take_profit_percent: number;
  amount_usd: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  environment: 'MAINNET' | 'TESTNET';
  exchange: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  attempts: number;
  max_attempts: number;
  error_message?: string;
  created_at: Date;
  started_at?: Date;
  completed_at?: Date;
  estimated_execution_time: Date;
}

export interface QueueStatus {
  total_queued: number;
  high_priority: number;
  medium_priority: number;
  low_priority: number;
  processing: number;
  failed: number;
  average_wait_time_seconds: number;
  estimated_completion_time: Date;
}

export interface ExchangeRateLimit {
  exchange: string;
  requests_per_minute: number;
  current_usage: number;
  reset_time: Date;
  is_throttled: boolean;
}

export class TradingQueueService extends EventEmitter {
  private static instance: TradingQueueService;
  private db: Pool;
  private configService: TradingConfigurationService;
  private redis: Redis;
  private tradingQueue: Queue.Queue;
  private isProcessing: boolean = false;
  private processingIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    super();
    const dbService = DatabaseService.getInstance();
    this.db = dbService.getPool();
    this.configService = TradingConfigurationService.getInstance();
    this.initializeRedis();
    this.initializeQueue();
  }

  static getInstance(): TradingQueueService {
    if (!TradingQueueService.instance) {
      TradingQueueService.instance = new TradingQueueService();
    }
    return TradingQueueService.instance;
  }

  // ========================================
  // INICIALIZAÇÃO
  // ========================================

  private initializeRedis(): void {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3
    });

    this.redis.on('connect', () => {
      console.log('✅ Redis conectado para trading queue');
    });

    this.redis.on('error', (error) => {
      console.error('❌ Erro no Redis:', error);
    });
  }

  private initializeQueue(): void {
    this.tradingQueue = new Queue('trading operations', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
      },
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      }
    });

    // Configurar processamento por prioridade
    this.tradingQueue.process('HIGH', 5, this.processHighPriorityTrade.bind(this));
    this.tradingQueue.process('MEDIUM', 3, this.processMediumPriorityTrade.bind(this));
    this.tradingQueue.process('LOW', 1, this.processLowPriorityTrade.bind(this));

    // Eventos da fila
    this.tradingQueue.on('completed', (job) => {
      console.log(`✅ Trade ${job.id} concluído`);
      this.emit('trade_completed', job.data);
    });

    this.tradingQueue.on('failed', (job, error) => {
      console.error(`❌ Trade ${job.id} falhou:`, error);
      this.emit('trade_failed', { job: job.data, error });
    });

    console.log('✅ Trading Queue inicializada');
  }

  // ========================================
  // ADICIONAR TRADES À FILA
  // ========================================

  async queueTrade(tradeData: Omit<QueuedTrade, 'id' | 'status' | 'attempts' | 'created_at' | 'estimated_execution_time'>): Promise<string> {
    try {
      // Gerar ID único
      const tradeId = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Calcular prioridade
      const priority = await this.calculateTradePriority(tradeData);
      
      // Estimar tempo de execução
      const estimatedTime = await this.estimateExecutionTime(priority);
      
      // Criar objeto de trade completo
      const queuedTrade: QueuedTrade = {
        id: tradeId,
        ...tradeData,
        priority,
        status: 'QUEUED',
        attempts: 0,
        max_attempts: 3,
        created_at: new Date(),
        estimated_execution_time: estimatedTime
      };

      // Salvar no banco
      await this.db.query(`
        INSERT INTO trading_queue (
          id, user_id, symbol, side, leverage, position_size_percent,
          stop_loss_percent, take_profit_percent, amount_usd, priority,
          environment, exchange, status, attempts, max_attempts,
          estimated_execution_time
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `, [
        tradeId, queuedTrade.user_id, queuedTrade.symbol, queuedTrade.side,
        queuedTrade.leverage, queuedTrade.position_size_percent,
        queuedTrade.stop_loss_percent, queuedTrade.take_profit_percent,
        queuedTrade.amount_usd, queuedTrade.priority, queuedTrade.environment,
        queuedTrade.exchange, 'QUEUED', 0, 3, estimatedTime
      ]);

      // Adicionar à fila Redis com prioridade
      const jobPriority = this.getPriorityWeight(priority);
      await this.tradingQueue.add(
        priority, 
        queuedTrade, 
        { 
          priority: jobPriority,
          delay: this.calculateDelay(priority)
        }
      );

      console.log(`📊 Trade ${tradeId} adicionado à fila com prioridade ${priority}`);
      
      this.emit('trade_queued', queuedTrade);
      
      return tradeId;

    } catch (error) {
      console.error('❌ Erro ao adicionar trade à fila:', error);
      throw error;
    }
  }

  // ========================================
  // CÁLCULO DE PRIORIDADES
  // ========================================

  private async calculateTradePriority(tradeData: any): Promise<'HIGH' | 'MEDIUM' | 'LOW'> {
    // PRIORIDADE 1 (HIGH): MAINNET + Saldo Real
    if (tradeData.environment === 'MAINNET') {
      const userBalance = await this.db.query(`
        SELECT account_balance_usd FROM users WHERE id = $1
      `, [tradeData.user_id]);

      const balance = parseFloat(userBalance.rows[0]?.account_balance_usd || '0');
      
      if (balance >= tradeData.amount_usd) {
        return 'HIGH';
      } else {
        // PRIORIDADE 2 (MEDIUM): MAINNET + Saldo Admin
        return 'MEDIUM';
      }
    }

    // PRIORIDADE 3 (LOW): TESTNET + Qualquer usuário
    return 'LOW';
  }

  private getPriorityWeight(priority: 'HIGH' | 'MEDIUM' | 'LOW'): number {
    switch (priority) {
      case 'HIGH': return 100;
      case 'MEDIUM': return 50;
      case 'LOW': return 10;
      default: return 10;
    }
  }

  private calculateDelay(priority: 'HIGH' | 'MEDIUM' | 'LOW'): number {
    switch (priority) {
      case 'HIGH': return 0; // Imediato
      case 'MEDIUM': return 5000; // 5 segundos
      case 'LOW': return 15000; // 15 segundos
      default: return 15000;
    }
  }

  // ========================================
  // PROCESSAMENTO DE TRADES
  // ========================================

  private async processHighPriorityTrade(job: Queue.Job<QueuedTrade>): Promise<void> {
    return this.processTrade(job, 'HIGH');
  }

  private async processMediumPriorityTrade(job: Queue.Job<QueuedTrade>): Promise<void> {
    return this.processTrade(job, 'MEDIUM');
  }

  private async processLowPriorityTrade(job: Queue.Job<QueuedTrade>): Promise<void> {
    return this.processTrade(job, 'LOW');
  }

  private async processTrade(job: Queue.Job<QueuedTrade>, priority: string): Promise<void> {
    const trade = job.data;
    const startTime = new Date();

    try {
      console.log(`🔄 Processando trade ${trade.id} (${priority} priority)`);

      // Atualizar status no banco
      await this.updateTradeStatus(trade.id, 'PROCESSING', null, startTime);

      // Verificar rate limiting da exchange
      await this.checkExchangeRateLimit(trade.exchange);

      // Validar trade novamente antes de executar
      const validation = await this.configService.validateTradeRequest(
        trade.user_id,
        trade.symbol,
        trade.leverage,
        trade.position_size_percent,
        trade.stop_loss_percent,
        trade.take_profit_percent
      );

      if (!validation.valid) {
        throw new Error(`Validação falhou: ${validation.errors.join(', ')}`);
      }

      // Simular execução do trade (aqui seria integração real com exchange)
      await this.executeTradeOnExchange(trade);

      // Marcar como concluído
      await this.updateTradeStatus(trade.id, 'COMPLETED', null, null, new Date());

      console.log(`✅ Trade ${trade.id} executado com sucesso`);

    } catch (error) {
      console.error(`❌ Erro ao processar trade ${trade.id}:`, error);
      
      // Incrementar tentativas
      const newAttempts = trade.attempts + 1;
      
      if (newAttempts >= trade.max_attempts) {
        // Marcar como falha definitiva
        await this.updateTradeStatus(trade.id, 'FAILED', error.message);
      } else {
        // Reenviar para fila com delay
        await this.updateTradeStatus(trade.id, 'QUEUED', error.message);
        await this.requeueTrade(trade, newAttempts);
      }

      throw error;
    }
  }

  // ========================================
  // EXECUÇÃO NA EXCHANGE (SIMULAÇÃO)
  // ========================================

  private async executeTradeOnExchange(trade: QueuedTrade): Promise<void> {
    // Simular delay de execução baseado na exchange
    const executionDelay = this.getExchangeExecutionDelay(trade.exchange);
    await new Promise(resolve => setTimeout(resolve, executionDelay));

    // Simular possibilidade de falha (5% chance)
    if (Math.random() < 0.05) {
      throw new Error('Falha simulada na execução da exchange');
    }

    // Criar posição no banco
    await this.db.query(`
      INSERT INTO trading_positions (
        user_id, symbol, side, leverage, amount_usd,
        entry_price, stop_loss, take_profit, status,
        exchange, environment, queue_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'OPEN', $9, $10, $11)
    `, [
      trade.user_id, trade.symbol, trade.side, trade.leverage,
      trade.amount_usd, 50000, // Preço de entrada simulado
      trade.stop_loss_percent, trade.take_profit_percent,
      trade.exchange, trade.environment, trade.id
    ]);

    console.log(`📈 Posição criada para trade ${trade.id}`);
  }

  private getExchangeExecutionDelay(exchange: string): number {
    const delays = {
      'binance': 1000,
      'bybit': 1500,
      'okx': 2000,
      'default': 1000
    };
    return delays[exchange] || delays.default;
  }

  // ========================================
  // RATE LIMITING POR EXCHANGE
  // ========================================

  private async checkExchangeRateLimit(exchange: string): Promise<void> {
    const key = `rate_limit:${exchange}`;
    const current = await this.redis.get(key);
    
    const config = await this.configService.getTradingConfig();
    const limit = config.rate_limit_per_minute;

    if (current && parseInt(current) >= limit) {
      throw new Error(`Rate limit atingido para ${exchange}. Tente novamente em 1 minuto.`);
    }

    // Incrementar contador
    await this.redis.incr(key);
    await this.redis.expire(key, 60); // 1 minuto
  }

  // ========================================
  // GERENCIAMENTO DE STATUS
  // ========================================

  private async updateTradeStatus(
    tradeId: string, 
    status: QueuedTrade['status'], 
    errorMessage?: string,
    startedAt?: Date,
    completedAt?: Date
  ): Promise<void> {
    const updates: string[] = ['status = $2'];
    const values: any[] = [tradeId, status];
    let paramCount = 2;

    if (errorMessage) {
      updates.push(`error_message = $${++paramCount}`);
      values.push(errorMessage);
    }

    if (startedAt) {
      updates.push(`started_at = $${++paramCount}`);
      values.push(startedAt);
    }

    if (completedAt) {
      updates.push(`completed_at = $${++paramCount}`);
      values.push(completedAt);
    }

    await this.db.query(`
      UPDATE trading_queue 
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $1
    `, values);
  }

  private async requeueTrade(trade: QueuedTrade, attempts: number): Promise<void> {
    const delay = Math.pow(2, attempts) * 1000; // Exponential backoff
    
    await this.db.query(`
      UPDATE trading_queue 
      SET attempts = $2, updated_at = NOW()
      WHERE id = $1
    `, [trade.id, attempts]);

    await this.tradingQueue.add(
      trade.priority,
      { ...trade, attempts },
      { 
        priority: this.getPriorityWeight(trade.priority),
        delay
      }
    );
  }

  // ========================================
  // ESTATÍSTICAS E MONITORAMENTO
  // ========================================

  async getQueueStatus(): Promise<QueueStatus> {
    try {
      const stats = await this.db.query(`
        SELECT 
          status,
          priority,
          COUNT(*) as count,
          AVG(EXTRACT(EPOCH FROM (COALESCE(started_at, NOW()) - created_at))) as avg_wait_time
        FROM trading_queue 
        WHERE created_at > NOW() - INTERVAL '1 hour'
        GROUP BY status, priority
      `);

      let totalQueued = 0;
      let highPriority = 0;
      let mediumPriority = 0;
      let lowPriority = 0;
      let processing = 0;
      let failed = 0;
      let avgWaitTime = 0;

      stats.rows.forEach(row => {
        const count = parseInt(row.count);
        
        if (row.status === 'QUEUED') {
          totalQueued += count;
          if (row.priority === 'HIGH') highPriority += count;
          else if (row.priority === 'MEDIUM') mediumPriority += count;
          else if (row.priority === 'LOW') lowPriority += count;
        } else if (row.status === 'PROCESSING') {
          processing += count;
        } else if (row.status === 'FAILED') {
          failed += count;
        }

        if (row.avg_wait_time) {
          avgWaitTime = Math.max(avgWaitTime, parseFloat(row.avg_wait_time));
        }
      });

      const estimatedCompletion = new Date();
      estimatedCompletion.setSeconds(estimatedCompletion.getSeconds() + avgWaitTime + (totalQueued * 2));

      return {
        total_queued: totalQueued,
        high_priority: highPriority,
        medium_priority: mediumPriority,
        low_priority: lowPriority,
        processing,
        failed,
        average_wait_time_seconds: Math.round(avgWaitTime),
        estimated_completion_time: estimatedCompletion
      };

    } catch (error) {
      console.error('❌ Erro ao buscar status da fila:', error);
      throw error;
    }
  }

  async estimateExecutionTime(priority: 'HIGH' | 'MEDIUM' | 'LOW'): Promise<Date> {
    const queueLength = await this.tradingQueue.count();
    const baseDelay = this.calculateDelay(priority);
    const processingTime = 2000; // 2 segundos médio por trade
    
    const estimatedMs = baseDelay + (queueLength * processingTime);
    const estimatedTime = new Date();
    estimatedTime.setMilliseconds(estimatedTime.getMilliseconds() + estimatedMs);
    
    return estimatedTime;
  }

  // ========================================
  // LIMPEZA E MANUTENÇÃO
  // ========================================

  async cleanupOldTrades(olderThanHours: number = 24): Promise<number> {
    try {
      const result = await this.db.query(`
        DELETE FROM trading_queue 
        WHERE status IN ('COMPLETED', 'FAILED', 'CANCELLED')
        AND completed_at < NOW() - INTERVAL '${olderThanHours} hours'
      `);

      console.log(`🧹 ${result.rowCount} trades antigos removidos da fila`);
      return result.rowCount;
    } catch (error) {
      console.error('❌ Erro na limpeza de trades antigos:', error);
      return 0;
    }
  }

  // ========================================
  // CANCELAMENTO DE TRADES
  // ========================================

  async cancelTrade(tradeId: string, userId: string, reason: string): Promise<boolean> {
    try {
      // Verificar se o trade pertence ao usuário e está em status cancelável
      const result = await this.db.query(`
        UPDATE trading_queue 
        SET status = 'CANCELLED', error_message = $3, updated_at = NOW()
        WHERE id = $1 
        AND user_id = $2 
        AND status IN ('QUEUED', 'PROCESSING')
      `, [tradeId, userId, reason]);

      if (result.rowCount > 0) {
        // Remover da fila Redis se ainda não foi processado
        const jobs = await this.tradingQueue.getJobs(['waiting', 'delayed']);
        const job = jobs.find(j => j.data.id === tradeId);
        if (job) {
          await job.remove();
        }

        console.log(`❌ Trade ${tradeId} cancelado: ${reason}`);
        this.emit('trade_cancelled', { tradeId, userId, reason });
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Erro ao cancelar trade:', error);
      return false;
    }
  }
}

export default TradingQueueService;
