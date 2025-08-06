@echo off
echo 🚄 RAILWAY DEPLOY - COINBITCLUB MARKET BOT
echo ==========================================

REM Verificar se Railway CLI está instalado
where railway >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo 📦 Instalando Railway CLI...
    npm install -g @railway/cli
)

REM Login no Railway (se necessário)
echo 🔐 Fazendo login no Railway...
railway login

REM Verificar o projeto atual
echo 🔍 Verificando projeto...
railway status

REM Fazer deploy
echo 🚀 Fazendo deploy...
railway up

REM Verificar os logs para debuggar qualquer problema
echo 📋 Verificando logs...
railway logs

echo ✅ DEPLOY RAILWAY COMPLETO!
echo ==========================

echo 📋 Próximos passos:
echo 1. Verificar se o deploy foi bem-sucedido
echo 2. Configurar variáveis de ambiente no Railway Dashboard
echo 3. Testar a aplicação acessando a URL fornecida

echo 🔗 Comandos úteis:
echo - Ver logs: railway logs
echo - Abrir app: railway open
echo - Ver status: railway status
echo - Configurar env: railway variables

pause
