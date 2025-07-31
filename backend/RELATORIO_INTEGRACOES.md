# 🔗 RELATÓRIO DE INTEGRAÇÃO TÉCNICA
## CoinBitClub Market Bot V3.0.0 - Sistemas Externos

---

### 🎯 **OBJETIVO**
Este relatório documenta todas as integrações com sistemas externos, APIs de terceiros, webhooks e configurações necessárias para operação em produção.

---

## 🏗️ **ARQUITETURA DE INTEGRAÇÃO**

### **Diagrama de Sistemas**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   TradingView   │ ──▶│  CoinBitClub    │ ──▶│     Bybit       │
│    Webhook      │    │    Backend      │    │      API        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     OpenAI      │ ◀──│   PostgreSQL    │ ──▶│     Twilio      │
│      API        │    │    Database     │    │      SMS        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                      ┌─────────────────┐
                      │     Railway     │
                      │    Hosting      │
                      └─────────────────┘
```

---

## 📡 **INTEGRAÇÃO TRADINGVIEW**

### **Configuração do Webhook**
```javascript
// URL do Webhook
Production: https://api.coinbitclub.com/api/webhook/tradingview
Development: http://localhost:3000/api/webhook/tradingview

// Headers obrigatórios
{
  "Content-Type": "application/json",
  "X-API-Key": "WEBHOOK_API_KEY"
}
```

### **Estrutura do Payload**
```json
{
  "signal": "SINAL LONG FORTE",
  "ticker": "{{ticker}}",
  "close": "{{close}}",
  "volume": "{{volume}}", 
  "time": "{{time}}",
  "timeframe": "{{interval}}",
  "source": "TradingView_Real_Production",
  "strategy": "{{strategy.order.comment}}",
  "action": "{{strategy.order.action}}"
}
```

### **Configuração no TradingView**
```pine
// Código Pine Script para enviar sinais
strategy.entry("Long", strategy.long, when=longCondition)
strategy.close("Long", when=exitCondition)

// Webhook para entrada
alertcondition(longCondition, title="Long Entry", 
    message='{"signal":"SINAL LONG FORTE","ticker":"{{ticker}}","close":"{{close}}","volume":"{{volume}}","time":"{{time}}","source":"TradingView_Real_Production"}')

// Webhook para saída
alertcondition(exitCondition, title="Long Exit",
    message='{"signal":"SINAL CLOSE LONG","ticker":"{{ticker}}","close":"{{close}}","volume":"{{volume}}","time":"{{time}}","source":"TradingView_Real_Production"}')
```

### **Validação de Sinais**
```javascript
// Sinais aceitos pelo sistema
const VALID_SIGNALS = [
  "SINAL LONG FORTE",
  "SINAL SHORT FORTE", 
  "SINAL LONG MEDIO",
  "SINAL SHORT MEDIO",
  "SINAL CLOSE LONG",
  "SINAL CLOSE SHORT"
];

// Tickers suportados
const SUPPORTED_TICKERS = [
  "BTCUSDT", "ETHUSDT", "ADAUSDT",
  "SOLUSDT", "DOTUSDT", "LINKUSDT",
  "AVAXUSDT", "MATICUSDT", "ATOMUSDT"
];
```

---

## 💰 **INTEGRAÇÃO BYBIT**

### **Configuração da API**
```javascript
// Endpoints Bybit
const BYBIT_ENDPOINTS = {
  TESTNET: "https://api-testnet.bybit.com",
  MAINNET: "https://api.bybit.com"
};

