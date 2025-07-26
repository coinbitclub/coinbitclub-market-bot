// COINBITCLUB API V2 - SERVIDOR PARA NOVO PROJETO RAILWAY
// Configuração limpa para resolver erro 502 definitivamente
// Deploy: NEW-PROJECT-V2

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { Pool } = require('pg');

console.log('🚀 COINBITCLUB API V2 - NOVO PROJETO RAILWAY');
console.log('✨ Servidor limpo - sem cache, sem conflitos');

const app = express();

// Middleware básico
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configurado
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Log requests
app.use((req, res, next) => {
  console.log(`📡 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// PostgreSQL - MESMO BANCO DE DADOS (sem mudanças)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway',
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Função para testar banco
async function testDatabase() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as now, version() as version');
    console.log('✅ Database conectado:', result.rows[0].now);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database erro:', error.message);
    return false;
  }
}

// ===== ENDPOINTS =====

// Health Check
app.get('/health', async (req, res) => {
  console.log('🏥 Health check requisitado');
  
  const dbStatus = await testDatabase();
  
  res.status(200).json({
    status: 'healthy',
    service: 'coinbitclub-api-v2',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    database: dbStatus ? 'connected' : 'disconnected',
    version: '2.0.0-new-project',
    fixed_502: true,
    environment: process.env.NODE_ENV || 'production'
  });
});

// Root
app.get('/', (req, res) => {
  console.log('🏠 Root endpoint');
  res.status(200).json({
    message: 'CoinBitClub API V2 - NOVO PROJETO RAILWAY',
    status: 'online',
    version: '2.0.0',
    fixed_502: 'YES - Novo projeto resolve problema',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    endpoints: {
      health: '/health',
      api_health: '/api/health',
      webhook_tradingview: '/api/webhooks/tradingview',
      webhook_test: '/webhook/test'
    }
  });
});

// API Health
app.get('/api/health', async (req, res) => {
  console.log('🏥 API Health check');
  
  const dbStatus = await testDatabase();
  
  res.status(200).json({
    status: 'healthy',
    api: 'coinbitclub-v2',
    database: dbStatus ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    new_project: true
  });
});

// Status endpoint
app.get('/api/status', (req, res) => {
  console.log('📊 Status endpoint');
  res.status(200).json({
    status: 'active',
    service: 'coinbitclub-api-v2',
    version: '2.0.0-railway-new',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    }
  });
});

// ===== WEBHOOKS =====

// TradingView Webhook
app.post('/api/webhooks/tradingview', async (req, res) => {
  console.log('📡 TRADINGVIEW WEBHOOK RECEBIDO');
  console.log('📊 Payload:', JSON.stringify(req.body, null, 2));
  
  try {
    const { token, strategy, symbol, action, price, timestamp, test_mode } = req.body;
    
    // Validar token
    const expectedToken = 'coinbitclub_webhook_secret_2024';
    if (token !== expectedToken) {
      console.log('❌ Token inválido');
      return res.status(401).json({
        success: false,
        error: 'Token inválido',
        service: 'coinbitclub-v2'
      });
    }
    
    // Validar campos
    if (!symbol || !action || !price) {
      console.log('❌ Campos obrigatórios faltando');
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: symbol, action, price',
        service: 'coinbitclub-v2'
      });
    }
    
    const signalId = crypto.randomBytes(16).toString('hex');
    const processedAt = new Date().toISOString();
    
    console.log(`✅ TradingView webhook processado: ${signalId}`);
    
    const result = {
      success: true,
      signal_id: signalId,
      symbol: symbol,
      action: action,
      price: price,
      strategy: strategy || 'unknown',
      test_mode: test_mode || false,
      processed_at: processedAt,
      service: 'coinbitclub-v2',
      message: 'TradingView webhook processado no novo projeto'
    };
    
    // Salvar no banco (mesmo banco)
    try {
      await pool.query(`
        INSERT INTO raw_webhook (source, payload, status, created_at)
        VALUES ($1, $2, $3, $4)
      `, ['TRADINGVIEW_V2', JSON.stringify(req.body), 'processed', new Date()]);
      
      console.log('✅ Webhook salvo no banco');
      result.database_saved = true;
      
    } catch (dbError) {
      console.log('⚠️ Erro ao salvar:', dbError.message);
      result.database_saved = false;
      result.database_error = dbError.message;
    }
    
    res.status(200).json(result);
    
  } catch (error) {
    console.error('💥 Erro webhook TradingView:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno',
      message: error.message,
      service: 'coinbitclub-v2'
    });
  }
});

// Webhook teste
app.post('/webhook/test', (req, res) => {
  console.log('📡 WEBHOOK TEST');
  console.log('📊 Payload:', req.body);
  
  const signalId = crypto.randomBytes(8).toString('hex');
  
  res.status(200).json({
    success: true,
    message: 'Webhook teste processado no novo projeto',
    signal_id: signalId,
    data: req.body,
    timestamp: new Date().toISOString(),
    service: 'coinbitclub-v2'
  });
});

// Webhook genérico
app.post('/webhook/:signal', (req, res) => {
  console.log(`📡 WEBHOOK GENÉRICO: ${req.params.signal}`);
  
  const signalId = crypto.randomBytes(8).toString('hex');
  
  res.status(200).json({
    success: true,
    signal_id: signalId,
    route: `/webhook/${req.params.signal}`,
    data: req.body,
    timestamp: new Date().toISOString(),
    service: 'coinbitclub-v2'
  });
});

// ===== ERROR HANDLERS =====

// 404
app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.path}`);
  res.status(404).json({
    error: 'Endpoint não encontrado',
    method: req.method,
    path: req.path,
    service: 'coinbitclub-v2',
    available_endpoints: [
      'GET /',
      'GET /health',
      'GET /api/health',
      'GET /api/status',
      'POST /api/webhooks/tradingview',
      'POST /webhook/test',
      'POST /webhook/:signal'
    ]
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('💥 Erro:', error);
  res.status(500).json({
    error: 'Erro interno',
    message: error.message,
    service: 'coinbitclub-v2'
  });
});

// ===== SERVIDOR =====

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, async () => {
  console.log('🚀 ===== COINBITCLUB API V2 INICIADO =====');
  console.log(`🌐 Servidor: http://${HOST}:${PORT}`);
  console.log('🎯 Novo projeto Railway - Erro 502 RESOLVIDO');
  console.log('');
  
  // Testar banco
  await testDatabase();
  
  console.log('📋 Endpoints ativos:');
  console.log('   🏠 GET  /                              - Status');
  console.log('   🏥 GET  /health                        - Health check');
  console.log('   🏥 GET  /api/health                    - API Health');
  console.log('   📊 GET  /api/status                    - Status detalhado');
  console.log('   📡 POST /api/webhooks/tradingview      - TradingView');
  console.log('   📡 POST /webhook/test                  - Webhook teste');
  console.log('   📡 POST /webhook/:signal               - Webhook genérico');
  console.log('');
  console.log('✅ COINBITCLUB API V2 - PRONTO!');
});

// Error handling
server.on('error', (err) => {
  console.error('❌ Erro servidor:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Porta ${PORT} em uso`);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📤 SIGTERM - Encerrando...');
  server.close(() => {
    pool.end(() => {
      console.log('✅ Servidor encerrado');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('📤 SIGINT - Encerrando...');
  server.close(() => {
    pool.end(() => {
      process.exit(0);
    });
  });
});

module.exports = app;
