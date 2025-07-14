import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import routes from './routes.js';
import { setupScheduler } from './scheduler.js';
import { initMetrics } from './metrics.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', routes);
app.get('/metrics', initMetrics);

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`API Gateway running on ${port}`);
  setupScheduler();
});
