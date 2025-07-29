Write-Host "INICIANDO DEPLOYMENT SISTEMA V3" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Remover arquivos antigos
Write-Host "Removendo arquivos antigos..." -ForegroundColor Yellow
$files = @("server-clean.cjs", "server-multiservice-complete.cjs", "package-clean.json")
foreach ($file in $files) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "Removido: $file" -ForegroundColor Red
    }
}

# Atualizar package.json
Write-Host "Atualizando package.json..." -ForegroundColor Yellow
$pkg = '{
  "name": "coinbitclub-market-bot",
  "version": "3.0.0",
  "description": "CoinBitClub Market Bot V3",
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
}'
$pkg | Out-File -FilePath "package.json" -Encoding UTF8
Write-Host "package.json atualizado" -ForegroundColor Green

# Verificar main.js
if (Test-Path "main.js") {
    Write-Host "main.js encontrado" -ForegroundColor Green
} else {
    Write-Host "ERRO: main.js nao encontrado!" -ForegroundColor Red
    exit 1
}

# Git commands
Write-Host "Executando git add..." -ForegroundColor Cyan
git add .

Write-Host "Executando git commit..." -ForegroundColor Cyan
git commit -m "FORCE: Deploy Sistema V3"

Write-Host "Executando git push..." -ForegroundColor Cyan
git push origin main --force

Write-Host "DEPLOYMENT CONCLUIDO!" -ForegroundColor Green
Write-Host "Aguarde 3-5 minutos e teste:" -ForegroundColor Yellow
Write-Host "https://coinbitclub-market-bot.up.railway.app/health" -ForegroundColor Cyan
