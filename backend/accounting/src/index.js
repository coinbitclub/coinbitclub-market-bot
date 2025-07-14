import amqp from 'amqplib';
import { recordExecution } from './ledger.js';
import '../../common/env.js';
import logger from '../../common/logger.js';
import express from 'express';
import { initMetrics } from '../../common/metrics.js';

async function start() {
  const conn = await amqp.connect(process.env.AMQP_URL || 'amqp://localhost');
  const channel = await conn.createChannel();
  await channel.assertQueue('order.executed');
  channel.consume('order.executed', async msg => {
    const exec = JSON.parse(msg.content.toString());
    await recordExecution(exec);
    channel.ack(msg);
  });
}

start().catch(err => {
  logger.error({ err }, 'accounting failed');
});

const app = express();
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
const port = process.env.PORT || 9010;
app.listen(port, () => logger.info(`Accounting running on ${port}`));
