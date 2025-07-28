# 🔍 ESPECIFICAÇÃO TÉCNICA - HOMOLOGAÇÃO COMPLETA COINBITCLUB MARKETBOT

**📋 Documento:** Especificação de Homologação e Conformidade  
**🎯 Sistema:** CoinbitClub MarketBot (Backend + Frontend + Infraestrutura)  
**📅 Data:** 28 de Julho de 2025  
**🚀 Versão:** v3.0.0 Production Ready  
**⚙️ Environment:** Production (Railway + Vercel)  

---

## 🎯 OBJETIVO GERAL

Validar que todo o sistema CoinbitClub MarketBot esteja funcional, operando com dados reais e refletindo em tempo real o estado do backend e da infraestrutura. A homologação deve garantir que o sistema está pronto para operar em ambiente de produção 24/7, sem uso de dados mock ou componentes não integrados.

---

## 🏗️ ARQUITETURA DO SISTEMA

### 📊 Stack Tecnológico Completo

#### **Frontend (Vercel)**
```
🎨 Frontend Layer (Next.js 14)
├── Framework: Next.js 14.2.30 + React 18
├── Styling: Tailwind CSS + shadcn/ui
├── Authentication: JWT + js-cookie
├── API Client: Axios com interceptors
├── State: React Context + Custom Hooks
├── Icons: Lucide React
├── Forms: React Hook Form + Zod
├── Charts: Recharts + Chart.js
└── Deploy: Vercel (Edge Functions + CDN)
```

#### **Backend (Railway)**
```
⚙️ Backend Layer (Express.js + PostgreSQL)
├── API Gateway: Express.js server principal
├── Database: PostgreSQL Railway (SSL)
├── Authentication: JWT + bcrypt
├── File Upload: Multer + Sharp
├── Rate Limiting: express-rate-limit
├── Security: Helmet + CORS
├── Monitoring: Custom metrics + logs
├── Email: Nodemailer + templates
├── SMS: Twilio integration
└── Payments: Stripe integration
```

#### **Microserviços Planejados**
```
🔄 Microservices Architecture
├── 📩 Signal Ingestor (Port 9010)
├── 🔄 Signal Processor (Port 9012)
├── 🧠 Decision Engine (Port 9011)
├── ⚡ Order Executor (Port 9013)
├── 📊 Metrics Collector (Port 9014)
└── 🛡️ Security Monitor (Port 9015)
```

### 🗄️ Estrutura de Banco de Dados

#### **Tabelas Principais**
```sql
-- Usuários e Autenticação
users, user_profiles, user_sessions, user_credentials

-- Sistema de Trading
trading_signals, operations, user_balances, user_risk_parameters

-- Sistema de Afiliados
affiliate_commissions, affiliate_links, affiliate_payments

-- Administração
audit_logs, system_events, system_configs, admin_actions

-- IA e Monitoramento
ai_monitoring_events, ai_monitoring_alerts, ai_monitoring_metrics
ai_response_cache, ai_decision_logs, ai_performance_metrics

-- Integrações
webhook_logs, stripe_events, twilio_logs, email_logs
```

---

## 🧠 1. VALIDAÇÃO DE MICROSERVIÇOS EM TEMPO REAL

### 📋 Checklist de Serviços

#### **✅ Signal Ingestor**
- **Função:** Receber e processar webhooks TradingView
- **Endpoint:** `POST /api/webhooks/signal`
- **Status:** ✅ IMPLEMENTADO
- **Validação:**
  ```bash
  curl -X POST https://coinbitclub-market-bot-production.up.railway.app/api/webhooks/signal \
    -H "Content-Type: application/json" \
    -d '{"token": "coinbitclub_webhook_secret_2024", "symbol": "BTCUSDT", "action": "LONG"}'
  ```

#### **🔄 Signal Processor**
- **Função:** Processar e validar sinais recebidos
- **Status:** 🚧 PLANEJADO (DIA 16-18)
- **Critérios:**
  - Validação de Fear & Greed Index
  - Filtros por configuração do usuário
  - Validação de ticker bloqueado

#### **🧠 Decision Engine**
- **Função:** Tomar decisões baseadas em IA
- **Status:** 🚧 PLANEJADO (DIA 13-14)
- **Critérios:**
  - Análise de risco automatizada
  - Cálculo de TP/SL dinâmico
  - Validação de posições existentes

#### **⚡ Order Executor**
- **Função:** Executar ordens nas exchanges
- **Status:** 🚧 PLANEJADO (DIA 15)
- **Critérios:**
  - Integração Binance/Bybit real
  - Validação de saldo/margem
  - Registro completo de operações

### 🔍 Testes de Status em Tempo Real

