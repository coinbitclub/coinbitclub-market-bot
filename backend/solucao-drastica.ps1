# 🔥 SOLUÇÃO DRÁSTICA - REMOVER COMPLETAMENTE SISTEMA ANTIGO
Write-Host "🚨 REMOVENDO SISTEMA ANTIGO COMPLETAMENTE" -ForegroundColor Red
Write-Host "===========================================" -ForegroundColor Red

# 1. Localizar e remover TODOS os arquivos do sistema antigo
Write-Host "🔍 Procurando arquivos do sistema antigo..." -ForegroundColor Yellow

$oldFiles = @(
    "server-multiservice-complete.cjs",
    "server-multiservice-complete.cjs.backup",
    "servidor-integrado-completo.js",
    "app.js",
    "index.js"
)

foreach ($file in $oldFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "❌ REMOVIDO: $file" -ForegroundColor Red
    }
}

# 2. Criar um .railwayignore para forçar rebuild
Write-Host "🚂 Criando .railwayignore..." -ForegroundColor Yellow
$railwayIgnore = @"
*.backup
*.old
server-multiservice*
servidor-integrado*
package-clean.json
package-complete.json
"@
$railwayIgnore | Out-File -FilePath ".railwayignore" -Encoding UTF8

# 3. Forçar Railway a usar APENAS main.js
Write-Host "📝 Atualizando railway.toml com FORCE..." -ForegroundColor Yellow
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
"@
$railwayToml | Out-File -FilePath "railway.toml" -Encoding UTF8

# 4. Verificar main.js
Write-Host "🔍 Verificando main.js..." -ForegroundColor Yellow
$mainContent = Get-Content "main.js" -Raw -ErrorAction SilentlyContinue
if ($mainContent -and $mainContent.Contains("COINBITCLUB MARKET BOT V3")) {
    Write-Host "✅ main.js V3 confirmado" -ForegroundColor Green
} else {
    Write-Host "❌ main.js pode ter problema" -ForegroundColor Red
}

# 5. Criar Dockerfile específico para forçar
Write-Host "🐳 Criando Dockerfile específico..." -ForegroundColor Yellow
$dockerfile = @"
FROM node:18-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY main.js ./
EXPOSE 3000
CMD ["node", "main.js"]
"@
$dockerfile | Out-File -FilePath "Dockerfile" -Encoding UTF8

# 6. Commit e force push
Write-Host "🚀 Fazendo FORCE PUSH..." -ForegroundColor Green
git add .
git commit -m "DRASTIC: Remove old system completely - Force V3 only"
git push origin main --force

Write-Host "✅ PUSH CONCLUÍDO!" -ForegroundColor Green
Write-Host "⏰ AGUARDE 5 MINUTOS para Railway rebuildar" -ForegroundColor Yellow
Write-Host "🔗 Depois teste: https://coinbitclub-market-bot.up.railway.app/health" -ForegroundColor Cyan
