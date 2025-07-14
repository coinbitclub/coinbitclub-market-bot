import express from 'express';
import { listenWebhooks } from './ingestor.js';
import logger from '../../common/logger.js';
import '../../common/env.js';
import { initMetrics } from '../../common/metrics.js';

const app = express();
app.use(express.json());
listenWebhooks(app);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/metrics', initMetrics);

const port = process.env.PORT || 9001;
app.listen(port, () => logger.info(`Signal ingestor on ${port}`));
