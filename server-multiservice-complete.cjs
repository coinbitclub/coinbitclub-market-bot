// 🚀 CoinBitClub Market Bot - Servidor Multiserviço Completo Railway V3
// Configuração completa para operação multiserviço com GET e POST
// VERSÃO FINAL OTIMIZADA: 2025-07-25

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

console.log('🚀 INICIANDO SERVIDOR MULTISERVIÇO COMPLETO...');
console.log('🔧 CONFIGURAÇÕES OTIMIZADAS PARA RAILWAY V3');

// Configurações de versão e identificação
const SERVER_VERSION = 'v3.0.0-multiservice-hybrid-' + Date.now();
const SERVER_ID = crypto.randomBytes(16).toString('hex');
const START_TIME = Date.now();

console.log(`📦 Versão: ${SERVER_VERSION}`);
console.log(`🆔 Server ID: ${SERVER_ID}`);
console.log(`⏰ Inicializado em: ${new Date().toISOString()}`);

// ===== CONFIGURAÇÕES MULTIUSUÁRIO HÍBRIDO =====
const SISTEMA_MULTIUSUARIO = process.env.SISTEMA_MULTIUSUARIO === 'true' || true;
const MODO_HIBRIDO = process.env.MODO_HIBRIDO === 'true' || true;
const TEMPO_REAL_ENABLED = process.env.TEMPO_REAL_ENABLED === 'true' || true;

console.log(`🔧 Sistema Multiusuário: ${SISTEMA_MULTIUSUARIO ? 'ATIVO' : 'INATIVO'}`);
console.log(`🔄 Modo Híbrido: ${MODO_HIBRIDO ? 'ATIVO' : 'INATIVO'}`);
console.log(`⚡ Tempo Real: ${TEMPO_REAL_ENABLED ? 'ATIVO' : 'INATIVO'}`);

// ===== CONFIGURAÇÃO DO EXPRESS =====

const app = express();

// Configuração de segurança com Helmet
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Headers personalizados para Railway V3
app.use((req, res, next) => {
  res.set({
    'X-Server-Version': SERVER_VERSION,
    'X-Server-ID': SERVER_ID,
    'X-Railway-Service': 'coinbitclub-multiservice',
    'X-Powered-By': 'Railway-V3-Optimized',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  next();
});

// Middleware de parsing robusto
app.use(express.json({ 
  limit: '10mb',
  strict: false,
  type: ['application/json', 'text/plain']
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  parameterLimit: 1000
}));
app.use(express.text({ limit: '10mb' }));
app.use(express.raw({ limit: '10mb' }));

// CORS otimizado para multiserviço
app.use(cors({
  origin: function (origin, callback) {
    // Permitir todos os origins em produção Railway
    if (!origin || 
        origin.includes('railway.app') || 
        origin.includes('vercel.app') || 
        origin.includes('localhost') ||
        origin.includes('127.0.0.1')) {
      callback(null, true);
    } else {
      callback(null, true); // Permitir todos por enquanto
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'X-API-Key',
    'X-Webhook-Token',
    'User-Agent',
    'Accept',
    'Accept-Language',
    'Accept-Encoding'
  ],
  exposedHeaders: [
    'X-Server-Version',
    'X-Server-ID',
    'X-Railway-Service'
  ],
  optionsSuccessStatus: 200,
  preflightContinue: false
}));

// Rate limiting configurável
const createRateLimit = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: { error: message, timestamp: new Date().toISOString() },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Pular rate limit para health checks
    return req.path.includes('/health') || req.path.includes('/status');
  }
});

// Rate limits diferentes para diferentes endpoints
app.use('/api/webhooks', createRateLimit(60000, 100, 'Muitos webhooks por minuto'));
app.use('/api', createRateLimit(60000, 1000, 'Muitas requisições API por minuto'));

// Logging detalhado
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const userAgent = req.get('User-Agent') || 'unknown';
  const origin = req.get('Origin') || req.get('Referer') || 'direct';
  
  console.log(`📡 ${timestamp} - ${req.method} ${req.path}`);
  console.log(`   Origin: ${origin}`);
  console.log(`   User-Agent: ${userAgent.substring(0, 50)}...`);
  
  // Log detalhado para webhooks e POSTs
  if ((req.method === 'POST' || req.path.includes('webhook')) && req.body) {
    if (typeof req.body === 'object' && Object.keys(req.body).length > 0) {
      console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
    } else if (typeof req.body === 'string' && req.body.length > 0) {
      console.log('📦 Request Body (text):', req.body.substring(0, 200));
    }
  }
  
  // Log de query parameters
  if (Object.keys(req.query).length > 0) {
    console.log('🔍 Query Params:', JSON.stringify(req.query, null, 2));
  }
  
  next();
});

