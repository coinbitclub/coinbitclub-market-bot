// Railway Cache Buster Server - Forçar Deploy Limpo
// Data: 2025-07-25T21:50:00Z
// Estratégia: Limpeza total de cache do Railway

const express = require('express');
const crypto = require('crypto');

// Cache buster único
const UNIQUE_ID = crypto.randomBytes(16).toString('hex');
const TIMESTAMP = Date.now();
const VERSION = `cache-bust-${TIMESTAMP}-${UNIQUE_ID}`;

console.log('🧹 CACHE BUSTER ATIVO - ID:', UNIQUE_ID);
console.log('📅 Timestamp:', TIMESTAMP);
console.log('🔄 Versão:', VERSION);

const app = express();

// Middleware anti-cache
app.use((req, res, next) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Unique-Deploy': UNIQUE_ID,
    'X-Timestamp': TIMESTAMP.toString(),
    'X-Cache-Bust': VERSION,
    'Last-Modified': new Date().toUTCString()
  });
  next();
});

app.use(express.json());

// Health check com ID único
app.get('/health', (req, res) => {
  console.log('🏥 Health check - Cache Buster Active');
  res.json({
    status: 'healthy-cache-busted',
    unique_id: UNIQUE_ID,
    timestamp: TIMESTAMP,
    version: VERSION,
    current_time: new Date().toISOString(),
    uptime: process.uptime(),
    cache_busted: true
  });
});

// Root com ID único
app.get('/', (req, res) => {
  console.log('🏠 Root - Cache Buster Active');
  res.json({
    service: 'CoinBitClub Cache Buster',
    status: 'active',
    unique_id: UNIQUE_ID,
    version: VERSION,
    timestamp: TIMESTAMP,
    cache_strategy: 'force_rebuild',
    message: 'Cache busting deployment active'
  });
});

// API Health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'cache-buster-api',
    unique_id: UNIQUE_ID,
    version: VERSION,
    cache_busted: true
  });
});

// Webhook simples
app.post('/webhook/signal1', (req, res) => {
  console.log('📡 Webhook recebido - Cache Buster');
  res.json({
    success: true,
    unique_id: UNIQUE_ID,
    version: VERSION,
    received_at: new Date().toISOString(),
    data: req.body
  });
});

// TradingView webhook
app.post('/api/webhooks/tradingview', (req, res) => {
  console.log('📡 TradingView webhook - Cache Buster');
  res.json({
    success: true,
    unique_id: UNIQUE_ID,
    version: VERSION,
    webhook_type: 'tradingview',
    received_at: new Date().toISOString()
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    unique_id: UNIQUE_ID,
    version: VERSION,
    path: req.path
  });
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log('🚀 CACHE BUSTER SERVER INICIADO');
  console.log(`🌐 URL: http://${HOST}:${PORT}`);
  console.log(`🆔 Unique ID: ${UNIQUE_ID}`);
  console.log(`📝 Version: ${VERSION}`);
  console.log('🧹 Cache busting ativo!');
});

module.exports = app;
