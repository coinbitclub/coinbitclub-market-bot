export function evaluate(signal) {
  if (signal.type === 'BUY') return { action: 'BUY', quantity: 1 };
  if (signal.type === 'SELL') return { action: 'SELL', quantity: 1 };
  return null;
}
