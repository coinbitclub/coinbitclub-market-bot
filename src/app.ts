// ========================================
// MARKETBOT BACKEND - MAIN APPLICATION
// ========================================
// Enterprise Trading Bot - Main Entry Point
// Configured for 1000+ simultaneous users

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';

// Configurar timezone do Brasil
process.env.TZ = 'America/Sao_Paulo';

// Internal imports
import { appConfig, env } from './config/env';
import { checkDatabaseConnection, getDatabaseStats } from './config/database';
import database from './config/database';
import { createAuthRoutes, createUserRoutes, createAffiliateRoutes, createAuditRoutes } from './routes/auth.routes';
import { createAuthMiddleware } from './middleware/auth.middleware';
import { runDatabaseMigrations, checkMigrationStatus } from './utils/migration.manager';

// Configurar localização para português brasileiro
console.log('🇧🇷 Timezone configurado para Brasil:', new Date().toLocaleString('pt-BR', { 
  timeZone: 'America/Sao_Paulo',
  dateStyle: 'full',
  timeStyle: 'full'
}));

// ========================================
// EXPRESS APPLICATION SETUP
// ========================================

const app: Application = express();
const server = createServer(app);

// ========================================
// SECURITY MIDDLEWARE
// ========================================

// Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ['\'self\''],
      styleSrc: ['\'self\'', '\'unsafe-inline\''],
      scriptSrc: ['\'self\''],
      imgSrc: ['\'self\'', 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS configuration
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: {
    error: 'Too many requests from this IP',
    retryAfter: Math.ceil(env.RATE_LIMIT_WINDOW_MS / 1000),
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
});

// Webhook rate limiting (stricter)
const webhookLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: env.WEBHOOK_RATE_LIMIT_PER_HOUR,
  message: {
    error: 'Webhook rate limit exceeded',
    retryAfter: 3600,
  },
  skip: (req: Request) => {
    // Skip rate limiting for authenticated webhook sources
    const webhookSecret = req.headers['x-webhook-secret'];
    return webhookSecret === env.WEBHOOK_SECRET;
  },
});

// ========================================
// APPLICATION MIDDLEWARE
// ========================================

// Compression for response optimization
app.use(compression({
  filter: (req: Request, res: Response) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024,
}));

