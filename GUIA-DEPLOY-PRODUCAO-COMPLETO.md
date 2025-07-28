# 🚀 GUIA COMPLETO DE DEPLOY EM PRODUÇÃO
## CoinBitClub Market Bot v3.0.0 - Deploy Vercel + Railway

### 📋 **PRÉ-REQUISITOS**
- ✅ Código no GitHub atualizado (main branch)
- ✅ Contas Vercel e Railway criadas
- ✅ Variáveis de ambiente preparadas

---

## 🌐 **PASSO 1: DEPLOY FRONTEND (VERCEL)**

### **1.1 Acessar Vercel Dashboard**
1. Acesse: https://vercel.com/dashboard
2. Clique em "New Project"
3. Conecte com GitHub se necessário

### **1.2 Importar Repositório**
1. Busque: `coinbitclub-market-bot`
2. Clique em "Import"
3. Configure as seguintes opções:

**Framework Preset:** Next.js  
**Root Directory:** `coinbitclub-frontend-premium`  
**Build Command:** `npm run build`  
**Output Directory:** `.next`  
**Install Command:** `npm install`  
**Node.js Version:** 18.x

### **1.3 Configurar Variáveis de Ambiente**
Na seção "Environment Variables", adicione:

```env
NEXTAUTH_URL=https://coinbitclub.vercel.app
NEXTAUTH_SECRET=prod-nextauth-secret-coinbitclub-2025-ultra-secure-1753709750
NEXT_PUBLIC_APP_URL=https://coinbitclub.vercel.app
API_URL=https://coinbitclub-backend.railway.app
NEXT_PUBLIC_API_URL=https://coinbitclub-backend.railway.app
NODE_ENV=production
NEXT_PUBLIC_ENV=production
```

