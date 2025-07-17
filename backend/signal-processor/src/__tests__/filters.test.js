import { filterByTimeWindow, filterByFearGreed, filterByDominanceDiff } from '../filters.js';

describe('filters', () => {
  test('filterByTimeWindow true for recent timestamp', () => {
    const sig = { timestamp: Date.now() };
    expect(filterByTimeWindow(sig, 1)).toBe(true);
  });

  test('filterByFearGreed works with range', () => {
    expect(filterByFearGreed(50, 40, 60)).toBe(true);
    expect(filterByFearGreed(70, 40, 60)).toBe(false);
  });

  test('filterByDominanceDiff compares threshold', () => {
    expect(filterByDominanceDiff(0.5, 0.3)).toBe(true);
    expect(filterByDominanceDiff(0.1, 0.3)).toBe(false);
  });
});
