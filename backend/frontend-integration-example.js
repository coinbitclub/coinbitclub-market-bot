/**
 * Exemplo de Integração Frontend para Sistema de Recargas Flexíveis
 * Como usar a API de pagamentos no frontend
 */

// ===== CONFIGURAÇÕES =====
const API_BASE = 'http://localhost:3001/api/payments';
const MIN_AMOUNTS = {
  brasil: 100, // R$ 100
  internacional: 20 // USD$ 20
};

// ===== FUNÇÕES DE PAGAMENTO =====

/**
 * Criar checkout de recarga flexível
 */
async function createPrepaidCheckout(amount, currency = 'BRL') {
  try {
    const response = await fetch(`${API_BASE}/prepaid/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({
        amount: amount,
        currency: currency,
        success_url: `${window.location.origin}/payment/success`,
        cancel_url: `${window.location.origin}/payment/cancel`
      })
    });

    const data = await response.json();
    
    if (data.checkout_url) {
      // Redirecionar para Stripe Checkout
      window.location.href = data.checkout_url;
    } else {
      throw new Error(data.error || 'Erro ao criar checkout');
    }
  } catch (error) {
    console.error('Erro no checkout:', error);
    showError('Erro ao processar pagamento: ' + error.message);
  }
}

/**
 * Criar assinatura de plano
 */
async function createSubscriptionCheckout(planId) {
  try {
    const response = await fetch(`${API_BASE}/subscription/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({
        plan_id: planId,
        success_url: `${window.location.origin}/subscription/success`,
        cancel_url: `${window.location.origin}/subscription/cancel`
      })
    });

    const data = await response.json();
    
    if (data.checkout_url) {
      window.location.href = data.checkout_url;
    } else {
      throw new Error(data.error || 'Erro ao criar assinatura');
    }
  } catch (error) {
    console.error('Erro na assinatura:', error);
    showError('Erro ao processar assinatura: ' + error.message);
  }
}

/**
 * Solicitar saque
 */
