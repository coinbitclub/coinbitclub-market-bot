import { db } from '../../../common/db.js';
import logger from '../../../common/logger.js';

/**
 * Serviço de Extrato Financeiro
 * Permite usuários e afiliados verificarem histórico de débitos/créditos
 */
export class FinancialStatementService {
  
  /**
   * Obter extrato completo do usuário
   */
  static async getUserStatement(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        start_date,
        end_date,
        transaction_type, // 'all', 'debit', 'credit', 'commission'
        currency = 'all'
      } = options;

      const offset = (page - 1) * limit;
      
      // Buscar dados do usuário
      const user = await db('users')
        .leftJoin('affiliate_tiers', 'users.affiliate_tier_id', 'affiliate_tiers.id')
        .where('users.id', userId)
        .select(
          'users.*',
          'affiliate_tiers.name as tier_name',
          'affiliate_tiers.commission_rate'
        )
        .first();

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Buscar saldos atuais
      const balances = await this.getUserBalances(userId);

      // Buscar transações de saldo pré-pago
      let prepaidQuery = db('prepaid_transactions')
        .where('user_id', userId)
        .orderBy('created_at', 'desc');

      // Buscar logs de operações
      let operationsQuery = db('operation_logs')
        .where('user_id', userId)
        .orderBy('created_at', 'desc');

      // Buscar pagamentos
      let paymentsQuery = db('payments')
        .where('user_id', userId)
        .where('status', 'succeeded')
        .orderBy('created_at', 'desc');

      // Buscar saques
      let withdrawalsQuery = db('withdrawal_requests')
        .where('user_id', userId)
        .orderBy('created_at', 'desc');

      // Aplicar filtros de data
      if (start_date) {
        prepaidQuery = prepaidQuery.where('created_at', '>=', start_date);
        operationsQuery = operationsQuery.where('created_at', '>=', start_date);
        paymentsQuery = paymentsQuery.where('created_at', '>=', start_date);
        withdrawalsQuery = withdrawalsQuery.where('created_at', '>=', start_date);
      }

      if (end_date) {
        prepaidQuery = prepaidQuery.where('created_at', '<=', end_date);
        operationsQuery = operationsQuery.where('created_at', '<=', end_date);
        paymentsQuery = paymentsQuery.where('created_at', '<=', end_date);
        withdrawalsQuery = withdrawalsQuery.where('created_at', '<=', end_date);
      }

      // Aplicar filtro de moeda
      if (currency !== 'all') {
        prepaidQuery = prepaidQuery.where('currency', currency);
        operationsQuery = operationsQuery.where('currency', currency);
        paymentsQuery = paymentsQuery.where('currency', currency);
        withdrawalsQuery = withdrawalsQuery.where('currency', currency);
      }

      // Executar queries
      const [prepaidTransactions, operations, payments, withdrawals] = await Promise.all([
        prepaidQuery.limit(limit).offset(offset),
        operationsQuery.limit(limit).offset(offset),
        paymentsQuery.limit(limit).offset(offset),
        withdrawalsQuery.limit(limit).offset(offset)
      ]);

      // Combinar e organizar transações por data
      const allTransactions = [];

      // Adicionar transações pré-pagas
      prepaidTransactions.forEach(transaction => {
        allTransactions.push({
          id: transaction.id,
          type: 'prepaid_transaction',
          category: transaction.type, // credit, debit, bonus, refund, fee
          amount: parseFloat(transaction.amount),
          currency: transaction.currency,
          balance_before: parseFloat(transaction.balance_before),
          balance_after: parseFloat(transaction.balance_after),
          description: transaction.description,
          reference_id: transaction.reference_id,
          created_at: transaction.created_at,
          metadata: JSON.parse(transaction.metadata || '{}')
        });
      });

      // Adicionar operações
      operations.forEach(operation => {
        allTransactions.push({
          id: operation.id,
          type: 'operation',
          category: operation.operation_direction, // debit, credit
          operation_type: operation.operation_type,
          amount: parseFloat(operation.amount),
          currency: operation.currency,
          balance_before: parseFloat(operation.balance_before),
          balance_after: parseFloat(operation.balance_after),
          description: operation.description || `Operação ${operation.operation_type}`,
          allowed: operation.allowed,
          reason: operation.reason,
          created_at: operation.created_at,
          metadata: JSON.parse(operation.metadata || '{}')
        });
      });

      // Adicionar pagamentos
      payments.forEach(payment => {
        allTransactions.push({
          id: payment.id,
          type: 'payment',
          category: 'credit',
          payment_type: payment.type,
          amount: parseFloat(payment.amount),
          currency: payment.currency,
          description: payment.description || `Pagamento ${payment.type}`,
          payment_method: payment.payment_method,
          stripe_payment_intent_id: payment.stripe_payment_intent_id,
          created_at: payment.created_at,
          paid_at: payment.paid_at,
          metadata: JSON.parse(payment.metadata || '{}')
        });
      });