// Configuração necessária
const bybitConfig = {
  api_key: process.env.BYBIT_API_KEY,
  secret: process.env.BYBIT_SECRET,
  testnet: false, // true para teste, false para produção
  recv_window: 5000
};
```

### **Permissões Necessárias**
```json
{
  "permissions": [
    "Order",           // Criar/cancelar ordens
    "Position",        // Visualizar posições  
    "Execution",       // Histórico de execuções
    "Trade",          // Operações de trading
    "Wallet"          // Consultar saldo
  ],
  "ips_allowed": [
    "0.0.0.0/0"       // Todos os IPs (ou específicos)
  ]
}
```

### **Endpoints Utilizados**

#### **Informações da Conta**
```http
GET /v5/account/wallet-balance
Headers: {
  "X-BAPI-API-KEY": "API_KEY",
  "X-BAPI-SIGN": "SIGNATURE",
  "X-BAPI-SIGN-TYPE": "2",
  "X-BAPI-TIMESTAMP": "TIMESTAMP",
  "X-BAPI-RECV-WINDOW": "5000"
}
```

#### **Criar Ordem**
```http
POST /v5/order/create
Body: {
  "category": "linear",
  "symbol": "BTCUSDT",
  "side": "Buy",
  "orderType": "Market",
  "qty": "0.001",
  "timeInForce": "IOC",
  "reduceOnly": false,
  "closeOnTrigger": false
}
```

#### **Consultar Posições**
```http
GET /v5/position/list?category=linear&symbol=BTCUSDT
```

### **Tratamento de Erros Bybit**
```javascript
const BYBIT_ERROR_CODES = {
  10001: "Parâmetro obrigatório ausente",
  10002: "Parâmetro inválido",
  10003: "API key inválida",
  10004: "Assinatura inválida",
  10005: "Timestamp expirado",
  10006: "Permissão insuficiente",
  110001: "Ordem rejeitada",
  110003: "Saldo insuficiente",
  110004: "Quantidade mínima não atingida"
};
```

---

## 🤖 **INTEGRAÇÃO OPENAI**

### **Configuração da API**
```javascript
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID
});

// Modelos utilizados
const MODELS = {
  GPT4: "gpt-4-turbo-preview",
  GPT35: "gpt-3.5-turbo",
  EMBEDDINGS: "text-embedding-3-small"
};
```

### **Casos de Uso**

#### **Análise de Sinais**
```javascript
const analyzeSignal = async (signalData) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [{
      role: "system",
      content: `Você é um especialista em análise técnica. 
                Analise o sinal de trading fornecido e retorne 
                uma análise estruturada em JSON.`
    }, {
      role: "user", 
      content: `Analise este sinal: ${JSON.stringify(signalData)}`
    }],
    response_format: { type: "json_object" },
    max_tokens: 1000
  });
  
  return JSON.parse(response.choices[0].message.content);
};
```

#### **Análise de Sentimento**
```javascript
const analyzeSentiment = async (marketData) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [{
      role: "system",
      content: `Analise o sentimento do mercado baseado nos dados 
                fornecidos e retorne um score de -1 (bearish) a 1 (bullish).`
    }, {
      role: "user",
      content: JSON.stringify(marketData)
    }]
  });
  
  return response.choices[0].message.content;
};
```

### **Rate Limits OpenAI**
```javascript
const OPENAI_LIMITS = {
  "gpt-4-turbo-preview": {
    requests_per_minute: 500,
    tokens_per_minute: 30000,
    tokens_per_day: 300000
  },
  "gpt-3.5-turbo": {
    requests_per_minute: 3500,
    tokens_per_minute: 90000,
    tokens_per_day: 10000000
  }
};
```

---

## 📱 **INTEGRAÇÃO TWILIO SMS**

### **Configuração**
```javascript
const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const TWILIO_CONFIG = {
  from: process.env.TWILIO_PHONE_NUMBER,
  service_sid: process.env.TWILIO_SERVICE_SID
};
```

### **Tipos de Notificações**

#### **Alertas Críticos**
```javascript
const sendCriticalAlert = async (to, message) => {
  return await client.messages.create({
    body: `🚨 ALERTA CRÍTICO: ${message}`,
    from: TWILIO_CONFIG.from,
    to: to
  });
};
```

#### **Confirmação de Operações**
```javascript
const sendOperationConfirmation = async (to, operation) => {
  const message = `
✅ Operação executada:
📊 ${operation.ticker}
💰 ${operation.side} ${operation.quantity}
💲 Preço: $${operation.price}
📈 PnL: $${operation.pnl}
  `;
  
  return await client.messages.create({
    body: message,
    from: TWILIO_CONFIG.from,
    to: to
  });
};
```

### **Status de Entrega**
```javascript
// Webhook para status de entrega
app.post('/webhooks/twilio/status', (req, res) => {
  const { MessageStatus, MessageSid, To } = req.body;
  
  console.log(`SMS ${MessageSid} para ${To}: ${MessageStatus}`);
  
  // Salvar status no banco
  updateSMSStatus(MessageSid, MessageStatus);
  
  res.status(200).send('OK');
});
```

---

## 🗄️ **INTEGRAÇÃO POSTGRESQL (RAILWAY)**

### **Configuração da Conexão**
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});
```

