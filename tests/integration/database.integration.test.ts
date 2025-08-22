
// ========================================
// MARKETBOT - DATABASE INTEGRATION TESTS
// ========================================

import { DatabaseService } from '../../src/services/database.service';

describe('Database Integration Tests', () => {
  let databaseService: DatabaseService;
  const DATABASE_URL = 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway';

  beforeEach(() => {
    databaseService = new DatabaseService(DATABASE_URL);
  });

  afterEach(async () => {
    await databaseService.disconnect();
  });

  test('should connect to database successfully', async () => {
    await expect(databaseService.connect()).resolves.not.toThrow();
  });

  test('should perform health check', async () => {
    const isHealthy = await databaseService.healthCheck();
    expect(isHealthy).toBe(true);
  });

  test('should execute simple query', async () => {
    const result = await databaseService.query('SELECT NOW() as current_time');
    expect(result.rows.length).toBe(1);
    expect(result.rows[0].current_time).toBeDefined();
  });

  test('should handle transactions', async () => {
    const queries = [
      { text: 'SELECT 1 as test1' },
      { text: 'SELECT 2 as test2' }
    ];
    
    const results = await databaseService.transaction(queries);
    expect(results.length).toBe(2);
    expect(results[0].rows[0].test1).toBe(1);
    expect(results[1].rows[0].test2).toBe(2);
  });

  test('should get table statistics', async () => {
    const stats = await databaseService.getTableStats();
    expect(Array.isArray(stats)).toBe(true);
    expect(stats.length).toBeGreaterThan(0);
  });
});
