import request from 'supertest';
import nock from 'nock';
import app from '../src/index.js';
import * as csService from '../src/services/coinstatsService.js';

// Carrega variáveis de ambiente para testes
const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN;
const COINSTATS_KEY = process.env.COINSTATS_API_KEY;

// --- Mock de CoinStats ---
beforeAll(() => {
  // Mock /public/v1/markets?skip=0&limit=1
  nock('https://api.coinstats.app')
    .get('/public/v1/markets')
    .query({ skip: '0', limit: '1' })
    .reply(200, { coins: [ { marketCap: 12345, volume: 67890 } ] });

  // Mock /insights/fear-and-greed
  nock('https://openapiv1.coinstats.app')
    .get('/insights/fear-and-greed')
    .reply(200, { value: 42, value_classification: 'neutral' });

  // Mock /insights/btc-dominance?type=24h
  nock('https://openapiv1.coinstats.app')
    .get('/insights/btc-dominance')
    .query({ type: '24h' })
    .reply(200, { btc_dominance: 55.5 });
});

describe('Webhook Endpoints', () => {
  it('should accept POST /webhook/signal with valid token', async () => {
    const payload = { symbol: 'BTCUSDT', price: 45000, side: 'buy' };
    const res = await request(app)
      .post(`/webhook/signal?token=${WEBHOOK_TOKEN}`)
      .send(payload)
      .expect(200);
    expect(res.body).toHaveProperty('id');
  });

  it('should reject POST /webhook/signal with invalid token', async () => {
    await request(app)
      .post('/webhook/signal?token=wrong')
      .send({})
      .expect(401);
  });

  it('should accept POST /webhook/dominance with valid token', async () => {
    const dom = { btc_dom: 60.5, eth_dom: 10.2 };
    const res = await request(app)
      .post(`/webhook/dominance?token=${WEBHOOK_TOKEN}`)
      .send(dom)
      .expect(200);
    expect(res.body).toHaveProperty('id');
  });

  it('should reject POST /webhook/dominance without token', async () => {
    await request(app)
      .post('/webhook/dominance')
      .send({})
      .expect(401);
  });
});

describe('CoinStats Service', () => {
  it('fetchMetrics returns parsed marketCap & volume', async () => {
    const { totalMarketCap, totalVolume } = await csService.fetchMetrics(COINSTATS_KEY);
    expect(totalMarketCap).toBe(12345);
    expect(totalVolume).toBe(67890);
  });

  it('fetchFearGreed returns value & classification', async () => {
    const { value, classification } = await csService.fetchFearGreed(COINSTATS_KEY);
    expect(value).toBe(42);
    expect(classification).toBe('neutral');
  });

  it('fetchDominance returns btc_dominance', async () => {
    const { dominance } = await csService.fetchDominance(COINSTATS_KEY);
    expect(dominance).toBe(55.5);
  });
});
