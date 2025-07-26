#!/usr/bin/env powershell
# ===============================================================
# 🚀 SCRIPT DE CONFIGURAÇÃO COMPLETA - RAILWAY PRODUCTION
# ===============================================================
# Este script configura todas as variáveis de ambiente necessárias
# para produção usando o backup e atualizando para o novo projeto
# ===============================================================

Write-Host "🚀 CONFIGURAÇÃO COMPLETA DE PRODUÇÃO - RAILWAY V3" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# ===============================================================
# VARIÁVEIS BÁSICAS DO SISTEMA
# ===============================================================

Write-Host "🔧 Configurando variáveis básicas do sistema..." -ForegroundColor Yellow

railway variables set NODE_ENV=production
railway variables set DATABASE_SSL=true
railway variables set USE_REAL_AI=true
railway variables set USE_TESTNET=false
railway variables set PGSSLMODE=require

Write-Host "✅ Variáveis básicas configuradas" -ForegroundColor Green

# ===============================================================
# AUTENTICAÇÃO E SEGURANÇA
# ===============================================================

Write-Host "🔐 Configurando autenticação e segurança..." -ForegroundColor Yellow

# JWT_SECRET e ADMIN_TOKEN já estão configurados, mas vamos garantir
railway variables set JWT_SECRET=coinbitclub_super_secret_jwt_key_2024_production
railway variables set ADMIN_TOKEN=COINBITCLUB_SUPERADMIN_2024
railway variables set WEBHOOK_TOKEN=210406

Write-Host "✅ Segurança configurada" -ForegroundColor Green

# ===============================================================
# DASHBOARD ADMIN
# ===============================================================

Write-Host "👤 Configurando dashboard administrativo..." -ForegroundColor Yellow

railway variables set DASHBOARD_USER=erica.andrade.santos@hotmail.com
railway variables set DASHBOARD_PASS=Apelido22@

Write-Host "✅ Dashboard admin configurado" -ForegroundColor Green

# ===============================================================
# BANCO DE DADOS (usando o novo banco migrado)
# ===============================================================

Write-Host "🗄️ Configurando banco de dados..." -ForegroundColor Yellow

# O DATABASE_URL já está correto no Railway, mas vamos garantir
railway variables set DATABASE_URL=postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@postgres.railway.internal:5432/railway

Write-Host "✅ Banco de dados configurado" -ForegroundColor Green

# ===============================================================
# APIS DE TRADING
# ===============================================================

Write-Host "📊 Configurando APIs de trading..." -ForegroundColor Yellow

railway variables set COINSTATS_API_KEY=ZFIxigBcVaCyXDL1Qp/Ork7TOL3+h07NM2f3YoSrMkI=
railway variables set BINANCE_API_BASE=https://api.binance.com
railway variables set BINANCE_API_BASE_TEST=https://testnet.binance.vision
railway variables set BYBIT_BASE_URL_REAL=https://api.bybit.com
railway variables set BYBIT_BASE_URL_TEST=https://api-testnet.bybit.com

Write-Host "✅ APIs de trading configuradas" -ForegroundColor Green

# ===============================================================
# STRIPE PAYMENT SYSTEM
# ===============================================================

Write-Host "💳 Configurando sistema de pagamentos Stripe..." -ForegroundColor Yellow

# Chaves de PRODUÇÃO do Stripe
railway variables set STRIPE_SECRET_KEY=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
railway variables set STRIPE_PUBLISHABLE_KEY=pk_live_51QCOIiBbdaDz4TVOX8Vh9KlFguewjyA2B2FNSSx5i5bUtzcei1aD399iUTyIk6PGQ3N8EW2lCO2lNRd1dWPp2E2X00ydaBMVUI
railway variables set STRIPE_WEBHOOK_SECRET=whsec_cJ97DwC5rzz84PqCSbmTJfyQxykcrStU

# URLs do Stripe (atualizadas para o novo domínio)
railway variables set STRIPE_SUCCESS_URL=https://coinbitclub-market-bot-v3.up.railway.app/sucesso?session_id={CHECKOUT_SESSION_ID}
railway variables set STRIPE_CANCEL_URL=https://coinbitclub-market-bot-v3.up.railway.app/cancelado

