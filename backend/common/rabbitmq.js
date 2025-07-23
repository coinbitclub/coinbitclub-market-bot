import amqp from 'amqplib';
import retry from 'async-retry';
import logger from './logger.js';
import { env } from './env.js';

let connection;
let channel;

// Queue configurations
const QUEUES = {
  WEBHOOK_RECEIVED: 'webhook.received',
  SIGNAL_FILTERED: 'signal.filtered',
  ORDER_REQUEST: 'order.request',
  ORDER_EXECUTED: 'order.executed',
  ORDER_CLOSED: 'order.closed',
  NOTIFICATION_EMAIL: 'notification.email',
  NOTIFICATION_SSE: 'notification.sse'
};

// Connection with health check and graceful shutdown
export async function connect() {
  if (channel && !channel.connection.closed) return channel;
  
  try {
    await retry(async () => {
      connection = await amqp.connect(env.AMQP_URL, {
        heartbeat: 60,
        recoveryDelay: 1000,
      });
      
      channel = await connection.createChannel();
      
      // Set prefetch to control message processing
      await channel.prefetch(10);
      
      // Setup connection error handlers
      connection.on('error', (err) => {
        logger.error({ err }, 'RabbitMQ connection error');
      });
      
      connection.on('close', () => {
        logger.warn('RabbitMQ connection closed');
        connection = null;
        channel = null;
      });
      
      logger.info('RabbitMQ connected successfully');
    }, {
      retries: 5,
      minTimeout: 1000,
      maxTimeout: 5000,
      onRetry: (err, attempt) => logger.warn({ err, attempt }, 'RabbitMQ reconnect attempt')
    });
    
    return channel;
  } catch (error) {
    logger.error({ error }, 'Failed to connect to RabbitMQ');
    throw error;
  }
}

export async function publish(queue, msg, options = {}) {
  try {
    const ch = await connect();
    await ch.assertQueue(queue, { durable: true });
    
    const messageBuffer = Buffer.from(JSON.stringify(msg));
    const publishOptions = {
      persistent: true,
      timestamp: Date.now(),
      ...options
    };
    
    const published = ch.sendToQueue(queue, messageBuffer, publishOptions);
    
    if (!published) {
      logger.warn({ queue, msg }, 'Message not published - queue full');
      return false;
    }
    
    logger.debug({ queue, msg }, 'Message published');
    return true;
  } catch (error) {
    logger.error({ error, queue, msg }, 'Failed to publish message');
    throw error;
  }
}

export async function consume(queue, handler, options = {}) {
  try {
    const ch = await connect();
    await ch.assertQueue(queue, { durable: true });
    
    const consumerOptions = {
      noAck: false,
      exclusive: false,
      ...options
    };
    
    await ch.consume(queue, async (msg) => {
      if (!msg) {
        logger.warn({ queue }, 'Received null message');
        return;
      }
      
      const startTime = Date.now();
      const messageId = msg.properties.messageId || `${Date.now()}-${Math.random()}`;
      
      try {
        const content = JSON.parse(msg.content.toString());
        logger.debug({ queue, messageId, content }, 'Processing message');
        
        await handler(content, msg);
        
        ch.ack(msg);
        
        const processingTime = Date.now() - startTime;
        logger.debug({ queue, messageId, processingTime }, 'Message processed successfully');
        
      } catch (error) {
        const processingTime = Date.now() - startTime;
        logger.error({ 
          error, 
          queue, 
          messageId, 
          processingTime,
          redelivered: msg.fields.redelivered 
        }, 'Message processing failed');
        
        // Check if message was already redelivered
        if (msg.fields.redelivered) {
          logger.warn({ queue, messageId }, 'Message rejected - too many retries');
          ch.nack(msg, false, false); // Don't requeue
        } else {
          logger.info({ queue, messageId }, 'Message requeued for retry');
          ch.nack(msg, false, true); // Requeue for retry
        }
      }
    }, consumerOptions);
    
    logger.info({ queue }, 'Consumer started');
    
  } catch (error) {
    logger.error({ error, queue }, 'Failed to setup consumer');
    throw error;
  }
}

// Graceful shutdown
export async function close() {
  try {
    if (channel) {
      await channel.close();
      channel = null;
    }
    if (connection) {
      await connection.close();
      connection = null;
    }
    logger.info('RabbitMQ connections closed');
  } catch (error) {
    logger.error({ error }, 'Error closing RabbitMQ connections');
  }
}

// Health check
export async function healthCheck() {
  try {
    if (!connection || connection.closed) {
      return { status: 'disconnected' };
    }
    
    // Simple ping by asserting a temporary queue
    const ch = await connect();
    const testQueue = `health-check-${Date.now()}`;
    await ch.assertQueue(testQueue, { autoDelete: true });
    await ch.deleteQueue(testQueue);
    
    return { status: 'connected' };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
}

// Export queue names for consistency
export { QUEUES };

// Setup graceful shutdown handlers
process.on('SIGINT', close);
process.on('SIGTERM', close);
process.on('exit', close);
