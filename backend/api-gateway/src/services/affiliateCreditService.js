import { db } from '../../../common/db.js';
import logger from '../../../common/logger.js';

/**
 * Serviço de Crédito para Afiliados
 * Permite afiliados usarem comissões como crédito em conta
 */
export class AffiliateCreditService {

  /**
   * Obter saldo de comissões disponível para crédito
   */
  static async getAvailableCreditBalance(affiliateId) {
    try {
      // Buscar total de comissões pagas
      const totalCommissions = await db('affiliate_commissions')
        .where('affiliate_id', affiliateId)
        .where('status', 'paid')
        .sum('commission_amount as total')
        .first();

      // Buscar total já usado como crédito
      const totalUsedAsCredit = await db('affiliate_credit_usage')
        .where('affiliate_id', affiliateId)
        .where('status', 'completed')
        .sum('amount as total')
        .first();

      // Buscar total sacado
      const totalWithdrawn = await db('withdrawal_requests')
        .where('user_id', affiliateId)
        .where('withdrawal_type', 'affiliate_commission')
        .where('status', 'completed')
        .sum('net_amount as total')
        .first();

      const totalEarned = parseFloat(totalCommissions.total || 0);
      const totalUsed = parseFloat(totalUsedAsCredit.total || 0);
      const totalWithdraw = parseFloat(totalWithdrawn.total || 0);
      
      const availableBalance = totalEarned - totalUsed - totalWithdraw;

      return {
        total_earned: totalEarned,
        total_used_as_credit: totalUsed,
        total_withdrawn: totalWithdraw,
        available_for_credit: Math.max(0, availableBalance),
        currency: 'BRL' // Comissões sempre em BRL
      };

    } catch (error) {
      logger.error('Erro ao obter saldo de crédito disponível:', error);
      throw error;
    }
  }

  /**
   * Usar comissão como crédito na conta
   */
  static async useCommissionAsCredit(affiliateId, amount, description = null) {
    const trx = await db.transaction();

    try {
      // Verificar saldo disponível
      const creditBalance = await this.getAvailableCreditBalance(affiliateId);
      
      if (amount > creditBalance.available_for_credit) {
        throw new Error(`Saldo insuficiente. Disponível: R$ ${creditBalance.available_for_credit.toFixed(2)}`);
      }

      // Verificar se usuário existe e é afiliado
      const affiliate = await trx('users')
        .where('id', affiliateId)
        .whereNotNull('affiliate_tier_id')
        .first();

      if (!affiliate) {
        throw new Error('Usuário não encontrado ou não é afiliado');
      }

      // Registrar uso de crédito
      const creditUsageId = await trx('affiliate_credit_usage').insert({
        id: require('crypto').randomUUID(),
        affiliate_id: affiliateId,
        amount,
        currency: 'BRL',
        description: description || 'Uso de comissão como crédito',
        status: 'pending',
        created_at: new Date()
      }).returning('id');

      // Converter BRL para USD para adicionar ao saldo pré-pago
      const CurrencyConversionService = await import('./currencyConversionService.js');
      const conversionRate = await CurrencyConversionService.default.getCurrentBRLToUSDRate();
      const usdAmount = amount / conversionRate;

      // Adicionar ao saldo pré-pago do usuário em USD
      await this.addToPrepaidBalance(trx, affiliateId, usdAmount, 'USD', {
        source: 'affiliate_credit',
        credit_usage_id: creditUsageId[0],
        original_amount_brl: amount,
        conversion_rate: conversionRate
      });

      // Atualizar status para completado
      await trx('affiliate_credit_usage')
        .where('id', creditUsageId[0])
        .update({
          status: 'completed',
          completed_at: new Date(),
          conversion_rate: conversionRate,
          converted_amount_usd: usdAmount
        });

      // Registrar log da operação
      await trx('system_logs').insert({
        id: require('crypto').randomUUID(),
        user_id: affiliateId,
        action: 'affiliate_credit_used',
        description: `Afiliado usou R$ ${amount.toFixed(2)} de comissão como crédito (US$ ${usdAmount.toFixed(2)})`,
        metadata: JSON.stringify({
          amount_brl: amount,
          amount_usd: usdAmount,
          conversion_rate: conversionRate,
          credit_usage_id: creditUsageId[0]
        }),
        created_at: new Date()
      });

      await trx.commit();

      logger.info(`Afiliado usou comissão como crédito`, {
        affiliateId,
        amount_brl: amount,
        amount_usd: usdAmount,
        conversionRate
      });

      return {
        success: true,
        credit_usage_id: creditUsageId[0],
        amount_used_brl: amount,
        amount_credited_usd: usdAmount,
        conversion_rate: conversionRate,
        new_balance: await this.getAvailableCreditBalance(affiliateId)
      };

    } catch (error) {
      await trx.rollback();
      logger.error('Erro ao usar comissão como crédito:', error);
      throw error;
    }
  }

