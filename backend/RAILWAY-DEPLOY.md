# 🚀 Deploy CoinBitClub Market Bot no Railway

Este guia explica como fazer o deploy completo do CoinBitClub Market Bot no Railway.

## 📋 Pré-requisitos

1. **Conta no Railway**: [railway.app](https://railway.app)
2. **Railway CLI**: `npm install -g @railway/cli`
3. **Git**: Código versionado
4. **Variáveis de ambiente**: APIs keys necessárias

## 🏗️ Arquitetura do Projeto

O sistema é composto por **8 microserviços**:

- **api-gateway** (porta 8080) - Gateway principal da API
- **signal-ingestor** (porta 9001) - Ingestão de sinais de trading
- **signal-processor** - Processamento de sinais
- **decision-engine** - Engine de decisões AI
- **order-executor** - Execução de ordens
- **accounting** - Sistema de contabilidade
- **notifications** - Sistema de notificações
- **admin-panel** (porta 9015) - Painel administrativo

## 🚀 Passos para Deploy

### 1. Setup Inicial

```bash
# Clone o repositório
git clone <seu-repositorio>
cd coinbitclub-market-bot/backend

# Login no Railway
railway login

# Criar novo projeto
railway create coinbitclub-market-bot
```

### 2. Configurar Banco de Dados

```bash
# Adicionar PostgreSQL
railway add postgresql

# Verificar se DATABASE_URL foi criada automaticamente
railway variables
```

### 3. Configurar Variáveis de Ambiente

```bash
# Dar permissão ao script
chmod +x setup-railway-env.sh

# Executar configuração básica
./setup-railway-env.sh
```

### 4. Configurar Variáveis Sensíveis

No **Railway Dashboard**, configure:

#### 🔐 Segurança
```
JWT_SECRET=sua-jwt-secret-super-segura-aqui
SESSION_SECRET=sua-session-secret-aqui
WEBHOOK_SECRET=sua-webhook-secret-aqui
```

#### 📊 APIs de Trading
```
BINANCE_API_KEY=sua-binance-api-key
BINANCE_SECRET_KEY=sua-binance-secret-key
BYBIT_API_KEY=sua-bybit-api-key
BYBIT_SECRET=sua-bybit-secret
```

#### 🤖 OpenAI
```
OPENAI_API_KEY=sk-sua-openai-api-key
```

#### 📧 Email (SMTP)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
```

#### 💳 Stripe
```
STRIPE_SECRET_KEY=sk_live_ou_test_sua_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_live_ou_test_sua_stripe_key
```

### 5. Deploy da Aplicação

```bash
# Deploy inicial (só API Gateway)
railway up

# Verificar logs
railway logs
```

### 6. Executar Migrações

```bash
# Conectar ao ambiente
railway shell

# Executar migrações
cd api-gateway && npm run migrate

# Executar seeds (opcional)
npm run db:seed
```

## 🔧 Configurações Avançadas

### Multiple Services (Opcional)

Para deploy de múltiplos serviços, você pode criar serviços separados:

```bash
# Criar serviço para admin-panel
railway create coinbitclub-admin-panel
# Deploy do admin-panel separadamente

# Criar serviço para signal-ingestor
railway create coinbitclub-signal-ingestor
# Deploy do signal-ingestor separadamente
```

### Monitoring

O sistema inclui:
- **Health checks** em `/health`
- **Metrics** em `/metrics`
- **Logs estruturados** com Winston

### Banco de Dados

- **PostgreSQL** é usado como banco principal
- **Migrações** automáticas via Knex.js
- **Seeds** para dados iniciais

## 🚨 Troubleshooting

### Erro de Build

```bash
# Verificar logs de build
railway logs --deployment

# Limpar cache
railway shell rm -rf node_modules
```

### Erro de Conexão com DB

```bash
# Verificar DATABASE_URL
railway variables

# Testar conexão
railway shell
node -e "console.log(process.env.DATABASE_URL)"
```

### Porta em Uso

O Railway automaticamente configura a variável `PORT`. O código usa:
```javascript
const port = env.API_GATEWAY_PORT || env.PORT || 3000;
```

## 🌐 URLs de Acesso

Após o deploy:

- **API Gateway**: `https://seu-projeto.railway.app`
- **Health Check**: `https://seu-projeto.railway.app/health`
- **Admin Panel**: `https://seu-projeto.railway.app:9015` (se habilitado)

## 📚 Documentação Adicional

- [Railway Docs](https://docs.railway.app)
- [PostgreSQL no Railway](https://docs.railway.app/databases/postgresql)
- [Environment Variables](https://docs.railway.app/develop/variables)

## 🆘 Suporte

Para suporte:
1. Verificar logs: `railway logs`
2. Verificar variáveis: `railway variables`
3. Verificar status: `railway status`

---

**✅ Após seguir todos os passos, sua aplicação estará rodando no Railway!**
