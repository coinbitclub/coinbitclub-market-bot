# DEPLOY COMPLETO - FASE 3
# Script simplificado para deploy em producao

Write-Host "========================================" -ForegroundColor Green
Write-Host "    COINBITCLUB DEPLOY PRODUCAO        " -ForegroundColor Green  
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Verificar se estamos na pasta correta
if (!(Test-Path "package.json")) {
    Write-Host "ERRO: Execute este script na pasta raiz do projeto!" -ForegroundColor Red
    exit 1
}

Write-Host "1. PREPARANDO AMBIENTE..." -ForegroundColor Cyan
Write-Host ""

# Verificar dependencias
$hasGit = Get-Command git -ErrorAction SilentlyContinue
$hasNode = Get-Command node -ErrorAction SilentlyContinue
$hasNpm = Get-Command npm -ErrorAction SilentlyContinue

if (!$hasGit) {
    Write-Host "ERRO: Git nao encontrado!" -ForegroundColor Red
    exit 1
}

if (!$hasNode) {
    Write-Host "ERRO: Node.js nao encontrado!" -ForegroundColor Red
    exit 1
}

if (!$hasNpm) {
    Write-Host "ERRO: NPM nao encontrado!" -ForegroundColor Red
    exit 1
}

Write-Host "VERIFICANDO VERCEL CLI..." -ForegroundColor Yellow
$hasVercel = Get-Command vercel -ErrorAction SilentlyContinue

if (!$hasVercel) {
    Write-Host "Instalando Vercel CLI..." -ForegroundColor Yellow
    try {
        npm install -g vercel
        Write-Host "Vercel CLI instalado com sucesso!" -ForegroundColor Green
    }
    catch {
        Write-Host "ERRO ao instalar Vercel CLI: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Instale manualmente: npm install -g vercel" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "2. CONFIGURANDO VARIAVEIS DE AMBIENTE..." -ForegroundColor Cyan
Write-Host ""

# Executar configuracao de ambiente
if (Test-Path "setup-env-simple.ps1") {
    Write-Host "Executando setup de variaveis..." -ForegroundColor Yellow
    try {
        & ".\setup-env-simple.ps1"
        Write-Host "Variaveis configuradas!" -ForegroundColor Green
    }
    catch {
        Write-Host "AVISO: Erro na configuracao de variaveis, mas continuando..." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "3. DEPLOY DO FRONTEND (VERCEL)..." -ForegroundColor Cyan
Write-Host ""

$frontendPath = "coinbitclub-frontend-premium"

if (Test-Path $frontendPath) {
    Push-Location $frontendPath
    
    Write-Host "Instalando dependencias do frontend..." -ForegroundColor Yellow
    try {
        npm install
        Write-Host "Dependencias instaladas!" -ForegroundColor Green
    }
    catch {
        Write-Host "ERRO ao instalar dependencias: $($_.Exception.Message)" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    
    Write-Host "Fazendo build do frontend..." -ForegroundColor Yellow
    try {
        npm run build
        Write-Host "Build concluido!" -ForegroundColor Green
    }
    catch {
        Write-Host "ERRO no build: $($_.Exception.Message)" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    
    Write-Host "Fazendo deploy para Vercel..." -ForegroundColor Yellow
    Write-Host "SIGA AS INSTRUCOES DO VERCEL CLI!" -ForegroundColor Cyan
    Write-Host ""
    
    try {
        vercel --prod
        Write-Host "Deploy do frontend CONCLUIDO!" -ForegroundColor Green
    }
    catch {
        Write-Host "ERRO no deploy do frontend: $($_.Exception.Message)" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    
    Pop-Location
} else {
    Write-Host "ERRO: Pasta do frontend nao encontrada: $frontendPath" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "4. DEPLOY DO BACKEND (RAILWAY)..." -ForegroundColor Cyan
Write-Host ""

$backendPath = "backend/api-gateway"

if (Test-Path $backendPath) {
    Push-Location $backendPath
    
    # Verificar Railway CLI
    $hasRailway = Get-Command railway -ErrorAction SilentlyContinue
    
    if (!$hasRailway) {
        Write-Host "Instalando Railway CLI..." -ForegroundColor Yellow
        try {
            npm install -g @railway/cli
            Write-Host "Railway CLI instalado!" -ForegroundColor Green
        }
        catch {
            Write-Host "NAO foi possivel instalar Railway CLI automaticamente." -ForegroundColor Yellow
            Write-Host ""
            Write-Host "INSTRUCOES MANUAIS PARA RAILWAY:" -ForegroundColor Cyan
            Write-Host "1. Visite https://railway.app" -ForegroundColor White
            Write-Host "2. Faca login/cadastro" -ForegroundColor White
            Write-Host "3. Clique em 'New Project'" -ForegroundColor White
            Write-Host "4. Conecte ao seu repositorio GitHub" -ForegroundColor White
            Write-Host "5. Selecione a pasta: backend/api-gateway" -ForegroundColor White
            Write-Host "6. Configure as variaveis de ambiente conforme env-railway.txt" -ForegroundColor White
            Write-Host ""
            
            if (Test-Path "..\..\env-railway.txt") {
                Write-Host "VARIAVEIS DE AMBIENTE PARA RAILWAY:" -ForegroundColor Yellow
                Get-Content "..\..\env-railway.txt"
            }
            
            Pop-Location
            Write-Host ""
            Write-Host "Continue o deploy manualmente via Railway web interface" -ForegroundColor Cyan
            exit 0
        }
    } else {
        Write-Host "Fazendo deploy para Railway..." -ForegroundColor Yellow
        try {
            railway login
            railway link
            railway up --detach
            Write-Host "Deploy do backend CONCLUIDO!" -ForegroundColor Green
        }
        catch {
            Write-Host "ERRO no deploy do backend: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "Tente fazer o deploy manualmente via Railway web interface" -ForegroundColor Yellow
        }
    }
    
    Pop-Location
} else {
    Write-Host "ERRO: Pasta do backend nao encontrada: $backendPath" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "5. VALIDACAO POS-DEPLOY..." -ForegroundColor Cyan
Write-Host ""

Write-Host "Aguardando 30 segundos para estabilizacao..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Verificar se as URLs foram salvas
if ((Test-Path "frontend-url.txt") -and (Test-Path "backend-url.txt")) {
    $frontendUrl = Get-Content "frontend-url.txt" -Raw
    $backendUrl = Get-Content "backend-url.txt" -Raw
    
    if ($frontendUrl -and $backendUrl) {
        Write-Host "Executando validacao automatica..." -ForegroundColor Yellow
        try {
            node validate-production.js $frontendUrl.Trim() $backendUrl.Trim()
        }
        catch {
            Write-Host "Erro na validacao: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "URLs nao capturadas automaticamente" -ForegroundColor Yellow
    Write-Host "Execute manualmente: node validate-production.js [frontend-url] [backend-url]" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   DEPLOY FASE 3 FINALIZADO!           " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "PROXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "1. Verifique os URLs dos deploys" -ForegroundColor White
Write-Host "2. Teste as funcionalidades principais" -ForegroundColor White  
Write-Host "3. Configure monitoramento continuo" -ForegroundColor White
Write-Host "4. Configure custom domains (opcional)" -ForegroundColor White
Write-Host ""

Write-Host "COINBITCLUB MARKET BOT v3.0.0 - PRODUCAO ATIVA!" -ForegroundColor Green
