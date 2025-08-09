@echo off
title CoinBitClub - Setup and Start Services
echo ========================================
echo    CoinBitClub Market Bot - Setup
echo ========================================
echo.

echo [1/4] Installing API Gateway dependencies...
cd /d "c:\Nova pasta\coinbitclub-market-bot\backend\api-gateway"
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install API Gateway dependencies
    pause
    exit /b 1
)
echo.

echo [2/4] Installing Admin Panel dependencies...
cd /d "c:\Nova pasta\coinbitclub-market-bot\backend\admin-panel"
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install Admin Panel dependencies
    pause
    exit /b 1
)
echo.

echo [3/4] Installing Frontend dependencies...
cd /d "c:\Nova pasta\coinbitclub-market-bot\coinbitclub-frontend-premium"
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install Frontend dependencies
    pause
    exit /b 1
)
echo.

echo [4/4] Starting all services...
echo.

echo Starting API Gateway (Port 8081)...
cd /d "c:\Nova pasta\coinbitclub-market-bot\backend\api-gateway"
start "API Gateway - Port 8081" cmd /k "npm start"
timeout /t 5 /nobreak >nul

echo Starting Admin Panel (Port 8082)...
cd /d "c:\Nova pasta\coinbitclub-market-bot\backend\admin-panel"
start "Admin Panel - Port 8082" cmd /k "npm start"
timeout /t 5 /nobreak >nul

echo Starting Frontend (Port 3000)...
cd /d "c:\Nova pasta\coinbitclub-market-bot\coinbitclub-frontend-premium"
start "Frontend - Port 3000" cmd /k "npm run dev"
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo          Services Started!
echo ========================================
echo.
echo Open these URLs in your browser:
echo.
echo Frontend:     http://localhost:3000
echo Admin Area:   http://localhost:3000/admin
echo API Gateway:  http://localhost:8081
echo Admin Panel:  http://localhost:8082
echo.
echo Check the opened terminals for service status.
echo.
pause
