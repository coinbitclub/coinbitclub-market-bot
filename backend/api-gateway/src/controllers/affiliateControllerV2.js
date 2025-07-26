import { query } from '../config/database.js';
import crypto from 'crypto';
import emailService from '../services/emailService.js';

class AffiliateControllerV2 {
  // GET /affiliate/dashboard - Dashboard do afiliado
  async getDashboard(req, res) {
    try {
      const usuario_id = req.user.id;

      // Verificar se é afiliado
      const userProfile = await query(`
        SELECT perfil FROM user_profiles WHERE user_id = $1
      `, [usuario_id]);

      if (!userProfile.rows[0] || !['afiliado_normal', 'afiliado_vip'].includes(userProfile.rows[0].perfil)) {
        return res.status(403).json({
          success: false,
          error: 'Acesso negado: usuário não é afiliado'
        });
      }

      // Estatísticas do afiliado
      const stats = await query(`
        SELECT 
          (SELECT COUNT(*) FROM users WHERE referral_code = 
            (SELECT referral_code FROM user_profiles WHERE user_id = $1)
          ) as total_indicacoes,
          
          (SELECT COUNT(*) FROM users u 
           JOIN user_subscriptions us ON u.id = us.user_id 
           WHERE u.referral_code = 
             (SELECT referral_code FROM user_profiles WHERE user_id = $1)
           AND us.status = 'ativa'
          ) as indicacoes_ativas,
          
          (SELECT COALESCE(SUM(valor_comissao), 0) FROM affiliate_commissions 
           WHERE afiliado_id = $1
          ) as total_comissoes,
          
          (SELECT COALESCE(SUM(valor_comissao), 0) FROM affiliate_commissions 
           WHERE afiliado_id = $1 AND status = 'pendente'
          ) as comissoes_pendentes,
          
          (SELECT COALESCE(SUM(valor_comissao), 0) FROM affiliate_commissions 
           WHERE afiliado_id = $1 AND status = 'aprovada'
          ) as comissoes_aprovadas,
          
          (SELECT COALESCE(SUM(valor_comissao), 0) FROM affiliate_commissions 
           WHERE afiliado_id = $1 AND status = 'paga'
          ) as comissoes_pagas
      `, [usuario_id]);

      // Últimas indicações
      const recentReferrals = await query(`
        SELECT 
          u.email,
          up.nome_completo,
          u.created_at,
          CASE WHEN us.id IS NOT NULL THEN 'Assinante' ELSE 'Cadastrado' END as status
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        LEFT JOIN user_subscriptions us ON u.id = us.user_id AND us.status = 'ativa'
        WHERE u.referral_code = (
          SELECT referral_code FROM user_profiles WHERE user_id = $1
        )
        ORDER BY u.created_at DESC
        LIMIT 10
      `, [usuario_id]);

      // Comissões recentes
      const recentCommissions = await query(`
        SELECT 
          ac.*,
          u.email as indicado_email,
          p.nome_plano
        FROM affiliate_commissions ac
        JOIN users u ON ac.indicado_id = u.id
        JOIN plans p ON ac.plano_id = p.id
        WHERE ac.afiliado_id = $1
        ORDER BY ac.created_at DESC
        LIMIT 10
      `, [usuario_id]);

      res.json({
        success: true,
        data: {
          estatisticas: stats.rows[0],
          indicacoes_recentes: recentReferrals.rows,
          comissoes_recentes: recentCommissions.rows
        }
      });

    } catch (error) {
      console.error('Erro no dashboard do afiliado:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // GET /affiliate/link - Obter link de indicação
  async getAffiliateLink(req, res) {
    try {
      const usuario_id = req.user.id;

      const result = await query(`
        SELECT referral_code FROM user_profiles WHERE user_id = $1
      `, [usuario_id]);

      if (!result.rows[0] || !result.rows[0].referral_code) {
        return res.status(404).json({
          success: false,
          error: 'Código de indicação não encontrado'
        });
      }

      const baseUrl = process.env.FRONTEND_URL || 'https://coinbitclub.com';
      const affiliateLink = `${baseUrl}/register?ref=${result.rows[0].referral_code}`;

      res.json({
        success: true,
        data: {
          referral_code: result.rows[0].referral_code,
          affiliate_link: affiliateLink,
          qr_code_url: `${baseUrl}/api/affiliate/qr/${result.rows[0].referral_code}`
        }
      });

    } catch (error) {
      console.error('Erro ao obter link de afiliado:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // GET /affiliate/commissions - Listar comissões
  async getCommissions(req, res) {
    try {
      const usuario_id = req.user.id;
      const { status, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE ac.afiliado_id = $1';
      const params = [usuario_id];
      let paramIndex = 2;

      if (status) {
        whereClause += ` AND ac.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      const result = await query(`
        SELECT 
          ac.*,
          u.email as indicado_email,
          up.nome_completo as indicado_nome,
          p.nome_plano,
          p.preco_mensal,
          p.moeda
        FROM affiliate_commissions ac
        JOIN users u ON ac.indicado_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        JOIN plans p ON ac.plano_id = p.id
        ${whereClause}
        ORDER BY ac.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, [...params, limit, offset]);

      // Contar total
      const countResult = await query(`
        SELECT COUNT(*) as total
        FROM affiliate_commissions ac
        ${whereClause}
      `, params.slice(0, -2));

      res.json({
        success: true,
        data: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].total),
          pages: Math.ceil(countResult.rows[0].total / limit)
        }
      });

    } catch (error) {
      console.error('Erro ao listar comissões:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // POST /affiliate/withdraw - Solicitar saque
  async requestWithdraw(req, res) {
    try {
      const usuario_id = req.user.id;
      const { valor_saque, metodo_pagamento, dados_pagamento } = req.body;

      // Validações
      if (!valor_saque || valor_saque <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Valor de saque inválido'
        });
      }

      // Verificar saldo disponível
      const saldoResult = await query(`
        SELECT COALESCE(SUM(valor_comissao), 0) as saldo_aprovado
        FROM affiliate_commissions 
        WHERE afiliado_id = $1 AND status = 'aprovada'
      `, [usuario_id]);

      const saldoDisponivel = parseFloat(saldoResult.rows[0].saldo_aprovado);

      if (valor_saque > saldoDisponivel) {
        return res.status(400).json({
          success: false,
          error: 'Saldo insuficiente para saque',
          saldo_disponivel: saldoDisponivel
        });
      }

      // Criar solicitação de saque
      const withdrawResult = await query(`
        INSERT INTO affiliate_withdrawals (
          afiliado_id, valor_solicitado, metodo_pagamento,
          dados_pagamento, status
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        usuario_id,
        valor_saque,
        metodo_pagamento,
        JSON.stringify(dados_pagamento),
        'pendente'
      ]);

      // Marcar comissões como "em_saque"
      await query(`
        UPDATE affiliate_commissions 
        SET status = 'em_saque'
        WHERE afiliado_id = $1 
        AND status = 'aprovada'
        AND id IN (
          SELECT id FROM affiliate_commissions 
          WHERE afiliado_id = $1 AND status = 'aprovada'
          ORDER BY created_at ASC
          LIMIT (
            SELECT COUNT(*) FROM affiliate_commissions 
            WHERE afiliado_id = $1 AND status = 'aprovada'
            AND valor_comissao <= $2
          )
        )
      `, [usuario_id, valor_saque]);

      res.json({
        success: true,
        data: {
          id: withdrawResult.rows[0].id,
          valor_solicitado: withdrawResult.rows[0].valor_solicitado,
          status: withdrawResult.rows[0].status,
          created_at: withdrawResult.rows[0].created_at
        }
      });

    } catch (error) {
      console.error('Erro ao solicitar saque:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // GET /affiliate/withdrawals - Listar saques
  async getWithdrawals(req, res) {
    try {
      const usuario_id = req.user.id;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const result = await query(`
        SELECT * FROM affiliate_withdrawals 
        WHERE afiliado_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `, [usuario_id, limit, offset]);

      const countResult = await query(`
        SELECT COUNT(*) as total
        FROM affiliate_withdrawals 
        WHERE afiliado_id = $1
      `, [usuario_id]);

      res.json({
        success: true,
        data: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].total),
          pages: Math.ceil(countResult.rows[0].total / limit)
        }
      });

    } catch (error) {
      console.error('Erro ao listar saques:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // GET /affiliate/analytics - Analytics do afiliado
  async getAnalytics(req, res) {
    try {
      const usuario_id = req.user.id;
      const { periodo = '30' } = req.query;

      // Performance mensal
      const monthlyPerformance = await query(`
        SELECT 
          DATE_TRUNC('month', created_at) as mes,
          COUNT(*) as indicacoes,
          COALESCE(SUM(valor_comissao), 0) as comissoes
        FROM affiliate_commissions 
        WHERE afiliado_id = $1
        AND created_at >= CURRENT_DATE - INTERVAL '${periodo} days'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY mes DESC
      `, [usuario_id]);

      // Top planos por comissão
      const topPlans = await query(`
        SELECT 
          p.nome_plano,
          COUNT(*) as indicacoes,
          COALESCE(SUM(ac.valor_comissao), 0) as total_comissoes
        FROM affiliate_commissions ac
        JOIN plans p ON ac.plano_id = p.id
        WHERE ac.afiliado_id = $1
        AND ac.created_at >= CURRENT_DATE - INTERVAL '${periodo} days'
        GROUP BY p.id, p.nome_plano
        ORDER BY total_comissoes DESC
      `, [usuario_id]);

      // Conversão por período
      const conversionStats = await query(`
        SELECT 
          (SELECT COUNT(*) FROM users WHERE referral_code = 
            (SELECT referral_code FROM user_profiles WHERE user_id = $1)
           AND created_at >= CURRENT_DATE - INTERVAL '${periodo} days'
          ) as total_cadastros,
          
          (SELECT COUNT(*) FROM users u 
           JOIN user_subscriptions us ON u.id = us.user_id
           WHERE u.referral_code = 
             (SELECT referral_code FROM user_profiles WHERE user_id = $1)
           AND u.created_at >= CURRENT_DATE - INTERVAL '${periodo} days'
           AND us.status = 'ativa'
          ) as cadastros_convertidos
      `, [usuario_id]);

      const stats = conversionStats.rows[0];
      const taxaConversao = stats.total_cadastros > 0 ? 
        (stats.cadastros_convertidos / stats.total_cadastros * 100).toFixed(2) : 0;

      res.json({
        success: true,
        data: {
          periodo: `${periodo} dias`,
          performance_mensal: monthlyPerformance.rows,
          top_planos: topPlans.rows,
          conversao: {
            total_cadastros: parseInt(stats.total_cadastros),
            cadastros_convertidos: parseInt(stats.cadastros_convertidos),
            taxa_conversao: parseFloat(taxaConversao)
          }
        }
      });

    } catch (error) {
      console.error('Erro nas analytics do afiliado:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // Função para processar comissão (chamada internamente)
  async processCommission(indicadoId, planoId, valorAssinatura) {
    try {
      // Buscar afiliado do usuário indicado
      const userResult = await query(`
        SELECT u.referral_code, up_afiliado.user_id as afiliado_id, up_afiliado.perfil
        FROM users u
        JOIN user_profiles up_indicado ON u.id = up_indicado.user_id
        LEFT JOIN user_profiles up_afiliado ON u.referral_code = up_afiliado.referral_code
        WHERE u.id = $1 AND u.referral_code IS NOT NULL
      `, [indicadoId]);

      if (!userResult.rows[0] || !userResult.rows[0].afiliado_id) {
        console.log('Usuário não tem afiliado válido');
        return false;
      }

      const afiliado = userResult.rows[0];

      // Buscar dados do plano
      const planResult = await query(`
        SELECT * FROM plans WHERE id = $1
      `, [planoId]);

      if (!planResult.rows[0]) {
        console.log('Plano não encontrado');
        return false;
      }

      const plano = planResult.rows[0];

      // Calcular comissão baseada no tipo de afiliado
      let percentualComissao = 0.10; // 10% padrão para afiliado normal

      if (afiliado.perfil === 'afiliado_vip') {
        percentualComissao = 0.15; // 15% para VIP
      }

      // Para planos FLEX, a comissão é 20%
      if (plano.nome_plano.includes('FLEX')) {
        percentualComissao = 0.20;
      }

      const valorComissao = valorAssinatura * percentualComissao;

      // Inserir comissão
      const commissionResult = await query(`
        INSERT INTO affiliate_commissions (
          afiliado_id, indicado_id, plano_id, valor_assinatura,
          percentual_comissao, valor_comissao, moeda, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        afiliado.afiliado_id,
        indicadoId,
        planoId,
        valorAssinatura,
        percentualComissao,
        valorComissao,
        plano.moeda,
        'pendente'
      ]);

      console.log('Comissão processada:', {
        afiliado_id: afiliado.afiliado_id,
        valor_comissao: valorComissao,
        percentual: percentualComissao
      });

      return commissionResult.rows[0];

    } catch (error) {
      console.error('Erro ao processar comissão:', error);
      return false;
    }
  }
}

export default new AffiliateControllerV2();
