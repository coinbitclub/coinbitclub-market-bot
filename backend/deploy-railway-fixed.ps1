# Script de Deploy Corrigido para Railway - Windows PowerShell
# CoinBitClub Market Bot - Versao 29/07/2025

Write-Host "🚀 DEPLOY RAILWAY - COINBITCLUB MARKET BOT" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🔧 Versao corrigida - sem caracteres especiais" -ForegroundColor Yellow
Write-Host ""

# Verificar se estamos no diretorio correto
if (-not (Test-Path "server-clean.cjs")) {
    Write-Host "❌ Arquivo server-clean.cjs nao encontrado!" -ForegroundColor Red
    Write-Host "Execute este script a partir da pasta backend/" -ForegroundColor Red
    exit 1
}

# Verificar se Railway CLI esta instalado
try {
    $railwayVersion = railway --version 2>$null
    Write-Host "✅ Railway CLI encontrado" -ForegroundColor Green
}
catch {
    Write-Host "📦 Instalando Railway CLI..." -ForegroundColor Yellow
    npm install -g @railway/cli
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro ao instalar Railway CLI" -ForegroundColor Red
        exit 1
    }
}

# Fazer backup dos arquivos originais
Write-Host "🔄 Fazendo backup dos arquivos originais..." -ForegroundColor Yellow

if (Test-Path "package.json") {
    Copy-Item "package.json" "package.json.backup"
    Write-Host "✅ Backup do package.json criado" -ForegroundColor Green
}

if (Test-Path "server-multiservice-complete.cjs") {
    Copy-Item "server-multiservice-complete.cjs" "server-multiservice-complete.cjs.backup"
    Write-Host "✅ Backup do servidor original criado" -ForegroundColor Green
}

# Substituir package.json pelo limpo
Write-Host "🔄 Usando package.json limpo..." -ForegroundColor Yellow
Copy-Item "package-clean.json" "package.json"
Write-Host "✅ Package.json atualizado" -ForegroundColor Green

# Verificar arquivos necessarios
Write-Host "🔍 Verificando arquivos necessarios..." -ForegroundColor Yellow

$required_files = @("server-clean.cjs", "package.json", "Dockerfile.railway-completo", "railway.toml")

foreach ($file in $required_files) {
    if (Test-Path $file) {
        Write-Host "✅ $file - encontrado" -ForegroundColor Green
    } else {
        Write-Host "❌ $file - NAO encontrado" -ForegroundColor Red
        exit 1
    }
}

# Testar servidor rapidamente
Write-Host "🧪 Testando servidor..." -ForegroundColor Yellow
node -c server-clean.cjs

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro de syntax no servidor" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Servidor testado com sucesso" -ForegroundColor Green

# Login no Railway se necessario
Write-Host "🔐 Verificando login no Railway..." -ForegroundColor Yellow
$null = railway whoami 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "📝 Fazendo login no Railway..." -ForegroundColor Yellow
    railway login
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro no login do Railway" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Login no Railway confirmado" -ForegroundColor Green

# Verificar se projeto existe
Write-Host "🔍 Verificando projeto Railway..." -ForegroundColor Yellow
if (-not (Test-Path "railway.json") -and -not (Test-Path ".railway.json")) {
    Write-Host "🏗️ Inicializando projeto Railway..." -ForegroundColor Yellow
    railway init
}

# Fazer deploy
Write-Host ""
Write-Host "🚀 INICIANDO DEPLOY..." -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
railway up

# Verificar resultado do deploy
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 DEPLOY REALIZADO COM SUCESSO!" -ForegroundColor Green
    Write-Host "================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Informacoes do deploy:" -ForegroundColor Yellow
    Write-Host "✅ Servidor: server-clean.cjs (sem caracteres especiais)" -ForegroundColor Green
    Write-Host "✅ Package: package-clean.json (encoding correto)" -ForegroundColor Green
    Write-Host "✅ Dockerfile: Dockerfile.railway-completo (otimizado)" -ForegroundColor Green
    Write-Host "✅ Health check: /health" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔗 Comandos uteis:" -ForegroundColor Yellow
    Write-Host "- Ver logs: railway logs" -ForegroundColor White
    Write-Host "- Abrir app: railway open" -ForegroundColor White
    Write-Host "- Ver status: railway status" -ForegroundColor White
    Write-Host ""
    Write-Host "🌐 Abrindo aplicacao..." -ForegroundColor Yellow
    railway open
    
} else {
    Write-Host ""
    Write-Host "❌ ERRO NO DEPLOY" -ForegroundColor Red
    Write-Host "=================" -ForegroundColor Red
    Write-Host ""
    Write-Host "📋 Verificando logs..." -ForegroundColor Yellow
    railway logs --tail 50
    
    Write-Host ""
    Write-Host "🔧 Possiveis solucoes:" -ForegroundColor Yellow
    Write-Host "1. Verificar variaveis de ambiente no Railway" -ForegroundColor White
    Write-Host "2. Verificar se PostgreSQL esta configurado" -ForegroundColor White
    Write-Host "3. Verificar logs com: railway logs" -ForegroundColor White
    Write-Host ""
    
    # Restaurar arquivos originais
    if (Test-Path "package.json.backup") {
        Copy-Item "package.json.backup" "package.json"
        Write-Host "🔄 Package.json original restaurado" -ForegroundColor Yellow
    }
    
    exit 1
}

Write-Host ""
Write-Host "✅ DEPLOY CONCLUIDO!" -ForegroundColor Green
Write-Host "Servidor limpo e otimizado deployado com sucesso!" -ForegroundColor Green
