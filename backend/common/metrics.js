import promClient from 'prom-client';
import logger from './logger.js';
import { healthCheck as dbHealthCheck } from './db.js';
import { healthCheck as rabbitHealthCheck } from './rabbitmq.js';

// Create a Registry to register the metrics
const register = new promClient.Registry();

// Add default metrics
promClient.collectDefaultMetrics({
  register,
  prefix: 'coinbitclub_',
});

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'coinbitclub_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

const httpRequestsTotal = new promClient.Counter({
  name: 'coinbitclub_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const activeConnections = new promClient.Gauge({
  name: 'coinbitclub_active_connections',
  help: 'Number of active connections',
  labelNames: ['service']
});

const orderExecutions = new promClient.Counter({
  name: 'coinbitclub_order_executions_total',
  help: 'Total number of order executions',
  labelNames: ['exchange', 'symbol', 'side', 'status']
});

const signalsProcessed = new promClient.Counter({
  name: 'coinbitclub_signals_processed_total',
  help: 'Total number of signals processed',
  labelNames: ['source', 'status']
});

const aiDecisions = new promClient.Counter({
  name: 'coinbitclub_ai_decisions_total',
  help: 'Total number of AI decisions made',
  labelNames: ['action', 'confidence']
});

const userBalances = new promClient.Gauge({
  name: 'coinbitclub_user_balances_usd',
  help: 'User balances in USD',
  labelNames: ['user_id', 'exchange']
});

const systemHealth = new promClient.Gauge({
  name: 'coinbitclub_system_health',
  help: 'System health status (1 = healthy, 0 = unhealthy)',
  labelNames: ['component']
});

const messageQueueDepth = new promClient.Gauge({
  name: 'coinbitclub_message_queue_depth',
  help: 'Number of messages in queue',
  labelNames: ['queue_name']
});

const dbQueryDuration = new promClient.Histogram({
  name: 'coinbitclub_db_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['query_type'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

// Register all metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(activeConnections);
register.registerMetric(orderExecutions);
register.registerMetric(signalsProcessed);
register.registerMetric(aiDecisions);
register.registerMetric(userBalances);
register.registerMetric(systemHealth);
register.registerMetric(messageQueueDepth);
register.registerMetric(dbQueryDuration);

// Middleware to collect HTTP metrics
export function collectHttpMetrics(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);
    
    httpRequestsTotal
      .labels(req.method, route, res.statusCode)
      .inc();
  });
  
  next();
}

// Helper functions to update metrics
export const metrics = {
  recordOrderExecution: (exchange, symbol, side, status) => {
    orderExecutions.labels(exchange, symbol, side, status).inc();
  },
  
  recordSignalProcessed: (source, status) => {
    signalsProcessed.labels(source, status).inc();
  },
  
  recordAiDecision: (action, confidence) => {
    aiDecisions.labels(action, confidence).inc();
  },
  
  updateUserBalance: (userId, exchange, balance) => {
    userBalances.labels(userId, exchange).set(balance);
  },
  
  updateSystemHealth: (component, isHealthy) => {
    systemHealth.labels(component).set(isHealthy ? 1 : 0);
  },
  
  updateQueueDepth: (queueName, depth) => {
    messageQueueDepth.labels(queueName).set(depth);
  },
  
  recordDbQuery: (queryType, duration) => {
    dbQueryDuration.labels(queryType).observe(duration);
  },
  
  setActiveConnections: (service, count) => {
    activeConnections.labels(service).set(count);
  }
};

// Health check function
async function performHealthChecks() {
  try {
    // Database health
    const dbHealth = await dbHealthCheck();
    metrics.updateSystemHealth('database', dbHealth.status === 'healthy');
    
    // RabbitMQ health  
    const rabbitHealth = await rabbitHealthCheck();
    metrics.updateSystemHealth('rabbitmq', rabbitHealth.status === 'connected');
    
    logger.debug('Health checks completed');
  } catch (error) {
    logger.error({ error }, 'Health check failed');
  }
}

// Run health checks periodically
setInterval(performHealthChecks, 30000); // Every 30 seconds

// Main metrics endpoint
export async function initMetrics(req, res) {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.send(metrics);
  } catch (error) {
    logger.error({ error }, 'Failed to generate metrics');
    res.status(500).send('Error generating metrics');
  }
}

// Health endpoint with detailed status
export async function healthEndpoint(req, res) {
  try {
    const dbHealth = await dbHealthCheck();
    const rabbitHealth = await rabbitHealthCheck();
    
    const overallHealth = dbHealth.status === 'healthy' && 
                         rabbitHealth.status === 'connected';
    
    const healthData = {
      status: overallHealth ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth,
        rabbitmq: rabbitHealth
      }
    };
    
    res.status(overallHealth ? 200 : 503).json(healthData);
  } catch (error) {
    logger.error({ error }, 'Health endpoint failed');
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

export default register;
