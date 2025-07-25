import { db } from '../../../common/db.js';
import { PaymentService } from './paymentService.js';
import logger from '../../../common/logger.js';

export class OperationControlService {
  /**
   * Verificar se usuário pode abrir nova operação
   */
  static async canUserOperate(userId, operationAmount, currency = 'BRL') {
    try {
      // Buscar configurações da moeda
      const currencySettings = await db('currency_settings')
        .where({ currency })
        .first();

      if (!currencySettings) {
        throw new Error('Configurações da moeda não encontradas');
      }

      // Buscar dados do usuário
      const user = await db('users')
        .where({ id: userId })
        .first();

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Verificar se usuário pode operar (flag de controle)
      if (!user.can_operate) {
        return {
          allowed: false,
          reason: 'Usuário bloqueado para operações',
          balance: 0,
          minimum_required: currencySettings.minimum_balance
        };
      }

      // Buscar saldo atual
      const currentBalance = await PaymentService.getUserPrepaidBalance(userId, currency);

      // Verificar saldo mínimo global
      const minimumBalance = Math.max(
        parseFloat(currencySettings.minimum_balance),
        parseFloat(user.minimum_balance_required || 0)
      );

      // Verificar valor mínimo de operação
      if (operationAmount < currencySettings.minimum_operation) {
        return {
          allowed: false,
          reason: `Valor mínimo para operação é ${currency} ${currencySettings.minimum_operation}`,
          balance: currentBalance,
          minimum_required: minimumBalance
        };
      }

      // Verificar se tem saldo suficiente
      if (currentBalance < minimumBalance) {
        return {
          allowed: false,
          reason: `Saldo insuficiente. Mínimo necessário: ${currency} ${minimumBalance}`,
          balance: currentBalance,
          minimum_required: minimumBalance
        };
      }

      // Verificar se após a operação ainda terá saldo mínimo
      const balanceAfterOperation = currentBalance - operationAmount;
      if (balanceAfterOperation < minimumBalance) {
        return {
          allowed: false,
          reason: `Operação deixaria saldo abaixo do mínimo. Necessário manter: ${currency} ${minimumBalance}`,
          balance: currentBalance,
          minimum_required: minimumBalance,
          max_operation_allowed: Math.max(0, currentBalance - minimumBalance)
        };
      }

      // Verificar limite de operações simultâneas
      const activeOperations = await this.getActiveOperationsCount(userId);
      const maxOperations = user.max_concurrent_operations || 5;

      if (activeOperations >= maxOperations) {
        return {
          allowed: false,
          reason: `Limite de operações simultâneas atingido (${maxOperations})`,
          balance: currentBalance,
          minimum_required: minimumBalance,
          active_operations: activeOperations
        };
      }

      // Log da verificação
      await this.logOperationCheck(userId, {
        operation_type: 'balance_check',
        balance_before: currentBalance,
        amount_requested: operationAmount,
        currency,
        allowed: true,
        reason: 'Operação permitida'
      });

      return {
        allowed: true,
        reason: 'Operação permitida',
        balance: currentBalance,
        minimum_required: minimumBalance,
        balance_after_operation: balanceAfterOperation,
        active_operations: activeOperations
      };

    } catch (error) {
      logger.error({ error, userId, operationAmount, currency }, 'Erro ao verificar se usuário pode operar');
      
      // Log do erro
      await this.logOperationCheck(userId, {
        operation_type: 'balance_check',
        balance_before: 0,
        amount_requested: operationAmount,
        currency,
        allowed: false,
        reason: error.message
      });

      return {
        allowed: false,
        reason: 'Erro interno ao verificar operação',
        balance: 0,
        minimum_required: 0
      };
    }
  }

  /**
   * Executar débito para abertura de operação
   */
  static async executeOperationDebit(userId, operationAmount, currency = 'BRL', operationId, operationType = 'trade') {
    try {
      return await db.transaction(async (trx) => {
        // Verificar novamente se pode operar (double-check)
        const canOperate = await this.canUserOperate(userId, operationAmount, currency);
        
        if (!canOperate.allowed) {
          throw new Error(canOperate.reason);
        }

        // Debitar saldo
        const newBalance = await PaymentService.debitPrepaidBalance(
          userId,
          operationAmount,
          currency,
          `Abertura de operação ${operationType} - ID: ${operationId}`,
          operationId
        );

        // Log da operação
        await this.logOperationCheck(userId, {
          operation_type: 'trade_open',
          balance_before: canOperate.balance,
          balance_after: newBalance,
          amount_used: operationAmount,
          currency,
          allowed: true,
          metadata: {
            operation_id: operationId,
            operation_type: operationType
          }
        });

        logger.info({ 
          userId, 
          operationId,
          operationAmount,
          newBalance,
          currency 
        }, 'Débito de operação executado');

        return {
          success: true,
          new_balance: newBalance,
          operation_id: operationId
        };
      });

    } catch (error) {
      logger.error({ error, userId, operationAmount, operationId }, 'Erro ao executar débito de operação');
      throw error;
    }
  }

