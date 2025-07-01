import axios from "axios";

// URLs para Testnet e Produção Bybit (use os endpoints reais do seu projeto!)
const BYBIT_PROD_API_URL = "https://api.bybit.com";
const BYBIT_TESTNET_API_URL = "https://api-testnet.bybit.com";

/**
 * Executa ordem Bybit (testnet ou produção) conforme parâmetros IA.
 * Recebe userId, sinal (objeto com symbol, side, etc), params IA (sizing, tp, sl, modo), e contexto do usuário (chaves).
 */
export async function executarOrdemBybit(userId, signal, iaParams, contexto) {
  const isProd = iaParams.modo === "producao";
  const apiUrl = isProd ? BYBIT_PROD_API_URL : BYBIT_TESTNET_API_URL;
  const apiKey = isProd ? contexto.bybit_prod_api_key : contexto.bybit_test_api_key;
  const apiSecret = isProd ? contexto.bybit_prod_api_secret : contexto.bybit_test_api_secret;

  // Monta payload conforme o padrão Bybit
  const payload = {
    symbol: signal.symbol,
    side: signal.side, // "Buy" ou "Sell"
    order_type: "Market",
    qty: calcularQtd(iaParams.sizing, contexto.saldo, signal.price),
    take_profit: iaParams.tp,
    stop_loss: iaParams.sl,
    time_in_force: "GoodTillCancel",
    reduce_only: false,
    close_on_trigger: false,
    // ... outros campos necessários
  };

  // Aqui é só exemplo: plugue sua autenticação real Bybit
  try {
    const result = await axios.post(`${apiUrl}/v5/order/create`, payload, {
      headers: {
        "X-BAPI-API-KEY": apiKey,
        // Outras headers Bybit, autenticação, timestamp, assinatura, etc
      }
      // Pode ser necessário assinar payload, dependendo do SDK usado!
    });
    return { status: "executado", modo: isProd ? "producao" : "testnet", result: result.data };
  } catch (err) {
    // Log, rethrow, ou tratativa do erro
    return { status: "erro", modo: isProd ? "producao" : "testnet", error: err.message };
  }
}

/**
 * Calcula quantidade baseada em sizing (% do saldo) e preço.
 */
function calcularQtd(sizing, saldo, price) {
  // Ex: sizing="8%", saldo=1000, price=65000
  const pct = typeof sizing === "string" && sizing.endsWith("%")
    ? parseFloat(sizing.replace("%", "")) / 100
    : parseFloat(sizing) / 100;
  const usd = saldo * pct;
  return (usd / price).toFixed(5); // Ajuste casas decimais conforme necessidade
}