```javascript
// Endpoint para verificar status dos serviços
GET /api/system/microservices/status

// Resposta esperada:
{
  "signal_ingestor": {
    "status": "ONLINE",
    "last_heartbeat": "2025-07-28T13:30:00Z",
    "response_time": 45,
    "requests_processed": 1247
  },
  "signal_processor": {
    "status": "ONLINE",
    "last_heartbeat": "2025-07-28T13:29:58Z",
    "response_time": 120,
    "queue_size": 3
  },
  "decision_engine": {
    "status": "ONLINE",
    "last_heartbeat": "2025-07-28T13:30:02Z",
    "decisions_made": 89,
    "accuracy": 87.5
  },
  "order_executor": {
    "status": "ONLINE",
    "last_heartbeat": "2025-07-28T13:29:59Z",
    "orders_executed": 34,
    "success_rate": 98.2
  }
}
```

---

## ⚙️ 2. FLUXO OPERACIONAL DE TRADING

### 📩 Fase 1: Recebimento de Sinal

**Endpoint:** `POST /api/webhooks/signal`  
**Status:** ✅ FUNCIONANDO

```javascript
// Estrutura do webhook esperada:
{
  "token": "coinbitclub_webhook_secret_2024",
  "strategy": "EMA_RSI_Strategy",
  "symbol": "BTCUSDT",
  "action": "SINAL_LONG", // SINAL_LONG, SINAL_SHORT, SINAL_LONG_FORTE, SINAL_SHORT_FORTE, FECHE, CONFIRMAÇÃO
  "price": 67850.50,
  "timestamp": "2025-07-28T13:30:00Z",
  "indicators": {
    "close": 67850.50,
    "ema_7": 67800.25,
    "ema_21": 67650.00,
    "rsi": 65.4,
    "volume": 1234567,
    "diff_btc_ema7": 50.25
  },
  "test_mode": false
}
```

### 🔍 Fase 2: Validação Fear & Greed Index

**API:** https://api.alternative.me/fng/  
**Cache:** 1 hora máximo  
**Fallback:** F&G = 50

```javascript
// Regras de validação:
if (fearGreedIndex < 30) {
  allowedActions = ['SINAL_LONG', 'SINAL_LONG_FORTE'];
} else if (fearGreedIndex >= 30 && fearGreedIndex <= 80) {
  allowedActions = ['SINAL_LONG', 'SINAL_SHORT', 'SINAL_LONG_FORTE', 'SINAL_SHORT_FORTE'];
} else if (fearGreedIndex > 80) {
  allowedActions = ['SINAL_SHORT', 'SINAL_SHORT_FORTE'];
}
```

### 🧠 Fase 3: Consulta de Configuração do Usuário

**Tabela:** `usuario_config`

```sql
SELECT 
  alavancagem_preferida,     -- máx 10x
  stop_loss_preferido,       -- máx 4x
  take_profit_preferido_low, -- F&G < 30, máx 2x padrão
  take_profit_preferido_mid, -- F&G 30-80, máx 2x padrão  
  take_profit_preferido_high -- F&G > 80, máx 2x padrão
FROM usuario_config 
WHERE user_id = $1;
```

### ✅ Fase 4: Validação de Regras Obrigatórias

```javascript
// Regras de validação:
const validationRules = {
  maxPositions: 2,
  positionCheck: 'SELECT COUNT(*) FROM operations WHERE user_id = ? AND status = "OPEN"',
  tickerBlock: 'SELECT * FROM bloqueio_ticker WHERE ticker = ? AND blocked_until > NOW()',
  minTimeBetweenOrders: 120, // minutos
  mandatoryTPSL: true,
  maxPositionSize: 0.30, // 30% do saldo (customizável até 50%)
  autoExecution: true // Sempre abrir sem confirmação manual
};
```

### 🧾 Fase 5: Registro e Execução

**Tabelas de Registro:**
```sql
-- Operação principal
INSERT INTO operacoes (
  user_id, ticker, tipo, entrada, tp, sl, 
  indice_fear_greed, config_aplicada, prioridade, 
  status, created_at
);

-- Bloqueio automático do ticker
INSERT INTO bloqueio_ticker (
  ticker, blocked_until, reason, created_at
);

-- Log de decisão IA (se aplicável)
INSERT INTO ai_decisions (
  operation_id, decision_type, confidence_score,
  factors_analyzed, risk_assessment
);
```

---

## 👥 3. VALIDAÇÃO DO CADASTRO COM TWILIO SMS

### 📱 Fluxo de Cadastro Completo

#### **Fase 1: Dados Básicos**
```javascript
POST /api/auth/register
{
  "name": "João Silva",
  "country": "Brasil",
  "whatsapp": "+5511999999999",
  "email": "joao@email.com",
  "password": "senhaSegura123",
  "terms_accepted": true,
  "privacy_accepted": true,
  "affiliate_code": "AFF1234" // opcional
}
```

