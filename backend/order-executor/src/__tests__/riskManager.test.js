import { jest } from '@jest/globals';

let dbMock;
jest.unstable_mockModule('../../../common/db.js', () => {
  dbMock = jest.fn();
  return { db: dbMock };
});

const { validateBalance, validateConcurrentOps, calculateQuantity } = await import('../riskManager.js');

describe('riskManager', () => {
  beforeEach(() => jest.clearAllMocks());

  test('validateBalance returns true when balance sufficient', async () => {
    const query = { where: jest.fn().mockReturnThis(), first: jest.fn().mockResolvedValue({ balance: 100 }) };
    dbMock.mockReturnValue(query);
    await expect(validateBalance(1, 50)).resolves.toBe(true);
  });

  test('validateConcurrentOps returns false when max reached', async () => {
    const query = { where: jest.fn().mockReturnThis(), count: jest.fn().mockReturnThis(), first: jest.fn().mockResolvedValue({ cnt: 3 }) };
    dbMock.mockReturnValue(query);
    await expect(validateConcurrentOps(1, 2)).resolves.toBe(false);
  });

  test('calculateQuantity multiplies balance', () => {
    expect(calculateQuantity(100, 0.5)).toBe(50);
  });
});
