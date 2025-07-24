# Script de Deploy Otimizado para Railway
Write-Host "🚀 Iniciando Deploy Otimizado no Railway..."

# 1. Verificar estrutura
Write-Host "📂 Verificando estrutura do projeto..."
if (!(Test-Path "backend/api-gateway/package.json")) {
    Write-Host "❌ Estrutura do projeto incorreta"
    exit 1
}

# 2. Limpar arquivos desnecessários 
Write-Host "🧹 Limpando arquivos desnecessários..."
Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "backend/api-gateway/node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue

# 3. Configurar Railway para usar Dockerfile otimizado
Write-Host "⚙️ Configurando Railway..."
railway variables set NODE_ENV=production
railway variables set API_GATEWAY_PORT=8080
railway variables set RAILWAY_DOCKERFILE_PATH=Dockerfile.optimized

# 4. Fazer deploy
Write-Host "🚀 Fazendo deploy..."
railway up

Write-Host "✅ Deploy concluído!"
