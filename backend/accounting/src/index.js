import { consume } from './rabbitmq.js';
import { recordExecution } from './ledger.js';
import '../../common/env.js';
import logger from '../../common/logger.js';
import express from 'express';
import { initMetrics } from '../../common/metrics.js';

async function start() {
  await consume('order.executed', async (exec) => {
    await recordExecution(exec);
  });
}

start().catch(err => {
  logger.error({ err }, 'accounting failed');
});

const app = express();
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/metrics', initMetrics);
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
const port = process.env.PORT || 9010;
app.listen(port, () => logger.info(`Accounting running on ${port}`));