      // Adicionar saques
      withdrawals.forEach(withdrawal => {
        allTransactions.push({
          id: withdrawal.id,
          type: 'withdrawal',
          category: 'debit',
          amount: parseFloat(withdrawal.amount),
          net_amount: parseFloat(withdrawal.net_amount),
          fee_amount: parseFloat(withdrawal.fee_amount),
          currency: withdrawal.currency,
          status: withdrawal.status,
          withdrawal_type: withdrawal.withdrawal_type,
          description: `Saque ${withdrawal.withdrawal_type}`,
          created_at: withdrawal.created_at,
          processed_at: withdrawal.processed_at,
          bank_details: withdrawal.bank_details,
          pix_key: withdrawal.pix_key
        });
      });

      // Ordenar por data (mais recente primeiro)
      allTransactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Aplicar filtro de tipo de transação
      let filteredTransactions = allTransactions;
      if (transaction_type && transaction_type !== 'all') {
        if (transaction_type === 'debit') {
          filteredTransactions = allTransactions.filter(t => 
            t.category === 'debit' || (t.type === 'operation' && t.operation_direction === 'debit')
          );
        } else if (transaction_type === 'credit') {
          filteredTransactions = allTransactions.filter(t => 
            t.category === 'credit' || (t.type === 'operation' && t.operation_direction === 'credit')
          );
        }
      }

      // Paginação final
      const paginatedTransactions = filteredTransactions.slice(0, limit);

      // Calcular resumo do período
      const summary = this.calculatePeriodSummary(allTransactions, currency);

