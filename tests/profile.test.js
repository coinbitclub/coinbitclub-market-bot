import request from 'supertest';
import app from '../src/index.js';

describe('Profile Endpoint', () => {
  let token;

  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: 'erica@test.com', password: 'Senha123!' })
      .set('Content-Type', 'application/json; charset=utf-8');
    expect(loginRes.status).toBe(200);
    token = loginRes.body.token;
  });

  it('GET /user/profile deve retornar 200 e dados corretos', async () => {
    const res = await request(app)
      .get('/user/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('email', 'erica@test.com');
  });
});
