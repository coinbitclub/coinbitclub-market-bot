import amqp from 'amqplib';
import { db } from '../../common/db.js';
import { filterByTimeWindow, filterByFearGreed, filterByDominanceDiff } from './filters.js';

let channel;
async function getChannel() {
  if (!channel) {
    const conn = await amqp.connect(process.env.AMQP_URL || 'amqp://localhost');
    channel = await conn.createChannel();
    await channel.assertQueue('signal.filtered');
  }
  return channel;
}

export async function processSignal(raw) {
  const signal = raw; // simple
  if (!filterByTimeWindow(signal)) return;
  if (!filterByFearGreed(signal.fg)) return;
  if (!filterByDominanceDiff(signal.domDiff)) return;
  const [id] = await db('signals')
    .insert({
      raw_id: signal.id,
      user_id: signal.userId,
      symbol: signal.symbol,
      timeframe: signal.tf,
      indicators: JSON.stringify(signal),
      filtered_at: new Date()
    })
    .returning('id');
  const ch = await getChannel();
  ch.sendToQueue('signal.filtered', Buffer.from(JSON.stringify({ id })));
}
