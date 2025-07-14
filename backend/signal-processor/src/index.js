import amqp from 'amqplib';
import { processSignal } from './processor.js';
import '../../common/env.js';
import logger from '../../common/logger.js';

async function start() {
  const conn = await amqp.connect(process.env.AMQP_URL || 'amqp://localhost');
  const channel = await conn.createChannel();
  await channel.assertQueue('webhook.received');
  channel.consume('webhook.received', async msg => {
    const content = JSON.parse(msg.content.toString());
    await processSignal(content);
    channel.ack(msg);
  });
}

start().catch(err => {
  logger.error({ err }, 'signal processor failed');
});
