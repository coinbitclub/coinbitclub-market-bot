import axios from 'axios';

const baseURL = 'http://localhost:3000';

async function testGET(path) {
  try {
    const res = await axios.get(baseURL + path);
    console.log(`GET ${path} - Sucesso:`, res.data);
  } catch (err) {
    console.error(`GET ${path} - Erro:`, err.response?.data || err.message);
  }
}

async function testPOST(path, payload) {
  try {
    const res = await axios.post(baseURL + path, payload);
    console.log(`POST ${path} - Sucesso:`, res.data);
  } catch (err) {
    console.error(`POST ${path} - Erro:`, err.response?.data || err.message);
  }
}

async function main() {
  console.log('--- Testando rotas GET públicas ---');
  await testGET('/api/market');
  await testGET('/api/dominance');
  await testGET('/api/feargreed');

  console.log('\n--- Testando webhooks POST (exemplo de payload) ---');
  await testPOST('/webhook/dominance', {
    timestamp: Date.now(),
    btc_dom: 50.5,
    eth_dom: 20.1,
    dominance: 70.6,
    ema7: 48.2,
    captured_at: new Date().toISOString()
  });

  await testPOST('/webhook/signal', {
    ticker: "BTCUSDT",
    time: new Date().toISOString(),
    close: 30000,
    ema9_30: 29500,
    rsi_4h: 60,
    rsi_15: 55,
    momentum_15: 0.8,
    atr_30: 500,
    atr_pct_30: 1.5,
    vol_30: 1000,
    vol_ma_30: 950,
    diff_btc_ema7: 0.5,
    cruzou_acima_ema9: true,
    cruzou_abaixo_ema9: false
  });
}

main();
