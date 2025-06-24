import axios from 'axios';

const baseURL = 'http://localhost:3000';
const token = '210406'; // ajuste se seu token for diferente

const testData = {
  dominance: {
    ticker: "BTC.D",
    time: "2025-06-21T10:00:00Z",
    btc_dom: 62.34,
    ema_7: 61.90,
    diff_pct: 0.72,
    sinal: "LONG"
  },
  signal: {
    ticker: "BTCUSDT",
    time: "2025-06-21T10:00:00Z",
    close: 30000,
    ema9_30: 29500,
    rsi_4h: 55,
    rsi_15: 60,
    momentum_15: 0.7,
    atr_30: 150,
    atr_pct_30: 0.5,
    vol_30: 1200,
    vol_ma_30: 1100,
    diff_btc_ema7: 1.2,
    cruzou_acima_ema9: 1,
    cruzou_abaixo_ema9: 0
  },
  extra: {
    metric1: 123,
    metric2: 456,
    timestamp: "2025-06-21T10:00:00Z"
  }
};

async function testGetRoute(route) {
  try {
    const res = await axios.get(baseURL + route);
    console.log("GET " + route + " - Sucesso:", res.data);
  } catch (err) {
    console.error("GET " + route + " - Erro:", err.response?.data || err.message);
  }
}

async function testPostWebhook(route, data) {
  try {
    const url = baseURL + "/webhook/" + route + "?token=" + token;
    const res = await axios.post(url, data, { headers: { 'Content-Type': 'application/json' } });
    console.log("POST /webhook/" + route + " - Sucesso:", res.data);
  } catch (err) {
    console.error("POST /webhook/" + route + " - Erro:", err.response?.data || err.message);
  }
}

(async () => {
  console.log('--- Testando rotas GET públicas ---');
  await testGetRoute('/api/marketcap');
  await testGetRoute('/api/dominance');
  await testGetRoute('/api/feargreed');
  await testGetRoute('/api/volatility');
  await testGetRoute('/api/feargreed2');
  await testGetRoute('/api/extra');

  console.log('\n--- Testando webhooks POST (salvamento de dados) ---');
  await testPostWebhook('dominance', testData.dominance);
  await testPostWebhook('signal', testData.signal);
  await testPostWebhook('extra', testData.extra);

  console.log('\nTestes finalizados.');
})();
