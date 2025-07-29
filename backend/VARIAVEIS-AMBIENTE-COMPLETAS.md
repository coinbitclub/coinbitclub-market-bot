# 🔑 VARIÁVEIS DE AMBIENTE COMPLETAS - NOVO PROJETO RAILWAY

## ⚠️ ANTES DE CRIAR O PROJETO

Execute este comando para ver todas as variáveis:
```bash
.\gerar-variaveis-completas.ps1
```

---

## 📋 LISTA COMPLETA DE VARIÁVEIS

### **🔴 GRUPO 1: ESSENCIAIS PARA FUNCIONAMENTO**
```
DATABASE_URL=postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway
NODE_ENV=production
PORT=3000
```

### **🔐 GRUPO 2: SEGURANÇA**
```
JWT_SECRET=coinbitclub-production-secret-2025-ultra-secure
ENCRYPTION_KEY=coinbitclub-encryption-key-production-2025
SESSION_SECRET=coinbitclub-session-secret-2025-ultra-secure
WEBHOOK_SECRET=coinbitclub-webhook-secret-2025
```

### **⚙️ GRUPO 3: CONFIGURAÇÕES DO SISTEMA**
```
SISTEMA_MULTIUSUARIO=true
MODO_HIBRIDO=true
DEFAULT_LEVERAGE=10
DEFAULT_RISK_PERCENTAGE=2
MAX_CONCURRENT_TRADES=5
```

### **🌐 GRUPO 4: FRONTEND/CORS**
```
CORS_ORIGIN=https://coinbitclub-market-bot.vercel.app
FRONTEND_URL=https://coinbitclub-market-bot.vercel.app
BACKEND_URL=https://[NOVA-URL-DO-PROJETO]
```

### **💰 GRUPO 5: EXCHANGES (OBRIGATÓRIAS PARA TRADING)**
```
BINANCE_API_KEY=[CONFIGURAR_COM_CHAVE_REAL]
BINANCE_SECRET_KEY=[CONFIGURAR_COM_SECRET_REAL]
BYBIT_API_KEY=[CONFIGURAR_COM_CHAVE_REAL]
BYBIT_SECRET_KEY=[CONFIGURAR_COM_SECRET_REAL]
```

### **📱 GRUPO 6: OPCIONAIS (adicionar se já configurado)**
```
TWILIO_ACCOUNT_SID=[se_tem_SMS]
TWILIO_AUTH_TOKEN=[se_tem_SMS]
TWILIO_PHONE_NUMBER=[se_tem_SMS]
STRIPE_SECRET_KEY=[se_tem_pagamentos]
STRIPE_PUBLISHABLE_KEY=[se_tem_pagamentos]
TELEGRAM_BOT_TOKEN=[se_tem_telegram]
TELEGRAM_CHAT_ID=[se_tem_telegram]
```

---

## 🎯 ORDEM DE CONFIGURAÇÃO NO RAILWAY

### **1. PRIMEIRO: Grupos 1-4 (Sistema básico)**
- Total: 15 variáveis
- Sistema funcionará sem trading

### **2. SEGUNDO: Grupo 5 (Trading)**
- ⚠️ **CRÍTICO:** Sem essas, trading não funciona
- Precisa configurar com chaves reais das exchanges

### **3. TERCEIRO: Grupo 6 (Funcionalidades extras)**
- SMS, Pagamentos, Telegram
- Podem ser adicionadas depois

---

## 🔧 ONDE OBTER AS CHAVES REAIS

### **Binance:**
1. Login → API Management
2. Create API → Enable Spot & Futures Trading
3. Copiar API Key e Secret Key

### **Bybit:**
1. Login → API Management  
2. Create API → Enable Contract Trading
3. Copiar API Key e Secret Key

---

## ⚠️ AVISOS IMPORTANTES

### **🚨 SEM AS CHAVES DE EXCHANGE:**
- Sistema funcionará (painel, health checks)
- **MAS trading real NÃO funcionará**
- Aparecerão erros de conexão nas exchanges

### **✅ COM TODAS AS VARIÁVEIS:**
- Sistema 100% funcional
- Trading real operacional
- Todas as funcionalidades ativas

---

## 📊 RESUMO

- **Total de variáveis principais:** 19
- **Mínimo para funcionar:** 15 (grupos 1-4)
- **Para trading completo:** 19 (grupos 1-5)
- **Com extras:** 26 (todos os grupos)

---

## 🎯 PRÓXIMO PASSO

1. **Primeiro:** Configurar grupos 1-4 (sistema básico)
2. **Testar:** Sistema funcionando com `/health` e `/control`
3. **Depois:** Adicionar chaves de exchanges (grupo 5)
4. **Final:** Ativar trading via painel de controle

---

*💡 Lembre-se: O sistema já funciona sem as chaves de exchange, mas o trading real só funciona com elas configuradas*