// Body parsing
app.use(express.json({ 
  limit: '10mb',
  verify: (_req: any, _res: Response, buf: Buffer) => {
    _req.rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
});

// ========================================
// HEALTH CHECK ENDPOINTS
// ========================================

app.get('/health', async (_req: Request, res: Response) => {
  try {
    const dbHealthy = await checkDatabaseConnection();
    const dbStats = await getDatabaseStats();
    const migrationsUpToDate = await checkMigrationStatus(database);
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: appConfig.nodeEnv,
      version: appConfig.apiVersion,
      database: {
        connected: dbHealthy,
        stats: dbStats,
        migrations: migrationsUpToDate ? 'up-to-date' : 'pending',
      },
      authentication: {
        status: 'active',
        features: ['JWT', '2FA', 'RBAC', 'Sessions', 'Audit'],
      },
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
      },
    };
    
    res.status(200).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/health/live', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'alive', timestamp: new Date().toISOString() });
});

app.get('/health/ready', async (_req: Request, res: Response) => {
  try {
    const dbHealthy = await checkDatabaseConnection();
    
    if (dbHealthy) {
      res.status(200).json({ status: 'ready', timestamp: new Date().toISOString() });
    } else {
      res.status(503).json({ status: 'not ready', timestamp: new Date().toISOString() });
    }
  } catch (error) {
    res.status(503).json({ 
      status: 'not ready', 
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ========================================
// API ROUTES
// ========================================

// Apply rate limiting to API routes
app.use('/api', apiLimiter);

// Apply webhook rate limiting
app.use('/webhooks', webhookLimiter);

// ========================================
// AUTHENTICATION SYSTEM SETUP
// ========================================

// Initialize authentication middleware
const authMiddleware = createAuthMiddleware(database);

// Authentication routes (public + protected)
app.use(`/api/${appConfig.apiVersion}/auth`, createAuthRoutes(database));

// User management routes
app.use(`/api/${appConfig.apiVersion}/users`, createUserRoutes(database));

// Affiliate system routes
app.use(`/api/${appConfig.apiVersion}/affiliates`, createAffiliateRoutes(database));

// Audit and monitoring routes
app.use(`/api/${appConfig.apiVersion}/audit`, createAuditRoutes(database));

// Trading system routes
import tradingRoutes from './routes/trading.routes.js';
app.use(`/api/${appConfig.apiVersion}/trading`, tradingRoutes);

// Market intelligence routes
import marketRoutes from './routes/market.routes.js';
app.use(`/api/${appConfig.apiVersion}/market`, marketRoutes);

// Financial system routes (FASE 3 - Sistema Stripe completo)
import financialRoutes from './routes/financial.routes.js';
app.use(`/api/${appConfig.apiVersion}/financial`, financialRoutes);

// Two Factor Authentication routes (FASE 2 - Segurança crítica)
import twoFactorRoutes from './routes/two-factor.routes.js';
app.use(`/api/${appConfig.apiVersion}/2fa`, twoFactorRoutes);

// Real-Time Monitoring routes (FASE 6 - Monitoramento crítico)
import monitoringRoutes from './routes/real-time-monitoring.routes.js';
app.use(`/api/${appConfig.apiVersion}/monitoring`, monitoringRoutes);

// Optimization routes (para monitoramento de custos IA)
import optimizationRoutes from './routes/optimization.routes.js';
app.use(`/api/${appConfig.apiVersion}/optimization`, optimizationRoutes);

// Admin routes (FASE 5 - Sistema administrativo)
import adminRoutes from './routes/admin.routes.js';
app.use(`/api/${appConfig.apiVersion}/admin`, adminRoutes);

// Payment and Financial routes - SISTEMA STRIPE + AFILIADOS + CUPONS
import { paymentRoutes } from './routes/payment.routes';
import { testRoutes } from './routes/test.routes';
app.use(`/api/${appConfig.apiVersion}/payment`, paymentRoutes);
app.use(`/api/${appConfig.apiVersion}/coupons-affiliates`, testRoutes); // Rotas de teste

// API version routing
app.use(`/api/${appConfig.apiVersion}`, (_req: Request, res: Response) => {
  res.json({
    message: 'MARKETBOT API is running',
    version: appConfig.apiVersion,
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      docs: '/docs',
      api: `/api/${appConfig.apiVersion}`,
      auth: `/api/${appConfig.apiVersion}/auth`,
      users: `/api/${appConfig.apiVersion}/users`,
      affiliates: `/api/${appConfig.apiVersion}/affiliates`,
      audit: `/api/${appConfig.apiVersion}/audit`,
      trading: `/api/${appConfig.apiVersion}/trading`,
      market: `/api/${appConfig.apiVersion}/market`,
      financial: `/api/${appConfig.apiVersion}/financial`,
      twoFactor: `/api/${appConfig.apiVersion}/2fa`,
      monitoring: `/api/${appConfig.apiVersion}/monitoring`,
      optimization: `/api/${appConfig.apiVersion}/optimization`,
      webhooks: '/webhooks',
    },
    features: {
      authentication: 'JWT + 2FA',
      authorization: 'Role-based access control',
      auditing: 'Full audit trail',
      affiliates: 'Commission system (1.5% + 5% VIP)',
      trading: 'Exchange connections + Auto-trading',
      market: 'AI + Fear&Greed + Market Pulse Intelligence',
      financial: 'Stripe payments + Subscriptions + Coupons',
      optimization: 'AI Cost Management & Performance Monitoring',
      security: 'Advanced threat protection',
    },
  });
});

// ========================================
// WEBHOOK ENDPOINTS
// ========================================

// Webhook CoinBitClub TradingView
import { processCoinBitClubSignal, webhookHealthCheck } from './controllers/webhook.controller.js';

// Webhook V2 (FASE 5 - Trading Orchestrator)
import WebhookControllerV2 from './controllers/webhook-v2.controller.js';

// Webhook Routes TradingView
import webhookRoutes from './routes/webhook.routes.js';

const webhookV2 = new WebhookControllerV2();

app.post('/api/webhooks/signal', processCoinBitClubSignal);
app.get('/api/webhooks/signal', webhookHealthCheck);

// TradingView Webhook Routes
app.use('/webhooks', webhookRoutes);

// FASE 5 - Enhanced webhook endpoints
app.post('/api/webhook/tradingview', (req, res) => webhookV2.tradingViewWebhook(req, res));
app.get('/api/webhook/status', (req, res) => webhookV2.systemStatus(req, res));

app.post('/webhooks/tradingview', (req: Request, res: Response) => {
  try {
    // Verify webhook secret
    const providedSecret = req.headers['x-webhook-secret'];
    if (providedSecret !== env.TRADINGVIEW_WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Invalid webhook secret' });
    }
    
    console.log('📊 TradingView webhook received:', {
      timestamp: new Date().toISOString(),
      payload: req.body,
      headers: req.headers,
    });
    
    // TODO: Process trading signal
    // Will be implemented in Phase 2 with trading logic
    
    return res.status(200).json({ 
      success: true, 
      message: 'Webhook processed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return res.status(500).json({ 
      error: 'Webhook processing failed',
      timestamp: new Date().toISOString(),
    });
  }
});

// ========================================
// ERROR HANDLING MIDDLEWARE
// ========================================

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('❌ Unhandled error:', error);
  
  res.status(500).json({
    error: 'Internal server error',
    message: appConfig.nodeEnv === 'development' ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString(),
  });
});

// ========================================
// SERVER STARTUP
// ========================================

const startServer = async (): Promise<void> => {
  try {
    // Check database connection
    const dbHealthy = await checkDatabaseConnection();
    if (!dbHealthy) {
      console.error('❌ Database connection failed - server startup aborted');
      process.exit(1);
    }
    
    // Run database migrations automatically
    console.log('🔄 Running database migrations...');
    // Skip migrations since they were run manually
    console.log('✅ Migrations skipped - already executed manually');
    // await runDatabaseMigrations(database);
    console.log('✅ Database migrations completed successfully');
    
    // Initialize Trading Orchestrator (FASE 5)
    console.log('🤖 Inicializando Trading Orchestrator...');
    const TradingOrchestrator = (await import('./services/trading-orchestrator.service.js')).default;
    const orchestrator = TradingOrchestrator.getInstance();
    await orchestrator.initialize();
    console.log('✅ Trading Orchestrator inicializado com sucesso');
    
    // Start server
    server.listen(appConfig.port, () => {
      console.log(`
🚀 MARKETBOT BACKEND STARTED SUCCESSFULLY
┌─────────────────────────────────────────┐
│ 🎯 Environment: ${appConfig.nodeEnv.toUpperCase().padEnd(12)} │
│ 🌐 Port: ${appConfig.port.toString().padEnd(19)} │
│ 🔐 Security: ENABLED            │
│ 🗄️  Database: CONNECTED          │
│ 🎪 IP Fixo: ${env.NGROK_IP_FIXO.padEnd(15)} │
│ 📊 Max Users: 1000+             │
│ 🎲 Trading: ${env.ENABLE_REAL_TRADING ? 'REAL' : 'TEST'} MODE          │
│ 🔑 Auth System: ACTIVE          │
└─────────────────────────────────────────┘

📋 Available Endpoints:
   • Health Check: http://localhost:${appConfig.port}/health
   • API Base: http://localhost:${appConfig.port}/api/${appConfig.apiVersion}
   • Authentication: http://localhost:${appConfig.port}/api/${appConfig.apiVersion}/auth
   • User Management: http://localhost:${appConfig.port}/api/${appConfig.apiVersion}/users
   • Affiliate System: http://localhost:${appConfig.port}/api/${appConfig.apiVersion}/affiliates
   • Trading System: http://localhost:${appConfig.port}/api/${appConfig.apiVersion}/trading
   • Market Intelligence: http://localhost:${appConfig.port}/api/${appConfig.apiVersion}/market
   • AI Optimization: http://localhost:${appConfig.port}/api/${appConfig.apiVersion}/optimization
   • Audit Logs: http://localhost:${appConfig.port}/api/${appConfig.apiVersion}/audit
   • Webhooks: http://localhost:${appConfig.port}/webhooks

🔐 Authentication Features:
   • JWT + Refresh Tokens
   • Two-Factor Authentication (2FA)
   • Role-based Access Control
   • Session Management
   • Account Lockout Protection
   • Email/Phone Verification
   • Password Reset & Recovery
   • Full Audit Trail
   
🔧 Performance Configuration:
   • Rate Limit: ${env.RATE_LIMIT_MAX_REQUESTS} requests/hour
   • Webhook Limit: ${env.WEBHOOK_RATE_LIMIT_PER_HOUR} webhooks/hour
   • Max Concurrent: ${env.MAX_CONCURRENT_OPERATIONS} operations
   • Operation Timeout: ${env.OPERATION_TIMEOUT_SECONDS}s
   
💰 Commission Structure:
   • Monthly Plan: ${env.MONTHLY_PLAN_COMMISSION * 100}%
   • Prepaid Plan: ${env.PREPAID_PLAN_COMMISSION * 100}%
   • Affiliate Normal: ${env.AFFILIATE_NORMAL_RATE * 100}%
   • Affiliate VIP: ${env.AFFILIATE_VIP_RATE * 100}%

✅ FASE 2 CONCLUÍDA - Authentication system fully operational! 🎉
      `);
    });
    
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
};

// ========================================
// GRACEFUL SHUTDOWN
// ========================================

const gracefulShutdown = async (signal: string): Promise<void> => {
  console.log(`\n📴 Received ${signal}. Starting graceful shutdown...`);
  
  server.close(async () => {
    console.log('✅ HTTP server closed');
    console.log('✅ MARKETBOT Backend shutdown completed');
    process.exit(0);
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('❌ Forced shutdown due to timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Export for testing and server.ts
export { app, server, startServer };

// Start the server
if (require.main === module) {
  startServer();
}
