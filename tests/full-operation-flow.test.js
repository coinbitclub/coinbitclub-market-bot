import request from 'supertest';
import bcrypt from 'bcryptjs';
import { pool } from '../src/services/db.js';
import app from '../src/index.js';

describe('Fluxo completo de operação - CoinbitClub', () => {
  let token;
  let userId;

  beforeAll(async () => {
    const email = 'botflow@test.com';
    const senha = 'Senha123!';
    const hash = await bcrypt.hash(senha, 10);

    await pool.query(`DELETE FROM users WHERE email = $1`, [email]);

    const result = await pool.query(
      `INSERT INTO users (nome, sobrenome, email, telefone, pais, password_hash, created_at)
       VALUES ('Bot', 'Flow', $1, '+5511977777777', 'BR', $2, NOW())
       RETURNING id`,
      [email, hash]
    );

    userId = result.rows[0].id;

    const loginRes = await request(app).post('/auth/login').send({ email, password: senha });
    expect(loginRes.status).toBe(200);
    token = loginRes.body.access;

    await pool.query(`DELETE FROM user_credentials WHERE user_id = $1`, [userId]);
    await pool.query(`DELETE FROM user_operations WHERE user_id = $1`, [userId]);
    await pool.query(`DELETE FROM signals WHERE user_id = $1`, [userId]);
  });

  it('Salva credenciais mock para bybit testnet', async () => {
    const res = await request(app)
      .post('/user/credentials')
      .set('Authorization', `Bearer ${token}`)
      .send({
        exchange: 'bybit',
        api_key: 'TEST_API_KEY',
        api_secret: 'TEST_API_SECRET',
        is_testnet: true
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('exchange', 'bybit');
  });

  it('Simula envio de sinal e decisão IA', async () => {
    const mockSignal = {
      pair: 'BTCUSDT',
      type: 'LONG',
      direction: 'BUY',
      timeframe: '1H'
    };

    const contexto = {
      dominancia_btc: 52.1,
      sentimento: 'neutro',
      tendencia_macro: 'lateral'
    };

    const res = await request(app)
      .post('/ai/order-decision')
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId,
        signal: mockSignal,
        contexto
      });

    expect(res.status).toBe(200);
    expect(res.body.result).toHaveProperty('decisao');
    expect(['OPERAR', 'NAO_OPERAR', 'AGUARDAR']).toContain(res.body.result.decisao);
  });

  afterAll(async () => {
    await pool.query(`DELETE FROM user_credentials WHERE user_id = $1`, [userId]);
    await pool.query(`DELETE FROM user_operations WHERE user_id = $1`, [userId]);
    await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
    await pool.end();
  });
});
