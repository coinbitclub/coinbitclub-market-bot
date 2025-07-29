# 📱 DOCUMENTAÇÃO FRONTEND API - COINBITCLUB

## 📋 VISÃO GERAL PARA DESENVOLVEDOR FRONTEND

Esta documentação fornece todas as especificações necessárias para desenvolver o frontend do sistema CoinBitClub, incluindo perfis de usuário, APIs disponíveis, estruturas de dados e funcionalidades por nível de acesso.

---

## 🔐 SISTEMA DE AUTENTICAÇÃO E PERFIS

### 🎯 NÍVEIS DE ACESSO (5 PERFIS)

#### 1. **ADMIN** (Administrador Geral)
```json
{
  "role": "ADMIN",
  "access_level": 5,
  "permissions": [
    "view_all_data",
    "user_management", fron
    "system_configuration",
    "financial_full_access",
    "audit_logs",
    "database_operations"
  ]
}
```

#### 2. **GESTOR** (Gestor Operacional)
```json
{
  "role": "GESTOR", 
  "access_level": 4,
  "permissions": [
    "view_operations",
    "financial_data",
    "affiliate_management",
    "user_operations",
    "commission_management"
  ]
}
```

#### 3. **OPERADOR** (Operador de Trading)
```json
{
  "role": "OPERADOR",
  "access_level": 3,
  "permissions": [
    "view_operations",
    "basic_financial",
    "signal_monitoring",
    "operation_management"
  ]
}
```

#### 4. **AFILIADO** (Afiliado/Parceiro)
```json
{
  "role": "AFILIADO",
  "access_level": 2,
  "permissions": [
    "view_own_data",
    "affiliate_earnings",
    "referral_management",
    "commission_tracking"
  ]
}
```

#### 5. **USUARIO** (Usuário Final)
```json
{
  "role": "USUARIO",
  "access_level": 1,
  "permissions": [
    "view_own_operations",
    "account_settings",
    "basic_dashboard"
  ]
}
```

---

## 🚀 APIS DISPONÍVEIS

### 🏠 BASE URLs
```
# Webhook Service (Porta 3000)
http://localhost:3000/api

# Central Indicators API (Porta 3003) 
http://localhost:3003/api

# Produção Railway
https://coinbitclub-market-bot.up.railway.app/api
```

### ⚙️ **ARQUITETURA MULTI-SERVIÇOS**

O sistema CoinBitClub usa arquitetura de **multi-serviços** para separar responsabilidades:

#### **🎯 Serviço Principal (Porta 3000)**
- **Arquivo:** `server-multiservice-complete.cjs`
- **Responsabilidades:**
  - Webhook TradingView (`/api/webhooks/signal`)
  - Processamento de sinais
  - IA Supervisor de Trade
  - Sistema de monitoramento

#### **📊 Central de Indicadores (Porta 3003)**
- **Arquivo:** `api-central-indicadores.js`
- **Responsabilidades:**
  - APIs de dashboard
  - Gestão de usuários
  - Sistema financeiro
  - Afiliados e comissões

#### **⚠️ CONFIGURAÇÃO CRÍTICA**

Para evitar erros 502 e problemas de deploy:

```toml
# railway.toml - SEMPRE usar servidor multiservice
[build]
builder = "DOCKERFILE"

[deploy]
startCommand = "node server-multiservice-complete.cjs"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[environments.production.variables]
NODE_ENV = "production"
PORT = "3000"
```

```dockerfile
# Dockerfile - SEMPRE especificar servidor correto
# Use Node.js 18 Alpine image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm install --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# ⚠️ CRÍTICO: Usar servidor multiservice
CMD ["node", "server-multiservice-complete.cjs"]
```

### 🔑 AUTENTICAÇÃO
Todas as requisições devem incluir:
```javascript
headers: {
  'Authorization': 'Bearer ${token}',
  'Content-Type': 'application/json'
}
```

---

## 📊 ENDPOINTS POR FUNCIONALIDADE

### 1. **DASHBOARD PRINCIPAL**

#### `GET /api/dashboard/:userId`
**Função:** Dashboard personalizado por nível de acesso
**Parâmetros:** userId (integer)
**Acesso:** Todos os perfis

**Resposta por Perfil:**

```javascript
// ADMIN - Dashboard Completo
{
  "user": {
    "id": 1,
    "name": "Admin",
    "role": "ADMIN",
    "access_level": 5
  },
  "financial_summary": {
    "total_revenue_real": 15420.50,
    "total_revenue_bonus": 8730.25,
    "total_commissions_paid": 2184.75,
    "operational_expenses": 1200.00,
    "net_profit": 12035.75
  },
  "operations_summary": {
    "total_operations": 156,
    "open_positions": 3,
    "closed_positions": 153,
    "success_rate": 68.5,
    "total_pnl": 8456.30
  },
  "users_summary": {
    "total_users": 9,
    "active_users": 9,
    "vip_users": 2,
    "affiliates": 2
  },
  "recent_activities": [...],
  "system_health": {
    "webhook_status": "active",
    "database_status": "connected",
    "ai_supervisor_status": "operational"
  }
}

// GESTOR - Dashboard Operacional
{
  "user": {...},
  "operations_summary": {...},
  "financial_summary": {
    // Sem detalhes sensíveis
    "revenue_overview": "positive",
    "commission_status": "up_to_date"
  },
  "affiliate_summary": {...},
  "recent_operations": [...]
}

// OPERADOR - Dashboard Operações
{
  "user": {...},
  "operations_summary": {...},
  "open_positions": [...],
  "recent_signals": [...],
  "trading_performance": {...}
}

// AFILIADO - Dashboard Comissões
{
  "user": {...},
  "affiliate_stats": {
    "total_referrals": 5,
    "active_referrals": 4,
    "total_commissions": 1250.75,
    "pending_commissions": 150.25,
    "commission_rate": "5.0%"
  },
  "referral_performance": [...],
  "commission_history": [...]
}

// USUARIO - Dashboard Pessoal
{
  "user": {...},
  "personal_operations": [...],
  "account_balance": {...},
  "recent_activity": [...]
}
```

