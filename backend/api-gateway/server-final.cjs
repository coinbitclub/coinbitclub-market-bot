// CoinBitClub - Servidor FINAL para Railway
// Deploy ID: FINAL-FIX-502-2025

const express = require('express');
const app = express();

// Middleware essencial
app.use(express.json());

console.log('🚀 SERVIDOR FINAL INICIANDO...');

// Health check Railway
app.get('/health', (req, res) => {
  console.log('🏥 Health check solicitado');
  res.status(200).json({
    status: 'healthy',
    service: 'coinbitclub-final',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: 'final-v1.0.0',
    railway_ready: true
  });
});

// Root endpoint
app.get('/', (req, res) => {
  console.log('🏠 Root endpoint acessado');
  res.status(200).json({
    message: 'CoinBitClub Market Bot - FINAL SERVER',
    status: 'online',
    timestamp: new Date().toISOString(),
    endpoints: ['/health', '/api/health', '/webhook/test'],
    ready: true
  });
});

// API Health
app.get('/api/health', (req, res) => {
  console.log('🏥 API Health check');
  res.status(200).json({
    status: 'healthy',
    api: 'active',
    timestamp: new Date().toISOString(),
    server: 'final'
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
    processed_by: 'final-server'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    path: req.path,
    method: req.method,
    server: 'final'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(500).json({
    error: 'Erro interno',
    message: err.message,
    server: 'final'
  });
});

// Configuração Railway
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

console.log(`🔧 Configuração: PORT=${PORT}, HOST=${HOST}`);

// Iniciar servidor
const server = app.listen(PORT, HOST, () => {
  console.log('🚀 ===== SERVIDOR FINAL INICIADO =====');
  console.log(`🌐 Rodando em: http://${HOST}:${PORT}`);
  console.log('🎯 Railway URL: https://coinbitclub-market-bot-production.up.railway.app');
  console.log('✅ SERVIDOR FINAL PRONTO!');
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
