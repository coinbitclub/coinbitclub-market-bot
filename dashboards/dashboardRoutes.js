import express from 'express';

const router = express.Router();

// Dados simulados para teste - substitua depois por chamadas reais ao banco

// 1. Dados Diários de Mercado
router.get('/market_daily', (req, res) => {
  const mockMarketDaily = [
    { ticker: 'BTCUSDT', price: 65000.00, captured_at: new Date().toISOString() },
    { ticker: 'ETHUSDT', price: 4000.00, captured_at: new Date().toISOString() },
  ];
  res.json(mockMarketDaily);
});

// 2. Logs Recentes
router.get('/logs_recent', (req, res) => {
  const mockLogs = [
    { created_at: new Date().toISOString(), severity: 'info', message: 'Bot started' },
    { created_at: new Date().toISOString(), severity: 'warn', message: 'High volatility detected' },
    { created_at: new Date().toISOString(), severity: 'error', message: 'Order execution failed' },
  ];
  res.json(mockLogs);
});

// 3. Trades Abertas
router.get('/open_trades', (req, res) => {
  const mockTrades = [
    { symbol: 'BTCUSDT', entryPrice: 64000, qty: 0.5, pnl: 500 },
    { symbol: 'ETHUSDT', entryPrice: 3900, qty: 2, pnl: -150 },
  ];
  res.json(mockTrades);
});

export default router;
