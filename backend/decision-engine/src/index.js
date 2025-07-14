import amqp from 'amqplib';
import { evaluate } from './rulesEngine.js';
import { aiFallback } from './aiFallback.js';
import '../../common/env.js';
import logger from '../../common/logger.js';
import express from 'express';
import { initMetrics } from '../../common/metrics.js';

async function start() {
  const conn = await amqp.connect(process.env.AMQP_URL || 'amqp://localhost');
  const channel = await conn.createChannel();
  await channel.assertQueue('signal.filtered');
  await channel.assertQueue('order.request');
  channel.consume('signal.filtered', async msg => {
    const signal = JSON.parse(msg.content.toString());
    let decision = evaluate(signal);
    if (!decision) {
      decision = await aiFallback(signal);
    }
    channel.sendToQueue('order.request', Buffer.from(JSON.stringify(decision)));
    channel.ack(msg);
  });
}

start().catch(err => {
  logger.error({ err }, 'decision engine failed');
});

const app = express();
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/metrics', initMetrics);
const port = process.env.PORT || 9011;
app.listen(port, () => logger.info(`Decision engine running on ${port}`));
