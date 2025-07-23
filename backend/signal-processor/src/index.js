import { consume } from './rabbitmq.js';
import { processSignal } from './processor.js';
import '../../common/env.js';
import logger from '../../common/logger.js';
import express from 'express';
import { initMetrics } from '../../common/metrics.js';

async function start() {
  await consume('webhook.received', async (content) => {
    await processSignal(content);
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
