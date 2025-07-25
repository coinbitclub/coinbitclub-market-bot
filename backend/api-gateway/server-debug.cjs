// Servidor super simples para debug Railway
const express = require('express');
const app = express();

// Middleware basico
app.use(express.json());

// Rotas super simples
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Servidor funcionando no Railway!',
    timestamp: new Date().toISOString(),
    env: {
      PORT: process.env.PORT,
      NODE_ENV: process.env.NODE_ENV
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'coinbitclub-railway-test',
    timestamp: new Date().toISOString()
  });
});

// Teste webhook simples
app.post('/webhook/signal1', (req, res) => {
  console.log('Webhook recebido:', req.body);
  res.json({
    success: true,
    message: 'Webhook processado',
    data: req.body,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/webhooks/tradingview', (req, res) => {
  console.log('TradingView webhook:', req.body);
  res.json({
    success: true,
    message: 'TradingView webhook processado',
    timestamp: new Date().toISOString()
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
    error: 'Erro interno',
    message: error.message
  });
});

// Configuracao de porta Railway
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

console.log('Configuracao:');
console.log('PORT:', PORT);
console.log('HOST:', HOST);
console.log('NODE_ENV:', process.env.NODE_ENV);

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor Railway iniciado!`);
  console.log(`🌐 URL: http://${HOST}:${PORT}`);
  console.log(`✅ Pronto para receber requests!`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido, encerrando...');
  server.close(() => {
    console.log('Servidor encerrado');
    process.exit(0);
  });
});

module.exports = app;
