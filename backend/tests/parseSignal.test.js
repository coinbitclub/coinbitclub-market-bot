/**
 * Valida e extrai os campos de um payload de sinal.
 */
export function parseSignal(body) {
  const { symbol, price, side, timestamp } = body;

  if (
    typeof symbol !== 'string' ||
    (typeof price !== 'string' && typeof price !== 'number') ||
    typeof side !== 'string'
  ) {
    throw new Error('Invalid signal payload');
  }

  const priceNum = typeof price === 'string' ? parseFloat(price) : price;
  if (Number.isNaN(priceNum)) {
    throw new Error('Invalid signal payload');
  }

  return { symbol, price: priceNum, side, timestamp };
}
