import express from 'express';
import pool from '../services/databaseService.js'; // ajuste o caminho conforme sua estrutura

const router = express.Router();

// Retorna dados diários consolidados de market_daily (exemplo)
router.get('/dashboard/market_daily', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM market_daily
      ORDER BY captured_at DESC
      LIMIT 30
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// Retorna dados diários consolidados de dominance_daily (exemplo)
router.get('/dashboard/dominance_daily', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM dominance_daily
      ORDER BY captured_at DESC
      LIMIT 30
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// Retorna dados diários consolidados de fear_greed_daily (exemplo)
router.get('/dashboard/fear_greed_daily', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM fear_greed_daily
      ORDER BY captured_at DESC
      LIMIT 30
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// Retorna logs recentes do bot
router.get('/dashboard/logs', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, created_at, severity, message 
      FROM bot_logs
      ORDER BY created_at DESC
      LIMIT 50
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// Retorna estatísticas básicas (exemplo)
router.get('/dashboard/stats', async (req, res, next) => {
  try {
    // Exemplo: contar trades abertas, fechadas, taxa de acerto, etc
    // Ajuste as queries conforme a estrutura do seu banco
    const tradesAbertas = await pool.query(`SELECT COUNT(*) FROM trades WHERE status = 'open'`);
    const tradesFechadas = await pool.query(`SELECT COUNT(*) FROM trades WHERE status = 'closed'`);
    
    // Exemplo de taxa de acerto - pode adaptar
    const taxaAcerto = 75; 

    res.json({
      tradesAbertas: tradesAbertas.rows[0].count,
      tradesFechadas: tradesFechadas.rows[0].count,
      taxaAcerto
    });
  } catch (err) {
    next(err);
  }
});

export default router;
