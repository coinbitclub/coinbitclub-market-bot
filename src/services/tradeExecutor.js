import { executarOrdemBybit } from "./bybitService.js";
import { executarOrdemBinance } from "./binanceService.js";
// ...

export async function executarTrade(userId, signal, contexto, exchange, iaParams) {
  // iaParams já vem da IA: { sizing, tp, sl, modo, ... }
  let resultado;
  if (exchange === "bybit") {
    resultado = await executarOrdemBybit(userId, signal, iaParams, contexto);
  } else if (exchange === "binance") {
    resultado = await executarOrdemBinance(userId, signal, iaParams, contexto);
  }
  // Salva logs, resultado, etc
  return resultado;
}
