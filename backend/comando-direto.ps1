Write-Host "COMANDO DIRETO - FORCAR MAIN.JS" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# 1. Atualizar timestamp do main.js
Write-Host "Atualizando timestamp main.js..." -ForegroundColor Yellow
if (Test-Path "main.js") {
    $content = Get-Content "main.js" -Raw
    $content | Out-File -FilePath "main.js" -Encoding UTF8
    Write-Host "✅ main.js timestamp atualizado" -ForegroundColor Green
}

# 2. Package.json simples e direto
Write-Host "Criando package.json direto..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "HHmmss"
$pkg = @"
{
  "name": "coinbitclub-market-bot",
  "version": "3.0.$timestamp",
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

# 3. Railway.toml direto
Write-Host "Criando railway.toml direto..." -ForegroundColor Yellow
$railway = @"
[deploy]
startCommand = "node main.js"
healthcheckPath = "/health"
"@
$railway | Out-File -FilePath "railway.toml" -Encoding UTF8

# 4. Git push direto
Write-Host "Git push direto..." -ForegroundColor Green
git add main.js package.json railway.toml
git commit -m "DIRETO: main.js V3 - $timestamp"
git push origin main --force

Write-Host "✅ COMANDO DIRETO EXECUTADO!" -ForegroundColor Green
Write-Host "Aguarde 5 minutos e teste: https://coinbitclub-market-bot.up.railway.app/health" -ForegroundColor Cyan
