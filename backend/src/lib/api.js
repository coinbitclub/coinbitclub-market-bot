// src/api.js
const API_URL = import.meta.env.VITE_API_URL;
const TOKEN   = import.meta.env.VITE_WEBHOOK_TOKEN;

// health checks
export async function getStatus() {
  const res = await fetch(`${API_URL}/`);
  return res.text();
}

export async function getHealthz() {
  const res = await fetch(`${API_URL}/healthz`);
  return res.text();
}

// envia um sinal
export async function postSignal({ symbol, price, side }) {
  const res = await fetch(
    `${API_URL}/webhook/signal?token=${TOKEN}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, price, side })
    }
  );
  if (!res.ok) throw await res.json();
  return res.json();
}

// envia dominance
export async function postDominance({ btc_dom, eth_dom }) {
  const res = await fetch(
    `${API_URL}/webhook/dominance?token=${TOKEN}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ btc_dom, eth_dom })
    }
  );
  if (!res.ok) throw await res.json();
  return res.json();
}
