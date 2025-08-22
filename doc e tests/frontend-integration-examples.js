// ========================================
// MARKETBOT FRONTEND - EXEMPLOS PRÁTICOS
// Implementação completa dos sistemas financeiros
// ========================================

// ========================================
// 1. CONFIGURAÇÃO INICIAL
// ========================================

const MARKETBOT_CONFIG = {
  apiBase: 'https://marketbot.ngrok.app/api/v1',
  stripeLinks: {
    proBrasil: 'https://buy.stripe.com/28o0329eAdOA2Gccyz',
    proGlobal: 'https://buy.stripe.com/28o032bgC5gc1CY98B',
    recharge: {
      brasil: {
        150: 'https://buy.stripe.com/bIY0005YofiScPW9CD',
        500: 'https://buy.stripe.com/fZe9Cd1GubGsbLS6oC'
      },
      global: {
        30: 'https://buy.stripe.com/14k8Adbwg9YU7tk9CF',
        100: 'https://buy.stripe.com/cN2aGJ3aQ8UQbLSdQU'
      }
    }
  },
  coupons: {
    discount: ['WELCOME10', 'PROMO20', 'VIP25'],
    credit: ['CREDIT250BRL', 'CREDIT50USD']
  }
};

// ========================================
// 2. SERVIÇOS DE API
// ========================================

