# Script de Deploy Direto para Vercel (PowerShell)
# Execute: .\deploy-direct.ps1

Write-Host "🚀 Iniciando deploy do CoinBitClub Frontend no Vercel..." -ForegroundColor Green

# Verificar se o Vercel CLI está instalado
try {
    vercel --version | Out-Null
    Write-Host "✅ Vercel CLI encontrado" -ForegroundColor Green
}
catch {
    Write-Host "📦 Instalando Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

# Fazer deploy direto (sem build local)
Write-Host "🚀 Fazendo deploy direto para Vercel..." -ForegroundColor Green
vercel --prod --force

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deploy iniciado com sucesso!" -ForegroundColor Green
    Write-Host "📊 Acesse https://vercel.com/dashboard para acompanhar o progresso" -ForegroundColor Cyan
} else {
    Write-Host "❌ Erro no deploy" -ForegroundColor Red
}
