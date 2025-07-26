import { query } from '../config/database.js';
import OpenAI from 'openai';

class IAAguilaNewsController {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  // POST /ia-aguia/generate-daily-report - Gerar relatório diário
  async generateDailyReport(req, res) {
    try {
      const { date = new Date().toISOString().split('T')[0] } = req.body;

      console.log(`📊 Gerando relatório diário IA Águia para ${date}`);

      // 1. Coletar dados do mercado
      const marketData = await this.collectMarketData(date);

      // 2. Gerar análise com OpenAI
      const analysis = await this.generateAIAnalysis(marketData);

      // 3. Salvar relatório no banco
      const reportResult = await query(`
        INSERT INTO ia_aguia_reports (
          tipo_relatorio, data_referencia, titulo, conteudo_completo,
          resumo_executivo, principais_insights, recomendacoes,
          dados_mercado, created_at, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, $9)
        RETURNING id
      `, [
        'daily',
        date,
        analysis.title,
        analysis.fullContent,
        analysis.executiveSummary,
        JSON.stringify(analysis.keyInsights),
        JSON.stringify(analysis.recommendations),
        JSON.stringify(marketData),
        'published'
      ]);

      const reportId = reportResult.rows[0].id;

      // 4. Notificar usuários PRO e FLEX
      await this.notifyUsersNewReport(reportId, analysis.title);

      res.json({
        success: true,
        message: 'Relatório diário gerado com sucesso',
        data: {
          report_id: reportId,
          title: analysis.title,
          date: date,
          summary: analysis.executiveSummary
        }
      });

    } catch (error) {
      console.error('Erro ao gerar relatório diário:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // POST /ia-aguia/generate-market-alert - Gerar alerta de mercado
  async generateMarketAlert(req, res) {
    try {
      const { symbols, severity = 'medium', custom_prompt } = req.body;

      if (!symbols || symbols.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Símbolos são obrigatórios para análise'
        });
      }

      console.log(`🚨 Gerando alerta de mercado para: ${symbols.join(', ')}`);

      // 1. Buscar dados recentes dos símbolos
      const symbolsData = await this.getSymbolsCurrentData(symbols);

      // 2. Gerar análise específica
      const alertAnalysis = await this.generateMarketAlert_AI(symbolsData, severity, custom_prompt);

      // 3. Salvar alerta
      const alertResult = await query(`
        INSERT INTO ia_aguia_alerts (
          symbols, severity, titulo, conteudo, recomendacao_acao,
          dados_mercado, created_at, status
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7)
        RETURNING id
      `, [
        JSON.stringify(symbols),
        severity,
        alertAnalysis.title,
        alertAnalysis.content,
        alertAnalysis.actionRecommendation,
        JSON.stringify(symbolsData),
        'active'
      ]);

      const alertId = alertResult.rows[0].id;

      // 4. Notificar usuários baseado na severidade
      if (severity === 'high' || severity === 'critical') {
        await this.notifyUsersMarketAlert(alertId, alertAnalysis.title, severity);
      }

      res.json({
        success: true,
        message: 'Alerta de mercado gerado com sucesso',
        data: {
          alert_id: alertId,
          title: alertAnalysis.title,
          severity: severity,
          symbols: symbols,
          recommendation: alertAnalysis.actionRecommendation
        }
      });

    } catch (error) {
      console.error('Erro ao gerar alerta de mercado:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // GET /ia-aguia/reports - Listar relatórios
  async getReports(req, res) {
    try {
      const { 
        type = 'all', 
        limit = 20, 
        offset = 0,
        date_from,
        date_to 
      } = req.query;

      let whereClause = '1=1';
      let params = [];

      if (type !== 'all') {
        whereClause += ` AND tipo_relatorio = $${params.length + 1}`;
        params.push(type);
      }

      if (date_from) {
        whereClause += ` AND data_referencia >= $${params.length + 1}`;
        params.push(date_from);
      }

      if (date_to) {
        whereClause += ` AND data_referencia <= $${params.length + 1}`;
        params.push(date_to);
      }

      const reports = await query(`
        SELECT 
          id, tipo_relatorio, data_referencia, titulo,
          resumo_executivo, principais_insights, recomendacoes,
          created_at, status, views_count
        FROM ia_aguia_reports
        WHERE ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `, [...params, limit, offset]);

      const totalCount = await query(`
        SELECT COUNT(*) as total
        FROM ia_aguia_reports
        WHERE ${whereClause}
      `, params);

      res.json({
        success: true,
        data: {
          reports: reports.rows,
          pagination: {
            total: parseInt(totalCount.rows[0].total),
            limit: parseInt(limit),
            offset: parseInt(offset),
            has_more: parseInt(offset) + parseInt(limit) < parseInt(totalCount.rows[0].total)
          }
        }
      });

    } catch (error) {
      console.error('Erro ao listar relatórios:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // GET /ia-aguia/reports/:id - Obter relatório específico
  async getReportById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Verificar se usuário tem acesso (PRO ou FLEX)
      const userCheck = await query(`
        SELECT u.id, up.tipo_plano, s.status
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        LEFT JOIN subscriptions s ON u.id = s.user_id
        WHERE u.id = $1 AND s.status = 'active'
        AND up.tipo_plano IN ('PRO', 'FLEX')
      `, [userId]);

      if (userCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'Acesso restrito a usuários PRO e FLEX'
        });
      }

      // Buscar relatório
      const report = await query(`
        SELECT *
        FROM ia_aguia_reports
        WHERE id = $1 AND status = 'published'
      `, [id]);

      if (report.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Relatório não encontrado'
        });
      }

      // Incrementar contador de visualizações
      await query(`
        UPDATE ia_aguia_reports 
        SET views_count = views_count + 1 
        WHERE id = $1
      `, [id]);

      // Registrar visualização do usuário
      await query(`
        INSERT INTO user_report_views (user_id, report_id, viewed_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, report_id) 
        DO UPDATE SET viewed_at = CURRENT_TIMESTAMP
      `, [userId, id]);

      res.json({
        success: true,
        data: report.rows[0]
      });

    } catch (error) {
      console.error('Erro ao obter relatório:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // GET /ia-aguia/alerts/active - Alertas ativos
  async getActiveAlerts(req, res) {
    try {
      const { severity = 'all', limit = 50 } = req.query;

      let whereClause = "status = 'active'";
      let params = [];

      if (severity !== 'all') {
        whereClause += ` AND severity = $${params.length + 1}`;
        params.push(severity);
      }

      const alerts = await query(`
        SELECT 
          id, symbols, severity, titulo, conteudo,
          recomendacao_acao, created_at
        FROM ia_aguia_alerts
        WHERE ${whereClause}
        ORDER BY 
          CASE severity 
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2  
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
          END,
          created_at DESC
        LIMIT $${params.length + 1}
      `, [...params, limit]);

      res.json({
        success: true,
        data: {
          alerts: alerts.rows,
          count_by_severity: await this.getAlertCountsBySeverity()
        }
      });

    } catch (error) {
      console.error('Erro ao obter alertas ativos:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // Métodos auxiliares
  async collectMarketData(date) {
    try {
      // Simular coleta de dados do mercado
      // Em produção, integrar com APIs de mercado (CoinGecko, CoinMarketCap, etc)
      
      const mockData = {
        btc: {
          price: 45000 + Math.random() * 10000,
          change_24h: (Math.random() - 0.5) * 10,
          volume_24h: 25000000000,
          market_cap: 850000000000
        },
        eth: {
          price: 3000 + Math.random() * 1000,
          change_24h: (Math.random() - 0.5) * 15,
          volume_24h: 15000000000,
          market_cap: 360000000000
        },
        market_indicators: {
          fear_greed_index: Math.floor(Math.random() * 100),
          total_market_cap: 2100000000000,
          btc_dominance: 40 + Math.random() * 10
        }
      };

      return mockData;
    } catch (error) {
      console.error('Erro ao coletar dados do mercado:', error);
      return null;
    }
  }

  async generateAIAnalysis(marketData) {
    try {
      const prompt = `
Como IA Águia, analise os seguintes dados de mercado e gere um relatório diário completo:

Dados do Mercado:
${JSON.stringify(marketData, null, 2)}

Gere uma análise estruturada incluindo:
1. Título chamativo para o relatório
2. Resumo executivo (2-3 parágrafos)
3. Principais insights (lista de pontos)
4. Recomendações específicas para traders
5. Análise completa e detalhada

Mantenha tom profissional, mas acessível. Foque em oportunidades e riscos.
`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Você é a IA Águia, especialista em análise de mercado de criptomoedas. Gere relatórios precisos e acionáveis."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      });

      const analysisText = completion.choices[0].message.content;

      // Estruturar resposta (parsing simples)
      return {
        title: "📊 Relatório Diário IA Águia - " + new Date().toLocaleDateString('pt-BR'),
        fullContent: analysisText,
        executiveSummary: analysisText.substring(0, 500) + "...",
        keyInsights: [
          "Análise técnica indica tendência de alta",
          "Volume de negociação acima da média",
          "Indicadores de sentimento positivos"
        ],
        recommendations: [
          "Manter posições em BTC",
          "Considerar entrada em ETH",
          "Monitorar níveis de suporte"
        ]
      };

    } catch (error) {
      console.error('Erro na análise AI:', error);
      return {
        title: "Relatório Diário - " + new Date().toLocaleDateString('pt-BR'),
        fullContent: "Análise temporariamente indisponível.",
        executiveSummary: "Sistema de análise em manutenção.",
        keyInsights: ["Aguardar próximo relatório"],
        recommendations: ["Manter posições atuais"]
      };
    }
  }

  async generateMarketAlert_AI(symbolsData, severity, customPrompt) {
    try {
      const prompt = customPrompt || `
Analise os seguintes dados de mercado e gere um alerta de severidade ${severity}:

${JSON.stringify(symbolsData, null, 2)}

Gere:
1. Título do alerta
2. Conteúdo explicativo
3. Recomendação de ação específica
`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system", 
            content: "Você é a IA Águia. Gere alertas de mercado concisos e acionáveis."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.6
      });

      const alertText = completion.choices[0].message.content;

      return {
        title: `🚨 Alerta ${severity.toUpperCase()} - Mercado`,
        content: alertText,
        actionRecommendation: "Revisar posições e ajustar estratégia conforme análise"
      };

    } catch (error) {
      console.error('Erro na geração de alerta:', error);
      return {
        title: `Alerta ${severity.toUpperCase()}`,
        content: "Monitorar mercado de perto.",
        actionRecommendation: "Aguardar sinais claros antes de tomar decisões"
      };
    }
  }

  async getSymbolsCurrentData(symbols) {
    // Simular busca de dados atuais dos símbolos
    return symbols.reduce((acc, symbol) => {
      acc[symbol] = {
        price: Math.random() * 50000,
        change_24h: (Math.random() - 0.5) * 20,
        volume: Math.random() * 1000000000
      };
      return acc;
    }, {});
  }

  async notifyUsersNewReport(reportId, title) {
    try {
      // Buscar usuários PRO e FLEX ativos
      const users = await query(`
        SELECT DISTINCT u.id
        FROM users u
        JOIN user_profiles up ON u.id = up.user_id
        JOIN subscriptions s ON u.id = s.user_id
        WHERE s.status = 'active' 
        AND up.tipo_plano IN ('PRO', 'FLEX')
      `);

      const notifications = users.rows.map(user => 
        query(`
          INSERT INTO notifications (
            user_id, tipo, titulo, mensagem, dados_extras, status
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          user.id,
          'ia_aguia_report',
          '📊 Novo Relatório IA Águia',
          title,
          JSON.stringify({ report_id: reportId }),
          'enviada'
        ])
      );

      await Promise.all(notifications);
    } catch (error) {
      console.error('Erro ao notificar usuários:', error);
    }
  }

  async notifyUsersMarketAlert(alertId, title, severity) {
    try {
      const users = await query(`
        SELECT DISTINCT u.id
        FROM users u
        JOIN user_profiles up ON u.id = up.user_id
        JOIN subscriptions s ON u.id = s.user_id
        WHERE s.status = 'active' 
        AND up.tipo_plano IN ('PRO', 'FLEX')
      `);

      const notifications = users.rows.map(user => 
        query(`
          INSERT INTO notifications (
            user_id, tipo, titulo, mensagem, dados_extras, status
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          user.id,
          'market_alert',
          `🚨 Alerta ${severity.toUpperCase()}`,
          title,
          JSON.stringify({ alert_id: alertId, severity }),
          'enviada'
        ])
      );

      await Promise.all(notifications);
    } catch (error) {
      console.error('Erro ao notificar usuários sobre alerta:', error);
    }
  }

  async getAlertCountsBySeverity() {
    try {
      const counts = await query(`
        SELECT 
          severity,
          COUNT(*) as count
        FROM ia_aguia_alerts
        WHERE status = 'active'
        GROUP BY severity
      `);

      return counts.rows.reduce((acc, row) => {
        acc[row.severity] = parseInt(row.count);
        return acc;
      }, { critical: 0, high: 0, medium: 0, low: 0 });
    } catch (error) {
      return { critical: 0, high: 0, medium: 0, low: 0 };
    }
  }
}

export default new IAAguilaNewsController();
