@echo off
echo Iniciando Backend API Gateway...
cd /d "c:\Nova pasta\coinbitclub-market-bot\backend\api-gateway"
start "Backend API Gateway" cmd /k "npm start"

timeout /t 3

echo Iniciando Admin Panel...
cd /d "c:\Nova pasta\coinbitclub-market-bot\backend\admin-panel"
start "Admin Panel" cmd /k "npm start"

timeout /t 3

echo Iniciando Frontend Next.js...
cd /d "c:\Nova pasta\coinbitclub-market-bot\coinbitclub-frontend-premium"
start "Frontend Next.js" cmd /k "npm run dev"

echo.
echo ========================================
echo Serviços iniciados:
echo Backend API: http://localhost:8081
echo Admin Panel: http://localhost:8082
echo Frontend: http://localhost:3000
echo ========================================
echo.
echo Pressione qualquer tecla para abrir o browser...
pause > nul

start http://localhost:3000/auth/login

echo.
echo Credenciais de Admin:
echo Email: faleconosco@coinbitclub.vip
echo Senha: Apelido22@
echo.
pause
