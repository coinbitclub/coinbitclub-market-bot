# 🚀 CoinBitClub Market Bot V3.0.0 - Backend

## 📋 Visão Geral

Sistema completo de trading automatizado com IA, análise de sentimento, gestão de risco e operação em tempo real. Inclui API REST robusta, webhooks TradingView, monitoramento 24/7 e dashboard operacional.

## ✨ Características Principais

### 🤖 **Inteligência Artificial**
- **OpenAI GPT-4** para análise de sinais
- **Análise de Sentimento** em tempo real
- **Detecção de Padrões** automática
- **Machine Learning** adaptativo

### 📊 **Sistema de Trading**
- **Webhook TradingView** para sinais
- **Processamento Multi-usuário** simultâneo
- **Gestão de Risco** inteligente
- **Execução Automática** de ordens

### 🛡️ **Segurança e Monitoramento**
- **Criptografia** de API keys
- **Rate Limiting** avançado
- **Monitoramento 24/7**
- **Backup Automático**
- **Failover System**

### 📱 **Notificações**
- **SMS via Twilio** para alertas críticos
- **Email** para relatórios
- **Push Notifications** para mobile
- **Webhooks** personalizados

## 🏗️ Arquitetura

```
backend/
├── 📁 controllers/          # Controladores da API
├── 📁 services/            # Serviços de negócio
├── 📁 managers/            # Gestores de sistema
├── 📁 supervisors/         # Supervisores de processo
├── 📁 ai/                  # Módulos de IA
├── 📁 middleware/          # Middlewares Express
├── 📁 routes/              # Rotas da API
├── 📁 models/              # Modelos de dados
├── 📁 utils/               # Utilitários
├── 📁 config/              # Configurações
├── 📁 scripts/             # Scripts de manutenção
└── 📁 tests/               # Testes automatizados
```

## 🛠️ Instalação e Configuração

### 1. **Pré-requisitos**
```bash
Node.js >= 18.0.0
PostgreSQL >= 13
Redis >= 6.0
```

### 2. **Instalação**
```bash
# Clone o repositório
git clone https://github.com/coinbitclub/coinbitclub-market-bot.git
cd coinbitclub-market-bot/backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações
```

### 3. **Configuração do Banco**
```bash
# Aplicar schema completo
node aplicar-schema-completo.js

# Limpar dados de teste (PRODUÇÃO)
node limpar-dados-teste-completo.js
```

### 4. **Inicialização**
```bash
# Desenvolvimento
npm run dev

# Produção
npm start

# Com PM2
pm2 start ecosystem.config.js
```

## 🔧 Variáveis de Ambiente

### **Database**
```env
DATABASE_URL=postgresql://user:pass@host:port/db
POSTGRES_SSL=true
```

### **APIs Externas**
```env
OPENAI_API_KEY=sk-...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+...
```

### **Trading**
```env
BYBIT_API_KEY=...
BYBIT_SECRET=...
BYBIT_TESTNET=false
```

### **Sistema**
```env
NODE_ENV=production
PORT=3000
JWT_SECRET=...
ENCRYPTION_KEY=...
REDIS_URL=redis://...
```

## 📡 API Endpoints

### **Sistema de Controle**
```http
POST   /api/system/start           # Ligar sistema
POST   /api/system/stop            # Desligar sistema
GET    /api/system/status          # Status do sistema
POST   /api/system/configure       # Configurar sistema
GET    /api/system/health          # Health check
```

### **Trading**
```http
POST   /api/webhook/tradingview     # Webhook TradingView
GET    /api/market/reading          # Leitura de mercado
GET    /api/operations/metrics      # Métricas de operações
GET    /api/operations/open         # Operações abertas
GET    /api/operations/history      # Histórico de operações
```

### **Monitoramento**
```http
GET    /api/monitoring/status       # Status monitoramento
GET    /api/dashboard               # Dashboard principal
GET    /api/analytics/performance   # Analytics de performance
GET    /api/analytics/risk          # Análise de risco
```

### **Usuários**
```http
GET    /api/users                   # Listar usuários
GET    /api/users/:id               # Detalhes do usuário
PUT    /api/users/:id               # Atualizar usuário
GET    /api/users/:id/balance       # Saldo do usuário
GET    /api/users/:id/operations    # Operações do usuário
```

### **IA e Análise**
```http
POST   /api/ai/analyze              # Análise de IA
GET    /api/ai/sentiment            # Análise de sentimento
GET    /api/ai/predictions          # Predições
GET    /api/ai/patterns             # Detecção de padrões
```

## 🔐 Autenticação

