# 🚀 Comandos Rápidos para Deploy no Railway

## Setup Inicial
```bash
# 1. Login no Railway
railway login

# 2. Criar projeto
railway create coinbitclub-market-bot

# 3. Adicionar PostgreSQL
railway add postgresql

# 4. Configurar variáveis básicas
chmod +x setup-railway-env.sh
./setup-railway-env.sh
```

## Deploy
```bash
# Deploy da aplicação
railway up

# Verificar logs
railway logs

# Verificar status
railway status
```

## Migrações
```bash
# Conectar ao ambiente
railway shell

# Executar migrações
cd api-gateway && npm run migrate

# Executar seeds
npm run db:seed
```

## Debugging
```bash
# Ver variáveis de ambiente
railway variables

# Ver logs em tempo real
railway logs --follow

# Conectar via shell
railway shell

# Reiniciar serviço
railway restart
```

## URLs Importantes
- **Aplicação**: `https://coinbitclub-market-bot-production.up.railway.app`
- **Health Check**: `https://coinbitclub-market-bot-production.up.railway.app/health`
- **Dashboard Railway**: `https://railway.app/dashboard`

## Configurações Manuais Necessárias

No Railway Dashboard, configure:

### Segurança
- `JWT_SECRET`
- `SESSION_SECRET` 
- `WEBHOOK_SECRET`

### APIs Trading
- `BINANCE_API_KEY`
- `BINANCE_SECRET_KEY`
- `BYBIT_API_KEY`
- `BYBIT_SECRET`

### OpenAI
- `OPENAI_API_KEY`

### Email
- `SMTP_HOST`
- `SMTP_USER`
- `SMTP_PASS`

### Stripe
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