class MarketBotAPI {
  constructor(baseURL = MARKETBOT_CONFIG.apiBase) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('marketbot_token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Métodos de Cupons
  async validateCoupon(code) {
    return this.request(`/coupons-affiliates/validate-coupon/${code}`);
  }

  async generateCoupon(data) {
    return this.request('/coupons-affiliates/coupon/generate', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Métodos de Afiliados
  async generateAffiliate(userId) {
    return this.request('/coupons-affiliates/affiliate/generate', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  async validateAffiliate(userId) {
    return this.request('/coupons-affiliates/affiliate/validate', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId })
    });
  }

  // Métodos de Pagamento
  async getRechargeLinks(region) {
    return this.request(`/payment/recharge-links/${region}`);
  }

  async getStripeProducts() {
    return this.request('/payment/stripe-products');
  }
}

// Instância global da API
const api = new MarketBotAPI();

// ========================================
// 3. GERENCIADOR DE PLANOS
// ========================================

class PlanManager {
  constructor() {
    this.plans = [
      {
        id: 'flex',
        name: 'FLEX',
        price: 0,
        currency: 'BRL',
        period: null,
        commission: 20,
        popular: false,
        features: [
          '✅ Trading básico',
          '📊 Sinais simples',
          '💰 Comissão: 20%',
          '🔄 Recargas obrigatórias'
        ],
        minTopup: { brasil: 150, global: 30 },
        stripeLink: null
      },
      {
        id: 'pro-brasil',
        name: 'PRO Brasil',
        price: 297,
        currency: 'BRL',
        period: 'mês',
        commission: 10,
        popular: true,
        features: [
          '✅ Trading avançado',
          '🤖 IA integrada',
          '📊 Análises completas',
          '💰 Comissão: 10%',
          '🔄 Recargas obrigatórias'
        ],
        minTopup: { brasil: 150 },
        stripeLink: MARKETBOT_CONFIG.stripeLinks.proBrasil
      },
      {
        id: 'pro-global',
        name: 'PRO Global',
        price: 50,
        currency: 'USD',
        period: 'mês',
        commission: 10,
        popular: false,
        features: [
          '✅ Trading global',
          '🤖 IA integrada',
          '📊 Análises completas',
          '💰 Comissão: 10%',
          '🔄 Recargas obrigatórias'
        ],
        minTopup: { global: 30 },
        stripeLink: MARKETBOT_CONFIG.stripeLinks.proGlobal
      }
    ];
  }

  getPlan(id) {
    return this.plans.find(plan => plan.id === id);
  }

  getAllPlans() {
    return this.plans;
  }

  subscribeToPlan(planId) {
    const plan = this.getPlan(planId);
    
    if (!plan) {
      throw new Error('Plano não encontrado');
    }

    if (plan.stripeLink) {
      window.open(plan.stripeLink, '_blank');
    } else {
      console.log(`Plano ${plan.name} selecionado (gratuito)`);
    }
  }
}

const planManager = new PlanManager();

// ========================================
// 4. GERENCIADOR DE CUPONS
// ========================================

class CouponManager {
  constructor() {
    this.appliedCoupons = {
      discount: null,
      credit: null
    };
  }

  async validateDiscountCoupon(code) {
    try {
      const result = await api.validateCoupon(code);
      
      if (result.success && result.coupon.type === 'discount') {
        this.appliedCoupons.discount = result.coupon;
        return {
          valid: true,
          discount: result.coupon.discount,
          description: result.coupon.description
        };
      }
      
      return { valid: false, reason: result.coupon.reason };
    } catch (error) {
      return { valid: false, reason: 'Erro ao validar cupom' };
    }
  }

  async validateCreditCoupon(code) {
    try {
      const result = await api.validateCoupon(code);
      
      if (result.success && result.coupon.type === 'credit') {
        return {
          valid: true,
          creditAmount: result.coupon.creditAmount,
          currency: result.coupon.currency,
          description: result.coupon.description
        };
      }
      
      return { valid: false, reason: result.coupon.reason };
    } catch (error) {
      return { valid: false, reason: 'Erro ao validar cupom' };
    }
  }

  async applyCreditCoupon(code, userId) {
    const couponData = await this.validateCreditCoupon(code);
    
    if (!couponData.valid) {
      throw new Error(couponData.reason);
    }

    // Simular aplicação de crédito (implementar endpoint real)
    console.log(`Aplicando crédito: ${couponData.creditAmount} ${couponData.currency}`);
    
    return {
      success: true,
      creditAdded: couponData.creditAmount,
      currency: couponData.currency,
      message: `${couponData.creditAmount} ${couponData.currency} adicionados à sua carteira!`
    };
  }

  calculateDiscountedPrice(originalPrice, planCurrency = 'BRL') {
    if (!this.appliedCoupons.discount) {
      return originalPrice;
    }

    const discount = this.appliedCoupons.discount.discount;
    return originalPrice * (1 - discount / 100);
  }

  clearCoupons() {
    this.appliedCoupons = { discount: null, credit: null };
  }
}

const couponManager = new CouponManager();

// ========================================
// 5. GERENCIADOR DE AFILIADOS
// ========================================

class AffiliateManager {
  constructor() {
    this.affiliateData = null;
  }

  async generateAffiliateCode(userId) {
    try {
      const result = await api.generateAffiliate(userId);
      
      if (result.success) {
        this.affiliateData = {
          code: result.affiliateCode,
          userId: result.userId,
          commissionRate: result.commissionRate
        };
        
        return this.affiliateData;
      }
      
      throw new Error('Erro ao gerar código de afiliado');
    } catch (error) {
      console.error('Erro na geração de afiliado:', error);
      return null;
    }
  }

  async validateAffiliateCode(userId) {
    try {
      const result = await api.validateAffiliate(userId);
      return result;
    } catch (error) {
      console.error('Erro na validação de afiliado:', error);
      return { success: false, error: error.message };
    }
  }

  generateShareText(affiliateCode) {
    return `🚀 Junte-se ao MarketBot com meu código de afiliado: ${affiliateCode}
💰 Trading automatizado com IA
📈 Ganhe dinheiro no mercado crypto

Link: https://marketbot.ngrok.app/register?ref=${affiliateCode}`;
  }

  async shareAffiliateCode(affiliateCode) {
    const shareText = this.generateShareText(affiliateCode);
    
    if (navigator.share) {
      // Mobile/PWA share
      await navigator.share({
        title: 'MarketBot - Trading com IA',
        text: shareText,
        url: `https://marketbot.ngrok.app/register?ref=${affiliateCode}`
      });
    } else {
      // Desktop - copy to clipboard
      await navigator.clipboard.writeText(shareText);
      alert('📋 Código de afiliado copiado! Compartilhe para ganhar comissões.');
    }
  }
}

const affiliateManager = new AffiliateManager();

// ========================================
// 6. GERENCIADOR DE RECARGAS
// ========================================

class RechargeManager {
  constructor() {
    this.rechargeOptions = {
      brasil: [
        { amount: 150, price: 'R$ 150', popular: false },
        { amount: 300, price: 'R$ 300', popular: false },
        { amount: 500, price: 'R$ 500', popular: true },
        { amount: 1000, price: 'R$ 1.000', popular: false },
        { amount: 2000, price: 'R$ 2.000', popular: false },
        { amount: 5000, price: 'R$ 5.000', popular: false }
      ],
      global: [
        { amount: 30, price: '$30', popular: false },
        { amount: 50, price: '$50', popular: false },
        { amount: 100, price: '$100', popular: true },
        { amount: 200, price: '$200', popular: false },
        { amount: 500, price: '$500', popular: false },
        { amount: 1000, price: '$1,000', popular: false }
      ]
    };
  }

  getRechargeOptions(region) {
    return this.rechargeOptions[region] || [];
  }

  rechargeAccount(amount, region) {
    const links = MARKETBOT_CONFIG.stripeLinks.recharge[region];
    const link = links?.[amount];
    
    if (link) {
      window.open(link, '_blank');
    } else {
      alert('Valor de recarga não disponível. Escolha outro valor.');
    }
  }

  calculateRechargeWithDiscount(amount, region) {
    const originalAmount = amount;
    const discountedAmount = couponManager.calculateDiscountedPrice(amount);
    const savings = originalAmount - discountedAmount;
    
    return {
      original: originalAmount,
      final: discountedAmount,
      savings,
      hasSavings: savings > 0
    };
  }
}

const rechargeManager = new RechargeManager();

// ========================================
// 7. COMPONENTE PRINCIPAL - REACT/VANILLA JS
// ========================================

// Exemplo em Vanilla JavaScript
class MarketBotPricingComponent {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.selectedPlan = null;
    this.render();
    this.attachEvents();
  }

  render() {
    const plans = planManager.getAllPlans();
    
    this.container.innerHTML = `
      <div class="pricing-container">
        <h1>🚀 Escolha seu Plano MarketBot</h1>
        
        <div class="plans-grid">
          ${plans.map(plan => this.renderPlanCard(plan)).join('')}
        </div>
        
        <div class="coupons-section">
          ${this.renderCouponForm()}
        </div>
        
        <div class="recharge-section">
          ${this.renderRechargeOptions()}
        </div>
        
        <div class="affiliate-section">
          ${this.renderAffiliatePanel()}
        </div>
      </div>
    `;
  }

  renderPlanCard(plan) {
    return `
      <div class="plan-card ${plan.popular ? 'popular' : ''}" data-plan-id="${plan.id}">
        ${plan.popular ? '<div class="popular-badge">🔥 MAIS POPULAR</div>' : ''}
        
        <h3>${plan.name}</h3>
        
        <div class="plan-price">
          ${plan.price === 0 ? 
            '<span class="free">Gratuito</span>' : 
            `<span class="currency">${plan.currency === 'BRL' ? 'R$' : '$'}</span>
             <span class="amount">${plan.price}</span>
             ${plan.period ? `<span class="period">/${plan.period}</span>` : ''}`
          }
        </div>
        
        <ul class="plan-features">
          ${plan.features.map(feature => `<li>${feature}</li>`).join('')}
        </ul>
        
        <div class="min-topup">
          <strong>Recargas mínimas:</strong>
          ${plan.minTopup.brasil ? `<p>🇧🇷 Brasil: R$ ${plan.minTopup.brasil}</p>` : ''}
          ${plan.minTopup.global ? `<p>🌍 Global: $${plan.minTopup.global}</p>` : ''}
        </div>
        
        <button class="btn-select" data-plan-id="${plan.id}">
          ${plan.price === 0 ? 'Começar Grátis' : `Assinar ${plan.name}`}
        </button>
      </div>
    `;
  }

  renderCouponForm() {
    return `
      <div class="coupon-form">
        <h3>🎫 Cupons</h3>
        
        <div class="coupon-types">
          <div class="discount-coupon">
            <h4>💰 Cupom de Desconto</h4>
            <div class="input-group">
              <input type="text" id="discount-coupon" placeholder="Ex: WELCOME10" />
              <button id="apply-discount">Aplicar</button>
            </div>
            <div id="discount-result"></div>
          </div>
          
          <div class="credit-coupon">
            <h4>🎁 Cupom de Crédito</h4>
            <div class="input-group">
              <input type="text" id="credit-coupon" placeholder="Ex: CREDIT250BRL" />
              <button id="apply-credit">Aplicar Crédito</button>
            </div>
            <div id="credit-result"></div>
          </div>
        </div>
      </div>
    `;
  }

  renderRechargeOptions() {
    return `
      <div class="recharge-section">
        <h3>💰 Recarregar Carteira</h3>
        
        <div class="region-selector">
          <button class="region-btn active" data-region="brasil">🇧🇷 Brasil</button>
          <button class="region-btn" data-region="global">🌍 Global</button>
        </div>
        
        <div id="recharge-grid" class="recharge-grid">
          <!-- Options will be populated by JavaScript -->
        </div>
      </div>
    `;
  }

  renderAffiliatePanel() {
    return `
      <div class="affiliate-panel">
        <h3>👥 Sistema de Afiliados</h3>
        
        <div id="affiliate-content">
          <button id="generate-affiliate">Gerar Código de Afiliado</button>
          <div id="affiliate-result"></div>
        </div>
      </div>
    `;
  }

  attachEvents() {
    // Eventos de planos
    this.container.querySelectorAll('.btn-select').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const planId = e.target.dataset.planId;
        this.selectPlan(planId);
      });
    });

    // Eventos de cupons
    document.getElementById('apply-discount')?.addEventListener('click', () => {
      this.applyDiscountCoupon();
    });

    document.getElementById('apply-credit')?.addEventListener('click', () => {
      this.applyCreditCoupon();
    });

    // Eventos de região
    this.container.querySelectorAll('.region-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchRegion(e.target.dataset.region);
      });
    });

    // Eventos de afiliados
    document.getElementById('generate-affiliate')?.addEventListener('click', () => {
      this.generateAffiliate();
    });

    // Carregar opções de recarga inicial
    this.loadRechargeOptions('brasil');
  }

  async selectPlan(planId) {
    const plan = planManager.getPlan(planId);
    
    if (!plan) return;

    this.selectedPlan = plan;
    
    if (plan.stripeLink) {
      // Aplicar desconto se houver cupom
      const originalPrice = plan.price;
      const finalPrice = couponManager.calculateDiscountedPrice(originalPrice);
      
      if (finalPrice < originalPrice) {
        const savings = originalPrice - finalPrice;
        const confirm = window.confirm(
          `💰 Desconto aplicado!\n` +
          `Preço original: ${plan.currency === 'BRL' ? 'R$' : '$'} ${originalPrice}\n` +
          `Preço final: ${plan.currency === 'BRL' ? 'R$' : '$'} ${finalPrice.toFixed(2)}\n` +
          `Economia: ${plan.currency === 'BRL' ? 'R$' : '$'} ${savings.toFixed(2)}\n\n` +
          `Prosseguir com o pagamento?`
        );
        
        if (!confirm) return;
      }
      
      planManager.subscribeToPlan(planId);
    } else {
      alert(`✅ Plano ${plan.name} selecionado! Agora você pode fazer recargas.`);
    }
  }

  async applyDiscountCoupon() {
    const input = document.getElementById('discount-coupon');
    const code = input.value.trim().toUpperCase();
    const resultDiv = document.getElementById('discount-result');
    
    if (!code) return;

    try {
      const result = await couponManager.validateDiscountCoupon(code);
      
      if (result.valid) {
        resultDiv.innerHTML = `
          <div class="coupon-success">
            ✅ Cupom aplicado! Desconto: ${result.discount}%
            <p>${result.description}</p>
          </div>
        `;
        input.value = '';
      } else {
        resultDiv.innerHTML = `
          <div class="coupon-error">
            ❌ ${result.reason}
          </div>
        `;
      }
    } catch (error) {
      resultDiv.innerHTML = `
        <div class="coupon-error">
          ❌ Erro ao validar cupom: ${error.message}
        </div>
      `;
    }
  }

  async applyCreditCoupon() {
    const input = document.getElementById('credit-coupon');
    const code = input.value.trim().toUpperCase();
    const resultDiv = document.getElementById('credit-result');
    
    if (!code) return;

    try {
      const userId = 123; // Obter do estado do usuário
      const result = await couponManager.applyCreditCoupon(code, userId);
      
      if (result.success) {
        resultDiv.innerHTML = `
          <div class="coupon-success">
            🎉 ${result.message}
          </div>
        `;
        input.value = '';
      }
    } catch (error) {
      resultDiv.innerHTML = `
        <div class="coupon-error">
          ❌ ${error.message}
        </div>
      `;
    }
  }

  switchRegion(region) {
    // Atualizar botões ativos
    this.container.querySelectorAll('.region-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.region === region);
    });

    // Carregar opções da região
    this.loadRechargeOptions(region);
  }

  loadRechargeOptions(region) {
    const options = rechargeManager.getRechargeOptions(region);
    const grid = document.getElementById('recharge-grid');
    
    grid.innerHTML = options.map(option => `
      <div class="recharge-card ${option.popular ? 'popular' : ''}">
        ${option.popular ? '<div class="popular-badge">⭐ Popular</div>' : ''}
        <h4>${option.price}</h4>
        <button 
          class="btn-recharge" 
          onclick="rechargeManager.rechargeAccount(${option.amount}, '${region}')"
        >
          Recarregar
        </button>
      </div>
    `).join('');
  }

  async generateAffiliate() {
    const userId = 123; // Obter do estado do usuário
    const resultDiv = document.getElementById('affiliate-result');
    
    try {
      const affiliate = await affiliateManager.generateAffiliateCode(userId);
      
      if (affiliate) {
        resultDiv.innerHTML = `
          <div class="affiliate-success">
            <p><strong>Seu código:</strong> ${affiliate.code}</p>
            <p><strong>Comissão:</strong> ${affiliate.commissionRate}%</p>
            <button onclick="affiliateManager.shareAffiliateCode('${affiliate.code}')">
              📤 Compartilhar
            </button>
          </div>
        `;
      }
    } catch (error) {
      resultDiv.innerHTML = `
        <div class="affiliate-error">
          ❌ Erro ao gerar código: ${error.message}
        </div>
      `;
    }
  }
}

// ========================================
// 8. INICIALIZAÇÃO
// ========================================

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar componente principal
  if (document.getElementById('marketbot-pricing')) {
    new MarketBotPricingComponent('marketbot-pricing');
  }
  
  console.log('🚀 MarketBot Frontend Integration loaded!');
  console.log('API Base:', MARKETBOT_CONFIG.apiBase);
  console.log('Available Coupons:', MARKETBOT_CONFIG.coupons);
});

// ========================================
// 9. EXPORTS PARA MÓDULOS
// ========================================

// Se usando módulos ES6
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MarketBotAPI,
    PlanManager,
    CouponManager,
    AffiliateManager,
    RechargeManager,
    MarketBotPricingComponent,
    MARKETBOT_CONFIG
  };
}

// Se usando como script global
if (typeof window !== 'undefined') {
  window.MarketBot = {
    API: MarketBotAPI,
    PlanManager,
    CouponManager,
    AffiliateManager,
    RechargeManager,
    PricingComponent: MarketBotPricingComponent,
    CONFIG: MARKETBOT_CONFIG,
    
    // Instâncias globais
    api,
    planManager,
    couponManager,
    affiliateManager,
    rechargeManager
  };
}
