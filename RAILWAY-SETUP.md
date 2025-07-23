# 🚀 Guia de Configuração - Railway Deploy

## ✅ CORREÇÕES APLICADAS

### 📦 Dependências Corrigidas
- ✅ Removido package-lock.json desatualizado
- ✅ Regenerado com versões corretas
- ✅ Dockerfile atualizado para usar `npm install`
- ✅ Health check adicionado

### 🔧 Próximos Passos no Railway

1. **Acesse o Railway Dashboard:**
   - URL: https://railway.app/project/coinbitclub-market-bot
   - Vá para Settings > Variables

2. **Configure estas variáveis de ambiente OBRIGATÓRIAS:**

```bash
# Database (Railway PostgreSQL)
DATABASE_URL=${Postgres.DATABASE_URL}
NODE_ENV=production
PORT=8081

# JWT (OBRIGATÓRIO - gere uma chave forte)
JWT_SECRET=sua_chave_jwt_super_secreta_aqui_min_32_chars

# CORS (Para conectar com o frontend)
CORS_ORIGIN=https://coinbitclub-market-bot.vercel.app

# Optional APIs (adicione conforme necessário)
OPENAI_API_KEY=sua_chave_openai
BINANCE_API_KEY=sua_chave_binance
BINANCE_SECRET_KEY=seu_secret_binance
STRIPE_SECRET_KEY=sua_chave_stripe
```

3. **Verificações de Deploy:**
   - ✅ Railway deve detectar as mudanças automaticamente
   - ✅ Build agora usa `npm install` (mais robusto)
   - ✅ Container expõe porta 8081
   - ✅ Health check em `/health`

## 🔗 URLs de Produção

- **Frontend:** https://coinbitclub-market-bot.vercel.app
- **Backend:** https://coinbitclub-market-bot-production.up.railway.app
- **Health Check:** https://coinbitclub-market-bot-production.up.railway.app/health

## 🧪 Como Testar

Execute o monitoramento automático:
```bash
# Windows PowerShell
.\monitor-deploy.ps1

# Git Bash / Linux
./monitor-deploy.sh
```

## ⚠️ IMPORTANTE

1. **Banco de Dados:** O Railway criará automaticamente um PostgreSQL
2. **Migrações:** Serão executadas automaticamente no primeiro deploy
3. **Logs:** Verifique os logs do Railway para debug se necessário

## 📞 Status do Sistema

Quando o health check retornar 200 OK, o sistema estará pronto!

---

🎯 **O projeto está configurado corretamente e pronto para deploy!**
