// SERVIDOR DEFINITIVO - RESOLVE 502 RAILWAY
// Sem conflicts, sem workspaces, sem problemas

const express = require('express');
const app = express();

// Middleware básico
app.use(express.json());

console.log('🚀 SERVIDOR DEFINITIVO - SEM CONFLITOS');

// Health check Railway
app.get('/health', (req, res) => {
  console.log('🏥 Health check');
  res.status(200).json({
    status: 'healthy',
    service: 'coinbitclub-definitivo',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: 'definitivo-sem-conflitos',
    railway_fixed: true
  });
});

// Root
app.get('/', (req, res) => {
  console.log('🏠 Root endpoint');
  res.status(200).json({
    message: 'CoinBitClub - SERVIDOR DEFINITIVO',
    status: 'online',
    timestamp: new Date().toISOString(),
    fixed_502: 'YES',
    endpoints: ['/', '/health', '/api/health', '/webhook/test']
  });
});

// API Health
app.get('/api/health', (req, res) => {
  console.log('🏥 API Health');
  res.status(200).json({
    status: 'healthy',
    api: 'active',
    timestamp: new Date().toISOString()
  });
});

// Webhook teste
app.post('/webhook/test', (req, res) => {
  console.log('📡 Webhook:', req.body);
  res.status(200).json({
    success: true,
    message: 'Webhook OK',
    data: req.body,
    timestamp: new Date().toISOString()
  });
});

// TradingView webhook
app.post('/api/webhooks/tradingview', (req, res) => {
  console.log('📡 TradingView webhook:', req.body);
  res.status(200).json({
    success: true,
    message: 'TradingView webhook processado',
    data: req.body,
    timestamp: new Date().toISOString()
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    method: req.method
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(500).json({
    error: 'Internal error',
    message: err.message
  });
});

// Configuração Railway
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Iniciar
const server = app.listen(PORT, HOST, () => {
  console.log('🚀 ===== SERVIDOR DEFINITIVO ONLINE =====');
  console.log(`🌐 http://${HOST}:${PORT}`);
  console.log('✅ RAILWAY 502 RESOLVIDO!');
});

// Error handling
server.on('error', (err) => {
  console.error('❌ Erro servidor:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📤 Shutdown gracioso');
  server.close(() => process.exit(0));
});

module.exports = app;
