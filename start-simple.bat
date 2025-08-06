@echo off
echo Iniciando API Gateway...
cd "c:\Nova pasta\coinbitclub-market-bot\backend\api-gateway"
start "API Gateway" cmd /k "npm run dev"

timeout /t 3

echo Iniciando Frontend...
cd "c:\Nova pasta\coinbitclub-market-bot\coinbitclub-frontend-premium"
start "Frontend" cmd /k "npm run dev"

echo Serviços iniciados!
echo API Gateway: http://localhost:8081
echo Frontend: http://localhost:3001 ou 3000
pause
