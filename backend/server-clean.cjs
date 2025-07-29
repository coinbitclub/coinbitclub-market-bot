// CoinBitClub Market Bot - Servidor Multiservico Completo Railway V3
// Configuracao completa para operacao multiservico com GET e POST
// VERSAO FINAL OTIMIZADA: 2025-07-29

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

console.log('🚀 INICIANDO SERVIDOR MULTISERVICO COMPLETO...');
console.log('🔧 CONFIGURACOES OTIMIZADAS PARA RAILWAY V3');

// Configuracoes de versao e identificacao
const SERVER_VERSION = 'v3.0.0-multiservice-hybrid-' + Date.now();
const SERVER_ID = crypto.randomBytes(16).toString('hex');
const START_TIME = Date.now();

console.log(`📦 Versao: ${SERVER_VERSION}`);
console.log(`🆔 Server ID: ${SERVER_ID}`);
console.log(`⏰ Inicializado em: ${new Date().toISOString()}`);

// ===== CONFIGURACOES MULTIUSUARIO HIBRIDO =====
const SISTEMA_MULTIUSUARIO = process.env.SISTEMA_MULTIUSUARIO === 'true' || true;
const MODO_HIBRIDO = process.env.MODO_HIBRIDO === 'true' || true;
const TEMPO_REAL_ENABLED = process.env.TEMPO_REAL_ENABLED === 'true' || true;

console.log(`🔧 Sistema Multiusuario: ${SISTEMA_MULTIUSUARIO ? 'ATIVO' : 'INATIVO'}`);
console.log(`🔄 Modo Hibrido: ${MODO_HIBRIDO ? 'ATIVO' : 'INATIVO'}`);
console.log(`⚡ Tempo Real: ${TEMPO_REAL_ENABLED ? 'ATIVO' : 'INATIVO'}`);

// ===== CONFIGURACAO DO EXPRESS =====

const app = express();

// Configurar trust proxy para Railway
app.set('trust proxy', true);

// Configuracao de seguranca com Helmet
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
    'X-Response-Time': Date.now() - req.requestStart
  });
  req.requestStart = Date.now();
  next();
});

// Configuracao CORS otimizada
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001', 
    'https://coinbitclub-market-bot.vercel.app',
    'https://coinbitclub-market-bot.up.railway.app',
    /\.railway\.app$/,
    /\.vercel\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // limite de 1000 requests por windowMs
  message: {
    error: 'Muitas requisicoes, tente novamente em 15 minutos',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});
app.use(limiter);

// Middleware de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===== CONFIGURACAO DO BANCO DE DADOS =====

let pool;

async function initializeDatabase() {
  try {
    const databaseUrl = process.env.DATABASE_URL || 
      'postgresql://coinbitclub_user:coinbitclub_password@localhost:5432/coinbitclub_db';
    
    console.log('🗄️ Conectando ao banco de dados...');
    
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Teste de conexao
    const client = await pool.connect();
    console.log('✅ Banco de dados conectado com sucesso!');
    client.release();
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco:', error.message);
    return false;
  }
}

// ===== HEALTH CHECK =====
app.get('/health', (req, res) => {
  const uptime = Date.now() - START_TIME;
  res.status(200).json({
    status: 'healthy',
    service: 'coinbitclub-multiservice',
    version: SERVER_VERSION,
    serverId: SERVER_ID,
    uptime: uptime,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    multiuser: SISTEMA_MULTIUSUARIO,
    hybrid: MODO_HIBRIDO,
    realtime: TEMPO_REAL_ENABLED
  });
});

// ===== ROTAS DE SISTEMA =====

// Status do sistema
app.get('/api/system/status', (req, res) => {
  res.json({
    status: 'online',
    services: {
      database: pool ? 'connected' : 'disconnected',
      api: 'active',
      multiuser: SISTEMA_MULTIUSUARIO,
      hybrid: MODO_HIBRIDO,
      realtime: TEMPO_REAL_ENABLED
    },
    stats: {
      uptime: Date.now() - START_TIME,
      version: SERVER_VERSION,
      serverId: SERVER_ID
    }
  });
});

// Info do servidor
app.get('/api/server/info', (req, res) => {
  res.json({
    name: 'CoinBitClub Market Bot',
    version: SERVER_VERSION,
    serverId: SERVER_ID,
    startTime: START_TIME,
    uptime: Date.now() - START_TIME,
    environment: process.env.NODE_ENV || 'development',
    features: {
      multiuser: SISTEMA_MULTIUSUARIO,
      hybrid: MODO_HIBRIDO,
      realtime: TEMPO_REAL_ENABLED
    }
  });
});

