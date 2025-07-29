# CONFIGURACAO COMPLETA - TODAS AS VARIAVEIS
# Inclui sistema, integracao e servicos externos

Write-Host "CONFIGURACAO COMPLETA - TODAS AS VARIAVEIS" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "TOTAL: 36 VARIAVEIS DIVIDIDAS EM 4 GRUPOS" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Yellow

Write-Host ""
Write-Host "GRUPO 1: VARIAVEIS PRINCIPAIS (15) - OBRIGATORIAS" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host "DATABASE_URL, NODE_ENV, PORT, JWT_SECRET..." -ForegroundColor White
Write-Host "Status: JA LISTADAS NO ARQUIVO TXT" -ForegroundColor Gray

Write-Host ""
Write-Host "GRUPO 2: EXCHANGES (4) - CRITICAS PARA TRADING" -ForegroundColor Red
Write-Host "===============================================" -ForegroundColor Red
Write-Host "BINANCE_API_KEY" -ForegroundColor Yellow
Write-Host "BINANCE_SECRET_KEY" -ForegroundColor Yellow
Write-Host "BYBIT_API_KEY" -ForegroundColor Yellow
Write-Host "BYBIT_SECRET_KEY" -ForegroundColor Yellow
Write-Host "Status: PRECISAM SER CONFIGURADAS COM CHAVES REAIS" -ForegroundColor Red

Write-Host ""
Write-Host "GRUPO 3: INTEGRACOES EXTERNAS (7) - OPCIONAIS" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "TWILIO_* (SMS)" -ForegroundColor White
Write-Host "STRIPE_* (Pagamentos)" -ForegroundColor White
Write-Host "TELEGRAM_* (Notificacoes)" -ForegroundColor White
Write-Host "OPENAI_API_KEY (IA)" -ForegroundColor White
Write-Host "Status: ADICIONAR SE JA CONFIGURADO" -ForegroundColor Cyan

Write-Host ""
Write-Host "GRUPO 4: SISTEMA AVANCADO (10) - OPCIONAIS" -ForegroundColor Magenta
Write-Host "==========================================" -ForegroundColor Magenta
Write-Host "RATE_LIMIT_*, LOG_*, DB_*, JWT_EXPIRES_IN..." -ForegroundColor White
Write-Host "Status: MELHORAM PERFORMANCE E LOGS" -ForegroundColor Magenta

Write-Host ""
Write-Host "ESTRATEGIA RECOMENDADA:" -ForegroundColor Green
Write-Host "======================" -ForegroundColor Green
Write-Host "1. CONFIGURE GRUPO 1 (15 variaveis principais)" -ForegroundColor White
Write-Host "2. TESTE O SISTEMA basico" -ForegroundColor White
Write-Host "3. ADICIONE GRUPO 2 (chaves exchanges)" -ForegroundColor White
Write-Host "4. TESTE TRADING REAL" -ForegroundColor White
Write-Host "5. ADICIONE GRUPOS 3 e 4 conforme necessario" -ForegroundColor White

Write-Host ""
Write-Host "ARQUIVO ATUALIZADO:" -ForegroundColor Yellow
Write-Host "variaveis-para-copiar.txt - AGORA COM TODAS AS 36 VARIAVEIS" -ForegroundColor White

Write-Host ""
Write-Host "ONDE OBTER AS CHAVES:" -ForegroundColor Red
Write-Host "====================" -ForegroundColor Red
Write-Host "BINANCE: Account -> API Management" -ForegroundColor Yellow
Write-Host "BYBIT: Account -> API Management" -ForegroundColor Yellow
Write-Host "TWILIO: Console -> Account Info" -ForegroundColor Cyan
Write-Host "STRIPE: Dashboard -> Developers -> API Keys" -ForegroundColor Cyan
Write-Host "TELEGRAM: @BotFather para criar bot" -ForegroundColor Cyan

Write-Host ""
Write-Host "PRIORIDADE AGORA:" -ForegroundColor Green
Write-Host "1. Configurar 15 variaveis principais" -ForegroundColor White
Write-Host "2. Fazer deploy e testar sistema basico" -ForegroundColor White
Write-Host "3. Obter chaves exchanges e configurar" -ForegroundColor White
