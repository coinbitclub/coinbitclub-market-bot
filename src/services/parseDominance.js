/**
 * Valida e extrai os campos de um payload de dominance.
 * @param {object} body
 * @returns {{ btc_dom: number, eth_dom: number }}
 * @throws {Error} 'Invalid dominance payload'
 */
export function parseDominance(body) {
  const { btc_dom, eth_dom } = body;

  // Validação dos tipos de dados
  if ((typeof btc_dom !== 'string' && typeof btc_dom !== 'number') ||
      (typeof eth_dom !== 'string' && typeof eth_dom !== 'number')) {
    throw new Error('Invalid dominance payload');
  }

  // Conversão para número caso os valores sejam strings
  const btc = typeof btc_dom === 'string' ? parseFloat(btc_dom) : btc_dom;
  const eth = typeof eth_dom === 'string' ? parseFloat(eth_dom) : eth_dom;

  // Verifica se a conversão resultou em valores válidos
  if (Number.isNaN(btc) || Number.isNaN(eth)) {
    throw new Error('Invalid dominance payload');
  }

  // Retorna o objeto com os valores convertidos
  return { btc_dom: btc, eth_dom: eth };
}
