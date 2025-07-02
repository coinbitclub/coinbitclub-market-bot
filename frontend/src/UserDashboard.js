const API_BASE_USER = "https://market-bot-production-8c91.up.railway.app/api/user";

// Token helpers
function getToken() {
  return localStorage.getItem("user_token") || "";
}
function setToken(t) {
  localStorage.setItem("user_token", t);
}
function logoutUser() {
  localStorage.removeItem("user_token");
  renderLogin();
}

// API fetch wrapper
async function apiFetchUser(path, options = {}) {
  const token = getToken();
  options.headers = options.headers || {};
  if (token) options.headers["Authorization"] = "Bearer " + token;
  options.headers["Content-Type"] = "application/json";
  options.method = options.method || "GET";
  const resp = await fetch(API_BASE_USER + path, options);
  if (resp.status === 401) {
    logoutUser();
    throw new Error("Sessão expirada, faça login novamente.");
  }
  if (!resp.ok) {
    let err = {};
    try { err = await resp.json(); } catch {}
    throw new Error(err.error || "Erro desconhecido");
  }
  return await resp.json();
}

// Login Simples
function renderLogin() {
  document.body.innerHTML = `
    <div style="max-width:380px;margin:40px auto;padding:20px;background:#222;color:#fff;border-radius:10px;">
      <h2>Login Usuário</h2>
      <input id="login_email" type="email" placeholder="Email" style="width:100%;margin-bottom:12px;padding:8px;" />
      <button id="login_btn" style="width:100%;padding:10px;background:#ffd700;border:none;color:#111;font-weight:bold;cursor:pointer;">Entrar</button>
      <div id="login_error" style="color:#f33;margin-top:12px;display:none;"></div>
    </div>
  `;
  document.getElementById("login_btn").onclick = async () => {
    const email = document.getElementById("login_email").value.trim();
    if (!email) return showLoginError("Informe seu email.");
    try {
      const resp = await fetch(`${API_BASE_USER}/login`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ email })
      });
      if (!resp.ok) throw new Error("Email não cadastrado.");
      const data = await resp.json();
      setToken(data.token);
      renderUserDashboard();
    } catch (e) {
      showLoginError(e.message);
    }
  };
  function showLoginError(msg) {
    const el = document.getElementById("login_error");
    el.innerText = msg;
    el.style.display = "block";
  }
}

// Renderiza o dashboard e as abas do usuário
async function renderUserDashboard() {
  document.body.innerHTML = `
    <nav style="background:#232632;padding:10px;color:#ffd700;display:flex;justify-content:space-between;align-items:center;">
      <div><strong>Área do Usuário CoinbitClub</strong></div>
      <button id="logoutUserBtn" style="background:#ffd700;color:#222;padding:6px 14px;border:none;cursor:pointer;">Sair</button>
    </nav>
    <div style="max-width:980px;margin:20px auto;padding:0 20px;color:#eee;">
      <div id="tabs" style="display:flex;gap:20px;cursor:pointer;">
        <div data-tab="dashboard" class="tab active" style="border-bottom:2px solid #ffd700;padding-bottom:6px;">Dashboard</div>
        <div data-tab="historico" class="tab" style="padding-bottom:6px;">Histórico</div>
        <div data-tab="planos" class="tab" style="padding-bottom:6px;">Planos</div>
        <div data-tab="financeiro" class="tab" style="padding-bottom:6px;">Financeiro</div>
        <div data-tab="ajuda" class="tab" style="padding-bottom:6px;">Ajuda</div>
        <div data-tab="api" class="tab" style="padding-bottom:6px;">Chaves API</div>
      </div>
      <div id="content" style="margin-top:24px;min-height:400px;"></div>
    </div>
  `;
  document.getElementById("logoutUserBtn").onclick = logoutUser;
  document.querySelectorAll("#tabs .tab").forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll("#tabs .tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      renderTabContent(tab.getAttribute("data-tab"));
    };
  });
  await renderTabContent("dashboard");
}

