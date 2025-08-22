// ========================================
// MARKETBOT - WEBHOOK CONTROLLER V2
// Controlador atualizado para FASE 5 com Trading Orchestrator
// ========================================

import { Request, Response } from 'express';
import crypto from 'crypto';
import TradingOrchestrator from '../services/trading-orchestrator.service.js';
import { DatabaseService } from '../services/database.service.js';
import { logger } from '../utils/logger.js';
import { SignalType, CreateSignalDTO } from '../types/trading.types.js';

export class WebhookControllerV2 {
  private tradingOrchestrator: TradingOrchestrator;
  private webhookSecret: string;

  constructor() {
    this.tradingOrchestrator = TradingOrchestrator.getInstance();
    this.webhookSecret = process.env.TRADINGVIEW_WEBHOOK_SECRET || 'default-secret';
  }

  // ========================================
  // WEBHOOK TRADINGVIEW - INTEGRAÇÃO COMPLETA
  // ========================================

  async tradingViewWebhook(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      logger.info('📡 FASE 5 - Webhook TradingView recebido:', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        body: req.body
      });

      // 1. Validar webhook secret
      const signature = req.headers['x-webhook-signature'] as string;
      if (!this.validateWebhookSignature(JSON.stringify(req.body), signature)) {
        logger.warn('❌ Webhook com assinatura inválida');
        res.status(401).json({
          success: false,
          message: 'Assinatura do webhook inválida'
        });
        return;
      }

      // 2. Validar estrutura do sinal
      const validationResult = this.validateSignalStructure(req.body);
      if (!validationResult.valid) {
        logger.warn('❌ Estrutura do sinal inválida:', validationResult.errors);
        res.status(400).json({
          success: false,
          message: 'Estrutura do sinal inválida',
          errors: validationResult.errors
        });
        return;
      }

      // 3. Converter para formato interno
      const signalData = this.convertToInternalFormat(req.body);
      
      // 4. PROCESSAR COM ORQUESTRADOR COMPLETO
      const result = await this.tradingOrchestrator.processSignal(signalData);
      
      // 5. Registrar evento
      await this.logSystemEvent(
        'SIGNAL_RECEIVED',
        null,
        null,
        result.signalId,
        Date.now() - startTime,
        result.success,
        result.success ? null : result.errors.join(', '),
        signalData.symbol,
        'TRADINGVIEW',
        null,
        { webhook: req.body, result: result }
      );