  /**
   * Executar crédito no fechamento de operação
   */
  static async executeOperationCredit(userId, operationResult, currency = 'BRL', operationId, operationType = 'trade') {
    try {
      const { profit, loss, total_return } = operationResult;
      
      // Se houve lucro, creditar o valor total (valor inicial + lucro)
      // Se houve prejuízo, creditar apenas o que sobrou
      const creditAmount = total_return || 0;

      if (creditAmount > 0) {
        const newBalance = await PaymentService.creditPrepaidBalance(
          userId,
          creditAmount,
          currency,
          null,
          `Fechamento de operação ${operationType} - ID: ${operationId}${profit > 0 ? ` (lucro: ${currency} ${profit})` : loss > 0 ? ` (prejuízo: ${currency} ${loss})` : ''}`
        );

        // Processar comissão de afiliado se houve lucro
        if (profit > 0) {
          await this.processAffiliateCommissionOnProfit(userId, profit, currency);
        }

        // Log da operação
        await this.logOperationCheck(userId, {
          operation_type: 'trade_close',
          balance_before: newBalance - creditAmount,
          balance_after: newBalance,
          amount_used: creditAmount,
          currency,
          allowed: true,
          metadata: {
            operation_id: operationId,
            operation_type: operationType,
            profit,
            loss,
            total_return
          }
        });

        logger.info({ 
          userId, 
          operationId,
          profit,
          loss,
          creditAmount,
          newBalance,
          currency 
        }, 'Crédito de fechamento de operação executado');

        return {
          success: true,
          new_balance: newBalance,
          credit_amount: creditAmount,
          profit,
          loss
        };
      } else {
        // Operação resultou em perda total
        logger.info({ 
          userId, 
          operationId,
          loss: loss || 0,
          currency 
        }, 'Operação fechada com perda total');

        return {
          success: true,
          new_balance: await PaymentService.getUserPrepaidBalance(userId, currency),
          credit_amount: 0,
          profit: 0,
          loss: loss || 0
        };
      }

    } catch (error) {
      logger.error({ error, userId, operationResult, operationId }, 'Erro ao executar crédito de operação');
      throw error;
    }
  }

  /**
   * Processar comissão de afiliado baseada no lucro
   */
  static async processAffiliateCommissionOnProfit(userId, profit, currency = 'BRL') {
    try {
      const user = await db('users')
        .leftJoin('affiliate_tiers', 'users.affiliate_tier_id', 'affiliate_tiers.id')
        .where({ 'users.id': userId })
        .select(
          'users.*',
          'affiliate_tiers.commission_rate',
          'affiliate_tiers.name as tier_name'
        )
        .first();

      if (!user || !user.affiliate_id) {
        return; // Usuário não tem afiliado
      }

      // Buscar tier do afiliado
      const affiliate = await db('users')
        .leftJoin('affiliate_tiers', 'users.affiliate_tier_id', 'affiliate_tiers.id')
        .where({ 'users.id': user.affiliate_id })
        .select(
          'users.*',
          'affiliate_tiers.commission_rate',
          'affiliate_tiers.name as tier_name'
        )
        .first();

      if (!affiliate) {
        return;
      }

      // Determinar taxa de comissão (1.5% normal, 5% VIP)
      const commissionRate = affiliate.commission_rate || 0.015; // Default 1.5%
      const commissionAmount = profit * commissionRate;

      // Criar registro de comissão
      await db('affiliate_commissions').insert({
        user_id: userId,
        affiliate_id: user.affiliate_id,
        commission_amount: commissionAmount,
        commission_rate: commissionRate,
        commission_type: 'profit_share',
        status: 'approved', // Aprovar automaticamente comissões de lucro
        currency: currency.toLowerCase(),
        metadata: {
          original_profit: profit,
          tier: affiliate.tier_name || 'normal',
          commission_source: 'trading_profit'
        }
      });

      logger.info({ 
        affiliateId: user.affiliate_id,
        userId,
        profit,
        commissionAmount,
        commissionRate,
        tier: affiliate.tier_name 
      }, 'Comissão de afiliado sobre lucro processada');

    } catch (error) {
      logger.error({ error, userId, profit }, 'Erro ao processar comissão de afiliado sobre lucro');
    }
  }

  /**
   * Contar operações ativas do usuário
   */
  static async getActiveOperationsCount(userId) {
    try {
      // Assumindo que existe uma tabela 'operations' ou similar
      // Adapte conforme sua estrutura de dados
      const result = await db('operations')
        .where({ user_id: userId, status: 'active' })
        .count('* as count')
        .first();

      return parseInt(result.count) || 0;

    } catch (error) {
      logger.warn({ error, userId }, 'Erro ao contar operações ativas - assumindo 0');
      return 0;
    }
  }

