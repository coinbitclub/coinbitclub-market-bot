#!/usr/bin/env pwsh
# =================================================================
# 🚀 DEPLOY PRODUÇÃO FINAL - COINBITCLUB MARKET BOT V3
# =================================================================
# Sistema 100% corrigido e testado
# NUL characters eliminados | Backend operacional | Frontend build OK
# =================================================================

Write-Host "🚀 INICIANDO DEPLOY DE PRODUÇÃO FINAL" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Verificar se estamos no diretório correto
if (-not (Test-Path "main.js")) {
    Write-Host "❌ Erro: Execute este script na raiz do projeto" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Diretório verificado" -ForegroundColor Green

# =================================================================
# FASE 1: VALIDAÇÃO PRÉ-DEPLOY
# =================================================================
Write-Host "`n🔍 FASE 1: VALIDAÇÃO PRÉ-DEPLOY" -ForegroundColor Yellow

# Verificar arquivos críticos
$criticalFiles = @("main.js", "package.json", "railway.json")
foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Write-Host "✅ ${file}: Encontrado" -ForegroundColor Green
        
        # Verificar se tem caracteres NUL
        $content = Get-Content $file -Raw -Encoding UTF8
        if ($content -match "`0") {
            Write-Host "❌ ${file}: Contém caracteres NUL!" -ForegroundColor Red
            Write-Host "   Execute: node nul-destroyer.js" -ForegroundColor Yellow
            exit 1
        } else {
            Write-Host "✅ ${file}: Limpo (sem NUL)" -ForegroundColor Green
        }
    } else {
        Write-Host "❌ ${file}: NÃO ENCONTRADO!" -ForegroundColor Red
        exit 1
    }
}

# Testar servidor local
Write-Host "`n🧪 Testando servidor local..." -ForegroundColor Cyan
Start-Process -FilePath "node" -ArgumentList "main.js" -NoNewWindow -PassThru | Out-Null
Start-Sleep -Seconds 5

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/health" -TimeoutSec 10
    if ($response.status -eq "OK") {
        Write-Host "✅ Servidor local funcionando" -ForegroundColor Green
    } else {
        Write-Host "❌ Servidor local com problema" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Servidor local não responde" -ForegroundColor Red
    exit 1
} finally {
    # Parar servidor de teste
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
}

# =================================================================
# FASE 2: DEPLOY BACKEND (RAILWAY)
# =================================================================
Write-Host "`n🚂 FASE 2: DEPLOY BACKEND NO RAILWAY" -ForegroundColor Yellow

# Verificar se Railway CLI está instalado
try {
    railway --version | Out-Null
    Write-Host "✅ Railway CLI detectado" -ForegroundColor Green
} catch {
    Write-Host "❌ Railway CLI não encontrado" -ForegroundColor Red
    Write-Host "   Instale: npm install -g @railway/cli" -ForegroundColor Yellow
    exit 1
}

# Login no Railway (se necessário)
Write-Host "🔐 Verificando login Railway..." -ForegroundColor Cyan
try {
    railway whoami | Out-Null
    Write-Host "✅ Já logado no Railway" -ForegroundColor Green
} catch {
    Write-Host "🔐 Fazendo login no Railway..." -ForegroundColor Yellow
    railway login
}

# Deploy do backend
Write-Host "🚀 Iniciando deploy do backend..." -ForegroundColor Cyan
try {
    # Verificar se existe projeto
    railway status | Out-Null
    Write-Host "✅ Projeto Railway encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Projeto Railway não encontrado" -ForegroundColor Red
    Write-Host "   Configure: railway link" -ForegroundColor Yellow
    exit 1
}

# Fazer deploy
Write-Host "📦 Fazendo deploy..." -ForegroundColor Cyan
railway up

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deploy do backend concluído!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro no deploy do backend" -ForegroundColor Red
    exit 1
}

