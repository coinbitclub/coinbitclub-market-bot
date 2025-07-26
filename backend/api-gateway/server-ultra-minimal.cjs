// Servidor minimo Railway - ultra debug
const express = require('express');

console.log('=== INICIANDO SERVIDOR RAILWAY ===');
console.log('Timestamp:', new Date().toISOString());
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('PID:', process.pid);

const app = express();

// Middleware minimo
app.use(express.json());

// Configuracao Railway
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

console.log('=== CONFIGURACAO ===');
console.log('PORT env:', process.env.PORT);
console.log('PORT final:', PORT);
console.log('HOST:', HOST);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Log de requisicoes
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Rotas
app.get('/', (req, res) => {
  const response = {
    status: 'OK',
    message: 'Railway ULTRA minimal funcionando!',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: { PORT: process.env.PORT, NODE_ENV: process.env.NODE_ENV }
  };
  console.log('Respondendo /:', JSON.stringify(response));
  res.json(response);
});

app.get('/health', (req, res) => {
  const response = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  };
  console.log('Respondendo /health:', JSON.stringify(response));
  res.json(response);
});

app.get('/api/health', (req, res) => {
  const response = {
    status: 'healthy',
    service: 'railway-ultra-minimal',
    timestamp: new Date().toISOString()
  };
  console.log('Respondendo /api/health:', JSON.stringify(response));
  res.json(response);
});

app.post('/webhook/signal1', (req, res) => {
  console.log('Webhook recebido:', req.body);
  res.json({
    success: true,
    message: 'Webhook OK',
    timestamp: new Date().toISOString()
  });
});

// 404
app.use((req, res) => {
  console.log(`404: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('ERRO:', error);
  res.status(500).json({ error: 'Internal error', message: error.message });
});

// Iniciar servidor
console.log('Iniciando listen...');

const server = app.listen(PORT, HOST, () => {
  console.log('🎉 SERVIDOR INICIADO!');
  console.log(`🌐 URL: http://${HOST}:${PORT}`);
  console.log(`⏰ ${new Date().toISOString()}`);
  console.log('✅ Pronto!');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM - encerrando...');
  server.close(() => {
    console.log('Servidor encerrado');
    process.exit(0);
  });
});

// Error handlers
process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
  process.exit(1);
});

module.exports = app;
