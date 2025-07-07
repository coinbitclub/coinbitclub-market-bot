// tests/e2e.test.js
import request from 'supertest'
import app from '../src/index.js'

const TOKEN = process.env.WEBHOOK_TOKEN || '210406'
const ORIGIN = process.env.FRONTEND_URL || '*'

describe('E2E: Public & Healthz & CORS', () => {
  it('GET / → 200, 🚀 Bot ativo! e CORS', async () => {
    const res = await request(app)
      .get('/')
      .set('Origin', ORIGIN)
    expect(res.status).toBe(200)
    expect(res.text).toBe('🚀 Bot ativo!')
    expect(res.headers['access-control-allow-origin']).toBe(ORIGIN)
  })

  it('GET /healthz → 200, OK e CORS', async () => {
    const res = await request(app)
      .get('/healthz')
      .set('Origin', ORIGIN)
    expect(res.status).toBe(200)
    expect(res.text).toBe('OK')
    expect(res.headers['access-control-allow-origin']).toBe(ORIGIN)
  })
})

describe('E2E: Preflight CORS', () => {
  it('OPTIONS /* → 204 e CORS headers', async () => {
    const res = await request(app)
      .options('/webhook/signal')
      .set('Origin', ORIGIN)
    expect(res.status).toBe(204)
    expect(res.headers['access-control-allow-origin']).toBe(ORIGIN)
    expect(res.headers['access-control-allow-methods']).toMatch(
      /GET, ?POST, ?PUT, ?PATCH, ?DELETE, ?OPTIONS/
    )
  })
})

describe('E2E: Webhook /signal', () => {
  it('401 sem token + CORS', async () => {
    const res = await request(app)
      .post('/webhook/signal')
      .set('Origin', ORIGIN)
      .send({ symbol: 'BTCUSDT', price: 45000, side: 'buy' })

    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'Token inválido' })
    expect(res.headers['access-control-allow-origin']).toBe(ORIGIN)
  })

  it('400 payload inválido + CORS', async () => {
    const res = await request(app)
      .post(`/webhook/signal?token=${TOKEN}`)
      .set('Origin', ORIGIN)
      .send({ symbol: 'BTC', price: 'oops', side: 'buy' })

    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'Invalid signal payload' })
    expect(res.headers['access-control-allow-origin']).toBe(ORIGIN)
  })

  it('200 ok + CORS', async () => {
    const res = await request(app)
      .post(`/webhook/signal?token=${TOKEN}`)
      .set('Origin', ORIGIN)
      .send({ symbol: 'BTCUSDT', price: 45000, side: 'buy' })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('ok', true)
    expect(typeof res.body.id).toBe('number')
    expect(res.headers['access-control-allow-origin']).toBe(ORIGIN)
  })
})

describe('E2E: Webhook /dominance', () => {
  it('401 sem token + CORS', async () => {
    const res = await request(app)
      .post('/webhook/dominance')
      .set('Origin', ORIGIN)
      .send({ btc_dom: 60.5, eth_dom: 15.2 })

    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'Token inválido' })
    expect(res.headers['access-control-allow-origin']).toBe(ORIGIN)
  })

  it('400 payload inválido + CORS', async () => {
    const res = await request(app)
      .post(`/webhook/dominance?token=${TOKEN}`)
      .set('Origin', ORIGIN)
      .send({ btc_dom: 'NaN' })

    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'Invalid dominance payload' })
    expect(res.headers['access-control-allow-origin']).toBe(ORIGIN)
  })

  it('200 ok + CORS', async () => {
    const res = await request(app)
      .post(`/webhook/dominance?token=${TOKEN}`)
      .set('Origin', ORIGIN)
      .send({ btc_dom: 60.5, eth_dom: 15.2 })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('ok', true)
    expect(typeof res.body.id).toBe('number')
    expect(res.headers['access-control-allow-origin']).toBe(ORIGIN)
  })
})
