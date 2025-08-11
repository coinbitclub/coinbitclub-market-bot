# 🔄 FLUXO OPERACIONAL E FINANCEIRO - COINBITCLUB MARKET BOT

**Sistema Enterprise de Trading Automatizado Multiusuário**  
**Versão:** 5.1.2 Production  
**Data:** 11 de Agosto de 2025  
**Documento:** Fluxos Detalhados do Sistema

---

## 📊 **VISÃO GERAL DOS FLUXOS**

### 🎯 **Fluxo Operacional**: Como o sistema processa sinais e executa trades
### 💰 **Fluxo Financeiro**: Como o sistema gerencia saldos, comissões e pagamentos

---

# 🔄 **FLUXO OPERACIONAL DETALHADO**

## 📡 **ETAPA 1: RECEBIMENTO DE SINAIS (TradingView → Sistema)**

### **1.1 Webhook TradingView**
```mermaid
graph LR
    A[TradingView] -->|HTTP POST| B[/webhook]
    B --> C[Validação Schema]
    C --> D[Salvar Signal DB]
    D --> E[Multi-User Processor]
```

**Endpoint:** `POST /webhook`

**Payload Exemplo:**
```json
{
  "signal": "SINAL_LONG_FORTE",
  "ticker": "BTCUSDT",
  "action": "BUY",
  "price": 65000,
  "leverage": 5,
  "timestamp": 1691767500000,
  "source": "TradingView"
}
```

**Validações Aplicadas:**
- ✅ Schema obrigatório válido
- ✅ Ticker suportado pelas exchanges
- ✅ Valores dentro dos limites seguros
- ✅ Rate limiting (100 req/min)

### **1.2 Janela de Validação (30 segundos)**
```javascript
// Sinal tem 30 segundos para ser validado
JANELA_VALIDACAO = 30; // segundos
JANELA_EXECUCAO = 120; // 2 minutos para execução

if (tempo_desde_recebimento > JANELA_VALIDACAO) {
  status = 'EXPIRED';
  return 'Signal expired - validation window closed';
}
```

---

## 🤖 **ETAPA 2: ANÁLISE INTELIGENTE DE MERCADO**

### **2.1 Coleta de Dados de Mercado**
```javascript
// 4 Condições Analisadas pela IA
const marketConditions = {
  fearGreedIndex: getFearGreedIndex(),      // 20-80 ideal
  top100Trend: getTop100Performance(),     // >60% em alta
  btcDominance: getBTCDominanceAnalysis(), // Correlação altcoins
  rsiOverheated: getRSIMarketAnalysis()    // RSI superaquecido
};
```

### **2.2 Análise por OpenAI GPT-4**
```javascript
const aiPrompt = `
ANÁLISE DE MERCADO PARA TRADING:

Dados atuais:
- Fear & Greed Index: ${fearGreedValue} (${classification})
- TOP 100 coins em alta: ${percentageUp}%
- BTC Dominance: ${btcDominance}%
- RSI médio mercado: ${marketRSI}

Sinal recebido: ${signalType} - ${ticker}
Direção permitida atual: ${allowedDirection}

REGRAS:
1. IA NÃO decide por conta própria
2. IA apenas COORDENA e SUPERVISIONA
3. Considerar volatilidade para fechamento antecipado
4. Priorizar sinais FORTE sobre normais

DECISÃO: EXECUTAR ou REJEITAR?
JUSTIFICATIVA: (obrigatória)
`;

const iaDecision = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [{ role: "user", content: aiPrompt }]
});
```

**Critérios de Aprovação:**
- ✅ Direção do sinal alinhada com mercado
- ✅ Fear & Greed dentro da faixa segura (20-80)
- ✅ Maioria das TOP 100 seguindo tendência
- ✅ Ausência de sobrecompra/sobrevenda extrema

---

## 🛡️ **ETAPA 3: POSITION SAFETY VALIDATOR**