### **JWT Token**
```javascript
// Headers necessários
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

### **API Key (Webhook)**
```javascript
// Para webhooks TradingView
{
  "X-API-Key": "YOUR_WEBHOOK_API_KEY",
  "Content-Type": "application/json"
}
```

## 📊 Estrutura de Dados

### **Sinal do TradingView**
```json
{
  "signal": "SINAL LONG FORTE",
  "ticker": "BTCUSDT",
  "close": "45000.00",
  "volume": "1250.50",
  "time": "2025-01-31T15:30:00.000Z",
  "source": "TradingView_Real_Production"
}
```

### **Resposta de Operação**
```json
{
  "success": true,
  "operation_id": "uuid-v4",
  "user_id": "uuid-v4",
  "signal_id": "uuid-v4",
  "ticker": "BTCUSDT",
  "side": "BUY",
  "quantity": "0.001",
  "price": "45000.00",
  "status": "FILLED",
  "created_at": "2025-01-31T15:30:00.000Z"
}
```

### **Status do Sistema**
```json
{
  "status": "OPERATIONAL",
  "version": "3.0.0",
  "uptime": 86400,
  "services": {
    "database": "CONNECTED",
    "redis": "CONNECTED",
    "trading": "ACTIVE",
    "ai": "OPERATIONAL",
    "monitoring": "ACTIVE"
  },
  "metrics": {
    "operations_today": 156,
    "success_rate": 87.5,
    "total_pnl": 1250.75,
    "active_users": 25
  }
}
```

## 🚨 Monitoramento e Alertas

### **Health Checks**
- **Database**: Conexão e latência
- **Redis**: Disponibilidade e memória
- **APIs Externas**: Status e rate limits
- **Trading**: Execução e latência
- **IA**: Disponibilidade e performance

### **Alertas Automáticos**
- **SMS**: Falhas críticas, operações de alto valor
- **Email**: Relatórios diários, alertas de sistema
- **Dashboard**: Métricas em tempo real

### **Métricas Principais**
- **Uptime**: 99.9% target
- **Latência**: < 500ms para sinais
- **Taxa de Sucesso**: > 85%
- **PnL Tracking**: Tempo real
- **User Activity**: Monitoramento contínuo

## 🔄 Deploy e Manutenção

### **Deploy com PM2**
```bash
# Instalar PM2
npm install -g pm2

# Deploy
pm2 start ecosystem.config.js

# Monitorar
pm2 status
pm2 logs
pm2 monit
```

### **Deploy com Docker**
```bash
# Build
docker build -t coinbitclub-bot .

# Run
docker run -d \
  --name coinbitclub-bot \
  -p 3000:3000 \
  --env-file .env \
  coinbitclub-bot
```

### **Backup Automático**
```bash
# Database backup (diário)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Logs rotation
logrotate /etc/logrotate.d/coinbitclub-bot
```

## 🧪 Testes

### **Executar Testes**
```bash
# Todos os testes
npm test

# Testes unitários
npm run test:unit

# Testes de integração
npm run test:integration

# Coverage
npm run test:coverage
```

### **Testes de Conectividade**
```bash
# Testar conexões
node teste-conectividade-simples.js

# Teste completo com OpenAI e Twilio
node teste-completo-openai-twilio.js
```

## 📈 Performance

### **Otimizações Implementadas**
- **Connection Pooling**: PostgreSQL
- **Redis Caching**: Dados frequentes
- **Rate Limiting**: Proteção contra spam
- **Batch Processing**: Operações em lote
- **Async/Await**: Operações não-bloqueantes

### **Métricas de Performance**
- **Processamento de Sinal**: < 2s
- **Execução de Ordem**: < 5s
- **Query Database**: < 100ms
- **Cache Hit Rate**: > 90%

## 🔒 Segurança

### **Práticas Implementadas**
- **Criptografia**: AES-256 para dados sensíveis
- **Rate Limiting**: Por IP e usuário
- **Input Validation**: Sanitização completa
- **SQL Injection**: Queries parametrizadas
- **CORS**: Configuração restritiva
- **Helmet**: Headers de segurança

### **Auditoria**
- **Logs Completos**: Todas as operações
- **Tracking**: Ações de usuário
- **Monitoring**: Tentativas de acesso
- **Backup**: Dados críticos

## 🆘 Troubleshooting

### **Problemas Comuns**

#### **Database Connection Error**
```bash
# Verificar conectividade
pg_isready -h yamabiko.proxy.rlwy.net -p 42095

# Testar query
psql $DATABASE_URL -c "SELECT NOW();"
```

#### **High Memory Usage**
```bash
# Verificar processos
pm2 monit

# Restart se necessário
pm2 restart coinbitclub-bot
```

#### **API Rate Limit**
```bash
# Verificar logs
pm2 logs coinbitclub-bot --lines 100

# Ajustar rate limiting
# Editar config/rateLimiting.js
```

### **Logs Importantes**
```bash
# Sistema
tail -f logs/system.log

# Operações
tail -f logs/operations.log

# Erros
tail -f logs/error.log

# Trading
tail -f logs/trading.log
```

## 👥 Equipe de Desenvolvimento

### **Backend Team**
- **API Development**: REST/GraphQL
- **Database**: PostgreSQL optimization
- **Security**: Authentication/Authorization
- **Performance**: Caching/Optimization

### **DevOps Team**
- **Infrastructure**: AWS/Railway
- **Monitoring**: Grafana/Prometheus
- **CI/CD**: GitHub Actions
- **Backup**: Automated systems

## 📞 Suporte

### **Contatos**
- **Tech Lead**: backend@coinbitclub.com
- **DevOps**: devops@coinbitclub.com
- **Security**: security@coinbitclub.com

### **Documentação Adicional**
- **API Docs**: `/docs` (Swagger)
- **Architecture**: `docs/architecture.md`
- **Deployment**: `docs/deployment.md`
- **Security**: `docs/security.md`

## 📝 Changelog

### **v3.0.0** (2025-01-31)
- ✨ Sistema completo de IA integrado
- 🚀 Webhook TradingView otimizado
- 📊 Dashboard em tempo real
- 🔐 Segurança aprimorada
- 📱 Notificações SMS/Email
- 🛡️ Sistema de failover
- 📈 Analytics avançado
- 🧪 Testes automatizados

---

**🎯 Sistema Pronto para Produção - Operação 24/7**