# Chaves de TESTE (para fallback/desenvolvimento)
railway variables set STRIPE_TEST_SECRET_KEY=sk_test_51QCOIiBbdaDz4TVOsfkIShNm5BZjIM6GMERrH6XQ7GNJszHP5xkSBmscqpW8sEhqPx4OHTB53HRHPdOaFbMF5DBv00d1mx3VdO
railway variables set STRIPE_TEST_PUBLISHABLE_KEY=pk_test_51QCOIiBbdaDz4TVOUDifY4CsO0KnNJDVtbqTbRUnPIfPyQQg2b3kbQjJQvHm8Y2U9fw4FumMBVY5KEvUAMilWIiA00v0Asnv4F
railway variables set STRIPE_TEST_WEBHOOK_SECRET=whsec_R4PWDR0eJ7k0BA92uZgwrCZ3vaDPYwTZ

Write-Host "✅ Sistema de pagamentos Stripe configurado" -ForegroundColor Green

# ===============================================================
# INTELIGÊNCIA ARTIFICIAL (OpenAI)
# ===============================================================

Write-Host "🤖 Configurando OpenAI..." -ForegroundColor Yellow

railway variables set OPENAI_API_KEY=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

Write-Host "✅ OpenAI configurado" -ForegroundColor Green

# ===============================================================
# NOTIFICAÇÕES WhatsApp (Zapi)
# ===============================================================

Write-Host "📱 Configurando notificações WhatsApp..." -ForegroundColor Yellow

railway variables set ZAPI_INSTANCE=3E0819291FB89055AED996E82C2DBF10
railway variables set ZAPI_TOKEN=2ECE7BD31B3B8E299FC68D6C

Write-Host "✅ WhatsApp configurado" -ForegroundColor Green

# ===============================================================
# CONFIGURAÇÕES FRONTEND
# ===============================================================

Write-Host "🌐 Configurando integração com frontend..." -ForegroundColor Yellow

# URLs atualizadas para o novo projeto
railway variables set REACT_APP_API_URL=https://coinbitclub-market-bot-v3.up.railway.app
railway variables set FRONTEND_URL=https://coinbitclub-market-bot.vercel.app/
railway variables set CORS_ORIGIN=https://coinbitclub-market-bot.vercel.app

Write-Host "✅ Frontend configurado" -ForegroundColor Green

# ===============================================================
# CONFIGURAÇÕES ESPECÍFICAS DO RAILWAY
# ===============================================================

Write-Host "Configurando Railway especificas..." -ForegroundColor Yellow

railway variables set API_PORT=8081
railway variables set NODE_OPTIONS=--dns-result-order=ipv4first

Write-Host "✅ Railway configurado" -ForegroundColor Green

# ===============================================================
# VERIFICAÇÃO FINAL
# ===============================================================

Write-Host ""
Write-Host "🔍 Verificando configuração..." -ForegroundColor Yellow
Write-Host ""

# Executar verificação
node check-production-environment.js

Write-Host ""
Write-Host "🎉 CONFIGURAÇÃO COMPLETA FINALIZADA!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Próximos passos:" -ForegroundColor Yellow
Write-Host "  1. ✅ Todas as variáveis configuradas"
Write-Host "  2. 🔄 Execute: railway deploy"
Write-Host "  3. 🧪 Teste todos os endpoints"
Write-Host "  4. 🎯 Configure webhooks do TradingView"
Write-Host "  5. 🚀 Sistema pronto para produção!"
Write-Host ""
Write-Host "🌐 URLs importantes:" -ForegroundColor Cyan
Write-Host "  Backend: https://coinbitclub-market-bot-v3.up.railway.app"
Write-Host "  Frontend: https://coinbitclub-market-bot.vercel.app"
Write-Host "  Admin: https://coinbitclub-market-bot-v3.up.railway.app/admin"
Write-Host ""
Write-Host "📊 Para testar o sistema:" -ForegroundColor Yellow
Write-Host "  railway logs --tail"
Write-Host "  curl https://coinbitclub-market-bot-v3.up.railway.app/health"
Write-Host ""