// Conteúdo de cada aba
async function renderTabContent(tab) {
  const content = document.getElementById("content");
  switch(tab) {
    case "dashboard":
      content.innerHTML = `<h2>Carregando dashboard...</h2>`;
      try {
        const data = await apiFetchUser("/dashboard");
        content.innerHTML = `
          <h2>Bem vindo, ${data.user.nome || data.user.email}</h2>
          <p><strong>Acertividade hoje:</strong> ${data.acertividade_dia || "0"}%</p>
          <p><strong>Acertividade histórica:</strong> ${data.acertividade_historica || "0"}%</p>
          <p><strong>Saldo pré-pago:</strong> ${data.saldo_pre_pago || 0}</p>
          <p><strong>Operações em andamento:</strong> ${data.operacoes_andamento || 0}</p>
          <p><strong>Operações fechadas hoje:</strong> ${data.operacoes_fechadas_hoje || 0}</p>
          <p><strong>Resultados (dia/histórico):</strong> ${data.resultado_dia || 0}% / ${data.resultado_historico || 0}%</p>
        `;
      } catch(e) {
        content.innerHTML = `<p style="color:#f33;">Erro ao carregar dashboard: ${e.message}</p>`;
      }
      break;
    case "historico":
      content.innerHTML = "<h2>Histórico de Operações (carregando...)</h2>";
      try {
        const ops = await apiFetchUser("/operations");
        if (!ops.length) { content.innerHTML = "<p>Nenhuma operação encontrada.</p>"; break; }
        content.innerHTML = `
          <table style="width:100%;border-collapse:collapse;color:#eee;">
            <thead>
              <tr><th>ID</th><th>Ticker</th><th>Side</th><th>Entrada</th><th>Saída</th><th>Resultado</th><th>Data</th></tr>
            </thead>
            <tbody>
              ${ops.map(op => `
                <tr>
                  <td>${op.id}</td>
                  <td>${op.symbol}</td>
                  <td>${op.side}</td>
                  <td>${op.entry_price}</td>
                  <td>${op.exit_price}</td>
                  <td>${op.pnl}</td>
                  <td>${new Date(op.created_at).toLocaleString()}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        `;
      } catch(e) {
        content.innerHTML = `<p style="color:#f33;">Erro ao carregar histórico: ${e.message}</p>`;
      }
      break;
    case "planos":
      content.innerHTML = "<h2>Planos disponíveis (carregando...)</h2>";
      try {
        const planos = await apiFetchUser("/plans");
        if (!planos.length) { content.innerHTML = "<p>Nenhum plano disponível.</p>"; break; }
        content.innerHTML = planos.map(p => `
          <div style="background:#333;padding:10px;margin-bottom:10px;border-radius:8px;">
            <h3>${p.nome}</h3>
            <p>${p.descricao || ""}</p>
            <p><strong>Valor:</strong> ${p.valor_mensalidade || p.valor} ${p.moeda}</p>
            <p><strong>Comissão:</strong> ${p.percentual_comissao || p.comissao}%</p>
            <button onclick="assinarPlano(${p.id})">Assinar</button>
          </div>
        `).join("");
      } catch(e) {
        content.innerHTML = `<p style="color:#f33;">Erro ao carregar planos: ${e.message}</p>`;
      }
      break;
    case "financeiro":
      content.innerHTML = "<h2>Financeiro (carregando...)</h2>";
      try {
        const fin = await apiFetchUser("/financial");
        if (!fin.movimentos || fin.movimentos.length === 0) {
          content.innerHTML = "<p>Nenhum movimento financeiro registrado.</p>";
          break;
        }
        content.innerHTML = `
          <p><strong>Saldo Atual:</strong> ${fin.saldo_atual || 0}</p>
          <table style="width:100%;border-collapse:collapse;color:#eee;">
            <thead>
              <tr><th>Data</th><th>Tipo</th><th>Descrição</th><th>Valor</th><th>Saldo Após</th></tr>
            </thead>
            <tbody>
              ${fin.movimentos.map(mv => `
                <tr>
                  <td>${new Date(mv.data).toLocaleString()}</td>
                  <td>${mv.tipo_movimento}</td>
                  <td>${mv.descricao}</td>
                  <td>${mv.valor}</td>
                  <td>${mv.saldo_apos}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        `;
      } catch(e) {
        content.innerHTML = `<p style="color:#f33;">Erro ao carregar financeiro: ${e.message}</p>`;
      }
      break;
    case "ajuda":
      content.innerHTML = `
        <h2>Ajuda & Tutoriais</h2>
        <p>Links para vídeos e materiais de suporte:</p>
        <ul>
          <li><a href="https://youtube.com/playlist?list=XYZ" target="_blank">Vídeos Tutoriais</a></li>
          <li><a href="https://faq.coinbitclub.com" target="_blank">FAQ</a></li>
        </ul>
      `;
      break;
    case "api":
      content.innerHTML = `
        <h2>Gerenciar Chaves API</h2>
        <p>Insira suas chaves testnet para Bybit e Binance.</p>
        <form id="apiKeysForm">
          <label>Bybit Testnet API Key:</label>
          <input type="text" id="bybit_test_key" style="width:100%;margin-bottom:10px;" />
          <label>Bybit Testnet API Secret:</label>
          <input type="text" id="bybit_test_secret" style="width:100%;margin-bottom:10px;" />
          <label>Binance Testnet API Key:</label>
          <input type="text" id="binance_test_key" style="width:100%;margin-bottom:10px;" />
          <label>Binance Testnet API Secret:</label>
          <input type="text" id="binance_test_secret" style="width:100%;margin-bottom:10px;" />
          <button type="submit" style="margin-top:10px;padding:10px;background:#ffd700;border:none;cursor:pointer;">Salvar</button>
        </form>
        <div id="apiKeysMsg" style="margin-top:12px;"></div>
      `;
      try {
        const keys = await apiFetchUser("/credentials");
        if (keys) {
          document.getElementById("bybit_test_key").value = keys.bybit_api_key || "";
          document.getElementById("bybit_test_secret").value = keys.bybit_api_secret || "";
          document.getElementById("binance_test_key").value = keys.binance_api_key || "";
          document.getElementById("binance_test_secret").value = keys.binance_api_secret || "";
        }
      } catch {}
      document.getElementById("apiKeysForm").onsubmit = async e => {
        e.preventDefault();
        const data = {
          bybit_api_key: document.getElementById("bybit_test_key").value.trim(),
          bybit_api_secret: document.getElementById("bybit_test_secret").value.trim(),
          binance_api_key: document.getElementById("binance_test_key").value.trim(),
          binance_api_secret: document.getElementById("binance_test_secret").value.trim(),
        };
        try {
          await apiFetchUser("/credentials", { method: "POST", body: JSON.stringify(data) });
          document.getElementById("apiKeysMsg").innerText = "Chaves salvas com sucesso!";
        } catch (e) {
          document.getElementById("apiKeysMsg").innerText = "Erro ao salvar: " + e.message;
        }
      };
      break;
    default:
      content.innerHTML = "<p>Aba inválida.</p>";
  }
}

// Assinar Plano (Stripe backend)
window.assinarPlano = async function(planId) {
  try {
    const data = await apiFetchUser(`/subscribe`, {
      method: "POST",
      body: JSON.stringify({ planId })
    });
    if (data.checkout_url) {
      window.location.href = data.checkout_url;
    } else {
      alert("Plano ativado ou em teste. Contate suporte se necessário.");
    }
  } catch (e) {
    alert("Erro ao assinar plano: " + e.message);
  }
}

// Inicialização automática
if (getToken()) {
  renderUserDashboard();
} else {
  renderLogin();
}

window.logoutUser = logoutUser;
