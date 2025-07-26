const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares básicos
app.use(cors());
app.use(express.json());

// Log de todas as requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Endpoint básico de health
app.get('/health', (req, res) => {
  console.log('Health check solicitado');
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'coinbitclub-market-bot-simple'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'CoinBitClub Market Bot - Versao Simplificada',
    status: 'online',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      status: '/api/status'
    }
  });
});

// Endpoint de status da API
app.get('/api/status', (req, res) => {
  res.json({
    status: 'active',
    service: 'coinbitclub-market-bot',
    version: '1.0.0-simple',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Webhook endpoint básico
app.post('/api/webhooks/tradingview', (req, res) => {
  console.log('Webhook recebido:', JSON.stringify(req.body, null, 2));
  res.json({
    success: true,
    message: 'Webhook recebido com sucesso',
    timestamp: new Date().toISOString(),
    data: req.body
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint nao encontrado',
    path: req.path,
    method: req.method
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Erro:', error);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: error.message
  });
});

// Inicializar servidor
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

console.log('Iniciando servidor simplificado...');
console.log('PORT:', PORT);
console.log('HOST:', HOST);

const server = app.listen(PORT, HOST, () => {
  console.log(`Servidor rodando em http://${HOST}:${PORT}`);
  console.log('Endpoints disponiveis:');
  console.log('  GET  / (root)');
  console.log('  GET  /health');
  console.log('  GET  /api/status');
  console.log('  POST /api/webhooks/tradingview');
  console.log('Servidor pronto!');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido, fechando servidor...');
  server.close(() => {
    console.log('Servidor fechado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT recebido, fechando servidor...');
  server.close(() => {
    console.log('Servidor fechado');
    process.exit(0);
  });
});
