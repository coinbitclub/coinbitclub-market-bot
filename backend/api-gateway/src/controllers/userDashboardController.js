import { query } from '../config/database.js';

class UserDashboardController {
  // GET /user/dashboard - Dashboard completo conforme especificação
  async getDashboard(req, res) {
    try {
      const userId = req.user.id;

      // Buscar dados em paralelo para performance
      const [
        userProfile,
        performanceStats,
        balances,
        prepaidBalance,
        activePlan,
        currentAIReading,
        recentOperations
      ] = await Promise.all([
        this.getUserProfile(userId),
        this.getPerformanceStats(userId),
        this.getExchangeBalances(userId),
        this.getPrepaidBalance(userId),
        this.getActivePlan(userId),
        this.getCurrentAIReading(),
        this.getRecentOperations(userId)
      ]);

      // Montar dashboard conforme especificação
      const dashboard = {
        // Informações do usuário
        usuario: {
          nome: userProfile.nome_completo,
          email: userProfile.email,
          perfil: userProfile.perfil,
          dados_validados: userProfile.dados_validados
        },

        // Índice de acerto (especificação)
        indice_acerto: {
          percentual: performanceStats.win_rate || 0,
          total_operacoes: performanceStats.total_operations || 0,
          operacoes_positivas: performanceStats.winning_operations || 0,
          operacoes_negativas: performanceStats.losing_operations || 0
        },

        // Retorno do dia e histórico (especificação)
        retorno: {
          hoje: performanceStats.today_return || 0,
          esta_semana: performanceStats.week_return || 0,
          este_mes: performanceStats.month_return || 0,
          total: performanceStats.total_return || 0,
          moeda: activePlan?.moeda || 'USD'
        },

        // Saldo Bybit/Binance (especificação)
        saldos_exchange: {
          binance: {
            production: balances.binance_prod || 0,
            testnet: balances.binance_test || 0
          },
          bybit: {
            production: balances.bybit_prod || 0,
            testnet: balances.bybit_test || 0
          },
          ultima_atualizacao: balances.last_update
        },

        // Saldo pré-pago (especificação)
        saldo_prepago: {
          brl: prepaidBalance.brl || 0,
          usd: prepaidBalance.usd || 0,
          total_deposits: prepaidBalance.total_deposits || 0,
          total_used: prepaidBalance.total_used || 0
        },

        // Leitura atual da IA e relatório Águia (especificação)
        ia_aguia: {
          leitura_atual: currentAIReading,
          ultimo_relatorio: await this.getLatestAguiaReport(),
          confianca_mercado: currentAIReading?.nivel_confianca || 0,
          direcao_recomendada: currentAIReading?.analise_ia?.tendencia || 'lateral'
        },

        // Plano ativo e comissão aplicada (especificação)
        plano_ativo: {
          nome: activePlan?.name || 'Nenhum',
          tipo: activePlan?.tipo_plano || 'N/A',
          valor_mensal: activePlan?.unit_amount || 0,
          moeda: activePlan?.moeda || 'USD',
          comissao_percentual: activePlan?.comissao_percentual || 0,
          status: activePlan?.status || 'inativo',
          data_vencimento: activePlan?.data_fim
        },

        // Operações recentes
        operacoes_recentes: recentOperations,

        // Status geral
        status_sistema: {
          trading_ativo: true, // Verificar se trading está ativo
          api_keys_configuradas: await this.checkApiKeysConfigured(userId),
          ultima_atividade: performanceStats.last_operation
        }
      };

      res.json({
        success: true,
        data: dashboard
      });

    } catch (error) {
      console.error('Erro no dashboard do usuário:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // Métodos auxiliares
  async getUserProfile(userId) {
    try {
      const result = await query(`
        SELECT 
          u.email,
          up.nome_completo,
          up.perfil,
          up.dados_validados
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE u.id = $1
      `, [userId]);

      return result.rows[0] || {};
    } catch (error) {
      return {};
    }
  }

  async getPerformanceStats(userId) {
    try {
      const result = await query(`
        SELECT 
          COUNT(*) as total_operations,
          COUNT(CASE WHEN profit > 0 THEN 1 END) as winning_operations,
          COUNT(CASE WHEN profit < 0 THEN 1 END) as losing_operations,
          
          -- Índice de acerto
          ROUND(
            CASE WHEN COUNT(*) > 0 
            THEN (COUNT(CASE WHEN profit > 0 THEN 1 END)::DECIMAL / COUNT(*)) * 100 
            ELSE 0 END, 2
          ) as win_rate,
          
          -- Retornos por período
          COALESCE(SUM(CASE WHEN opened_at::DATE = CURRENT_DATE THEN profit ELSE 0 END), 0) as today_return,
          COALESCE(SUM(CASE WHEN opened_at >= CURRENT_DATE - INTERVAL '7 days' THEN profit ELSE 0 END), 0) as week_return,
          COALESCE(SUM(CASE WHEN opened_at >= CURRENT_DATE - INTERVAL '30 days' THEN profit ELSE 0 END), 0) as month_return,
          COALESCE(SUM(profit), 0) as total_return,
          
          MAX(opened_at) as last_operation
          
        FROM operations 
        WHERE user_id = $1 AND status IN ('closed', 'completed')
      `, [userId]);

      return result.rows[0] || {};
    } catch (error) {
      return {};
    }
  }

  async getExchangeBalances(userId) {
    try {
      // Simular busca de saldos das exchanges
      // Em produção, fazer chamadas reais às APIs
      const result = await query(`
        SELECT 
          exchange,
          environment,
          is_active
        FROM user_api_keys 
        WHERE user_id = $1 AND validation_status = 'valid'
      `, [userId]);

      const balances = {
        binance_prod: 0,
        binance_test: 0,
        bybit_prod: 0,
        bybit_test: 0,
        last_update: new Date()
      };

      // TODO: Implementar chamadas reais às APIs das exchanges
      return balances;
    } catch (error) {
      return {
        binance_prod: 0,
        binance_test: 0,
        bybit_prod: 0,
        bybit_test: 0,
        last_update: null
      };
    }
  }

  async getPrepaidBalance(userId) {
    try {
      const result = await query(`
        SELECT 
          currency,
          balance,
          total_deposits,
          total_used_trading
        FROM prepaid_balances 
        WHERE user_id = $1
      `, [userId]);

      const balances = {
        brl: 0,
        usd: 0,
        total_deposits: 0,
        total_used: 0
      };

      result.rows.forEach(row => {
        if (row.currency === 'BRL') {
          balances.brl = parseFloat(row.balance);
        } else if (row.currency === 'USD') {
          balances.usd = parseFloat(row.balance);
        }
        balances.total_deposits += parseFloat(row.total_deposits);
        balances.total_used += parseFloat(row.total_used_trading);
      });

      return balances;
    } catch (error) {
      return {
        brl: 0,
        usd: 0,
        total_deposits: 0,
        total_used: 0
      };
    }
  }

  async getActivePlan(userId) {
    try {
      const result = await query(`
        SELECT 
          p.name,
          p.unit_amount,
          p.currency,
          p.comissao_percentual,
          p.tipo_plano,
          p.moeda,
          us.status,
          us.data_fim
        FROM user_subscriptions us
        JOIN plans p ON us.plan_id = p.id
        WHERE us.user_id = $1 
        AND us.status = 'ativa'
        AND us.data_fim > CURRENT_DATE
        ORDER BY us.created_at DESC
        LIMIT 1
      `, [userId]);

      return result.rows[0] || null;
    } catch (error) {
      return null;
    }
  }

  async getCurrentAIReading() {
    try {
      const result = await query(`
        SELECT 
          simbolo,
          analise_ia,
          nivel_confianca,
          created_at
        FROM ai_market_readings 
        WHERE status = 'ativa'
        ORDER BY created_at DESC
        LIMIT 1
      `);

      return result.rows[0] || null;
    } catch (error) {
      return null;
    }
  }

  async getLatestAguiaReport() {
    try {
      // TODO: Implementar relatórios Águia News
      return {
        titulo: "Relatório não disponível",
        resumo: "Sistema de relatórios em desenvolvimento",
        data: new Date()
      };
    } catch (error) {
      return null;
    }
  }

  async getRecentOperations(userId) {
    try {
      const result = await query(`
        SELECT 
          symbol,
          side,
          entry_price,
          exit_price,
          profit,
          opened_at,
          closed_at,
          status
        FROM operations 
        WHERE user_id = $1
        ORDER BY opened_at DESC
        LIMIT 10
      `, [userId]);

      return result.rows;
    } catch (error) {
      return [];
    }
  }

  async checkApiKeysConfigured(userId) {
    try {
      const result = await query(`
        SELECT COUNT(*) as count
        FROM user_api_keys 
        WHERE user_id = $1 
        AND is_active = true 
        AND validation_status = 'valid'
      `, [userId]);

      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      return false;
    }
  }
}

export default new UserDashboardController();
