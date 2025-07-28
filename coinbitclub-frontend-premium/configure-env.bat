@echo off
echo ============================================================
echo   Configuracao de Variaveis de Ambiente - CoinBitClub
echo ============================================================
echo.
echo Frontend: https://coinbitclub-marketbot.vercel.app
echo Backend:  https://coinbitclub-market-bot.up.railway.app
echo.
echo ============================================================
echo   ETAPAS DE CONFIGURACAO
echo ============================================================
echo.
echo 1. VERCEL (Frontend):
echo    - Acesse: https://vercel.com/dashboard
echo    - Projeto: coinbitclub-marketbot
echo    - Settings ^> Environment Variables
echo    - Configure as variaveis do arquivo environment-variables.json
echo.
echo 2. RAILWAY (Backend):
echo    - Acesse: https://railway.app/dashboard  
echo    - Projeto: coinbitclub-market-bot
echo    - Aba Variables
echo    - Configure as variaveis do arquivo environment-variables.json
echo.
echo ============================================================
echo   VARIAVEIS CRITICAS
echo ============================================================
echo.
echo VERCEL:
echo   NEXT_PUBLIC_API_URL = https://coinbitclub-market-bot.up.railway.app
echo   NEXT_PUBLIC_SITE_URL = https://coinbitclub-marketbot.vercel.app
echo.
echo RAILWAY:
echo   FRONTEND_URL = https://coinbitclub-marketbot.vercel.app
echo   DATABASE_URL = [Connection string do PostgreSQL]
echo   JWT_SECRET = [Chave secreta forte]
echo.
echo ============================================================
echo   PROXIMOS PASSOS
echo ============================================================
echo.
echo 1. Configure as variaveis nos dashboards
echo 2. Faca deploy do frontend (Vercel)
echo 3. Verifique os logs
echo 4. Teste a aplicacao
echo.
echo Consulte: CONFIGURACAO-VARIAVEIS-AMBIENTE.md
echo           environment-variables.json
echo.
pause
