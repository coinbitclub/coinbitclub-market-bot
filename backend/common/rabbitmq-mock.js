import logger from './logger.js';

// Mock RabbitMQ for development without actual RabbitMQ server
let mockQueues = new Map();
let mockConsumers = new Map();

// Queue configurations (kept for compatibility)
const QUEUES = {
  WEBHOOK_RECEIVED: 'webhook.received',
  SIGNAL_FILTERED: 'signal.filtered',
  ORDER_REQUEST: 'order.request',
  ORDER_EXECUTED: 'order.executed',
  ORDER_CLOSED: 'order.closed',
  NOTIFICATION_EMAIL: 'notification.email',
  NOTIFICATION_SSE: 'notification.sse'
};

class MockChannel {
  constructor() {
    this.connection = { closed: false };
  }

  async assertQueue(queue) {
    if (!mockQueues.has(queue)) {
      mockQueues.set(queue, []);
      logger.debug(`Mock queue created: ${queue}`);
    }
    return { queue };
  }

  async sendToQueue(queue, content, options = {}) {
    if (!mockQueues.has(queue)) {
      await this.assertQueue(queue);
    }
    
    const message = {
      content: Buffer.isBuffer(content) ? content : Buffer.from(JSON.stringify(content)),
      properties: options.properties || {},
      timestamp: Date.now()
    };
    
    mockQueues.get(queue).push(message);
    logger.debug(`Message sent to mock queue ${queue}:`, { messageCount: mockQueues.get(queue).length });
    
    // Trigger consumers if any
    if (mockConsumers.has(queue)) {
      const consumer = mockConsumers.get(queue);
      setTimeout(() => {
        consumer.callback(message, this);
      }, 10);
    }
    
    return true;
  }

  async consume(queue, callback, options = {}) {
    await this.assertQueue(queue);
    
    mockConsumers.set(queue, { callback, options });
    logger.debug(`Mock consumer registered for queue: ${queue}`);
    
    // Process existing messages
    const messages = mockQueues.get(queue) || [];
    messages.forEach((message, index) => {
      setTimeout(() => callback(message, this), index * 100);
    });
    
    return { consumerTag: `mock-consumer-${queue}` };
  }

  async ack(message) {
    logger.debug('Mock message acknowledged');
  }

  async nack(message, allUpTo = false, requeue = true) {
    logger.debug('Mock message negative acknowledged');
  }

  async prefetch(count) {
    logger.debug(`Mock prefetch set to: ${count}`);
  }

  async close() {
    logger.debug('Mock channel closed');
  }
}

let mockChannel = null;

// Mock connection function
export async function connect() {
  if (mockChannel && !mockChannel.connection.closed) {
    return mockChannel;
  }
  
  mockChannel = new MockChannel();
  logger.info('Mock RabbitMQ connected successfully (development mode)');
  return mockChannel;
}

// Publish message to queue
export async function publishMessage(queue, message, options = {}) {
  try {
    const channel = await connect();
    await channel.sendToQueue(queue, message, options);
    logger.debug(`Published message to ${queue}`);
  } catch (error) {
    logger.error({ error, queue }, 'Failed to publish message');
    throw error;
  }
}

// Subscribe to queue messages
export async function subscribeToQueue(queue, callback, options = {}) {
  try {
    const channel = await connect();
    await channel.consume(queue, (msg, ch) => {
      if (msg) {
        const content = JSON.parse(msg.content.toString());
        callback(content, msg, ch);
        ch.ack(msg);
      }
    }, options);
    
    logger.info(`Subscribed to queue: ${queue}`);
  } catch (error) {
    logger.error({ error, queue }, 'Failed to subscribe to queue');
    throw error;
  }
}

// Graceful shutdown
export async function closeConnection() {
  if (mockChannel) {
    await mockChannel.close();
    mockChannel.connection.closed = true;
    mockChannel = null;
    mockQueues.clear();
    mockConsumers.clear();
    logger.info('Mock RabbitMQ connections closed');
  }
}

// Health check
export function isConnected() {
  return mockChannel && !mockChannel.connection.closed;
}

export { QUEUES };

export default {
  connect,
  publishMessage,
  subscribeToQueue,
  closeConnection,
  isConnected,
  QUEUES
};
