import request from 'supertest'
import app from '../dist/index.js'
describe('Webhook endpoints', () => {
it('POST /webhook/signal without token returns 401', async () => {
const res = await request(app).post('/webhook/signal').send({})
expect(res.status).toBe(401)
})
});