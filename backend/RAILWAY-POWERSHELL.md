# 🪟 Comandos PowerShell para Railway - Windows

## Conectar ao Projeto Existente
```powershell
# 1. Login no Railway
railway login

# 2. Conectar ao projeto existente
railway link coinbitclub-market-bot

# 3. Usar script automatizado (PowerShell)
.\connect-railway.ps1
```

## Verificar Status
```powershell
# Script completo de verificação
.\check-railway-status.ps1

# Ou comandos individuais:
railway status
railway variables
railway services
```

## Deploy
```powershell
# Deploy da aplicação
railway up

# Verificar logs
railway logs

# Logs em tempo real
railway logs --follow

# Verificar status
railway status
```

## Configurar Variáveis
```powershell
# Script automatizado
.\setup-railway-env.ps1

# Ou manual:
railway variables set NODE_ENV=production
railway variables set PORT=8080
```

## Debugging
```powershell
# Ver variáveis de ambiente
railway variables

# Ver logs em tempo real
railway logs --follow

# Conectar via shell
railway shell

# Reiniciar serviço
railway restart

# Ver deployments
railway deployments

# Ver uso de recursos
railway usage
```

## URLs e Acesso
```powershell
# Ver URLs do projeto
railway domain

# Abrir dashboard no navegador
railway open

# Ver informações do projeto
railway status
```

## Comandos Express PowerShell

Para deploy rápido:
```powershell
# Conectar e verificar
.\connect-railway.ps1; .\check-railway-status.ps1

# Deploy direto
railway up

# Deploy e acompanhar logs
railway up; railway logs --follow
```

## 🔧 Troubleshooting Windows

### Política de Execução PowerShell
Se der erro de execução de scripts:
```powershell
# Permitir execução de scripts locais
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Verificar política atual
Get-ExecutionPolicy
```

### Railway CLI não encontrado
```powershell
# Instalar Railway CLI
npm install -g @railway/cli

# Verificar instalação
railway --version

# Verificar PATH
$env:PATH -split ";"
```

### Erro de Conexão
```powershell
# Verificar login
railway whoami

# Re-login
railway logout
railway login

# Listar projetos
railway projects
```
