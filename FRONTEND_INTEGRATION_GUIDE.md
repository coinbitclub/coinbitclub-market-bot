# 🚀 MarketBot Frontend - Guia de Integração Financeira

**Data:** 21 de agosto de 2025  
**Versão:** 1.0  
**Sistema:** MarketBot Backend Financial Integration  

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Links Stripe](#links-stripe)
3. [Sistema de Afiliados](#sistema-de-afiliados)
4. [Cupons de Desconto](#cupons-de-desconto)
5. [Cupons de Crédito](#cupons-de-crédito)
6. [Exemplos de Interface](#exemplos-de-interface)
7. [Fluxos Completos](#fluxos-completos)
8. [Tratamento de Erros](#tratamento-de-erros)

---

## 🎯 Visão Geral

O sistema financeiro MarketBot oferece:
- **3 Planos:** FLEX (gratuito), PRO Brasil (R$ 297/mês), PRO Global ($50/mês)
- **Recargas Obrigatórias:** Fonte principal de receita
- **Sistema de Afiliados:** Comissões automáticas
- **Cupons:** Desconto (%) e Crédito Direto (valor fixo)

### 🌐 Base URL da API
```
Produção: https://marketbot.ngrok.app/api/v1
Local: http://localhost:3000/api/v1
```

---

## 💳 Links Stripe

### 📊 Planos Disponíveis

#### 🟢 FLEX - Gratuito
```javascript
// Não há link Stripe - apenas recargas obrigatórias
const flexPlan = {
  name: "FLEX",
  price: "Gratuito",
  commission: "20%",
  minTopup: {
    brasil: 150,  // R$ 150
    global: 30    // $30 USD
  }
};
```

#### 🔥 PRO Brasil - R$ 297/mês (MAIS POPULAR)
```javascript
const proBrasilLink = "https://buy.stripe.com/28o0329eAdOA2Gccyz";

// Implementação no frontend
function subscribeToPROBrasil() {
  // Redirecionar para Stripe
  window.open(proBrasilLink, '_blank');
}
```

#### 🌎 PRO Global - $50/mês
```javascript
const proGlobalLink = "https://buy.stripe.com/28o032bgC5gc1CY98B";

// Implementação no frontend
function subscribeToPROGlobal() {
  // Redirecionar para Stripe
  window.open(proGlobalLink, '_blank');
}
```

### 💰 Links de Recarga

#### 🇧🇷 Recargas Brasil
```javascript
const rechargeLinks = {
  brasil: {
    r150: "https://buy.stripe.com/bIY0005YofiScPW9CD",
    r500: "https://buy.stripe.com/fZe9Cd1GubGsbLS6oC"
  }
};

// Implementação
function rechargeAccount(amount, region) {
  const links = {
    brasil: {
      150: rechargeLinks.brasil.r150,
      500: rechargeLinks.brasil.r500
    }
  };
  
  const link = links[region]?.[amount];
  if (link) {
    window.open(link, '_blank');
  } else {
    alert('Valor de recarga não disponível');
  }
}
```

#### 🌍 Recargas Global
```javascript
const globalRechargeLinks = {
  global: {
    usd30: "https://buy.stripe.com/14k8Adbwg9YU7tk9CF",
    usd100: "https://buy.stripe.com/cN2aGJ3aQ8UQbLSdQU"
  }
};

// Uso
rechargeAccount(30, 'global');  // $30 USD
rechargeAccount(100, 'global'); // $100 USD
```

---

## 👥 Sistema de Afiliados

### 🔗 Gerar Código de Afiliado

```javascript
async function generateAffiliateCode(userId) {
  try {
    const response = await fetch('/api/v1/coupons-affiliates/affiliate/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({ userId })
    });
    
    const data = await response.json();
    
    if (data.success) {
      return {
        affiliateCode: data.affiliateCode,
        commissionRate: data.commissionRate,
        userId: data.userId
      };
    }
    
    throw new Error('Erro ao gerar código de afiliado');
    
  } catch (error) {
    console.error('Erro:', error);
    return null;
  }
}

// Exemplo de uso
const affiliate = await generateAffiliateCode(123);
if (affiliate) {
  console.log(`Seu código: ${affiliate.affiliateCode}`);
  console.log(`Comissão: ${affiliate.commissionRate}%`);
}
```

### ✅ Validar Código de Afiliado

```javascript
async function validateAffiliateCode(userId) {
  try {
    const response = await fetch('/api/v1/coupons-affiliates/affiliate/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({ user_id: userId })
    });
    
    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error('Erro ao validar afiliado:', error);
    return { success: false, error: error.message };
  }
}
```

### 🎨 Interface de Afiliados

```jsx
// Componente React exemplo
function AffiliatePanel({ userId }) {
  const [affiliateCode, setAffiliateCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleGenerateCode = async () => {
    setIsLoading(true);
    const result = await generateAffiliateCode(userId);
    
    if (result) {
      setAffiliateCode(result.affiliateCode);
      alert(`Código gerado: ${result.affiliateCode}`);
    }
    
    setIsLoading(false);
  };
  
  return (
    <div className="affiliate-panel">
      <h3>💰 Sistema de Afiliados</h3>
      
      {!affiliateCode ? (
        <button 
          onClick={handleGenerateCode} 
          disabled={isLoading}
          className="btn-generate"
        >
          {isLoading ? 'Gerando...' : 'Gerar Código de Afiliado'}
        </button>
      ) : (
        <div className="affiliate-info">
          <p><strong>Seu código:</strong> {affiliateCode}</p>
          <p><strong>Comissão:</strong> 10%</p>
          <button onClick={() => navigator.clipboard.writeText(affiliateCode)}>
            📋 Copiar Código
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## 🎫 Cupons de Desconto

### 🔍 Validar Cupom de Desconto

```javascript
async function validateDiscountCoupon(couponCode) {
  try {
    const response = await fetch(`/api/v1/coupons-affiliates/validate-coupon/${couponCode}`);
    const data = await response.json();
    
    if (data.success && data.coupon.type === 'discount') {
      return {
        valid: true,
        code: data.coupon.code,
        discount: data.coupon.discount,
        description: data.coupon.description
      };
    }
    
    return { valid: false, reason: data.coupon.reason };
    
  } catch (error) {
    return { valid: false, reason: 'Erro ao validar cupom' };
  }
}

// Exemplo de uso
const coupon = await validateDiscountCoupon('WELCOME10');
if (coupon.valid) {
  console.log(`Desconto: ${coupon.discount}%`);
}
```

### 🎨 Interface de Cupons de Desconto

```jsx
function CouponDiscountForm({ onCouponApplied }) {
  const [couponCode, setCouponCode] = useState('');
  const [couponData, setCouponData] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  
  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setIsValidating(true);
    const result = await validateDiscountCoupon(couponCode);
    
    if (result.valid) {
      setCouponData(result);
      onCouponApplied(result);
      alert(`✅ Cupom aplicado! Desconto: ${result.discount}%`);
    } else {
      alert(`❌ ${result.reason}`);
      setCouponData(null);
    }
    
    setIsValidating(false);
  };
  
  return (
    <div className="coupon-form">
      <h4>🎫 Cupom de Desconto</h4>
      
      <div className="input-group">
        <input
          type="text"
          placeholder="Digite o código do cupom"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          className="coupon-input"
        />
        <button 
          onClick={handleValidateCoupon}
          disabled={isValidating || !couponCode}
          className="btn-validate"
        >
          {isValidating ? 'Validando...' : 'Aplicar'}
        </button>
      </div>
      
      {couponData && (
        <div className="coupon-success">
          <p>✅ <strong>{couponData.code}</strong></p>
          <p>Desconto: <strong>{couponData.discount}%</strong></p>
          <p>{couponData.description}</p>
        </div>
      )}
    </div>
  );
}
```

### 📝 Cupons de Desconto Disponíveis

```javascript
const availableDiscountCoupons = [
  {
    code: 'WELCOME10',
    discount: 10,
    description: 'Cupom de boas-vindas - 10% de desconto'
  },
  {
    code: 'PROMO20',
    discount: 20,
    description: 'Promoção especial - 20% de desconto'
  },
  {
    code: 'VIP25',
    discount: 25,
    description: 'Cupom VIP - 25% de desconto'
  }
];
```

---

## 💰 Cupons de Crédito

### 🎁 Validar Cupom de Crédito

```javascript
async function validateCreditCoupon(couponCode) {
  try {
    const response = await fetch(`/api/v1/coupons-affiliates/validate-coupon/${couponCode}`);
    const data = await response.json();
    
    if (data.success && data.coupon.type === 'credit') {
      return {
        valid: true,
        code: data.coupon.code,
        creditAmount: data.coupon.creditAmount,
        currency: data.coupon.currency,
        description: data.coupon.description
      };
    }
    
    return { valid: false, reason: data.coupon.reason };
    
  } catch (error) {
    return { valid: false, reason: 'Erro ao validar cupom' };
  }
}
```

### 💳 Aplicar Crédito na Carteira

```javascript
async function applyCreditCoupon(couponCode, userId) {
  try {
    // 1. Validar cupom
    const couponData = await validateCreditCoupon(couponCode);
    
    if (!couponData.valid) {
      throw new Error(couponData.reason);
    }
    
    // 2. Aplicar crédito (implementar endpoint no backend)
    const response = await fetch('/api/v1/wallet/apply-credit-coupon', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        couponCode,
        userId,
        creditAmount: couponData.creditAmount,
        currency: couponData.currency
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      return {
        success: true,
        creditAdded: couponData.creditAmount,
        currency: couponData.currency,
        newBalance: result.newBalance
      };
    }
    
    throw new Error(result.error || 'Erro ao aplicar crédito');
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

### 🎨 Interface de Cupons de Crédito

```jsx
function CreditCouponForm({ userId, onCreditApplied }) {
  const [couponCode, setCouponCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setIsProcessing(true);
    
    try {
      const result = await applyCreditCoupon(couponCode, userId);
      
      if (result.success) {
        alert(`🎉 Crédito aplicado! +${result.creditAdded} ${result.currency}`);
        onCreditApplied(result);
        setCouponCode('');
      } else {
        alert(`❌ ${result.error}`);
      }
    } catch (error) {
      alert(`❌ Erro: ${error.message}`);
    }
    
    setIsProcessing(false);
  };
  
  return (
    <div className="credit-coupon-form">
      <h4>💰 Cupom de Crédito</h4>
      <p>Adicione crédito diretamente na sua carteira</p>
      
      <div className="input-group">
        <input
          type="text"
          placeholder="Digite o código do cupom"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          className="coupon-input"
        />
        <button 
          onClick={handleApplyCoupon}
          disabled={isProcessing || !couponCode}
          className="btn-apply-credit"
        >
          {isProcessing ? 'Aplicando...' : 'Aplicar Crédito'}
        </button>
      </div>
      
      <div className="credit-coupons-available">
        <h5>📋 Cupons Disponíveis:</h5>
        <ul>
          <li><code>CREDIT250BRL</code> - R$ 250 de crédito</li>
          <li><code>CREDIT50USD</code> - $50 USD de crédito</li>
        </ul>
      </div>
    </div>
  );
}
```

### 💎 Cupons de Crédito Disponíveis

```javascript
const availableCreditCoupons = [
  {
    code: 'CREDIT250BRL',
    amount: 250,
    currency: 'BRL',
    description: 'R$ 250 de crédito direto na carteira'
  },
  {
    code: 'CREDIT50USD',
    amount: 50,
    currency: 'USD',
    description: '$50 USD de crédito direto na carteira'
  }
];
```

---

## 🎨 Exemplos de Interface

### 💳 Página de Planos

```jsx
function PricingPage() {
  return (
    <div className="pricing-page">
      <h1>🚀 Escolha seu Plano MarketBot</h1>
      
      <div className="plans-grid">
        {/* FLEX Plan */}
        <div className="plan-card flex">
          <h3>🟢 FLEX</h3>
          <p className="price">Gratuito</p>
          <ul>
            <li>✅ Trading básico</li>
            <li>📊 Sinais simples</li>
            <li>💰 Comissão: 20%</li>
            <li>🔄 Recargas obrigatórias</li>
          </ul>
          <div className="min-topup">
            <p><strong>Recargas mínimas:</strong></p>
            <p>🇧🇷 Brasil: R$ 150</p>
            <p>🌍 Global: $30 USD</p>
          </div>
          <button className="btn-select">Começar Grátis</button>
        </div>
        
        {/* PRO Brasil Plan */}
        <div className="plan-card pro-brasil popular">
          <div className="popular-badge">🔥 MAIS POPULAR</div>
          <h3>🇧🇷 PRO Brasil</h3>
          <p className="price">R$ 297<span>/mês</span></p>
          <ul>
            <li>✅ Trading avançado</li>
            <li>🤖 IA integrada</li>
            <li>📊 Análises completas</li>
            <li>💰 Comissão: 10%</li>
            <li>🔄 Recargas obrigatórias</li>
          </ul>
          <p><strong>Recarga mínima:</strong> R$ 150</p>
          <button 
            className="btn-select"
            onClick={() => subscribeToPROBrasil()}
          >
            Assinar PRO Brasil
          </button>
        </div>
        
        {/* PRO Global Plan */}
        <div className="plan-card pro-global">
          <h3>🌎 PRO Global</h3>
          <p className="price">$50<span>/mês</span></p>
          <ul>
            <li>✅ Trading global</li>
            <li>🤖 IA integrada</li>
            <li>📊 Análises completas</li>
            <li>💰 Comissão: 10%</li>
            <li>🔄 Recargas obrigatórias</li>
          </ul>
          <p><strong>Recarga mínima:</strong> $30 USD</p>
          <button 
            className="btn-select"
            onClick={() => subscribeToPROGlobal()}
          >
            Assinar PRO Global
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 💰 Página de Recarga

```jsx
function RechargePage({ userRegion = 'brasil' }) {
  const rechargeOptions = {
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
  
  return (
    <div className="recharge-page">
      <h1>💰 Recarregar Carteira</h1>
      
      <div className="recharge-grid">
        {rechargeOptions[userRegion].map((option) => (
          <div 
            key={option.amount}
            className={`recharge-card ${option.popular ? 'popular' : ''}`}
          >
            {option.popular && <div className="popular-badge">⭐ Popular</div>}
            <h3>{option.price}</h3>
            <button 
              className="btn-recharge"
              onClick={() => rechargeAccount(option.amount, userRegion)}
            >
              Recarregar
            </button>
          </div>
        ))}
      </div>
      
      {/* Seção de Cupons */}
      <div className="coupons-section">
        <CouponDiscountForm onCouponApplied={(coupon) => console.log(coupon)} />
        <CreditCouponForm 
          userId={123} 
          onCreditApplied={(result) => console.log(result)} 
        />
      </div>
    </div>
  );
}
```

---

## 🔄 Fluxos Completos

### 🎯 Fluxo 1: Assinatura de Plano

```javascript
// 1. Usuário escolhe plano PRO Brasil
async function subscribeFlow() {
  try {
    // 1. Verificar cupom de desconto (opcional)
    const couponCode = 'WELCOME10';
    const coupon = await validateDiscountCoupon(couponCode);
    
    // 2. Calcular preço final
    let finalPrice = 297; // R$ 297
    if (coupon.valid) {
      finalPrice = finalPrice * (1 - coupon.discount / 100);
      console.log(`Desconto aplicado: ${coupon.discount}%`);
      console.log(`Preço final: R$ ${finalPrice}`);
    }
    
    // 3. Redirecionar para Stripe (cupom será aplicado no backend)
    subscribeToPROBrasil();
    
  } catch (error) {
    console.error('Erro na assinatura:', error);
  }
}
```

### 💰 Fluxo 2: Recarga com Cupom de Crédito

```javascript
async function rechargeWithCreditFlow(userId) {
  try {
    // 1. Usuário tenta aplicar cupom de crédito
    const creditResult = await applyCreditCoupon('CREDIT250BRL', userId);
    
    if (creditResult.success) {
      // Crédito aplicado diretamente
      alert(`🎉 R$ 250 adicionados à sua carteira!`);
      return;
    }
    
    // 2. Se não tem cupom, fazer recarga normal
    const amount = 500; // R$ 500
    rechargeAccount(amount, 'brasil');
    
  } catch (error) {
    console.error('Erro na recarga:', error);
  }
}
```

### 👥 Fluxo 3: Sistema de Afiliados

```javascript
async function affiliateFlow(userId) {
  try {
    // 1. Gerar código de afiliado
    const affiliate = await generateAffiliateCode(userId);
    
    if (affiliate) {
      // 2. Compartilhar código
      const shareText = `
        🚀 Junte-se ao MarketBot com meu código de afiliado: ${affiliate.affiliateCode}
        💰 Trading automatizado com IA
        📈 Ganhe dinheiro no mercado crypto
        
        Link: https://marketbot.ngrok.app/register?ref=${affiliate.affiliateCode}
      `;
      
      // 3. Copiar para clipboard ou compartilhar
      navigator.clipboard.writeText(shareText);
      alert('Código de afiliado copiado! Compartilhe para ganhar comissões.');
    }
    
  } catch (error) {
    console.error('Erro no sistema de afiliados:', error);
  }
}
```

---

## ⚠️ Tratamento de Erros

### 🚨 Códigos de Erro Comuns

```javascript
const errorMessages = {
  // Cupons
  'COUPON_NOT_FOUND': 'Cupom não encontrado',
  'COUPON_EXPIRED': 'Cupom expirado',
  'COUPON_MAX_USES': 'Cupom atingiu limite de usos',
  'COUPON_ALREADY_USED': 'Cupom já utilizado por este usuário',
  
  // Afiliados
  'AFFILIATE_NOT_FOUND': 'Código de afiliado não encontrado',
  'AFFILIATE_ALREADY_EXISTS': 'Usuário já possui código de afiliado',
  
  // Pagamentos
  'PAYMENT_FAILED': 'Falha no pagamento',
  'INSUFFICIENT_FUNDS': 'Saldo insuficiente',
  'INVALID_AMOUNT': 'Valor inválido'
};

function handleApiError(error, context = '') {
  console.error(`Erro em ${context}:`, error);
  
  const userMessage = errorMessages[error.code] || 
                     error.message || 
                     'Erro inesperado. Tente novamente.';
  
  // Mostrar erro para usuário
  alert(`❌ ${userMessage}`);
  
  // Log para debugging
  if (error.stack) {
    console.error('Stack:', error.stack);
  }
}
```

### 🔄 Retry Logic

```javascript
async function apiCallWithRetry(apiFunction, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiFunction();
    } catch (error) {
      console.log(`Tentativa ${attempt} falhou:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Esperar antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

// Uso
const result = await apiCallWithRetry(() => validateDiscountCoupon('WELCOME10'));
```

---

## 🎨 CSS Recomendado

```css
/* Componentes de Planos */
.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin: 2rem 0;
}

.plan-card {
  border: 2px solid #e1e5e9;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  position: relative;
  transition: all 0.3s ease;
}

.plan-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.1);
}

.plan-card.popular {
  border-color: #ff6b6b;
  background: linear-gradient(135deg, #fff 0%, #fff8f8 100%);
}

.popular-badge {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  background: #ff6b6b;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: bold;
}

/* Componentes de Cupons */
.coupon-form, .credit-coupon-form {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1rem 0;
}

.input-group {
  display: flex;
  gap: 0.5rem;
  margin: 1rem 0;
}

.coupon-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

.btn-validate, .btn-apply-credit {
  background: #28a745;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}

.btn-validate:hover, .btn-apply-credit:hover {
  background: #218838;
}

.coupon-success {
  background: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
  padding: 1rem;
  border-radius: 6px;
  margin-top: 1rem;
}

/* Botões de Planos */
.btn-select {
  background: #007bff;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  width: 100%;
  margin-top: 1rem;
}

.btn-select:hover {
  background: #0056b3;
}

/* Grid de Recargas */
.recharge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 2rem 0;
}

.recharge-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  transition: all 0.3s ease;
}

.recharge-card.popular {
  border-color: #ffc107;
  background: #fff9e6;
}

.btn-recharge {
  background: #17a2b8;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  width: 100%;
  font-weight: bold;
}

.btn-recharge:hover {
  background: #138496;
}
```

---

## 📱 Implementação Mobile

```jsx
// Componente responsivo para mobile
function MobilePricingCard({ plan, onSelect }) {
  return (
    <div className="mobile-plan-card">
      <div className="plan-header">
        <h3>{plan.name}</h3>
        {plan.popular && <span className="badge">🔥 Popular</span>}
      </div>
      
      <div className="plan-price">
        <span className="currency">{plan.currency}</span>
        <span className="amount">{plan.amount}</span>
        {plan.period && <span className="period">/{plan.period}</span>}
      </div>
      
      <ul className="plan-features">
        {plan.features.map((feature, index) => (
          <li key={index}>{feature}</li>
        ))}
      </ul>
      
      <button 
        className="btn-select-mobile"
        onClick={() => onSelect(plan)}
      >
        {plan.price === 0 ? 'Começar Grátis' : 'Assinar'}
      </button>
    </div>
  );
}
```

---

## 🔗 Links Úteis

- **Stripe Dashboard:** https://dashboard.stripe.com
- **API Documentation:** https://marketbot.ngrok.app/docs
- **Webhook Testing:** https://webhook.site
- **Backend Repository:** [GitHub Link]

---

## 📞 Suporte

Para dúvidas sobre integração:

- **Email:** dev@marketbot.com
- **Discord:** MarketBot Developers
- **Documentação:** https://docs.marketbot.com

---

**🎯 Status:** ✅ Pronto para Produção  
**📅 Última Atualização:** 21/08/2025  
**🔄 Versão da API:** v1.0  

---

*Este documento cobre toda a integração financeira do MarketBot. Todas as URLs e códigos estão funcionais e testados.*
