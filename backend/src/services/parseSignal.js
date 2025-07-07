/**
 * Valida e extrai os campos de um payload de sinal.
 * @param {object} body
 * @returns {{ symbol: string, price: number, side: string, timestamp?: string }}
 * @throws {{status:400, message:string}} se payload inválido
 */
export function parseSignal(body) {
  const { symbol, price, side, timestamp } = body;

  if (
    typeof symbol !== "string" ||
    (typeof price !== "string" && typeof price !== "number") ||
    typeof side !== "string"
  ) {
    const err = new Error("Invalid signal payload");
    err.status = 400;
    throw err;
  }

  const priceNum = typeof price === "string" ? parseFloat(price) : price;
  if (Number.isNaN(priceNum)) {
    const err = new Error("Invalid signal payload");
    err.status = 400;
    throw err;
  }

  return { symbol, price: priceNum, side, timestamp };
}
