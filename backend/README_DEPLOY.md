# 🚀 GUIA COMPLETO DE DEPLOY - COINBITCLUB MARKET BOT

## 📋 Problema Identificado e Solução

### ❌ Problema Original
- **Erro 502** no Railway devido ao uso do arquivo servidor incorreto
- Sistema configurado para usar `server.js` ao invés de `server-multiservice-complete.cjs`
- Falta de endpoints webhook essenciais
- Configuração inconsistente entre arquivos de deploy

### ✅ Solução Implementada
- Atualização de todos os arquivos de configuração para usar o servidor multiservice correto
- Implementação dos endpoints webhook necessários
- Criação de scripts de validação automática
- Documentação completa para prevenir recorrência

---

## 🏗️ Arquitetura Multi-Service

### Servidores
1. **server-multiservice-complete.cjs** (Porta 3000)
   - Webhook endpoints (`/api/webhooks/signal`)
   - API core do sistema
   - Integração TradingView

2. **api-central-indicadores.js** (Porta 3003)
   - Dashboard APIs
   - Indicadores técnicos
   - Interface administrativa

### Endpoints Críticos
```
POST /api/webhooks/signal          # Webhook principal TradingView
GET  /api/webhooks/signal/test     # Teste de conectividade
GET  /health                       # Health check
```

---

## 🔧 Configurações de Deploy

### 1. railway.toml
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "node server-multiservice-complete.cjs"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

### 2. Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server-multiservice-complete.cjs"]
```

### 3. package.json
```json
{
  "scripts": {
    "start": "node server-multiservice-complete.cjs",
    "dev": "nodemon server-multiservice-complete.cjs"
  }
}
```

---

## 🔍 Scripts de Validação

### Para Windows (PowerShell)
```powershell
# Executar validação completa
.\validate-deploy-complete.ps1

# Ou com bypass de política de execução
powershell -ExecutionPolicy Bypass -File validate-deploy-complete.ps1
```

### Para Linux/Mac (Bash)
```bash
# Executar validação completa
./validate-deploy.sh

# Dar permissão se necessário
chmod +x validate-deploy.sh && ./validate-deploy.sh
```

---

## 📊 Checklist de Validação

### ✅ Arquivos Obrigatórios
- [ ] `server-multiservice-complete.cjs` existe e tem conteúdo
- [ ] `railway.toml` configurado para multiservice
- [ ] `Dockerfile` com CMD correto
- [ ] `package.json` com script start apropriado

### ✅ Endpoints Implementados
- [ ] `/api/webhooks/signal` (POST)
- [ ] `/api/webhooks/signal/test` (GET)
- [ ] `/health` (GET)

### ✅ Dependências
- [ ] `node_modules` instalado
- [ ] `package-lock.json` presente
- [ ] Dependências críticas (express, cors, helmet)

### ✅ Configuração
- [ ] Porta dinâmica (`process.env.PORT`)
- [ ] CORS configurado
- [ ] Middleware de segurança

---

## 🚀 Processo de Deploy

### 1. Validação Pré-Deploy
```bash
# Windows
.\validate-deploy-complete.ps1

# Linux/Mac
./validate-deploy.sh
```

### 2. Commit e Push
```bash
git add -A
git commit -m "🔧 Deploy: Configuração multiservice validada"
git push origin main
```

### 3. Deploy Railway
```bash
# Deploy automático via Git
railway up --detach

# Ou manual
railway deploy
```

### 4. Verificação Pós-Deploy
```bash
# Teste de conectividade
curl https://seu-app.railway.app/health

# Teste webhook
curl -X POST https://seu-app.railway.app/api/webhooks/signal/test
```

---

## 🔧 Troubleshooting

### Erro 502 - Bad Gateway
**Causa:** Servidor configurado incorretamente
```bash
# Verificar railway.toml
grep "startCommand" railway.toml
# Deve retornar: startCommand = "node server-multiservice-complete.cjs"

# Verificar Dockerfile
grep "CMD" Dockerfile
# Deve retornar: CMD ["node", "server-multiservice-complete.cjs"]
```

### Erro de Módulos
**Causa:** Dependências não instaladas
```bash
npm install
npm audit fix
```

### Erro de Porta
**Causa:** Porta não configurada dinamicamente
```javascript
// Verificar no código
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
```

### Webhook Não Funciona
**Causa:** Endpoint não implementado
```javascript
// Verificar se existe no servidor
app.post('/api/webhooks/signal', (req, res) => {
    // Implementação do webhook
});
```

---

## 📈 Monitoramento

### Logs do Railway
```bash
railway logs --follow
```

### Métricas de Performance
- Tempo de resposta < 500ms
- Disponibilidade > 99%
- Uso de memória < 512MB

### Alertas Configurados
- Erro 5xx > 5 em 5 minutos
- Tempo de resposta > 1s
- Uso de CPU > 80%

---

## 🔐 Variáveis de Ambiente

### Obrigatórias
```env
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://...
```

### Opcionais
```env
CORS_ORIGIN=https://dashboard.coinbitclub.com
API_RATE_LIMIT=100
LOG_LEVEL=info
```

---

## 📚 Documentação Adicional

- [DOCUMENTACAO_FRONTEND_API.md](./DOCUMENTACAO_FRONTEND_API.md) - API completa
- [CONFIGURACAO_MULTISERVICE_RAILWAY.md](./CONFIGURACAO_MULTISERVICE_RAILWAY.md) - Configuração detalhada
- [validate-deploy-complete.ps1](./validate-deploy-complete.ps1) - Script validação Windows
- [validate-deploy.sh](./validate-deploy.sh) - Script validação Linux/Mac

---

## 🆘 Suporte

### Em caso de problemas:
1. Execute o script de validação
2. Verifique os logs do Railway
3. Consulte esta documentação
4. Teste localmente primeiro

### Comandos de Emergência
```bash
# Rollback último deploy
railway rollback

# Reiniciar serviço
railway restart

# Verificar status
railway status
```

---

## ✅ Status Atual

- ✅ **Sistema Operacional** - Todos os endpoints funcionando
- ✅ **Deploy Automatizado** - Scripts de validação criados
- ✅ **Documentação Completa** - Guias e troubleshooting prontos
- ✅ **Prevenção** - Configurações padronizadas para evitar erro 502

**Última atualização:** $(Get-Date -Format "dd/MM/yyyy HH:mm")
**Versão:** 2.0.0 - Multi-Service Architecture