  /**
   * Adicionar valor ao saldo pré-pago
   */
  static async addToPrepaidBalance(trx, userId, amount, currency, metadata = {}) {
    // Buscar saldo atual
    let currentBalance = await trx('user_prepaid_balance')
      .where('user_id', userId)
      .where('currency', currency)
      .first();

    const balanceBefore = currentBalance ? parseFloat(currentBalance.balance) : 0;
    const balanceAfter = balanceBefore + amount;

    if (currentBalance) {
      // Atualizar saldo existente
      await trx('user_prepaid_balance')
        .where('user_id', userId)
        .where('currency', currency)
        .update({
          balance: balanceAfter,
          last_transaction_at: new Date()
        });
    } else {
      // Criar novo saldo
      await trx('user_prepaid_balance').insert({
        id: require('crypto').randomUUID(),
        user_id: userId,
        currency,
        balance: balanceAfter,
        pending_balance: 0,
        last_transaction_at: new Date(),
        created_at: new Date()
      });
    }

    // Registrar transação
    await trx('prepaid_transactions').insert({
      id: require('crypto').randomUUID(),
      user_id: userId,
      type: 'credit',
      amount,
      currency,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      description: 'Crédito de comissão de afiliado',
      metadata: JSON.stringify(metadata),
      created_at: new Date()
    });

    return balanceAfter;
  }

  /**
   * Obter histórico de uso de crédito
   */
  static async getCreditUsageHistory(affiliateId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        start_date,
        end_date,
        status = 'all'
      } = options;

      const offset = (page - 1) * limit;

      let query = db('affiliate_credit_usage')
        .where('affiliate_id', affiliateId)
        .orderBy('created_at', 'desc');

      if (start_date) {
        query = query.where('created_at', '>=', start_date);
      }

      if (end_date) {
        query = query.where('created_at', '<=', end_date);
      }

      if (status !== 'all') {
        query = query.where('status', status);
      }

      const [usageHistory, totalCount] = await Promise.all([
        query.limit(limit).offset(offset),
        query.clone().count('* as count').first()
      ]);

