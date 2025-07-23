import { evaluate } from '../backend/decision-engine/src/rulesEngine.js';

describe('rulesEngine', () => {
  test('returns buy decision', () => {
    const result = evaluate({ type: 'BUY' });
    expect(result).toEqual({ action: 'BUY', quantity: 1 });
  });

  test('returns null when no rule matched', () => {
    expect(evaluate({ type: 'HOLD' })).toBeNull();
  });
});
