@echo off
echo Iniciando servicos CoinbitClub Market Bot...
echo.

echo Iniciando API Gateway...
start "API Gateway" cmd /k "cd /d \"c:\Nova pasta\coinbitclub-market-bot\backend\api-gateway\" && npm start"

echo Aguardando 5 segundos...
timeout /t 5 /nobreak > nul

echo Iniciando Admin Panel...
start "Admin Panel" cmd /k "cd /d \"c:\Nova pasta\coinbitclub-market-bot\backend\admin-panel\" && npm start"

echo Aguardando 5 segundos...
timeout /t 5 /nobreak > nul

echo Iniciando Frontend...
start "Frontend" cmd /k "cd /d \"c:\Nova pasta\coinbitclub-market-bot\coinbitclub-frontend-premium\" && npm run dev"

echo.
echo Todos os servicos foram iniciados!
echo.
echo URLs disponiveis:
echo - Frontend: http://localhost:3000
echo - API Gateway: http://localhost:8081
echo - Admin Panel: http://localhost:8082
echo.
pause
