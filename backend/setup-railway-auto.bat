@echo off
echo ===============================================
echo CONFIGURACAO AUTOMATICA RAILWAY - NOVO PROJETO
echo ===============================================
echo.

echo CONECTANDO AO PROJETO...
railway link

echo.
echo CONFIGURANDO VARIAVEIS ESSENCIAIS...
echo =====================================

railway variables set DATABASE_URL="postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway"
railway variables set NODE_ENV="production"
railway variables set PORT="3000"
railway variables set JWT_SECRET="coinbitclub-production-secret-2025-ultra-secure"
railway variables set ENCRYPTION_KEY="coinbitclub-encryption-key-production-2025"
railway variables set SESSION_SECRET="coinbitclub-session-secret-2025-ultra-secure"
railway variables set WEBHOOK_SECRET="coinbitclub-webhook-secret-2025"
railway variables set SISTEMA_MULTIUSUARIO="true"
railway variables set MODO_HIBRIDO="true"
railway variables set DEFAULT_LEVERAGE="10"
railway variables set DEFAULT_RISK_PERCENTAGE="2"
railway variables set MAX_CONCURRENT_TRADES="5"
railway variables set CORS_ORIGIN="https://coinbitclub-market-bot.vercel.app"
railway variables set FRONTEND_URL="https://coinbitclub-market-bot.vercel.app"

echo.
echo CONFIGURACAO BASICA CONCLUIDA!
echo ==============================
echo.
echo PROXIMOS PASSOS:
echo 1. Configure BACKEND_URL com a URL do projeto
echo 2. Configure as chaves das exchanges (BINANCE/BYBIT)
echo 3. Execute: railway up
echo.
echo Para configurar exchanges:
echo railway variables set BINANCE_API_KEY="[SUA_CHAVE]"
echo railway variables set BINANCE_SECRET_KEY="[SEU_SECRET]"
echo railway variables set BYBIT_API_KEY="[SUA_CHAVE]"
echo railway variables set BYBIT_SECRET_KEY="[SEU_SECRET]"
echo.
pause