  /**
   * Atualizar saldo mínimo do usuário (admin)
   */
  static async updateUserMinimumBalance(userId, newMinimumBalance, adminId) {
    try {
      await db('users')
        .where({ id: userId })
        .update({
          minimum_balance_required: newMinimumBalance,
          updated_at: new Date()
        });

      // Log de auditoria
      await db('audit_logs').insert({
        user_id: adminId,
        action: 'user_minimum_balance_updated',
        resource_type: 'user',
        resource_id: userId.toString(),
        details: {
          new_minimum_balance: newMinimumBalance,
          target_user_id: userId
        }
      });

      logger.info({ 
        userId, 
        newMinimumBalance,
        adminId 
      }, 'Saldo mínimo do usuário atualizado');

      return true;

    } catch (error) {
      logger.error({ error, userId, newMinimumBalance }, 'Erro ao atualizar saldo mínimo do usuário');
      throw error;
    }
  }

  /**
   * Bloquear/desbloquear usuário para operações
   */
  static async toggleUserOperationAccess(userId, canOperate, adminId, reason = '') {
    try {
      await db('users')
        .where({ id: userId })
        .update({
          can_operate: canOperate,
          updated_at: new Date()
        });

      // Log de auditoria
      await db('audit_logs').insert({
        user_id: adminId,
        action: canOperate ? 'user_operation_enabled' : 'user_operation_disabled',
        resource_type: 'user',
        resource_id: userId.toString(),
        details: {
          can_operate: canOperate,
          reason,
          target_user_id: userId
        }
      });

      logger.info({ 
        userId, 
        canOperate,
        reason,
        adminId 
      }, 'Acesso a operações do usuário alterado');

      return true;

    } catch (error) {
      logger.error({ error, userId, canOperate }, 'Erro ao alterar acesso a operações do usuário');
      throw error;
    }
  }

  /**
   * Obter estatísticas de operações do usuário
   */
  static async getUserOperationStats(userId, currency = 'BRL', days = 30) {
    try {
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - days);

      const [
        totalOperations,
        profitableOperations,
        totalProfit,
        totalLoss,
        averageOperation,
        currentBalance
      ] = await Promise.all([
        db('operation_logs')
          .where({ user_id: userId, operation_type: 'trade_open', currency })
          .where('created_at', '>=', dateFrom)
          .count('* as count')
          .first(),

        db('operation_logs')
          .where({ user_id: userId, operation_type: 'trade_close', currency })
          .where('created_at', '>=', dateFrom)
          .whereRaw("metadata->>'profit' > '0'")
          .count('* as count')
          .first(),

        db('operation_logs')
          .where({ user_id: userId, operation_type: 'trade_close', currency })
          .where('created_at', '>=', dateFrom)
          .whereRaw("metadata->>'profit' > '0'")
          .sum(db.raw("CAST(metadata->>'profit' AS DECIMAL)"))
          .first(),

        db('operation_logs')
          .where({ user_id: userId, operation_type: 'trade_close', currency })
          .where('created_at', '>=', dateFrom)
          .whereRaw("metadata->>'loss' > '0'")
          .sum(db.raw("CAST(metadata->>'loss' AS DECIMAL)"))
          .first(),

        db('operation_logs')
          .where({ user_id: userId, operation_type: 'trade_open', currency })
          .where('created_at', '>=', dateFrom)
          .avg('amount_used as average')
          .first(),

        PaymentService.getUserPrepaidBalance(userId, currency)
      ]);

      const operations = parseInt(totalOperations.count) || 0;
      const profitable = parseInt(profitableOperations.count) || 0;
      const profit = parseFloat(totalProfit.sum) || 0;
      const loss = parseFloat(totalLoss.sum) || 0;
      const avgOperation = parseFloat(averageOperation.average) || 0;

      return {
        period_days: days,
        currency,
        current_balance: currentBalance,
        operations: {
          total: operations,
          profitable: profitable,
          loss_making: operations - profitable,
          success_rate: operations > 0 ? ((profitable / operations) * 100).toFixed(2) : 0
        },
        financial: {
          total_profit: profit,
          total_loss: loss,
          net_result: profit - loss,
          average_operation: avgOperation
        }
      };

    } catch (error) {
      logger.error({ error, userId, currency, days }, 'Erro ao obter estatísticas de operações');
      throw error;
    }
  }

  /**
   * Log de verificação de operação
   */
  static async logOperationCheck(userId, data) {
    try {
      await db('operation_logs').insert({
        user_id: userId,
        operation_type: data.operation_type,
        balance_before: data.balance_before || 0,
        balance_after: data.balance_after || null,
        amount_used: data.amount_used || null,
        currency: data.currency || 'BRL',
        allowed: data.allowed,
        reason: data.reason || null,
        metadata: data.metadata || null
      });

    } catch (error) {
      logger.warn({ error, userId, data }, 'Erro ao registrar log de operação');
    }
  }
}
