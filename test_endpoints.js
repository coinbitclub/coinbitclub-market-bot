import fetch from "node-fetch";

const base = "http://localhost:3000";
const token = "210406";

async function main() {
  try {
    console.log("==> POST /webhook/signal");
    let res = await fetch(`${base}/webhook/signal?token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker: "BTCUSDT", time: "2025-06-22T23:00:00Z", close: 33500 }),
    });
    console.log(await res.json());

    console.log("\\n==> POST /webhook/dominance");
    res = await fetch(`${base}/webhook/dominance?token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timestamp: "2025-06-22T23:00:00Z", btc_dom: 48.1, eth_dom: 18.9 }),
    });
    console.log(await res.json());

    console.log("\\n==> GET /api/market?limit=5");
    res = await fetch(`${base}/api/market?limit=5`);
    console.table(await res.json());

    console.log("\\n==> GET /api/dominance?period=24h");
    res = await fetch(`${base}/api/dominance?period=24h`);
    console.table(await res.json());

    console.log("\\n==> GET /api/fear-greed");
    res = await fetch(`${base}/api/fear-greed`);
    console.log(await res.json());
  } catch (err) {
    console.error(err);
  }
}

main();
