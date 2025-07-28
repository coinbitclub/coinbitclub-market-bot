# Configuração de Variáveis de Ambiente

## 🚨 PROBLEMA URGENTE IDENTIFICADO
O Railway está executando um servidor ultra-minimal sem as rotas da API necessárias.
**Consulte: CORRECAO-URGENTE-RAILWAY.md para solução imediata**

## URLs dos Sistemas
- **Frontend (Vercel):** https://coinbitclub-market-bot.vercel.app
- **Backend (Railway):** https://coinbitclub-market-bot.up.railway.app

## 🚀 Configuração no Vercel (Frontend)

### 1. Acesse o Dashboard do Vercel
- Vá para: https://vercel.com/dashboard
- Selecione o projeto: `coinbitclub-marketbot`
- Clique em "Settings" → "Environment Variables"

### 2. Adicione as seguintes variáveis:

```bash
# Configuração da API
NEXT_PUBLIC_API_URL=https://coinbitclub-market-bot.up.railway.app
NEXT_PUBLIC_ADMIN_API_URL=https://coinbitclub-market-bot.up.railway.app

# Configuração do Site
NEXT_PUBLIC_SITE_URL=https://coinbitclub-market-bot.vercel.app
NEXT_PUBLIC_SITE_NAME=CoinbitClub Market Bot
NEXT_PUBLIC_ENV=production

# Stripe (Produção)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51QCOIiBbdaDz4TVOX8Vh9KlFguewjyA2B2FNSSx5i5bUtzcei1aD399iUTyIk6PGQ3N8EW2lCO2lNRd1dWPp2E2X00ydaBMVUI

# Features
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_CHAT=true
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
NEXT_PUBLIC_DEBUG=false

# Google Analytics (opcional)
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=your_ga_id

# Sentry (opcional)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

---

## 🚂 Configuração no Railway (Backend)

### 1. Acesse o Dashboard do Railway
- Vá para: https://railway.app/dashboard
- Selecione o projeto: `coinbitclub-market-bot`
- Clique em "Variables"

### 2. Adicione as seguintes variáveis:

```bash
# Ambiente
NODE_ENV=production

# URLs
NEXT_PUBLIC_APP_URL=https://coinbitclub-market-bot.vercel.app
FRONTEND_URL=https://coinbitclub-market-bot.vercel.app
BACKEND_URL=https://coinbitclub-market-bot.up.railway.app

# Database (Railway PostgreSQL)
DATABASE_URL=postgresql://postgres:password@host:5432/railway

# JWT
JWT_SECRET=your-super-secure-jwt-secret-for-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret-for-production

# Stripe (Produção)
STRIPE_SECRET_KEY=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
STRIPE_PUBLISHABLE_KEY=pk_live_51QCOIiBbdaDz4TVOX8Vh9KlFguewjyA2B2FNSSx5i5bUtzcei1aD399iUTyIk6PGQ3N8EW2lCO2lNRd1dWPp2E2X00ydaBMVUI
STRIPE_WEBHOOK_SECRET=whsec_cJ97DwC5rzz84PqCSbmTJfyQxykcrStU

# URLs do Stripe
STRIPE_SUCCESS_URL=https://coinbitclub-market-bot.vercel.app/sucesso?session_id={CHECKOUT_SESSION_ID}
STRIPE_CANCEL_URL=https://coinbitclub-market-bot.vercel.app/cancelado

# OpenAI
OPENAI_API_KEY=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

# CoinStats API
COINSTATS_API_KEY=ZFIxigBcVaCyXDL1Qp/Ork7TOL3+h07NM2f3YoSrMkI=

# WhatsApp API (Z-API)
ZAPI_INSTANCE=3E0819291FB89055AED996E82C2DBF10
ZAPI_TOKEN=2ECE7BD31B3B8E299FC68D6C

# Segurança
SYSTEM_API_KEY=your-system-api-key-for-cron-jobs
ENCRYPTION_KEY=your-32-character-encryption-key-here
TRADINGVIEW_WEBHOOK_SECRET=your-tradingview-webhook-secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# CORS
ALLOWED_ORIGINS=https://coinbitclub-market-bot.vercel.app,https://coinbitclub-market-bot.up.railway.app
```

---

## 📝 Checklist de Verificação

### Vercel (Frontend):
- [ ] `NEXT_PUBLIC_API_URL` aponta para Railway
- [ ] `NEXT_PUBLIC_SITE_URL` está correto
- [ ] Chaves públicas do Stripe estão configuradas
- [ ] Deploy foi realizado após configuração

### Railway (Backend):
- [ ] `DATABASE_URL` está configurado (PostgreSQL do Railway)
- [ ] `FRONTEND_URL` aponta para Vercel
- [ ] `ALLOWED_ORIGINS` inclui ambas as URLs
- [ ] Chaves secretas do Stripe estão configuradas
- [ ] Variáveis de APIs externas estão definidas

---

## 🔧 Comandos para Deploy

### Frontend (Vercel):
```bash
# Fazer deploy manual
vercel --prod

# Ou via commit/push (auto-deploy)
git add .
git commit -m "Update environment variables"
git push origin main
```

### Backend (Railway):
```bash
# Railway faz deploy automático via Git
git add .
git commit -m "Update environment variables"
git push origin main
```

---

## 🧪 Teste de Conectividade

Após configurar as variáveis, teste a conectividade:

1. **Acesse o frontend:** https://coinbitclub-marketbot.vercel.app
2. **Teste a API:** https://coinbitclub-market-bot.up.railway.app/health
3. **Verifique os logs** tanto no Vercel quanto no Railway

---

## ⚠️ Notas Importantes

1. **Após alterar variáveis no Vercel:** Faça um novo deploy
2. **Após alterar variáveis no Railway:** O deploy é automático
3. **URLs devem ter HTTPS** em produção
4. **Não inclua `/` no final das URLs das variáveis**
5. **Substitua as chaves de exemplo** pelas chaves reais de produção
