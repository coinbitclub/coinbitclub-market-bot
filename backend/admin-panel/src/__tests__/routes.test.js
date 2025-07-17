import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';

let dbMock;
jest.unstable_mockModule('../../../common/db.js', () => {
  dbMock = jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([{ id: 1 }]),
    del: jest.fn().mockResolvedValue(),
    orderBy: jest.fn().mockReturnThis(),
    update: jest.fn().mockResolvedValue(),
    first: jest.fn().mockResolvedValue(),
  }));
  return { db: dbMock };
});

const { default: router } = await import('../index.js');
const app = express();
app.use(express.json());
app.use('/', router);

test('listCredentials returns 200', async () => {
  const res = await request(app).get('/credentials/1');
  expect(res.statusCode).toBe(200);
});

test('createCredential returns 201', async () => {
  const res = await request(app).post('/credentials/1').send({ apiKey: 'k', secret: 's', exchange: 'bybit' });
  expect(res.statusCode).toBe(201);
});