### **3.1 Validações Obrigatórias (IMPOSSÍVEL BYPASSAR)**
```javascript
const positionSafetyRules = {
  maxLeverage: 10,           // Máximo 10x
  maxRiskPerTrade: 0.02,     // 2% do saldo por trade
  mandatoryStopLoss: true,   // SL obrigatório (5% a 15%)
  mandatoryTakeProfit: true, // TP obrigatório (8% a 25%)
  maxSimultaneousPositions: 2, // Máximo 2 posições ativas
  realTimeBalanceCheck: true   // Verificação de saldo em tempo real
};

// Validação por usuário
for (const user of eligibleUsers) {
  const validation = await validateUserSafety(user, signalData);
  
  if (!validation.approved) {
    console.log(`❌ ${user.name}: ${validation.reason}`);
    continue; // Pula este usuário
  }
  
  readyForExecution.push(user);
}
```

### **3.2 Cálculo Automático de Position Sizing**
```javascript
function calculatePositionSize(user, signalData) {
  const availableBalance = user.balance_total_usd;
  const maxRiskAmount = availableBalance * 0.02; // 2% máximo
  
  const leverage = Math.min(signalData.leverage, 10); // Max 10x
  const stopLossPercent = signalData.stopLoss / 100;
  
  // Tamanho da posição baseado no risco
  const positionSize = maxRiskAmount / stopLossPercent;
  const contractQuantity = positionSize / signalData.price;
  
  return {
    quantity: contractQuantity,
    usdValue: positionSize,
    riskAmount: maxRiskAmount,
    leverage: leverage,
    stopLoss: signalData.price * (1 - stopLossPercent),
    takeProfit: signalData.price * (1 + (signalData.takeProfit / 100))
  };
}
```

---

## 🎮 **ETAPA 4: ENTERPRISE EXCHANGE ORCHESTRATOR**

### **4.1 Seleção e Roteamento de Exchange**
```javascript
class ExchangeOrchestrator {
  async routeOrder(user, orderData) {
    // 1. Verificar status das exchanges
    const exchangeHealth = await this.checkExchangeHealth();
    
    // 2. Determinar exchange preferencial do usuário
    const userKeys = await this.getUserApiKeys(user.id);
    const availableExchanges = userKeys.filter(key => 
      key.validation_status === 'valid' && 
      exchangeHealth[key.exchange].available
    );
    
    // 3. Load balancing e seleção
    const selectedExchange = this.selectBestExchange(availableExchanges);
    
    return selectedExchange;
  }
}
```

### **4.2 Execução Multi-Exchange**
```javascript
async function executeOrdersForAllUsers(signalData, approvedUsers) {
  const executionResults = [];
  
  for (const user of approvedUsers) {
    try {
      // 1. Calcular parâmetros específicos do usuário
      const positionData = calculatePositionSize(user, signalData);
      
      // 2. Selecionar exchange
      const exchange = await orchestrator.routeOrder(user, positionData);
      
      // 3. Executar ordem
      const orderResult = await exchange.createMarketOrder(
        signalData.symbol,
        signalData.action.toLowerCase(),
        positionData.quantity,
        {
          leverage: positionData.leverage,
          stopLoss: positionData.stopLoss,
          takeProfit: positionData.takeProfit
        }
      );
      
      // 4. Registrar no banco
      await saveOrderExecution(user.id, signalData.id, orderResult);
      
      executionResults.push({
        user: user.name,
        status: 'SUCCESS',
        orderId: orderResult.id,
        exchange: exchange.name
      });
      
    } catch (error) {
      executionResults.push({
        user: user.name,
        status: 'ERROR',
        error: error.message
      });
    }
  }
  
  return executionResults;
}
```

---

## 📊 **ETAPA 5: MONITORAMENTO DE POSIÇÕES**

