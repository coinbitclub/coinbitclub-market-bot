// ========================================
// MARKETBOT - ADMIN CONTROLLER
// Controlador para configurações administrativas de trading
// FASE 5 - Sistema de administração
// ========================================

import { Request, Response } from 'express';
import TradingOrchestrator from '../services/trading-orchestrator.service.js';
import { DatabaseService } from '../services/database.service.js';
import { logger } from '../utils/logger.js';

export class AdminController {
  private tradingOrchestrator: TradingOrchestrator;

  constructor() {
    this.tradingOrchestrator = TradingOrchestrator.getInstance();
  }

  // ========================================
  // CONFIGURAÇÕES PADRÃO DO ADMIN
  // ========================================

  async getAdminDefaults(req: Request, res: Response): Promise<void> {
    try {
      const query = `
        SELECT 
          default_stop_loss_percent,
          default_take_profit_percent,
          default_leverage,
          default_position_size_percent,
          max_concurrent_positions,
          daily_loss_limit_usd,
          max_daily_trades,
          min_risk_reward_ratio,
          max_allowed_leverage,
          trading_start_hour,
          trading_end_hour,
          trade_on_weekends,
          auto_close_expired_signals,
          signal_expiry_minutes,
          position_monitoring_interval_seconds,
          created_at,
          updated_at
        FROM admin_trading_defaults 
        WHERE id = 1
      `;

      const result = await DatabaseService.getInstance().query(query);
      
      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Configurações padrão não encontradas'
        });
        return;
      }

      const settings = result.rows[0];

      res.json({
        success: true,
        data: {
          stopLossPercent: parseFloat(settings.default_stop_loss_percent),
          takeProfitPercent: parseFloat(settings.default_take_profit_percent),
          leverage: parseInt(settings.default_leverage),
          positionSizePercent: parseFloat(settings.default_position_size_percent),
          maxConcurrentPositions: parseInt(settings.max_concurrent_positions),
          dailyLossLimitUsd: parseFloat(settings.daily_loss_limit_usd),
          maxDailyTrades: parseInt(settings.max_daily_trades),
          minRiskRewardRatio: parseFloat(settings.min_risk_reward_ratio),
          maxAllowedLeverage: parseInt(settings.max_allowed_leverage),
          tradingStartHour: parseInt(settings.trading_start_hour),
          tradingEndHour: parseInt(settings.trading_end_hour),
          tradeOnWeekends: settings.trade_on_weekends,
          autoCloseExpiredSignals: settings.auto_close_expired_signals,
          signalExpiryMinutes: parseInt(settings.signal_expiry_minutes),
          positionMonitoringIntervalSeconds: parseInt(settings.position_monitoring_interval_seconds),
          createdAt: settings.created_at,
          updatedAt: settings.updated_at
        },
        message: 'Configurações padrão obtidas com sucesso'
      });

    } catch (error) {
      logger.error('Erro ao obter configurações padrão:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  async updateAdminDefaults(req: Request, res: Response): Promise<void> {
    try {
      const {
        stopLossPercent,
        takeProfitPercent,
        leverage,
        positionSizePercent,
        maxConcurrentPositions,
        dailyLossLimitUsd,
        maxDailyTrades,
        minRiskRewardRatio,
        maxAllowedLeverage,
        tradingStartHour,
        tradingEndHour,
        tradeOnWeekends,
        autoCloseExpiredSignals,
        signalExpiryMinutes,
        positionMonitoringIntervalSeconds
      } = req.body;

      // Validações
      const validations = [
        { field: 'stopLossPercent', value: stopLossPercent, min: 0.1, max: 20 },
        { field: 'takeProfitPercent', value: takeProfitPercent, min: 0.1, max: 50 },
        { field: 'leverage', value: leverage, min: 1, max: 100 },
        { field: 'positionSizePercent', value: positionSizePercent, min: 1, max: 100 },
        { field: 'maxConcurrentPositions', value: maxConcurrentPositions, min: 1, max: 20 },
        { field: 'dailyLossLimitUsd', value: dailyLossLimitUsd, min: 10, max: 10000 },
        { field: 'maxDailyTrades', value: maxDailyTrades, min: 1, max: 100 },
        { field: 'minRiskRewardRatio', value: minRiskRewardRatio, min: 0.1, max: 10 },
        { field: 'maxAllowedLeverage', value: maxAllowedLeverage, min: 1, max: 100 },
        { field: 'tradingStartHour', value: tradingStartHour, min: 0, max: 23 },
        { field: 'tradingEndHour', value: tradingEndHour, min: 0, max: 24 },
        { field: 'signalExpiryMinutes', value: signalExpiryMinutes, min: 1, max: 1440 },
        { field: 'positionMonitoringIntervalSeconds', value: positionMonitoringIntervalSeconds, min: 10, max: 300 }
      ];

      for (const validation of validations) {
        if (validation.value !== undefined) {
          if (validation.value < validation.min || validation.value > validation.max) {
            res.status(400).json({
              success: false,
              message: `${validation.field} deve estar entre ${validation.min} e ${validation.max}`
            });
            return;
          }
        }
      }

      // Construir query de update dinâmica
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      const fieldsMap = {
        stopLossPercent: 'default_stop_loss_percent',
        takeProfitPercent: 'default_take_profit_percent',
        leverage: 'default_leverage',
        positionSizePercent: 'default_position_size_percent',
        maxConcurrentPositions: 'max_concurrent_positions',
        dailyLossLimitUsd: 'daily_loss_limit_usd',
        maxDailyTrades: 'max_daily_trades',
        minRiskRewardRatio: 'min_risk_reward_ratio',
        maxAllowedLeverage: 'max_allowed_leverage',
        tradingStartHour: 'trading_start_hour',
        tradingEndHour: 'trading_end_hour',
        tradeOnWeekends: 'trade_on_weekends',
        autoCloseExpiredSignals: 'auto_close_expired_signals',
        signalExpiryMinutes: 'signal_expiry_minutes',
        positionMonitoringIntervalSeconds: 'position_monitoring_interval_seconds'
      };

      for (const [requestField, dbField] of Object.entries(fieldsMap)) {
        const value = req.body[requestField];
        if (value !== undefined) {
          updates.push(`${dbField} = $${paramIndex++}`);
          values.push(value);
        }
      }

      if (updates.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Nenhum campo para atualizar foi fornecido'
        });
        return;
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');

      const query = `
        UPDATE admin_trading_defaults 
        SET ${updates.join(', ')}
        WHERE id = 1
        RETURNING *
      `;

      const result = await DatabaseService.getInstance().query(query, values);

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Configurações padrão não encontradas'
        });
        return;
      }

      // Aplicar configurações atualizadas ao orquestrador
      await this.tradingOrchestrator.updateAdminDefaults(req.body);

      logger.info('Configurações padrão do admin atualizadas:', req.body);

      res.json({
        success: true,
        data: result.rows[0],
        message: 'Configurações padrão atualizadas com sucesso'
      });

    } catch (error) {
      logger.error('Erro ao atualizar configurações padrão:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  // ========================================
  // ESTATÍSTICAS DO SISTEMA
  // ========================================

  async getSystemStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { days = 7 } = req.query;

      // Estatísticas gerais
      const statsQuery = `
        SELECT 
          event_type,
          COUNT(*) as total_events,
          COUNT(CASE WHEN success = true THEN 1 END) as successful_events,
          COUNT(CASE WHEN success = false THEN 1 END) as failed_events,
          ROUND(
            COUNT(CASE WHEN success = true THEN 1 END)::DECIMAL / 
            COUNT(*)::DECIMAL * 100, 2
          ) as success_rate_percent,
          AVG(execution_time_ms) as avg_execution_time_ms,
          COUNT(DISTINCT user_id) as unique_users,
          COALESCE(SUM(amount_usd), 0) as total_volume_usd
        FROM system_monitoring
        WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '${days} days'
        GROUP BY event_type
        ORDER BY total_events DESC
      `;

      const statsResult = await DatabaseService.getInstance().query(statsQuery);

      // Estatísticas de trading
      const tradingQuery = `
        SELECT 
          COUNT(*) as total_positions,
          COUNT(CASE WHEN status = 'OPEN' THEN 1 END) as open_positions,
          COUNT(CASE WHEN status = 'CLOSED' THEN 1 END) as closed_positions,
          COUNT(DISTINCT user_id) as active_traders,
          COALESCE(SUM(realized_pnl_usd), 0) as total_realized_pnl,
          COALESCE(SUM(unrealized_pnl_usd), 0) as total_unrealized_pnl,
          COALESCE(SUM(fees_paid_usd), 0) as total_fees_paid,
          COUNT(CASE WHEN realized_pnl_usd > 0 THEN 1 END) as winning_positions,
          COUNT(CASE WHEN realized_pnl_usd < 0 THEN 1 END) as losing_positions
        FROM trading_positions
        WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '${days} days'
      `;

      const tradingResult = await DatabaseService.getInstance().query(tradingQuery);

      // Estatísticas de comissões
      const commissionQuery = `
        SELECT 
          commission_type,
          COUNT(*) as total_transactions,
          COALESCE(SUM(amount_usd), 0) as total_commission_usd,
          COUNT(CASE WHEN status = 'PROCESSED' THEN 1 END) as processed_transactions,
          COUNT(CASE WHEN status = 'PAID' THEN 1 END) as paid_transactions
        FROM commission_transactions
        WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '${days} days'
        GROUP BY commission_type
      `;

      const commissionResult = await DatabaseService.getInstance().query(commissionQuery);

      // Top usuários por volume
      const topUsersQuery = `
        SELECT 
          u.email,
          COUNT(tp.id) as total_positions,
          COALESCE(SUM(tp.realized_pnl_usd), 0) as total_pnl,
          COALESCE(SUM(tp.size * tp.entry_price), 0) as total_volume
        FROM users u
        JOIN trading_positions tp ON u.id = tp.user_id
        WHERE tp.created_at >= CURRENT_TIMESTAMP - INTERVAL '${days} days'
        GROUP BY u.id, u.email
        ORDER BY total_volume DESC
        LIMIT 10
      `;

      const topUsersResult = await DatabaseService.getInstance().query(topUsersQuery);

      res.json({
        success: true,
        data: {
          period: `${days} days`,
          systemEvents: statsResult.rows,
          trading: tradingResult.rows[0] || {},
          commissions: commissionResult.rows,
          topUsers: topUsersResult.rows
        },
        message: 'Estatísticas do sistema obtidas com sucesso'
      });

    } catch (error) {
      logger.error('Erro ao obter estatísticas do sistema:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  // ========================================
  // MONITORAMENTO EM TEMPO REAL
  // ========================================

  async getActivePositions(req: Request, res: Response): Promise<void> {
    try {
      const query = `
        SELECT 
          tp.*,
          u.email as user_email,
          uea.exchange,
          uea.account_name,
          ts.symbol as signal_symbol,
          ts.source as signal_source
        FROM trading_positions tp
        JOIN users u ON tp.user_id = u.id
        JOIN user_exchange_accounts uea ON tp.exchange_account_id = uea.id
        LEFT JOIN trading_signals ts ON tp.signal_id = ts.id
        WHERE tp.status = 'OPEN'
        ORDER BY tp.created_at DESC
      `;

      const result = await DatabaseService.getInstance().query(query);

      const positions = result.rows.map(row => ({
        id: row.id,
        user: {
          id: row.user_id,
          email: row.user_email
        },
        exchange: {
          type: row.exchange,
          account: row.account_name
        },
        signal: {
          id: row.signal_id,
          symbol: row.signal_symbol,
          source: row.signal_source
        },
        position: {
          symbol: row.symbol,
          side: row.side,
          size: parseFloat(row.size),
          entryPrice: parseFloat(row.entry_price),
          currentPrice: row.current_price ? parseFloat(row.current_price) : null,
          leverage: row.leverage,
          stopLoss: row.stop_loss ? parseFloat(row.stop_loss) : null,
          takeProfit: row.take_profit ? parseFloat(row.take_profit) : null,
          unrealizedPnlUsd: parseFloat(row.unrealized_pnl_usd) || 0,
          feesPaidUsd: parseFloat(row.fees_paid_usd) || 0
        },
        timing: {
          openedAt: row.opened_at,
          updatedAt: row.updated_at
        }
      }));

      res.json({
        success: true,
        data: {
          totalOpenPositions: positions.length,
          positions
        },
        message: 'Posições ativas obtidas com sucesso'
      });

    } catch (error) {
      logger.error('Erro ao obter posições ativas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  async getRecentSignals(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 50 } = req.query;

      const query = `
        SELECT 
          ts.*,
          COUNT(tp.id) as positions_created,
          COALESCE(SUM(CASE WHEN tp.status = 'OPEN' THEN 1 ELSE 0 END), 0) as open_positions,
          COALESCE(AVG(tp.realized_pnl_usd), 0) as avg_pnl
        FROM trading_signals ts
        LEFT JOIN trading_positions tp ON ts.id = tp.signal_id
        GROUP BY ts.id
        ORDER BY ts.received_at DESC
        LIMIT $1
      `;

      const result = await DatabaseService.getInstance().query(query, [limit]);

      const signals = result.rows.map(row => ({
        id: row.id,
        source: row.source,
        webhookId: row.webhook_id,
        symbol: row.symbol,
        signalType: row.signal_type,
        leverage: row.leverage,
        prices: {
          entry: row.entry_price ? parseFloat(row.entry_price) : null,
          stopLoss: row.stop_loss ? parseFloat(row.stop_loss) : null,
          takeProfit1: row.take_profit_1 ? parseFloat(row.take_profit_1) : null,
          takeProfit2: row.take_profit_2 ? parseFloat(row.take_profit_2) : null,
          takeProfit3: row.take_profit_3 ? parseFloat(row.take_profit_3) : null
        },
        config: {
          positionSizePercent: parseFloat(row.position_size_percent),
          riskRewardRatio: row.risk_reward_ratio ? parseFloat(row.risk_reward_ratio) : null
        },
        status: row.status,
        timing: {
          receivedAt: row.received_at,
          processedAt: row.processed_at,
          expiresAt: row.expires_at
        },
        results: {
          positionsCreated: parseInt(row.positions_created) || 0,
          openPositions: parseInt(row.open_positions) || 0,
          avgPnl: parseFloat(row.avg_pnl) || 0
        },
        notes: row.notes
      }));

      res.json({
        success: true,
        data: {
          totalSignals: signals.length,
          signals
        },
        message: 'Sinais recentes obtidos com sucesso'
      });

    } catch (error) {
      logger.error('Erro ao obter sinais recentes:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  // ========================================
  // LOGS E MONITORAMENTO
  // ========================================

  async getSystemLogs(req: Request, res: Response): Promise<void> {
    try {
      const { 
        eventType, 
        success, 
        userId, 
        limit = 100, 
        offset = 0 
      } = req.query;

      let whereConditions: string[] = [];
      let values: any[] = [];
      let paramIndex = 1;

      if (eventType) {
        whereConditions.push(`event_type = $${paramIndex++}`);
        values.push(eventType);
      }

      if (success !== undefined) {
        whereConditions.push(`success = $${paramIndex++}`);
        values.push(success === 'true');
      }

      if (userId) {
        whereConditions.push(`user_id = $${paramIndex++}`);
        values.push(userId);
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      const query = `
        SELECT 
          sm.*,
          u.email as user_email
        FROM system_monitoring sm
        LEFT JOIN users u ON sm.user_id = u.id
        ${whereClause}
        ORDER BY sm.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;

      values.push(limit, offset);

      const result = await DatabaseService.getInstance().query(query, values);

      const logs = result.rows.map(row => ({
        id: row.id,
        eventType: row.event_type,
        user: row.user_id ? {
          id: row.user_id,
          email: row.user_email
        } : null,
        position: {
          id: row.position_id
        },
        signal: {
          id: row.signal_id
        },
        execution: {
          timeMs: row.execution_time_ms,
          success: row.success,
          errorMessage: row.error_message
        },
        context: {
          symbol: row.symbol,
          exchange: row.exchange_used,
          amountUsd: row.amount_usd ? parseFloat(row.amount_usd) : null
        },
        details: row.details,
        createdAt: row.created_at
      }));

      res.json({
        success: true,
        data: {
          logs,
          pagination: {
            limit: parseInt(limit as string),
            offset: parseInt(offset as string),
            total: logs.length
          }
        },
        message: 'Logs do sistema obtidos com sucesso'
      });

    } catch (error) {
      logger.error('Erro ao obter logs do sistema:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }
}

export default AdminController;