### **Configurações Railway**
```env
# Variáveis fornecidas pelo Railway
DATABASE_URL=postgresql://postgres:password@host:port/database
PGHOST=yamabiko.proxy.rlwy.net
PGPORT=42095
PGDATABASE=railway
PGUSER=postgres
PGPASSWORD=FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv
```

### **Pool de Conexões**
```javascript
const poolConfig = {
  max: 20,                    // máximo de conexões
  min: 2,                     // mínimo de conexões
  idleTimeoutMillis: 30000,   // timeout de conexão idle
  connectionTimeoutMillis: 2000, // timeout de conexão
  acquireTimeoutMillis: 60000,   // timeout para obter conexão
  createTimeoutMillis: 3000,     // timeout para criar conexão
  destroyTimeoutMillis: 5000,    // timeout para destruir conexão
  reapIntervalMillis: 1000,      // intervalo de limpeza
  createRetryIntervalMillis: 200 // intervalo entre tentativas
};
```

### **Monitoramento de Conexões**
```javascript
// Monitor de saúde do pool
setInterval(() => {
  console.log('Pool Stats:', {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount
  });
}, 30000);

// Tratamento de erros de conexão
pool.on('error', (err) => {
  console.error('Erro no pool de conexões:', err);
  // Notificar admins via SMS
  sendCriticalAlert(ADMIN_PHONE, `Database pool error: ${err.message}`);
});
```

---

## 📊 **INTEGRAÇÃO REDIS (CACHE)**

### **Configuração**
```javascript
const redis = require('redis');

const client = redis.createClient({
  url: process.env.REDIS_URL,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      return new Error('Redis server refused connection');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      return undefined;
    }
    return Math.min(options.attempt * 100, 3000);
  }
});
```

### **Estratégias de Cache**
```javascript
// Cache de usuários (TTL: 5 minutos)
const cacheUser = async (userId, userData) => {
  await client.setex(`user:${userId}`, 300, JSON.stringify(userData));
};

// Cache de cotações (TTL: 30 segundos)
const cachePrices = async (ticker, price) => {
  await client.setex(`price:${ticker}`, 30, price);
};

// Cache de análise de IA (TTL: 10 minutos)
const cacheAIAnalysis = async (signalId, analysis) => {
  await client.setex(`ai:${signalId}`, 600, JSON.stringify(analysis));
};
```

---

## 🔐 **SEGURANÇA E AUTENTICAÇÃO**

### **JWT Configuration**
```javascript
const jwt = require('jsonwebtoken');

const JWT_CONFIG = {
  secret: process.env.JWT_SECRET,
  expiresIn: '1h',
  issuer: 'coinbitclub',
  audience: 'coinbitclub-users'
};

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token de acesso requerido' });
  }
  
  jwt.verify(token, JWT_CONFIG.secret, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};
```

### **Rate Limiting**
```javascript
const rateLimit = require('express-rate-limit');

// Limite geral da API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // máximo 1000 requests por IP
  message: 'Muitas requisições, tente novamente em 15 minutos'
});

// Limite específico para webhook
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100, // máximo 100 sinais por minuto
  message: 'Limite de sinais excedido'
});
```

### **Criptografia de Dados Sensíveis**
```javascript
const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-gcm';

const encrypt = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
};

const decrypt = (encryptedData) => {
  const decipher = crypto.createDecipher(
    ALGORITHM, 
    ENCRYPTION_KEY, 
    Buffer.from(encryptedData.iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};
```

---

## 📈 **MONITORAMENTO E LOGS**

### **Health Checks**
```javascript
// Endpoint de saúde
app.get('/health', async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    services: {}
  };
  
  try {
    // Check PostgreSQL
    await pool.query('SELECT 1');
    health.services.postgresql = 'OK';
  } catch (error) {
    health.services.postgresql = 'ERROR';
    health.status = 'ERROR';
  }
  
  try {
    // Check Redis
    await client.ping();
    health.services.redis = 'OK';
  } catch (error) {
    health.services.redis = 'ERROR';
    health.status = 'ERROR';
  }
  
  // Check OpenAI (opcional)
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      }
    });
    health.services.openai = response.ok ? 'OK' : 'ERROR';
  } catch (error) {
    health.services.openai = 'ERROR';
  }
  
  res.status(health.status === 'OK' ? 200 : 503).json(health);
});
```

