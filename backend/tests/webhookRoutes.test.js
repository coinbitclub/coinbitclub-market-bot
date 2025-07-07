// tests/webhookRoutes.test.js
import request from 'supertest';
import app from '../src/index.js';

const TOKEN = process.env.WEBHOOK_TOKEN || '210406';

describe('Healthchecks', () => {
  it('GET / → deve retornar "🚀 Bot ativo!"', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toBe('🚀 Bot ativo!');
  });

  it('GET /healthz → deve retornar "OK"', async () => {
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.text).toBe('OK');
  });
});

describe('Webhook /signal', () => {
  it('401 sem token', async () => {
    const res = await request(app)
      .post('/webhook/signal')
      .send({ symbol: 'BTCUSDT', price: 45000, side: 'buy' });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Token inválido' });
  });

  it('400 payload inválido', async () => {
    const res = await request(app)
      .post(`/webhook/signal?token=${TOKEN}`)
      .send({ symbol: 'BTC', price: 'oops', side: 'buy' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid signal payload' });
  });

  it('200 payload válido', async () => {
    const res = await request(app)
      .post(`/webhook/signal?token=${TOKEN}`)
      .send({ symbol: 'ETHUSDT', price: 2500, side: 'sell' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(typeof res.body.id).toBe('number');
  });
});

describe('Webhook /dominance', () => {
  it('401 sem token', async () => {
    const res = await request(app)
      .post('/webhook/dominance')
      .send({ btc_dom: 60.5, eth_dom: 15.2 });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Token inválido' });
  });

  it('400 payload inválido', async () => {
    const res = await request(app)
      .post(`/webhook/dominance?token=${TOKEN}`)
      .send({ btc_dom: 'NaN' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid dominance payload' });
  });

  it('200 payload válido', async () => {
    const res = await request(app)
      .post(`/webhook/dominance?token=${TOKEN}`)
      .send({ btc_dom: 60.5, eth_dom: 15.2 });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(typeof res.body.id).toBe('number');
  });
});
