# Script para reiniciar os serviços do CoinBitClub
Write-Host "🔄 Reiniciando serviços CoinBitClub..." -ForegroundColor Green

# Parar todos os processos Node.js
Write-Host "Parando processos Node.js existentes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

Start-Sleep 2

# Navegar para API Gateway e iniciar
Write-Host "Iniciando API Gateway..." -ForegroundColor Cyan
Set-Location "c:\Nova pasta\coinbitclub-market-bot\backend\api-gateway"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal

Start-Sleep 5

# Navegar para Frontend e iniciar
Write-Host "Iniciando Frontend..." -ForegroundColor Cyan
Set-Location "c:\Nova pasta\coinbitclub-market-bot\coinbitclub-frontend-premium"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal

Start-Sleep 5

Write-Host "✅ Serviços iniciados!" -ForegroundColor Green
Write-Host "Aguarde alguns minutos para os serviços carregarem..." -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:3000 ou http://localhost:3001" -ForegroundColor White
Write-Host "API Gateway: http://localhost:8081" -ForegroundColor White
