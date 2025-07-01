import axios from "axios";
import crypto from "crypto";

const BYBIT_PROD_API_URL = "https://api.bybit.com";
const BYBIT_TESTNET_API_URL = "https://api-testnet.bybit.com";

// Função auxiliar para assinatura Bybit v5 (HMAC SHA256)
function signBybitRequest(apiSecret, params = {}) {
  // Bybit exige string query em ordem alfabética dos campos + timestamp, recvWindow
  const sorted = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
  return crypto.createHmac("sha256", apiSecret).update(sorted).digest("hex");
}

// FECHAR POSIÇÃO BYBIT (GLOBAL ADMIN)
export async function closeBybitOrder({ apiKey, apiSecret, isTestnet, symbol, side, qty }) {
  const apiUrl = isTestnet ? BYBIT_TESTNET_API_URL : BYBIT_PROD_API_URL;
  const closeSide = side === "Buy" ? "Sell" : "Buy";
  const timestamp = Date.now();
  const params = {
    category: "linear",              // Linear perpetual (ajuste se for inverse)
    symbol,
    side: closeSide,
    orderType: "Market",
    qty,
    reduceOnly: true,
    timeInForce: "GoodTillCancel",
    closeOnTrigger: false,
    recvWindow: 5000,
    timestamp
  };

  // Gera a assinatura
  const sign = signBybitRequest(apiSecret, params);

  try {
    const result = await axios.post(`${apiUrl}/v5/order/create`, params, {
      headers: {
        "X-BAPI-API-KEY": apiKey,
        "X-BAPI-SIGN": sign,
        "X-BAPI-TIMESTAMP": timestamp,
        "X-BAPI-RECV-WINDOW": "5000",
        "Content-Type": "application/json"
      }
    });
    return { status: "executado", result: result.data };
  } catch (err) {
    return { status: "erro", error: err.response?.data || err.message };
  }
}
