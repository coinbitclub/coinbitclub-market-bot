// CoinBitClub Market Bot - Servidor Otimizado para Railway
// Versão optimizada para resolver erro 502

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

console.log('🚀 INICIANDO SERVIDOR OPTIMIZADO RAILWAY...');

// Configuração do Express
const app = express();

// Middleware básico primeiro
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS otimizado
app.use(cors({
  origin: [
    'https://coinbitclub-market-bot.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Logging de requests para debug
app.use((req, res, next) => {
  console.log(`📡 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📦 Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Configuração do PostgreSQL Railway
const pool = new Pool({
  connectionString: 'postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway',
  ssl: {
    rejectUnauthorized: false
  },
  max: 5, // Limitar connections para Railway
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Teste de conexão melhorado
async function testDatabaseConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ PostgreSQL Railway conectado:', result.rows[0].current_time);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Erro conexão PostgreSQL:', error.message);
    return false;
  }
}

// ===== ENDPOINTS PRINCIPAIS =====

// Health Check Principal (Railway)
app.get('/health', async (req, res) => {
  console.log('🏥 Health check requisitado');
  
  try {
    const dbStatus = await testDatabaseConnection();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: dbStatus ? 'connected' : 'disconnected',
      version: '1.0.0-railway-optimized',
      environment: process.env.NODE_ENV || 'production'
    };
    
    console.log('✅ Health check OK');
    res.json(health);
    
  } catch (error) {
    console.error('❌ Health check error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  console.log('🏠 Root endpoint acessado');
  res.json({
    service: 'CoinBitClub Market Bot',
    status: 'active',
    version: '1.0.0-railway-optimized',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    endpoints: {
      health: '/health',
      webhook_tradingview: '/api/webhooks/tradingview',
      webhook_generic: '/webhook/signal1',
      api_status: '/api/status'
    }
  });
});

// API Health Check
app.get('/api/health', async (req, res) => {
  console.log('🏥 API Health check requisitado');
  
  try {
    const dbStatus = await testDatabaseConnection();
    
    res.json({
      status: 'healthy',
      service: 'coinbitclub-api-gateway',
      database: dbStatus ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      railway_optimized: true
    });
    
  } catch (error) {
    console.error('❌ API Health error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// API Status endpoint
app.get('/api/status', (req, res) => {
  console.log('📊 Status endpoint acessado');
  res.json({
    status: 'active',
    service: 'coinbitclub-market-bot',
    version: '1.0.0-railway',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    }
  });
});

// ===== WEBHOOK ENDPOINTS =====

// Webhook TradingView Principal
app.post('/api/webhooks/tradingview', async (req, res) => {
  console.log('📡 WEBHOOK TRADINGVIEW RECEBIDO');
  console.log('📊 Payload:', JSON.stringify(req.body, null, 2));
  
  try {
    const { token, strategy, symbol, action, price, timestamp, indicators, test_mode } = req.body;
    
    // Validar token
    const expectedToken = 'coinbitclub_webhook_secret_2024';
    if (token !== expectedToken) {
      console.log('❌ Token inválido:', token);
      return res.status(401).json({
        success: false,
        error: 'Token de webhook inválido',
        received_token: token ? 'present_but_invalid' : 'missing'
      });
    }
    
    // Validar campos obrigatórios
    if (!symbol || !action || !price) {
      console.log('❌ Campos obrigatórios faltando');
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: symbol, action, price'
      });
    }
    
    // Gerar ID único para o sinal
    const signalId = crypto.randomBytes(16).toString('hex');
    const processedAt = new Date().toISOString();
    
    console.log(`✅ Webhook TradingView processado: ${signalId}`);
    
    const result = {
      success: true,
      signal_id: signalId,
      symbol: symbol,
      action: action,
      price: price,
      strategy: strategy || 'unknown',
      test_mode: test_mode || false,
      processed_at: processedAt,
      message: 'Sinal TradingView processado com sucesso'
    };
    
    // Tentar salvar no banco de dados
    try {
      await pool.query(`
        INSERT INTO raw_webhook (source, payload, status, created_at)
        VALUES ($1, $2, $3, $4)
      `, ['TRADINGVIEW', JSON.stringify(req.body), 'processed', new Date()]);
      
      console.log('✅ Webhook salvo no banco de dados');
      result.database_saved = true;
      
    } catch (dbError) {
      console.log('⚠️ Erro ao salvar no banco:', dbError.message);
      result.database_saved = false;
      result.database_error = dbError.message;
    }
    
    res.status(200).json(result);
    
  } catch (error) {
    console.error('💥 Erro ao processar webhook TradingView:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Webhook Genérico Signal1
app.post('/webhook/signal1', async (req, res) => {
  console.log('📡 WEBHOOK SIGNAL1 RECEBIDO');
  console.log('📊 Payload:', JSON.stringify(req.body, null, 2));
  
  try {
    const signalId = crypto.randomBytes(16).toString('hex');
    const processedAt = new Date().toISOString();
    
    console.log(`✅ Sinal genérico processado: ${signalId}`);
    
    const result = {
      success: true,
      signal_id: signalId,
      route: '/webhook/signal1',
      data_received: req.body,
      processed_at: processedAt,
      message: 'Sinal genérico processado com sucesso'
    };
    
    // Tentar salvar no banco
    try {
      await pool.query(`
        INSERT INTO raw_webhook (source, payload, status, created_at)
        VALUES ($1, $2, $3, $4)
      `, ['GENERIC_SIGNAL1', JSON.stringify(req.body), 'processed', new Date()]);
      
      result.database_saved = true;
      
    } catch (dbError) {
      console.log('⚠️ Erro ao salvar signal1:', dbError.message);
      result.database_saved = false;
    }
    
    res.status(200).json(result);
    
  } catch (error) {
    console.error('💥 Erro no webhook signal1:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

// Webhook genérico para qualquer rota /webhook/*
app.post('/webhook/:signal', async (req, res) => {
  console.log(`📡 WEBHOOK GENÉRICO - Rota: /webhook/${req.params.signal}`);
  console.log('📊 Payload:', JSON.stringify(req.body, null, 2));
  
  try {
    const signalId = crypto.randomBytes(16).toString('hex');
    const processedAt = new Date().toISOString();
    
    const result = {
      success: true,
      signal_id: signalId,
      route: `/webhook/${req.params.signal}`,
      data_received: req.body,
      processed_at: processedAt,
      message: `Sinal da rota /webhook/${req.params.signal} processado`
    };
    
    console.log(`✅ Webhook ${req.params.signal} processado: ${signalId}`);
    
    res.status(200).json(result);
    
  } catch (error) {
    console.error('💥 Erro no webhook genérico:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

// ===== ERROR HANDLERS =====

// 404 Handler
app.use((req, res) => {
  console.log(`❌ 404 - Endpoint não encontrado: ${req.method} ${req.path}`);
  res.status(404).json({
    error: 'Endpoint não encontrado',
    method: req.method,
    path: req.path,
    available_endpoints: [
      'GET /',
      'GET /health',
      'GET /api/health',
      'GET /api/status',
      'POST /api/webhooks/tradingview',
      'POST /webhook/signal1',
      'POST /webhook/:signal'
    ],
    timestamp: new Date().toISOString()
  });
});

// Error Handler
app.use((error, req, res, next) => {
  console.error('💥 Erro na aplicação:', error);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// ===== STARTUP DO SERVIDOR =====

// Configuração de porta otimizada para Railway
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Railway requer 0.0.0.0

console.log('🔍 Configuração do servidor:');
console.log(`   PORT: ${PORT} (env: ${process.env.PORT})`);
console.log(`   HOST: ${HOST}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not-set'}`);

// Iniciar servidor
const server = app.listen(PORT, HOST, async () => {
  console.log('🚀 ===== SERVIDOR RAILWAY OTIMIZADO INICIADO =====');
  console.log(`🌐 Servidor rodando em: http://${HOST}:${PORT}`);
  console.log(`🌐 Railway URL: https://coinbitclub-market-bot-production.up.railway.app`);
  console.log('');
  
  // Testar conexão com banco
  await testDatabaseConnection();
  
  console.log('📋 Endpoints disponíveis:');
  console.log('   🏠 GET  /                              - Status principal');
  console.log('   🏥 GET  /health                        - Health check Railway');
  console.log('   🏥 GET  /api/health                    - API Health check');
  console.log('   📊 GET  /api/status                    - Status da API');
  console.log('   📡 POST /api/webhooks/tradingview      - Webhook TradingView');
  console.log('   📡 POST /webhook/signal1               - Webhook Signal1');
  console.log('   📡 POST /webhook/:signal               - Webhook genérico');
  console.log('');
  console.log('🔗 Banco: PostgreSQL Railway');
  console.log('✅ Sistema otimizado para Railway - PRONTO!');
});

// Error handling do servidor
server.on('error', (err) => {
  console.error('❌ Erro no servidor:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Porta ${PORT} já está em uso`);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📤 SIGTERM recebido, encerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor encerrado graciosamente');
    pool.end(() => {
      console.log('✅ Pool de conexões encerrado');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('📤 SIGINT recebido, encerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor encerrado');
    pool.end(() => {
      console.log('✅ Pool de conexões encerrado');
      process.exit(0);
    });
  });
});

module.exports = app;
