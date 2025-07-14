import 'dotenv/config';
import '../../common/env.js';
import express from 'express';
import cors from 'cors';
import routes from './routes.js';
import { setupScheduler } from './scheduler.js';
import { initMetrics } from './metrics.js';
import logger from '../../common/logger.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', routes);
app.get('/metrics', initMetrics);

const port = process.env.PORT || 8080;
app.listen(port, () => {
  logger.info(`API Gateway running on ${port}`);
  setupScheduler();
});
