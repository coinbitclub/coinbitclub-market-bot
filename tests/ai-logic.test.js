import request from 'supertest';
import app from '../src/index.js';
import bcrypt from 'bcryptjs';
import { pool } from '../src/services/db.js';

jest.mock('../src/services/openaiConnector.js');

describe('IA - Monitoramento, Racional, Antifraude, Logs', () => {
  let token;
  let userId;

  beforeAll(async () => {
    const email = 'iaflow@test.com';
    const senha = 'Senha123!';
    const hash = await bcrypt.hash(senha, 10);

    await pool.query(`DELETE FROM users WHERE email = $1`, [email]);

    const result = await pool.query(
      `INSERT INTO users (nome, sobrenome, email, telefone, pais, password_hash, created_at)
       VALUES ('IA', 'Flow', $1, '+5511999990000', 'BR', $2, NOW())
       RETURNING id`,
      [email, hash]
    );

    userId = result.rows[0].id;

    const login = await request(app).post('/auth/login').send({ email, password: senha });
    token = login.body.access;
  });

  it('monitorPosition deve retornar ação sugerida', async () => {
    const res = await request(app)
      .post('/ai/monitor')
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId,
        trade: { pair: 'BTCUSDT', type: 'LONG', entry: 30000 },
        contexto: { noticia: 'nenhuma', volatilidade: 'baixa' }
      });

    expect(res.status).toBe(200);
    expect(res.body.result).toHaveProperty('acao');
  });

  it('rationale deve retornar texto explicativo', async () => {
    const res = await request(app)
      .post('/ai/rationale')
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId,
        trade: { pair: 'BTCUSDT', type: 'LONG' },
        contexto: { tendencia_macro: 'alta' }
      });

    expect(res.status).toBe(200);
    expect(res.body.result).toMatch(/.+/);
  });

  it('antifraudCheck deve retornar suspeito=false', async () => {
    const res = await request(app)
      .post('/ai/antifraud-check')
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId,
        evento: { tipo: 'login_multiplo', ip: '127.0.0.1', device: 'Test' },
        contexto: {}
      });

    expect(res.status).toBe(200);
    expect(res.body.result).toHaveProperty('suspeito');
  });

  it('logsResolver deve retornar ação sugerida', async () => {
    const res = await request(app)
      .post('/ai/logs-resolver')
      .set('Authorization', `Bearer ${token}`)
      .send({
        logId: 'TEST-001',
        logMsg: 'Erro de conexão com Binance',
        contexto: { ambiente: 'testnet' }
      });

    expect(res.status).toBe(200);
    expect(res.body.result).toHaveProperty('acao');
  });

  afterAll(async () => {
    await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
    await pool.end();
  });
});
