# 🔗 Conectando ao Projeto Railway Existente

## Passo a Passo Rápido

### 1. Conectar ao Projeto
```bash
# Entrar na pasta do backend
cd coinbitclub-market-bot/backend

# Login no Railway
railway login

# Conectar ao projeto existente
railway link coinbitclub-market-bot

# Ou usar o script automatizado
chmod +x connect-railway.sh
./connect-railway.sh
```

### 2. Verificar Status Atual
```bash
# Verificar status completo
chmod +x check-railway-status.sh
./check-railway-status.sh

# Ou comandos individuais:
railway status
railway variables
railway services
```

### 3. Deploy Imediato
```bash
# Se tudo estiver configurado
railway up

# Verificar logs
railway logs --follow
```

### 4. Configurar Variáveis (se necessário)
```bash
# Configurar variáveis faltantes
chmod +x setup-railway-env.sh
./setup-railway-env.sh

# Ou configurar manualmente no dashboard
railway open
```

## ⚡ Comandos Express

Para deploy rápido se o projeto já está configurado:

```bash
# Conectar + Deploy + Logs
railway link coinbitclub-market-bot && railway up && railway logs --follow
```

## 🔧 Troubleshooting

Se der erro de "projeto não encontrado":
```bash
# Listar projetos disponíveis
railway projects

# Conectar usando ID específico
railway link [PROJECT_ID]
```

Se der erro de permissão:
```bash
# Verificar login
railway whoami

# Re-login se necessário
railway logout
railway login
```

## 📱 URLs de Acesso

Após o deploy bem-sucedido:
- **App Principal**: Verificar com `railway domain`
- **Health Check**: `[URL]/health`
- **Dashboard Railway**: `https://railway.app/project/[PROJECT_ID]`
