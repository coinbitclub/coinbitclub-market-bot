import amqp from 'amqplib';
import retry from 'async-retry';
import logger from '../../common/logger.js';

let connection;
let channel;

export async function getChannel() {
  if (channel) return channel;
  await retry(async () => {
    connection = await amqp.connect(process.env.AMQP_URL);
    channel = await connection.createChannel();
  }, {
    retries: 5,
    minTimeout: 500,
    onRetry: (err) => logger.warn({ err }, 'rabbitmq reconnect'),
  });
  return channel;
}