### 2. **OPERAÇÕES DE TRADING**

#### `GET /api/operations/:userId`
**Função:** Lista operações por usuário
**Acesso:** Conforme nível de acesso

```javascript
// Resposta
{
  "operations": [
    {
      "id": 1,
      "user_id": 1,
      "symbol": "BTCUSDT",
      "type": "LONG",
      "entry_price": 43250.50,
      "exit_price": 44120.75,
      "quantity": 0.1,
      "leverage": 5,
      "take_profit": 45200.00,
      "stop_loss": 41850.00,
      "pnl": 87.02,
      "status": "CLOSED",
      "revenue_type": "REAL",
      "signal_source": "TradingView",
      "opened_at": "2025-07-29T10:30:00Z",
      "closed_at": "2025-07-29T12:15:00Z",
      "reason": "TAKE_PROFIT"
    }
  ],
  "summary": {
    "total_operations": 25,
    "open_positions": 2,
    "total_pnl": 1250.75,
    "success_rate": 72.5
  }
}
```

#### `GET /api/operations/live`
**Função:** Operações em tempo real
**Acesso:** ADMIN, GESTOR, OPERADOR

```javascript
{
  "live_operations": [
    {
      "id": 15,
      "user_id": 2,
      "symbol": "ETHUSDT",
      "type": "SHORT",
      "entry_price": 2890.50,
      "current_price": 2875.25,
      "unrealized_pnl": 152.50,
      "take_profit": 2750.00,
      "stop_loss": 3020.00,
      "time_open": "00:45:30",
      "status": "OPEN"
    }
  ]
}
```

### 3. **SISTEMA FINANCEIRO**

#### `GET /api/financial/summary`
**Função:** Resumo financeiro geral
**Acesso:** ADMIN, GESTOR

```javascript
{
  "revenue": {
    "real": {
      "total": 25450.75,
      "current_month": 8730.25,
      "growth_rate": 15.5
    },
    "bonus": {
      "total": 12340.50,
      "current_month": 4250.00,
      "note": "Não gera comissões"
    }
  },
  "expenses": {
    "total": 1200.00,
    "categories": {
      "infrastructure": 800.00,
      "apis": 250.00,
      "others": 150.00
    }
  },
  "commissions": {
    "total_paid": 3825.50,
    "pending": 450.25,
    "next_payment": "2025-08-01"
  }
}
```

#### `GET /api/financial/revenue-classification`
**Função:** Classificação REAL vs BONUS
**Acesso:** ADMIN, GESTOR, AFILIADO

```javascript
{
  "classification_logic": {
    "real": "Usuários com pagamento Stripe confirmado",
    "bonus": "Usuários com créditos do sistema"
  },
  "current_classification": [
    {
      "user_id": 1,
      "name": "João Silva",
      "type": "REAL",
      "payment_method": "STRIPE",
      "generates_commission": true
    },
    {
      "user_id": 2,
      "name": "Maria Santos",
      "type": "BONUS",
      "payment_method": "SYSTEM_CREDIT",
      "generates_commission": false
    }
  ]
}
```

### 4. **SISTEMA DE AFILIADOS**

#### `GET /api/affiliates/:userId`
**Função:** Dashboard de afiliados
**Acesso:** ADMIN, GESTOR, AFILIADO (próprios dados)

```javascript
{
  "affiliate_info": {
    "id": 3,
    "name": "Carlos Afiliado",
    "commission_rate": "5.0%",
    "vip_status": true,
    "referral_code": "CARLOS2025"
  },
  "referrals": [
    {
      "user_id": 5,
      "name": "Cliente Indicado",
      "signup_date": "2025-07-15",
      "status": "active",
      "revenue_type": "REAL",
      "total_operations": 12,
      "generated_commission": 245.50
    }
  ],
  "commissions": {
    "total_earned": 1820.75,
    "current_month": 450.25,
    "pending": 120.50,
    "last_payment": "2025-07-25"
  },
  "performance": {
    "total_referrals": 8,
    "active_referrals": 6,
    "conversion_rate": 75.0
  }
}
```

#### `GET /api/affiliates/commission-structure`
**Função:** Estrutura de comissionamento
**Acesso:** ADMIN, GESTOR, AFILIADO

