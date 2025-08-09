@echo off
echo ========================================
echo    CoinBitClub MarketBot Frontend
echo ========================================
cd /d "C:\Nova pasta\coinbitclub-market-bot\coinbitclub-frontend-premium"
echo Diretório atual: %CD%
echo.
echo Verificando se o Node.js está instalado...
node --version
echo.
echo Verificando se o npm está instalado...
npm --version
echo.
echo Iniciando servidor de desenvolvimento...
echo Acesse: http://localhost:3000
echo.
npm run dev
echo.
echo Pressione qualquer tecla para sair...
pause
