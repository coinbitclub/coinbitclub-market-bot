import express from 'express';
import router from './index.js';
import logger from '../../common/logger.js';
import '../../common/env.js';
import { initMetrics } from '../../common/metrics.js';

const app = express();
app.use(express.json());
app.use('/', router);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/metrics', initMetrics);

const port = process.env.PORT || 3000;
app.listen(port, () => logger.info(`Admin panel running on ${port}`));
