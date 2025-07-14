import amqp from 'amqplib';
import { processSignal } from './processor.js';
import '../../common/env.js';
import logger from '../../common/logger.js';
import express from 'express';
import { initMetrics } from '../../common/metrics.js';

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

const app = express();
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/metrics', initMetrics);
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

const port = process.env.PORT || 9012;
app.listen(port, () => logger.info(`Signal processor running on ${port}`));
