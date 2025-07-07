import { parseSignal } from '../src/services/parseSignal.js';

describe('parseSignal util', () => {
  it('deve extrair corretamente symbol, price e side', () => {
    const body = {
      symbol: 'ETHUSDT',
      price: '2000.50',
      side: 'sell',
      extra: 'ignored'
    };
    const parsed = parseSignal(body);
    expect(parsed).toEqual({
      symbol: 'ETHUSDT',
      price: 2000.50,
      side: 'sell'
    });
  });

  it('lança erro se faltar campo obrigatório', () => {
    expect(() => parseSignal({ price: 1 })).toThrow('Invalid signal payload');
  });
});