```javascript
{
  "commission_rates": {
    "standard": {
      "rate": "1.5%",
      "applies_to": "Afiliados normais",
      "calculation": "1.5% sobre lucro REAL"
    },
    "vip": {
      "rate": "5.0%", 
      "applies_to": "Afiliados VIP",
      "calculation": "5.0% sobre lucro REAL"
    }
  },
  "requirements": {
    "minimum_profit": "$1.00 USD",
    "revenue_type": "REAL only",
    "payment_frequency": "Instantâneo ao lucro"
  },
  "exclusions": {
    "bonus_operations": "Não geram comissão",
    "system_credits": "Não contabilizados"
  }
}
```

### 5. **CONFIGURAÇÕES DE TRADING**

#### `GET /api/trading/configurations/:userId`
**Função:** Configurações TP/SL do usuário
**Acesso:** ADMIN, GESTOR, USUARIO (próprias)

```javascript
{
  "user_id": 1,
  "configurations": {
    "leverage_default": 5,
    "take_profit_multiplier": 3,
    "stop_loss_multiplier": 2,
    "calculated_tp_percent": 15.0,
    "calculated_sl_percent": 10.0,
    "balance_percentage_per_trade": 30.0,
    "max_open_positions": 2
  },
  "limits": {
    "leverage_max": 10,
    "take_profit_max_multiplier": 5,
    "stop_loss_max_multiplier": 4
  },
  "formulas": {
    "tp_calculation": "leverage × tp_multiplier",
    "sl_calculation": "leverage × sl_multiplier"
  }
}
```

#### `PUT /api/trading/configurations/:userId`
**Função:** Atualizar configurações
**Acesso:** ADMIN, GESTOR, USUARIO (próprias)

```javascript
// Request Body
{
  "leverage_default": 7,
  "take_profit_multiplier": 3,
  "stop_loss_multiplier": 2,
  "balance_percentage_per_trade": 25.0,
  "max_open_positions": 3
}

// Response
{
  "success": true,
  "message": "Configurações atualizadas",
  "new_calculations": {
    "tp_percent": 21.0,
    "sl_percent": 14.0
  }
}
```

### 6. **MONITORAMENTO EM TEMPO REAL**

#### `GET /api/monitoring/system-status`
**Função:** Status do sistema
**Acesso:** ADMIN, GESTOR, OPERADOR

```javascript
{
  "system_health": {
    "webhook_service": {
      "status": "active",
      "port": 3000,
      "last_signal": "2025-07-29T14:30:15Z"
    },
    "central_indicators": {
      "status": "active", 
      "port": 3003,
      "response_time": "120ms"
    },
    "ai_supervisor": {
      "status": "operational",
      "last_activity": "2025-07-29T14:35:00Z",
      "monitoring_interval": "30s"
    },
    "database": {
      "status": "connected",
      "connection_pool": "healthy",
      "response_time": "45ms"
    }
  },
  "integrations": {
    "fear_greed_api": {
      "status": "active",
      "current_value": 73,
      "classification": "Greed"
    },
    "tradingview_webhook": {
      "status": "ready",
      "endpoint": "http://localhost:3000/webhook"
    }
  }
}
```

#### `GET /api/monitoring/recent-activities`
**Função:** Atividades recentes
**Acesso:** Conforme nível

```javascript
{
  "activities": [
    {
      "timestamp": "2025-07-29T14:35:00Z",
      "type": "SIGNAL_RECEIVED",
      "description": "Sinal LONG recebido para BTCUSDT",
      "user": "Sistema",
      "status": "processed"
    },
    {
      "timestamp": "2025-07-29T14:34:30Z",
      "type": "OPERATION_CLOSED",
      "description": "Operação ETHUSDT fechada com lucro",
      "user": "João Silva",
      "pnl": 125.50
    },
    {
      "timestamp": "2025-07-29T14:30:15Z",
      "type": "COMMISSION_PAID", 
      "description": "Comissão paga para afiliado",
      "amount": 18.75,
      "affiliate": "Carlos Afiliado"
    }
  ]
}
```

### 7. **SINAIS E TRADING VIEW**

#### `GET /api/signals/recent`
**Função:** Sinais recentes
**Acesso:** ADMIN, GESTOR, OPERADOR

```javascript
{
  "signals": [
    {
      "id": 45,
      "source": "TradingView",
      "symbol": "BTCUSDT",
      "action": "SINAL LONG",
      "timestamp": "2025-07-29T14:30:00Z",
      "processed": true,
      "operations_opened": 3,
      "fear_greed_value": 73
    },
    {
      "id": 44,
      "source": "TradingView", 
      "symbol": "ETHUSDT",
      "action": "FECHE SHORT",
      "timestamp": "2025-07-29T14:25:00Z",
      "processed": true,
      "operations_closed": 2
    }
  ],
  "signal_types": {
    "accepted": [
      "SINAL LONG",
      "SINAL LONG FORTE", 
      "SINAL SHORT",
      "SINAL SHORT FORTE",
      "FECHE LONG",
      "FECHE SHORT",
      "CONFIRMAÇÃO LONG",
      "CONFIRMAÇÃO SHORT"
    ]
  }
}
```

#### `GET /api/signals/statistics`
**Função:** Estatísticas de sinais
**Acesso:** ADMIN, GESTOR, OPERADOR

```javascript
{
  "statistics": {
    "total_signals_received": 156,
    "signals_processed": 148,
    "signals_rejected": 8,
    "rejection_reasons": {
      "timeout": 6,
      "invalid_format": 2
    },
    "success_rate": 68.5,
    "average_processing_time": "1.2s"
  },
  "performance_by_symbol": [
    {
      "symbol": "BTCUSDT",
      "total_signals": 45,
      "success_rate": 72.0,
      "total_pnl": 2345.50
    }
  ]
}
```

