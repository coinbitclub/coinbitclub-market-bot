import { query } from '../config/database.js';
import marketDataService from '../services/marketDataService.js';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class TradingViewWebhookController {
  // Receber alertas do TradingView
  async receiveAlert(req, res) {
    try {
      const {
        symbol,
        timeframe,
        price,
        indicator,
        signal,
        message,
        timestamp
      } = req.body;

      // Validar dados obrigatórios
      if (!symbol || !signal || !price) {
        return res.status(400).json({
          success: false,
          error: 'Parâmetros obrigatórios: symbol, signal, price'
        });
      }

      console.log('Alerta TradingView recebido:', {
        symbol,
        timeframe,
        signal,
        price,
        timestamp: new Date()
      });

      // Obter análise de mercado completa
      const marketAnalysis = await marketDataService.getMarketAnalysis(symbol, timeframe);

      // Processar alerta através da IA Águia
      const aiAnalysis = await this.processAlertWithAI({
        symbol,
        timeframe,
        price,
        indicator,
        signal,
        message,
        marketData: marketAnalysis
      });

      // Criar leitura de mercado automática
      const readingResult = await query(`
        INSERT INTO ai_market_readings (
          simbolo, timeframe, dados_mercado, volume_24h,
          variacao_preco, contexto_global, analise_ia,
          nivel_confianca, status, fonte
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [
        symbol,
        timeframe || '1h',
        JSON.stringify(marketAnalysis),
        marketAnalysis.volume_24h,
        marketAnalysis.price_change_percent,
        `TradingView Alert: ${signal} - ${message || ''}`,
        aiAnalysis,
        aiAnalysis.confidence_score || 0.7,
        'ativa',
        'tradingview'
      ]);

      // Notificar usuários VIP se for um sinal de alta confiança
      if (aiAnalysis.confidence_score > 0.8) {
        await this.notifyVIPUsers(readingResult.rows[0]);
      }

      res.json({
        success: true,
        data: {
          reading_id: readingResult.rows[0].id,
          ai_analysis: aiAnalysis,
          market_data: marketAnalysis
        }
      });

    } catch (error) {
      console.error('Erro ao processar alerta TradingView:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // Processar alerta com IA
  async processAlertWithAI(alertData) {
    try {
      const prompt = `
        Analise este alerta do TradingView como IA Águia especialista em trading:

        DADOS DO ALERTA:
        - Símbolo: ${alertData.symbol}
        - Timeframe: ${alertData.timeframe}
        - Preço Atual: ${alertData.price}
        - Indicador: ${alertData.indicator}
        - Sinal: ${alertData.signal}
        - Mensagem: ${alertData.message}

        DADOS DE MERCADO:
        ${JSON.stringify(alertData.marketData, null, 2)}

        Forneça uma análise completa incluindo:
        1. Validação do sinal (confiável ou não)
        2. Força do sinal (1-10)
        3. Direção recomendada (buy/sell/hold)
        4. Níveis de entrada, alvo e stop
        5. Timeframe recomendado para operação
        6. Nível de confiança (0-1)
        7. Contexto de mercado atual
        8. Recomendações específicas

        Responda APENAS em JSON válido.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Você é a IA Águia, especialista em análise técnica de trading. Sempre responda em JSON estruturado e válido."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      });

      let analysis;
      try {
        analysis = JSON.parse(response.choices[0].message.content);
      } catch (parseError) {
        // Fallback se o JSON não for válido
        analysis = {
          validation: "Sinal processado",
          strength: 5,
          direction: alertData.signal.toLowerCase(),
          confidence_score: 0.6,
          analysis: response.choices[0].message.content,
          error: "JSON parse failed"
        };
      }

      return analysis;

    } catch (error) {
      console.error('Erro na análise de IA:', error);
      return {
        validation: "Erro na análise",
        strength: 0,
        direction: "hold",
        confidence_score: 0.3,
        error: error.message
      };
    }
  }

  // Notificar usuários VIP
  async notifyVIPUsers(reading) {
    try {
      // Buscar usuários VIP ativos
      const vipUsers = await query(`
        SELECT DISTINCT u.id, u.email, u.whatsapp, up.nome_completo
        FROM users u
        JOIN user_profiles up ON u.id = up.user_id
        JOIN user_subscriptions us ON u.id = us.user_id
        JOIN plans p ON us.plan_id = p.id
        WHERE p.nome_plano LIKE '%VIP%' 
        AND us.status = 'ativa'
        AND us.data_fim > CURRENT_DATE
      `);

      if (vipUsers.rows.length === 0) return;

      // Preparar mensagem de notificação
      const message = {
        title: `🦅 IA Águia - Sinal de Alta Confiança`,
        symbol: reading.simbolo,
        timeframe: reading.timeframe,
        confidence: Math.round(reading.nivel_confianca * 100),
        analysis: reading.analise_ia,
        timestamp: reading.created_at
      };

      // Inserir notificações no banco
      const notificationPromises = vipUsers.rows.map(user => 
        query(`
          INSERT INTO notifications (
            user_id, tipo, titulo, mensagem, dados_extras, status
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          user.id,
          'ai_signal',
          message.title,
          `Novo sinal para ${reading.simbolo} com ${Math.round(reading.nivel_confianca * 100)}% de confiança`,
          JSON.stringify(message),
          'enviada'
        ])
      );

      await Promise.all(notificationPromises);

      console.log(`Notificados ${vipUsers.rows.length} usuários VIP sobre sinal de alta confiança`);

    } catch (error) {
      console.error('Erro ao notificar usuários VIP:', error);
    }
  }

  // Webhook para estratégias automáticas
  async automatedStrategy(req, res) {
    try {
      const {
        strategy_name,
        symbol,
        action, // buy, sell, close
        quantity,
        price,
        stop_loss,
        take_profit,
        timeframe
      } = req.body;

      console.log('Estratégia automatizada recebida:', {
        strategy_name,
        symbol,
        action,
        timestamp: new Date()
      });

      // Buscar usuários que assinaram esta estratégia
      const strategyUsers = await query(`
        SELECT DISTINCT u.id, u.email, up.nome_completo
        FROM users u
        JOIN user_profiles up ON u.id = up.user_id
        JOIN user_subscriptions us ON u.id = us.user_id
        JOIN plans p ON us.plan_id = p.id
        WHERE p.nome_plano LIKE '%PRO%'
        AND us.status = 'ativa'
        AND us.data_fim > CURRENT_DATE
      `);

      if (strategyUsers.rows.length === 0) {
        return res.json({
          success: true,
          message: 'Nenhum usuário ativo para esta estratégia'
        });
      }

      // Criar decisões automáticas para os usuários
      const decisionPromises = strategyUsers.rows.map(async (user) => {
        // Primeiro criar uma leitura
        const readingResult = await query(`
          INSERT INTO ai_market_readings (
            simbolo, timeframe, dados_mercado, analise_ia,
            nivel_confianca, status, fonte
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `, [
          symbol,
          timeframe,
          JSON.stringify({ strategy: strategy_name, action, price }),
          JSON.stringify({
            strategy: strategy_name,
            action: action,
            entry_price: price,
            stop_loss: stop_loss,
            take_profit: take_profit,
            automated: true
          }),
          0.85, // Alta confiança para estratégias automáticas
          'ativa',
          'automated_strategy'
        ]);

        // Depois criar a decisão
        return query(`
          INSERT INTO ai_trading_decisions (
            reading_id, usuario_id, tipo_decisao, preco_entrada,
            preco_alvo, stop_loss, quantidade, score_confianca,
            observacoes, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          readingResult.rows[0].id,
          user.id,
          action,
          price,
          take_profit,
          stop_loss,
          quantity,
          0.85,
          `Estratégia automática: ${strategy_name}`,
          'executada'
        ]);
      });

      await Promise.all(decisionPromises);

      res.json({
        success: true,
        message: `Estratégia ${strategy_name} aplicada para ${strategyUsers.rows.length} usuários`,
        users_affected: strategyUsers.rows.length
      });

    } catch (error) {
      console.error('Erro na estratégia automatizada:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // Listar alertas recebidos (Admin)
  async getAlertHistory(req, res) {
    try {
      const { limit = 50, offset = 0, symbol } = req.query;

      let whereClause = "WHERE fonte IN ('tradingview', 'automated_strategy')";
      const params = [];
      let paramIndex = 1;

      if (symbol) {
        whereClause += ` AND simbolo = $${paramIndex}`;
        params.push(symbol);
        paramIndex++;
      }

      const result = await query(`
        SELECT 
          r.*,
          COUNT(d.id) as decisions_created
        FROM ai_market_readings r
        LEFT JOIN ai_trading_decisions d ON r.id = d.reading_id
        ${whereClause}
        GROUP BY r.id
        ORDER BY r.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, [...params, limit, offset]);

      res.json({
        success: true,
        data: result.rows,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: result.rows.length
        }
      });

    } catch (error) {
      console.error('Erro ao obter histórico de alertas:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
}

export default new TradingViewWebhookController();
