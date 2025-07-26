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

// === WEBHOOKS TRADINGVIEW ===

// Webhook para sinais do TradingView
app.post('/api/webhooks/signal', (req, res) => {
  const { token } = req.query;
  const signalData = req.body;
  
  console.log('🎯 WEBHOOK SINAL TRADINGVIEW:', JSON.stringify(signalData));
  
  // Verificar token
  if (!token || token !== '210406') {
    console.log('❌ Token inválido:', token);
    return res.status(401).json({ error: 'Token inválido' });
  }
  
  try {
    // Determinar ação baseada nos cruzamentos EMA9
    let action = 'HOLD';
    if (signalData.cruzou_acima_ema9 === '1' || signalData.cruzou_acima_ema9 === 1) {
      action = 'BUY';
    } else if (signalData.cruzou_abaixo_ema9 === '1' || signalData.cruzou_abaixo_ema9 === 1) {
      action = 'SELL';
    }
    
    console.log(`✅ Sinal processado: ${action} para ${signalData.ticker}`);
    
    res.json({
      status: 'success',
      message: 'Sinal CoinBitClub recebido e processado',
      action: action,
      symbol: signalData.ticker,
      timestamp: new Date().toISOString(),
      server: 'railway-ultra-minimal'
    });
    
  } catch (error) {
    console.error('❌ Erro no webhook de sinal:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao processar sinal',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Webhook para dominância BTC
app.post('/api/webhooks/dominance', (req, res) => {
  const { token } = req.query;
  const dominanceData = req.body;
  
  console.log('📈 WEBHOOK DOMINÂNCIA BTC:', JSON.stringify(dominanceData));
  
  // Verificar token
  if (!token || token !== '210406') {
    console.log('❌ Token inválido:', token);
    return res.status(401).json({ error: 'Token inválido' });
  }
  
  try {
    console.log(`✅ Dominância processada: ${dominanceData.btc_dominance}% (${dominanceData.sinal})`);
    
    res.json({
      status: 'success',
      message: 'Dados de dominância BTC recebidos e processados',
      dominance: dominanceData.btc_dominance,
      signal: dominanceData.sinal,
      timestamp: new Date().toISOString(),
      server: 'railway-ultra-minimal'
    });
    
  } catch (error) {
    console.error('❌ Erro no webhook de dominância:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao processar dominância',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint para consultar sinais recentes (simulado)
app.get('/api/webhooks/signals/recent', (req, res) => {
  console.log('📊 Consultando sinais recentes (mock)');
  
  res.json({
    status: 'success',
    count: 0,
    signals: [],
    message: 'Endpoint funcionando - banco não conectado no ultra-minimal',
    timestamp: new Date().toISOString(),
    server: 'railway-ultra-minimal'
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
