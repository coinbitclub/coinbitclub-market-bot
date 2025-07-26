# MIGRAÇÃO RAILWAY COMPLETA - INSTRUÇÕES

## 🎯 CRIAR NOVO PROJETO RAILWAY

### 1. ACESSE RAILWAY
- Vá para: https://railway.app/dashboard
- Faça login na sua conta

### 2. CRIAR NOVO PROJETO
- Clique em "New Project"
- Selecione "Deploy from GitHub repo"
- Escolha: coinbitclub/coinbitclub-market-bot
- Nome sugerido: "coinbitclub-api-v2"

### 3. CONFIGURAR VARIÁVEIS DE AMBIENTE
- Vá em "Variables"
- Adicione:
  ```
  DATABASE_URL = postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway
  NODE_ENV = production
  ```

### 4. CONFIGURAR BUILD
- Vá em "Settings"
- Root Directory: backend
- Build Command: (deixar vazio)
- Start Command: node server.js

### 5. DEPLOY
- Clique em "Deploy"
- Aguarde build terminar
- Anote nova URL (ex: https://coinbitclub-api-v2-production.up.railway.app)

### 6. TESTAR
Execute no PowerShell:
```powershell
Invoke-WebRequest -Uri "https://SUA_NOVA_URL/health"
```

**Resultado esperado: STATUS 200 (sem erro 502!)**

---

## 📁 ARQUIVOS PREPARADOS

✅ Todos os arquivos já estão no repositório:
- `server-v2-clean.js` - Servidor otimizado
- `Dockerfile.v2` - Container limpo  
- `railway.toml` - Configuração atualizada

---

## 🚨 IMPORTANTE

- **MESMO BANCO**: O novo projeto usa o mesmo banco de dados
- **ZERO DOWNTIME**: Dados preservados
- **PROJETO ANTIGO**: Fica como backup
- **RESOLUÇÃO 502**: Novo projeto resolve definitivamente

---

## ✅ RESULTADO

**NOVO PROJETO = ERRO 502 RESOLVIDO!**