      // 6. Resposta detalhada
      if (result.success) {
        logger.info(`✅ FASE 5 - Sinal processado: ${result.usersProcessed} usuários, ${result.positionsOpened} posições com SL/TP obrigatórios`);
        res.json({
          success: true,
          message: '🚀 FASE 5 - Sinal processado com sistema completo',
          data: {
            signalId: result.signalId,
            usersProcessed: result.usersProcessed,
            positionsOpened: result.positionsOpened,
            processingTimeMs: Date.now() - startTime,
            features: {
              multiUser: true,
              stopLossRequired: true,
              takeProfitRequired: true,
              balanceBasedPositioning: true,
              realTimeMonitoring: true,
              automaticCommission: true
            }
          }
        });
      } else {
        logger.error('❌ Erro no processamento do sinal:', result.errors);
        res.status(500).json({
          success: false,
          message: 'Erro no processamento do sinal',
          errors: result.errors
        });
      }

    } catch (error) {
      logger.error('❌ Erro no webhook TradingView:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  // ========================================
  // VALIDAÇÕES AVANÇADAS
  // ========================================

  private validateWebhookSignature(body: string, signature: string): boolean {
    if (!signature) return false;
    
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(body)
        .digest('hex');
      
      return signature === expectedSignature;
    } catch (error) {
      logger.error('Erro na validação da assinatura:', error);
      return false;
    }
  }

  private validateSignalStructure(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Campos obrigatórios
    if (!data.symbol) errors.push('Campo symbol é obrigatório');
    if (!data.action) errors.push('Campo action é obrigatório');
    
    // Validar action
    const validActions = ['BUY', 'SELL', 'LONG', 'SHORT', 'CLOSE_LONG', 'CLOSE_SHORT'];
    if (data.action && !validActions.includes(data.action.toUpperCase())) {
      errors.push(`Action deve ser um dos valores: ${validActions.join(', ')}`);
    }

    // Validar preços
    if (data.entry_price && (isNaN(data.entry_price) || data.entry_price <= 0)) {
      errors.push('Entry price deve ser um número positivo');
    }

    if (data.stop_loss && (isNaN(data.stop_loss) || data.stop_loss <= 0)) {
      errors.push('Stop loss deve ser um número positivo');
    }

    if (data.take_profit && (isNaN(data.take_profit) || data.take_profit <= 0)) {
      errors.push('Take profit deve ser um número positivo');
    }

    // Validar leverage
    if (data.leverage && (isNaN(data.leverage) || data.leverage < 1 || data.leverage > 100)) {
      errors.push('Leverage deve estar entre 1 e 100');
    }

    // Validar position_size
    if (data.position_size && (isNaN(data.position_size) || data.position_size <= 0 || data.position_size > 100)) {
      errors.push('Position size deve estar entre 0 e 100%');
    }

    return { valid: errors.length === 0, errors };
  }

  private convertToInternalFormat(webhookData: any): CreateSignalDTO {
    // Mapear action para SignalType
    let signalType: SignalType;
    const action = webhookData.action.toUpperCase();
    
    switch (action) {
      case 'BUY':
      case 'LONG':
        signalType = SignalType.LONG;
        break;
      case 'SELL':
      case 'SHORT':
        signalType = SignalType.SHORT;
        break;
      case 'CLOSE_LONG':
        signalType = SignalType.CLOSE_LONG;
        break;
      case 'CLOSE_SHORT':
        signalType = SignalType.CLOSE_SHORT;
        break;
      default:
        signalType = SignalType.LONG;
    }

    return {
      source: 'TRADINGVIEW',
      symbol: webhookData.symbol.toUpperCase(),
      signalType,
      leverage: webhookData.leverage || 5,
      entryPrice: webhookData.entry_price || undefined,
      stopLoss: webhookData.stop_loss || undefined,
      takeProfit1: webhookData.take_profit || webhookData.take_profit_1 || undefined,
      takeProfit2: webhookData.take_profit_2 || undefined,
      takeProfit3: webhookData.take_profit_3 || undefined,
      positionSizePercent: webhookData.position_size || 30,
      expiresAt: webhookData.expires_at ? new Date(webhookData.expires_at) : undefined,
      notes: `FASE 5 - TradingView Signal - ${action} ${webhookData.symbol} - Sistema Completo`
    };
  }

  // ========================================
  // SINAL MANUAL PARA TESTES
  // ========================================

  async manualSignal(req: Request, res: Response): Promise<void> {
    try {
      logger.info('📡 FASE 5 - Sinal manual recebido:', req.body);

      const signalData: CreateSignalDTO = {
        source: 'MANUAL',
        symbol: req.body.symbol,
        signalType: req.body.signalType,
        leverage: req.body.leverage || 5,
        entryPrice: req.body.entryPrice,
        stopLoss: req.body.stopLoss,
        takeProfit1: req.body.takeProfit1,
        takeProfit2: req.body.takeProfit2,
        takeProfit3: req.body.takeProfit3,
        positionSizePercent: req.body.positionSizePercent || 30,
        notes: req.body.notes || 'FASE 5 - Sinal manual com sistema completo'
      };

      const result = await this.tradingOrchestrator.processSignal(signalData);

      res.json({
        success: true,
        message: '🚀 FASE 5 - Sinal manual processado com sistema completo',
        data: {
          ...result,
          features: {
            multiUserSupport: 'Cada usuário opera com suas próprias chaves',
            riskManagement: 'Stop Loss e Take Profit obrigatórios',
            balanceBasedSizing: 'Tamanho baseado no saldo real da exchange',
            realTimeMonitoring: 'Monitoramento a cada 30 segundos',
            automaticCommission: 'Comissão calculada automaticamente'
          }
        }
      });

    } catch (error) {
      logger.error('❌ Erro no sinal manual:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  // ========================================
  // STATUS DO SISTEMA FASE 5
  // ========================================

  async systemStatus(req: Request, res: Response): Promise<void> {
    try {
      // Buscar estatísticas em tempo real
      const activePositionsQuery = `
        SELECT COUNT(*) as count FROM trading_positions WHERE status = 'OPEN'
      `;
      const activePositions = await DatabaseService.getInstance().query(activePositionsQuery);

      const todaySignalsQuery = `
        SELECT COUNT(*) as count FROM trading_signals 
        WHERE received_at >= CURRENT_DATE
      `;
      const todaySignals = await DatabaseService.getInstance().query(todaySignalsQuery);

      const activeUsersQuery = `
        SELECT COUNT(DISTINCT user_id) as count FROM trading_positions 
        WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
      `;
      const activeUsers = await DatabaseService.getInstance().query(activeUsersQuery);

      res.json({
        success: true,
        message: '🚀 FASE 5 - Sistema de Trading Multiusuários Operacional',
        data: {
          version: 'FASE 5',
          status: 'OPERATIONAL',
          features: {
            multiUserTrading: '✅ Implementado',
            exchangeKeysFromDB: '✅ Implementado',
            fixedIP: `✅ ${process.env.NGROK_IP_FIXO}`,
            mandatoryStopLoss: '✅ Implementado',
            mandatoryTakeProfit: '✅ Implementado',
            adminConfigurable: '✅ Implementado',
            balanceBasedPositioning: '✅ Implementado',
            realTimeMonitoring: '✅ Implementado',
            automaticCommission: '✅ Implementado',
            signalProcessing: '✅ Implementado',
            positionOrchestration: '✅ Implementado'
          },
          metrics: {
            activePositions: parseInt(activePositions.rows[0]?.count || '0'),
            todaySignals: parseInt(todaySignals.rows[0]?.count || '0'),
            activeUsers: parseInt(activeUsers.rows[0]?.count || '0')
          },
          endpoints: {
            tradingview: '/webhooks/tradingview',
            manual: '/webhooks/manual',
            admin: '/api/v1/admin/*',
            status: '/webhooks/status'
          },
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('❌ Erro ao obter status do sistema:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao obter status do sistema'
      });
    }
  }

  // ========================================
  // LOG DE EVENTOS
  // ========================================

  private async logSystemEvent(
    eventType: string,
    userId?: string | null,
    positionId?: string | null,
    signalId?: string | null,
    executionTimeMs?: number,
    success: boolean = true,
    errorMessage?: string | null,
    symbol?: string,
    exchangeUsed?: string,
    amountUsd?: number | null,
    details?: any
  ): Promise<void> {
    try {
      const query = `
        SELECT log_system_event($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `;

      await DatabaseService.getInstance().query(query, [
        eventType,
        userId,
        positionId,
        signalId,
        executionTimeMs,
        success,
        errorMessage,
        symbol,
        exchangeUsed,
        amountUsd,
        details ? JSON.stringify(details) : null
      ]);
    } catch (error) {
      logger.error('Erro ao registrar evento do sistema:', error);
    }
  }
}

export default WebhookControllerV2;
