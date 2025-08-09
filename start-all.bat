@echo off
echo Starting CoinBitClub Services...

echo.
echo [1/3] Starting API Gateway on port 8081...
cd /d "c:\Nova pasta\coinbitclub-market-bot\backend\api-gateway"
start "API Gateway" cmd /k "npm start"
timeout /t 3 /nobreak >nul

echo.
echo [2/3] Starting Admin Panel on port 8082...
cd /d "c:\Nova pasta\coinbitclub-market-bot\backend\admin-panel"
start "Admin Panel" cmd /k "npm start"
timeout /t 3 /nobreak >nul

echo.
echo [3/3] Starting Frontend on port 3000...
cd /d "c:\Nova pasta\coinbitclub-market-bot\coinbitclub-frontend-premium"
start "Frontend" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo All services started! Check the opened terminals for status.
echo.
echo Services:
echo - API Gateway:  http://localhost:8081
echo - Admin Panel:  http://localhost:8082  
echo - Frontend:     http://localhost:3000
echo - Admin Pages:  http://localhost:3000/admin
echo.
pause
