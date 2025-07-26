import express from 'express';
import aiController from '../controllers/aiController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Middleware de autenticação para todas as rotas
router.use(authenticateToken);

// Rotas de leitura de mercado
router.post('/reading', aiController.createMarketReading.bind(aiController));
router.get('/reading/:id', aiController.getMarketReading.bind(aiController));

// Rotas de sinais
router.get('/signals', aiController.getActiveSignals.bind(aiController));

// Rotas de decisões de trading
router.post('/decisions', aiController.createTradingDecision.bind(aiController));
router.get('/decisions', aiController.getUserDecisions.bind(aiController));
router.put('/decisions/:id/status', aiController.updateDecisionStatus.bind(aiController));

// Rotas de analytics
router.get('/analytics', aiController.getAIAnalytics.bind(aiController));

// Rota admin para visualizar todas as leituras
router.get('/admin/readings', requireRole('admin'), async (req, res) => {
  try {
    const { query } = await import('../config/database.js');
    const { limit = 50, offset = 0 } = req.query;

    const result = await query(`
      SELECT 
        r.*,
        COUNT(d.id) as total_decisions
      FROM ai_market_readings r
      LEFT JOIN ai_trading_decisions d ON r.id = d.reading_id
      GROUP BY r.id
      ORDER BY r.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

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
    console.error('Erro ao obter leituras admin:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Rota admin para estatísticas gerais
router.get('/admin/stats', requireRole('admin'), async (req, res) => {
  try {
    const { query } = await import('../config/database.js');

    const stats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM ai_market_readings) as total_readings,
        (SELECT COUNT(*) FROM ai_trading_decisions) as total_decisions,
        (SELECT COUNT(DISTINCT usuario_id) FROM ai_trading_decisions) as active_users,
        (SELECT AVG(nivel_confianca) FROM ai_market_readings) as avg_confidence,
        (SELECT SUM(lucro_prejuizo) FROM ai_trading_decisions WHERE lucro_prejuizo IS NOT NULL) as total_profit,
        (SELECT COUNT(*) FROM ai_trading_decisions WHERE status = 'finalizada' AND lucro_prejuizo > 0) as winning_trades,
        (SELECT COUNT(*) FROM ai_trading_decisions WHERE status = 'finalizada' AND lucro_prejuizo < 0) as losing_trades
    `);

    res.json({
      success: true,
      data: stats.rows[0]
    });

  } catch (error) {
    console.error('Erro ao obter estatísticas admin:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export default router;