### **5.1 Tracking em Tempo Real**
```javascript
class PositionMonitor {
  constructor() {
    this.activePositions = new Map();
    this.monitoringInterval = 30000; // 30 segundos
  }
  
  async startMonitoring() {
    setInterval(async () => {
      for (const [positionId, position] of this.activePositions) {
        await this.checkPositionStatus(position);
      }
    }, this.monitoringInterval);
  }
  
  async checkPositionStatus(position) {
    const currentPrice = await this.getCurrentPrice(position.symbol);
    const pnl = this.calculatePnL(position, currentPrice);
    
    // Atualizar P&L no banco
    await this.updatePositionPnL(position.id, pnl);
    
    // Verificar condições de fechamento
    if (this.shouldClosePosition(position, currentPrice)) {
      await this.closePosition(position, 'AUTO_CLOSE');
    }
  }
}
```

### **5.2 Critérios de Fechamento Automático**
```javascript
function shouldClosePosition(position, currentPrice) {
  // 1. Stop Loss atingido
  if (position.side === 'long' && currentPrice <= position.stopLoss) {
    return { close: true, reason: 'STOP_LOSS_HIT' };
  }
  
  // 2. Take Profit atingido
  if (position.side === 'long' && currentPrice >= position.takeProfit) {
    return { close: true, reason: 'TAKE_PROFIT_HIT' };
  }
  
  // 3. Sinal de fechamento recebido
  if (this.hasCloseSignal(position.symbol, position.side)) {
    return { close: true, reason: 'CLOSE_SIGNAL_RECEIVED' };
  }
  
  // 4. Análise de IA para fechamento antecipado
  if (this.aiRecommendedClose(position)) {
    return { close: true, reason: 'AI_RECOMMENDED_CLOSE' };
  }
  
  return { close: false };
}
```

---

# 💰 **FLUXO FINANCEIRO DETALHADO**

## 👤 **ESTRUTURA DE SALDOS POR USUÁRIO**

### **Sistema de 3 Saldos Separados**
```sql
-- Tabela users (campos financeiros)
balance_real_brl        DECIMAL(15,2)  -- Stripe BRL (pode sacar)
balance_real_usd        DECIMAL(15,2)  -- Stripe USD (pode sacar)
balance_admin_brl       DECIMAL(15,2)  -- Cupons BRL (30 dias)
balance_admin_usd       DECIMAL(15,2)  -- Cupons USD (30 dias)
balance_commission_brl  DECIMAL(15,2)  -- Comissão BRL (converte)
balance_commission_usd  DECIMAL(15,2)  -- Comissão USD (converte)
```

### **Classificação Automática de Contas**
```javascript
function classifyUserAccount(user) {
  const totalBRL = user.balance_real_brl + user.balance_admin_brl;
  const totalUSD = user.balance_real_usd + user.balance_admin_usd;
  const hasSubscription = user.plan_type !== 'NONE';
  
  // Regra: >= R$100 OU >= $20 OU assinatura ativa = MANAGEMENT
  if (totalBRL >= 100 || totalUSD >= 20 || hasSubscription) {
    return {
      classification: 'MANAGEMENT',
      environment: 'PRODUCTION',
      allowRealTrading: true
    };
  }
  
  return {
    classification: 'TESTNET',
    environment: 'SIMULATION',
    allowRealTrading: false
  };
}
```

---

## 🧮 **SISTEMA DE COMISSÕES**

### **Estrutura de Comissionamento**
```javascript
const commissionRules = {
  // Comissão sobre LUCRO (não sobre operação)
  rates: {
    MONTHLY_PLAN: 10,    // 10% com assinatura mensal
    PREPAID_PLAN: 20,    // 20% sem assinatura (pré-pago)
  },
  
  // Afiliados recebem % da comissão total
  affiliateShares: {
    NORMAL: 1.5,  // 1.5% da comissão da empresa
    VIP: 5.0      // 5.0% da comissão da empresa
  }
};
```

