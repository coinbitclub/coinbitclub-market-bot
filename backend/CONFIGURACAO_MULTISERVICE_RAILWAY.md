# 🔧 CONFIGURAÇÃO PADRÃO MULTISERVICE - COINBITCLUB

## ⚠️ CONFIGURAÇÃO CRÍTICA PARA EVITAR ERRO 502

### 📁 **railway.toml (OBRIGATÓRIO)**
```toml
[build]
builder = "DOCKERFILE"
watchPatterns = ["**/*.js", "**/*.cjs", "**/*.json"]

[deploy]
startCommand = "node server-multiservice-complete.cjs"
restartPolicyType = "ON_FAILURE" 
restartPolicyMaxRetries = 10
healthcheckPath = "/api/health"
healthcheckTimeout = 300

[environments.production.variables]
NODE_ENV = "production"
PORT = "3000"
DATABASE_URL = "${{DATABASE_URL}}"
WEBHOOK_TOKEN = "210406"
TRADINGVIEW_WEBHOOK_TOKEN = "coinbitclub-webhook-2025"

[environments.development.variables]
NODE_ENV = "development"
PORT = "3000"
DATABASE_URL = "postgresql://localhost:5432/coinbitclub_dev"
```

### 🐳 **Dockerfile (OBRIGATÓRIO)**
```dockerfile
# Use Node.js 18 Alpine image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm install --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# ⚠️ CRÍTICO: Usar servidor multiservice
CMD ["node", "server-multiservice-complete.cjs"]
```

### 📦 **package.json (Scripts)**
```json
{
  "scripts": {
    "start": "node server-multiservice-complete.cjs",
    "dev": "nodemon server-multiservice-complete.cjs",
    "test": "node -c server-multiservice-complete.cjs",
    "railway:start": "node server-multiservice-complete.cjs",
    "multiservice": "node server-multiservice-complete.cjs",
    "indicators": "node api-central-indicadores.js"
  }
}
```

## 🚨 **VERIFICAÇÕES OBRIGATÓRIAS**

### ✅ **Checklist Pré-Deploy**
```bash
# 1. Verificar se servidor multiservice existe
[ -f "server-multiservice-complete.cjs" ] && echo "✅ Servidor encontrado" || echo "❌ ERRO: Servidor não encontrado!"

# 2. Verificar sintaxe
node -c server-multiservice-complete.cjs && echo "✅ Sintaxe válida" || echo "❌ ERRO: Sintaxe inválida!"

# 3. Verificar railway.toml
grep -q "server-multiservice-complete.cjs" railway.toml && echo "✅ Railway configurado" || echo "❌ ERRO: Railway mal configurado!"

# 4. Verificar Dockerfile
grep -q "server-multiservice-complete.cjs" Dockerfile && echo "✅ Dockerfile correto" || echo "❌ ERRO: Dockerfile incorreto!"
```

### 🔧 **Comandos de Correção Rápida**
```bash
# Corrigir railway.toml
echo '[deploy]
startCommand = "node server-multiservice-complete.cjs"' >> railway.toml

# Corrigir Dockerfile
sed -i 's/CMD \[.*\]/CMD ["node", "server-multiservice-complete.cjs"]/' Dockerfile

# Testar localmente
node server-multiservice-complete.cjs

# Deploy no Railway
railway up --detach
```

## 🏗️ **ESTRUTURA MULTISERVICE**

### 🎯 **Servidor Principal (3000)**
- **Arquivo:** `server-multiservice-complete.cjs`
- **Funções:**
  - Webhook TradingView (`/api/webhooks/signal`)
  - IA Supervisor
  - Processamento de sinais
  - Monitoramento

### 📊 **Central Indicadores (3003)**
- **Arquivo:** `api-central-indicadores.js`
- **Funções:**
  - Dashboard APIs
  - Gestão usuários
  - Sistema financeiro
  - Afiliados

## ⚡ **ENDPOINTS CRÍTICOS**