// ===== WEBHOOK TRADINGVIEW =====
app.post('/api/webhook/tradingview', async (req, res) => {
  try {
    console.log('📡 Webhook TradingView recebido:', req.body);
    
    const signal = req.body;
    
    // Validacao basica do sinal
    if (!signal || !signal.action) {
      return res.status(400).json({
        error: 'Sinal invalido - falta action',
        received: signal
      });
    }

    // Processar sinal (implementacao simplificada)
    const processedSignal = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      signal: signal,
      status: 'received',
      serverId: SERVER_ID
    };

    console.log('✅ Sinal processado:', processedSignal.id);

    res.status(200).json({
      success: true,
      message: 'Sinal recebido e processado',
      signalId: processedSignal.id,
      timestamp: processedSignal.timestamp
    });

  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

// ===== ROTAS DE USUARIO =====

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email e senha sao obrigatorios'
      });
    }

    // Implementacao simplificada de login
    const token = jwt.sign(
      { 
        email: email,
        serverId: SERVER_ID,
        loginTime: Date.now()
      },
      process.env.JWT_SECRET || 'coinbitclub-secret-2025',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token: token,
      user: {
        email: email,
        serverId: SERVER_ID
      }
    });

  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

// ===== ROTAS DE TRADING =====

// Status de trading
app.get('/api/trading/status', (req, res) => {
  res.json({
    status: 'active',
    features: {
      signals: true,
      multiuser: SISTEMA_MULTIUSUARIO,
      hybrid: MODO_HIBRIDO,
      realtime: TEMPO_REAL_ENABLED
    },
    stats: {
      uptime: Date.now() - START_TIME,
      serverId: SERVER_ID
    }
  });
});

// ===== MIDDLEWARE DE ERRO =====
app.use((error, req, res, next) => {
  console.error('❌ Erro no servidor:', error);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: error.message,
    serverId: SERVER_ID
  });
});

// ===== ROTA 404 =====
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Rota nao encontrada',
    path: req.originalUrl,
    method: req.method,
    serverId: SERVER_ID
  });
});

// ===== INICIALIZACAO DO SERVIDOR =====

async function startServer() {
  try {
    console.log('🚀 Inicializando servidor...');
    
    // Inicializar banco de dados
    await initializeDatabase();
    
    // Definir porta
    const PORT = process.env.PORT || 3000;
    
    // Iniciar servidor
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('');
      console.log('🌟 =================================== 🌟');
      console.log('🚀 COINBITCLUB MARKET BOT - ATIVO!');
      console.log('🌟 =================================== 🌟');
      console.log('');
      console.log(`🌐 Servidor: http://localhost:${PORT}`);
      console.log(`📦 Versao: ${SERVER_VERSION}`);
      console.log(`🆔 Server ID: ${SERVER_ID}`);
      console.log(`🗄️ Database: ${pool ? 'CONECTADO' : 'DESCONECTADO'}`);
      console.log(`🔧 Multiusuario: ${SISTEMA_MULTIUSUARIO ? 'ATIVO' : 'INATIVO'}`);
      console.log(`🔄 Modo Hibrido: ${MODO_HIBRIDO ? 'ATIVO' : 'INATIVO'}`);
      console.log(`⚡ Tempo Real: ${TEMPO_REAL_ENABLED ? 'ATIVO' : 'INATIVO'}`);
      console.log('');
      console.log('📋 Endpoints principais:');
      console.log(`   ✅ GET  /health`);
      console.log(`   ✅ GET  /api/system/status`);
      console.log(`   ✅ POST /api/webhook/tradingview`);
      console.log(`   ✅ POST /api/auth/login`);
      console.log(`   ✅ GET  /api/trading/status`);
      console.log('');
      console.log('🌟 =================================== 🌟');
      console.log('');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('📤 SIGTERM recebido, encerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor encerrado');
        if (pool) {
          pool.end(() => {
            console.log('✅ Pool de conexoes encerrado');
            process.exit(0);
          });
        } else {
          process.exit(0);
        }
      });
    });

    process.on('SIGINT', () => {
      console.log('📤 SIGINT recebido, encerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor encerrado');
        if (pool) {
          pool.end(() => {
            console.log('✅ Pool de conexoes encerrado');
            process.exit(0);
          });
        } else {
          process.exit(0);
        }
      });
    });

  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Iniciar o servidor
startServer();

module.exports = app;
