# Script para iniciar todos os serviços do CoinBitClub
Write-Host "🚀 Iniciando CoinBitClub Services..." -ForegroundColor Green

# API Gateway - Porta 8081
Write-Host "`n[1/3] Iniciando API Gateway na porta 8081..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Nova pasta\coinbitclub-market-bot\backend\api-gateway'; npm start" -WindowStyle Normal

Start-Sleep 3

# Admin Panel - Porta 8082  
Write-Host "[2/3] Iniciando Admin Panel na porta 8082..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Nova pasta\coinbitclub-market-bot\backend\admin-panel'; npm start" -WindowStyle Normal

Start-Sleep 3

# Frontend - Porta 3000
Write-Host "[3/3] Iniciando Frontend na porta 3000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Nova pasta\coinbitclub-market-bot\coinbitclub-frontend-premium'; npm run dev" -WindowStyle Normal

Start-Sleep 5

Write-Host "`n✅ Todos os serviços foram iniciados!" -ForegroundColor Green
Write-Host "`nServiços disponíveis:" -ForegroundColor Cyan
Write-Host "• API Gateway:  http://localhost:8081" -ForegroundColor White
Write-Host "• Admin Panel:  http://localhost:8082" -ForegroundColor White  
Write-Host "• Frontend:     http://localhost:3000" -ForegroundColor White
Write-Host "• Admin Pages:  http://localhost:3000/admin" -ForegroundColor White

Write-Host "`n⏱️  Aguarde alguns segundos para os serviços carregarem completamente..." -ForegroundColor Yellow
Write-Host "📊 Pressione qualquer tecla para verificar o status das portas..." -ForegroundColor Gray
Read-Host

# Verificar status das portas
Write-Host "`n🔍 Verificando status das portas..." -ForegroundColor Cyan
netstat -ano | findstr ":3000\|:8081\|:8082"

Write-Host "`nPressione qualquer tecla para sair..." -ForegroundColor Gray
Read-Host
