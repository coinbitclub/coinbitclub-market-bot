/**
 * SERVIDOR PARA TESTES - CoinBitClub Market Bot
 * Versão sem rate limit para testes de todas as rotas
 * Porta: 3002
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = 3002;

// Middlewares básicos
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log de todas as requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Middleware de autenticação simples
const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token === 'admin-emergency-token') {
    req.isAdmin = true;
    next();
  } else if (req.path.includes('/admin/')) {
    res.status(401).json({ error: 'Token de admin necessário' });
  } else {
    next();
  }
};

app.use(authenticateAdmin);

// ===== ROTAS DE SAÚDE E STATUS =====

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    api: 'operational',
    timestamp: new Date().toISOString(),
    server: 'test-server'
  });
});

// Status geral
app.get('/api/status', (req, res) => {
  res.json({
    system: 'CoinBitClub Market Bot',
    version: '3.0.0',
    environment: 'test',
    services: {
      api: 'online',
      database: 'connected',
      trading: 'active',
      webhooks: 'listening'
    },
    uptime: '5 minutes',
    timestamp: new Date().toISOString()
  });
});

// Lista de endpoints
app.get('/api/test/endpoints', (req, res) => {
  res.json({
    message: 'Lista de endpoints disponíveis',
    endpoints: [
      'GET /api/health',
      'GET /api/status',
      'GET /api/test/endpoints',
      'GET /api/admin/emergency/status',
      'POST /api/admin/emergency/pause-trading',
      'POST /api/admin/emergency/resume-trading',
      'POST /api/admin/emergency/close-all-operations',
      'POST /api/ia-aguia/generate-daily-report',
      'POST /api/ia-aguia/generate-market-alert',
      'GET /api/ia-aguia/reports',
      'POST /api/webhooks/stripe',
      'POST /api/webhooks/tradingview'
    ],
    total: 12
  });
});

// ===== ROTAS DE EMERGÊNCIA (ADMIN) =====

// Status de emergência
app.get('/api/admin/emergency/status', (req, res) => {
  res.json({
    trading_status: 'active',
    emergency_mode: false,
    open_positions: 5,
    exchanges: {
      binance: { status: 'connected', env: 'testnet' },
      bybit: { status: 'connected', env: 'testnet' }
    },
    last_emergency_action: null,
    timestamp: new Date().toISOString()
  });
});

// Pausar trading
app.post('/api/admin/emergency/pause-trading', (req, res) => {
  const { exchange, environment, reason } = req.body;
  
  res.json({
    success: true,
    message: `Trading pausado em ${exchange} (${environment})`,
    action: 'pause_trading',
    exchange,
    environment,
    reason,
    timestamp: new Date().toISOString()
  });
});

// Retomar trading
app.post('/api/admin/emergency/resume-trading', (req, res) => {
  const { exchange, environment } = req.body;
  
  res.json({
    success: true,
    message: `Trading retomado em ${exchange} (${environment})`,
    action: 'resume_trading',
    exchange,
    environment,
    timestamp: new Date().toISOString()
  });
});

// Botão de emergência
app.post('/api/admin/emergency/close-all-operations', (req, res) => {
  const { reason } = req.body;
  
  res.json({
    success: true,
    message: 'Todas as operações foram fechadas com segurança',
    action: 'emergency_stop',
    closed_positions: 5,
    reason,
    timestamp: new Date().toISOString()
  });
});

// ===== ROTAS IA ÁGUIA =====

// Gerar relatório diário
app.post('/api/ia-aguia/generate-daily-report', (req, res) => {
  const { date } = req.body;
  
  res.json({
    success: true,
    message: 'Relatório diário gerado com sucesso',
    report_id: 'report_' + Date.now(),
    date,
    content: {
      market_overview: 'Mercado estável com tendência de alta',
      recommendations: ['Manter posições em BTC', 'Observar ETH'],
      risk_level: 'médio'
    },
    timestamp: new Date().toISOString()
  });
});

// Gerar alerta
app.post('/api/ia-aguia/generate-market-alert', (req, res) => {
  const { symbols, severity, custom_prompt } = req.body;
  
  res.json({
    success: true,
    message: 'Alerta de mercado gerado',
    alert_id: 'alert_' + Date.now(),
    symbols,
    severity,
    alert: 'Movimento significativo detectado nos ativos monitorados',
    custom_prompt,
    timestamp: new Date().toISOString()
  });
});

// Listar relatórios
app.get('/api/ia-aguia/reports', (req, res) => {
  res.json({
    reports: [
      {
        id: 'report_001',
        type: 'daily',
        date: '2025-01-26',
        status: 'completed'
      },
      {
        id: 'alert_001',
        type: 'alert',
        date: '2025-01-26',
        status: 'active'
      }
    ],
    total: 2,
    timestamp: new Date().toISOString()
  });
});

// ===== WEBHOOKS =====

// Webhook Stripe
app.post('/api/webhooks/stripe', (req, res) => {
  const { type, data } = req.body;
  
  res.json({
    success: true,
    message: 'Webhook Stripe processado',
    event_type: type,
    payment_id: data?.object?.id || 'unknown',
    amount: data?.object?.amount || 0,
    timestamp: new Date().toISOString()
  });
});

// Webhook TradingView
app.post('/api/webhooks/tradingview', (req, res) => {
  const { symbol, action, price, volume } = req.body;
  
  res.json({
    success: true,
    message: 'Sinal TradingView recebido',
    signal: {
      symbol,
      action,
      price,
      volume
    },
    processed: true,
    timestamp: new Date().toISOString()
  });
});

// Middleware de erro
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: err.message 
  });
});

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint não encontrado',
    path: req.originalUrl,
    available_endpoints: '/api/test/endpoints'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('🚀 SERVIDOR DE TESTES INICIADO');
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log('✅ Todas as rotas funcionais');
  console.log('🔓 Sem rate limit');
  console.log('🔑 Token admin: admin-emergency-token');
  console.log('📅 Iniciado em:', new Date().toLocaleString('pt-BR'));
});
