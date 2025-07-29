Write-Host "🧹 LIMPANDO CACHE RAILWAY COMPLETAMENTE" -ForegroundColor Red
Write-Host "=======================================" -ForegroundColor Red

# 1. Remover TODOS os arquivos antigos
Write-Host "🗑️ Removendo arquivos do sistema antigo..." -ForegroundColor Yellow
$oldFiles = @(
    "server-multiservice-complete.cjs.backup",
    "app.js",
    "index.js",
    "servidor-integrado-completo.js"
)

foreach ($file in $oldFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "❌ REMOVIDO: $file" -ForegroundColor Red
    }
}

# 2. Criar .railwayignore para forçar rebuild
Write-Host "🚂 Criando .railwayignore..." -ForegroundColor Yellow
$railwayIgnore = @"
*.backup
*.old
server-multiservice*
servidor-integrado*
package-clean.json
package-complete.json
node_modules/
.git/
"@
$railwayIgnore | Out-File -FilePath ".railwayignore" -Encoding UTF8
Write-Host "✅ .railwayignore criado" -ForegroundColor Green

# 3. Adicionar variável para forçar rebuild
Write-Host "🔧 Atualizando railway.toml com FORCE_REBUILD..." -ForegroundColor Yellow
$railwayToml = @"
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "node main.js"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 2
healthcheckPath = "/health"
healthcheckTimeout = 30

[environments.production.variables]
NODE_ENV = "production"
PORT = "3000"
FORCE_REBUILD = "true"
CACHE_BUSTER = "$((Get-Date).Ticks)"
"@
$railwayToml | Out-File -FilePath "railway.toml" -Encoding UTF8
Write-Host "✅ railway.toml atualizado com cache buster" -ForegroundColor Green

# 4. Criar Dockerfile específico
Write-Host "🐳 Criando Dockerfile para forçar build..." -ForegroundColor Yellow
$dockerfile = @"
FROM node:18-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --production --no-cache
COPY main.js ./
EXPOSE 3000
CMD ["node", "main.js"]
"@
$dockerfile | Out-File -FilePath "Dockerfile" -Encoding UTF8
Write-Host "✅ Dockerfile criado" -ForegroundColor Green

# 5. Atualizar package.json com timestamp
Write-Host "📝 Atualizando package.json com timestamp..." -ForegroundColor Yellow
$timestamp = (Get-Date).ToString("yyyyMMddHHmmss")
$pkg = @"
{
  "name": "coinbitclub-market-bot",
  "version": "3.0.$timestamp",
  "description": "CoinBitClub Market Bot V3 - Cache Cleared",
  "main": "main.js",
  "scripts": {
    "start": "node main.js"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "compression": "^1.7.4",
    "ws": "^8.13.0",
    "pg": "^8.11.3",
    "axios": "^1.4.0"
  }
}
"@
$pkg | Out-File -FilePath "package.json" -Encoding UTF8
Write-Host "✅ package.json atualizado com versão $timestamp" -ForegroundColor Green

# 6. Commit e push com timestamp
Write-Host "🚀 Fazendo commit com cache buster..." -ForegroundColor Green
git add .
git commit -m "CLEAR CACHE: Force rebuild Railway V3 - Timestamp $timestamp"
git push origin main --force

Write-Host "`n🎉 CACHE CLEARING CONCLUÍDO!" -ForegroundColor Green
Write-Host "✅ Arquivos antigos removidos" -ForegroundColor Green
Write-Host "✅ .railwayignore criado" -ForegroundColor Green
Write-Host "✅ Dockerfile específico criado" -ForegroundColor Green
Write-Host "✅ Cache buster adicionado" -ForegroundColor Green
Write-Host "✅ Force push realizado" -ForegroundColor Green

Write-Host "`n⏰ AGUARDE 5-7 MINUTOS para Railway rebuildar COMPLETAMENTE" -ForegroundColor Yellow
Write-Host "🔗 Depois teste: https://coinbitclub-market-bot.up.railway.app/health" -ForegroundColor Cyan
Write-Host "🎯 Deve mostrar Sistema V3 (não multiservice)" -ForegroundColor Cyan
