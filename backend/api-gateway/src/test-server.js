import '../../../common/env.js';
import express from 'express';
import cors from 'cors';
import { ensureConnection } from '../../../common/db.js';
import logger from '../../../common/logger.js';

console.log('Starting minimal test server...');

const app = express();

app.use(cors());
app.use(express.json());

// Basic health endpoint
app.get('/health', async (req, res) => {
  console.log('Health check requested');
  try {
    await ensureConnection();
    res.json({ status: 'healthy', timestamp: new Date() });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});

// Test docs endpoint
app.get('/docs', (req, res) => {
  res.json({
    title: "CoinBitClub API",
    version: "2.0.0",
    status: "operational"
  });
});

const port = 8080;

app.listen(port, () => {
  console.log(`Test server running on port ${port}`);
});

export default app;
