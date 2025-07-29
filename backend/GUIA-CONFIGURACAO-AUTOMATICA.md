# 🚀 CONFIGURAÇÃO AUTOMÁTICA DO NOVO PROJETO RAILWAY

## ⚡ OPÇÃO 1: AUTOMÁTICA VIA CLI (MAIS RÁPIDA)

### **Pré-requisitos:**
1. Node.js instalado
2. Acesso ao projeto Railway criado

### **Executar configuração automática:**
```bash
node configurar-railway-cli.js
```

**O que o script faz:**
- ✅ Instala Railway CLI automaticamente  
- ✅ Conecta ao projeto Railway
- ✅ Configura todas as 15 variáveis principais
- ✅ Mostra próximos passos

---

## ⚡ OPÇÃO 2: BATCH SCRIPT (WINDOWS)

```bash
setup-railway-auto.bat
```

**Executa automaticamente:**
- Conecta ao projeto
- Configura todas as variáveis básicas
- Mostra comandos para exchanges

---

## ⚡ OPÇÃO 3: COMANDOS MANUAL VIA CLI

### **1. Instalar e conectar:**
```bash
npm install -g @railway/cli
railway login
railway link
```

### **2. Copiar e colar comandos:**
```bash
railway variables set DATABASE_URL="postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway"
railway variables set NODE_ENV="production"
railway variables set PORT="3000"
railway variables set JWT_SECRET="coinbitclub-production-secret-2025-ultra-secure"
railway variables set ENCRYPTION_KEY="coinbitclub-encryption-key-production-2025"
railway variables set SESSION_SECRET="coinbitclub-session-secret-2025-ultra-secure"
railway variables set WEBHOOK_SECRET="coinbitclub-webhook-secret-2025"
railway variables set SISTEMA_MULTIUSUARIO="true"
railway variables set MODO_HIBRIDO="true"
railway variables set DEFAULT_LEVERAGE="10"
railway variables set DEFAULT_RISK_PERCENTAGE="2"
railway variables set MAX_CONCURRENT_TRADES="5"
railway variables set CORS_ORIGIN="https://coinbitclub-market-bot.vercel.app"
railway variables set FRONTEND_URL="https://coinbitclub-market-bot.vercel.app"
```

---

## 🎯 APÓS CONFIGURAÇÃO AUTOMÁTICA

### **1. Configurar URL do novo projeto:**
```bash
railway variables set BACKEND_URL="https://[URL-DO-NOVO-PROJETO]"
```

### **2. Configurar exchanges (OBRIGATÓRIO PARA TRADING):**
```bash
railway variables set BINANCE_API_KEY="[SUA_CHAVE_BINANCE]"
railway variables set BINANCE_SECRET_KEY="[SEU_SECRET_BINANCE]"
railway variables set BYBIT_API_KEY="[SUA_CHAVE_BYBIT]"
railway variables set BYBIT_SECRET_KEY="[SEU_SECRET_BYBIT]"
```

### **3. Fazer deploy:**
```bash
railway up
```

### **4. Testar sistema:**
```bash
node testar-novo-projeto.js [nova-url]
```

---

## 📊 RESULTADO ESPERADO

### **✅ Configuração completa:**
- 15 variáveis principais configuradas
- Sistema básico funcionando
- Banco de dados conectado
- Painel `/control` disponível

### **⚠️ Ainda necessário:**
- URL do novo projeto (BACKEND_URL)
- Chaves das exchanges (para trading real)

---

## 🔧 TROUBLESHOOTING

### **Se Railway CLI não instalar:**
- Execute manualmente: `npm install -g @railway/cli`
- Use OPÇÃO 3 (comandos manuais)

### **Se não conectar ao projeto:**
- Execute: `railway login` primeiro
- Escolha o projeto correto no `railway link`

### **Se variáveis não configurarem:**
- Use interface web: Railway Dashboard → Settings → Variables
- Copie da lista em `gerar-variaveis-completas.ps1`

---

## 🎉 EXECUÇÃO RECOMENDADA

**MAIS SIMPLES:**
```bash
node configurar-railway-cli.js
```

**Depois configurar exchanges e fazer deploy!**

---

*🎯 Objetivo: Novo projeto configurado e operacional em 5-10 minutos*