---

## 🎨 COMPONENTES FRONTEND RECOMENDADOS

### 1. **LAYOUT PRINCIPAL**

```jsx
// Layout com sidebar responsiva baseada no perfil
<Layout>
  <Sidebar userRole={user.role} />
  <Header user={user} />
  <MainContent>
    <Routes>
      {/* Rotas baseadas em permissões */}
    </Routes>
  </MainContent>
</Layout>
```

### 2. **DASHBOARD CARDS**

```jsx
// Cards adaptativos por perfil
<DashboardGrid>
  {user.role === 'ADMIN' && (
    <>
      <FinancialSummaryCard />
      <UserManagementCard />
      <SystemHealthCard />
    </>
  )}
  
  {user.role === 'GESTOR' && (
    <>
      <OperationsSummaryCard />
      <AffiliateManagementCard />
      <CommissionCard />
    </>
  )}
  
  {user.role === 'AFILIADO' && (
    <>
      <AffiliateStatsCard />
      <CommissionHistoryCard />
      <ReferralManagementCard />
    </>
  )}
  
  {user.role === 'USUARIO' && (
    <>
      <PersonalOperationsCard />
      <AccountBalanceCard />
      <TradingConfigCard />
    </>
  )}
</DashboardGrid>
```

### 3. **TABELAS DE DADOS**

```jsx
// Tabela de operações com filtros
<OperationsTable
  data={operations}
  filters={{
    dateRange: true,
    symbol: true,
    type: true,
    status: true,
    revenueType: user.role !== 'USUARIO'
  }}
  columns={{
    showRevenueType: ['ADMIN', 'GESTOR', 'AFILIADO'].includes(user.role),
    showAllUsers: ['ADMIN', 'GESTOR'].includes(user.role),
    showCommissions: user.role === 'AFILIADO'
  }}
/>
```

### 4. **FORMS DE CONFIGURAÇÃO**

```jsx
// Form de configurações TP/SL
<TradingConfigForm
  userId={user.id}
  canEdit={['ADMIN', 'GESTOR'].includes(user.role) || user.id === targetUserId}
  onSubmit={handleConfigUpdate}
  validation={{
    leverageMax: 10,
    tpMaxMultiplier: 5,
    slMaxMultiplier: 4
  }}
/>
```

### 5. **GRÁFICOS E VISUALIZAÇÕES**

```jsx
// Gráficos adaptativos por perfil
<ChartsContainer>
  {user.role === 'ADMIN' && (
    <>
      <RevenueChart />
      <UserGrowthChart />
      <SystemPerformanceChart />
    </>
  )}
  
  {user.role === 'AFILIADO' && (
    <>
      <CommissionChart />
      <ReferralPerformanceChart />
    </>
  )}
  
  <OperationsChart userId={user.role === 'USUARIO' ? user.id : null} />
</ChartsContainer>
```

---

## 🔄 TEMPO REAL E WEBSOCKETS

### **WebSocket Connection**
```javascript
// Conexão WebSocket para updates em tempo real
const ws = new WebSocket('ws://localhost:3003/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch(data.type) {
    case 'OPERATION_UPDATE':
      updateOperationInUI(data.operation);
      break;
    case 'NEW_SIGNAL':
      showSignalNotification(data.signal);
      break;
    case 'COMMISSION_PAID':
      updateCommissionDisplay(data.commission);
      break;
    case 'SYSTEM_ALERT':
      showSystemAlert(data.alert);
      break;
  }
};
```

### **Real-time Updates por Perfil**
```javascript
// Diferentes tipos de updates por perfil
const subscribeToUpdates = (userRole) => {
  const subscriptions = {
    'ADMIN': ['ALL_OPERATIONS', 'SYSTEM_HEALTH', 'FINANCIAL_UPDATES', 'USER_ACTIVITIES'],
    'GESTOR': ['OPERATIONS', 'COMMISSIONS', 'AFFILIATE_ACTIVITIES'],
    'OPERADOR': ['OPERATIONS', 'SIGNALS', 'SYSTEM_STATUS'],
    'AFILIADO': ['OWN_COMMISSIONS', 'REFERRAL_ACTIVITIES'],
    'USUARIO': ['OWN_OPERATIONS', 'ACCOUNT_UPDATES']
  };
  
  return subscriptions[userRole] || [];
};
```

---

## �️ TROUBLESHOOTING E BOAS PRÁTICAS

### **🚨 PROBLEMAS COMUNS E SOLUÇÕES**

#### **1. Erro 502 no Railway**
**Causa:** Servidor incorreto configurado no deploy
**Solução:**
```bash
# Verificar configuração atual
railway status

# Corrigir variável de ambiente
railway variables:set RAILWAY_START_COMMAND="node server-multiservice-complete.cjs"

# Redeploy
railway up --detach
```

#### **2. Webhook TradingView 404**
**Causa:** Endpoint `/api/webhooks/signal` não implementado
**Solução:**
```javascript
// Verificar se está no servidor multiservice
// server-multiservice-complete.cjs deve conter:
app.post('/api/webhooks/signal', authenticateWebhook, (req, res) => {
  // Processamento do sinal
});
```

