# Configuração de Variáveis de Ambiente - VERSÃO SANITIZADA

## ⚠️ INFORMAÇÕES SENSÍVEIS REMOVIDAS

Este arquivo contém a documentação de configuração das variáveis de ambiente, mas todas as chaves e dados sensíveis foram removidos por segurança.

## Frontend (Vercel)

### URLs de Produção
- Frontend: https://coinbitclub-market-bot.vercel.app
- Backend: https://coinbitclub-market-bot.up.railway.app

### Estrutura das Variáveis de Ambiente

```env
# URLs
NEXT_PUBLIC_API_URL=https://coinbitclub-market-bot.up.railway.app
NEXT_PUBLIC_FRONTEND_URL=https://coinbitclub-market-bot.vercel.app

# Stripe (chaves removidas por segurança)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_[REMOVIDO]
STRIPE_SECRET_KEY=sk_live_[REMOVIDO]
STRIPE_WEBHOOK_SECRET=whsec_[REMOVIDO]

# APIs externas (chaves removidas por segurança)
OPENAI_API_KEY=sk-[REMOVIDO]
COINSTATS_API_KEY=[REMOVIDO]

# Twilio (chaves removidas por segurança)
TWILIO_ACCOUNT_SID=[REMOVIDO]
TWILIO_AUTH_TOKEN=[REMOVIDO]
TWILIO_PHONE_NUMBER=[REMOVIDO]
TWILIO_VERIFY_SERVICE_SID=[REMOVIDO]
TWILIO_TEST_MODE=false
```

## Backend (Railway)

### Configuração do Banco de Dados
```env
DATABASE_URL=postgresql://[REMOVIDO]
```

### JWT e Segurança
```env
JWT_SECRET=[REMOVIDO]
JWT_REFRESH_SECRET=[REMOVIDO]
SYSTEM_API_KEY=[REMOVIDO]
ENCRYPTION_KEY=[REMOVIDO]
```

## ✅ Deploy Status

- ✅ Frontend deployed em Vercel
- ✅ Backend API Gateway preparado para Railway
- ✅ Variáveis de ambiente configuradas (chaves reais nos dashboards)
- ✅ Arquivos sensíveis removidos do Git

## 🔒 Segurança

Todas as chaves e informações sensíveis foram:
1. Removidas deste arquivo público
2. Adicionadas ao .gitignore
3. Configuradas manualmente nos dashboards das plataformas
4. Protegidas contra vazamentos no Git
