import request from 'supertest';
import bcrypt from 'bcryptjs';
import { pool } from '../src/database.js';
import app from '../src/index.js';

describe('Profile Endpoint', () => {
  let token;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash('Senha123!', 10);

    await pool.query(`DELETE FROM users WHERE id = 18 OR email = 'erica@test.com'`);

    await pool.query(`
      INSERT INTO users (id, nome, sobrenome, email, telefone, pais, password_hash, created_at)
      VALUES (18, $1, $2, $3, $4, $5, $6, NOW())
    `, [
      'Erica',
      'Teste',
      'erica@test.com',
      '+5511999999999',
      'BR',
      passwordHash
    ]);

    const verify = await pool.query(`SELECT id, email FROM users WHERE id = 18`);
    console.log('🧪 Confirmação após insert:', verify.rows);

    const loginRes = await request(app)
      .post('/auth/login')
      .type('application/json')
      .send({
        email: 'erica@test.com',
        password: 'Senha123!'
      });

    console.log('LOGIN STATUS:', loginRes.status);
    console.log('LOGIN BODY:', loginRes.body);

    expect(loginRes.status).toBe(200);
    token = loginRes.body.access;
  });

  it('GET /user/me deve retornar 200 e dados corretos', async () => {
    const res = await request(app)
      .get('/user/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('email', 'erica@test.com');
  });
});

afterAll(async () => {
  await pool.end();
});