### **Logging Estruturado**
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'coinbitclub-bot' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Logs específicos
const logTrade = (operation) => {
  logger.info('Trade executed', {
    type: 'TRADE',
    operation_id: operation.id,
    user_id: operation.user_id,
    ticker: operation.ticker,
    side: operation.side,
    quantity: operation.quantity,
    price: operation.price,
    pnl: operation.pnl
  });
};

const logError = (error, context) => {
  logger.error('System error', {
    type: 'ERROR',
    error: error.message,
    stack: error.stack,
    context
  });
};
```

---

## 🚀 **DEPLOY E CI/CD**

### **GitHub Actions**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm test
      
    - name: Deploy to Railway
      run: |
        npm install -g @railway/cli
        railway login --token ${{ secrets.RAILWAY_TOKEN }}
        railway up
      env:
        RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### **Configuração Railway**
```json
// railway.json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### **Variáveis de Ambiente Railway**
```bash
# Comando para definir variáveis
railway variables set DATABASE_URL="postgresql://..."
railway variables set OPENAI_API_KEY="sk-..."
railway variables set TWILIO_ACCOUNT_SID="AC..."
railway variables set JWT_SECRET="secret..."
railway variables set NODE_ENV="production"
```

---

## 🔄 **BACKUP E DISASTER RECOVERY**

### **Backup do Banco de Dados**
```bash
#!/bin/bash
# backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DATE}.sql"

# Backup completo
pg_dump $DATABASE_URL > backups/$BACKUP_FILE

# Compressão
gzip backups/$BACKUP_FILE

# Upload para S3 (opcional)
aws s3 cp backups/${BACKUP_FILE}.gz s3://coinbitclub-backups/

# Limpeza de backups antigos (manter últimos 30 dias)
find backups/ -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup criado: ${BACKUP_FILE}.gz"
```

### **Restauração**
```bash
#!/bin/bash
# restore-db.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Uso: ./restore-db.sh backup_file.sql.gz"
  exit 1
fi

# Descompressão
gunzip $BACKUP_FILE

# Restauração
psql $DATABASE_URL < ${BACKUP_FILE%.gz}

echo "Restauração concluída"
```

---

## 📞 **CONTATOS E SUPORTE**

### **Equipe Técnica**
- **Backend Lead**: backend@coinbitclub.com
- **DevOps**: devops@coinbitclub.com  
- **Integrations**: integrations@coinbitclub.com

### **Suporte a Integrações**
- **Slack**: #integrations-support
- **Horário**: 24/7 para produção
- **SLA**: 4 horas para problemas críticos

### **Documentação Técnica**
- **API Docs**: https://api.coinbitclub.com/docs
- **Postman**: `docs/CoinBitClub-Integrations.postman_collection.json`
- **GitHub**: https://github.com/coinbitclub/coinbitclub-market-bot

---

## 📋 **CHECKLIST DE INTEGRAÇÃO**

### **Pré-Deploy**
- [ ] ✅ TradingView webhooks configurados
- [ ] ✅ Bybit API keys válidas com permissões corretas
- [ ] ✅ OpenAI API key configurada
- [ ] ✅ Twilio SMS configurado
- [ ] ✅ PostgreSQL Railway conectado
- [ ] ✅ Redis configurado
- [ ] ✅ Variáveis de ambiente definidas
- [ ] ✅ SSL/TLS configurado
- [ ] ✅ Rate limiting ativo
- [ ] ✅ Logs estruturados

### **Pós-Deploy**
- [ ] ✅ Health checks respondendo
- [ ] ✅ Monitoramento ativo
- [ ] ✅ Alertas configurados
- [ ] ✅ Backup automático
- [ ] ✅ Teste de failover
- [ ] ✅ Documentação atualizada

### **Testes de Integração**
- [ ] ✅ Webhook TradingView
- [ ] ✅ Execução de orders Bybit
- [ ] ✅ Análise OpenAI
- [ ] ✅ Envio SMS Twilio
- [ ] ✅ Queries PostgreSQL
- [ ] ✅ Cache Redis
- [ ] ✅ Autenticação JWT
- [ ] ✅ Rate limiting

---

**🎯 Sistema de Integrações V3.0.0 - Produção Operacional!**

**Última Atualização**: 31 de Janeiro de 2025
**Status**: PRODUCTION READY ✅
**Uptime Target**: 99.9%