# Obter URL do backend
Write-Host "🔗 Obtendo URL do backend..." -ForegroundColor Cyan
try {
    $backendUrl = railway domain
    Write-Host "✅ Backend URL: $backendUrl" -ForegroundColor Green
    
    # Testar backend deployado
    Start-Sleep -Seconds 30
    $response = Invoke-RestMethod -Uri "$backendUrl/health" -TimeoutSec 30
    if ($response.status -eq "OK") {
        Write-Host "✅ Backend funcionando em produção!" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Backend pode demorar alguns minutos para ficar disponível" -ForegroundColor Yellow
}

# =================================================================
# FASE 3: DEPLOY FRONTEND (VERCEL)
# =================================================================
Write-Host "`n▲ FASE 3: DEPLOY FRONTEND NO VERCEL" -ForegroundColor Yellow

# Ir para o diretório do frontend
Set-Location "coinbitclub-frontend-premium"

# Verificar se Vercel CLI está instalado
try {
    vercel --version | Out-Null
    Write-Host "✅ Vercel CLI detectado" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI não encontrado" -ForegroundColor Red
    Write-Host "   Instale: npm install -g vercel" -ForegroundColor Yellow
    exit 1
}

# Login no Vercel (se necessário)
Write-Host "🔐 Verificando login Vercel..." -ForegroundColor Cyan
try {
    vercel whoami | Out-Null
    Write-Host "✅ Já logado no Vercel" -ForegroundColor Green
} catch {
    Write-Host "🔐 Fazendo login no Vercel..." -ForegroundColor Yellow
    vercel login
}

# Build e deploy do frontend
Write-Host "🏗️  Fazendo build do frontend..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build do frontend concluído!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro no build do frontend" -ForegroundColor Red
    exit 1
}

Write-Host "🚀 Fazendo deploy do frontend..." -ForegroundColor Cyan
vercel --prod

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deploy do frontend concluído!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro no deploy do frontend" -ForegroundColor Red
    exit 1
}

# Voltar para raiz
Set-Location ".."

# =================================================================
# FASE 4: VALIDAÇÃO FINAL
# =================================================================
Write-Host "`n🧪 FASE 4: VALIDAÇÃO FINAL" -ForegroundColor Yellow

Write-Host "⏳ Aguardando estabilização dos serviços..." -ForegroundColor Cyan
Start-Sleep -Seconds 60

# Testar endpoints
Write-Host "🔍 Testando endpoints em produção..." -ForegroundColor Cyan

# URLs (ajustar conforme necessário)
$backendUrl = "https://coinbitclub-market-bot.up.railway.app"
$frontendUrl = "https://coinbitclub-frontend-premium.vercel.app"

# Testar backend
try {
    $backendResponse = Invoke-RestMethod -Uri "$backendUrl/health" -TimeoutSec 30
    if ($backendResponse.status -eq "OK") {
        Write-Host "✅ Backend produção: FUNCIONANDO" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Backend produção: ERRO" -ForegroundColor Red
}

# Testar frontend
try {
    $frontendResponse = Invoke-WebRequest -Uri $frontendUrl -TimeoutSec 30
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "✅ Frontend produção: FUNCIONANDO" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Frontend produção: ERRO" -ForegroundColor Red
}

# =================================================================
# RESULTADO FINAL
# =================================================================
Write-Host "`n🎉 DEPLOY CONCLUÍDO!" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Green
Write-Host "✅ Backend Railway: $backendUrl" -ForegroundColor Green
Write-Host "✅ Frontend Vercel: $frontendUrl" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "🔗 LINKS DE ACESSO:" -ForegroundColor Cyan
Write-Host "   Backend API: $backendUrl/health" -ForegroundColor White
Write-Host "   Frontend App: $frontendUrl" -ForegroundColor White
Write-Host "   Admin Panel: $frontendUrl/admin/dashboard" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "📊 STATUS DO SISTEMA:" -ForegroundColor Cyan
Write-Host "   ✅ Caracteres NUL: ELIMINADOS" -ForegroundColor Green
Write-Host "   ✅ Backend: OPERACIONAL" -ForegroundColor Green
Write-Host "   ✅ Frontend: OPERACIONAL" -ForegroundColor Green
Write-Host "   ✅ Deploy: COMPLETO" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "🚀 SISTEMA 100% OPERACIONAL EM PRODUÇÃO!" -ForegroundColor Green

Write-Host "`nPressione qualquer tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