async function requestWithdrawal(amount, method = 'pix', accountInfo = {}) {
  try {
    const response = await fetch(`${API_BASE}/withdrawal/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({
        amount: amount,
        method: method,
        account_info: accountInfo
      })
    });

    const data = await response.json();
    
    if (data.withdrawal_id) {
      showSuccess('Solicitação de saque enviada com sucesso!');
      return data;
    } else {
      throw new Error(data.error || 'Erro ao solicitar saque');
    }
  } catch (error) {
    console.error('Erro no saque:', error);
    showError('Erro ao solicitar saque: ' + error.message);
  }
}

// ===== COMPONENTES DO FRONTEND =====

/**
 * Componente de Recarga Flexível
 */
function createRechargeComponent() {
  return `
    <div class="recharge-container">
      <h3>💰 Recarga Flexível</h3>
      
      <div class="amount-input">
        <label for="recharge-amount">Valor da Recarga:</label>
        <div class="input-group">
          <select id="currency-select" onchange="updateMinAmount()">
            <option value="BRL">🇧🇷 Real (R$)</option>
            <option value="USD">🇺🇸 Dólar (USD$)</option>
          </select>
          <input 
            type="number" 
            id="recharge-amount" 
            placeholder="100.00"
            min="100"
            step="0.01"
            onchange="validateAmount()"
          >
        </div>
        <small id="min-amount-info">Valor mínimo: R$ 100,00</small>
      </div>
      
      <div class="actions">
        <button 
          id="recharge-btn" 
          onclick="handleRecharge()" 
          class="btn btn-primary"
        >
          💳 Fazer Recarga
        </button>
      </div>
    </div>
  `;
}

/**
 * Componente de Planos de Assinatura
 */
function createSubscriptionComponent() {
  return `
    <div class="subscription-container">
      <h3>📋 Planos de Assinatura</h3>
      
      <div class="plans-grid">
        <div class="plan-card" data-region="brasil">
          <h4>🇧🇷 Plano Brasil</h4>
          <div class="price">R$ 200/mês</div>
          <div class="commission">+ 10% comissão</div>
          <div class="alternative">OU 20% apenas comissão</div>
          <button onclick="selectPlan('brasil-monthly')" class="btn btn-outline">
            Escolher Plano
          </button>
        </div>
        
        <div class="plan-card" data-region="internacional">
          <h4>🌍 Plano Internacional</h4>
          <div class="price">USD$ 40/mês</div>
          <div class="commission">+ 10% comissão</div>
          <div class="alternative">OU 20% apenas comissão</div>
          <button onclick="selectPlan('internacional-monthly')" class="btn btn-outline">
            Escolher Plano
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Componente de Solicitação de Saque
 */
function createWithdrawalComponent() {
  return `
    <div class="withdrawal-container">
      <h3>💸 Solicitar Saque</h3>
      
      <div class="balance-info">
        <div class="balance-item">
          <span>Saldo Disponível:</span>
          <span id="available-balance">R$ 0,00</span>
        </div>
        <div class="balance-item">
          <span>Comissões Acumuladas:</span>
          <span id="commission-balance">R$ 0,00</span>
        </div>
      </div>
      
      <div class="withdrawal-form">
        <div class="input-group">
          <label for="withdrawal-amount">Valor do Saque:</label>
          <input 
            type="number" 
            id="withdrawal-amount" 
            placeholder="0.00"
            min="50"
            step="0.01"
          >
        </div>
        
        <div class="input-group">
          <label for="withdrawal-method">Método de Saque:</label>
          <select id="withdrawal-method" onchange="showAccountFields()">
            <option value="pix">🔵 PIX</option>
            <option value="bank_transfer">🏦 Transferência Bancária</option>
            <option value="paypal">💙 PayPal</option>
          </select>
        </div>
        
        <div id="account-fields"></div>
        
        <button onclick="handleWithdrawal()" class="btn btn-secondary">
          💸 Solicitar Saque
        </button>
      </div>
    </div>
  `;
}

// ===== FUNÇÕES DE CONTROLE =====

function updateMinAmount() {
  const currency = document.getElementById('currency-select').value;
  const amountInput = document.getElementById('recharge-amount');
  const infoText = document.getElementById('min-amount-info');
  
  if (currency === 'BRL') {
    amountInput.min = MIN_AMOUNTS.brasil;
    amountInput.placeholder = '100.00';
    infoText.textContent = 'Valor mínimo: R$ 100,00';
  } else {
    amountInput.min = MIN_AMOUNTS.internacional;
    amountInput.placeholder = '20.00';
    infoText.textContent = 'Valor mínimo: USD$ 20,00';
  }
}

function validateAmount() {
  const currency = document.getElementById('currency-select').value;
  const amount = parseFloat(document.getElementById('recharge-amount').value);
  const minAmount = currency === 'BRL' ? MIN_AMOUNTS.brasil : MIN_AMOUNTS.internacional;
  const btn = document.getElementById('recharge-btn');
  
  if (amount < minAmount) {
    btn.disabled = true;
    btn.textContent = `Valor mínimo: ${currency === 'BRL' ? 'R$' : 'USD$'} ${minAmount}`;
  } else {
    btn.disabled = false;
    btn.textContent = '💳 Fazer Recarga';
  }
}

function handleRecharge() {
  const currency = document.getElementById('currency-select').value;
  const amount = parseFloat(document.getElementById('recharge-amount').value);
  
  if (!amount || amount <= 0) {
    showError('Por favor, insira um valor válido');
    return;
  }
  
  createPrepaidCheckout(amount, currency);
}

function selectPlan(planId) {
  createSubscriptionCheckout(planId);
}

function showAccountFields() {
  const method = document.getElementById('withdrawal-method').value;
  const container = document.getElementById('account-fields');
  
  let fieldsHTML = '';
  
  switch (method) {
    case 'pix':
      fieldsHTML = `
        <div class="input-group">
          <label for="pix-key">Chave PIX:</label>
          <input type="text" id="pix-key" placeholder="CPF, e-mail ou telefone">
        </div>
      `;
      break;
    case 'bank_transfer':
      fieldsHTML = `
        <div class="input-group">
          <label for="bank-name">Banco:</label>
          <input type="text" id="bank-name" placeholder="Nome do banco">
        </div>
        <div class="input-group">
          <label for="account-number">Conta:</label>
          <input type="text" id="account-number" placeholder="Número da conta">
        </div>
        <div class="input-group">
          <label for="agency">Agência:</label>
          <input type="text" id="agency" placeholder="Agência">
        </div>
      `;
      break;
    case 'paypal':
      fieldsHTML = `
        <div class="input-group">
          <label for="paypal-email">E-mail PayPal:</label>
          <input type="email" id="paypal-email" placeholder="seu@email.com">
        </div>
      `;
      break;
  }
  
  container.innerHTML = fieldsHTML;
}

function handleWithdrawal() {
  const amount = parseFloat(document.getElementById('withdrawal-amount').value);
  const method = document.getElementById('withdrawal-method').value;
  
  if (!amount || amount < 50) {
    showError('Valor mínimo para saque é R$ 50,00');
    return;
  }
  
  let accountInfo = {};
  
  switch (method) {
    case 'pix':
      accountInfo.pix_key = document.getElementById('pix-key').value;
      break;
    case 'bank_transfer':
      accountInfo.bank_name = document.getElementById('bank-name').value;
      accountInfo.account_number = document.getElementById('account-number').value;
      accountInfo.agency = document.getElementById('agency').value;
      break;
    case 'paypal':
      accountInfo.paypal_email = document.getElementById('paypal-email').value;
      break;
  }
  
  requestWithdrawal(amount, method, accountInfo);
}

// ===== FUNÇÕES AUXILIARES =====

function getAuthToken() {
  return localStorage.getItem('auth_token') || '';
}

function showError(message) {
  // Implementar sistema de notificação de erro
  alert('❌ ' + message);
}

function showSuccess(message) {
  // Implementar sistema de notificação de sucesso
  alert('✅ ' + message);
}

// ===== INICIALIZAÇÃO =====

document.addEventListener('DOMContentLoaded', function() {
  // Inicializar componentes na página
  const rechargeContainer = document.getElementById('recharge-section');
  if (rechargeContainer) {
    rechargeContainer.innerHTML = createRechargeComponent();
  }
  
  const subscriptionContainer = document.getElementById('subscription-section');
  if (subscriptionContainer) {
    subscriptionContainer.innerHTML = createSubscriptionComponent();
  }
  
  const withdrawalContainer = document.getElementById('withdrawal-section');
  if (withdrawalContainer) {
    withdrawalContainer.innerHTML = createWithdrawalComponent();
  }
  
  // Atualizar informações de saldo
  updateBalanceInfo();
});

async function updateBalanceInfo() {
  try {
    const response = await fetch(`${API_BASE}/balance`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
    
    const data = await response.json();
    
    if (data.available_balance !== undefined) {
      document.getElementById('available-balance').textContent = 
        `R$ ${data.available_balance.toFixed(2)}`;
    }
    
    if (data.commission_balance !== undefined) {
      document.getElementById('commission-balance').textContent = 
        `R$ ${data.commission_balance.toFixed(2)}`;
    }
  } catch (error) {
    console.error('Erro ao buscar saldo:', error);
  }
}

// ===== EXPORT PARA MÓDULOS =====
export {
  createPrepaidCheckout,
  createSubscriptionCheckout,
  requestWithdrawal,
  updateBalanceInfo
};