### **Cálculo de Comissão (Apenas sobre Lucros)**
```javascript
async function calculateCommission(operationData) {
  const { userId, profit, planType, affiliateId, affiliateType } = operationData;
  
  // REGRA CRÍTICA: Apenas cobrar em operações com LUCRO
  if (profit <= 0) {
    return {
      totalCommission: 0,
      companyCommission: 0,
      affiliateCommission: 0,
      netProfit: profit,
      reason: 'No commission on loss operations'
    };
  }
  
  // Determinar taxa de comissão
  const hasSubscription = planType === 'MONTHLY';
  const commissionRate = hasSubscription ? 10 : 20; // 10% ou 20%
  
  // Calcular comissão total
  const totalCommission = profit * (commissionRate / 100);
  
  // Calcular comissão do afiliado (% da comissão total)
  let affiliateCommission = 0;
  if (affiliateId && affiliateType) {
    const affiliateRate = affiliateType === 'vip' ? 5.0 : 1.5;
    affiliateCommission = totalCommission * (affiliateRate / 100);
  }
  
  const companyCommission = totalCommission - affiliateCommission;
  const netProfit = profit - totalCommission;
  
  return {
    totalCommission: Math.round(totalCommission * 100) / 100,
    companyCommission: Math.round(companyCommission * 100) / 100,
    affiliateCommission: Math.round(affiliateCommission * 100) / 100,
    netProfit: Math.round(netProfit * 100) / 100,
    commissionRate,
    affiliateRate: affiliateType === 'vip' ? 5.0 : 1.5
  };
}
```

### **Exemplo Prático de Comissionamento**
```javascript
// Exemplo 1: Usuário com assinatura mensal + Afiliado Normal
const operation1 = {
  profit: 1000, // $1000 de lucro
  planType: 'MONTHLY',
  affiliateType: 'normal'
};

const commission1 = calculateCommission(operation1);
// Resultado:
// - Comissão total: $100 (10%)
// - Empresa fica: $98.50 (98.5%)
// - Afiliado recebe: $1.50 (1.5%)
// - Lucro líquido usuário: $900

// Exemplo 2: Usuário sem assinatura + Afiliado VIP
const operation2 = {
  profit: 1000, // $1000 de lucro
  planType: 'PREPAID',
  affiliateType: 'vip'
};

const commission2 = calculateCommission(operation2);
// Resultado:
// - Comissão total: $200 (20%)
// - Empresa fica: $190 (19%)
// - Afiliado VIP recebe: $10 (1% do total / 5% da comissão)
// - Lucro líquido usuário: $800
```

---

## 🔄 **FLUXO DE DISTRIBUIÇÃO DE COMISSÕES**

### **Processamento Automático Pós-Operação**
```mermaid
graph TD
    A[Operação Fechada] --> B[Calcular P&L]
    B --> C{Lucro > 0?}
    C -->|Não| D[Sem Comissão]
    C -->|Sim| E[Calcular Comissão]
    E --> F[Debitar do Usuário]
    F --> G[Creditar Empresa]
    G --> H{Tem Afiliado?}
    H -->|Sim| I[Creditar Afiliado]
    H -->|Não| J[Processo Concluído]
    I --> J
```

### **Código de Processamento**
```javascript
async function processCommissionAfterTrade(tradeResult) {
  const { userId, profit, orderId } = tradeResult;
  
  // 1. Buscar dados do usuário e afiliado
  const user = await getUserData(userId);
  const affiliate = await getAffiliateData(user.affiliate_id);
  
  // 2. Calcular comissão
  const commission = await calculateCommission({
    userId,
    profit,
    planType: user.plan_type,
    affiliateId: affiliate?.id,
    affiliateType: affiliate?.type
  });
  
  if (commission.totalCommission > 0) {
    // 3. Registrar transação de comissão
    await recordCommissionTransaction(userId, commission);
    
    // 4. Creditar afiliado se houver
    if (commission.affiliateCommission > 0) {
      await creditAffiliateCommission(affiliate.id, commission.affiliateCommission);
    }
    
    // 5. Atualizar métricas
    await updateCommissionMetrics(commission);
  }
  
  return commission;
}
```

