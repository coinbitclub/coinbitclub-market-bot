# 🚀 Comandos Rápidos para Deploy no Railway

## Conectar ao Projeto Existente
```bash
# 1. Login no Railway
railway login

# 2. Conectar ao projeto existente
railway link coinbitclub-market-bot

# 3. Verificar status
railway status

# 4. Ver variáveis existentes
railway variables
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
