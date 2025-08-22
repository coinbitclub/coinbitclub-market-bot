// ========================================
// MARKETBOT - TRADING QUEUE SERVICE SIMPLIFICADO
// Sistema de fila inteligente com prioridades (versão simplificada)
// ========================================

import { Pool } from 'pg';
import { DatabaseService } from './database.service';
import { TradingConfigurationService } from './trading-configuration.service';
import { EventEmitter } from 'events';

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

export class TradingQueueService extends EventEmitter {
  private static instance: TradingQueueService;
  private db: Pool;
  private configService: TradingConfigurationService;
  private isProcessing: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private exchangeRateLimits: Map<string, { count: number; resetTime: number }> = new Map();

  constructor() {
    super();
    const dbService = DatabaseService.getInstance();
    this.db = dbService.getPool();
    this.configService = TradingConfigurationService.getInstance();
    this.startProcessing();
  }

  static getInstance(): TradingQueueService {
    if (!TradingQueueService.instance) {
      TradingQueueService.instance = new TradingQueueService();
    }
    return TradingQueueService.instance;
  }

  // ========================================
  // PROCESSAMENTO AUTOMÁTICO
  // ========================================

  private startProcessing(): void {
    // Processar fila a cada 5 segundos
    this.processingInterval = setInterval(async () => {
      if (!this.isProcessing) {
        await this.processQueue();
      }
    }, 5000);

    console.log('✅ Trading Queue Service iniciado');
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;
    
    try {
      // Processar por ordem de prioridade
      await this.processTradesByPriority('HIGH', 3);
      await this.processTradesByPriority('MEDIUM', 2);
      await this.processTradesByPriority('LOW', 1);
      
    } catch (error) {
      console.error('❌ Erro no processamento da fila:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processTradesByPriority(priority: 'HIGH' | 'MEDIUM' | 'LOW', maxConcurrent: number): Promise<void> {
    const trades = await this.db.query(`
      SELECT * FROM trading_queue 
      WHERE status = 'QUEUED' 
      AND priority = $1 
      ORDER BY created_at ASC 
      LIMIT $2
    `, [priority, maxConcurrent]);

    const promises = trades.rows.map(trade => this.processTrade(trade));
    await Promise.allSettled(promises);
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
          estimated_execution_time, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      `, [
        tradeId, queuedTrade.user_id, queuedTrade.symbol, queuedTrade.side,
        queuedTrade.leverage, queuedTrade.position_size_percent,
        queuedTrade.stop_loss_percent, queuedTrade.take_profit_percent,
        queuedTrade.amount_usd, queuedTrade.priority, queuedTrade.environment,
        queuedTrade.exchange, 'QUEUED', 0, 3, estimatedTime, new Date()
      ]);

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

  // ========================================
  // PROCESSAMENTO DE TRADES
  // ========================================

  private async processTrade(trade: any): Promise<void> {
    const startTime = new Date();

    try {
      console.log(`🔄 Processando trade ${trade.id} (${trade.priority} priority)`);

      // Atualizar status no banco
      await this.updateTradeStatus(trade.id, 'PROCESSING', undefined, startTime);

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

      // Simular execução do trade
      await this.executeTradeOnExchange(trade);

      // Marcar como concluído
      await this.updateTradeStatus(trade.id, 'COMPLETED', undefined, undefined, new Date());

      console.log(`✅ Trade ${trade.id} executado com sucesso`);
      this.emit('trade_completed', trade);

    } catch (error: any) {
      console.error(`❌ Erro ao processar trade ${trade.id}:`, error);
      
      // Incrementar tentativas
      const newAttempts = trade.attempts + 1;
      
      if (newAttempts >= trade.max_attempts) {
        // Marcar como falha definitiva
        await this.updateTradeStatus(trade.id, 'FAILED', error.message);
        this.emit('trade_failed', { trade, error });
      } else {
        // Reenviar para fila com delay
        await this.updateTradeStatus(trade.id, 'QUEUED', error.message);
        await this.db.query(`
          UPDATE trading_queue 
          SET attempts = $2, updated_at = NOW()
          WHERE id = $1
        `, [trade.id, newAttempts]);
      }
    }
  }

  // ========================================
  // EXECUÇÃO NA EXCHANGE (SIMULAÇÃO)
  // ========================================

  private async executeTradeOnExchange(trade: any): Promise<void> {
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
        exchange, environment, queue_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'OPEN', $9, $10, $11, NOW())
    `, [
      trade.user_id, trade.symbol, trade.side, trade.leverage,
      trade.amount_usd, 50000, // Preço de entrada simulado
      trade.stop_loss_percent, trade.take_profit_percent,
      trade.exchange, trade.environment, trade.id
    ]);

    console.log(`📈 Posição criada para trade ${trade.id}`);
  }

  private getExchangeExecutionDelay(exchange: string): number {
    const delays: { [key: string]: number } = {
      'binance': 1000,
      'bybit': 1500,
      'okx': 2000
    };
    return delays[exchange] || 1000;
  }

  // ========================================
  // RATE LIMITING POR EXCHANGE
  // ========================================

  private async checkExchangeRateLimit(exchange: string): Promise<void> {
    const now = Date.now();
    const limit = await this.configService.getTradingConfig();
    const maxRequests = limit.rate_limit_per_minute;

    let exchangeLimit = this.exchangeRateLimits.get(exchange);
    
    if (!exchangeLimit || now > exchangeLimit.resetTime) {
      // Resetar contador a cada minuto
      exchangeLimit = {
        count: 0,
        resetTime: now + 60000 // 1 minuto
      };
      this.exchangeRateLimits.set(exchange, exchangeLimit);
    }

    if (exchangeLimit.count >= maxRequests) {
      throw new Error(`Rate limit atingido para ${exchange}. Tente novamente em 1 minuto.`);
    }

    exchangeLimit.count++;
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
    const queuedCount = await this.db.query(`
      SELECT COUNT(*) as count FROM trading_queue WHERE status = 'QUEUED'
    `);
    
    const queueLength = parseInt(queuedCount.rows[0].count);
    const processingTime = 2000; // 2 segundos médio por trade
    
    let priorityMultiplier = 1;
    if (priority === 'MEDIUM') priorityMultiplier = 2;
    if (priority === 'LOW') priorityMultiplier = 3;
    
    const estimatedMs = (queueLength * processingTime) * priorityMultiplier;
    const estimatedTime = new Date();
    estimatedTime.setMilliseconds(estimatedTime.getMilliseconds() + estimatedMs);
    
    return estimatedTime;
  }

  // ========================================
  // CANCELAMENTO DE TRADES
  // ========================================

  async cancelTrade(tradeId: string, userId: string, reason: string): Promise<boolean> {
    try {
      const result = await this.db.query(`
        UPDATE trading_queue 
        SET status = 'CANCELLED', error_message = $3, updated_at = NOW()
        WHERE id = $1 
        AND user_id = $2 
        AND status IN ('QUEUED', 'PROCESSING')
      `, [tradeId, userId, reason]);

      if (result.rowCount && result.rowCount > 0) {
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

  // ========================================
  // LIMPEZA E MANUTENÇÃO
  // ========================================

  async cleanupOldTrades(olderThanHours: number = 24): Promise<number> {
    try {
      const result = await this.db.query(`
        DELETE FROM trading_queue 
        WHERE status IN ('COMPLETED', 'FAILED', 'CANCELLED')
        AND (completed_at < NOW() - INTERVAL '${olderThanHours} hours'
        OR (completed_at IS NULL AND created_at < NOW() - INTERVAL '${olderThanHours} hours'))
      `);

      const deletedCount = result.rowCount || 0;
      console.log(`🧹 ${deletedCount} trades antigos removidos da fila`);
      return deletedCount;
    } catch (error) {
      console.error('❌ Erro na limpeza de trades antigos:', error);
      return 0;
    }
  }

  // ========================================
  // DESTRUIÇÃO
  // ========================================

  destroy(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.removeAllListeners();
    console.log('🔄 Trading Queue Service parado');
  }
}

export default TradingQueueService;
