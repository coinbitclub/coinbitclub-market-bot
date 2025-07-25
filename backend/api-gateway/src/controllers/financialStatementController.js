import FinancialStatementService from '../services/financialStatementService.js';
import logger from '../../../common/logger.js';

/**
 * Controller para Extratos Financeiros
 */
export class FinancialStatementController {

  /**
   * Obter extrato do usuário
   * GET /api/financial/statement/user
   */
  static async getUserStatement(req, res) {
    try {
      const userId = req.user.id;
      const {
        page = 1,
        limit = 50,
        start_date,
        end_date,
        transaction_type = 'all',
        currency = 'all'
      } = req.query;

      // Validar parâmetros
      if (page < 1 || limit < 1 || limit > 100) {
        return res.status(400).json({
          success: false,
          message: 'Parâmetros de paginação inválidos'
        });
      }

      // Validar datas
      if (start_date && isNaN(Date.parse(start_date))) {
        return res.status(400).json({
          success: false,
          message: 'Data de início inválida'
        });
      }

      if (end_date && isNaN(Date.parse(end_date))) {
        return res.status(400).json({
          success: false,
          message: 'Data de fim inválida'
        });
      }

      const statement = await FinancialStatementService.getUserStatement(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        transaction_type,
        currency
      });

      logger.info(`Extrato de usuário gerado`, {
        userId,
        page,
        transactionsCount: statement.transactions.length
      });

      res.json({
        success: true,
        data: statement
      });

    } catch (error) {
      logger.error('Erro ao obter extrato do usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obter extrato de afiliado
   * GET /api/financial/statement/affiliate
   */
  static async getAffiliateStatement(req, res) {
    try {
      const userId = req.user.id;
      const {
        page = 1,
        limit = 50,
        start_date,
        end_date,
        status = 'all',
        currency = 'all'
      } = req.query;

      // Verificar se usuário tem permissão de afiliado
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

      const statement = await FinancialStatementService.getAffiliateStatement(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        status,
        currency
      });

      logger.info(`Extrato de afiliado gerado`, {
        affiliateId: userId,
        page,
        transactionsCount: statement.transactions.length
      });

      res.json({
        success: true,
        data: statement
      });

    } catch (error) {
      logger.error('Erro ao obter extrato de afiliado:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Exportar extrato
   * GET /api/financial/statement/export
   */
  static async exportStatement(req, res) {
    try {
      const userId = req.user.id;
      const {
        type = 'user', // 'user' ou 'affiliate'
        format = 'json', // 'json', 'csv', 'pdf'
        start_date,
        end_date,
        transaction_type = 'all',
        currency = 'all'
      } = req.query;

      // Validar tipo
      if (!['user', 'affiliate'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de extrato inválido'
        });
      }

      // Validar formato
      if (!['json', 'csv', 'pdf'].includes(format)) {
        return res.status(400).json({
          success: false,
          message: 'Formato de exportação inválido'
        });
      }

      // Verificar permissão para extrato de afiliado
      if (type === 'affiliate' && !req.user.affiliate_tier_id) {
        return res.status(403).json({
          success: false,
          message: 'Usuário não é um afiliado'
        });
      }

      const exportedData = await FinancialStatementService.exportStatement(userId, type, format, {
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        transaction_type,
        currency
      });

      // Configurar headers para download
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="extrato_${type}_${userId}_${Date.now()}.csv"`);
      } else if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="extrato_${type}_${userId}_${Date.now()}.pdf"`);
      }

      logger.info(`Extrato exportado`, {
        userId,
        type,
        format
      });

      res.json({
        success: true,
        data: exportedData,
        export_info: {
          type,
          format,
          generated_at: new Date(),
          user_id: userId
        }
      });

    } catch (error) {
      logger.error('Erro ao exportar extrato:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obter resumo financeiro rápido
   * GET /api/financial/summary
   */
  static async getFinancialSummary(req, res) {
    try {
      const userId = req.user.id;
      const { period = '30d' } = req.query; // 7d, 30d, 90d, 1y

      let startDate;
      const endDate = new Date();

      switch (period) {
        case '7d':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      }

      // Obter extrato simplificado
      const statement = await FinancialStatementService.getUserStatement(userId, {
        start_date: startDate,
        end_date: endDate,
        limit: 1000 // Para calcular resumo completo
      });

      // Preparar resumo
      const summary = {
        period: {
          start: startDate,
          end: endDate,
          label: period
        },
        current_balances: statement.current_balances,
        period_summary: statement.period_summary,
        recent_transactions: statement.transactions.slice(0, 5), // Últimas 5
        user_info: {
          account_status: statement.user_info.account_status,
          tier: statement.user_info.tier
        }
      };

      // Se for afiliado, adicionar dados de afiliado
      if (req.user.affiliate_tier_id) {
        try {
          const affiliateStatement = await FinancialStatementService.getAffiliateStatement(userId, {
            start_date: startDate,
            end_date: endDate,
            limit: 100
          });

          summary.affiliate_summary = {
            financial_summary: affiliateStatement.financial_summary,
            performance_stats: affiliateStatement.performance_stats,
            recent_commissions: affiliateStatement.transactions
              .filter(t => t.type === 'commission')
              .slice(0, 3)
          };
        } catch (affiliateError) {
          logger.warn('Erro ao obter dados de afiliado no resumo:', affiliateError);
        }
      }

      res.json({
        success: true,
        data: summary
      });

    } catch (error) {
      logger.error('Erro ao obter resumo financeiro:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obter estatísticas detalhadas para admin
   * GET /api/admin/financial/stats
   */
  static async getAdminFinancialStats(req, res) {
    try {
      // Verificar se é admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado'
        });
      }

      const { period = '30d', user_id } = req.query;

      // Implementar estatísticas administrativas
      // Esta é uma implementação básica - pode ser expandida

      const stats = {
        period,
        generated_at: new Date(),
        message: 'Estatísticas administrativas em desenvolvimento'
      };

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('Erro ao obter estatísticas administrativas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obter detalhes de uma transação específica
   * GET /api/financial/transaction/:id
   */
  static async getTransactionDetails(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { type } = req.query; // 'payment', 'operation', 'withdrawal', etc.

      if (!id || !type) {
        return res.status(400).json({
          success: false,
          message: 'ID da transação e tipo são obrigatórios'
        });
      }

      let transaction = null;
      let tableName;
      
      // Definir tabela baseada no tipo
      switch (type) {
        case 'payment':
          tableName = 'payments';
          break;
        case 'operation':
          tableName = 'operation_logs';
          break;
        case 'withdrawal':
          tableName = 'withdrawal_requests';
          break;
        case 'prepaid':
          tableName = 'prepaid_transactions';
          break;
        case 'commission':
          tableName = 'affiliate_commissions';
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Tipo de transação inválido'
          });
      }

      // Buscar transação
      let query = db(tableName).where('id', id);

      // Adicionar filtro de usuário para segurança
      if (type === 'commission') {
        query = query.where('affiliate_id', userId);
      } else {
        query = query.where('user_id', userId);
      }

      transaction = await query.first();

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transação não encontrada'
        });
      }

      // Adicionar informações extras baseadas no tipo
      let additionalInfo = {};

      if (type === 'commission' && transaction.user_id) {
        const referredUser = await db('users')
          .where('id', transaction.user_id)
          .select('name', 'email')
          .first();
        
        additionalInfo.referred_user = referredUser;
      }

      res.json({
        success: true,
        data: {
          transaction,
          type,
          additional_info: additionalInfo,
          fetched_at: new Date()
        }
      });

    } catch (error) {
      logger.error('Erro ao obter detalhes da transação:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

export default FinancialStatementController;
