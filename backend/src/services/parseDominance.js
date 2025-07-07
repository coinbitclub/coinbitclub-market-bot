/**
 * Valida e extrai os campos de um payload de dominance.
 * @param {object} body
 * @returns {{ btc_dom: number, eth_dom: number, timestamp?: string }}
 * @throws {{status:400, message:string}} se payload inválido
 */
export function parseDominance(body) {
  const { btc_dom, eth_dom, timestamp } = body;

  if (
    (typeof btc_dom !== "string" && typeof btc_dom !== "number") ||
    (typeof eth_dom !== "string" && typeof eth_dom !== "number")
  ) {
    const err = new Error("Invalid dominance payload");
    err.status = 400;
    throw err;
  }

  const btc = typeof btc_dom === "string" ? parseFloat(btc_dom) : btc_dom;
  const eth = typeof eth_dom === "string" ? parseFloat(eth_dom) : eth_dom;
  if (Number.isNaN(btc) || Number.isNaN(eth)) {
    const err = new Error("Invalid dominance payload");
    err.status = 400;
    throw err;
  }

  return { btc_dom: btc, eth_dom: eth, timestamp };
}
