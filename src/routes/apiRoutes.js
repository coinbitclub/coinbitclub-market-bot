// src/routes/api.js
import express from 'express';
import axios   from 'axios';

const router = express.Router();
const KEY    = process.env.COINSTATS_API_KEY;

// --- Proteção de todas as rotas externas ---
async function fetchFromCoinStats(url, res) {
  try {
    const { data } = await axios.get(url, {
      headers: {
        accept: 'application/json',
        'X-API-KEY': KEY
      }
    });
    res.json({ status: 'ok', data });
  } catch (err) {
    const status = err?.response?.status || 500;
    const message = err?.response?.data?.message || err.message;
    res.status(status).json({ status: 'error', message });
  }
}

// 1) Fear & Greed
router.get('/fear-greed', async (_req, res) => {
  await fetchFromCoinStats(
    'https://openapiv1.coinstats.app/insights/fear-and-greed',
    res
  );
});

// 2) BTC Dominance
router.get('/btc-dominance', async (_req, res) => {
  await fetchFromCoinStats(
    'https://openapiv1.coinstats.app/insights/btc-dominance?type=24h',
    res
  );
});

// 3) Markets
router.get('/market', async (_req, res) => {
  await fetchFromCoinStats(
    'https://openapiv1.coinstats.app/markets',
    res
  );
});

export default router;
