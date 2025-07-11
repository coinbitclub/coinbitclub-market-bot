
import request from 'supertest';
import app from '../app'; // Assuming app.js or equivalent is the main Express app

describe('Webhook Routes', () => {
  // Test token validation for the /signal route
  it('should return 401 if token is invalid', async () => {
    const response = await request(app)
      .post('/webhook/signal')
      .query({ token: 'invalid_token' })
      .send({ someData: 'test' });
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Token inválido');
  });

  // Test the /signal route with a valid token
  it('should process the signal correctly with a valid token', async () => {
    const validToken = process.env.WEBHOOK_TOKEN; // Assuming this is set in .env
    const response = await request(app)
      .post('/webhook/signal')
      .query({ token: validToken })
      .send({ someData: 'test' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
  });

  // Test stub behavior in webhookRoutes.js
  it('should return 200 and status ok from the stubbed /signal route', async () => {
    const response = await request(app)
      .post('/webhook/signal')
      .send({ someData: 'test' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
});
