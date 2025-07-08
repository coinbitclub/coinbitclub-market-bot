// tests/parseSignal.test.js
import { parseSignal } from '../src/services/parseSignal.js';

describe('parseSignal util', () => {
  it('deve extrair corretamente symbol, price e side', () => {
    const body = { symbol: 'BTCUSDT', price: '45000.5', side: 'buy' };
    const result = parseSignal(body);
    expect(result).toEqual({
      symbol: 'BTCUSDT',
      price: 45000.5,
      side:  'buy'
    });
  });

  it('deve lançar erro se faltar campo ou price inválido', () => {
    expect(() => parseSignal({})).toThrow('Invalid signal payload');
    expect(() => parseSignal({ symbol: 'BTC', price: 'NaN', side: 'buy' }))
      .toThrow('Invalid signal payload');
  });
});
