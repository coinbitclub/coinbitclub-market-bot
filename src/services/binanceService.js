import axios from "axios";
import crypto from "crypto";

const BINANCE_PROD_API_URL = "https://fapi.binance.com";
const BINANCE_TESTNET_API_URL = "https://testnet.binancefuture.com";

// Função auxiliar para assinatura Binance Futures (HMAC SHA256)
function signBinanceRequest(apiSecret, params = {}) {
  const query = Object.keys(params).map(k => `${k}=${params[k]}`).join('&');
  return crypto.createHmac("sha256", apiSecret).update(query).digest("hex");
}

// FECHAR POSIÇÃO BINANCE (GLOBAL ADMIN)
export async function closeBinanceOrder({ apiKey, apiSecret, symbol, side, qty, isTestnet = false }) {
  const apiUrl = isTestnet ? BINANCE_TESTNET_API_URL : BINANCE_PROD_API_URL;
  const closeSide = side === "BUY" ? "SELL" : "BUY";
  const timestamp = Date.now();

  // Monta payload (Binance exige params em query string)
  const params = {
    symbol,
    side: closeSide,
    type: "MARKET",
    quantity: qty,
    reduceOnly: "true",
    timestamp
  };
  const signature = signBinanceRequest(apiSecret, params);

  const queryString = Object.keys(params).map(k => `${k}=${encodeURIComponent(params[k])}`).join("&") + `&signature=${signature}`;

  try {
    const result = await axios.post(
      `${apiUrl}/fapi/v1/order?${queryString}`,
      null, // POST vazio, params na query
      {
        headers: {
          "X-MBX-APIKEY": apiKey
        }
      }
    );
    return { status: "executado", result: result.data };
  } catch (err) {
    return { status: "erro", error: err.response?.data || err.message };
  }
}
