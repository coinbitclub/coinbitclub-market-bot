import { query, pool } from '../config/database.js';
import OpenAI from 'openai';
import axios from 'axios';

// Configuração da OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class AIController {
  // POST /ai/reading - Leitura de mercado da IA Águia
  async createMarketReading(req, res) {
    try {
      const { 
        simbolo, 
        timeframe, 
        dados_mercado, 
        volume_24h, 
        variacao_preco, 
        contexto_global,
        nivel_confianca 
      } = req.body;

      // Validações
      if (!simbolo || !timeframe || !dados_mercado) {
        return res.status(400).json({
          success: false,
          error: 'Parâmetros obrigatórios: simbolo, timeframe, dados_mercado'
        });
      }

      // Análise via OpenAI GPT-4
      const prompt = `
        Analise os seguintes dados de mercado como um especialista trader:
        
        Símbolo: ${simbolo}
        Timeframe: ${timeframe}
        Dados: ${JSON.stringify(dados_mercado)}
        Volume 24h: ${volume_24h || 'N/A'}
        Variação de Preço: ${variacao_preco || 'N/A'}
        Contexto Global: ${contexto_global || 'N/A'}
        
        Forneça uma análise técnica detalhada incluindo:
        1. Tendência atual
        2. Níveis de suporte e resistência
        3. Indicadores técnicos relevantes
        4. Recomendação de entrada/saída
        5. Nível de risco (1-10)
        6. Probabilidade de sucesso (%)
        
        Responda em formato JSON estruturado.
      `;

      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Você é o IA Águia, um especialista em análise técnica de trading. Sempre responda em JSON válido com análise detalhada."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      });

      let analise_ia;
      try {
        analise_ia = JSON.parse(aiResponse.choices[0].message.content);
      } catch (parseError) {
        analise_ia = {
          analise: aiResponse.choices[0].message.content,
          erro_parse: true
        };
      }

      // Inserir leitura no banco
      const result = await query(`
        INSERT INTO ai_market_readings (
          simbolo, timeframe, dados_mercado, volume_24h, 
          variacao_preco, contexto_global, analise_ia, 
          nivel_confianca, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        simbolo,
        timeframe,
        dados_mercado,
        volume_24h,
        variacao_preco,
        contexto_global,
        analise_ia,
        nivel_confianca || 0.8,
        'ativa'
      ]);

      res.json({
        success: true,
        data: {
          id: result.rows[0].id,
          analise: analise_ia,
          created_at: result.rows[0].created_at,
          nivel_confianca: result.rows[0].nivel_confianca
        }
      });

    } catch (error) {
      console.error('Erro ao criar leitura de mercado:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // GET /ai/reading/:id - Obter leitura específica
  async getMarketReading(req, res) {
    try {
      const { id } = req.params;

      const result = await query(`
        SELECT * FROM ai_market_readings 
        WHERE id = $1 AND status = 'ativa'
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Leitura não encontrada'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });

    } catch (error) {
      console.error('Erro ao obter leitura:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // GET /ai/signals - Obter sinais ativos
  async getActiveSignals(req, res) {
    try {
      const { simbolo, timeframe, limit = 10 } = req.query;

      let whereClause = "WHERE status = 'ativa'";
      const params = [];
      let paramIndex = 1;

      if (simbolo) {
        whereClause += ` AND simbolo = $${paramIndex}`;
        params.push(simbolo);
        paramIndex++;
      }

      if (timeframe) {
        whereClause += ` AND timeframe = $${paramIndex}`;
        params.push(timeframe);
        paramIndex++;
      }

      const result = await query(`
        SELECT 
          id, simbolo, timeframe, analise_ia,
          nivel_confianca, created_at
        FROM ai_market_readings 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex}
      `, [...params, limit]);

      res.json({
        success: true,
        data: result.rows,
        total: result.rows.length
      });

    } catch (error) {
      console.error('Erro ao obter sinais:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // POST /ai/decisions - Criar decisão de trading
  async createTradingDecision(req, res) {
    try {
      const {
        reading_id,
        usuario_id,
        tipo_decisao,
        preco_entrada,
        preco_alvo,
        stop_loss,
        quantidade,
        observacoes
      } = req.body;

      // Validações
      if (!reading_id || !usuario_id || !tipo_decisao) {
        return res.status(400).json({
          success: false,
          error: 'Parâmetros obrigatórios: reading_id, usuario_id, tipo_decisao'
        });
      }

      // Verificar se a leitura existe
      const readingCheck = await query(`
        SELECT * FROM ai_market_readings WHERE id = $1
      `, [reading_id]);

      if (readingCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Leitura de mercado não encontrada'
        });
      }

      // Calcular score de confiança baseado na análise
      const reading = readingCheck.rows[0];
      const score_confianca = await this.calculateConfidenceScore(reading, {
        tipo_decisao,
        preco_entrada,
        preco_alvo,
        stop_loss
      });

      // Inserir decisão
      const result = await query(`
        INSERT INTO ai_trading_decisions (
          reading_id, usuario_id, tipo_decisao, preco_entrada,
          preco_alvo, stop_loss, quantidade, score_confianca,
          observacoes, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [
        reading_id,
        usuario_id,
        tipo_decisao,
        preco_entrada,
        preco_alvo,
        stop_loss,
        quantidade,
        score_confianca,
        observacoes,
        'pendente'
      ]);

      res.json({
        success: true,
        data: {
          id: result.rows[0].id,
          score_confianca,
          status: result.rows[0].status,
          created_at: result.rows[0].created_at
        }
      });

    } catch (error) {
      console.error('Erro ao criar decisão de trading:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // GET /ai/decisions - Obter decisões do usuário
  async getUserDecisions(req, res) {
    try {
      const usuario_id = req.user.id;
      const { status, limit = 20 } = req.query;

      let whereClause = "WHERE d.usuario_id = $1";
      const params = [usuario_id];
      let paramIndex = 2;

      if (status) {
        whereClause += ` AND d.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      const result = await query(`
        SELECT 
          d.*,
          r.simbolo,
          r.timeframe,
          r.nivel_confianca as reading_confidence
        FROM ai_trading_decisions d
        JOIN ai_market_readings r ON d.reading_id = r.id
        ${whereClause}
        ORDER BY d.created_at DESC
        LIMIT $${paramIndex}
      `, [...params, limit]);

      res.json({
        success: true,
        data: result.rows,
        total: result.rows.length
      });

    } catch (error) {
      console.error('Erro ao obter decisões:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // PUT /ai/decisions/:id/status - Atualizar status da decisão
  async updateDecisionStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, resultado_real, lucro_prejuizo } = req.body;

      const validStatuses = ['pendente', 'executada', 'cancelada', 'finalizada'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Status inválido'
        });
      }

      const result = await query(`
        UPDATE ai_trading_decisions 
        SET 
          status = $1,
          resultado_real = $2,
          lucro_prejuizo = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $4 AND usuario_id = $5
        RETURNING *
      `, [status, resultado_real, lucro_prejuizo, id, req.user.id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Decisão não encontrada'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });

    } catch (error) {
      console.error('Erro ao atualizar decisão:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // GET /ai/analytics - Analytics da IA Águia
  async getAIAnalytics(req, res) {
    try {
      const usuario_id = req.user.id;
      const { periodo = '30' } = req.query;

      // Estatísticas gerais
      const stats = await query(`
        SELECT 
          COUNT(*) as total_decisoes,
          COUNT(CASE WHEN status = 'executada' THEN 1 END) as executadas,
          COUNT(CASE WHEN status = 'finalizada' THEN 1 END) as finalizadas,
          AVG(score_confianca) as media_confianca,
          SUM(CASE WHEN lucro_prejuizo > 0 THEN 1 ELSE 0 END) as trades_positivos,
          SUM(CASE WHEN lucro_prejuizo < 0 THEN 1 ELSE 0 END) as trades_negativos,
          SUM(lucro_prejuizo) as lucro_total
        FROM ai_trading_decisions 
        WHERE usuario_id = $1 
        AND created_at >= CURRENT_DATE - INTERVAL '${periodo} days'
      `, [usuario_id]);

      // Performance por símbolo
      const symbolPerformance = await query(`
        SELECT 
          r.simbolo,
          COUNT(*) as total_trades,
          AVG(d.score_confianca) as media_confianca,
          SUM(d.lucro_prejuizo) as lucro_simbolo
        FROM ai_trading_decisions d
        JOIN ai_market_readings r ON d.reading_id = r.id
        WHERE d.usuario_id = $1 
        AND d.created_at >= CURRENT_DATE - INTERVAL '${periodo} days'
        GROUP BY r.simbolo
        ORDER BY lucro_simbolo DESC
      `, [usuario_id]);

      res.json({
        success: true,
        data: {
          periodo: `${periodo} dias`,
          estatisticas: stats.rows[0],
          performance_simbolos: symbolPerformance.rows
        }
      });

    } catch (error) {
      console.error('Erro ao obter analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // Método auxiliar para calcular score de confiança
  async calculateConfidenceScore(reading, decision) {
    try {
      let score = parseFloat(reading.nivel_confianca) || 0.5;
      
      // Ajustar baseado no tipo de decisão
      if (decision.tipo_decisao === 'buy' && reading.analise_ia?.tendencia === 'alta') {
        score += 0.1;
      } else if (decision.tipo_decisao === 'sell' && reading.analise_ia?.tendencia === 'baixa') {
        score += 0.1;
      }

      // Ajustar baseado na relação risco/retorno
      if (decision.preco_alvo && decision.stop_loss && decision.preco_entrada) {
        const riskReward = Math.abs(decision.preco_alvo - decision.preco_entrada) / 
                          Math.abs(decision.preco_entrada - decision.stop_loss);
        
        if (riskReward >= 2) score += 0.1;
        else if (riskReward < 1) score -= 0.1;
      }

      return Math.min(Math.max(score, 0), 1);
    } catch (error) {
      console.error('Erro ao calcular score:', error);
      return 0.5;
    }
  }
}

const aiController = new AIController();

export default aiController;
