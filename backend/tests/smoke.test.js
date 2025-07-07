import request from 'supertest';
import app from '../src/index.js';

describe('Smoke Tests', () => {
  it('GET / → 200 e mensagem de status', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toBe('🚀 Bot ativo!');
  });

  it('GET /healthz → 200 e OK', async () => {
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.text).toBe('OK');
  });
});
