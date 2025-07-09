import request from 'supertest';
import app from '../src/index.js';
import { pool } from '../src/services/db.js';
import bcrypt from 'bcryptjs';

describe('Operações - Abertura e Fechamento', () => {
  let token;
  let userId;

  beforeAll(async () => {
    const email = 'operador@test.com';
    const senha = 'Senha123!';
    const passwordHash = await bcrypt.hash(senha, 10);

    await pool.query(`DELETE FROM users WHERE email = $1`, [email]);

    const result = await pool.query(
      `INSERT INTO users (nome, sobrenome, email, telefone, pais, password_hash, created_at)
       VALUES ('Op', 'Teste', $1, '+5511988888888', 'BR', $2, NOW())
       RETURNING id`,
      [email, passwordHash]
    );

    userId = result.rows[0].id;

    const loginRes = await request(app).post('/auth/login').send({ email, password: senha });
    token = loginRes.body.access;

    await pool.query(`DELETE FROM user_operations WHERE user_id = $1`, [userId]);
  });

  it('Deve registrar uma nova operação (mock)', async () => {
    const insert = await pool.query(
      `INSERT INTO user_operations (user_id, exchange, symbol, side, qty, price, opened_at)
       VALUES ($1, 'bybit', 'BTCUSDT', 'BUY', 0.001, 30000, NOW())
       RETURNING id`,
      [userId]
    );

    expect(insert.rowCount).toBe(1);
  });

  it('GET /user/operations deve retornar a operação registrada', async () => {
    const res = await request(app)
      .get('/user/operations')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('symbol', 'BTCUSDT');
  });

  afterAll(async () => {
    await pool.query(`DELETE FROM user_operations WHERE user_id = $1`, [userId]);
    await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
    await pool.end();
  });
});
