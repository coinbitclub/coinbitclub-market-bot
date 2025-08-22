/**
 * MARKETBOT - INTEGRATION TESTS
 * FASE 8: Testes de Integração de APIs
 * 
 * Testes completos para validar integração entre componentes:
 * - Endpoints de autenticação
 * - Endpoints de trading
 * - Endpoints de market intelligence
 * - Middleware de autenticação
 * - Validação de dados
 */

import request from 'supertest';
import { Application } from 'express';
import { DatabaseService } from '../../src/services/database.service';
import { AuthService } from '../../src/services/auth.service';
import { TradingService } from '../../src/services/trading.service';
import { MarketIntelligenceService } from '../../src/services/market-intelligence.service';

// Importar mocks
import '../mocks/binance.mock';
import '../mocks/bybit.mock';
import '../mocks/stripe.mock';

describe('API Integration Tests', () => {
  let app: Application;
  let dbService: DatabaseService;
  let authService: AuthService;
  let tradingService: TradingService;
  let marketService: MarketIntelligenceService;
  let userToken: string;
  let testUserId: string;

  beforeAll(async () => {
    // Configurar ambiente de teste
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret-key-for-integration';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/marketbot_test';
    
    // Inicializar serviços
    dbService = new DatabaseService();
    authService = new AuthService(dbService.getPool());
    tradingService = new TradingService();
    marketService = new MarketIntelligenceService();
    
    // Configurar aplicação
    const { createApp } = await import('../../src/app');
    app = createApp();
    
    // Conectar ao banco de teste
    await dbService.connect();
    
    // Criar usuário de teste
    const testUser = await authService.register({
      email: 'integration.test@marketbot.com',
      password: 'SecureTestPass123!',
      fullName: 'Integration Test User',
      phone: '+1234567890'
    });
    
    testUserId = testUser.user.id;
    userToken = testUser.accessToken;
  });

  afterAll(async () => {
    // Limpar dados de teste
    await dbService.query('DELETE FROM users WHERE email = $1', ['integration.test@marketbot.com']);
    await dbService.disconnect();
  });

  describe('Authentication Endpoints', () => {
    test('POST /api/auth/register - should create new user', async () => {
      const userData = {
        email: 'newuser@test.com',
        password: 'NewUserPass123!',
        fullName: 'New Test User',
        phone: '+9876543210'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.fullName).toBe(userData.fullName);
      expect(response.body.user).not.toHaveProperty('password');

      // Limpar usuário criado
      await dbService.query('DELETE FROM users WHERE email = $1', [userData.email]);
    });

    test('POST /api/auth/login - should authenticate existing user', async () => {
      const loginData = {
        email: 'integration.test@marketbot.com',
        password: 'SecureTestPass123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user.email).toBe(loginData.email);
      expect(typeof response.body.accessToken).toBe('string');
    });

    test('POST /api/auth/login - should reject invalid credentials', async () => {
      const invalidLogin = {
        email: 'integration.test@marketbot.com',
        password: 'WrongPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidLogin)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid credentials');
    });

    test('GET /api/auth/profile - should return user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('integration.test@marketbot.com');
      expect(response.body.user).not.toHaveProperty('password');
    });

    test('GET /api/auth/profile - should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid token');
    });
  });

  describe('Trading Endpoints', () => {
    test('POST /api/trading/position - should create new trading position', async () => {
      const positionData = {
        symbol: 'BTCUSDT',
        side: 'buy',
        amount: 0.001,
        exchange: 'binance',
        orderType: 'market'
      };

      const response = await request(app)
        .post('/api/trading/position')
        .set('Authorization', `Bearer ${userToken}`)
        .send(positionData)
        .expect(201);

      expect(response.body).toHaveProperty('position');
      expect(response.body.position.symbol).toBe(positionData.symbol);
      expect(response.body.position.side).toBe(positionData.side);
      expect(response.body.position.status).toBe('active');
    });

    test('GET /api/trading/positions - should return user positions', async () => {
      const response = await request(app)
        .get('/api/trading/positions')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('positions');
      expect(Array.isArray(response.body.positions)).toBe(true);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('pagination');
    });

    test('POST /api/trading/position/:id/close - should close trading position', async () => {
      // Primeiro criar uma posição
      const positionData = {
        symbol: 'ETHUSDT',
        side: 'buy',
        amount: 0.01,
        exchange: 'binance',
        orderType: 'market'
      };

      const createResponse = await request(app)
        .post('/api/trading/position')
        .set('Authorization', `Bearer ${userToken}`)
        .send(positionData);

      const positionId = createResponse.body.position.id;

      // Agora fechar a posição
      const closeResponse = await request(app)
        .post(`/api/trading/position/${positionId}/close`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(closeResponse.body).toHaveProperty('position');
      expect(closeResponse.body.position.status).toBe('closed');
    });

    test('GET /api/trading/balance - should return user balance', async () => {
      const response = await request(app)
        .get('/api/trading/balance')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('balance');
      expect(response.body.balance).toHaveProperty('total');
      expect(response.body.balance).toHaveProperty('available');
      expect(response.body.balance).toHaveProperty('locked');
      expect(typeof response.body.balance.total).toBe('number');
    });
  });

  describe('Market Intelligence Endpoints', () => {
    test('GET /api/market/analysis/:symbol - should return market analysis', async () => {
      const symbol = 'BTCUSDT';
      
      const response = await request(app)
        .get(`/api/market/analysis/${symbol}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('analysis');
      expect(response.body.analysis).toHaveProperty('symbol');
      expect(response.body.analysis).toHaveProperty('recommendation');
      expect(response.body.analysis).toHaveProperty('confidence');
      expect(response.body.analysis.symbol).toBe(symbol);
    });

    test('GET /api/market/signals - should return trading signals', async () => {
      const response = await request(app)
        .get('/api/market/signals')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('signals');
      expect(Array.isArray(response.body.signals)).toBe(true);
      expect(response.body).toHaveProperty('timestamp');
      
      if (response.body.signals.length > 0) {
        const signal = response.body.signals[0];
        expect(signal).toHaveProperty('symbol');
        expect(signal).toHaveProperty('action');
        expect(signal).toHaveProperty('confidence');
        expect(signal).toHaveProperty('reason');
      }
    });

    test('GET /api/market/portfolio/analysis - should return portfolio analysis', async () => {
      const response = await request(app)
        .get('/api/market/portfolio/analysis')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('portfolio');
      expect(response.body.portfolio).toHaveProperty('totalValue');
      expect(response.body.portfolio).toHaveProperty('pnl24h');
      expect(response.body.portfolio).toHaveProperty('winRate');
      expect(response.body.portfolio).toHaveProperty('riskScore');
    });
  });

  describe('Authentication Middleware Integration', () => {
    test('Protected endpoints should reject requests without token', async () => {
      const protectedEndpoints = [
        '/api/trading/positions',
        '/api/trading/balance',
        '/api/market/analysis/BTCUSDT',
        '/api/market/signals',
        '/api/auth/profile'
      ];

      for (const endpoint of protectedEndpoints) {
        const response = await request(app)
          .get(endpoint)
          .expect(401);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Access token required');
      }
    });

    test('Protected endpoints should reject malformed tokens', async () => {
      const malformedTokens = [
        'invalid-token',
        'Bearer',
        'Bearer ',
        'Bearer invalid.token.format',
        'NotBearer validtoken'
      ];

      for (const token of malformedTokens) {
        const response = await request(app)
          .get('/api/auth/profile')
          .set('Authorization', token)
          .expect(401);

        expect(response.body).toHaveProperty('error');
      }
    });
  });

  describe('Input Validation Integration', () => {
    test('Registration should validate email format', async () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain',
        'user space@domain.com'
      ];

      for (const email of invalidEmails) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email,
            password: 'ValidPass123!',
            fullName: 'Test User',
            phone: '+1234567890'
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('email');
      }
    });

    test('Trading position should validate required fields', async () => {
      const invalidPositions = [
        { symbol: 'BTCUSDT' }, // missing side, amount, exchange
        { side: 'buy' }, // missing symbol, amount, exchange
        { symbol: 'BTCUSDT', side: 'invalid', amount: 0.001, exchange: 'binance' }, // invalid side
        { symbol: 'BTCUSDT', side: 'buy', amount: -0.001, exchange: 'binance' }, // negative amount
        { symbol: 'BTCUSDT', side: 'buy', amount: 0.001, exchange: 'invalid' } // invalid exchange
      ];

      for (const position of invalidPositions) {
        const response = await request(app)
          .post('/api/trading/position')
          .set('Authorization', `Bearer ${userToken}`)
          .send(position)
          .expect(400);

        expect(response.body).toHaveProperty('error');
      }
    });
  });

  describe('Error Handling Integration', () => {
    test('API should handle database connection errors gracefully', async () => {
      // Simular erro de conexão temporariamente
      const originalQuery = dbService.query;
      dbService.query = jest.fn().mockRejectedValue(new Error('Database connection lost'));

      const response = await request(app)
        .get('/api/trading/positions')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Internal server error');

      // Restaurar função original
      dbService.query = originalQuery;
    });

    test('API should handle external service timeouts', async () => {
      // Simular timeout de API externa
      const mockFetch = jest.fn().mockRejectedValue(new Error('Request timeout'));
      global.fetch = mockFetch;

      const response = await request(app)
        .get('/api/market/analysis/BTCUSDT')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(503);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Service temporarily unavailable');
    });
  });

  describe('Performance Integration', () => {
    test('API responses should be within acceptable time limits', async () => {
      const endpoints = [
        { method: 'GET', path: '/api/auth/profile' },
        { method: 'GET', path: '/api/trading/positions' },
        { method: 'GET', path: '/api/trading/balance' },
        { method: 'GET', path: '/api/market/signals' }
      ];

      for (const endpoint of endpoints) {
        const start = Date.now();
        
        await request(app)
          [endpoint.method.toLowerCase() as 'get'](endpoint.path)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);
        
        const duration = Date.now() - start;
        
        // Máximo 5 segundos para qualquer endpoint
        expect(duration).toBeLessThan(5000);
        
        // Máximo 1 segundo para endpoints críticos
        if (endpoint.path.includes('/auth/profile') || endpoint.path.includes('/balance')) {
          expect(duration).toBeLessThan(1000);
        }
      }
    });

    test('API should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 10;
      const requests = Array(concurrentRequests).fill(null).map(() =>
        request(app)
          .get('/api/auth/profile')
          .set('Authorization', `Bearer ${userToken}`)
      );

      const start = Date.now();
      const responses = await Promise.all(requests);
      const duration = Date.now() - start;

      // Todas as requests devem ter sucesso
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Concurrent requests não devem demorar mais que 10 segundos
      expect(duration).toBeLessThan(10000);
      
      // Performance per request deve ser razoável
      const avgDuration = duration / concurrentRequests;
      expect(avgDuration).toBeLessThan(2000);
    });
  });
});
