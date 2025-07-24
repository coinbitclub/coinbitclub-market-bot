import 'dotenv/config';
import '../common/env.js';
import express from 'express';
import cors from 'cors';
import routes from './src/routes.js';
import { setupScheduler } from './src/scheduler.js';
import { initMetrics } from './src/metrics.js';
import logger from '../common/logger.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', routes);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/metrics', initMetrics);
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

const port = process.env.PORT || 8080;
app.listen(port, () => {
  logger.info(`API Gateway running on ${port}`);
  setupScheduler();
});
