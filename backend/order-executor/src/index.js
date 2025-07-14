import amqp from 'amqplib';
import { executeOrder } from './executor.js';

async function start() {
  const conn = await amqp.connect(process.env.AMQP_URL || 'amqp://localhost');
  const channel = await conn.createChannel();
  await channel.assertQueue('order.request');
  channel.consume('order.request', async msg => {
    const order = JSON.parse(msg.content.toString());
    await executeOrder(order);
    channel.ack(msg);
  });
}

start();
