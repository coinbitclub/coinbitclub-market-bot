jest.mock('../src/services/openaiConnector.js'); // Ativa mock da IA

import request from 'supertest';
import bcrypt from 'bcryptjs';
import { pool } from '../src/services/db.js';
import app from '../src/index.js';

describe('Fluxo completo - operação CoinbitClub com IA e lógica de segurança', () => {
  let token;
  let userId;

  beforeAll(async () => {
    const email = 'expanded@test.com';
    const senha = 'Senha123!';
    const hash = await bcrypt.hash(senha, 10);

    await pool.query(`DELETE FROM users WHERE email = $1`, [email]);

    const result = await pool.query(
      `INSERT INTO users (nome, sobrenome, email, telefone, pais, password_hash, created_at)
       VALUES ('Exp', 'Test', $1, '+5511966666666', 'BR', $2, NOW())
       RETURNING id`,
      [email, hash]
    );

    userId = result.rows[0].id;

    const loginRes = await request(app).post('/auth/login').send({ email, password: senha });
    token = loginRes.body.access;

    await pool.query(`DELETE FROM user_credentials WHERE user_id = $1`, [userId]);
    await pool.query(`DELETE FROM user_operations WHERE user_id = $1`, [userId]);
    await pool.query(`DELETE FROM signals WHERE user_id = $1`, [userId]);
  });

  const signal = {
    pair: 'BTCUSDT',
    type: 'LONG',
    direction: 'BUY',
    timeframe: '1H'
  };

  const contexto = {
    dominancia_btc: 50.2,
    sentimento: 'positivo',
    tendencia_macro: 'alta'
  };

  it('Salva credenciais mock', async () => {
    const res = await request(app)
      .post('/user/credentials')
      .set('Authorization', `Bearer ${token}`)
      .send({
        exchange: 'bybit',
        api_key: 'FAKE_KEY',
        api_secret: 'FAKE_SECRET',
        is_testnet: true
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('exchange', 'bybit');
  });

  it('Decisão IA - order-decision', async () => {
    const res = await request(app)
      .post('/ai/order-decision')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId, signal, contexto });

    expect(res.status).toBe(200);
    expect(res.body.result).toHaveProperty('decisao');
  });

  it('Racional da operação - rationale', async () => {
    const res = await request(app)
      .post('/ai/rationale')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId, trade: { pair: signal.pair, type: signal.type }, contexto });

    expect(res.status).toBe(200);
    expect(res.body.result).toMatch(/.+/);
  });

  it('Checagem de overtrading', async () => {
    const res = await request(app)
      .post('/ai/overtrading-check')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId, signal, contexto });

    expect(res.status).toBe(200);
    expect(res.body.result).toHaveProperty('duplicidade');
  });

  it('Verificação antifraude', async () => {
    const evento = {
      tipo: 'login_multiplo',
      ip: '177.100.200.1',
      device: 'Chrome_Windows'
    };

    const res = await request(app)
      .post('/ai/antifraud-check')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId, evento, contexto });

    expect(res.status).toBe(200);
    expect(res.body.result).toHaveProperty('suspeito');
  });

  it('Logs resolver', async () => {
    const res = await request(app)
      .post('/ai/logs-resolver')
      .set('Authorization', `Bearer ${token}`)
      .send({
        logId: 'TEST_LOG_001',
        logMsg: 'Erro ao processar ordem na Bybit: posição já aberta',
        contexto
      });

    expect(res.status).toBe(200);
    expect(res.body.result).toHaveProperty('acao');
  });

  afterAll(async () => {
    await pool.query(`DELETE FROM user_credentials WHERE user_id = $1`, [userId]);
    await pool.query(`DELETE FROM user_operations WHERE user_id = $1`, [userId]);
    await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
    await pool.end();
  });
});