      return {
        user_info: {
          id: userId,
          name: user.name,
          email: user.email,
          account_status: user.account_status,
          tier: user.tier_name || 'normal',
          commission_rate: user.commission_rate ? 
            `${(user.commission_rate * 100).toFixed(2)}%` : '1.5%'
        },
        current_balances: balances,
        period_summary: summary,
        transactions: paginatedTransactions,
        pagination: {
          page,
          limit,
          total_found: filteredTransactions.length,
          has_more: filteredTransactions.length > limit
        },
        filters_applied: {
          start_date,
          end_date,
          transaction_type,
          currency
        },
        generated_at: new Date()
      };

    } catch (error) {
      logger.error('Erro ao gerar extrato do usuário:', error);
      throw error;
    }
  }

  /**
   * Obter extrato de afiliado
   */
  static async getAffiliateStatement(affiliateId, options = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        start_date,
        end_date,
        status = 'all', // 'all', 'paid', 'pending', 'cancelled'
        currency = 'all'
      } = options;

      const offset = (page - 1) * limit;

      // Buscar dados do afiliado
      const affiliate = await db('users')
        .leftJoin('affiliate_tiers', 'users.affiliate_tier_id', 'affiliate_tiers.id')
        .where('users.id', affiliateId)
        .select(
          'users.*',
          'affiliate_tiers.name as tier_name',
          'affiliate_tiers.commission_rate'
        )
        .first();

      if (!affiliate) {
        throw new Error('Afiliado não encontrado');
      }

      // Buscar comissões do afiliado
      let commissionsQuery = db('affiliate_commissions')
        .leftJoin('users', 'affiliate_commissions.user_id', 'users.id')
        .where('affiliate_commissions.affiliate_id', affiliateId)
        .select(
          'affiliate_commissions.*',
          'users.name as referred_user_name',
          'users.email as referred_user_email'
        )
        .orderBy('affiliate_commissions.created_at', 'desc');

      // Buscar saques de comissão
      let withdrawalsQuery = db('withdrawal_requests')
        .where('user_id', affiliateId)
        .where('withdrawal_type', 'affiliate_commission')
        .orderBy('created_at', 'desc');

      // Aplicar filtros
      if (start_date) {
        commissionsQuery = commissionsQuery.where('affiliate_commissions.created_at', '>=', start_date);
        withdrawalsQuery = withdrawalsQuery.where('created_at', '>=', start_date);
      }

      if (end_date) {
        commissionsQuery = commissionsQuery.where('affiliate_commissions.created_at', '<=', end_date);
        withdrawalsQuery = withdrawalsQuery.where('created_at', '<=', end_date);
      }

      if (status !== 'all') {
        commissionsQuery = commissionsQuery.where('affiliate_commissions.status', status);
      }

      if (currency !== 'all') {
        commissionsQuery = commissionsQuery.where('affiliate_commissions.currency', currency);
        withdrawalsQuery = withdrawalsQuery.where('currency', currency);
      }

      // Executar queries
      const [commissions, withdrawals, totalCommissionsResult, availableBalance] = await Promise.all([
        commissionsQuery.limit(limit).offset(offset),
        withdrawalsQuery.limit(limit).offset(offset),
        this.getTotalCommissions(affiliateId, { status: 'paid', currency }),
        this.getAffiliateAvailableBalance(affiliateId)
      ]);

      // Buscar usuários indicados
      const referredUsers = await db('users')
        .where('referred_by', affiliateId)
        .select('id', 'name', 'email', 'created_at', 'account_status')
        .orderBy('created_at', 'desc');

      // Organizar transações
      const transactions = [];

      // Adicionar comissões
      commissions.forEach(commission => {
        transactions.push({
          id: commission.id,
          type: 'commission',
          category: 'credit',
          amount: parseFloat(commission.commission_amount),
          currency: commission.currency.toUpperCase(),
          commission_rate: commission.commission_rate,
          tier_name: commission.tier_name,
          status: commission.status,
          referred_user: {
            name: commission.referred_user_name,
            email: commission.referred_user_email
          },
          operation_data: JSON.parse(commission.operation_data || '{}'),
          description: `Comissão de ${commission.tier_name} - ${commission.referred_user_name}`,
          created_at: commission.created_at,
          paid_at: commission.paid_at
        });
      });

      // Adicionar saques
      withdrawals.forEach(withdrawal => {
        transactions.push({
          id: withdrawal.id,
          type: 'withdrawal',
          category: 'debit',
          amount: parseFloat(withdrawal.amount),
          net_amount: parseFloat(withdrawal.net_amount),
          fee_amount: parseFloat(withdrawal.fee_amount),
          currency: withdrawal.currency,
          status: withdrawal.status,
          description: 'Saque de comissões',
          created_at: withdrawal.created_at,
          processed_at: withdrawal.processed_at
        });
      });

      // Ordenar por data
      transactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Calcular estatísticas
      const stats = await this.getAffiliateStats(affiliateId);

      return {
        affiliate_info: {
          id: affiliateId,
          name: affiliate.name,
          email: affiliate.email,
          tier: affiliate.tier_name || 'normal',
          commission_rate: affiliate.commission_rate ? 
            `${(affiliate.commission_rate * 100).toFixed(2)}%` : '1.5%',
          total_referred: referredUsers.length
        },
        financial_summary: {
          total_commissions: totalCommissionsResult,
          available_balance: availableBalance,
          total_withdrawn: await this.getTotalWithdrawn(affiliateId),
          pending_commissions: await this.getPendingCommissions(affiliateId)
        },
        performance_stats: stats,
        referred_users: referredUsers.slice(0, 10), // Últimos 10
        transactions: transactions,
        pagination: {
          page,
          limit,
          total_found: transactions.length,
          has_more: transactions.length === limit
        },
        filters_applied: {
          start_date,
          end_date,
          status,
          currency
        },
        generated_at: new Date()
      };

    } catch (error) {
      logger.error('Erro ao gerar extrato de afiliado:', error);
      throw error;
    }
  }

  /**
   * Exportar extrato em diferentes formatos
   */
  static async exportStatement(userId, type = 'user', format = 'json', options = {}) {
    try {
      let statementData;
      
      if (type === 'user') {
        statementData = await this.getUserStatement(userId, { ...options, limit: 1000 });
      } else if (type === 'affiliate') {
        statementData = await this.getAffiliateStatement(userId, { ...options, limit: 1000 });
      }

      if (format === 'csv') {
        return this.convertToCSV(statementData);
      } else if (format === 'pdf') {
        return this.convertToPDF(statementData);
      } else {
        return statementData;
      }

    } catch (error) {
      logger.error('Erro ao exportar extrato:', error);
      throw error;
    }
  }

  /**
   * Buscar saldos atuais do usuário
   */
  static async getUserBalances(userId) {
    const balances = await db('user_prepaid_balance')
      .where('user_id', userId)
      .select('currency', 'balance', 'pending_balance', 'last_transaction_at');

    const formattedBalances = {};
    balances.forEach(balance => {
      formattedBalances[balance.currency] = {
        available: parseFloat(balance.balance),
        pending: parseFloat(balance.pending_balance),
        last_transaction: balance.last_transaction_at
      };
    });

    return formattedBalances;
  }

  /**
   * Calcular resumo do período
   */
  static calculatePeriodSummary(transactions, currency) {
    let totalCredits = 0;
    let totalDebits = 0;
    let totalOperations = 0;
    let profitableOperations = 0;

    transactions.forEach(transaction => {
      if (currency === 'all' || transaction.currency === currency) {
        if (transaction.category === 'credit') {
          totalCredits += transaction.amount;
        } else if (transaction.category === 'debit') {
          totalDebits += transaction.amount;
        }

        if (transaction.type === 'operation') {
          totalOperations++;
          if (transaction.category === 'credit') {
            profitableOperations++;
          }
        }
      }
    });

    return {
      total_credits: parseFloat(totalCredits.toFixed(2)),
      total_debits: parseFloat(totalDebits.toFixed(2)),
      net_result: parseFloat((totalCredits - totalDebits).toFixed(2)),
      total_operations: totalOperations,
      profitable_operations: profitableOperations,
      success_rate: totalOperations > 0 ? 
        `${((profitableOperations / totalOperations) * 100).toFixed(2)}%` : '0%'
    };
  }

  /**
   * Obter total de comissões do afiliado
   */
  static async getTotalCommissions(affiliateId, filters = {}) {
    let query = db('affiliate_commissions')
      .where('affiliate_id', affiliateId);

    if (filters.status) {
      query = query.where('status', filters.status);
    }

    if (filters.currency && filters.currency !== 'all') {
      query = query.where('currency', filters.currency);
    }

    const result = await query
      .sum('commission_amount as total')
      .first();

    return parseFloat(result.total || 0);
  }

  /**
   * Obter saldo disponível do afiliado
   */
  static async getAffiliateAvailableBalance(affiliateId) {
    const [totalEarned, totalWithdrawn] = await Promise.all([
      this.getTotalCommissions(affiliateId, { status: 'paid' }),
      this.getTotalWithdrawn(affiliateId)
    ]);

    return parseFloat((totalEarned - totalWithdrawn).toFixed(2));
  }

  /**
   * Obter total sacado pelo afiliado
   */
  static async getTotalWithdrawn(affiliateId) {
    const result = await db('withdrawal_requests')
      .where('user_id', affiliateId)
      .where('withdrawal_type', 'affiliate_commission')
      .where('status', 'completed')
      .sum('net_amount as total')
      .first();

    return parseFloat(result.total || 0);
  }

  /**
   * Obter comissões pendentes
   */
  static async getPendingCommissions(affiliateId) {
    return await this.getTotalCommissions(affiliateId, { status: 'pending' });
  }

  /**
   * Obter estatísticas de performance do afiliado
   */
  static async getAffiliateStats(affiliateId) {
    const [
      totalReferred,
      activeUsers,
      thisMonthCommissions,
      lastMonthCommissions
    ] = await Promise.all([
      db('users').where('referred_by', affiliateId).count('* as count').first(),
      db('users').where('referred_by', affiliateId).where('account_status', 'active').count('* as count').first(),
      this.getMonthlyCommissions(affiliateId, 0), // Mês atual
      this.getMonthlyCommissions(affiliateId, 1)  // Mês anterior
    ]);

    const conversionRate = totalReferred.count > 0 ? 
      (activeUsers.count / totalReferred.count * 100).toFixed(2) : '0';

    const growth = lastMonthCommissions > 0 ? 
      (((thisMonthCommissions - lastMonthCommissions) / lastMonthCommissions) * 100).toFixed(2) : '0';

    return {
      total_referred: parseInt(totalReferred.count),
      active_users: parseInt(activeUsers.count),
      conversion_rate: `${conversionRate}%`,
      this_month_commissions: thisMonthCommissions,
      last_month_commissions: lastMonthCommissions,
      monthly_growth: `${growth}%`
    };
  }

  /**
   * Obter comissões mensais
   */
  static async getMonthlyCommissions(affiliateId, monthsBack = 0) {
    const date = new Date();
    date.setMonth(date.getMonth() - monthsBack);
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

    const result = await db('affiliate_commissions')
      .where('affiliate_id', affiliateId)
      .where('status', 'paid')
      .whereBetween('created_at', [startOfMonth, endOfMonth])
      .sum('commission_amount as total')
      .first();

    return parseFloat(result.total || 0);
  }

  /**
   * Converter para CSV (implementação básica)
   */
  static convertToCSV(statementData) {
    // Implementação simplificada - pode ser expandida
    const headers = ['Data', 'Tipo', 'Descrição', 'Valor', 'Moeda', 'Status'];
    const rows = statementData.transactions.map(transaction => [
      transaction.created_at,
      transaction.type,
      transaction.description,
      transaction.amount,
      transaction.currency,
      transaction.status || transaction.category
    ]);

    return {
      headers,
      rows,
      format: 'csv'
    };
  }

  /**
   * Converter para PDF (placeholder)
   */
  static convertToPDF(statementData) {
    // Implementação futura com biblioteca de PDF
    return {
      message: 'PDF export will be implemented',
      data: statementData
    };
  }
}

export default FinancialStatementService;
