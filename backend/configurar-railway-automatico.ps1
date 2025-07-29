# CONFIGURACAO AUTOMATICA PARA NOVO PROJETO RAILWAY
# Gera comandos Railway CLI para configurar todas as variaveis

Write-Host "CONFIGURACAO AUTOMATICA - NOVO PROJETO RAILWAY" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "OPCAO 1: USAR RAILWAY CLI (RECOMENDADO)" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green

Write-Host ""
Write-Host "1. INSTALAR RAILWAY CLI:" -ForegroundColor Yellow
Write-Host "npm install -g @railway/cli" -ForegroundColor White
Write-Host ""

Write-Host "2. FAZER LOGIN:" -ForegroundColor Yellow
Write-Host "railway login" -ForegroundColor White
Write-Host ""

Write-Host "3. CONECTAR AO PROJETO:" -ForegroundColor Yellow
Write-Host "railway link" -ForegroundColor White
Write-Host "(Escolher: coinbitclub-market-bot ou o novo projeto)" -ForegroundColor Gray
Write-Host ""

Write-Host "4. EXECUTAR COMANDOS ABAIXO (COPIE E COLE):" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Red

# Gerar comandos Railway CLI
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
    'railway variables set FRONTEND_URL="https://coinbitclub-market-bot.vercel.app"',
    'railway variables set BACKEND_URL="https://[NOVA-URL-DO-PROJETO]"'
)

foreach ($command in $commands) {
    Write-Host $command -ForegroundColor Cyan
}

Write-Host ""
Write-Host "EXCHANGES (CONFIGURAR DEPOIS COM CHAVES REAIS):" -ForegroundColor Red
Write-Host 'railway variables set BINANCE_API_KEY="[SUA_CHAVE_BINANCE]"' -ForegroundColor Yellow
Write-Host 'railway variables set BINANCE_SECRET_KEY="[SEU_SECRET_BINANCE]"' -ForegroundColor Yellow
Write-Host 'railway variables set BYBIT_API_KEY="[SUA_CHAVE_BYBIT]"' -ForegroundColor Yellow
Write-Host 'railway variables set BYBIT_SECRET_KEY="[SEU_SECRET_BYBIT]"' -ForegroundColor Yellow

Write-Host ""
Write-Host "5. FAZER DEPLOY:" -ForegroundColor Yellow
Write-Host "railway up" -ForegroundColor White

Write-Host ""
Write-Host "OPCAO 2: INTERFACE WEB (MANUAL)" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green

Write-Host ""
Write-Host "1. Ir para: Settings -> Variables no Railway" -ForegroundColor White
Write-Host "2. Clicar 'Add Variable' para cada uma:" -ForegroundColor White
Write-Host ""

# Lista para copia manual
Write-Host "LISTA PARA COPIAR (formato: NOME=VALOR):" -ForegroundColor Yellow
Write-Host "=======================================" -ForegroundColor Yellow

$manualVars = @{
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
    "BACKEND_URL" = "[NOVA-URL-DO-PROJETO]"
}

foreach ($var in $manualVars.GetEnumerator()) {
    Write-Host "$($var.Key)=$($var.Value)" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "APOS CONFIGURAR:" -ForegroundColor Green
Write-Host "===============" -ForegroundColor Green
Write-Host "1. Aguardar deploy automatico" -ForegroundColor White
Write-Host "2. Testar: node testar-novo-projeto.js [nova-url]" -ForegroundColor White
Write-Host "3. Configurar chaves exchanges" -ForegroundColor White
Write-Host "4. Ativar sistema via /control" -ForegroundColor White

Write-Host ""
Write-Host "TOTAL: 15 variaveis principais configuradas!" -ForegroundColor Green
