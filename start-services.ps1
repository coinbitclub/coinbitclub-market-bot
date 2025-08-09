# PowerShell script to start all services

Write-Host "Starting CoinBitClub Services..." -ForegroundColor Green

# Start API Gateway
Write-Host "Starting API Gateway..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Nova pasta\coinbitclub-market-bot\backend\api-gateway'; npm run dev"

# Wait a moment for API Gateway to start
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "Starting Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Nova pasta\coinbitclub-market-bot\coinbitclub-frontend-premium'; npm run dev"

Write-Host "All services are starting!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "API Gateway: http://localhost:8080" -ForegroundColor Cyan
Write-Host "Press any key to continue..." -ForegroundColor White
Read-Host
