# 🔥 SCRIPT DEFINITIVO - REMOVE TODOS OS CONFLITOS
Write-Host "🔥 LIMPEZA TOTAL DE CONFLITOS RAILWAY" -ForegroundColor Red
Write-Host "======================================" -ForegroundColor Red

# 1. REMOVER TODOS OS DOCKERFILES (Railway pode estar usando eles)
Write-Host "🗑️ Removendo TODOS os Dockerfiles..." -ForegroundColor Yellow
$dockerfiles = Get-ChildItem -Path "." -Filter "Dockerfile*" -Recurse
foreach ($dockerfile in $dockerfiles) {
    try {
        Remove-Item $dockerfile.FullName -Force
        Write-Host "   ❌ REMOVIDO: $($dockerfile.Name)" -ForegroundColor Red
    } catch {
        Write-Host "   ⚠️ Erro: $($dockerfile.Name)" -ForegroundColor Yellow
    }
}

# 2. REMOVER ARQUIVOS CONFLITANTES ESPECÍFICOS
Write-Host "🗑️ Removendo arquivos conflitantes..." -ForegroundColor Yellow
$filesToRemove = @(
    "server*.js", "server*.cjs", "package-*.json", 
    "nixpacks.toml", ".buildpacks", "Procfile",
    "start.sh", "run.sh", "deploy.sh"
)

foreach ($pattern in $filesToRemove) {
    $files = Get-ChildItem -Path "." -Filter $pattern -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        if ($file.Name -ne "package.json") {  # Preservar package.json
            try {
                Remove-Item $file.FullName -Force
                Write-Host "   ❌ REMOVIDO: $($file.Name)" -ForegroundColor Red
            } catch {
                Write-Host "   ⚠️ Erro: $($file.Name)" -ForegroundColor Yellow
            }
        }
    }
}

# 3. CRIAR .dockerignore para forçar Railway a ignorar cache
Write-Host "📝 Criando .dockerignore..." -ForegroundColor Green
$dockerignore = @"
Dockerfile*
server*.js
server*.cjs
package-*.json
*.backup
*.old
node_modules
.git
"@
$dockerignore | Out-File -FilePath ".dockerignore" -Encoding UTF8

# 4. PACKAGE.JSON SUPER LIMPO
Write-Host "📝 Criando package.json SUPER LIMPO..." -ForegroundColor Green
$timestamp = Get-Date -Format "HHmmss"
$pkg = @"
{
  "name": "coinbitclub-market-bot",
  "version": "3.0.$timestamp",
  "description": "Sistema V3 Final",
  "main": "main.js",
  "scripts": {
    "start": "node main.js"
  },
  "engines": {
    "node": "18.x"
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

# 5. RAILWAY.TOML DEFINITIVO
Write-Host "🚂 Criando railway.toml DEFINITIVO..." -ForegroundColor Green
$railway = @"
[deploy]
startCommand = "node main.js"
healthcheckPath = "/health"
restartPolicyType = "ON_FAILURE"
"@
$railway | Out-File -FilePath "railway.toml" -Encoding UTF8

# 6. FORÇAR CACHE BUST com arquivo vazio
Write-Host "💥 Criando cache-bust..." -ForegroundColor Yellow
$cacheBust = "# Cache bust: $timestamp"
$cacheBust | Out-File -FilePath ".railway-cache-bust" -Encoding UTF8

# 7. GIT PUSH AGRESSIVO
Write-Host "🚀 Git push AGRESSIVO..." -ForegroundColor Green
git add .
git add -A  # Incluir remoções
git commit -m "DEFINITIVO: Remove todos conflitos - main.js ONLY - $timestamp"
git push origin main --force-with-lease

Write-Host "`n✅ LIMPEZA TOTAL CONCLUÍDA!" -ForegroundColor Green
Write-Host "⏰ Aguarde 10 minutos para Railway rebuildar completamente" -ForegroundColor Yellow
Write-Host "🔗 Teste: https://coinbitclub-market-bot.up.railway.app/health" -ForegroundColor Cyan
