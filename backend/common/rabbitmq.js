import amqp from 'amqplib';
import retry from 'async-retry';
import logger from './logger.js';

let connection;
let channel;

export async function connect() {
  if (channel) return channel;
  await retry(async () => {
    connection = await amqp.connect(process.env.AMQP_URL);
    channel = await connection.createChannel();
  }, {
    retries: 5,
    minTimeout: 500,
    onRetry: (err) => logger.warn({ err }, 'rabbitmq reconnect')
  });
  return channel;
}

export async function publish(queue, msg) {
  const ch = await connect();
  await ch.assertQueue(queue);
  ch.sendToQueue(queue, Buffer.from(JSON.stringify(msg)));
}

export async function consume(queue, handler) {
  const ch = await connect();
  await ch.assertQueue(queue);
  ch.consume(queue, async (msg) => {
    try {
      await handler(JSON.parse(msg.content.toString()));
      ch.ack(msg);
    } catch (err) {
      logger.error({ err }, 'consume failed');
      ch.nack(msg, false, false);
    }
  });
}
