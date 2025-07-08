// testAllRoutes.js
import fetch from 'node-fetch';

// Configurações
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:8080'; // troque se estiver em produção
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'COINBITCLUB_SUPERADMIN_2024'; // troque pelo seu

// Dados de teste
const testUser = {
  nome: 'Usuário Teste',
  email: `teste_${Date.now()}@coinbitclub.com`,
  telefone_whatsapp: '5521987386645',
  senha_hash: 'hash_teste',
  is_teste: true,
};
const testSignal = {
  ticker: 'BTCUSDT',
  price: 68000,
  signal_json: { type: 'BUY', confidence: 88 },
  time: new Date().toISOString(),
};
const testDominance = { value: 54.6, captured_at: new Date().toISOString() };
const testFearGreed = { value: 72, time: new Date().toISOString() };

async function testRoute(name, method, path, opts = {}) {
  let url = BASE_URL + path;
  let options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (opts.body) options.body = JSON.stringify(opts.body);
  if (opts.authAdmin) options.headers['Authorization'] = `Bearer ${ADMIN_TOKEN}`;
  if (opts.query) url += '?' + new URLSearchParams(opts.query).toString();

  try {
    const res = await fetch(url, options);
    const json = await res.json().catch(() => ({}));
    console.log(
      `[${name}] [${method}] ${path} → ${res.status}`,
      json
    );
    return { res, json };
  } catch (err) {
    console.error(`[${name}] [${method}] ${path} ERRO`, err.message);
    return { err };
  }
}

(async () => {
  // 1. Healthz
  await testRoute('Health', 'GET', '/healthz');
  await testRoute('Root', 'GET', '/');

  // 2. Signals - POST
  await testRoute('Signal', 'POST', '/webhook/signal', { body: testSignal });

  // 3. Dominance - POST
  await testRoute('Dominance', 'POST', '/webhook/dominance', { body: testDominance });

  // 4. Fear/Greed - POST
  await testRoute('FearGreed', 'POST', '/api/fear_greed', {
    body: testFearGreed,
    authAdmin: true
  });

  // 5. GET market, dominance, fear_greed
  await testRoute('Market', 'GET', '/api/market');
  await testRoute('Dominance', 'GET', '/api/dominance');
  await testRoute('FearGreed', 'GET', '/api/fear_greed');

  // 6. Cadastro usuário - POST (se rota existir)
  await testRoute('Cadastro', 'POST', '/api/users', {
    body: testUser
  });

  // 7. Assinatura - POST (se rota existir)
  await testRoute('Subscription', 'POST', '/api/subscribe', {
    body: { user_id: 1, tipo_plano: 'mensal', valor_pago: 1 },
    authAdmin: true
  });

  // 8. Consulta operações
  await testRoute('Operações', 'GET', '/api/operations', { query: { user_id: 1 }, authAdmin: true });

  // 9. Painel admin (GET)
  await testRoute('Dashboard', 'GET', '/dashboard', { authAdmin: true });

  // 10. Testa envio WhatsApp via painel (ajuste a rota se necessário)
  await testRoute('WhatsApp', 'POST', '/api/send_whatsapp', {
    body: {
      user_id: 1,
      telefone: '5521987386645',
      mensagem: 'Mensagem automática de teste para WhatsApp 🚀'
    },
    authAdmin: true
  });

  console.log('\n✅ Testes concluídos. Verifique o banco, logs e WhatsApp para conferir resultados.');
  process.exit(0);
})();
