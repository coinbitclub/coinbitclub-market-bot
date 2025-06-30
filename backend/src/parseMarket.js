/**
 * @param {Object} body — { symbol, price, timestamp }
 * @returns {{ symbol: string, price: number, timestamp: Date }}
 */
export function parseMarket(body) {
  const { symbol, price, timestamp } = body;
  if (!symbol || price == null || !timestamp) {
    throw new Error('symbol, price and timestamp are required');
  }
  return {
    symbol: String(symbol),
    price: Number(price),
    timestamp: new Date(timestamp)
  };
}
