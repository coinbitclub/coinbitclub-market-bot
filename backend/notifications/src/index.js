import amqp from 'amqplib';
import { sendEmail } from './emailNotifier.js';
import { setupSSE, broadcast } from './sseNotifier.js';
import express from 'express';

const app = express();
setupSSE(app);

async function start() {
  const conn = await amqp.connect(process.env.AMQP_URL || 'amqp://localhost');
  const channel = await conn.createChannel();
  await channel.assertQueue('order.executed');
  channel.consume('order.executed', async msg => {
    const order = JSON.parse(msg.content.toString());
    await sendEmail(order);
    broadcast('order.executed', order);
    channel.ack(msg);
  });
}

start();
export default app;
