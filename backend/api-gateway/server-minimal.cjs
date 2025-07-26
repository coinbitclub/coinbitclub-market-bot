// Servidor minimo Railway - maximo debug
const express = require('express');
const app = express();

console.log('=== INICIANDO SERVIDOR RAILWAY MINIMAL ===');
console.log('Timestamp:', new Date().toISOString());
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('PID:', process.pid);

// Middleware minimo
app.use(express.json());

// Log completo
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - Headers:`, JSON.stringify(req.headers, null, 2));
  next();
});

// Configuracao Railway PRIMEIRO
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

console.log('=== CONFIGURACAO ===');
console.log('PORT env:', process.env.PORT);
console.log('PORT final:', PORT);
console.log('HOST:', HOST);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('==================');

// Rotas essenciais
app.get('/', (req, res) => {
  const response = {
    status: 'OK',
    message: 'Railway MINIMAL funcionando!',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid,
    env: {
      PORT: process.env.PORT,
      NODE_ENV: process.env.NODE_ENV
    }
  };
  console.log('Respondendo GET /:', JSON.stringify(response, null, 2));
  res.json(response);
});

app.get('/health', (req, res) => {
  const response = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid
  };
  console.log('Respondendo GET /health:', JSON.stringify(response, null, 2));
  res.json(response);
});

app.get('/api/health', (req, res) => {
  const response = {
    status: 'healthy',
    service: 'railway-minimal',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  };
  console.log('Respondendo GET /api/health:', JSON.stringify(response, null, 2));
  res.json(response);
});

// Webhook teste
app.post('/webhook/signal1', (req, res) => {
  console.log('Webhook recebido:', JSON.stringify(req.body, null, 2));
  const response = {
    success: true,
    message: 'Webhook processado com sucesso',
    data: req.body,
    timestamp: new Date().toISOString()
  };
  console.log('Respondendo webhook:', JSON.stringify(response, null, 2));
  res.json(response);
});

// Catch all 404
app.use((req, res) => {
  console.log(`404 - Endpoint nao encontrado: ${req.method} ${req.path}`);
  res.status(404).json({
    error: 'Endpoint nao encontrado',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('ERRO CAPTURADO:', error);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

console.log('=== INICIANDO LISTEN ===');

try {
  const server = app.listen(PORT, HOST, () => {
    console.log('🎉 SERVIDOR INICIADO COM SUCESSO!');
    console.log(`🌐 Escutando em: http://${HOST}:${PORT}`);
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    console.log(`🆔 PID: ${process.pid}`);
    console.log('✅ Pronto para receber requisicoes!');
    console.log('================================');
  });

  server.on('error', (error) => {
    console.error('ERRO NO SERVIDOR:', error);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('📤 SIGTERM recebido, encerrando graciosamente...');
    server.close(() => {
      console.log('✅ Servidor encerrado com sucesso');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('📤 SIGINT recebido, encerrando...');
    server.close(() => {
      console.log('✅ Servidor encerrado');
      process.exit(0);
    });
  });

} catch (error) {
  console.error('💥 ERRO FATAL AO INICIAR SERVIDOR:', error);
  process.exit(1);
}

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('💥 EXCECAO NAO CAPTURADA:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 REJEICAO NAO TRATADA:', reason);
  console.error('Promise:', promise);
  process.exit(1);
});

console.log('=== SETUP COMPLETO ===');

module.exports = app;
});

// Endpoints básicos para teste
app.get('/', (req, res) => {
  console.log('GET / - Endpoint raiz chamado');
  res.json({
    service: 'CoinBitClub Market Bot',
    status: 'online',
    timestamp: new Date().toISOString(),
    message: 'Servidor funcionando - versao minima'
  });
});

app.get('/health', (req, res) => {
  console.log('GET /health - Health check chamado');
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  console.log('GET /api/health - API health check chamado');
  res.json({
    status: 'healthy',
    service: 'coinbitclub-market-bot',
    timestamp: new Date().toISOString()
  });
});

// Webhook simples para teste
app.post('/webhook/signal1', (req, res) => {
  console.log('POST /webhook/signal1 - Webhook recebido');
  console.log('Body:', JSON.stringify(req.body, null, 2));
  res.json({
    success: true,
    message: 'Webhook recebido com sucesso',
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Erro na aplicacao:', error);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: error.message
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

// Configuração de porta
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

console.log('Configuracao:');
console.log('  PORT env:', process.env.PORT);
console.log('  PORT usado:', PORT);
console.log('  HOST usado:', HOST);

const server = app.listen(PORT, HOST, () => {
  console.log('=== SERVIDOR MINIMO INICIADO ===');
  console.log(`URL: http://${HOST}:${PORT}`);
  console.log('Endpoints disponiveis:');
  console.log('  GET  /');
  console.log('  GET  /health');
  console.log('  GET  /api/health');
  console.log('  POST /webhook/signal1');
  console.log('Sistema pronto!');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido, finalizando servidor...');
  server.close(() => {
    console.log('Servidor finalizado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT recebido, finalizando servidor...');
  server.close(() => {
    console.log('Servidor finalizado');
    process.exit(0);
  });
});

module.exports = app;
