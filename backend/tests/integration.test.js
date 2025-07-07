import request from 'supertest';
import nock from 'nock';
import app from '../src/index.js';

// Carrega variáveis de ambiente
const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN;
const COINSTATS_KEY  = process.env.COINSTATS_API_KEY;

// --- Mocks CoinStats ---
beforeAll(() => {
  nock('https://api.coinstats.app')
    .get('/public/v1/markets')
    .query({ skip: '0', limit: '1' })
    .reply(200, { coins: [{ marketCap: 12345, volume: 67890 }] });

  nock('https://openapiv1.coinstats.app')
    .get('/insights/fear-and-greed')
    .reply(200, { value: 42, value_classification: 'neutral' });

  nock('https://openapiv1.coinstats.app')
    .get('/insights/btc-dominance')
    .query({ type: '24h' })
    .reply(200, { btc_dominance: 55.5 });
});

describe('Webhook Endpoints', () => {
  it('POST /webhook/signal com token válido → 200 + {id}', async () => {
    const payload = { symbol: 'BTCUSDT', price: 45000, side: 'buy' };
    const res = await request(app)
      .post(`/webhook/signal?token=${WEBHOOK_TOKEN}`)
      .send(payload)
      .expect(200);
    expect(res.body).toHaveProperty('id');
  });

  it('POST /webhook/signal com token inválido → 401', async () => {
    await request(app)
      .post('/webhook/signal?token=wrong')
      .send({})
      .expect(401);
  });

  it('POST /webhook/dominance com token válido → 200 + {id}', async () => {
    const dom = { btc_dom: 60.5, eth_dom: 10.2 };
    const res = await request(app)
      .post(`/webhook/dominance?token=${WEBHOOK_TOKEN}`)
      .send(dom)
      .expect(200);
    expect(res.body).toHaveProperty('id');
  });

  it('POST /webhook/dominance sem token → 401', async () => {
    await request(app)
      .post('/webhook/dominance')
      .send({})
      .expect(401);
  });
});

describe('CoinStats Service', () => {
  it('fetchMetrics retorna marketCap e volume', async () => {
    const { totalMarketCap, totalVolume } = await import('../src/services/coinstatsService.js')
      .then(m => m.fetchMetrics(COINSTATS_KEY));
    expect(totalMarketCap).toBe(12345);
    expect(totalVolume).toBe(67890);
  });

  it('fetchFearGreed retorna value e classification', async () => {
    const { value, classification } = await import('../src/services/coinstatsService.js')
      .then(m => m.fetchFearGreed(COINSTATS_KEY));
    expect(value).toBe(42);
    expect(classification).toBe('neutral');
  });

  it('fetchDominance retorna btc_dominance', async () => {
    const { dominance } = await import('../src/services/coinstatsService.js')
      .then(m => m.fetchDominance(COINSTATS_KEY));
    expect(dominance).toBe(55.5);
  });
});
