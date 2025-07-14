import { publish } from './rabbitmq.js';
import { db } from '../../common/db.js';
import { getFearAndGreed, getBtcDominance } from './coinStatsClient.js';

export function listenWebhooks(app) {
  app.post('/webhook/tradingview', async (req, res) => {
    const payload = req.body;
    const [id] = await db('raw_webhook').insert({ source: 'tradingview', type: 'entry', raw_data: payload, received_at: new Date() }).returning('id');
    await publish('webhook.received', { id });
    res.json({ ok: true });
  });

  app.post('/webhook/coinstats', async (_req, res) => {
    const fg = await getFearAndGreed();
    const dom = await getBtcDominance();
    await db('cointars').insert({ fear_greed_index: fg, btc_dominance: dom, timestamp: new Date() });
    res.json({ ok: true });
  });
}
