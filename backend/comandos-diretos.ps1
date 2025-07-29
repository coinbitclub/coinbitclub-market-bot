# CONFIGURACAO RAPIDA - COMANDOS DIRETOS
# Execute estes comandos um por vez no terminal

Write-Host "COMANDOS DIRETOS PARA CONFIGURACAO RAPIDA" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "1. PRIMEIRO - CONECTAR AO PROJETO:" -ForegroundColor Yellow
Write-Host "railway link" -ForegroundColor White
Write-Host "(Escolha: coinbitclub-market-bot-v3)" -ForegroundColor Gray

Write-Host ""
Write-Host "2. DEPOIS - COPIE E COLE ESTES COMANDOS:" -ForegroundColor Yellow
Write-Host ""

$commands = @(
    'railway variables set DATABASE_URL="postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway"',
    'railway variables set NODE_ENV="production"',
    'railway variables set PORT="3000"',
    'railway variables set JWT_SECRET="coinbitclub-production-secret-2025-ultra-secure"',
    'railway variables set ENCRYPTION_KEY="coinbitclub-encryption-key-production-2025"',
    'railway variables set SESSION_SECRET="coinbitclub-session-secret-2025-ultra-secure"',
    'railway variables set WEBHOOK_SECRET="coinbitclub-webhook-secret-2025"',
    'railway variables set SISTEMA_MULTIUSUARIO="true"',
    'railway variables set MODO_HIBRIDO="true"',
    'railway variables set DEFAULT_LEVERAGE="10"',
    'railway variables set DEFAULT_RISK_PERCENTAGE="2"',
    'railway variables set MAX_CONCURRENT_TRADES="5"',
    'railway variables set CORS_ORIGIN="https://coinbitclub-market-bot.vercel.app"',
    'railway variables set FRONTEND_URL="https://coinbitclub-market-bot.vercel.app"'
)

foreach ($command in $commands) {
    Write-Host $command -ForegroundColor Cyan
}

Write-Host ""
Write-Host "3. DEPLOY:" -ForegroundColor Yellow
Write-Host "railway up" -ForegroundColor White

Write-Host ""
Write-Host "4. CONFIGURAR DEPOIS (EXCHANGES):" -ForegroundColor Red
Write-Host 'railway variables set BINANCE_API_KEY="[SUA_CHAVE]"' -ForegroundColor Yellow
Write-Host 'railway variables set BINANCE_SECRET_KEY="[SEU_SECRET]"' -ForegroundColor Yellow
Write-Host 'railway variables set BYBIT_API_KEY="[SUA_CHAVE]"' -ForegroundColor Yellow
Write-Host 'railway variables set BYBIT_SECRET_KEY="[SEU_SECRET]"' -ForegroundColor Yellow

Write-Host ""
Write-Host "TOTAL: 14 comandos para configurar tudo!" -ForegroundColor Green
