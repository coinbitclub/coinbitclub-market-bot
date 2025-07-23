import { executeOrder } from './executor.js';
import logger from '../../common/logger.js';
import '../../common/env.js';

import { ensureConnection } from '../../common/db.js';
import { consume } from './rabbitmq.js';
import express from 'express';
import { initMetrics } from '../../common/metrics.js';

async function start() {
  await ensureConnection();
  await consume('order.request', async (order) => {
    try {
      await executeOrder(order);
    } catch (err) {
      logger.error({ err }, 'order processing failed');
      throw err;
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
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
const port = process.env.PORT || 9013;
app.listen(port, () => logger.info(`Order executor running on ${port}`));
