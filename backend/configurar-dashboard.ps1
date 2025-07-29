# CONFIGURACAO MANUAL VIA RAILWAY DASHBOARD
# Esta versao do Railway CLI nao suporta configuracao de variaveis via linha de comando

Write-Host "CONFIGURACAO VIA RAILWAY DASHBOARD" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "ABRINDO RAILWAY DASHBOARD..." -ForegroundColor Yellow

# Abrir Railway Dashboard
railway open

Write-Host ""
Write-Host "INSTRUCOES PARA CONFIGURAR VARIAVEIS:" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

Write-Host "1. No Railway Dashboard que acabou de abrir:" -ForegroundColor White
Write-Host "   - Clique em 'Settings' (engrenagem)" -ForegroundColor Gray
Write-Host "   - Clique em 'Variables'" -ForegroundColor Gray
Write-Host "   - Clique em 'Add Variable'" -ForegroundColor Gray

Write-Host ""
Write-Host "2. ADICIONE ESTAS VARIAVEIS UMA POR UMA:" -ForegroundColor Yellow
Write-Host "=======================================" -ForegroundColor Yellow

$variables = @{
    "DATABASE_URL" = "postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway"
    "NODE_ENV" = "production"
    "PORT" = "3000"
    "JWT_SECRET" = "coinbitclub-production-secret-2025-ultra-secure"
    "ENCRYPTION_KEY" = "coinbitclub-encryption-key-production-2025"
    "SESSION_SECRET" = "coinbitclub-session-secret-2025-ultra-secure"
    "WEBHOOK_SECRET" = "coinbitclub-webhook-secret-2025"
    "SISTEMA_MULTIUSUARIO" = "true"
    "MODO_HIBRIDO" = "true"
    "DEFAULT_LEVERAGE" = "10"
    "DEFAULT_RISK_PERCENTAGE" = "2"
    "MAX_CONCURRENT_TRADES" = "5"
    "CORS_ORIGIN" = "https://coinbitclub-market-bot.vercel.app"
    "FRONTEND_URL" = "https://coinbitclub-market-bot.vercel.app"
    "BACKEND_URL" = "[SUBSTITUA_PELA_URL_DO_PROJETO]"
}

Write-Host ""
Write-Host "FORMATO: NOME = VALOR" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan

foreach ($var in $variables.GetEnumerator()) {
    Write-Host ""
    Write-Host "NOME: $($var.Key)" -ForegroundColor Green
    Write-Host "VALOR: $($var.Value)" -ForegroundColor White
    Write-Host "---"
}

Write-Host ""
Write-Host "3. APOS ADICIONAR TODAS AS VARIAVEIS:" -ForegroundColor Yellow
Write-Host "   - O deploy sera automatico" -ForegroundColor Gray
Write-Host "   - Aguarde 2-3 minutos" -ForegroundColor Gray
Write-Host "   - Teste a nova URL" -ForegroundColor Gray

Write-Host ""
Write-Host "4. TESTE COM:" -ForegroundColor Green
Write-Host "node testar-novo-projeto.js [nova-url]" -ForegroundColor White

Write-Host ""
Write-Host "TOTAL: 15 variaveis para adicionar" -ForegroundColor Cyan
Write-Host "TEMPO ESTIMADO: 10-15 minutos" -ForegroundColor Cyan
