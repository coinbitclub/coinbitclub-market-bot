const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Configurações de segurança
app.use(helmet());

// CORS configurado para aceitar o frontend
const allowedOrigins = [
  'https://coinbitclub-market-bot.vercel.app',
  'https://coinbitclub-marketbot.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware para parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  };
  
  console.log('Respondendo /health:', healthData);
  res.json(healthData);
});

// Root endpoint
app.get('/', (req, res) => {
  const response = {
    status: 'OK',
    message: 'CoinbitClub Market Bot API Gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: {
      PORT: process.env.PORT,
      NODE_ENV: process.env.NODE_ENV
    },
    endpoints: {
      health: '/health',
      webhooks: '/api/webhooks/*',
      admin: '/api/admin/*',
      auth: '/api/auth/*'
    }
  };
  
  console.log('Respondendo /:', response);
  res.json(response);
});

// ===========================================
// ROTAS DA API
// ===========================================

// Webhooks do TradingView
app.post('/api/webhooks/signal', (req, res) => {
  console.log('Webhook TradingView recebido:', req.body);
  
  try {
    // Aqui você processaria o sinal do TradingView
    const signal = req.body;
    
    // Mock response para agora
    res.json({
      status: 'success',
      message: 'Sinal processado com sucesso',
      timestamp: new Date().toISOString(),
      signal_id: `signal_${Date.now()}`
    });
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor',
      timestamp: new Date().toISOString()
    });
  }
});

// Admin API - Dashboard metrics
app.get('/api/admin/metrics', (req, res) => {
  // Mock data para dashboard
  const metrics = {
    totalUsers: 1247,
    activeOperations: 15,
    totalVolume: 2847392.50,
    dailyReturn: 2.5,
    historicalReturn: 145.8,
    accuracy: 78.5,
    timestamp: new Date().toISOString()
  };
  
  res.json({
    status: 'success',
    data: metrics
  });
});

// Admin API - Market reading
app.get('/api/admin/market-reading', (req, res) => {
  const marketReading = {
    direction: 'LONG',
    confidence: 85,
    ai_justification: 'Análise técnica indica rompimento de resistência em BTC com volume crescente.',
    day_tracking: 'Bitcoin mantém força acima de $65,000. Volume institucional crescente.',
    created_at: new Date().toISOString()
  };
  
  res.json({
    status: 'success',
    data: marketReading
  });
});

// Admin API - System status
app.get('/api/admin/system-status', (req, res) => {
  const systemStatus = {
    api: 'online',
    database: 'online',
    payments: 'online',
    email: 'online',
    timestamp: new Date().toISOString()
  };
  
  res.json({
    status: 'success',
    data: systemStatus
  });
});

// Admin API - Operations
app.get('/api/admin/operations', (req, res) => {
  const operations = [
    {
      id: '1',
      symbol: 'BTC/USDT',
      entry_price: 64500,
      current_price: 66200,
      exchange: 'Binance',
      is_testnet: false,
      side: 'LONG',
      opened_at: new Date().toISOString(),
      return_percentage: 2.63
    },
    {
      id: '2',
      symbol: 'ETH/USDT',
      entry_price: 3200,
      current_price: 3150,
      exchange: 'Binance',
      is_testnet: false,
      side: 'LONG',
      opened_at: new Date().toISOString(),
      return_percentage: -1.56
    }
  ];
  
  res.json({
    status: 'success',
    data: operations
  });
});

// Admin API - Recent activities
app.get('/api/admin/activities', (req, res) => {
  const activities = [
    {
      id: '1',
      type: 'REGISTRATION',
      description: 'Novo usuário registrado no sistema',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      user: 'sistema'
    },
    {
      id: '2',
      type: 'OPERATION',
      description: 'Operação LONG executada em BTC/USDT',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      user: 'trading-bot'
    },
    {
      id: '3',
      type: 'SIGNAL',
      description: 'Sinal TradingView processado com sucesso',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      user: 'webhook'
    }
  ];
  
  res.json({
    status: 'success',
    data: activities
  });
});

// Admin API - Signals
app.get('/api/admin/signals', (req, res) => {
  const signals = [
    {
      id: '1',
      source: 'TRADINGVIEW',
      symbol: 'BTC/USDT',
      type: 'BUY',
      price: 66200,
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      source: 'COINTARS',
      symbol: 'ETH/USDT',
      type: 'ANALYSIS',
      price: 3150,
      created_at: new Date().toISOString(),
      indicator: 'RSI Oversold',
      data: { rsi: 28, macd: 'bullish_divergence' }
    }
  ];
  
  res.json({
    status: 'success',
    data: signals
  });
});

// Admin API - System alerts
app.get('/api/admin/alerts', (req, res) => {
  const alerts = [
    {
      id: '1',
      type: 'INFO',
      message: 'Sistema funcionando normalmente',
      timestamp: new Date().toISOString()
    }
  ];
  
  res.json({
    status: 'success',
    data: alerts
  });
});

// Autenticação - Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Mock authentication
  if (email && password) {
    res.json({
      status: 'success',
      token: 'mock_jwt_token_' + Date.now(),
      user: {
        id: 1,
        email: email,
        name: 'Admin User',
        role: 'admin'
      }
    });
  } else {
    res.status(400).json({
      status: 'error',
      message: 'Email e senha são obrigatórios'
    });
  }
});

// 404 Handler
app.use('*', (req, res) => {
  console.log(`Rota não encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    status: 'error',
    message: 'Rota não encontrada',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Erro interno:', error);
  res.status(500).json({
    status: 'error',
    message: 'Erro interno do servidor',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('=== COINBITCLUB API GATEWAY ===');
  console.log(`🚀 Servidor iniciado na porta ${PORT}`);
  console.log(`🌐 URL: http://0.0.0.0:${PORT}`);
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log(`🔧 Node version: ${process.version}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('================================');
});

module.exports = app;
