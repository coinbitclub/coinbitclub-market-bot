Write-Host "SOLUCAO DEFINITIVA - REMOVER TODOS OS ARQUIVOS ANTIGOS" -ForegroundColor Red
Write-Host "====================================================" -ForegroundColor Red

# 1. Remover TODOS os arquivos server antigos
Write-Host "Removendo TODOS os arquivos server..." -ForegroundColor Yellow
$serverFiles = @(
    "server.js",
    "server-multiusuario-limpo.js", 
    "test-multiservice.js"
)

foreach ($file in $serverFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "REMOVIDO: $file" -ForegroundColor Red
    }
}

# 2. Remover pastas que podem ter arquivos antigos
Write-Host "Removendo pastas antigas..." -ForegroundColor Yellow
if (Test-Path "admin-panel") {
    Remove-Item "admin-panel" -Recurse -Force
    Write-Host "REMOVIDO: admin-panel" -ForegroundColor Red
}

# 3. Criar um novo package.json MUITO específico
Write-Host "Criando package.json ULTRA específico..." -ForegroundColor Green
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$pkg = @"
{
  "name": "coinbitclub-market-bot-v3-only",
  "version": "3.0.$timestamp",
  "description": "CoinBitClub Market Bot V3 ONLY - NO MULTISERVICE",
  "main": "main.js",
  "scripts": {
    "start": "node main.js",
    "dev": "node main.js",
    "production": "node main.js"
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

# 4. Adicionar variável para invalidar cache Railway
Write-Host "Atualizando railway.toml com invalidação..." -ForegroundColor Yellow
$railway = @"
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
CACHE_INVALIDATE = "$timestamp"
FORCE_V3_ONLY = "true"
"@
$railway | Out-File -FilePath "railway.toml" -Encoding UTF8

# 5. Verificar se main.js tem a identificação correta
Write-Host "Verificando main.js..." -ForegroundColor Yellow
$mainContent = Get-Content "main.js" -Raw
if ($mainContent -match "multiservice") {
    Write-Host "PROBLEMA: main.js ainda tem referencias multiservice!" -ForegroundColor Red
} else {
    Write-Host "OK: main.js limpo" -ForegroundColor Green
}

# 6. Commit e push
Write-Host "Fazendo commit definitivo..." -ForegroundColor Green
git add .
git commit -m "DEFINITIVO: Remove todos arquivos antigos - APENAS main.js V3 - $timestamp"
git push origin main --force

Write-Host "LIMPEZA DEFINITIVA CONCLUIDA!" -ForegroundColor Green
Write-Host "Arquivos removidos:" -ForegroundColor Yellow
Write-Host "- server.js" -ForegroundColor Red
Write-Host "- server-multiusuario-limpo.js" -ForegroundColor Red  
Write-Host "- test-multiservice.js" -ForegroundColor Red
Write-Host "- admin-panel/" -ForegroundColor Red
Write-Host ""
Write-Host "AGUARDE 10 MINUTOS para Railway processar completamente" -ForegroundColor Yellow
Write-Host "Teste: https://coinbitclub-market-bot.up.railway.app/health" -ForegroundColor Cyan