#### **3. Erro "Module not found"**
**Causa:** Imports de rotas inexistentes
**Solução:**
```javascript
// Comentar imports não existentes
// const whatsappRoutes = require('./routes/whatsappRoutes');
// const zapiWebhookRoutes = require('./routes/zapiWebhookRoutes');
```

#### **4. Tabela "operacao_monitoramento" não existe**
**Causa:** Schema IA Supervisor não aplicado
**Solução:**
```sql
-- Criar tabela necessária
CREATE TABLE IF NOT EXISTS operacao_monitoramento (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    operation_id UUID NOT NULL REFERENCES operations(id),
    user_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'ativa',
    timestamp TIMESTAMP DEFAULT NOW()
);
```

### **✅ CHECKLIST PRÉ-DEPLOY**

#### **Configurações Railway**
- [ ] `railway.toml` usa `server-multiservice-complete.cjs`
- [ ] `Dockerfile` especifica comando correto
- [ ] Variáveis de ambiente configuradas
- [ ] PORT definido como 3000

#### **Estrutura do Código**
- [ ] Server multiservice existe e funciona
- [ ] Webhook `/api/webhooks/signal` implementado
- [ ] Imports de rotas verificados (sem módulos inexistentes)
- [ ] Tabelas necessárias criadas no banco

#### **Teste Local**
- [ ] `node server-multiservice-complete.cjs` funciona
- [ ] Endpoints respondem corretamente
- [ ] Webhook recebe sinais TradingView
- [ ] Banco de dados conecta

### **🔧 COMANDOS DE VERIFICAÇÃO**

```bash
# Verificar se servidor multiservice existe
ls -la | grep server-multiservice

# Testar servidor localmente
node server-multiservice-complete.cjs

# Verificar configuração Railway
railway status
railway variables

# Testar webhook após deploy
curl -X GET "https://coinbitclub-market-bot.up.railway.app/api/webhooks/signal/test"

# Verificar logs em caso de erro
railway logs
```

### **📋 ARQUIVO DE CONFIGURAÇÃO PADRÃO**

```toml
# railway.toml - TEMPLATE PADRÃO
[build]
builder = "DOCKERFILE"
watchPatterns = ["**/*.js", "**/*.cjs", "**/*.json"]

[deploy]
startCommand = "node server-multiservice-complete.cjs"
restartPolicyType = "ON_FAILURE" 
restartPolicyMaxRetries = 10
healthcheckPath = "/api/health"
healthcheckTimeout = 300

[environments.production.variables]
NODE_ENV = "production"
PORT = "3000"
DATABASE_URL = "${{DATABASE_URL}}"
WEBHOOK_TOKEN = "210406"
TRADINGVIEW_WEBHOOK_TOKEN = "coinbitclub-webhook-2025"

[environments.development.variables]
NODE_ENV = "development"
PORT = "3000"
DATABASE_URL = "postgresql://localhost:5432/coinbitclub_dev"
```

### **🎯 ESTRUTURA DE ARQUIVOS OBRIGATÓRIA**

```
backend/
├── server-multiservice-complete.cjs  ← SERVIDOR PRINCIPAL
├── api-central-indicadores.js        ← API INDICADORES  
├── railway.toml                       ← CONFIG RAILWAY
├── Dockerfile                         ← CONFIG DOCKER
├── package.json                       ← DEPENDÊNCIAS
├── routes/
│   ├── chavesRoutes.js               ← ROTAS EXISTENTES
│   ├── usuariosRoutes.js             ← ROTAS EXISTENTES  
│   └── afiliadosRoutes.js            ← ROTAS EXISTENTES
└── database/
    └── schema-ia-supervisor.sql      ← TABELAS IA
```

### **⚡ PROCESSO DE DEPLOY SEGURO**

```bash
# 1. Verificar estrutura local
npm test || node -c server-multiservice-complete.cjs

# 2. Commit alterações
git add -A
git commit -m "🚀 Deploy: Sistema multiservice configurado"

# 3. Push para repositório
git push origin main

# 4. Deploy no Railway
railway up --detach

# 5. Aguardar e verificar
sleep 60
curl -X GET "https://coinbitclub-market-bot.up.railway.app/api/health"

# 6. Testar webhooks
curl -X GET "https://coinbitclub-market-bot.up.railway.app/api/webhooks/signal/test"
```

### **🔍 MONITORAMENTO PÓS-DEPLOY**

```javascript
// Endpoints para verificar saúde do sistema
GET /api/health                    // Status geral
GET /api/webhooks/signal/test      // Status webhook
GET /api/multiservice/status       // Status multiservice
GET /api/database/health           // Status database
```

---

## �📱 RESPONSIVIDADE E UX

### **Breakpoints Recomendados**
```css
/* Mobile First */
@media (min-width: 576px) { /* Mobile */ }
@media (min-width: 768px) { /* Tablet */ }
@media (min-width: 992px) { /* Desktop */ }
@media (min-width: 1200px) { /* Large Desktop */ }
```