#### **Fase 2: Envio OTP via Twilio**
```javascript
// Twilio SMS Service
const twilioService = {
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  fromNumber: process.env.TWILIO_PHONE_NUMBER
};

// Template SMS:
"CoinbitClub: Seu código de verificação é: {code}. Válido por 10 minutos."
```

#### **Fase 3: Validação OTP**
```javascript
POST /api/auth/verify-sms
{
  "whatsapp": "+5511999999999",
  "verification_code": "123456"
}

// Validações:
- Código deve estar correto
- Não deve estar expirado (10 min)
- Número deve ser único no sistema
- Máximo 3 tentativas por hora
```

#### **Critérios de Aprovação:**
- ✅ SMS enviado via Twilio
- ✅ Código OTP gerado aleatoriamente
- ✅ Validação de expiração (10 minutos)
- ✅ Limite de tentativas (3 por hora)
- ✅ Verificação de número único
- ✅ Registro de aceite de termos
- ✅ Log completo do processo

---

## 🧪 4. TESTES AUTOMATIZADOS

### 🔬 Estrutura de Testes

#### **Unit Tests (90% cobertura mínima)**
```bash
backend/tests/unit/
├── auth.test.js           # Autenticação
├── trading.test.js        # Sistema de trading
├── sms.test.js           # Sistema SMS
├── affiliate.test.js     # Sistema de afiliados
├── admin.test.js         # Painel administrativo
└── utils.test.js         # Funções utilitárias
```

#### **Integration Tests (100% fluxos críticos)**
```bash
backend/tests/integration/
├── user-registration.test.js     # Cadastro completo
├── trading-flow.test.js         # Fluxo de trading
├── webhook-processing.test.js    # Processamento webhooks
├── admin-operations.test.js     # Operações administrativas
└── microservices.test.js       # Comunicação entre serviços
```

#### **E2E Tests (Todas as jornadas)**
```bash
frontend/tests/e2e/
├── user-journey.spec.js         # Jornada do usuário
├── admin-journey.spec.js        # Jornada do admin
├── affiliate-journey.spec.js    # Jornada do afiliado
├── trading-operations.spec.js   # Operações de trading
└── mobile-responsive.spec.js    # Responsividade
```

### 🎯 Cenários de Teste Obrigatórios

```javascript
// 1. Cadastro + Validação OTP
describe('User Registration with SMS', () => {
  test('should register user and send SMS verification', async () => {
    // Implementar teste completo
  });
});

// 2. Abertura de Posição Real
describe('Trading Operations', () => {
  test('should process signal and open position', async () => {
    // Implementar teste completo
  });
});

// 3. Dashboard Tempo Real
describe('Real-time Dashboard', () => {
  test('should display real backend data', async () => {
    // Implementar teste completo
  });
});
```

---

## 🔒 5. SEGURANÇA E IP FIXO

### 🛡️ Configuração de Segurança

#### **IP Autorizado Railway**
```javascript
const AUTHORIZED_IPS = [
  '132.255.160.140', // Railway IP
  process.env.VERCEL_IP, // Vercel IP
  process.env.ADMIN_IP   // Admin IP
];

// Middleware de validação
const ipWhitelist = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  
  if (!AUTHORIZED_IPS.includes(clientIP)) {
    return res.status(403).json({
      error: 'Access denied',
      ip: clientIP,
      message: 'Your IP is not authorized'
    });
  }
  
  next();
};
```

#### **Headers de Segurança**
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

#### **Proteções Implementadas**
- ✅ XSS Protection
- ✅ CSRF Protection  
- ✅ SQL Injection Prevention
- ✅ Rate Limiting (100 req/min)
- ✅ JWT Token Validation
- ✅ Password Hashing (bcrypt)
- ✅ Input Validation (Joi/Zod)
- ✅ CORS Configuration

---

## 📊 6. PAINEL ADMINISTRATIVO E LOGS DA IA

### 🎛️ Dashboard Administrativo

#### **Endpoints Administrativos**
```javascript
// Status da IA
GET /api/admin/ai/status
GET /api/admin/ai/decisions
GET /api/admin/ai/performance

// Controles de Emergency
POST /api/admin/emergency/close-all-operations
POST /api/admin/emergency/pause-trading
POST /api/admin/emergency/resume-trading

// Logs e Métricas
GET /api/admin/logs/system
GET /api/admin/logs/trading
GET /api/admin/logs/ia
GET /api/admin/metrics/performance
```

