# Script PowerShell para inicializar o sistema CoinBitClub
# Execute: .\setup-system.ps1

param(
    [switch]$InitCatalog,
    [switch]$StartServer,
    [switch]$RunMigrations,
    [switch]$SetupStripe,
    [switch]$All
)

Write-Host "🚀 CoinBitClub System Setup" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

# Verificar se Node.js está instalado
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js não encontrado. Instale Node.js primeiro." -ForegroundColor Red
    exit 1
}

# Verificar se npm está instalado
try {
    $npmVersion = npm --version
    Write-Host "✅ NPM version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ NPM não encontrado." -ForegroundColor Red
    exit 1
}

# Função para instalar dependências
function Install-Dependencies {
    Write-Host "`n📦 Instalando dependências..." -ForegroundColor Yellow
    
    if (Test-Path "package.json") {
        npm install
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Dependências instaladas com sucesso" -ForegroundColor Green
        } else {
            Write-Host "❌ Erro ao instalar dependências" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "❌ package.json não encontrado" -ForegroundColor Red
        exit 1
    }
}

# Função para executar migrações
function Run-Migrations {
    Write-Host "`n🔧 Executando migrações do banco de dados..." -ForegroundColor Yellow
    
    if (Test-Path "migrate.js") {
        node migrate.js
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Migrações executadas com sucesso" -ForegroundColor Green
        } else {
            Write-Host "❌ Erro ao executar migrações" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "⚠️  Arquivo migrate.js não encontrado, pulando migrações" -ForegroundColor Yellow
    }
}

# Função para configurar Stripe
function Setup-Stripe {
    Write-Host "`n💳 Configurando Stripe..." -ForegroundColor Yellow
    
    # Verificar se as variáveis de ambiente do Stripe estão configuradas
    if (-not $env:STRIPE_SECRET_KEY) {
        Write-Host "❌ STRIPE_SECRET_KEY não configurada" -ForegroundColor Red
        Write-Host "Configure as seguintes variáveis de ambiente:" -ForegroundColor Yellow
        Write-Host "  STRIPE_SECRET_KEY=sk_test_..." -ForegroundColor White
        Write-Host "  STRIPE_PUBLISHABLE_KEY=pk_test_..." -ForegroundColor White
        Write-Host "  STRIPE_WEBHOOK_SECRET=whsec_..." -ForegroundColor White
        return $false
    }
    
    Write-Host "✅ Variáveis do Stripe configuradas" -ForegroundColor Green
    return $true
}

# Função para inicializar catálogo
function Initialize-Catalog {
    Write-Host "`n📋 Atualizando catálogo com novos planos..." -ForegroundColor Yellow
    
    if (Test-Path "scripts\update-catalog.js") {
        node scripts\update-catalog.js
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Catálogo atualizado com sucesso" -ForegroundColor Green
        } else {
            Write-Host "❌ Erro ao atualizar catálogo" -ForegroundColor Red
            return $false
        }
    } else {
        Write-Host "❌ Script update-catalog.js não encontrado" -ForegroundColor Red
        return $false
    }
    return $true
}

# Função para iniciar servidor
function Start-Server {
    Write-Host "`n🌐 Iniciando servidor..." -ForegroundColor Yellow
    
    if (Test-Path "api-gateway\index.js") {
        Write-Host "Servidor será iniciado em: http://localhost:3000" -ForegroundColor Cyan
        Write-Host "Pressione Ctrl+C para parar o servidor" -ForegroundColor Yellow
        Write-Host ""
        
        node api-gateway\index.js
    } else {
        Write-Host "❌ Arquivo index.js não encontrado" -ForegroundColor Red
        exit 1
    }
}

