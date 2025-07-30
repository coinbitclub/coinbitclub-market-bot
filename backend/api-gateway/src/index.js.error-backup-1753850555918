import dotenv from 'dotenv';
dotenv.config();
import '../../../common/env.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import routes from './routes.js';
import { setupScheduler } from './scheduler.js';
import { initMetrics, healthEndpoint, collectHttpMetrics } from '../../../common/metrics.js';
import { ensureConnection } from '../../../common/db.js';
import logger from '../../../common/logger.js';
import { env } from '../../../common/env.js';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: env.NODE_ENV === 'production' 
    ? ['https://coinbitclub.com', 'https://app.coinbitclub.com']
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'production' ? 100 : 1000, // requests per window
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Metrics collection
app.use(collectHttpMetrics);

// Health check endpoint
app.get('/health', healthEndpoint);
app.get('/metrics', initMetrics);

// Rotas diretas para dados reais do PostgreSQL (desenvolvimento)
import realDataRoutes from './routes/realDataRoutes.js';
app.use('/api', realDataRoutes);

// API routes
app.use('/api', routes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error({
    err,
    req: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body
    }
  }, 'Unhandled error');

  // Don't expose internal errors in production
  const message = env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;

  res.status(err.statusCode || 500).json({
    error: message,
    ...(env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Graceful shutdown handling
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

let server;

async function startServer() {
  try {
    // Verify database connection
    await ensureConnection();
    logger.info('Database connection established');

    // Initialize financial cron jobs
    const { FinancialCronJobs } = await import('./services/financialCronJobs.js');
    FinancialCronJobs.init();
    logger.info('Financial cron jobs initialized');

    // Start the HTTP server
    const port = env.API_GATEWAY_PORT || env.PORT || 3000;
    server = app.listen(port, () => {
      logger.info(`API Gateway running on port ${port}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
      
      // Setup background tasks
      setupScheduler();
      
      logger.info('API Gateway started successfully');
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${port} is already in use`);
      } else {
        logger.error({ error }, 'Server error');
      }
      process.exit(1);
    });

  } catch (error) {
    logger.error({ error }, 'Failed to start API Gateway');
    process.exit(1);
  }
}

async function gracefulShutdown(signal) {
  logger.info(`Received ${signal}, starting graceful shutdown`);
  
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });

    // Force close after 30 seconds
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 30000);
  }
}

// Start the server
startServer();

export default app;