#### **Funcionalidades do Painel**
```javascript
const adminDashboard = {
  // Status em tempo real
  realTimeStatus: {
    microservices: 'online/offline status',
    lastSignals: 'últimos 10 sinais recebidos',
    decisions: 'últimas decisões da IA',
    operations: 'operações ativas'
  },
  
  // Controles críticos
  emergencyControls: {
    closeAll: 'fechar todas as operações',
    pauseAI: 'pausar sistema de IA',
    recalculate: 'recalcular métricas',
    optimizeCache: 'otimizar cache'
  },
  
  // Logs e auditoria
  logging: {
    systemEvents: 'eventos do sistema',
    adminActions: 'ações administrativas',
    aiDecisions: 'decisões da IA',
    userActivities: 'atividades dos usuários'
  }
};
```

### 📈 Métricas e Logs da IA

```sql
-- Log de decisões da IA
CREATE TABLE ai_decision_logs (
  id SERIAL PRIMARY KEY,
  signal_id VARCHAR(255),
  decision_type VARCHAR(50),
  confidence_score DECIMAL(5,2),
  factors_analyzed JSONB,
  risk_assessment JSONB,
  execution_time INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Métricas de performance
CREATE TABLE ai_performance_metrics (
  id SERIAL PRIMARY KEY,
  metric_type VARCHAR(50),
  value DECIMAL(15,4),
  period_start TIMESTAMP,
  period_end TIMESTAMP,
  metadata JSONB
);
```

---

## ✅ 7. CRITÉRIOS DE APROVAÇÃO FINAL

### 📋 Checklist de Homologação

#### **🔥 Críticos (Bloqueantes)**
- [ ] **Zero dados mock/hardcoded**
  - Frontend conectado ao backend real
  - Dados dinâmicos em tempo real
  - Sem componentes simulados

- [ ] **100% dos endpoints funcionais**
  - Todos os 47 endpoints testados
  - Respostas consistentes
  - Tratamento de erros adequado

- [ ] **Frontend sincronizado com backend**
  - AuthContext funcionando
  - API client operacional
  - Estados sincronizados

- [ ] **Microserviços online**
  - Signal Ingestor ativo
  - Decision Engine operacional
  - Order Executor funcional

#### **🟡 Importantes**
- [ ] **Todas as decisões IA registradas**
  - Logs completos em ai_decision_logs
  - Métricas de performance
  - Auditoria de ações

- [ ] **Testes aprovados**
  - Unit tests: 90%+ coverage
  - Integration tests: 100% críticos
  - E2E tests: todas jornadas

- [ ] **Integrações externas funcionando**
  - Stripe: webhooks + pagamentos
  - Twilio: SMS + verificação
  - Exchanges: Binance/Bybit testnet

#### **🟢 Desejáveis**
- [ ] **Painel administrativo completo**
  - Dashboard em tempo real
  - Controles de emergência
  - Logs e métricas

- [ ] **Performance otimizada**
  - Response time < 200ms
  - Cache implementado
  - Rate limiting configurado

---

## 🚀 8. PLANO DE EXECUÇÃO DA HOMOLOGAÇÃO

### 📅 Cronograma (5 dias)

#### **DIA 1: Preparação e Setup**
- Configurar ambiente de homologação
- Validar conectividade backend/frontend
- Preparar dados de teste

#### **DIA 2: Testes de Microserviços**
- Validar Signal Ingestor
- Testar processamento de webhooks
- Verificar logs e métricas

#### **DIA 3: Testes de Integração**
- Fluxo completo de trading
- Sistema de cadastro + SMS
- Painel administrativo

#### **DIA 4: Testes de Segurança**
- Validação de IP whitelist
- Testes de penetração básicos
- Auditoria de logs

#### **DIA 5: Validação Final**
- Testes E2E completos
- Performance e stress tests
- Aprovação ou rejeição final

### 🎯 Deliverables

1. **Relatório de Homologação** (Excel + PDF)
2. **Log de Testes Executados** (JSON)
3. **Certificado de Conformidade** (se aprovado)
4. **Lista de Correções** (se rejeitado)

---

## 📞 SUPORTE E CONTATOS

**🔧 Equipe Técnica:**
- Backend: coinbitclub-backend-team@domain.com
- Frontend: coinbitclub-frontend-team@domain.com
- DevOps: coinbitclub-devops-team@domain.com

**📊 URLs de Produção:**
- Frontend: https://coinbitclub-frontend.vercel.app
- Backend: https://coinbitclub-market-bot-production.up.railway.app
- Admin: https://admin.coinbitclub.com

**🆘 Emergency Contacts:**
- Technical Lead: +55 11 99999-9999
- System Admin: +55 11 88888-8888

---

**📋 Documento aprovado para execução - CoinbitClub Technical Team**  
**📅 Válido até: 30 de Agosto de 2025**
