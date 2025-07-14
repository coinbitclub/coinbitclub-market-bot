import amqp from 'amqplib';
import { recordExecution } from './ledger.js';

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

start();
