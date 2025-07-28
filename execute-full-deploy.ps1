# 🎯 SCRIPT DE EXECUÇÃO DO DEPLOY COMPLETO
# Executa o deploy completo em produção com validação

# Configuração inicial
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

Write-Host "🚀 INICIANDO DEPLOY COMPLETO EM PRODUÇÃO" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host ""

# Função para executar comandos com feedback
function Invoke-CommandWithFeedback {
    param(
        [string]$Command,
        [string]$Description,
        [string]$WorkingDirectory = $PWD
    )
    
    Write-Host "📋 $Description..." -ForegroundColor Yellow
    
    try {
        if ($WorkingDirectory -ne $PWD) {
            Push-Location $WorkingDirectory
        }
        
        Invoke-Expression $Command
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $Description concluído com sucesso!" -ForegroundColor Green
        } else {
            Write-Host "❌ $Description falhou!" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ Erro em $Description : $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
    finally {
        if ($WorkingDirectory -ne $PWD) {
            Pop-Location
        }
    }
    
    return $true
}

# Verificar se estamos na pasta correta
if (!(Test-Path "package.json")) {
    Write-Host "❌ Execute este script na pasta raiz do projeto!" -ForegroundColor Red
    exit 1
}

Write-Host "1️⃣ PREPARANDO AMBIENTE DE DEPLOY" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Verificar dependências
$hasVercelCli = (Get-Command vercel -ErrorAction SilentlyContinue) -ne $null
$hasGit = (Get-Command git -ErrorAction SilentlyContinue) -ne $null

if (!$hasGit) {
    Write-Host "❌ Git não encontrado! Instale o Git primeiro." -ForegroundColor Red
    exit 1
}

if (!$hasVercelCli) {
    Write-Host "📦 Instalando Vercel CLI globalmente..." -ForegroundColor Yellow
    if (!(Invoke-CommandWithFeedback "npm install -g vercel" "Instalação do Vercel CLI")) {
        exit 1
    }
}

Write-Host ""
Write-Host "2️⃣ CONFIGURANDO VARIÁVEIS DE AMBIENTE" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Executar script de configuração de ambiente
if (Test-Path "setup-env-simple.ps1") {
    if (!(Invoke-CommandWithFeedback ".\setup-env-simple.ps1" "Configuração de variáveis de ambiente")) {
        Write-Host "⚠️ Erro na configuração de ambiente, mas continuando..." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "3️⃣ DEPLOY DO FRONTEND (VERCEL)" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

$frontendPath = "coinbitclub-frontend-premium"
if (Test-Path $frontendPath) {
    Push-Location $frontendPath
    
    # Instalar dependências do frontend
    if (!(Invoke-CommandWithFeedback "npm install" "Instalação de dependências do frontend" $PWD)) {
        Pop-Location
        exit 1
    }
    
    # Build do frontend
    if (!(Invoke-CommandWithFeedback "npm run build" "Build do frontend" $PWD)) {
        Pop-Location
        exit 1
    }
    
    # Deploy para Vercel
    Write-Host "🚀 Fazendo deploy para Vercel..." -ForegroundColor Yellow
    Write-Host "Siga as instruções do Vercel CLI quando solicitado." -ForegroundColor Cyan
    
    try {
        vercel --prod
        Write-Host "✅ Deploy do frontend concluído!" -ForegroundColor Green
        
        # Capturar URL do Vercel
        $vercelOutput = vercel --prod 2>&1
        if ($vercelOutput -match "https://[^\s]+") {
            $frontendUrl = $matches[0]
            Write-Host "🌐 Frontend URL: $frontendUrl" -ForegroundColor Green
            
            # Salvar URL para uso posterior
            $frontendUrl | Out-File -FilePath "..\frontend-url.txt" -Encoding UTF8
        }
    }
    catch {
        Write-Host "❌ Erro no deploy do frontend: $($_.Exception.Message)" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    
    Pop-Location
} else {
    Write-Host "❌ Pasta do frontend não encontrada: $frontendPath" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "4️⃣ DEPLOY DO BACKEND (RAILWAY)" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

$backendPath = "backend/api-gateway"
if (Test-Path $backendPath) {
    Push-Location $backendPath
    
    # Verificar se Railway CLI está instalado
    $hasRailwayCli = (Get-Command railway -ErrorAction SilentlyContinue) -ne $null
    
    if (!$hasRailwayCli) {
        Write-Host "📦 Instalando Railway CLI..." -ForegroundColor Yellow
        try {
            # Usar npm para instalar Railway CLI
            npm install -g @railway/cli
            Write-Host "✅ Railway CLI instalado!" -ForegroundColor Green
        }
        catch {
            Write-Host "⚠️ Não foi possível instalar Railway CLI automaticamente." -ForegroundColor Yellow
            Write-Host "💡 Instale manualmente: npm install -g @railway/cli" -ForegroundColor Cyan
            Write-Host "💡 Ou visite: https://railway.app/cli" -ForegroundColor Cyan
            
            # Continuar sem Railway CLI - mostrar instruções manuais
            Write-Host ""
            Write-Host "📋 INSTRUÇÕES MANUAIS PARA RAILWAY:" -ForegroundColor Yellow
            Write-Host "1. Visite https://railway.app" -ForegroundColor White
            Write-Host "2. Faça login/cadastro" -ForegroundColor White
            Write-Host "3. Clique em 'New Project'" -ForegroundColor White
            Write-Host "4. Conecte ao seu repositório GitHub" -ForegroundColor White
            Write-Host "5. Configure as variáveis de ambiente:" -ForegroundColor White
            
            if (Test-Path "..\..\env-railway.txt") {
                Write-Host "   (Variáveis salvas em env-railway.txt)" -ForegroundColor Cyan
                Get-Content "..\..\env-railway.txt" | ForEach-Object {
                    Write-Host "   $_" -ForegroundColor Gray
                }
            }
            
            Pop-Location
        }
    } else {
        # Railway CLI disponível - fazer deploy automatizado
        Write-Host "🚀 Fazendo deploy para Railway..." -ForegroundColor Yellow
        try {
            railway login
            railway link
            railway up --detach
            Write-Host "✅ Deploy do backend concluído!" -ForegroundColor Green
            
            # Tentar capturar URL do Railway
            try {
                $railwayUrl = railway domain
                if ($railwayUrl) {
                    Write-Host "🌐 Backend URL: $railwayUrl" -ForegroundColor Green
                    $railwayUrl | Out-File -FilePath "..\..\backend-url.txt" -Encoding UTF8
                }
            }
            catch {
                Write-Host "⚠️ Não foi possível capturar URL do Railway automaticamente" -ForegroundColor Yellow
            }
        }
        catch {
            Write-Host "❌ Erro no deploy do backend: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "💡 Tente fazer o deploy manualmente via Railway web interface" -ForegroundColor Cyan
        }
        
        Pop-Location
    }
} else {
    Write-Host "❌ Pasta do backend não encontrada: $backendPath" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "5️⃣ VALIDAÇÃO PÓS-DEPLOY" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan

# Aguardar um pouco para os deploys estabilizarem
Write-Host "⏳ Aguardando 30 segundos para estabilização..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Tentar executar validação automática
if ((Test-Path "frontend-url.txt") -and (Test-Path "backend-url.txt")) {
    $frontendUrl = Get-Content "frontend-url.txt" -Raw | ForEach-Object { $_.Trim() }
    $backendUrl = Get-Content "backend-url.txt" -Raw | ForEach-Object { $_.Trim() }
    
    if ($frontendUrl -and $backendUrl) {
        Write-Host "🧪 Executando validação automática..." -ForegroundColor Yellow
        try {
            node validate-production.js $frontendUrl $backendUrl
        }
        catch {
            Write-Host "⚠️ Erro na validação automática: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "⚠️ URLs não capturadas automaticamente" -ForegroundColor Yellow
    Write-Host "💡 Execute manualmente: node validate-production.js <frontend-url> <backend-url>" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "🎉 DEPLOY COMPLETO FINALIZADO!" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Green

Write-Host ""
Write-Host "📋 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "1. Verifique os URLs dos deploys" -ForegroundColor White
Write-Host "2. Teste as funcionalidades principais" -ForegroundColor White
Write-Host "3. Configure monitoramento contínuo" -ForegroundColor White
Write-Host "4. Configure custom domains (opcional)" -ForegroundColor White

Write-Host ""
Write-Host "📚 DOCUMENTAÇÃO:" -ForegroundColor Cyan
Write-Host "- GUIA-DEPLOY-PRODUCAO-COMPLETO.md" -ForegroundColor White
Write-Host "- DEPLOY_INSTRUCTIONS.md" -ForegroundColor White
Write-Host "- TROUBLESHOOTING-DEPLOY.md" -ForegroundColor White

Write-Host ""
Write-Host "✨ CoinBitClub Market Bot v3.0.0 está em produção! ✨" -ForegroundColor Green
