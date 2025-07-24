@echo off
echo "=== CoinBitClub Market Bot - Deploy Railway ==="
echo "Iniciando deploy com configuracao otimizada..."

REM Remover node_modules para reduzir tamanho do upload
echo "Limpando node_modules..."
if exist node_modules rmdir /s /q node_modules
if exist api-gateway\node_modules rmdir /s /q api-gateway\node_modules

REM Deploy
echo "Fazendo deploy..."
railway up --detach

echo "Deploy iniciado! Verifique o progresso em: https://railway.app/"
pause