### **Componentes Mobile**
```jsx
// Navegação mobile adaptativa
<MobileNavigation>
  {user.role === 'ADMIN' && (
    <NavItems>
      <NavItem icon="dashboard" label="Dashboard" />
      <NavItem icon="users" label="Usuários" />
      <NavItem icon="financial" label="Financeiro" />
      <NavItem icon="settings" label="Sistema" />
    </NavItems>
  )}
  
  {user.role === 'AFILIADO' && (
    <NavItems>
      <NavItem icon="dashboard" label="Dashboard" />
      <NavItem icon="commission" label="Comissões" />
      <NavItem icon="referrals" label="Indicações" />
    </NavItems>
  )}
</MobileNavigation>
```

---

## 🎯 ESTADOS E LOADING

### **Estados de Loading**
```javascript
// Estados para cada tipo de operação
const loadingStates = {
  dashboard: false,
  operations: false,
  financial: false,
  affiliates: false,
  systemStatus: false
};

// Loading específico por perfil
const getLoadingComponents = (userRole) => {
  const components = {
    'ADMIN': ['DashboardSkeleton', 'FinancialSkeleton', 'UsersSkeleton'],
    'GESTOR': ['OperationsSkeleton', 'CommissionSkeleton'],
    'AFILIADO': ['AffiliateSkeleton', 'ReferralsSkeleton'],
    'USUARIO': ['PersonalOpsSkeleton']
  };
  
  return components[userRole] || ['BasicSkeleton'];
};
```

### **Error Handling**
```javascript
// Tratamento de erros por tipo
const errorHandlers = {
  UNAUTHORIZED: () => redirectToLogin(),
  FORBIDDEN: () => showAccessDeniedMessage(),
  SERVER_ERROR: () => showSystemMaintenanceMessage(),
  NETWORK_ERROR: () => showConnectionErrorMessage()
};
```

---

## 🔔 NOTIFICAÇÕES

### **Sistema de Notificações**
```javascript
// Notificações baseadas no perfil
const notifications = {
  'ADMIN': [
    'system_alerts',
    'financial_milestones', 
    'user_activities',
    'technical_issues'
  ],
  'GESTOR': [
    'operation_alerts',
    'commission_updates',
    'affiliate_activities'
  ],
  'AFILIADO': [
    'commission_received',
    'new_referral',
    'payment_processed'
  ],
  'USUARIO': [
    'operation_closed',
    'profit_achieved',
    'account_updates'
  ]
};
```

---

## 🛡️ SEGURANÇA FRONTEND

### **Validação de Permissões**
```javascript
// Hook para verificar permissões
const usePermissions = (requiredPermission) => {
  const { user } = useAuth();
  
  return useMemo(() => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(requiredPermission);
  }, [user, requiredPermission]);
};

// Componente para proteção de rotas
const ProtectedRoute = ({ children, requiredRole, requiredPermission }) => {
  const { user } = useAuth();
  const hasPermission = usePermissions(requiredPermission);
  
  if (!user) return <Redirect to="/login" />;
  if (requiredRole && user.role !== requiredRole) return <AccessDenied />;
  if (requiredPermission && !hasPermission) return <AccessDenied />;
  
  return children;
};
```

### **Sanitização de Dados**
```javascript
// Sanitização para diferentes tipos de dados
const sanitizers = {
  currency: (value) => parseFloat(value).toFixed(2),
  percentage: (value) => Math.min(Math.max(parseFloat(value), 0), 100),
  leverage: (value) => Math.min(Math.max(parseInt(value), 1), 10)
};
```

---

## 🎨 TEMAS E ESTILOS

### **Design System**
```css
/* Variáveis CSS para temas */
:root {
  /* Cores primárias */
  --primary-color: #007bff;
  --success-color: #28a745;
  --warning-color: #ffc107;
  --danger-color: #dc3545;
  
  /* Cores por perfil */
  --admin-accent: #6f42c1;
  --gestor-accent: #007bff;
  --operador-accent: #17a2b8;
  --afiliado-accent: #28a745;
  --usuario-accent: #6c757d;
  
  /* Tipografia */
  --font-primary: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

### **Componentes Styled**
```jsx
// Componentes com tema baseado no perfil
const ProfileCard = styled.div`
  border-left: 4px solid var(--${props => props.userRole.toLowerCase()}-accent);
  background: ${props => props.userRole === 'ADMIN' ? 'linear-gradient(...)' : '#fff'};
`;

