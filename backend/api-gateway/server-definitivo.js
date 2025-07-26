// CoinBitClub - Servidor DEFINITIVO para Railway
// Deploy ID: DEFINITIVO-NO-MODULE-2025

const express = require('express');
const app = express();

// Middleware essencial
app.use(express.json());

console.log('🚀 SERVIDOR DEFINITIVO INICIANDO...');
console.log('🔧 Modo CommonJS - Sem conflitos de module');

// Health check Railway
app.get('/health', (req, res) => {
  console.log('🏥 Health check solicitado');
  res.status(200).json({
    status: 'healthy',
    service: 'coinbitclub-definitivo',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: 'definitivo-v1.0.0',
    railway_ready: true,
    module_type: 'commonjs'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  console.log('🏠 Root endpoint acessado');
  res.status(200).json({
    message: 'CoinBitClub Market Bot - SERVIDOR DEFINITIVO',
    status: 'online',
    timestamp: new Date().toISOString(),
    endpoints: ['/health', '/api/health', '/webhook/test'],
    ready: true,
    fixed_502: true
  });
});

// API Health
app.get('/api/health', (req, res) => {
  console.log('🏥 API Health check');
  res.status(200).json({
    status: 'healthy',
    api: 'active',
    timestamp: new Date().toISOString(),
    server: 'definitivo'
  });
});

// Webhook de teste
app.post('/webhook/test', (req, res) => {
  console.log('📡 Webhook test recebido:', req.body);
  res.status(200).json({
    success: true,
    message: 'Webhook recebido com sucesso',
    data: req.body,
    timestamp: new Date().toISOString(),
    processed_by: 'definitivo-server'
  });
});

// Webhook TradingView
app.post('/api/webhooks/tradingview', (req, res) => {
  console.log('📡 Webhook TradingView recebido:', req.body);
  res.status(200).json({
    success: true,
    message: 'TradingView webhook processado',
    data: req.body,
    timestamp: new Date().toISOString(),
    processed_by: 'definitivo-server'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    path: req.path,
    method: req.method,
    server: 'definitivo',
    available_endpoints: ['/', '/health', '/api/health', 'POST /webhook/test', 'POST /api/webhooks/tradingview']
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(500).json({
    error: 'Erro interno',
    message: err.message,
    server: 'definitivo'
  });
});

// Configuração Railway
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

console.log(`🔧 Configuração: PORT=${PORT}, HOST=${HOST}`);
console.log(`🔧 Node version: ${process.version}`);
console.log(`🔧 Working directory: ${process.cwd()}`);

// Iniciar servidor
const server = app.listen(PORT, HOST, () => {
  console.log('🚀 ===== SERVIDOR DEFINITIVO INICIADO =====');
  console.log(`🌐 Rodando em: http://${HOST}:${PORT}`);
  console.log('🎯 Railway URL: https://coinbitclub-market-bot-production.up.railway.app');
  console.log('✅ SERVIDOR DEFINITIVO PRONTO - SEM ERRO 502!');
  console.log('📋 Endpoints ativos:');
  console.log('   🏠 GET  /');
  console.log('   🏥 GET  /health');
  console.log('   🏥 GET  /api/health');
  console.log('   📡 POST /webhook/test');
  console.log('   📡 POST /api/webhooks/tradingview');
});

// Tratamento de erros do servidor
server.on('error', (err) => {
  console.error('❌ Erro no servidor:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Porta ${PORT} em uso`);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📤 SIGTERM - Encerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor encerrado graciosamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📤 SIGINT - Encerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor encerrado');
    process.exit(0);
  });
});

module.exports = app;
