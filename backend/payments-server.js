/**
 * Servidor Principal de Pagamentos - Sistema Completo de Recargas Flexíveis
 * Aplicação completa com sistema flexível de recargas e gerenciamento automatizado
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cronJobs from './src/services/cronJobs.js';
import paymentsRoutes from './src/routes/payments.js';
import logger from './common/logger.js';
import { errorHandler } from './src/middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Verificar variáveis de ambiente obrigatórias
const requiredEnvVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'JWT_SECRET',
  'DATABASE_URL'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  logger.error('❌ Variáveis de ambiente obrigatórias não encontradas:', missingEnvVars);
  process.exit(1);
}

// Middlewares de segurança e otimização
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP por janela
  message: 'Muitas tentativas, tente novamente em 15 minutos',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Middlewares de parsing
app.use('/api/payments/webhook/stripe', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware de log
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.method !== 'GET' ? req.body : undefined
  });
  next();
});

// Rotas
app.use('/api/payments', paymentsRoutes);

// Rota de health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: 'connected',
      stripe: 'connected',
      cron_jobs: cronJobs.getJobsStatus()
    }
  });
});

// Middleware de tratamento de erros
app.use(errorHandler);

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    path: req.originalUrl
  });
});

// Iniciar servidor
const server = app.listen(PORT, () => {
  logger.info(`Servidor de pagamentos rodando na porta ${PORT}`);
  
  // Inicializar tarefas agendadas
  if (process.env.NODE_ENV === 'production') {
    cronJobs.initialize();
    logger.info('Tarefas agendadas inicializadas');
  } else {
    logger.info('Tarefas agendadas desabilitadas em desenvolvimento');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Recebido SIGTERM, iniciando shutdown graceful');
  
  cronJobs.stopAllJobs();
  
  server.close(() => {
    logger.info('Servidor fechado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('Recebido SIGINT, iniciando shutdown graceful');
  
  cronJobs.stopAllJobs();
  
  server.close(() => {
    logger.info('Servidor fechado');
    process.exit(0);
  });
});

export default app;
