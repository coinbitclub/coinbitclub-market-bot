// CoinBitClub Railway - Servidor Ultra Simples para Resolver 502
// Última tentativa - Configuração mínima absoluta

const express = require('express');
const app = express();

// Middleware mínimo
app.use(express.json());

// Configuração Railway obrigatória
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

console.log('🚀 SERVIDOR ULTRA SIMPLES INICIANDO...');
console.log(`PORT: ${PORT}, HOST: ${HOST}`);

// Health check minimalista
app.get('/health', (req, res) => {
  console.log('Health check requisitado');
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: 'ultra-simple-' + Date.now(),
    railway_test: true
  });
});

// Root endpoint
app.get('/', (req, res) => {
  console.log('Root endpoint acessado');
  res.status(200).json({
    message: 'CoinBitClub Railway Ultra Simple',
    status: 'online',
    timestamp: new Date().toISOString(),
    version: 'ultra-simple-' + Date.now()
  });
});

// Webhook TradingView simplificado
app.post('/api/webhooks/tradingview', (req, res) => {
  console.log('Webhook TradingView recebido:', req.body);
  res.status(200).json({
    success: true,
    message: 'Webhook processado',
    signal_id: Math.random().toString(36),
    timestamp: new Date().toISOString()
  });
});

// Webhook genérico
app.post('/webhook/signal1', (req, res) => {
  console.log('Webhook signal1 recebido:', req.body);
  res.status(200).json({
    success: true,
    message: 'Signal1 processado',
    signal_id: Math.random().toString(36),
    timestamp: new Date().toISOString()
  });
});

// 404 handler simples
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor com logs detalhados
const server = app.listen(PORT, HOST, () => {
  console.log('🟢 SERVIDOR ULTRA SIMPLES INICIADO');
  console.log(`🌐 Rodando em: http://${HOST}:${PORT}`);
  console.log(`🔗 Railway URL: https://coinbitclub-market-bot-production.up.railway.app`);
  console.log('📋 Endpoints:');
  console.log('   GET  /health');
  console.log('   GET  /');
  console.log('   POST /api/webhooks/tradingview');
  console.log('   POST /webhook/signal1');
  console.log('✅ PRONTO PARA USO!');
});

// Error handling
server.on('error', (err) => {
  console.error('❌ Erro no servidor:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📤 SIGTERM - Encerrando...');
  server.close(() => {
    console.log('✅ Servidor encerrado');
    process.exit(0);
  });
});

module.exports = app;
