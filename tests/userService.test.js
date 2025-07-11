import { getOperations } from '../src/services/userService.js';
import { pool } from '../src/services/db.js';

jest.mock('../src/services/db.js', () => ({
  pool: { query: jest.fn() }
}));

describe('UserService', () => {
  it('getOperations deve chamar pool.query e devolver rows', async () => {
    const fakeRows = [{ id:1, symbol:'BTCUSDT', side:'BUY', price:'100', quantity:0.1, created_at:'now' }];
    pool.query.mockResolvedValue({ rows: fakeRows });
    const result = await getOperations(42);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('FROM operations'),
      [42]
    );
    expect(result).toBe(fakeRows);
  });
});
