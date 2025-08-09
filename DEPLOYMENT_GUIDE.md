# 🚀 Guia de Configuração - CoinbitClub Market Bot

## 📋 Configuração do Railway (Backend)

### 1. Variáveis de Ambiente Obrigatórias

Acesse: https://railway.app/project/seu-projeto/settings/environment

**Banco de Dados (Já configurado automaticamente pelo Railway PostgreSQL):**
```
DATABASE_URL = postgresql://user:password@host:port/database
```

**Configurações Essenciais:**
```
NODE_ENV = production
PORT = 8081
JWT_SECRET = seu_jwt_secret_super_seguro_aqui
CORS_ORIGIN = https://coinbitclub-market-bot.vercel.app
```

**APIs de Trading (Configure com suas chaves):**
```
BINANCE_API_KEY = sua_chave_binance
BINANCE_SECRET_KEY = sua_chave_secreta_binance
BYBIT_API_KEY = sua_chave_bybit
BYBIT_SECRET = sua_chave_secreta_bybit
```

**OpenAI (Para AI Trading):**
```
OPENAI_API_KEY = sua_chave_openai
```

**Stripe (Pagamentos):**
```
STRIPE_SECRET_KEY = sua_chave_secreta_stripe
STRIPE_PUBLISHABLE_KEY = sua_chave_publica_stripe
```

**Email (SMTP):**
```
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_USER = seu_email@gmail.com
SMTP_PASS = sua_senha_app_gmail
```

### 2. Configuração do Serviço Railway

**Build Settings:**
- Build Command: (deixar vazio - usa Dockerfile)
- Start Command: (deixar vazio - usa CMD do Dockerfile)

**Deploy Settings:**
- Root Directory: / (raiz do projeto)
- Health Check Path: /health

## 📋 Configuração do Vercel (Frontend)

Acesse: https://vercel.com/seu-usuario/coinbitclub-market-bot/settings/environment-variables

**Configurações do Frontend:**
```
NEXT_PUBLIC_API_URL = https://coinbitclub-market-bot-production.up.railway.app
NEXT_PUBLIC_SITE_URL = https://coinbitclub-market-bot.vercel.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = sua_chave_publica_stripe
NEXT_PUBLIC_ENV = production
```

## 🔄 Deploy Automático

### 1. GitHub → Railway (Backend)
- Railway detecta automaticamente mudanças na branch `main`
- Build é executado usando o Dockerfile
- Deploy automático após build bem-sucedido

### 2. GitHub → Vercel (Frontend) 
- Vercel detecta mudanças no diretório `coinbitclub-frontend-premium`
- Build automático do Next.js
- Deploy automático em produção

## 🔍 Verificação de Deploy

### URLs de Produção:
- **Frontend**: https://coinbitclub-market-bot.vercel.app
- **Backend**: https://coinbitclub-market-bot-production.up.railway.app
- **Health Check**: https://coinbitclub-market-bot-production.up.railway.app/health

### Testes Essenciais:
1. ✅ Landing page carregando
2. ✅ Cadastro de usuário funcionando
3. ✅ Login redirecionando corretamente
4. ✅ Dashboard carregando dados
5. ✅ API respondendo no health check

## 🛠️ Resolução de Problemas

### Se o Railway falhar no build:
1. Verificar logs em Railway Dashboard
2. Confirmar se todas as variáveis de ambiente estão definidas
3. Verificar se o PostgreSQL está conectado
4. Restart manual se necessário

### Se o Vercel falhar no build:
1. Verificar logs no Vercel Dashboard
2. Confirmar variáveis NEXT_PUBLIC_* definidas
3. Verificar se a API_URL está correta

### Se a integração Frontend-Backend falhar:
1. Verificar CORS_ORIGIN no Railway
2. Testar health check: /health
3. Verificar se a API_URL no frontend está correta

## 📊 Monitoramento

### Logs Railway:
```bash
railway logs --project coinbitclub-market-bot
```

### Logs Vercel:
- Acesse Functions tab no dashboard
- Visualize real-time logs

### Health Checks:
- Railway: https://seu-backend.railway.app/health
- Deve retornar: `{"status": "ok", "timestamp": "..."}`

## 🔐 Segurança

### Chaves obrigatórias para gerar:
```bash
# JWT Secret (Node.js)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Session Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Webhook Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## ✅ Checklist Final

- [ ] PostgreSQL configurado no Railway
- [ ] Todas as variáveis de ambiente definidas
- [ ] Deploy do backend bem-sucedido
- [ ] Deploy do frontend bem-sucedido
- [ ] Health check respondendo
- [ ] Landing page acessível
- [ ] Cadastro funcionando
- [ ] Login funcionando
- [ ] Dashboards carregando
- [ ] APIs de trading configuradas (opcional)
- [ ] Pagamentos configurados (opcional)

## 🎉 Pronto!

Seu sistema CoinbitClub Market Bot está 100% funcional e integrado!

**URLs Finais:**
- 🌐 Site: https://coinbitclub-market-bot.vercel.app
- 🔧 API: https://coinbitclub-market-bot-production.up.railway.app
- 📊 Dashboard: https://coinbitclub-market-bot.vercel.app/dashboard
- 👤 Admin: https://coinbitclub-market-bot.vercel.app/admin