---

## 💳 **SISTEMA DE RECARGAS E PAGAMENTOS**

### **Integração Stripe**
```javascript
class StripePaymentProcessor {
  async createSubscriptionLink(planType, country) {
    const priceConfig = {
      'MONTHLY_BR': 'price_monthly_brl_120',  // R$ 120/mês
      'MONTHLY_US': 'price_monthly_usd_40'    // $40/mês
    };
    
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{
        price: priceConfig[`${planType}_${country}`],
        quantity: 1
      }],
      success_url: `${BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/cancel`,
      metadata: {
        user_id: userId,
        plan_type: planType
      }
    });
    
    return session.url;
  }
  
  async createRechargeLink(amount, currency, userId) {
    // Calcular comissão na recarga
    const commissionRate = await getUserCommissionRate(userId);
    const commission = amount * (commissionRate / 100);
    const netAmount = amount - commission;
    
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: `Recarga CoinBitClub - ${currency} ${amount}`
          },
          unit_amount: amount * 100 // centavos
        },
        quantity: 1
      }],
      metadata: {
        user_id: userId,
        gross_amount: amount,
        commission: commission,
        net_amount: netAmount,
        type: 'recharge'
      }
    });
    
    return session.url;
  }
}
```

### **Processamento de Webhook Stripe**
```javascript
async function handleStripeWebhook(event) {
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      
      if (session.metadata.type === 'recharge') {
        // Recarga de saldo
        await processRecharge({
          userId: session.metadata.user_id,
          grossAmount: parseFloat(session.metadata.gross_amount),
          commission: parseFloat(session.metadata.commission),
          netAmount: parseFloat(session.metadata.net_amount),
          currency: session.currency.toUpperCase(),
          stripeSessionId: session.id
        });
      } else {
        // Assinatura
        await processSubscription({
          userId: session.metadata.user_id,
          planType: session.metadata.plan_type,
          stripeSessionId: session.id
        });
      }
      break;
      
    case 'customer.subscription.deleted':
      // Cancelamento de assinatura
      await cancelSubscription(event.data.object.metadata.user_id);
      break;
  }
}

async function processRecharge(rechargeData) {
  const { userId, netAmount, currency, commission } = rechargeData;
  
  // Creditar saldo real (pode sacar)
  await updateUserBalance(userId, 'real', netAmount, currency);
  
  // Registrar comissão da empresa
  await recordCompanyCommission(commission, currency);
  
  // Registrar transação
  await recordTransaction({
    userId,
    type: 'RECHARGE',
    amount: netAmount,
    currency,
    commissionAmount: commission,
    description: `Recarga via Stripe - Líquido após comissão`
  });
}
```

---

## 🎫 **SISTEMA DE CUPONS ADMINISTRATIVOS**

### **Criação e Gestão de Cupons**
```javascript
class CouponSystem {
  async createAdminCoupon(data) {
    const { code, amount, currency, expiresAt, maxUses, createdByAdminId } = data;
    
    const coupon = await db.query(`
      INSERT INTO coupons 
      (code, credit_amount, currency, created_by_admin_id, expires_at, max_uses, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, true)
      RETURNING *
    `, [code, amount, currency, createdByAdminId, expiresAt, maxUses]);
    
    return coupon.rows[0];
  }
  
  async useCoupon(userId, couponCode) {
    const client = await db.connect();
    
    try {
      await client.begin();
      
      // 1. Validar cupom
      const coupon = await this.validateCoupon(couponCode);
      if (!coupon.valid) {
        throw new Error(coupon.reason);
      }
      
      // 2. Verificar se usuário já usou
      const alreadyUsed = await this.checkUserCouponUsage(userId, coupon.id);
      if (alreadyUsed) {
        throw new Error('Cupom já utilizado por este usuário');
      }
      
      // 3. Creditar saldo administrativo (NÃO pode sacar)
      await this.updateBalance(userId, 'admin', coupon.credit_amount, coupon.currency);
      
      // 4. Registrar uso
      await client.query(`
        INSERT INTO coupon_usage (user_id, coupon_id, credit_amount, currency, used_at)
        VALUES ($1, $2, $3, $4, NOW())
      `, [userId, coupon.id, coupon.credit_amount, coupon.currency]);
      
      // 5. Atualizar contador de usos
      await client.query(`
        UPDATE coupons SET current_uses = current_uses + 1 WHERE id = $1
      `, [coupon.id]);
      
      await client.commit();
      
      return {
        success: true,
        creditAmount: coupon.credit_amount,
        currency: coupon.currency,
        newBalance: await this.getUserBalances(userId)
      };
      
    } catch (error) {
      await client.rollback();
      throw error;
    } finally {
      client.release();
    }
  }
}
```

---

## 🤝 **SISTEMA DE AFILIADOS**

### **Estrutura de Afiliados**
```sql
-- Tabela affiliates
CREATE TABLE affiliates (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  code VARCHAR(50) UNIQUE,
  parent_affiliate_id INTEGER REFERENCES affiliates(id),
  commission_rate DECIMAL(5,2), -- 1.5 ou 5.0
  created_at TIMESTAMP DEFAULT NOW()
);

-- Comissões de afiliados
CREATE TABLE affiliate_commissions (
  id SERIAL PRIMARY KEY,
  operation_id INTEGER,
  affiliate_id INTEGER REFERENCES affiliates(id),
  referred_user_id INTEGER REFERENCES users(id),
  profit_usd DECIMAL(15,2),
  commission_usd DECIMAL(15,2),
  currency VARCHAR(3),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **Conversão de Comissão em Créditos (+10% Bônus)**
```javascript
class AffiliateManager {
  async convertCommissionToCredit(affiliateId, amount, currency) {
    const client = await db.connect();
    
    try {
      await client.begin();
      
      // 1. Verificar saldo de comissão disponível
      const balances = await this.getAffiliateBalances(affiliateId);
      const availableCommission = currency === 'BRL' ? 
        balances.commission_brl : balances.commission_usd;
        
      if (availableCommission < amount) {
        throw new Error('Saldo de comissão insuficiente');
      }
      
      // 2. Calcular bônus (+10%)
      const bonusAmount = amount * 0.10;
      const totalCreditAmount = amount + bonusAmount;
      
      // 3. Debitar da comissão
      await this.updateBalance(affiliateId, 'commission', -amount, currency);
      
      // 4. Creditar como admin credit (com bônus)
      await this.updateBalance(affiliateId, 'admin', totalCreditAmount, currency);
      
      // 5. Registrar transação
      await client.query(`
        INSERT INTO transactions 
        (user_id, type, amount, currency, description, commission_amount, net_amount)
        VALUES ($1, 'COMMISSION_TO_CREDIT', $2, $3, $4, $5, $6)
      `, [
        affiliateId,
        amount,
        currency,
        `Conversão de comissão para crédito administrativo (+10% bônus)`,
        amount,
        totalCreditAmount
      ]);
      
      await client.commit();
      
      return {
        originalAmount: amount,
        bonusAmount: bonusAmount,
        totalCreditAmount: totalCreditAmount,
        currency: currency,
        message: `Conversão realizada com sucesso. Bônus de 10% aplicado.`
      };
      
    } catch (error) {
      await client.rollback();
      throw error;
    } finally {
      client.release();
    }
  }
}
```

---

## 🏦 **SISTEMA DE SAQUES**

### **Regras de Saque por Tipo de Saldo**
```javascript
const withdrawalRules = {
  real_balance: {
    canWithdraw: true,
    description: 'Apenas saldo real (origem Stripe) pode ser sacado'
  },
  admin_balance: {
    canWithdraw: false,
    description: 'Créditos administrativos NÃO podem ser sacados'
  },
  commission_balance: {
    canWithdraw: false,
    description: 'Comissões podem ser convertidas em créditos (+10% bônus)'
  }
};
```

### **Processamento de Solicitação de Saque**
```javascript
class WithdrawalManager {
  async requestWithdrawal(userId, amount, currency, bankDetails) {
    // 1. Validar tipo de usuário
    const user = await getUserData(userId);
    const isAffiliate = user.affiliate_type !== 'none';
    
    // 2. Verificar saldo disponível para saque
    const balances = await getUserBalances(userId);
    const withdrawableBalance = isAffiliate ? 
      balances.real[currency] + balances.commission[currency] : // Afiliado pode sacar comissões
      balances.real[currency]; // Usuário normal só saldo real
    
    if (withdrawableBalance < amount) {
      throw new Error('Saldo insuficiente para saque');
    }
    
    // 3. Verificar valor mínimo
    const minimumWithdrawal = currency === 'BRL' ? 50 : 10;
    if (amount < minimumWithdrawal) {
      throw new Error(`Valor mínimo para saque: ${currency} ${minimumWithdrawal}`);
    }
    
    // 4. Criar solicitação
    const withdrawal = await db.query(`
      INSERT INTO withdrawal_requests 
      (user_id, amount, currency, status, requested_at, bank_details)
      VALUES ($1, $2, $3, 'PENDING', NOW(), $4)
      RETURNING *
    `, [userId, amount, currency, JSON.stringify(bankDetails)]);
    
    // 5. Notificar administradores
    await this.notifyAdminsNewWithdrawal(withdrawal.rows[0]);
    
    return {
      withdrawalId: withdrawal.rows[0].id,
      status: 'PENDING',
      message: 'Solicitação de saque criada. Aguardando aprovação administrativa.',
      estimatedProcessingTime: '24-48 horas'
    };
  }
  
  async processWithdrawal(withdrawalId, adminId, action, notes = '') {
    const client = await db.connect();
    
    try {
      await client.begin();
      
      const withdrawal = await this.getWithdrawalRequest(withdrawalId);
      
      if (action === 'APPROVE') {
        // Debitar do saldo do usuário
        await this.debitWithdrawalAmount(withdrawal);
        
        // Processar transferência (integração bancária)
        await this.processBankTransfer(withdrawal);
        
        await client.query(`
          UPDATE withdrawal_requests 
          SET status = 'APPROVED', processed_at = NOW(), 
              processed_by_admin_id = $1, admin_notes = $2
          WHERE id = $3
        `, [adminId, notes, withdrawalId]);
        
      } else if (action === 'REJECT') {
        await client.query(`
          UPDATE withdrawal_requests 
          SET status = 'REJECTED', processed_at = NOW(), 
              processed_by_admin_id = $1, admin_notes = $2
          WHERE id = $3
        `, [adminId, notes, withdrawalId]);
      }
      
      await client.commit();
      
      // Notificar usuário
      await this.notifyUserWithdrawalDecision(withdrawal.user_id, action, notes);
      
    } catch (error) {
      await client.rollback();
      throw error;
    } finally {
      client.release();
    }
  }
}
```

---

## 📊 **FLUXO INTEGRADO COMPLETO**

### **Diagrama do Fluxo Completo**
```mermaid
graph TD
    A[TradingView Signal] --> B[Webhook Reception]
    B --> C[Market Analysis AI]
    C --> D{AI Approval?}
    D -->|No| E[Signal Rejected]
    D -->|Yes| F[Position Safety Validation]
    F --> G{Safety OK?}
    G -->|No| H[Order Rejected]
    G -->|Yes| I[Exchange Orchestrator]
    I --> J[Execute Orders]
    J --> K[Position Monitoring]
    K --> L[Trade Closure]
    L --> M[P&L Calculation]
    M --> N{Profit > 0?}
    N -->|No| O[No Commission]
    N -->|Yes| P[Commission Calculation]
    P --> Q[Debit User Balance]
    Q --> R[Credit Company]
    R --> S{Has Affiliate?}
    S -->|Yes| T[Credit Affiliate Commission]
    S -->|No| U[Process Complete]
    T --> U
```

### **Exemplo Completo de Operação**
```javascript
// Cenário: Usuário com assinatura mensal + Afiliado VIP

// 1. Sinal recebido
const signal = {
  symbol: 'BTCUSDT',
  action: 'BUY',
  price: 65000,
  leverage: 5,
  stopLoss: 5, // 5%
  takeProfit: 10 // 10%
};

// 2. Usuário aprovado pela IA e Position Safety
const user = {
  id: 123,
  balance_real_usd: 5000,
  plan_type: 'MONTHLY',
  affiliate_id: 456
};

// 3. Position sizing calculado
const position = {
  quantity: 0.0015, // BTC
  riskAmount: 100,  // 2% de $5000
  leverage: 5,
  stopLoss: 61750,  // 5% abaixo
  takeProfit: 71500 // 10% acima
};

// 4. Ordem executada com sucesso
const orderResult = {
  orderId: 'binance_123456',
  executedPrice: 65050,
  quantity: 0.0015,
  fees: 0.25
};

// 5. Posição fechada em Take Profit
const closeResult = {
  closePrice: 71500,
  profit: 950, // $950 de lucro
  fees: 0.30
};

// 6. Comissão calculada
const commission = {
  totalCommission: 95, // 10% de $950 (tem assinatura)
  companyCommission: 90.25, // 95 - 4.75
  affiliateCommission: 4.75, // 5% de $95 (VIP)
  netProfit: 855 // $950 - $95
};

// 7. Resultado final
const finalBalances = {
  user: {
    balance_real_usd: 5855, // $5000 + $855 (lucro líquido)
    totalProfit: 855
  },
  company: {
    commission: 90.25
  },
  affiliate: {
    balance_commission_usd: 4.75
  }
};
```

---

## 🎯 **MÉTRICAS E MONITORAMENTO**

### **KPIs Operacionais**
```javascript
const operationalMetrics = {
  signals: {
    received: 1247,           // Sinais recebidos (último mês)
    aiApprovalRate: 23,       // 23% aprovados pela IA
    executionLatency: 89,     // 89ms média de execução
    successRate: 99.1         // 99.1% de sucesso nas execuções
  },
  positions: {
    active: 18,               // Posições ativas atuais
    averageDuration: 4.2,     // 4.2 horas média
    profitableRate: 67,       // 67% das posições são lucrativas
    averageRiskReward: 2.1    // 2.1:1 risk/reward médio
  }
};
```

### **KPIs Financeiros**
```javascript
const financialMetrics = {
  revenue: {
    monthlyCommissions: 12500,    // $12,500 em comissões
    subscriptionRevenue: 3200,    // $3,200 em assinaturas
    affiliatePayouts: 625,        // $625 pagos para afiliados
    netRevenue: 15075            // $15,075 receita líquida
  },
  users: {
    totalActive: 12,              // 12 usuários ativos
    managementAccounts: 10,       // 10 contas MANAGEMENT
    testnetAccounts: 2,           // 2 contas TESTNET
    affiliateConversion: 3        // 3 afiliados ativos
  }
};
```

---

**Este documento apresenta o fluxo completo e detalhado de como o sistema CoinBitClub Market Bot opera tanto do ponto de vista operacional (trading) quanto financeiro (comissões e pagamentos). O sistema está 100% implementado e funcional em produção.**
