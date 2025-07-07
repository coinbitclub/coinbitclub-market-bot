const API   = import.meta.env.VITE_API_BASE_URL;
const TOKEN = import.meta.env.VITE_WEBHOOK_TOKEN;

// Autenticação
export async function login(email, password) {
  const res = await fetch(`${API}/api/user/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return res.json();
}

// Puxar dashboard (Basic Auth) — ou adaptar para JWT
export async function fetchDashboard(authHeader) {
  return fetch(`${API}/dashboard`, { headers: { Authorization: authHeader } })
    .then(r => r.json());
}

// Webhooks
export async function sendSignal(payload) {
  return fetch(`${API}/webhook/signal?token=${TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(r => r.json());
}

export async function sendDominance(payload) {
  return fetch(`${API}/webhook/dominance?token=${TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(r => r.json());
}

// Outros endpoints (plans, operations, orders etc.) seguem o mesmo padrão
