import request from 'supertest'
import app from '../dist/index.js'
describe('Auth endpoints', () => {
it('POST /auth/login should return 401 without creds', async () => {
const res = await request(app).post('/auth/login').send({})
expect(res.status).toBe(400)
})
});