import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { initDB } from './common/db.js';
import { setupScheduler } from './common/scheduler.js';
import { apiGateway } from './api-gateway/app.js';

async function main() {
  await initDB();
  setupScheduler();

  const app = express();
  app.use(helmet());
  app.use(cors({ origin: process.env.FRONTEND_URL }));
  app.use(express.json());
  app.use('/api', apiGateway);

  const port = process.env.PORT || 8080;
  app.listen(port, () => console.log(`🚀 API running on port ${port}`));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
