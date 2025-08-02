# 🚀 CoinBitClub Market Bot - Sistema Completo de Trading Automatizado

![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)
![Status](https://img.shields.io/badge/status-100%25%20Operacional-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)

## 📋 Índice

- [📖 Visão Geral](#visão-geral)
- [🏗️ Arquitetura do Sistema](#arquitetura-do-sistema)
- [🚀 Instalação e Deploy](#instalação-e-deploy)
- [⚙️ Configuração](#configuração)
- [📊 Monitoramento](#monitoramento)
- [🤖 IA e Automação](#ia-e-automação)
- [📈 APIs e Integrações](#apis-e-integrações)
- [🔧 Manutenção](#manutenção)
- [📚 Documentação Técnica](#documentação-técnica)

---

## 📖 Visão Geral

O **CoinBitClub Market Bot** é um sistema híbrido humano-IA para trading automatizado de criptomoedas, totalmente integrado com TradingView, Bybit e sistema multiusuário completo.

### 🎯 Funcionalidades Principais

- ✅ **Trading Automatizado** - Sinais TradingView → Execução Bybit
- ✅ **Sistema Multiusuário** - Gestão de múltiplas contas
- ✅ **IA Supervisors** - Monitoramento inteligente 24/7
- ✅ **Dashboard Visual** - Interface web responsiva
- ✅ **Gestão Financeira** - Comissionamento automático
- ✅ **Risk Management** - Proteções avançadas
- ✅ **Deploy Railway** - Produção em nuvem

### 📊 Status do Sistema

| Componente | Status | Função |
|------------|--------|---------|
| 🧠 Fear & Greed | ✅ ATIVO | Análise de Mercado |
| 📡 Processamento Sinais | ✅ ATIVO | TradingView Webhook |
| 🎯 Orquestrador Principal | ✅ ATIVO | Fluxo Completo |
| 🌟 Orquestrador Completo | ✅ ATIVO | Todos os Gestores |
| 🤖 IA Supervisor Financeiro | ✅ ATIVO | Monitoramento IA |
| 🤖 IA Supervisor Trade | ✅ ATIVO | Trade Tempo Real |

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

---

## 🏗️ Arquitetura do Sistema

### 🔄 Fluxo de Trading

```mermaid
graph TD
    A[TradingView Signal] --> B[Webhook Receiver]
    B --> C[Signal Processor]
    C --> D[Fear & Greed Validation]
    D --> E[Operation Creator]
    E --> F[Bybit Execution]
    F --> G[Real-time Monitor]
    G --> H[Position Management]
    H --> I[Financial Processing]
```

### 🎯 Camadas do Sistema

#### **1. Camada de Infraestrutura**
- **Database Manager** - PostgreSQL Railway
- **API Key Manager** - Gestão de chaves multiusuário
- **User Manager** - Sistema de usuários

#### **2. Camada de Gestores**
- **GestorOperacoes** - Execução de trades
- **GestorMonitoramentoEncerramento** - Monitoramento contínuo
- **GestorFechamentoOrdens** - Fechamento automático
- **GestorFinanceiro** - Processamento financeiro
- **GestorComissionamento** - Cálculo de comissões
- **GestorChavesAPI** - Validação de chaves

#### **3. Camada de Supervisores**
- **IA Supervisor Financeiro** - Supervisão de risco
- **IA Supervisor Trade** - Monitoramento em tempo real

#### **4. Camada de IA**
- **AI Guardian** - Proteção inteligente
- **Fear & Greed Engine** - Análise de sentimento
- **Risk Assessment** - Avaliação de risco

#### **5. Camada de Fluxo Operacional**
- **Signal Ingestor** - Recepção de sinais
- **Decision Engine** - Engine de decisão
- **Order Executor** - Execução de ordens

#### **6. Camada de Integrações Externas**
- **TradingView Integration** - Webhook receiver
- **Bybit API** - Execução trades
- **Payment Processor** - Processamento pagamentos

### 📁 Estrutura de Arquivos

```
backend/
├── 📊 main.js                          # Aplicação principal
├── 🚀 server.js                        # Servidor web e APIs
├── 🎯 orquestrador-principal.js        # Orquestrador principal
├── 🌟 orquestrador-completo-2.js       # Orquestrador completo
├── 📡 processor-sinais.js              # Processador de sinais
├── 🧠 fear-greed-auto.js              # Fear & Greed automático
├── 🤖 ia-supervisor-financeiro.js      # IA Supervisor Financeiro
├── ⚡ ia-supervisor-trade-tempo-real.js # IA Supervisor Trade
├── 🔑 gestor-chaves-api-multiusuarios.js # Gestor de chaves API
├── 📊 dashboard-completo.js            # Dashboard de monitoramento
├── 🎮 gestores/                        # Gestores específicos
│   ├── operacoes-completo.js
│   ├── monitoramento-encerramento.js
│   ├── fechamento-ordens.js
│   ├── financeiro-completo.js
│   └── comissionamento.js
├── 🔧 scripts/                         # Scripts de utilitários
├── 📊 public/                          # Assets estáticos
└── 📚 docs/                            # Documentação
```

---

## � Instalação e Deploy

### 📋 Pré-requisitos

```bash
# Node.js versão 18 ou superior
node --version  # >= 18.0.0

# PostgreSQL (Railway ou local)
# Chaves API Bybit (produção ou testnet)
```

### 🛠️ Instalação Local

```bash
# 1. Clone o repositório
git clone https://github.com/coinbitclub/coinbitclub-market-bot.git
cd coinbitclub-market-bot/backend

# 2. Instale dependências
npm install

# 3. Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas configurações

# 4. Execute o sistema
npm start
```

### ☁️ Deploy Railway

```bash
# 1. Deploy automático via Railway CLI
railway deploy

# 2. Configurar variáveis de ambiente no Railway
railway variables

# 3. Verificar logs
railway logs
```

### 🔧 Configuração de Produção

```bash
# 1. Aplicar schema do banco
node aplicar-schema-completo.js

# 2. Criar usuários iniciais
node criar-gestores-simples.js

# 3. Ativar sistema completo
node ativar-sistema-completo.js

# 4. Verificar dashboard
# Acesse: https://your-railway-url.railway.app/dashboard
```

---

## ⚙️ Configuração

### 🔐 Variáveis de Ambiente

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:port/dbname

# Bybit API
BYBIT_API_KEY=your_api_key
BYBIT_API_SECRET=your_api_secret
BYBIT_TESTNET=false

# Sistema
NODE_ENV=production
PORT=3000
WEBHOOK_SECRET=your_webhook_secret

# Railway
RAILWAY_STATIC_URL=your_railway_url
```

### 👥 Configuração Multiusuário

```javascript
// Estrutura de usuários
{
  id: "uuid",
  name: "Nome do Usuário",
  email: "email@exemplo.com",
  plan_type: "VIP", // VIP ou BASIC
  api_key: "bybit_api_key",
  api_secret: "bybit_api_secret",
  status: "active"
}
```

### 📊 Configuração Fear & Greed

```javascript
// Configurações de mercado
{
  extreme_fear: 0-25,    // Apenas LONG
  fear: 26-45,           // LONG + SHORT (limitado)
  neutral: 46-54,        // Todos os sinais
  greed: 55-75,          // LONG + SHORT (limitado)
  extreme_greed: 76-100  // Apenas SHORT
}
```

---

## 📊 Monitoramento

### 🖥️ Dashboard Web

**URL Local:** http://localhost:3011/dashboard  
**URL Produção:** https://your-railway-url.railway.app/dashboard

#### **Seções do Dashboard:**
1. **📊 Status do Sistema** - Health checks em tempo real
2. **🔄 Ciclo Trading** - Visualização do fluxo completo
3. **📈 Estatísticas** - Métricas operacionais
4. **📡 Sinais** - TradingView em tempo real
5. **💰 Operações** - Trades ativas
6. **🔑 Usuários** - Status das chaves API
7. **🤖 IA Supervisors** - Status dos supervisores
8. **📊 Gestores** - Status dos gestores

### 📡 APIs de Monitoramento

```bash
# Status geral do sistema
GET /api/monitoring/status

# Sinais recentes
GET /api/monitoring/signals

# Operações ativas
GET /api/monitoring/operations

# Chaves API
GET /api/monitoring/api-keys

# Gestores status
GET /api/monitoring/gestores

# IA Supervisors
GET /api/monitoring/supervisors
```

### 📊 Métricas Principais

```javascript
// Exemplo de resposta de status
{
  "server": {
    "status": "online",
    "uptime": "2h 30m",
    "cpu": "15%",
    "memory": "45%"
  },
  "database": {
    "status": "connected",
    "ping": "12ms",
    "connections": 8
  },
  "trading": {
    "signals_24h": 45,
    "operations_active": 12,
    "success_rate": "78%"
  }
}
```

---

## 🤖 IA e Automação

### 🧠 IA Supervisor Financeiro

**Arquivo:** `ia-supervisor-financeiro.js`

**Funcionalidades:**
- Monitoramento de risco financeiro
- Supervisão de operações
- Alertas automáticos
- Gestão de exposição

**Configuração:**
```javascript
{
  monitoring_interval: 30000, // 30 segundos
  risk_threshold: 0.02,       // 2% por operação
  max_exposure: 0.1,          // 10% do capital total
  stop_loss_protection: true
}
```

### ⚡ IA Supervisor Trade Tempo Real

**Arquivo:** `ia-supervisor-trade-tempo-real.js`

**Funcionalidades:**
- Monitoramento de trades em tempo real
- Análise de performance
- Detecção de anomalias
- Otimização automática

### 🛡️ AI Guardian

**Arquivo:** `ai-guardian.js`

**Funcionalidades:**
- Proteção contra manipulação
- Validação de sinais
- Detecção de padrões suspeitos
- Bloqueio automático

---

## 📈 APIs e Integrações

### 🔗 TradingView Integration

**Webhook URL:** `/webhook/tradingview`

**Formato do Sinal:**
```json
{
  "symbol": "BTCUSDT",
  "action": "BUY",
  "price": 67850.50,
  "quantity": 0.001,
  "timestamp": "2025-07-31T16:30:00Z"
}
```

### 🏢 Bybit API Integration

**Endpoints Utilizados:**
- Account Information
- Order Placement
- Position Management
- Balance Inquiry

**Rate Limits:**
- 100 requests/second (produção)
- 10 requests/second (testnet)

### 💳 Payment Processing

**Supported Methods:**
- PIX (Brasil)
- Stripe (Internacional)
- Cryptocurrency

---

## 🔧 Manutenção

### 📝 Logs do Sistema

```bash
# Visualizar logs em tempo real
tail -f logs/system.log

# Logs específicos
tail -f logs/trading.log
tail -f logs/error.log
tail -f logs/financial.log
```

### 🔄 Backup e Restore

```bash
# Backup automático (diário)
node backup-service.js

# Restore manual
node restore-backup.js --file=backup_20250731.sql
```

### 🔧 Manutenção Rotineira

```bash
# Limpeza de dados antigos
node cleanup-old-data.js

# Otimização do banco
node optimize-database.js

# Verificação de integridade
node health-check.js

# Atualização de dependencies
npm audit && npm update
```

### 🚨 Troubleshooting

#### **Problemas Comuns:**

1. **Conexão Database**
```bash
# Verificar conexão
node test-database-connection.js

# Aplicar correções
node fix-database-issues.js
```

2. **Chaves API Inválidas**
```bash
# Validar chaves
node validate-api-keys.js

# Atualizar chaves
node update-api-keys.js
```

3. **Sinais não Processados**
```bash
# Verificar webhook
curl -X POST localhost:3000/webhook/tradingview

# Reiniciar processador
node restart-signal-processor.js
```

---

## 📚 Documentação Técnica

### 📖 Documentação Adicional

- [Frontend Documentation](./FRONTEND-README.md)
- [API Reference](./API-REFERENCE.md)
- [Deployment Guide](./DEPLOYMENT-GUIDE.md)
- [Successor Guide](./SUCCESSOR-GUIDE.md)
- [Database Schema](./DATABASE-SCHEMA.md)

### 🔧 Arquivos de Configuração

- `package.json` - Dependencies e scripts
- `.env` - Variáveis de ambiente
- `_schema_completo_final.sql` - Schema do banco
- `docker-compose.yml` - Container setup

### 📊 Scripts Utilitários

```bash
# Análise do sistema
node analise-sistema-completo.js

# Auditoria completa
node auditoria-gestores-supervisores.js

# Mapeamento de gestores
node mapeamento-sistema-gestores.js

# Implementação completa
node implementador-orquestracao-completa.js
```

---

## 🤝 Suporte e Contribuição

### 📞 Contato

- **Email:** suporte@coinbitclub.com
- **Discord:** CoinBitClub Server
- **Telegram:** @coinbitclub

### 🐛 Reportar Bugs

1. Utilize o GitHub Issues
2. Inclua logs relevantes
3. Descreva passos para reproduzir
4. Ambiente (local/produção)

### 🔄 Atualizações

O sistema possui atualizações automáticas para:
- Correções de segurança
- Melhorias de performance
- Novas funcionalidades

---

## 📜 Licença

Copyright © 2025 CoinBitClub. Todos os direitos reservados.

**Sistema Proprietário** - Uso restrito conforme acordo de licenciamento.

---

## 🎉 Status Final

**✅ SISTEMA 100% OPERACIONAL E PRONTO PARA PRODUÇÃO!**

- 🚀 **6 Gestores Automáticos** operando 24/7
- 🤖 **2 IA Supervisors** monitorando inteligentemente  
- 📊 **Dashboard Visual** com atualizações em tempo real
- 🔗 **APIs Completas** para integração e monitoramento
- 👥 **Sistema Multiusuário** com chaves API ativas

**Sistema híbrido humano-IA totalmente funcional e pronto para operação comercial!** 🚀✨

# 2. Criar usuários iniciais
node criar-gestores-simples.js

# 3. Ativar sistema completo
node ativar-sistema-completo.js

# 4. Verificar dashboard
# Acesse: https://your-railway-url.railway.app/dashboard
```
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