# Função para mostrar informações úteis
function Show-Info {
    Write-Host "`n📋 INFORMAÇÕES DO SISTEMA" -ForegroundColor Cyan
    Write-Host "=========================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🌐 URLs Importantes:" -ForegroundColor Yellow
    Write-Host "  • API Base: http://localhost:3000/api" -ForegroundColor White
    Write-Host "  • Checkout Atualizado: http://localhost:3000/checkout-updated.html" -ForegroundColor White
    Write-Host "  • Checkout Original: http://localhost:3000/checkout.html" -ForegroundColor White
    Write-Host "  • Admin Dashboard: http://localhost:3000/admin-dashboard.html" -ForegroundColor White
    Write-Host "  • Health Check: http://localhost:3000/health" -ForegroundColor White
    Write-Host ""
    Write-Host "💰 NOVOS PLANOS:" -ForegroundColor Yellow
    Write-Host "  🇧🇷 Brasil:" -ForegroundColor White
    Write-Host "    • Mensal: R$ 200/mês + 10% comissão" -ForegroundColor White
    Write-Host "    • Comissão: R$ 0/mês + 20% comissão" -ForegroundColor White
    Write-Host "  🌎 Internacional:" -ForegroundColor White
    Write-Host "    • Monthly: $40/month + 10% commission" -ForegroundColor White
    Write-Host "    • Commission: $0/month + 20% commission" -ForegroundColor White
    Write-Host ""
    Write-Host "💳 RECARGA:" -ForegroundColor Yellow
    Write-Host "  🇧🇷 Brasil: mín. R$ 60 (descontos: 5% R$600+, 10% R$6.000+)" -ForegroundColor White
    Write-Host "  🌎 Internacional: min. $40 (discounts: 5% $150+, 10% $1.500+)" -ForegroundColor White
    Write-Host ""
    Write-Host "🔗 Endpoints da API:" -ForegroundColor Yellow
    Write-Host "  • Catálogo Público: GET /api/catalog/public" -ForegroundColor White
    Write-Host "  • Produtos: GET /api/catalog/products" -ForegroundColor White
    Write-Host "  • Criar Checkout: POST /api/catalog/checkout" -ForegroundColor White
    Write-Host "  • Dashboard Admin: GET /api/admin/financial/dashboard" -ForegroundColor White
    Write-Host "  • Stripe Webhook: POST /api/stripe/webhook" -ForegroundColor White
    Write-Host ""
    Write-Host "📁 Arquivos Principais:" -ForegroundColor Yellow
    Write-Host "  • Configuração: .env" -ForegroundColor White
    Write-Host "  • Servidor: api-gateway/index.js" -ForegroundColor White
    Write-Host "  • Migrações: migrations/" -ForegroundColor White
    Write-Host "  • Scripts: scripts/" -ForegroundColor White
    Write-Host ""
}

# Executar ações baseadas nos parâmetros
if ($All) {
    $RunMigrations = $true
    $SetupStripe = $true
    $InitCatalog = $true
    $StartServer = $true
}

# Sempre instalar dependências primeiro
Install-Dependencies

# Executar migrações se solicitado
if ($RunMigrations) {
    Run-Migrations
}

# Configurar Stripe se solicitado
if ($SetupStripe) {
    $stripeOk = Setup-Stripe
    if (-not $stripeOk) {
        Write-Host "⚠️  Configure as variáveis do Stripe antes de continuar" -ForegroundColor Yellow
        exit 1
    }
}

# Inicializar catálogo se solicitado
if ($InitCatalog) {
    $catalogOk = Initialize-Catalog
    if (-not $catalogOk) {
        Write-Host "❌ Falha ao inicializar catálogo" -ForegroundColor Red
        exit 1
    }
}

# Mostrar informações úteis
Show-Info

# Iniciar servidor se solicitado
if ($StartServer) {
    Start-Server
} else {
    Write-Host "💡 Para iniciar o servidor, execute:" -ForegroundColor Yellow
    Write-Host "   .\setup-system.ps1 -StartServer" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Para setup completo, execute:" -ForegroundColor Yellow
    Write-Host "   .\setup-system.ps1 -All" -ForegroundColor White
    Write-Host ""
}

Write-Host "✅ Setup concluído!" -ForegroundColor Green
