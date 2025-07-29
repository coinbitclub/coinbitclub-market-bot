# Script para Gerar Lista Completa de Variaveis de Ambiente para Novo Projeto Railway
# Inclui TODAS as variaveis necessarias

Write-Host "PREPARANDO VARIAVEIS DE AMBIENTE COMPLETAS" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "COPIE E COLE CADA VARIAVEL NO RAILWAY:" -ForegroundColor Yellow
Write-Host "(Settings -> Environment Variables -> Add Variable)" -ForegroundColor Cyan
Write-Host ""

# Basicas obrigatorias
Write-Host "=== VARIAVEIS BASICAS (OBRIGATORIAS) ===" -ForegroundColor Green
Write-Host "DATABASE_URL=postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway" -ForegroundColor White
Write-Host "NODE_ENV=production" -ForegroundColor White
Write-Host "PORT=3000" -ForegroundColor White
Write-Host ""

# Seguranca
Write-Host "=== VARIAVEIS DE SEGURANCA ===" -ForegroundColor Green  
Write-Host "JWT_SECRET=coinbitclub-production-secret-2025-ultra-secure" -ForegroundColor White
Write-Host "ENCRYPTION_KEY=coinbitclub-encryption-key-production-2025" -ForegroundColor White
Write-Host "SESSION_SECRET=coinbitclub-session-secret-2025-ultra-secure" -ForegroundColor White
Write-Host "WEBHOOK_SECRET=coinbitclub-webhook-secret-2025" -ForegroundColor White
Write-Host ""

# Sistema
Write-Host "=== CONFIGURACOES DO SISTEMA ===" -ForegroundColor Green
Write-Host "SISTEMA_MULTIUSUARIO=true" -ForegroundColor White
Write-Host "MODO_HIBRIDO=true" -ForegroundColor White
Write-Host "DEFAULT_LEVERAGE=10" -ForegroundColor White
Write-Host "DEFAULT_RISK_PERCENTAGE=2" -ForegroundColor White
Write-Host "MAX_CONCURRENT_TRADES=5" -ForegroundColor White
Write-Host ""

# Frontend/CORS
Write-Host "=== CONFIGURACOES FRONTEND/CORS ===" -ForegroundColor Green
Write-Host "CORS_ORIGIN=https://coinbitclub-market-bot.vercel.app" -ForegroundColor White
Write-Host "FRONTEND_URL=https://coinbitclub-market-bot.vercel.app" -ForegroundColor White
Write-Host "BACKEND_URL=https://[SUBSTITUA-PELA-NOVA-URL-DO-PROJETO]" -ForegroundColor Yellow
Write-Host ""

# Exchanges - CRITICAS
Write-Host "=== EXCHANGES (CRITICAS PARA TRADING) ===" -ForegroundColor Red
Write-Host "BINANCE_API_KEY=[CONFIGURAR_COM_CHAVE_REAL]" -ForegroundColor Yellow
Write-Host "BINANCE_SECRET_KEY=[CONFIGURAR_COM_SECRET_REAL]" -ForegroundColor Yellow
Write-Host "BYBIT_API_KEY=[CONFIGURAR_COM_CHAVE_REAL]" -ForegroundColor Yellow
Write-Host "BYBIT_SECRET_KEY=[CONFIGURAR_COM_SECRET_REAL]" -ForegroundColor Yellow
Write-Host ""

# Opcionais
Write-Host "=== VARIAVEIS OPCIONAIS (SE JA CONFIGURADO) ===" -ForegroundColor Cyan
Write-Host "TWILIO_ACCOUNT_SID=[se_tem_SMS_configurado]" -ForegroundColor Gray
Write-Host "TWILIO_AUTH_TOKEN=[se_tem_SMS_configurado]" -ForegroundColor Gray
Write-Host "TWILIO_PHONE_NUMBER=[se_tem_SMS_configurado]" -ForegroundColor Gray
Write-Host "STRIPE_SECRET_KEY=[se_tem_pagamentos]" -ForegroundColor Gray
Write-Host "STRIPE_PUBLISHABLE_KEY=[se_tem_pagamentos]" -ForegroundColor Gray
Write-Host "TELEGRAM_BOT_TOKEN=[se_tem_telegram]" -ForegroundColor Gray
Write-Host "TELEGRAM_CHAT_ID=[se_tem_telegram]" -ForegroundColor Gray
Write-Host ""

Write-Host "IMPORTANTE:" -ForegroundColor Red
Write-Host "1. As variaveis BINANCE/BYBIT sao OBRIGATORIAS para trading real" -ForegroundColor Yellow
Write-Host "2. Substitua [CONFIGURAR_COM_CHAVE_REAL] pelas chaves reais" -ForegroundColor Yellow
Write-Host "3. Substitua [SUBSTITUA-PELA-NOVA-URL-DO-PROJETO] pela URL nova" -ForegroundColor Yellow
Write-Host "4. As variaveis opcionais podem ser adicionadas depois" -ForegroundColor White
Write-Host ""

Write-Host "TOTAL DE VARIAVEIS PRINCIPAIS: 15" -ForegroundColor Cyan
Write-Host "VARIAVEIS OPCIONAIS: 7" -ForegroundColor Cyan
Write-Host ""

Write-Host "Apos configurar, testar com:" -ForegroundColor Green
Write-Host "node testar-novo-projeto.js [nova-url]" -ForegroundColor Yellow