      return {
        usage_history: usageHistory.map(usage => ({
          id: usage.id,
          amount_brl: parseFloat(usage.amount),
          amount_usd: usage.converted_amount_usd ? parseFloat(usage.converted_amount_usd) : null,
          currency: usage.currency,
          description: usage.description,
          status: usage.status,
          conversion_rate: usage.conversion_rate ? parseFloat(usage.conversion_rate) : null,
          created_at: usage.created_at,
          completed_at: usage.completed_at
        })),
        pagination: {
          page,
          limit,
          total: parseInt(totalCount.count),
          has_more: offset + usageHistory.length < parseInt(totalCount.count)
        }
      };

    } catch (error) {
      logger.error('Erro ao obter histórico de uso de crédito:', error);
      throw error;
    }
  }

  /**
   * Cancelar uso de crédito pendente
   */
  static async cancelPendingCreditUsage(affiliateId, creditUsageId) {
    const trx = await db.transaction();

    try {
      // Buscar uso de crédito
      const creditUsage = await trx('affiliate_credit_usage')
        .where('id', creditUsageId)
        .where('affiliate_id', affiliateId)
        .where('status', 'pending')
        .first();

      if (!creditUsage) {
        throw new Error('Uso de crédito não encontrado ou já processado');
      }

      // Atualizar status para cancelado
      await trx('affiliate_credit_usage')
        .where('id', creditUsageId)
        .update({
          status: 'cancelled',
          cancelled_at: new Date()
        });

      // Registrar log
      await trx('system_logs').insert({
        id: require('crypto').randomUUID(),
        user_id: affiliateId,
        action: 'affiliate_credit_cancelled',
        description: `Uso de crédito cancelado: R$ ${parseFloat(creditUsage.amount).toFixed(2)}`,
        metadata: JSON.stringify({
          credit_usage_id: creditUsageId,
          amount: parseFloat(creditUsage.amount)
        }),
        created_at: new Date()
      });

      await trx.commit();

      logger.info(`Uso de crédito cancelado`, {
        affiliateId,
        creditUsageId,
        amount: creditUsage.amount
      });

      return {
        success: true,
        cancelled_amount: parseFloat(creditUsage.amount),
        new_balance: await this.getAvailableCreditBalance(affiliateId)
      };

    } catch (error) {
      await trx.rollback();
      logger.error('Erro ao cancelar uso de crédito:', error);
      throw error;
    }
  }

  /**
   * Obter estatísticas de uso de crédito do afiliado
   */
  static async getCreditUsageStats(affiliateId) {
    try {
      const [
        totalUsed,
        thisMonthUsed,
        lastMonthUsed,
        usageCount
      ] = await Promise.all([
        // Total usado
        db('affiliate_credit_usage')
          .where('affiliate_id', affiliateId)
          .where('status', 'completed')
          .sum('amount as total')
          .first(),
        
        // Este mês
        db('affiliate_credit_usage')
          .where('affiliate_id', affiliateId)
          .where('status', 'completed')
          .whereBetween('completed_at', [
            new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999)
          ])
          .sum('amount as total')
          .first(),
        
        // Mês passado
        db('affiliate_credit_usage')
          .where('affiliate_id', affiliateId)
          .where('status', 'completed')
          .whereBetween('completed_at', [
            new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
            new Date(new Date().getFullYear(), new Date().getMonth(), 0, 23, 59, 59, 999)
          ])
          .sum('amount as total')
          .first(),
        
        // Contagem de usos
        db('affiliate_credit_usage')
          .where('affiliate_id', affiliateId)
          .where('status', 'completed')
          .count('* as count')
          .first()
      ]);

      const totalUsedAmount = parseFloat(totalUsed.total || 0);
      const thisMonthAmount = parseFloat(thisMonthUsed.total || 0);
      const lastMonthAmount = parseFloat(lastMonthUsed.total || 0);

      // Calcular crescimento mensal
      const monthlyGrowth = lastMonthAmount > 0 ? 
        (((thisMonthAmount - lastMonthAmount) / lastMonthAmount) * 100) : 0;

      return {
        total_used: totalUsedAmount,
        usage_count: parseInt(usageCount.count),
        average_usage: usageCount.count > 0 ? (totalUsedAmount / usageCount.count) : 0,
        this_month: thisMonthAmount,
        last_month: lastMonthAmount,
        monthly_growth_percent: parseFloat(monthlyGrowth.toFixed(2)),
        currency: 'BRL'
      };

    } catch (error) {
      logger.error('Erro ao obter estatísticas de uso de crédito:', error);
      throw error;
    }
  }

  /**
   * Verificar se afiliado pode usar crédito
   */
  static async canUseCredit(affiliateId, requestedAmount) {
    try {
      const creditBalance = await this.getAvailableCreditBalance(affiliateId);
      
      return {
        can_use: requestedAmount <= creditBalance.available_for_credit,
        available_balance: creditBalance.available_for_credit,
        requested_amount: requestedAmount,
        difference: creditBalance.available_for_credit - requestedAmount
      };

    } catch (error) {
      logger.error('Erro ao verificar disponibilidade de crédito:', error);
      throw error;
    }
  }

  /**
   * Obter taxa de conversão atual BRL -> USD
   */
  static async getCurrentConversionRate() {
    try {
      const CurrencyConversionService = await import('./currencyConversionService.js');
      return await CurrencyConversionService.default.getCurrentBRLToUSDRate();
    } catch (error) {
      logger.error('Erro ao obter taxa de conversão:', error);
      // Taxa de fallback (pode ser melhorada)
      return 0.20; // Aproximadamente 1 BRL = 0.20 USD
    }
  }

  /**
   * Simular conversão de crédito
   */
  static async simulateCreditConversion(affiliateId, amountBRL) {
    try {
      const creditBalance = await this.getAvailableCreditBalance(affiliateId);
      const conversionRate = await this.getCurrentConversionRate();
      const amountUSD = amountBRL * conversionRate;

      return {
        can_convert: amountBRL <= creditBalance.available_for_credit,
        amount_brl: amountBRL,
        amount_usd: parseFloat(amountUSD.toFixed(2)),
        conversion_rate: conversionRate,
        available_balance_brl: creditBalance.available_for_credit,
        remaining_balance_brl: Math.max(0, creditBalance.available_for_credit - amountBRL)
      };

    } catch (error) {
      logger.error('Erro ao simular conversão de crédito:', error);
      throw error;
    }
  }
}

export default AffiliateCreditService;
