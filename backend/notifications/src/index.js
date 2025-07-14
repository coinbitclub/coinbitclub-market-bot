import { consume } from './rabbitmq.js';
import { sendEmail } from './emailNotifier.js';
import { setupSSE, broadcast } from './sseNotifier.js';
import express from 'express';
import logger from '../../common/logger.js';
import '../../common/env.js';
import { initMetrics } from '../../common/metrics.js';

const app = express();
setupSSE(app);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/metrics', initMetrics);
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

async function start() {
  await consume('order.executed', async (order) => {
    await sendEmail(order);
    broadcast('order.executed', order);
    logger.info({ order }, 'notification sent');
  });
}

start();
export default app;
