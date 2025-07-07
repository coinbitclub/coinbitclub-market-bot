/**
 * Valida payload de dominance.
 */
export function parseDominance(body) {
  const { btc_dom, eth_dom, timestamp } = body;

  if (
    (typeof btc_dom !== 'number' && typeof btc_dom !== 'string') ||
    (typeof eth_dom !== 'number' && typeof eth_dom !== 'string')
  ) {
    throw new Error('Invalid dominance payload');
  }

  const btc = typeof btc_dom === 'string' ? parseFloat(btc_dom) : btc_dom;
  const eth = typeof eth_dom === 'string' ? parseFloat(eth_dom) : eth_dom;
  if (Number.isNaN(btc) || Number.isNaN(eth)) {
    throw new Error('Invalid dominance payload');
  }

  return { btc_dom: btc, eth_dom: eth, timestamp };
}
