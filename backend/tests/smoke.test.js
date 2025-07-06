// tests/smoke.test.js
import request from 'supertest';
import app from '../src/index.js';

describe('🌡️ Smoke tests', () => {
  it('GET / → 200', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/Bot ativo/);
  });

  it('GET /healthz → 200', async () => {
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.text).toBe('OK');
  });

  // opcional: simular um POST de sinal vazio para ver se ele falha rápido
  it('POST /webhook/signal sem token → 401', async () => {
    const res = await request(app)
      .post('/webhook/signal')
      .send({ symbol: 'BTCUSDT', price: 30000 });
    expect(res.status).toBe(401);
  });
});
