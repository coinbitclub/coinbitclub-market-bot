# Script para verificar status do CoinBitClub Market Bot
Write-Host "=== COINBITCLUB MARKET BOT - VERIFICAÇÃO DE STATUS ===" -ForegroundColor Green

# Verificar se o Railway detectou as mudanças
Write-Host "`nVerificando se o código foi enviado para o Git..." -ForegroundColor Yellow
$gitStatus = git log --oneline -1
Write-Host "Último commit: $gitStatus" -ForegroundColor Cyan

# Verificar arquivo Dockerfile
Write-Host "`nVerificando Dockerfile..." -ForegroundColor Yellow
if (Test-Path "Dockerfile") {
    $dockerfileLines = (Get-Content "Dockerfile" | Measure-Object -Line).Lines
    Write-Host "Dockerfile encontrado com $dockerfileLines linhas" -ForegroundColor Green
} else {
    Write-Host "ERRO: Dockerfile não encontrado!" -ForegroundColor Red
}

# Verificar conexão com Railway
Write-Host "`nVerificando conexão com Railway..." -ForegroundColor Yellow
try {
    $railwayStatus = railway status
    Write-Host "Conectado ao Railway: $railwayStatus" -ForegroundColor Green
} catch {
    Write-Host "ERRO: Não foi possível conectar ao Railway" -ForegroundColor Red
}

# Instruções finais
Write-Host "`n=== PRÓXIMOS PASSOS ===" -ForegroundColor Green
Write-Host "1. Acesse: https://railway.app/project/coinbitclub-market-bot"
Write-Host "2. Verifique se o deployment está em progresso"
Write-Host "3. Se não estiver, clique em 'Deploy Now'"
Write-Host "`n=== URLs DO PROJETO ===" -ForegroundColor Green
Write-Host "Frontend: https://coinbitclub-market-bot.vercel.app/"
Write-Host "Backend: https://coinbitclub-market-bot-production.up.railway.app/"
Write-Host "Health Check: https://coinbitclub-market-bot-production.up.railway.app/health"

Write-Host "`nPressione qualquer tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