const StatusBadge = styled.span`
  background-color: ${props => 
    props.status === 'REAL' ? 'var(--success-color)' : 'var(--warning-color)'
  };
`;
```

---

## 📊 EXEMPLOS DE IMPLEMENTAÇÃO

### **Dashboard Component**
```jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get(`/dashboard/${user.id}`);
        setDashboardData(response.data);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user.id]);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="dashboard">
      <DashboardHeader user={user} />
      
      {user.role === 'ADMIN' && (
        <AdminDashboard data={dashboardData} />
      )}
      
      {user.role === 'GESTOR' && (
        <GestorDashboard data={dashboardData} />
      )}
      
      {user.role === 'AFILIADO' && (
        <AfiliadoDashboard data={dashboardData} />
      )}
      
      {user.role === 'USUARIO' && (
        <UsuarioDashboard data={dashboardData} />
      )}
    </div>
  );
};
```

### **Operations Table Component**
```jsx
const OperationsTable = ({ userRole, userId }) => {
  const [operations, setOperations] = useState([]);
  const [filters, setFilters] = useState({});

  const columns = [
    { key: 'symbol', label: 'Símbolo' },
    { key: 'type', label: 'Tipo' },
    { key: 'entry_price', label: 'Entrada' },
    { key: 'exit_price', label: 'Saída' },
    { key: 'pnl', label: 'P&L' },
    ...(userRole !== 'USUARIO' ? [
      { key: 'revenue_type', label: 'Tipo Receita' }
    ] : []),
    { key: 'status', label: 'Status' }
  ];

  return (
    <div className="operations-table">
      <TableFilters 
        filters={filters}
        onFiltersChange={setFilters}
        showRevenueFilter={userRole !== 'USUARIO'}
      />
      
      <Table
        columns={columns}
        data={operations}
        onRowClick={(operation) => showOperationDetails(operation)}
      />
    </div>
  );
};
```

---

## 🚀 DEPLOY E CONFIGURAÇÃO

### **Variáveis de Ambiente**
```env
# Frontend Environment Variables
REACT_APP_API_BASE_URL=http://localhost:3003/api
REACT_APP_WS_URL=ws://localhost:3003/ws
REACT_APP_ENVIRONMENT=development
REACT_APP_VERSION=1.0.0
```

### **Build Configuration**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext .js,.jsx,.ts,.tsx"
  },
  "dependencies": {
    "react": "^18.0.0",
    "react-router-dom": "^6.0.0",
    "axios": "^1.0.0",
    "react-query": "^3.39.0",
    "styled-components": "^5.3.0",
    "recharts": "^2.5.0",
    "socket.io-client": "^4.7.0"
  }
}
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### **Fase 1: Estrutura Base** ✅
- [ ] Setup do projeto (Vite/React)
- [ ] Sistema de roteamento
- [ ] Configuração de APIs
- [ ] Sistema de autenticação
- [ ] Layout responsivo base

### **Fase 2: Componentes Core** ✅
- [ ] Dashboard por perfil
- [ ] Tabela de operações
- [ ] Sistema de notificações
- [ ] Forms de configuração
- [ ] Componentes de loading

### **Fase 3: Funcionalidades Avançadas** ✅
- [ ] Tempo real (WebSocket)
- [ ] Gráficos e visualizações
- [ ] Sistema de filtros
- [ ] Exportação de dados
- [ ] Modo offline

### **Fase 4: UX/UI Polimento** ✅
- [ ] Temas e estilos
- [ ] Animações e transições
- [ ] Feedback visual
- [ ] Acessibilidade
- [ ] Performance optimization

### **Fase 5: Deploy e Monitoramento** ✅
- [ ] Build de produção
- [ ] CI/CD pipeline
- [ ] Monitoramento de erros
- [ ] Analytics
- [ ] Backup e recovery

---

## 🎯 RESUMO PARA O DESENVOLVEDOR

**Sistema CoinBitClub Frontend requer:**

1. **5 Perfis distintos** com permissões específicas
2. **APIs REST** completas para todas as funcionalidades
3. **WebSocket** para atualizações tempo real
4. **Separação REAL vs BONUS** em todas as interfaces
5. **Sistema de comissionamento** transparente para afiliados
6. **Dashboard adaptativos** por nível de acesso
7. **Responsividade completa** mobile-first
8. **Segurança robusta** com validação de permissões

**Prioridades de desenvolvimento:**
1. Autenticação e autorização
2. Dashboard por perfil
3. Operações de trading
4. Sistema financeiro
5. Afiliados e comissões
6. Tempo real e notificações

**Tecnologias recomendadas:**
- React 18+ com Hooks
- React Router v6
- Axios para APIs
- Socket.io para WebSocket
- Styled Components
- React Query para cache
- Recharts para gráficos

---

## 🎓 LIÇÕES APRENDIDAS E PREVENÇÃO

### **📚 HISTÓRICO DE PROBLEMAS RESOLVIDOS**

#### **Problema 1: Erro 502 Railway (Resolvido em 29/07/2025)**
- **Causa:** Uso do `server.js` simples em vez do `server-multiservice-complete.cjs`
- **Impacto:** Sistema fora do ar, webhooks não funcionando
- **Solução:** Configuração correta do arquivo multiservice
- **Prevenção:** Sempre usar servidor multiservice em produção

#### **Problema 2: Webhook TradingView 404 (Resolvido em 29/07/2025)**
- **Causa:** Endpoint `/api/webhooks/signal` não implementado no servidor ativo
- **Impacto:** Sinais TradingView não processados
- **Solução:** Implementação no servidor multiservice
- **Prevenção:** Verificar endpoints críticos antes do deploy

#### **Problema 3: Tabela operacao_monitoramento inexistente (Resolvido em 29/07/2025)**
- **Causa:** Schema IA Supervisor não aplicado no banco de produção
- **Impacto:** IA Supervisor falhando com erro de coluna
- **Solução:** Criação manual da tabela com estrutura correta
- **Prevenção:** Script de migração automática

### **🛡️ MEDIDAS PREVENTIVAS IMPLEMENTADAS**

#### **1. Validação Automática Pré-Deploy**
```bash
# Script de validação (pre-deploy.sh)
#!/bin/bash

echo "🔍 Validando configuração pré-deploy..."

# Verificar servidor multiservice
if [ ! -f "server-multiservice-complete.cjs" ]; then
    echo "❌ ERRO: server-multiservice-complete.cjs não encontrado!"
    exit 1
fi

