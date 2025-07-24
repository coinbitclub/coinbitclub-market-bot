# Deploy Final - Preservando Arquitetura Completa
Write-Host "🚀 DEPLOY COINBITCLUB - PRESERVANDO TODOS OS SERVIÇOS"
Write-Host "================================================="

# Verificar se estamos no diretório correto
if (!(Test-Path "backend/api-gateway/package.json")) {
    Write-Host "❌ Execute este script na raiz do projeto!"
    exit 1
}

Write-Host "✅ Estrutura do projeto verificada"

# Limpar builds anteriores
Write-Host "🧹 Limpando builds anteriores..."
Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path "backend" -Recurse -Name "node_modules" | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

# Configurar Railway para usar Dockerfile final
Write-Host "⚙️ Configurando Railway com Dockerfile final..."
railway variables set RAILWAY_DOCKERFILE_PATH=Dockerfile.final
railway variables set NODE_ENV=production
railway variables set PORT=8080
railway variables set API_GATEWAY_PORT=8080

# Verificar variáveis do database
Write-Host "🗄️ Verificando variáveis do database..."
$dbUrl = railway variables get DATABASE_URL
if ([string]::IsNullOrEmpty($dbUrl)) {
    Write-Host "⚠️ DATABASE_URL não configurada. Configurando..."
    railway variables set DATABASE_URL="postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway"
}

# Commit das mudanças (preservando código)
Write-Host "📝 Fazendo commit das otimizações..."
git add .
git commit -m "feat: Otimizar deploy preservando arquitetura de microserviços

- ✅ Todos os 8 microserviços preservados
- ✅ Dockerfile.final com estrutura completa  
- ✅ Scripts de start adicionados aos serviços
- ✅ API Gateway como entrada principal
- ✅ Arquitetura de workspaces mantida
- 🚀 Pronto para deploy incremental"

git push origin main

Write-Host "🚀 Iniciando deploy no Railway..."
Write-Host "📊 Serviços que serão preservados:"
Write-Host "   1. API Gateway (porta 8080) - Principal"
Write-Host "   2. Signal Ingestor (porta 9001)"
Write-Host "   3. Signal Processor (porta 9012)" 
Write-Host "   4. Decision Engine (porta 9011)"
Write-Host "   5. Order Executor (porta 9013)"
Write-Host "   6. Accounting (porta 9010)"
Write-Host "   7. Notifications (porta 9014)"
Write-Host "   8. Admin Panel (porta 9015)"
Write-Host "   9. Frontend Next.js (porta 3000)"

# Deploy
railway up

Write-Host "✅ Deploy concluído!"
Write-Host "🎯 Próximos passos:"
Write-Host "   1. Validar API Gateway funcionando"
Write-Host "   2. Deploy incremental dos microserviços"
Write-Host "   3. Deploy do frontend"
Write-Host "   4. Configurar load balancer"
