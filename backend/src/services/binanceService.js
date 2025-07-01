import axios from "axios";

// URLs para Testnet e Produção Binance
const BINANCE_PROD_API_URL = "https://api.binance.com";
const BINANCE_TESTNET_API_URL = "https://testnet.binancefuture.com";

/**
 * Executa ordem Binance (testnet ou produção) conforme parâmetros IA.
 * Recebe userId, sinal, params IA (sizing, tp, sl, modo), e contexto do usuário (chaves).
 */
export async function executarOrdemBinance(userId, signal, iaParams, contexto) {
  const isProd = iaParams.modo === "producao";
  const apiUrl = isProd ? BINANCE_PROD_API_URL : BINANCE_TESTNET_API_URL;
  const apiKey = isProd ? contexto.binance_prod_api_key : contexto.binance_test_api_key;
  const apiSecret = isProd ? contexto.binance_prod_api_secret : contexto.binance_test_api_secret;

  // Monta payload conforme o padrão Binance Futures
  const payload = {
    symbol: signal.symbol,
    side: signal.side.toUpperCase(), // "BUY" ou "SELL"
    type: "MARKET",
    quantity: calcularQtd(iaParams.sizing, contexto.saldo, signal.price),
    // Outros campos TP/SL podem exigir ordens OCO, ajusta conforme o caso real!
    // ...
  };

  try {
    const result = await axios.post(`${apiUrl}/fapi/v1/order`, payload, {
      headers: {
        "X-MBX-APIKEY": apiKey,
        // Pode precisar de assinatura/timestamp
      }
    });
    return { status: "executado", modo: isProd ? "producao" : "testnet", result: result.data };
  } catch (err) {
    return { status: "erro", modo: isProd ? "producao" : "testnet", error: err.message };
  }
}

function calcularQtd(sizing, saldo, price) {
  const pct = typeof sizing === "string" && sizing.endsWith("%")
    ? parseFloat(sizing.replace("%", "")) / 100
    : parseFloat(sizing) / 100;
  const usd = saldo * pct;
  return (usd / price).toFixed(4); // Ajuste casas decimais
}
