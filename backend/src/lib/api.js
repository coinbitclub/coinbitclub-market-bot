// src/api.js
const API_URL = import.meta.env.VITE_API_URL
const TOKEN   = import.meta.env.VITE_WEBHOOK_TOKEN

/**
 * GET /
 */
export async function status() {
  const res = await fetch(`${API_URL}/`)
  return res.text()  // "🚀 Bot ativo!"
}

/**
 * GET /healthz
 */
export async function healthz() {
  const res = await fetch(`${API_URL}/healthz`)
  return res.text()  // "OK"
}

/**
 * POST /webhook/signal
 * @param {{ symbol: string, price: number, side: 'buy'|'sell' }} data
 */
export async function sendSignal(data) {
  const res = await fetch(
    `${API_URL}/webhook/signal?token=${TOKEN}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data)
    }
  )
  if (!res.ok) throw await res.json()
  return res.json()  // { ok: true, id: number }
}

/**
 * POST /webhook/dominance
 * @param {{ btc_dom: number, eth_dom: number }} data
 */
export async function sendDominance(data) {
  const res = await fetch(
    `${API_URL}/webhook/dominance?token=${TOKEN}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data)
    }
  )
  if (!res.ok) throw await res.json()
  return res.json()
}
