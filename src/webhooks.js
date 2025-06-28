import { Router } from 'express';
import { saveSignal } from '../services/signalsService.js';
import { saveDominance } from '../services/dominanceService.js';
import { saveRaw } from '../services/rawService.js';
import { parseSignal } from '../parseSignal.js';
import { parseDominance } from '../parseDominance.js';
import { logger } from '../logger.js';

const router = Router();

// Token validation
router.use((req, res, next) => {
  if (req.query.token !== process.env.WEBHOOK_TOKEN) {
    logger.warn('Token invÃ¡lido no webhook', { token: req.query.token });
    return res.status(401).json({ error: 'Token invÃ¡lido' });
  }
  next();
});

// Save raw webhook data
router.use(async (req, res, next) => {
  try {
    await saveRaw(req.path, { ...(req.query || {}), ...(req.body || {}) });
  } catch (e) {
    logger.warn('Falha ao gravar raw_webhook', e);
  }
  next();
});

// GET /signal
router.get('/signal', async (req, res) => {
  logger.info('GET /signal', { query: req.query });
  try {
    const signal = parseSignal(req.query);
    await saveSignal(signal);
    res.json({ status: 'ok' });
  } catch (err) {
    logger.error('Erro no GET /signal', err);
    res.status(500).json({ error: 'Erro ao processar GET' });
  }
});

// POST /signal
router.post('/signal', async (req, res) => {
  logger.info('POST /signal', { body: req.body });
  try {
    const signal = parseSignal(req.body);
    await saveSignal(signal);
    res.json({ status: 'ok' });
  } catch (err) {
    logger.error('Erro no POST /signal', err);
    res.status(500).json({ error: 'Erro ao processar POST' });
  }
});

// POST /dominance
router.post('/dominance', async (req, res) => {
  logger.info('POST /dominance', { body: req.body });
  try {
    const dom = parseDominance(req.body);
    await saveDominance(dom);
    res.json({ status: 'ok' });
  } catch (err) {
    logger.error('Erro no POST /dominance', err);
    res.status(500).json({ error: 'Erro ao processar dominÃ¢ncia' });
  }
});

export default router;
