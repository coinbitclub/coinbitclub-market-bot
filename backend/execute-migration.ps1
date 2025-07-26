# Migracao Railway - CoinBitClub Market Bot Multiservico
# Execute: .\execute-migration.ps1

param(
    [string]$NewProjectName = "coinbitclub-market-bot-v3"
)

$ErrorActionPreference = "Stop"

Write-Host "Iniciando migracao Railway..." -ForegroundColor Green
Write-Host "Projeto: $NewProjectName" -ForegroundColor Yellow
Write-Host ""

# Verificar Railway CLI
if (!(Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "ERRO: Railway CLI nao encontrado" -ForegroundColor Red
    Write-Host "Instale com: npm install -g @railway/cli" -ForegroundColor Yellow
    exit 1
}

Write-Host "Pre-requisitos OK" -ForegroundColor Green
Write-Host ""

# Backup variaveis
Write-Host "FASE 1: Backup de variaveis..." -ForegroundColor Cyan
if (!(Test-Path "backup_variables.json")) {
    railway variables --json > backup_variables.json
}
Write-Host "Backup concluido" -ForegroundColor Green
Write-Host ""

# Criar novo projeto
Write-Host "FASE 2: Criando novo projeto Railway..." -ForegroundColor Cyan
railway logout 2>$null
railway login

railway init --name $NewProjectName
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Falha ao criar projeto" -ForegroundColor Red
    exit 1
}

# Adicionar PostgreSQL
Write-Host "Adicionando PostgreSQL..." -ForegroundColor Cyan
railway add --database postgres
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Falha ao adicionar PostgreSQL" -ForegroundColor Red
    exit 1
}

Write-Host "Aguardando provisionamento..." -ForegroundColor Cyan
Start-Sleep -Seconds 30
Write-Host "Projeto criado com sucesso" -ForegroundColor Green
Write-Host ""

# Configurar variaveis
Write-Host "FASE 3: Configurando variaveis..." -ForegroundColor Cyan
if (Test-Path "backup_variables.json") {
    $BackupVars = Get-Content "backup_variables.json" | ConvertFrom-Json
    
    $EssentialVars = @(
        "NODE_ENV", "OPENAI_API_KEY", "COINSTATS_API_KEY", "JWT_SECRET", 
        "WEBHOOK_TOKEN", "ADMIN_TOKEN", "STRIPE_SECRET_KEY", "STRIPE_PUBLISHABLE_KEY",
        "STRIPE_WEBHOOK_SECRET", "DASHBOARD_USER", "DASHBOARD_PASS", "USE_REAL_AI",
        "USE_TESTNET", "FRONTEND_URL"
    )
    
    foreach ($VarName in $EssentialVars) {
        if ($BackupVars.$VarName) {
            Write-Host "Configurando $VarName..." -ForegroundColor Gray
            railway variables set "$VarName=$($BackupVars.$VarName)"
        }
    }
    
    railway variables set "PORT=3000"
    railway variables set "NODE_ENV=production"
}
Write-Host "Variaveis configuradas" -ForegroundColor Green
Write-Host ""

# Preparar arquivos
Write-Host "FASE 4: Preparando arquivos multiservico..." -ForegroundColor Cyan

if (Test-Path "server-multiservice-complete.cjs") {
    Copy-Item "server-multiservice-complete.cjs" "server.js" -Force
    Write-Host "Servidor multiservico copiado" -ForegroundColor Green
}

if (Test-Path "package-multiservice.json") {
    Copy-Item "package-multiservice.json" "package.json" -Force
    Write-Host "Package.json multiservico copiado" -ForegroundColor Green
}

if (Test-Path "railway-multiservice.toml") {
    Copy-Item "railway-multiservice.toml" "railway.toml" -Force
    Write-Host "Railway.toml multiservico copiado" -ForegroundColor Green
}

Write-Host "Arquivos preparados" -ForegroundColor Green
Write-Host ""

# Deploy
Write-Host "FASE 5: Fazendo deploy..." -ForegroundColor Cyan
railway up --detach

if ($LASTEXITCODE -eq 0) {
    Write-Host "Deploy iniciado com sucesso" -ForegroundColor Green
    
    Write-Host "Aguardando deploy finalizar..." -ForegroundColor Cyan
    Start-Sleep -Seconds 90
    
    # Obter URL
    $NewUrl = railway domain 2>$null
    if (!$NewUrl) {
        $RailwayStatus = railway status --json 2>$null | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($RailwayStatus -and $RailwayStatus.url) {
            $NewUrl = $RailwayStatus.url
        }
    }
    
    if ($NewUrl) {
        Write-Host "Nova URL: $NewUrl" -ForegroundColor Green
        
        # Testar servidor
        Write-Host "Testando servidor..." -ForegroundColor Cyan
        $MaxAttempts = 6
        $Attempt = 1
        $ServerOk = $false
        
        while ($Attempt -le $MaxAttempts -and !$ServerOk) {
            try {
                Write-Host "Tentativa $Attempt/$MaxAttempts..." -ForegroundColor Gray
                $Response = Invoke-RestMethod -Uri "$NewUrl/health" -Method GET -TimeoutSec 15 -ErrorAction Stop
                
                if ($Response.status -eq "healthy" -or $Response.status -eq "active") {
                    Write-Host "Servidor multiservico respondendo!" -ForegroundColor Green
                    Write-Host "Versao: $($Response.version)" -ForegroundColor Cyan
                    $ServerOk = $true
                }
            } catch {
                Write-Host "Aguardando servidor..." -ForegroundColor Yellow
                Start-Sleep -Seconds 30
                $Attempt++
            }
        }
        
        if (!$ServerOk) {
            Write-Host "AVISO: Servidor pode nao estar respondendo ainda" -ForegroundColor Yellow
            Write-Host "Verifique: $NewUrl/health" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "ERRO: Falha no deploy" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "MIGRACAO CONCLUIDA COM SUCESSO!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Projeto: $NewProjectName" -ForegroundColor White
Write-Host "URL: $NewUrl" -ForegroundColor White
Write-Host ""
Write-Host "TESTES RECOMENDADOS:" -ForegroundColor Cyan
Write-Host "1. Health check: $NewUrl/health" -ForegroundColor White
Write-Host "2. Teste GET: $NewUrl/api/data?test=true" -ForegroundColor White
Write-Host "3. Teste POST: $NewUrl/api/data (JSON body)" -ForegroundColor White
Write-Host "4. Teste webhook: $NewUrl/api/webhooks/tradingview" -ForegroundColor White
Write-Host "5. Teste completo: node test-multiservice.js $NewUrl" -ForegroundColor White
Write-Host ""
Write-Host "Sistema multiservico pronto para GET e POST!" -ForegroundColor Green