### 🔍 **Verificação de Saúde**
```bash
# Testar servidor principal
curl -X GET "https://coinbitclub-market-bot.up.railway.app/"

# Testar webhook
curl -X GET "https://coinbitclub-market-bot.up.railway.app/api/webhooks/signal/test"

# Testar saúde geral
curl -X GET "https://coinbitclub-market-bot.up.railway.app/api/health"
```

### 📡 **Teste de Webhook**
```bash
# POST para webhook (com token)
curl -X POST "https://coinbitclub-market-bot.up.railway.app/api/webhooks/signal" \
  -H "Authorization: Bearer 210406" \
  -H "Content-Type: application/json" \
  -d '{"test": "signal"}'
```

## 🚨 **TROUBLESHOOTING RÁPIDO**

### **Erro 502 - Servidor não responde**
```bash
# 1. Verificar configuração
railway status

# 2. Ver logs
railway logs

# 3. Verificar variáveis
railway variables

# 4. Redeploy
railway up --detach
```

### **Erro 404 - Webhook não encontrado**
```bash
# 1. Verificar se servidor multiservice está rodando
ps aux | grep server-multiservice

# 2. Verificar se endpoint existe no código
grep -n "webhooks/signal" server-multiservice-complete.cjs

# 3. Testar endpoint test
curl https://coinbitclub-market-bot.up.railway.app/api/webhooks/signal/test
```

### **Erro Imports - Módulos não encontrados**
```bash
# 1. Comentar imports problemáticos
sed -i 's/^const whatsapp/\/\/ const whatsapp/' server-multiservice-complete.cjs

# 2. Verificar sintaxe
node -c server-multiservice-complete.cjs

# 3. Redeploy
railway up --detach
```

## 📋 **TEMPLATE DEPLOYMENTS**

### 🚀 **Deploy Seguro**
```bash
#!/bin/bash
echo "🚀 Iniciando deploy seguro..."

# Backup configurações
cp railway.toml railway.toml.backup
cp Dockerfile Dockerfile.backup

# Verificações
node -c server-multiservice-complete.cjs || exit 1
grep -q "server-multiservice-complete.cjs" railway.toml || exit 1

# Deploy
git add -A
git commit -m "🔧 Deploy: Configuração multiservice validada"
git push origin main
railway up --detach

# Aguardar e verificar
echo "⏳ Aguardando deploy..."
sleep 60

# Teste final
curl -f https://coinbitclub-market-bot.up.railway.app/api/health
if [ $? -eq 0 ]; then
    echo "✅ Deploy bem-sucedido!"
else
    echo "❌ Deploy com problemas - verificar logs"
    railway logs
fi
```

### 🔄 **Rollback Automático**
```bash
#!/bin/bash
echo "🔄 Executando rollback..."

# Voltar configurações
cp railway.toml.backup railway.toml
cp Dockerfile.backup Dockerfile

# Redeploy
railway up --detach

echo "✅ Rollback concluído"
```

## 🎯 **RESUMO EXECUTIVO**

### ✅ **SEMPRE FAZER:**
1. Usar `server-multiservice-complete.cjs` em produção
2. Configurar `railway.toml` corretamente
3. Testar localmente antes do deploy
4. Verificar webhook funcionando
5. Monitorar logs após deploy

### ❌ **NUNCA FAZER:**
1. Usar `server.js` em produção
2. Deploy sem testar localmente
3. Ignorar erros de sintaxe
4. Deploy sem verificar configurações
5. Esquecer de testar webhooks

### 🎖️ **COMANDOS ESSENCIAIS:**
```bash
# Verificação rápida
node -c server-multiservice-complete.cjs

# Deploy
railway up --detach

# Teste
curl https://coinbitclub-market-bot.up.railway.app/api/webhooks/signal/test

# Logs
railway logs
```

---

**📞 SUPORTE:**
- **Responsável:** GitHub Copilot AI
- **Última Atualização:** 29/07/2025
- **Versão:** 1.0.0 - Configuração Multiservice

**🎯 OBJETIVO:** Evitar 100% dos problemas de deploy relacionados à configuração incorreta do servidor.**
