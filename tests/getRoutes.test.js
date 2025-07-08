// tests/getRoutes.test.js

import request from 'supertest'
import app from '../src/index.js'

describe('Rotas Públicas (GET)', () => {
  describe('GET /', () => {
    it('deve retornar 200 e 🚀 Bot ativo!', async () => {
      const res = await request(app).get('/')
      expect(res.status).toBe(200)
      expect(res.text).toBe('🚀 Bot ativo!')
    })
  })

  describe('GET /healthz', () => {
    it('deve retornar 200 e OK', async () => {
      const res = await request(app).get('/healthz')
      expect(res.status).toBe(200)
      expect(res.text).toBe('OK')
    })
  })
})
