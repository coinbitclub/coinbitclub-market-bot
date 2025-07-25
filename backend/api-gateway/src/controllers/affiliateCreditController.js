import AffiliateCreditService from '../services/affiliateCreditService.js';
import logger from '../../../common/logger.js';

/**
 * Controller para Sistema de Crédito de Afiliados
 */
export class AffiliateCreditController {

  /**
   * Obter saldo de crédito disponível
   * GET /api/affiliate/credit/balance
   */
  static async getCreditBalance(req, res) {
    try {
      const affiliateId = req.user.id;

      // Verificar se usuário é afiliado
      if (!req.user.affiliate_tier_id) {
        return res.status(403).json({
          success: false,
          message: 'Usuário não é um afiliado'
        });
      }

      const creditBalance = await AffiliateCreditService.getAvailableCreditBalance(affiliateId);

      logger.info('Saldo de crédito consultado', { affiliateId });

      res.json({
        success: true,
        data: creditBalance
      });

    } catch (error) {
      logger.error('Erro ao obter saldo de crédito:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Usar comissão como crédito
   * POST /api/affiliate/credit/use
   */
  static async useCredit(req, res) {
    try {
      const affiliateId = req.user.id;
      const { amount, description } = req.body;

      // Verificar se usuário é afiliado
      if (!req.user.affiliate_tier_id) {
        return res.status(403).json({
          success: false,
          message: 'Usuário não é um afiliado'
        });
      }

      // Validar amount
      if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valor deve ser um número positivo'
        });
      }

      // Verificar valor mínimo (R$ 10)
      if (amount < 10) {
        return res.status(400).json({
          success: false,
          message: 'Valor mínimo para uso de crédito é R$ 10,00'
        });
      }

      // Verificar se pode usar o crédito
      const canUse = await AffiliateCreditService.canUseCredit(affiliateId, amount);
      
      if (!canUse.can_use) {
        return res.status(400).json({
          success: false,
          message: `Saldo insuficiente. Disponível: R$ ${canUse.available_balance.toFixed(2)}`,
          data: {
            available_balance: canUse.available_balance,
            requested_amount: amount,
            difference: canUse.difference
          }
        });
      }

      const result = await AffiliateCreditService.useCommissionAsCredit(
        affiliateId, 
        amount, 
        description
      );

      logger.info('Comissão usada como crédito', {
        affiliateId,
        amount,
        creditUsageId: result.credit_usage_id
      });

      res.json({
        success: true,
        message: `R$ ${amount.toFixed(2)} convertidos em crédito de US$ ${result.amount_credited_usd.toFixed(2)}`,
        data: result
      });

    } catch (error) {
      logger.error('Erro ao usar comissão como crédito:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Simular conversão de crédito
   * POST /api/affiliate/credit/simulate
   */
  static async simulateConversion(req, res) {
    try {
      const affiliateId = req.user.id;
      const { amount } = req.body;

      // Verificar se usuário é afiliado
      if (!req.user.affiliate_tier_id) {
        return res.status(403).json({
          success: false,
          message: 'Usuário não é um afiliado'
        });
      }

      // Validar amount
      if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valor deve ser um número positivo'
        });
      }

      const simulation = await AffiliateCreditService.simulateCreditConversion(affiliateId, amount);

      res.json({
        success: true,
        data: simulation
      });

    } catch (error) {
      logger.error('Erro ao simular conversão:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obter histórico de uso de crédito
   * GET /api/affiliate/credit/history
   */
  static async getCreditHistory(req, res) {
    try {
      const affiliateId = req.user.id;
      const {
        page = 1,
        limit = 20,
        start_date,
        end_date,
        status = 'all'
      } = req.query;

      // Verificar se usuário é afiliado
      if (!req.user.affiliate_tier_id) {
        return res.status(403).json({
          success: false,
          message: 'Usuário não é um afiliado'
        });
      }

      // Validar parâmetros
      if (page < 1 || limit < 1 || limit > 100) {
        return res.status(400).json({
          success: false,
          message: 'Parâmetros de paginação inválidos'
        });
      }

      const history = await AffiliateCreditService.getCreditUsageHistory(affiliateId, {
        page: parseInt(page),
        limit: parseInt(limit),
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        status
      });

      res.json({
        success: true,
        data: history
      });

    } catch (error) {
      logger.error('Erro ao obter histórico de crédito:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Cancelar uso de crédito pendente
   * DELETE /api/affiliate/credit/usage/:id
   */
  static async cancelCreditUsage(req, res) {
    try {
      const affiliateId = req.user.id;
      const { id } = req.params;

      // Verificar se usuário é afiliado
      if (!req.user.affiliate_tier_id) {
        return res.status(403).json({
          success: false,
          message: 'Usuário não é um afiliado'
        });
      }

      // Validar ID
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID do uso de crédito é obrigatório'
        });
      }

      const result = await AffiliateCreditService.cancelPendingCreditUsage(affiliateId, id);

      logger.info('Uso de crédito cancelado', {
        affiliateId,
        creditUsageId: id
      });

      res.json({
        success: true,
        message: `Uso de crédito cancelado. R$ ${result.cancelled_amount.toFixed(2)} disponível novamente`,
        data: result
      });

    } catch (error) {
      logger.error('Erro ao cancelar uso de crédito:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obter estatísticas de uso de crédito
   * GET /api/affiliate/credit/stats
   */
  static async getCreditStats(req, res) {
    try {
      const affiliateId = req.user.id;

      // Verificar se usuário é afiliado
      if (!req.user.affiliate_tier_id) {
        return res.status(403).json({
          success: false,
          message: 'Usuário não é um afiliado'
        });
      }

      const stats = await AffiliateCreditService.getCreditUsageStats(affiliateId);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('Erro ao obter estatísticas de crédito:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obter dashboard completo de crédito
   * GET /api/affiliate/credit/dashboard
   */
  static async getCreditDashboard(req, res) {
    try {
      const affiliateId = req.user.id;

      // Verificar se usuário é afiliado
      if (!req.user.affiliate_tier_id) {
        return res.status(403).json({
          success: false,
          message: 'Usuário não é um afiliado'
        });
      }

      // Buscar dados em paralelo
      const [
        creditBalance,
        stats,
        recentHistory,
        conversionRate
      ] = await Promise.all([
        AffiliateCreditService.getAvailableCreditBalance(affiliateId),
        AffiliateCreditService.getCreditUsageStats(affiliateId),
        AffiliateCreditService.getCreditUsageHistory(affiliateId, { limit: 5 }),
        AffiliateCreditService.getCurrentConversionRate()
      ]);

      const dashboard = {
        balance: creditBalance,
        statistics: stats,
        recent_usage: recentHistory.usage_history,
        conversion_info: {
          current_rate: conversionRate,
          rate_description: '1 BRL = ' + conversionRate.toFixed(4) + ' USD',
          last_updated: new Date()
        },
        quick_actions: {
          min_conversion: 10,
          suggested_amounts: [50, 100, 250, 500],
          max_available: creditBalance.available_for_credit
        }
      };

      res.json({
        success: true,
        data: dashboard
      });

    } catch (error) {
      logger.error('Erro ao obter dashboard de crédito:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obter taxa de conversão atual
   * GET /api/affiliate/credit/conversion-rate
   */
  static async getConversionRate(req, res) {
    try {
      const conversionRate = await AffiliateCreditService.getCurrentConversionRate();

      res.json({
        success: true,
        data: {
          brl_to_usd: conversionRate,
          usd_to_brl: 1 / conversionRate,
          description: `1 BRL = ${conversionRate.toFixed(4)} USD`,
          last_updated: new Date()
        }
      });

    } catch (error) {
      logger.error('Erro ao obter taxa de conversão:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

export default AffiliateCreditController;