# Verificar sintaxe
node -c server-multiservice-complete.cjs
if [ $? -ne 0 ]; then
    echo "❌ ERRO: Sintaxe inválida no servidor!"
    exit 1
fi

# Verificar railway.toml
if ! grep -q "server-multiservice-complete.cjs" railway.toml; then
    echo "❌ ERRO: railway.toml não configurado para multiservice!"
    exit 1
fi

echo "✅ Validação pré-deploy aprovada!"
```

#### **2. Monitoramento Contínuo**
```javascript
// health-monitor.js - Monitor automático do sistema
const healthChecks = {
  webhook: async () => {
    const response = await fetch('/api/webhooks/signal/test');
    return response.ok;
  },
  
  database: async () => {
    const response = await fetch('/api/database/health');
    return response.ok;
  },
  
  multiservice: async () => {
    const response = await fetch('/api/multiservice/status');
    return response.ok;
  }
};

// Executar verificações a cada 5 minutos
setInterval(async () => {
  for (const [service, check] of Object.entries(healthChecks)) {
    try {
      const isHealthy = await check();
      if (!isHealthy) {
        console.error(`❌ Serviço ${service} não está saudável!`);
        // Enviar alerta
      }
    } catch (error) {
      console.error(`❌ Erro ao verificar ${service}:`, error);
    }
  }
}, 5 * 60 * 1000);
```

#### **3. Backup Automático de Configurações**
```bash
# backup-config.sh
#!/bin/bash

BACKUP_DIR="config-backups/$(date +%Y-%m-%d_%H-%M-%S)"
mkdir -p $BACKUP_DIR

# Backup arquivos críticos
cp railway.toml $BACKUP_DIR/
cp Dockerfile $BACKUP_DIR/
cp package.json $BACKUP_DIR/
cp server-multiservice-complete.cjs $BACKUP_DIR/

echo "✅ Backup de configurações salvo em $BACKUP_DIR"
```

### **📋 CHECKLIST DE QUALIDADE**

#### **Antes de cada Deploy:**
- [ ] Servidor multiservice funcionando localmente
- [ ] railway.toml configurado corretamente
- [ ] Dockerfile usa comando correto
- [ ] Webhook endpoint implementado e testado
- [ ] Banco de dados com estrutura atualizada
- [ ] Variáveis de ambiente configuradas
- [ ] Backup de configurações criado

#### **Após cada Deploy:**
- [ ] Status 200 em `/api/health`
- [ ] Webhook test funcionando
- [ ] Logs sem erros críticos
- [ ] Database conectando
- [ ] IA Supervisor operacional
- [ ] Monitoramento ativo

### **🚨 ALERTAS E NOTIFICAÇÕES**

#### **Sistema de Alertas Automáticos**
```javascript
// alert-system.js
const alertConditions = {
  '502_error': {
    trigger: 'HTTP 502 detected',
    action: 'Check railway.toml and server config',
    urgency: 'high'
  },
  
  'webhook_404': {
    trigger: 'Webhook endpoint returning 404',
    action: 'Verify server-multiservice-complete.cjs',
    urgency: 'high'
  },
  
  'database_error': {
    trigger: 'Database connection failed',
    action: 'Check DATABASE_URL and table structure',
    urgency: 'critical'
  }
};

// Implementar notificações via Slack/Discord/Email
const sendAlert = (condition, details) => {
  console.error(`🚨 ALERTA: ${condition}`);
  console.error(`📋 Ação: ${alertConditions[condition].action}`);
  console.error(`⚠️ Urgência: ${alertConditions[condition].urgency}`);
  
  // Integração com serviços de notificação
  // webhook para Slack, Discord, etc.
};
```

### **🔄 PROCESSO DE ROLLBACK**

```bash
# rollback.sh - Script de rollback rápido
#!/bin/bash

echo "🔄 Iniciando rollback para última versão estável..."

# Voltar para último commit funcional
LAST_WORKING_COMMIT="commit-hash-here"
git reset --hard $LAST_WORKING_COMMIT

# Redeploy
railway up --detach

echo "✅ Rollback concluído. Verificando saúde do sistema..."

# Aguardar e verificar
sleep 60
curl -f https://coinbitclub-market-bot.up.railway.app/api/health

if [ $? -eq 0 ]; then
    echo "✅ Sistema funcionando após rollback"
else
    echo "❌ Sistema ainda com problemas - verificação manual necessária"
fi
```

### **📖 DOCUMENTAÇÃO DE INCIDENTES**

#### **Template para Documentar Problemas:**
```markdown
## Incidente #ID - TÍTULO

**Data:** DD/MM/YYYY HH:MM
**Duração:** X minutos
**Impacto:** [Alto/Médio/Baixo]

### Descrição do Problema
- O que aconteceu
- Sintomas observados
- Sistemas afetados

### Causa Raiz
- Por que aconteceu
- Onde estava o problema
- Como foi identificado

### Solução Aplicada
- Passos para resolver
- Comandos executados
- Arquivos modificados

### Prevenção
- Como evitar no futuro
- Melhorias implementadas
- Monitoramento adicionado

### Lições Aprendidas
- Pontos importantes
- Processos melhorados
- Conhecimento adquirido
```

---

*Documentação completa para desenvolvimento frontend do sistema CoinBitClub*
*Versão: 1.0.0 | Data: 29/07/2025*
*Incluindo configurações multiservice e prevenção de problemas*
