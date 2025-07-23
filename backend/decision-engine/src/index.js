import { consume, publish } from './rabbitmq.js';
import { evaluate } from './rulesEngine.js';
import { aiFallback } from './aiFallback.js';
import '../../common/env.js';
import logger from '../../common/logger.js';
import express from 'express';
import { initMetrics } from '../../common/metrics.js';

async function start() {
  await consume('signal.filtered', async (signal) => {
    try {
      let decision = evaluate(signal);
      if (!decision) {
        decision = await aiFallback(signal);
      }
      await publish('order.request', decision);
    } catch (err) {
      logger.warn({ err }, 'discarding unrecognized message');
    }
  });
}

start().catch(err => {
  logger.error({ err }, 'decision engine failed');
});

const app = express();
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/metrics', initMetrics);
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
const port = process.env.PORT || 9011;
app.listen(port, () => logger.info(`Decision engine running on ${port}`));