// ===== CONFIGURAÇÃO DO POSTGRESQL =====

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway') ? { 
    rejectUnauthorized: false,
    sslmode: 'require'
  } : false,
  max: 20,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
  acquireTimeoutMillis: 15000,
  createTimeoutMillis: 15000,
  destroyTimeoutMillis: 5000,
  reapIntervalMillis: 1000,
  createRetryIntervalMillis: 100
});

// Log da configuração do banco
console.log('🗄️ Configuração PostgreSQL Multiserviço:');
console.log(`   SSL: ${process.env.DATABASE_URL?.includes('railway') ? 'habilitado (require)' : 'desabilitado'}`);
console.log(`   Pool: min=2, max=20`);
console.log(`   Timeouts: connect=15s, idle=30s`);

// Função de teste de conexão robusta
async function testDatabaseConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ PostgreSQL Multiserviço conectado:', result.rows[0].current_time);
    
    // Verificar estrutura do banco
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log(`📊 Tabelas encontradas: ${tablesResult.rows.length}`);
    if (tablesResult.rows.length > 0) {
      console.log('📋 Tabelas:', tablesResult.rows.map(row => row.table_name).join(', '));
    }
    
    client.release();
    return {
      status: 'connected',
      tables: tablesResult.rows.length,
      version: result.rows[0].pg_version.substring(0, 50)
    };
  } catch (error) {
    console.error('❌ Erro conexão PostgreSQL:', error.message);
    return {
      status: 'disconnected',
      error: error.message
    };
  }
}

// ===== ENDPOINTS PRINCIPAIS =====

