Write-Host "LIMPANDO CACHE RAILWAY" -ForegroundColor Red
Write-Host "=====================" -ForegroundColor Red

# 1. Remover arquivos antigos
Write-Host "Removendo arquivos antigos..." -ForegroundColor Yellow
if (Test-Path "server-multiservice-complete.cjs.backup") {
    Remove-Item "server-multiservice-complete.cjs.backup" -Force
    Write-Host "Removido: server-multiservice-complete.cjs.backup" -ForegroundColor Red
}
if (Test-Path "app.js") {
    Remove-Item "app.js" -Force
    Write-Host "Removido: app.js" -ForegroundColor Red
}
if (Test-Path "index.js") {
    Remove-Item "index.js" -Force
    Write-Host "Removido: index.js" -ForegroundColor Red
}

# 2. Criar railwayignore
Write-Host "Criando .railwayignore..." -ForegroundColor Yellow
"*.backup`n*.old`nserver-multiservice*`nservidor-integrado*" | Out-File -FilePath ".railwayignore" -Encoding UTF8

# 3. Atualizar package.json com timestamp
Write-Host "Atualizando package.json..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
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

# 4. Criar Dockerfile
Write-Host "Criando Dockerfile..." -ForegroundColor Yellow
$docker = @"
FROM node:18-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY main.js ./
EXPOSE 3000
CMD ["node", "main.js"]
"@
$docker | Out-File -FilePath "Dockerfile" -Encoding UTF8

# 5. Git push
Write-Host "Fazendo git push..." -ForegroundColor Green
git add .
git commit -m "CLEAR CACHE: Force rebuild Railway V3 - $timestamp"
git push origin main --force

Write-Host "CACHE CLEARING CONCLUIDO!" -ForegroundColor Green
Write-Host "Aguarde 5-7 minutos para Railway rebuildar" -ForegroundColor Yellow
Write-Host "Teste: https://coinbitclub-market-bot.up.railway.app/health" -ForegroundColor Cyan
