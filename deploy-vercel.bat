@echo off
echo 🔼 VERCEL DEPLOY - COINBITCLUB MARKET BOT FRONTEND
echo ================================================

REM Verificar se Vercel CLI está instalado
where vercel >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo 📦 Instalando Vercel CLI...
    npm install -g vercel
)

REM Navegar para o diretório do frontend
cd coinbitclub-frontend-premium

REM Login no Vercel (se necessário)
echo 🔐 Fazendo login no Vercel...
vercel login

REM Fazer deploy para produção
echo 🚀 Fazendo deploy para produção...
vercel --prod

echo ✅ DEPLOY VERCEL COMPLETO!
echo ========================

echo 📋 Próximos passos:
echo 1. Verificar se o deploy foi bem-sucedido
echo 2. Configurar variáveis de ambiente no Vercel Dashboard
echo 3. Testar a aplicação acessando a URL fornecida

echo 🔗 Comandos úteis:
echo - Ver logs: vercel logs
echo - Listar deploys: vercel list
echo - Verificar status: vercel inspect

cd ..

pause
