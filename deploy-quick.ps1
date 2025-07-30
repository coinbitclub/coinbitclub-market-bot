#!/usr/bin/env pwsh
# =================================================================
# 🚀 DEPLOY RÁPIDO - COINBITCLUB MARKET BOT V3
# =================================================================

Write-Host "🚀 DEPLOY RÁPIDO INICIADO" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green

# Verificar diretório
if (-not (Test-Path "main.js")) {
    Write-Host "❌ Execute na raiz do projeto" -ForegroundColor Red
    exit 1
}

# Git push
Write-Host "`n📤 Enviando código..." -ForegroundColor Cyan
git add .
git commit -m "🚀 Deploy rápido: Sistema operacional"
git push origin main

# Deploy Railway
Write-Host "`n🚂 Deploy Railway..." -ForegroundColor Cyan
railway up

# Deploy Vercel
Write-Host "`n▲ Deploy Vercel..." -ForegroundColor Cyan
Set-Location "coinbitclub-frontend-premium"
vercel --prod
Set-Location ".."

Write-Host "`n✅ DEPLOY CONCLUÍDO!" -ForegroundColor Green
Write-Host "Backend: https://coinbitclub-market-bot.up.railway.app" -ForegroundColor Cyan
Write-Host "Frontend: https://coinbitclub-frontend-premium.vercel.app" -ForegroundColor Cyan
