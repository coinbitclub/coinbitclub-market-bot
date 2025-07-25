import '../../../common/env.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import routes from './routes.js';
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
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://coinbitclub.com', 'https://www.coinbitclub.com']
    : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint (should be before auth)
app.get('/health', async (req, res) => {
  try {
    // Quick database health check
    await ensureConnection();
    
    res.json({
      status: 'healthy',
      timestamp: new Date(),
      services: {
        database: {
          status: 'healthy',
          responseTime: 3,
          timestamp: new Date()
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date()
    });
  }
});

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

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error({ error: error.message, stack: error.stack }, 'Unhandled error');
  
  if (res.headersSent) {
    return next(error);
  }
  
  res.status(500).json({
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    timestamp: new Date()
  });
});

// Graceful shutdown
function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Graceful shutdown...`);
  
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

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

let server;

async function startServer() {
  try {
    // Verify database connection
    await ensureConnection();
    logger.info('Database connection established');

    // Start the HTTP server
    const port = env.API_GATEWAY_PORT || env.PORT || 8080;
    server = app.listen(port, () => {
      logger.info(`API Gateway running on port ${port}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
      logger.info('API Gateway started successfully');
    });

  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    
    if (error.code === 'EADDRINUSE') {
      const port = env.API_GATEWAY_PORT || env.PORT || 8080;
      logger.error(`Port ${port} is already in use`);
    }
    
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;
