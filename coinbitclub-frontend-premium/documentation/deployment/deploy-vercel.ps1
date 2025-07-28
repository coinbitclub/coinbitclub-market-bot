# Script de Deploy Automático para Vercel (Windows PowerShell)
# Execute: .\deploy-vercel.ps1

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

# Verificar dependências
Write-Host "📦 Verificando dependências..." -ForegroundColor Blue
npm install

# Executar verificações
Write-Host "🧪 Executando verificações..." -ForegroundColor Blue
npm run type-check
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro na verificação de tipos" -ForegroundColor Red
    exit 1
}

npm run lint
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro no linting" -ForegroundColor Red
    exit 1
}

# Build local para verificar
Write-Host "🔨 Testando build..." -ForegroundColor Blue
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro no build" -ForegroundColor Red
    exit 1
}

# Deploy para produção
Write-Host "🚀 Fazendo deploy para produção..." -ForegroundColor Green
vercel --prod

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deploy concluído com sucesso!" -ForegroundColor Green
    Write-Host "📊 Acesse o dashboard: https://vercel.com/dashboard" -ForegroundColor Cyan
} else {
    Write-Host "❌ Erro no deploy" -ForegroundColor Red
    exit 1
}
