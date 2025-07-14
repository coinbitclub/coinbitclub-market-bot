import { executeOrder } from './executor.js';
import logger from '../../common/logger.js';
import '../../common/env.js';

import { ensureConnection } from '../../common/db.js';
import { getChannel } from './rabbitmq.js';
import express from 'express';
import { initMetrics } from '../../common/metrics.js';

async function start() {
  await ensureConnection();
  const channel = await getChannel();
  await channel.assertQueue('order.request');
  channel.consume('order.request', async (msg) => {
    try {
      const order = JSON.parse(msg.content.toString());
      await executeOrder(order);
      channel.ack(msg);
    } catch (err) {
      logger.error({ err }, 'order processing failed');
      channel.nack(msg, false, false);
    }
  });
}

start().catch((err) => {
  logger.error({ err }, 'executor failed to start');
  process.exit(1);
});

const app = express();
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/metrics', initMetrics);
const port = process.env.PORT || 9013;
app.listen(port, () => logger.info(`Order executor running on ${port}`));
