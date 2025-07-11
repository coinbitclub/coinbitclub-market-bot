/**
 * Valida e extrai os campos de um payload de sinal.
 * @param {object} body
 * @returns {{ symbol: string, price: number, side: string }}
 * @throws {Error} 'Invalid signal payload'
 */
export function parseSignal(body) {
  const { symbol, price, side } = body;

  // Validação dos campos: symbol (string), price (número ou string convertido) e side (string)
  if (typeof symbol !== 'string' ||
      (typeof price !== 'string' && typeof price !== 'number') ||
      typeof side !== 'string') {
    throw new Error('Invalid signal payload');
  }

  // Conversão de 'price' para número, se for uma string
  const priceNum = typeof price === 'string' ? parseFloat(price) : price;

  // Verifica se 'price' é um número válido
  if (Number.isNaN(priceNum)) {
    throw new Error('Invalid signal payload');
  }

  // Retorna o objeto com os valores extraídos e validados
  return { symbol, price: priceNum, side };
}