### **1.4 Deploy**
1. Clique em "Deploy"
2. Aguarde o build completar (2-5 minutos)
3. Anote a URL gerada (exemplo: https://coinbitclub.vercel.app)

---

## 🖥️ **PASSO 2: DEPLOY BACKEND (RAILWAY)**

### **2.1 Acessar Railway Dashboard**
1. Acesse: https://railway.app/dashboard
2. Clique em "New Project"
3. Selecione "Deploy from GitHub repo"

### **2.2 Configurar Projeto**
1. Busque: `coinbitclub-market-bot`
2. Clique em "Deploy Now"
3. Vá para "Settings" do projeto

### **2.3 Configurar Deploy Settings**
**Start Command:** `node backend/api-gateway/server-ultra-minimal.cjs`  
**Healthcheck Path:** `/health`  
**Port:** `$PORT` (automático)  
**Region:** us-west1 (recomendado)

### **2.4 Configurar Variáveis de Ambiente**
Na aba "Variables", adicione:

```env
NODE_ENV=production
JWT_SECRET=prod-jwt-secret-coinbitclub-ultra-secure-1753709750
CORS_ORIGIN=https://coinbitclub.vercel.app
RATE_LIMIT_ENABLED=true
LOG_LEVEL=info
```

### **2.5 Configurar Database**
1. Clique em "Add Plugin"
2. Selecione "PostgreSQL"
3. A variável `DATABASE_URL` será criada automaticamente

### **2.6 Deploy**
1. O deploy inicia automaticamente
2. Aguarde completar (3-7 minutos)
3. Anote a URL gerada (exemplo: https://coinbitclub-backend.railway.app)

---

## 🔗 **PASSO 3: INTEGRAÇÃO E TESTES**

### **3.1 Atualizar URLs no Vercel**
1. Volte ao Vercel Dashboard
2. Vá em "Settings" > "Environment Variables"
3. Atualize as URLs do Railway:

```env
API_URL=https://[SUA-URL-RAILWAY].railway.app
NEXT_PUBLIC_API_URL=https://[SUA-URL-RAILWAY].railway.app
```

4. Faça um novo deploy: "Deployments" > "Redeploy"

### **3.2 Atualizar CORS no Railway**
1. Volte ao Railway Dashboard
2. Atualize a variável CORS_ORIGIN:

```env
CORS_ORIGIN=https://[SUA-URL-VERCEL].vercel.app
```

3. O serviço será reiniciado automaticamente

### **3.3 Testes Básicos**
Execute os seguintes testes:

```bash
# Teste Backend Health
curl https://[SUA-URL-RAILWAY].railway.app/health

# Teste Backend Status
curl https://[SUA-URL-RAILWAY].railway.app/api/status

# Teste Frontend
curl https://[SUA-URL-VERCEL].vercel.app
```

---

## ✅ **PASSO 4: VALIDAÇÃO COMPLETA**

### **4.1 Checklist de Funcionalidades**
- [ ] Homepage carrega sem erro
- [ ] Login/Register funcionam
- [ ] Dashboard admin acessível
- [ ] Dashboard usuário funcional
- [ ] APIs respondem corretamente
- [ ] HTTPS ativo em ambos os serviços
- [ ] CORS configurado corretamente

### **4.2 Testes de Performance**
```bash
# Teste de resposta do backend
time curl https://[SUA-URL-RAILWAY].railway.app/api/status

# Teste de carregamento do frontend
# Use PageSpeed Insights: https://pagespeed.web.dev/
```

### **4.3 Testes de Integração**
1. Acesse o frontend
2. Faça login
3. Navegue pelos dashboards
4. Verifique se os dados carregam
5. Teste funcionalidades principais

---

## 🔧 **TROUBLESHOOTING COMUM**

### **❌ Build Failures (Vercel)**
```bash
# Soluções:
- Verificar Node.js version (18.x)
- Conferir package.json dependencies
- Revisar typescript errors
- Verificar root directory setting
```

### **❌ CORS Errors**
```bash
# Verificar:
- CORS_ORIGIN no Railway correto
- API_URL no Vercel correto
- Headers incluem Authorization
- Requests usam HTTPS
```

### **❌ Database Connection Issues**
```bash
# Verificar:
- DATABASE_URL está presente
- PostgreSQL service está running
- SSL está habilitado
- Connection pool não está esgotada
```

### **❌ Environment Variables**
```bash
# Verificar:
- Todas as vars estão definidas
- Não há typos nos nomes
- Values não têm espaços extras
- Redeploy após mudanças
```

---

## 📊 **MONITORAMENTO PÓS-DEPLOY**

### **📈 Vercel Analytics**
1. Acesse Vercel Dashboard
2. Vá em "Analytics"
3. Configure Web Vitals monitoring

### **📈 Railway Observability**
1. Acesse Railway Dashboard
2. Vá em "Observability"
3. Configure alertas para:
   - CPU > 80%
   - Memory > 80%
   - Error rate > 5%

### **📊 URLs de Monitoramento**
- **Frontend Status:** https://[SUA-URL-VERCEL].vercel.app
- **Backend Health:** https://[SUA-URL-RAILWAY].railway.app/health
- **API Status:** https://[SUA-URL-RAILWAY].railway.app/api/status

---

## 🎉 **SUCESSO!**

### **✅ URLs de Produção Finais:**
- **Frontend:** https://[SUA-URL-VERCEL].vercel.app
- **Backend:** https://[SUA-URL-RAILWAY].railway.app
- **API Base:** https://[SUA-URL-RAILWAY].railway.app/api

### **📋 Próximos Passos:**
1. Configurar domínio customizado
2. Setup monitoramento avançado
3. Configurar backup automático
4. Implementar CI/CD
5. Documentar processo para equipe

---

**🚀 DEPLOY COMPLETO EM PRODUÇÃO!**

*Guia criado em 28/07/2025*  
*CoinBitClub Market Bot v3.0.0*  
*Status: Pronto para produção*