// Root endpoint - Informações completas do serviço
app.get('/', (req, res) => {
  console.log('🏠 Root endpoint multiserviço acessado');
  
  const uptime = Math.floor((Date.now() - START_TIME) / 1000);
  
  res.json({
    service: 'CoinBitClub Market Bot Multiserviço',
    status: 'active',
    version: SERVER_VERSION,
    server_id: SERVER_ID,
    type: 'railway-multiservice',
    timestamp: new Date().toISOString(),
    uptime_seconds: uptime,
    uptime_formatted: formatUptime(uptime),
    
    capabilities: {
      webhooks_reception: true,
      rest_api: true,
      database_operations: true,
      real_time_processing: true,
      multi_format_support: true,
      rate_limiting: true,
      security_headers: true,
      cors_optimized: true
    },
    
    endpoints: {
      info: {
        root: 'GET /',
        health: 'GET /health',
        api_health: 'GET /api/health', 
        status: 'GET /api/status',
        metrics: 'GET /api/metrics'
      },
      webhooks: {
        tradingview: 'POST /api/webhooks/tradingview',
        generic: 'POST /webhook/:signal',
        custom: 'POST /api/webhooks/:service',
        test: 'POST /api/webhooks/test'
      },
      api: {
        data_get: 'GET /api/data',
        data_post: 'POST /api/data',
        config_get: 'GET /api/config',
        config_post: 'POST /api/config',
        signals_get: 'GET /api/signals',
        signals_post: 'POST /api/signals'
      }
    },
    
    environment: {
      node_env: process.env.NODE_ENV || 'production',
      port: process.env.PORT || 3000,
      database: process.env.DATABASE_URL ? 'configured' : 'missing',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  });
});

// Health Check principal - Completo
app.get('/health', async (req, res) => {
  console.log('🏥 Health check multiserviço requisitado');
  
  try {
    const dbStatus = await testDatabaseConnection();
    const uptime = Math.floor((Date.now() - START_TIME) / 1000);
    const memoryUsage = process.memoryUsage();
    
    const health = {
      status: 'healthy',
      service: 'coinbitclub-multiservice',
      version: SERVER_VERSION,
      server_id: SERVER_ID,
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: uptime,
        formatted: formatUptime(uptime)
      },
      
      system: {
        memory: {
          used_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          total_mb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          external_mb: Math.round(memoryUsage.external / 1024 / 1024)
        },
        process: {
          pid: process.pid,
          node_version: process.version,
          platform: process.platform
        }
      },
      
      database: dbStatus,
      
      capabilities: {
        get_requests: true,
        post_requests: true,
        webhooks: true,
        real_time: true,
        multi_format: true
      },
      
      last_requests: {
        total: req.app.locals.requestCount || 0,
        webhooks: req.app.locals.webhookCount || 0
      }
    };
    
    console.log('✅ Health check multiserviço OK');
    res.json(health);
    
  } catch (error) {
    console.error('❌ Health check multiserviço error:', error);
    res.status(500).json({
      status: 'error',
      service: 'coinbitclub-multiservice',
      version: SERVER_VERSION,
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API Health Check
app.get('/api/health', async (req, res) => {
  console.log('🏥 API Health multiserviço requisitado');
  
  try {
    const dbStatus = await testDatabaseConnection();
    
    res.json({
      status: 'healthy',
      service: 'coinbitclub-api-multiservice',
      version: SERVER_VERSION,
      database: dbStatus.status,
      database_tables: dbStatus.tables || 0,
      timestamp: new Date().toISOString(),
      
      api_capabilities: {
        rest_endpoints: true,
        webhook_reception: true,
        data_processing: true,
        real_time_updates: true,
        multi_format_support: true
      },
      
      optimizations: [
        'railway_v3_optimized',
        'multi_service_architecture',
        'enhanced_error_handling',
        'improved_logging',
        'rate_limiting_enabled',
        'security_headers_active'
      ]
    });
    
  } catch (error) {
    console.error('❌ API Health multiserviço error:', error);
    res.status(500).json({
      status: 'error',
      service: 'coinbitclub-api-multiservice',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Status endpoint detalhado
app.get('/api/status', (req, res) => {
  console.log('📊 Status multiserviço endpoint acessado');
  
  const uptime = Math.floor((Date.now() - START_TIME) / 1000);
  const memoryUsage = process.memoryUsage();
  
  res.json({
    status: 'active',
    service: 'coinbitclub-multiservice',
    version: SERVER_VERSION,
    server_id: SERVER_ID,
    timestamp: new Date().toISOString(),
    
    runtime: {
      uptime_seconds: uptime,
      uptime_formatted: formatUptime(uptime),
      start_time: new Date(START_TIME).toISOString(),
      process_id: process.pid
    },
    
    memory: {
      heap_used_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heap_total_mb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      external_mb: Math.round(memoryUsage.external / 1024 / 1024),
      rss_mb: Math.round(memoryUsage.rss / 1024 / 1024)
    },
    
    requests: {
      total: req.app.locals.requestCount || 0,
      webhooks: req.app.locals.webhookCount || 0,
      api_calls: req.app.locals.apiCount || 0
    },
    
    performance: {
      type: 'railway-multiservice',
      optimizations_applied: true,
      error_502_resolved: true,
      multi_service_ready: true
    },
    
    multiuser_system: {
      enabled: SISTEMA_MULTIUSUARIO,
      hybrid_mode: MODO_HIBRIDO,
      realtime_enabled: TEMPO_REAL_ENABLED,
      features: {
        multi_user_trading: SISTEMA_MULTIUSUARIO,
        hybrid_operations: MODO_HIBRIDO,
        realtime_monitoring: TEMPO_REAL_ENABLED,
        individual_api_keys: true,
        separate_balances: true,
        commission_system: true
      }
    }
  });
});

// Métricas detalhadas
app.get('/api/metrics', (req, res) => {
  console.log('📈 Métricas multiserviço requisitadas');
  
  const uptime = Math.floor((Date.now() - START_TIME) / 1000);
  
  res.json({
    service: 'coinbitclub-multiservice',
    version: SERVER_VERSION,
    timestamp: new Date().toISOString(),
    
    metrics: {
      uptime_seconds: uptime,
      requests_total: req.app.locals.requestCount || 0,
      webhooks_received: req.app.locals.webhookCount || 0,
      api_calls: req.app.locals.apiCount || 0,
      errors: req.app.locals.errorCount || 0,
      
      memory: process.memoryUsage(),
      
      performance: {
        avg_response_time: req.app.locals.avgResponseTime || 0,
        last_activity: req.app.locals.lastActivity || new Date().toISOString()
      }
    }
  });
});

// ===== ENDPOINTS DE DADOS (GET/POST) =====

// Endpoint genérico para recebimento de dados via GET
app.get('/api/data', async (req, res) => {
  console.log('📥 GET /api/data - Recebendo dados via GET');
  console.log('🔍 Query params:', JSON.stringify(req.query, null, 2));
  
  incrementCounter(req.app, 'apiCount');
  
  try {
    // Processar dados recebidos via query parameters
    const receivedData = {
      method: 'GET',
      timestamp: new Date().toISOString(),
      server_id: SERVER_ID,
      data: req.query,
      headers: {
        'user-agent': req.get('User-Agent'),
        'origin': req.get('Origin') || req.get('Referer')
      }
    };
    
    // Salvar no banco se houver dados
    if (Object.keys(req.query).length > 0) {
      await saveToDatabase('api_data_get', receivedData);
    }
    
    res.json({
      status: 'success',
      message: 'Dados recebidos via GET',
      received_at: receivedData.timestamp,
      data_count: Object.keys(req.query).length,
      processed: true,
      server_id: SERVER_ID
    });
    
  } catch (error) {
    console.error('❌ Erro ao processar GET /api/data:', error);
    incrementCounter(req.app, 'errorCount');
    
    res.status(500).json({
      status: 'error',
      message: 'Erro ao processar dados GET',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint genérico para recebimento de dados via POST
app.post('/api/data', async (req, res) => {
  console.log('📥 POST /api/data - Recebendo dados via POST');
  console.log('📦 Body:', JSON.stringify(req.body, null, 2));
  console.log('🔍 Query params:', JSON.stringify(req.query, null, 2));
  
  incrementCounter(req.app, 'apiCount');
  
  try {
    // Processar dados recebidos via body e query
    const receivedData = {
      method: 'POST',
      timestamp: new Date().toISOString(),
      server_id: SERVER_ID,
      body: req.body,
      query: req.query,
      headers: {
        'content-type': req.get('Content-Type'),
        'user-agent': req.get('User-Agent'),
        'origin': req.get('Origin') || req.get('Referer')
      }
    };
    
    // Salvar no banco
    await saveToDatabase('api_data_post', receivedData);
    
    res.json({
      status: 'success',
      message: 'Dados recebidos via POST',
      received_at: receivedData.timestamp,
      body_size: JSON.stringify(req.body).length,
      query_params: Object.keys(req.query).length,
      processed: true,
      server_id: SERVER_ID
    });
    
  } catch (error) {
    console.error('❌ Erro ao processar POST /api/data:', error);
    incrementCounter(req.app, 'errorCount');
    
    res.status(500).json({
      status: 'error',
      message: 'Erro ao processar dados POST',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ===== WEBHOOKS OTIMIZADOS =====

// Webhook TradingView principal
app.post('/api/webhooks/tradingview', async (req, res) => {
  console.log('📡 WEBHOOK TRADINGVIEW MULTISERVIÇO RECEBIDO');
  console.log('📊 Headers:', JSON.stringify(req.headers, null, 2));
  console.log('📦 Payload:', JSON.stringify(req.body, null, 2));
  
  incrementCounter(req.app, 'webhookCount');
  req.app.locals.lastActivity = new Date().toISOString();
  
  try {
    const { token, strategy, symbol, action, price, timestamp, indicators, test_mode } = req.body;
    
    // Validar token
    const expectedToken = process.env.WEBHOOK_TOKEN || 'coinbitclub_webhook_secret_2024';
    if (token !== expectedToken) {
      console.log('❌ Token inválido:', token);
      return res.status(401).json({
        error: 'Token inválido',
        received_at: new Date().toISOString(),
        server_id: SERVER_ID
      });
    }
    
    // Processar webhook
    const webhookData = {
      source: 'tradingview',
      payload: req.body,
      status: 'received',
      server_id: SERVER_ID,
      version: SERVER_VERSION,
      received_at: new Date().toISOString(),
      headers: req.headers
    };
    
    // Salvar no banco
    await saveToDatabase('raw_webhook', webhookData);
    
    console.log('✅ Webhook TradingView processado com sucesso');
    
    res.json({
      status: 'success',
      message: 'Webhook TradingView recebido',
      received_at: webhookData.received_at,
      symbol: symbol,
      action: action,
      server_id: SERVER_ID,
      version: SERVER_VERSION
    });
    
  } catch (error) {
    console.error('❌ Erro no webhook TradingView:', error);
    incrementCounter(req.app, 'errorCount');
    
    res.status(500).json({
      status: 'error',
      message: 'Erro ao processar webhook TradingView',
      error: error.message,
      timestamp: new Date().toISOString(),
      server_id: SERVER_ID
    });
  }
});

// Webhook para sinais TradingView - endpoint específico /api/webhooks/signal
app.post('/api/webhooks/signal', async (req, res) => {
  console.log('📡 WEBHOOK SIGNAL TRADINGVIEW RECEBIDO');
  console.log('📦 Payload:', JSON.stringify(req.body, null, 2));
  console.log('🔍 Headers:', JSON.stringify(req.headers, null, 2));
  
  incrementCounter(req.app, 'webhookCount');
  req.app.locals.lastActivity = new Date().toISOString();
  
  try {
    // Validação de token flexível
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.headers['x-webhook-token'] || 
                  req.query.token || 
                  req.body?.token;
    
    const validTokens = ['210406', 'coinbitclub-webhook-2025', 'tradingview-secret-key'];
    
    // Permitir IPs do TradingView sem token
    const tradingViewIPs = ['34.212.75.30', '52.32.178.7', '52.89.214.238'];
    const clientIP = req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim();
    
    if (!token && !tradingViewIPs.includes(clientIP)) {
      return res.status(401).json({ 
        error: 'Token necessário', 
        timestamp: new Date().toISOString(),
        server_id: SERVER_ID
      });
    }
    
    if (token && !validTokens.includes(token)) {
      return res.status(401).json({ 
        error: 'Token inválido', 
        timestamp: new Date().toISOString(),
        server_id: SERVER_ID
      });
    }
    
    // Processar sinal
    const signalData = {
      id: `signal_${Date.now()}`,
      source: 'tradingview_signal',
      payload: req.body,
      status: 'received',
      server_id: SERVER_ID,
      version: SERVER_VERSION,
      received_at: new Date().toISOString(),
      client_ip: clientIP,
      auth_method: token ? 'token' : 'ip_whitelist'
    };
    
    // Salvar no banco
    await saveToDatabase('raw_webhook', signalData);
    
    console.log('✅ Sinal TradingView processado:', signalData.id);
    
    res.json({
      success: true,
      message: 'Sinal recebido com sucesso',
      signalId: signalData.id,
      timestamp: signalData.received_at,
      server_id: SERVER_ID
    });
    
  } catch (error) {
    console.error('❌ Erro no webhook signal:', error);
    incrementCounter(req.app, 'errorCount');
    
    res.status(500).json({
      error: 'Erro interno',
      message: error.message,
      timestamp: new Date().toISOString(),
      server_id: SERVER_ID
    });
  }
});

// Endpoint de teste para webhook signal
app.get('/api/webhooks/signal/test', (req, res) => {
  console.log('🧪 Teste webhook signal acessado');
  
  res.json({
    message: 'Endpoint de webhook signal ativo',
    timestamp: new Date().toISOString(),
    server_id: SERVER_ID,
    version: SERVER_VERSION,
    tokens: ['210406', 'coinbitclub-webhook-2025'],
    authMethods: [
      'Header: Authorization: Bearer TOKEN',
      'Header: X-Webhook-Token: TOKEN',
      'Query: ?token=TOKEN',
      'Body: {"token": "TOKEN"}',
      'IP Whitelist (TradingView IPs)'
    ]
  });
});

// Webhook genérico
app.post('/webhook/:signal', async (req, res) => {
  const signal = req.params.signal;
  console.log(`📡 WEBHOOK GENÉRICO RECEBIDO: ${signal}`);
  console.log('📦 Payload:', JSON.stringify(req.body, null, 2));
  
  incrementCounter(req.app, 'webhookCount');
  req.app.locals.lastActivity = new Date().toISOString();
  
  try {
    const webhookData = {
      source: `generic_${signal}`,
      payload: req.body,
      status: 'received',
      server_id: SERVER_ID,
      version: SERVER_VERSION,
      received_at: new Date().toISOString(),
      signal_type: signal
    };
    
    // Salvar no banco
    await saveToDatabase('raw_webhook', webhookData);
    
    console.log(`✅ Webhook genérico ${signal} processado`);
    
    res.json({
      status: 'success',
      message: `Webhook ${signal} recebido`,
      signal: signal,
      received_at: webhookData.received_at,
      server_id: SERVER_ID
    });
    
  } catch (error) {
    console.error(`❌ Erro no webhook ${signal}:`, error);
    incrementCounter(req.app, 'errorCount');
    
    res.status(500).json({
      status: 'error',
      message: `Erro ao processar webhook ${signal}`,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Webhook de teste
app.post('/api/webhooks/test', (req, res) => {
  console.log('🧪 WEBHOOK DE TESTE RECEBIDO');
  console.log('📦 Payload:', JSON.stringify(req.body, null, 2));
  
  incrementCounter(req.app, 'webhookCount');
  
  res.json({
    status: 'success',
    message: 'Webhook de teste recebido',
    received_data: req.body,
    timestamp: new Date().toISOString(),
    server_id: SERVER_ID,
    version: SERVER_VERSION
  });
});

// ===== ENDPOINTS SISTEMA MULTIUSUÁRIO HÍBRIDO =====

// Status do sistema multiusuário
app.get('/api/multiuser/status', async (req, res) => {
  console.log('👥 Status sistema multiusuário solicitado');
  
  try {
    const client = await pool.connect();
    
    // Verificar usuários ativos (consulta simplificada)
    const usersResult = await client.query(`
      SELECT COUNT(*) as total_users
      FROM users
    `);
    
    // Verificar operações (consulta simplificada)
    const operationsResult = await client.query(`
      SELECT COUNT(*) as total_operations
      FROM trading_operations
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `);
    
    // Verificar chaves API
    const keysResult = await client.query(`
      SELECT COUNT(*) as total_keys,
             COUNT(DISTINCT user_id) as users_with_keys
      FROM user_api_keys
    `);
    
    client.release();
    
    res.json({
      status: 'success',
      system: {
        multiuser_enabled: SISTEMA_MULTIUSUARIO,
        hybrid_mode: MODO_HIBRIDO,
        realtime_enabled: TEMPO_REAL_ENABLED,
        server_version: SERVER_VERSION
      },
      users: {
        total: parseInt(usersResult.rows[0].total_users),
        active: parseInt(usersResult.rows[0].total_users) // Simplificado
      },
      operations: {
        total_24h: parseInt(operationsResult.rows[0].total_operations),
        open: 0 // Simplificado
      },
      api_keys: {
        total: parseInt(keysResult.rows[0].total_keys),
        active: parseInt(keysResult.rows[0].total_keys), // Simplificado
        users_configured: parseInt(keysResult.rows[0].users_with_keys)
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro ao obter status multiusuário:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao obter status do sistema',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Listar usuários ativos em tempo real
app.get('/api/multiuser/users/active', async (req, res) => {
  console.log('👥 Lista de usuários ativos solicitada');
  
  try {
    const client = await pool.connect();
    
    const result = await client.query(`
      SELECT u.id, u.name, u.email,
             COUNT(uak.id) as api_keys_count
      FROM users u
      LEFT JOIN user_api_keys uak ON u.id = uak.user_id
      GROUP BY u.id, u.name, u.email
      ORDER BY u.created_at DESC
      LIMIT 10
    `);
    
    client.release();
    
    res.json({
      status: 'success',
      users: result.rows.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        account_type: 'STANDARD', // Simplificado
        api_keys_configured: parseInt(user.api_keys_count),
        operations_24h: 0, // Simplificado
        multiuser_ready: parseInt(user.api_keys_count) > 0
      })),
      total_users: result.rows.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro ao listar usuários ativos:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao listar usuários ativos',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Operações em tempo real por usuário
app.get('/api/multiuser/operations/realtime', async (req, res) => {
  console.log('⚡ Operações em tempo real solicitadas');
  
  try {
    const client = await pool.connect();
    
    const result = await client.query(`
      SELECT to_ops.id, to_ops.user_id, u.name as user_name,
             to_ops.symbol, to_ops.side, to_ops.entry_price, 
             to_ops.quantity, to_ops.created_at
      FROM trading_operations to_ops
      JOIN users u ON to_ops.user_id = u.id
      ORDER BY to_ops.created_at DESC
      LIMIT 20
    `);
    
    client.release();
    
    res.json({
      status: 'success',
      operations: result.rows.map(op => ({
        id: op.id,
        user: {
          id: op.user_id,
          name: op.user_name
        },
        symbol: op.symbol,
        side: op.side,
        entry_price: parseFloat(op.entry_price || 0),
        quantity: parseFloat(op.quantity || 0),
        status: 'open', // Simplificado
        pnl_unrealized: 0, // Simplificado
        leverage: 5, // Simplificado
        created_at: op.created_at,
        duration_minutes: Math.floor((new Date() - new Date(op.created_at)) / 60000)
      })),
      total_operations: result.rows.length,
      realtime_enabled: TEMPO_REAL_ENABLED,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro ao obter operações em tempo real:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao obter operações em tempo real',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Configurar chaves API de usuário
app.post('/api/multiuser/user/:userId/api-keys', async (req, res) => {
  const userId = req.params.userId;
  const { exchange_name, api_key, api_secret, testnet = true } = req.body;
  
  console.log(`🔑 Configurando chaves API para usuário ${userId} - Exchange: ${exchange_name}`);
  
  try {
    const client = await pool.connect();
    
    // Verificar se usuário existe
    const userCheck = await client.query('SELECT id, name FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      client.release();
      return res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    }
    
    // Criptografar chaves (simulação - usar crypto real em produção)
    const api_key_encrypted = Buffer.from(api_key).toString('base64');
    const api_secret_encrypted = Buffer.from(api_secret).toString('base64');
    
    // Inserir ou atualizar chaves
    await client.query(`
      INSERT INTO user_api_keys (user_id, exchange_name, api_key_encrypted, api_secret_encrypted, testnet, status)
      VALUES ($1, $2, $3, $4, $5, 'active')
      ON CONFLICT (user_id, exchange_name)
      DO UPDATE SET 
        api_key_encrypted = EXCLUDED.api_key_encrypted,
        api_secret_encrypted = EXCLUDED.api_secret_encrypted,
        testnet = EXCLUDED.testnet,
        status = 'active',
        updated_at = NOW()
    `, [userId, exchange_name, api_key_encrypted, api_secret_encrypted, testnet]);
    
    client.release();
    
    res.json({
      status: 'success',
      message: 'Chaves API configuradas com sucesso',
      user_id: userId,
      exchange: exchange_name,
      testnet: testnet,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro ao configurar chaves API:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao configurar chaves API',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Habilitar modo híbrido para usuário
app.post('/api/multiuser/user/:userId/hybrid-mode', async (req, res) => {
  const userId = req.params.userId;
  const { enabled = true } = req.body;
  
  console.log(`🔄 ${enabled ? 'Habilitando' : 'Desabilitando'} modo híbrido para usuário ${userId}`);
  
  try {
    const client = await pool.connect();
    
    // Atualizar configurações do usuário
    await client.query(`
      INSERT INTO user_trading_params (user_id, hybrid_mode_enabled, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET 
        hybrid_mode_enabled = EXCLUDED.hybrid_mode_enabled,
        updated_at = NOW()
    `, [userId, enabled]);
    
    client.release();
    
    res.json({
      status: 'success',
      message: `Modo híbrido ${enabled ? 'habilitado' : 'desabilitado'}`,
      user_id: userId,
      hybrid_mode: enabled,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro ao configurar modo híbrido:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao configurar modo híbrido',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint para processar sinais multiusuário
app.post('/api/multiuser/signal/process', async (req, res) => {
  console.log('📡 Processando sinal para sistema multiusuário');
  
  try {
    const { signal_type, symbol, action, price, users } = req.body;
    
    const client = await pool.connect();
    
    // Processar sinal para cada usuário
    const results = [];
    for (const userId of users || []) {
      try {
        // Verificar configurações do usuário
        const userConfig = await client.query(`
          SELECT utp.*, uak.exchange_name, uak.status as key_status
          FROM user_trading_params utp
          JOIN user_api_keys uak ON utp.user_id = uak.user_id
          WHERE utp.user_id = $1 AND uak.status = 'active'
        `, [userId]);
        
        if (userConfig.rows.length > 0) {
          // Simular processamento da operação
          const operation = {
            user_id: userId,
            symbol: symbol,
            action: action,
            price: price,
            status: 'processed',
            processed_at: new Date().toISOString()
          };
          
          results.push(operation);
        }
        
      } catch (userError) {
        console.error(`❌ Erro ao processar usuário ${userId}:`, userError.message);
        results.push({
          user_id: userId,
          status: 'error',
          error: userError.message
        });
      }
    }
    
    client.release();
    
    res.json({
      status: 'success',
      message: 'Sinal processado para usuários',
      signal_type: signal_type,
      symbol: symbol,
      action: action,
      processed_users: results.length,
      results: results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro ao processar sinal multiusuário:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao processar sinal',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ===== FUNÇÕES AUXILIARES =====

// Função para salvar dados no banco
async function saveToDatabase(table, data) {
  try {
    const client = await pool.connect();
    
    // Criar tabela se não existir
    if (table === 'raw_webhook') {
      await client.query(`
        CREATE TABLE IF NOT EXISTS raw_webhook (
          id SERIAL PRIMARY KEY,
          source VARCHAR(50) NOT NULL,
          payload JSONB NOT NULL,
          status VARCHAR(20) DEFAULT 'received',
          created_at TIMESTAMP DEFAULT NOW(),
          server_id VARCHAR(100),
          version VARCHAR(50)
        )
      `);
      
      await client.query(`
        INSERT INTO raw_webhook (source, payload, status, server_id, version)
        VALUES ($1, $2, $3, $4, $5)
      `, [data.source, JSON.stringify(data.payload), data.status, data.server_id, data.version]);
      
    } else if (table.startsWith('api_data_')) {
      await client.query(`
        CREATE TABLE IF NOT EXISTS api_requests (
          id SERIAL PRIMARY KEY,
          method VARCHAR(10) NOT NULL,
          endpoint VARCHAR(100) NOT NULL,
          data JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          server_id VARCHAR(100)
        )
      `);
      
      await client.query(`
        INSERT INTO api_requests (method, endpoint, data, server_id)
        VALUES ($1, $2, $3, $4)
      `, [data.method, table, JSON.stringify(data), data.server_id]);
    }
    
    client.release();
    console.log(`💾 Dados salvos na tabela: ${table}`);
    
  } catch (error) {
    console.error(`❌ Erro ao salvar em ${table}:`, error.message);
  }
}

// Função para incrementar contadores
function incrementCounter(app, counter) {
  if (!app.locals[counter]) {
    app.locals[counter] = 0;
  }
  app.locals[counter]++;
  
  if (!app.locals.requestCount) {
    app.locals.requestCount = 0;
  }
  app.locals.requestCount++;
}

// Função para formatar uptime
function formatUptime(seconds) {
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  const secs = seconds % 60;
  
  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

// Middleware para contagem de requests
app.use((req, res, next) => {
  incrementCounter(req.app, 'requestCount');
  next();
});

// ===== ERROR HANDLERS =====

// 404 Handler
app.use('*', (req, res) => {
  console.log(`❌ 404 - Endpoint não encontrado: ${req.method} ${req.path}`);
  
  res.status(404).json({
    error: 'Endpoint não encontrado',
    method: req.method,
    path: req.path,
    available_endpoints: {
      info: ['GET /', 'GET /health', 'GET /api/health', 'GET /api/status'],
      api: ['GET /api/data', 'POST /api/data'],
      webhooks: ['POST /api/webhooks/tradingview', 'POST /webhook/:signal']
    },
    timestamp: new Date().toISOString(),
    server_id: SERVER_ID
  });
});

// Error Handler global
app.use((error, req, res, next) => {
  console.error('💥 Erro na aplicação multiserviço:', error);
  incrementCounter(req.app, 'errorCount');
  
  res.status(500).json({
    error: 'Erro interno do servidor multiserviço',
    message: error.message,
    version: SERVER_VERSION,
    timestamp: new Date().toISOString(),
    server_id: SERVER_ID
  });
});

// ===== STARTUP DO SERVIDOR =====

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

console.log('🔍 Configuração do servidor multiserviço:');
console.log(`   PORT: ${PORT} (env: ${process.env.PORT})`);
console.log(`   HOST: ${HOST}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'production'}`);
console.log(`   Versão: ${SERVER_VERSION}`);

// Inicializar contadores
app.locals.requestCount = 0;
app.locals.webhookCount = 0;
app.locals.apiCount = 0;
app.locals.errorCount = 0;
app.locals.lastActivity = new Date().toISOString();

// Iniciar servidor
const server = app.listen(PORT, HOST, async () => {
  console.log('🚀 ===== SERVIDOR MULTISERVIÇO RAILWAY INICIADO =====');
  console.log(`🌐 Servidor rodando em: http://${HOST}:${PORT}`);
  console.log(`📦 Versão: ${SERVER_VERSION}`);
  console.log(`🆔 Server ID: ${SERVER_ID}`);
  console.log('');
  
  // Testar conexão com banco
  await testDatabaseConnection();
  
  console.log('📋 Endpoints multiserviço disponíveis:');
  console.log('');
  console.log('   📊 INFORMAÇÕES:');
  console.log('   🏠 GET  /                              - Status principal');
  console.log('   🏥 GET  /health                        - Health check');
  console.log('   🏥 GET  /api/health                    - API Health check');
  console.log('   📊 GET  /api/status                    - Status detalhado');
  console.log('   📈 GET  /api/metrics                   - Métricas do sistema');
  console.log('');
  console.log('   📡 WEBHOOKS:');
  console.log('   📡 POST /api/webhooks/tradingview      - Webhook TradingView');
  console.log('   📡 POST /webhook/:signal               - Webhook genérico');
  console.log('   🧪 POST /api/webhooks/test             - Webhook de teste');
  console.log('');
  console.log('   📥 API DADOS:');
  console.log('   📥 GET  /api/data                      - Receber dados via GET');
  console.log('   📥 POST /api/data                      - Receber dados via POST');
  console.log('');
  console.log('🔗 Banco: PostgreSQL Railway');
  console.log('🛡️ Segurança: Helmet + Rate Limiting');
  console.log('🌐 CORS: Otimizado para multiserviço');
  console.log('✅ Sistema multiserviço otimizado!');
  console.log('🎉 PRONTO PARA RECEBER GET E POST!');
});

// Error handling do servidor
server.on('error', (err) => {
  console.error('❌ Erro no servidor multiserviço:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Porta ${PORT} já está em uso`);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📤 SIGTERM recebido, encerrando servidor multiserviço...');
  server.close(() => {
    console.log('✅ Servidor multiserviço encerrado graciosamente');
    pool.end(() => {
      console.log('✅ Pool de conexões encerrado');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('📤 SIGINT recebido, encerrando servidor multiserviço...');
  server.close(() => {
    console.log('✅ Servidor multiserviço encerrado');
    pool.end(() => {
      console.log('✅ Pool de conexões encerrado');
      process.exit(0);
    });
  });
});

module.exports = app;
/ /   R a i l w a y   D e p l o y   T i m e s t a m p :   2 0 2 5 - 0 7 - 2 9   1 4 : 1 5 : 0 1  
 