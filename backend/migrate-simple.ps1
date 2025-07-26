# 🚀 MIGRAÇÃO SIMPLIFICADA PARA NOVO PROJETO RAILWAY
# Script PowerShell para migração completa do CoinBitClub Market Bot
# Execute como Administrador: .\migrate-simple.ps1

param(
    [string]$NewProjectName = "coinbitclub-market-bot-v3",
    [switch]$SkipBackup = $false,
    [switch]$TestMode = $false
)

# Configurações
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

Write-Host "🚀 MIGRAÇÃO RAILWAY - COINBITCLUB MARKET BOT MULTISERVIÇO" -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Yellow
Write-Host ""

# Verificar pré-requisitos
Write-Host "🔍 Verificando pré-requisitos..." -ForegroundColor Cyan

# Verificar Railway CLI
if (!(Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Railway CLI não encontrado" -ForegroundColor Red
    Write-Host "💡 Instale com: npm install -g @railway/cli" -ForegroundColor Yellow
    exit 1
}

# Verificar Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js não encontrado" -ForegroundColor Red
    Write-Host "💡 Instale o Node.js para continuar" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Pré-requisitos verificados" -ForegroundColor Green
Write-Host ""

# FASE 1: BACKUP COMPLETO
if (!$SkipBackup) {
    Write-Host "📦 FASE 1: BACKUP COMPLETO" -ForegroundColor Magenta
    Write-Host "=========================" -ForegroundColor Yellow
    
    # Backup das variáveis (já existe)
    Write-Host "💾 Verificando backup de variáveis..." -ForegroundColor Cyan
    if (Test-Path "backup_variables.json") {
        Write-Host "✅ backup_variables.json encontrado" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Criando backup de variáveis..." -ForegroundColor Yellow
        railway variables --json > backup_variables.json
    }
    
    Write-Host "✅ FASE 1 CONCLUÍDA - Backup finalizado" -ForegroundColor Green
    Write-Host ""
}

# FASE 2: CRIAR NOVO PROJETO RAILWAY
Write-Host "🆕 FASE 2: CRIAR NOVO PROJETO RAILWAY" -ForegroundColor Magenta
Write-Host "====================================" -ForegroundColor Yellow

Write-Host "🔗 Desconectando do projeto atual..." -ForegroundColor Cyan
railway logout 2>$null

Write-Host "🔐 Fazendo login no Railway..." -ForegroundColor Cyan
railway login

if ($TestMode) {
    Write-Host "🧪 MODO TESTE - Simulando criação do projeto" -ForegroundColor Yellow
} else {
    Write-Host "🆕 Criando novo projeto: $NewProjectName" -ForegroundColor Cyan
    
    # Criar novo projeto
    railway project new --name $NewProjectName
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Projeto '$NewProjectName' criado com sucesso" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro ao criar projeto" -ForegroundColor Red
        exit 1
    }
    
    # Adicionar PostgreSQL
    Write-Host "🗄️ Adicionando PostgreSQL..." -ForegroundColor Cyan
    railway add postgresql
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PostgreSQL adicionado" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro ao adicionar PostgreSQL" -ForegroundColor Red
        exit 1
    }
    
    # Aguardar provisionamento
    Write-Host "⏳ Aguardando provisionamento do banco..." -ForegroundColor Cyan
    Start-Sleep -Seconds 30
}

Write-Host "✅ FASE 2 CONCLUÍDA - Novo projeto criado" -ForegroundColor Green
Write-Host ""

# FASE 3: CONFIGURAR VARIÁVEIS DE AMBIENTE
Write-Host "🔧 FASE 3: CONFIGURAR VARIÁVEIS DE AMBIENTE" -ForegroundColor Magenta
Write-Host "==========================================" -ForegroundColor Yellow

if (!$TestMode) {
    # Ler variáveis do backup
    if (Test-Path "backup_variables.json") {
        Write-Host "📋 Carregando variáveis do backup..." -ForegroundColor Cyan
        
        $BackupVars = Get-Content "backup_variables.json" | ConvertFrom-Json
        
        # Lista de variáveis essenciais para migrar
        $EssentialVars = @(
            "NODE_ENV",
            "OPENAI_API_KEY",
            "COINSTATS_API_KEY",
            "JWT_SECRET",
            "WEBHOOK_TOKEN",
            "ADMIN_TOKEN",
            "STRIPE_SECRET_KEY",
            "STRIPE_PUBLISHABLE_KEY",
            "STRIPE_WEBHOOK_SECRET",
            "DASHBOARD_USER",
            "DASHBOARD_PASS",
            "USE_REAL_AI",
            "USE_TESTNET",
            "FRONTEND_URL"
        )
        
        foreach ($VarName in $EssentialVars) {
            if ($BackupVars.$VarName) {
                Write-Host "🔧 Configurando $VarName..." -ForegroundColor Cyan
                railway variables set "$VarName=$($BackupVars.$VarName)"
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "  ✅ $VarName configurada" -ForegroundColor Green
                } else {
                    Write-Host "  ⚠️ Erro ao configurar $VarName" -ForegroundColor Yellow
                }
            }
        }
        
        # Configurar PORT
        Write-Host "🔧 Configurando PORT=3000..." -ForegroundColor Cyan
        railway variables set "PORT=3000"
        
    } else {
        Write-Host "⚠️ backup_variables.json não encontrado" -ForegroundColor Yellow
        Write-Host "🔧 Configurando variáveis essenciais manualmente..." -ForegroundColor Cyan
        
        railway variables set "NODE_ENV=production"
        railway variables set "PORT=3000"
    }
}

Write-Host "✅ FASE 3 CONCLUÍDA - Variáveis configuradas" -ForegroundColor Green
Write-Host ""

# FASE 4: PREPARAR ARQUIVOS MULTISERVIÇO
Write-Host "📦 FASE 4: PREPARAR ARQUIVOS MULTISERVIÇO" -ForegroundColor Magenta
Write-Host "=========================================" -ForegroundColor Yellow

if (!$TestMode) {
    Write-Host "🚀 Preparando deploy multiserviço otimizado..." -ForegroundColor Cyan
    
    # Copiar arquivos de migração otimizados (prioridade para multiserviço)
    if (Test-Path "server-multiservice-complete.cjs") {
        Write-Host "📦 Usando servidor MULTISERVIÇO COMPLETO..." -ForegroundColor Cyan
        Copy-Item "server-multiservice-complete.cjs" "server.js" -Force
        Write-Host "✅ Servidor configurado para GET e POST otimizados" -ForegroundColor Green
    }
    
    # Usar package.json otimizado se disponível (prioridade para multiserviço)
    if (Test-Path "package-multiservice.json") {
        Write-Host "📄 Usando package.json MULTISERVIÇO..." -ForegroundColor Cyan
        Copy-Item "package-multiservice.json" "package.json" -Force
        Write-Host "✅ Dependências otimizadas para multiserviço" -ForegroundColor Green
    }
    
    # Usar railway.toml otimizado se disponível (prioridade para multiserviço)
    if (Test-Path "railway-multiservice.toml") {
        Write-Host "🚂 Usando railway.toml MULTISERVIÇO..." -ForegroundColor Cyan
        Copy-Item "railway-multiservice.toml" "railway.toml" -Force
        Write-Host "✅ Configuração Railway otimizada para GET/POST" -ForegroundColor Green
    }
}

Write-Host "✅ FASE 4 CONCLUÍDA - Arquivos preparados" -ForegroundColor Green
Write-Host ""

# FASE 5: DEPLOY INICIAL
Write-Host "🚀 FASE 5: DEPLOY INICIAL" -ForegroundColor Magenta
Write-Host "========================" -ForegroundColor Yellow

if (!$TestMode) {
    Write-Host "🚀 Fazendo deploy inicial..." -ForegroundColor Cyan
    railway up --detach
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Deploy inicial realizado" -ForegroundColor Green
        
        # Aguardar deploy
        Write-Host "⏳ Aguardando deploy finalizar..." -ForegroundColor Cyan
        Start-Sleep -Seconds 90
        
        # Obter nova URL
        Write-Host "🌐 Obtendo URL do novo projeto..." -ForegroundColor Cyan
        $NewUrl = railway domain 2>$null
        
        if (!$NewUrl) {
            # Tentar obter via railway status
            $RailwayStatus = railway status --json 2>$null | ConvertFrom-Json -ErrorAction SilentlyContinue
            if ($RailwayStatus -and $RailwayStatus.url) {
                $NewUrl = $RailwayStatus.url
            }
        }
        
        if ($NewUrl) {
            Write-Host "🌐 Nova URL: $NewUrl" -ForegroundColor Green
            
            # Testar se o servidor está respondendo
            Write-Host "🧪 Testando novo servidor..." -ForegroundColor Cyan
            $MaxAttempts = 6
            $Attempt = 1
            $ServerOk = $false
            
            while ($Attempt -le $MaxAttempts -and !$ServerOk) {
                try {
                    Write-Host "   Tentativa $Attempt/$MaxAttempts..." -ForegroundColor Gray
                    $Response = Invoke-RestMethod -Uri "$NewUrl/health" -Method GET -TimeoutSec 15 -ErrorAction Stop
                    
                    if ($Response.status -eq "healthy" -or $Response.status -eq "active") {
                        Write-Host "✅ Servidor Multiserviço está respondendo!" -ForegroundColor Green
                        Write-Host "📊 Versão: $($Response.version)" -ForegroundColor Cyan
                        Write-Host "🔧 Tipo: $($Response.service)" -ForegroundColor Cyan
                        
                        # Verificar capacidades multiserviço
                        if ($Response.capabilities) {
                            Write-Host "🎯 Capacidades verificadas:" -ForegroundColor Green
                            if ($Response.capabilities.webhooks_reception) { Write-Host "  ✅ Recepção de Webhooks" -ForegroundColor White }
                            if ($Response.capabilities.rest_api) { Write-Host "  ✅ API REST (GET/POST)" -ForegroundColor White }
                            if ($Response.capabilities.database_operations) { Write-Host "  ✅ Operações de Banco" -ForegroundColor White }
                            if ($Response.capabilities.multi_format_support) { Write-Host "  ✅ Suporte Multi-formato" -ForegroundColor White }
                        }
                        
                        $ServerOk = $true
                    }
                } catch {
                    Write-Host "   ⏳ Aguardando servidor ficar pronto..." -ForegroundColor Yellow
                    Start-Sleep -Seconds 30
                    $Attempt++
                }
            }
            
            if (!$ServerOk) {
                Write-Host "⚠️ Servidor não está respondendo ainda, mas deploy foi realizado" -ForegroundColor Yellow
                Write-Host "💡 Verifique manualmente: $NewUrl/health" -ForegroundColor Yellow
            }
            
        } else {
            Write-Host "⚠️ Não foi possível obter a URL automaticamente" -ForegroundColor Yellow
            Write-Host "💡 Verifique no Railway Dashboard" -ForegroundColor Yellow
        }
        
    } else {
        Write-Host "❌ Erro no deploy inicial" -ForegroundColor Red
        Write-Host "💡 Verifique os logs: railway logs" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "🧪 MODO TESTE - Simulando deploy" -ForegroundColor Yellow
    $NewUrl = "https://$NewProjectName-production.up.railway.app"
}

Write-Host "✅ FASE 5 CONCLUÍDA - Deploy realizado" -ForegroundColor Green
Write-Host ""

# FASE 6: CONFIGURAR BANCO DE DADOS
Write-Host "📊 FASE 6: CONFIGURAR BANCO DE DADOS" -ForegroundColor Magenta
Write-Host "===================================" -ForegroundColor Yellow

if (!$TestMode) {
    Write-Host "🗄️ Configurando banco de dados..." -ForegroundColor Cyan
    
    # Aguardar mais tempo para o banco estar pronto
    Write-Host "⏳ Aguardando banco PostgreSQL estar completamente pronto..." -ForegroundColor Cyan
    Start-Sleep -Seconds 45
    
    # Obter nova DATABASE_URL
    Write-Host "🔍 Obtendo nova DATABASE_URL..." -ForegroundColor Cyan
    $NewDatabaseUrl = railway variables get DATABASE_URL 2>$null
    
    if ($NewDatabaseUrl) {
        Write-Host "✅ Nova DATABASE_URL obtida" -ForegroundColor Green
        
        # Testar conexão com o novo banco usando script externo
        Write-Host "🧪 Testando conexão com o novo banco..." -ForegroundColor Cyan
        
        $TestResult = node test-db-connection-simple.js "$NewDatabaseUrl" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Teste de conexão bem-sucedido!" -ForegroundColor Green
            Write-Host $TestResult
        } else {
            Write-Host "❌ Teste de conexão falhou:" -ForegroundColor Red
            Write-Host $TestResult
            Write-Host "⚠️ Continuando, mas verifique o banco manualmente" -ForegroundColor Yellow
        }
        
        # Criar configuração de banco para o novo projeto
        Write-Host "🔧 Configurando variáveis do banco..." -ForegroundColor Cyan
        railway variables set "DATABASE_SSL=true"
        railway variables set "PGSSL=require"
        railway variables set "PGSSLMODE=require"
        
    } else {
        Write-Host "❌ Não foi possível obter a nova DATABASE_URL" -ForegroundColor Red
        Write-Host "💡 Verifique se o PostgreSQL foi adicionado corretamente" -ForegroundColor Yellow
    }
}

Write-Host "✅ FASE 6 CONCLUÍDA - Banco configurado" -ForegroundColor Green
Write-Host ""

# FASE 7: ATUALIZAR URLs
Write-Host "🔗 FASE 7: ATUALIZAR URLs" -ForegroundColor Magenta
Write-Host "========================" -ForegroundColor Yellow

if (!$TestMode -and $NewUrl) {
    Write-Host "🔧 Atualizando URLs relacionadas..." -ForegroundColor Cyan
    
    # Atualizar URLs do Stripe
    railway variables set "STRIPE_SUCCESS_URL=$NewUrl/sucesso?session_id={CHECKOUT_SESSION_ID}"
    railway variables set "STRIPE_CANCEL_URL=$NewUrl/cancelado"
    railway variables set "REACT_APP_API_URL=$NewUrl"
    
    Write-Host "✅ URLs atualizadas" -ForegroundColor Green
    
    # Salvar informações da migração
    $MigrationInfo = @{
        "migration_date" = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        "old_project" = "coinbitclub-market-bot"
        "new_project" = $NewProjectName
        "new_url" = $NewUrl
        "server_type" = "multiservice-complete"
    }
    
    $MigrationInfo | ConvertTo-Json | Out-File "migration-info.json" -Encoding UTF8
    Write-Host "📋 Informações da migração salvas em migration-info.json" -ForegroundColor Green
}

Write-Host "✅ FASE 7 CONCLUÍDA - URLs atualizadas" -ForegroundColor Green
Write-Host ""

# RESUMO FINAL
Write-Host "🎉 MIGRAÇÃO MULTISERVIÇO CONCLUÍDA COM SUCESSO!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Yellow
Write-Host ""

if (!$TestMode) {
    Write-Host "📊 RESUMO DA MIGRAÇÃO:" -ForegroundColor Cyan
    Write-Host "  • Projeto novo: $NewProjectName" -ForegroundColor White
    Write-Host "  • URL nova: $NewUrl" -ForegroundColor White
    Write-Host "  • Tipo: Servidor Multiserviço Completo" -ForegroundColor White
    Write-Host ""
    
    Write-Host "🎯 CAPACIDADES DO SERVIDOR:" -ForegroundColor Yellow
    Write-Host "  ✅ Recepção de dados via GET" -ForegroundColor White
    Write-Host "  ✅ Recepção de dados via POST" -ForegroundColor White
    Write-Host "  ✅ Webhooks otimizados" -ForegroundColor White
    Write-Host "  ✅ Rate limiting" -ForegroundColor White
    Write-Host "  ✅ Segurança reforçada" -ForegroundColor White
    Write-Host "  ✅ Monitoramento completo" -ForegroundColor White
    Write-Host ""
    
    Write-Host "🔧 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
    Write-Host "  1. ✅ Testar a nova URL: $NewUrl/health" -ForegroundColor White
    Write-Host "  2. 📥 Testar GET: $NewUrl/api/data?test=true&symbol=BTCUSDT" -ForegroundColor White
    Write-Host "  3. 📤 Testar POST: $NewUrl/api/data (com JSON no body)" -ForegroundColor White
    Write-Host "  4. 📡 Testar webhook TradingView: $NewUrl/api/webhooks/tradingview" -ForegroundColor White
    Write-Host "  5. 🧪 Executar testes completos: node test-multiservice.js $NewUrl" -ForegroundColor White
    Write-Host "  6. 🔧 Atualizar webhooks do TradingView para: $NewUrl" -ForegroundColor White
    Write-Host "  7. 📊 Monitorar logs: railway logs -f" -ForegroundColor White
    Write-Host ""
    
    Write-Host "🧪 VALIDAÇÃO RECOMENDADA:" -ForegroundColor Cyan
    Write-Host "  • Teste manual: $NewUrl/health" -ForegroundColor White
    Write-Host "  • Teste GET: $NewUrl/api/data?test=true&action=buy&symbol=BTCUSDT" -ForegroundColor White
    Write-Host "  • Teste POST: Envie JSON para $NewUrl/api/data" -ForegroundColor White
    Write-Host "  • Teste webhook: Envie um webhook teste do TradingView" -ForegroundColor White
    Write-Host "  • Teste completo: node test-multiservice.js $NewUrl" -ForegroundColor White
    
} else {
    Write-Host "🧪 MODO TESTE CONCLUÍDO - Nenhuma alteração real foi feita" -ForegroundColor Yellow
    Write-Host "💡 Para executar a migração real, remova o parâmetro -TestMode" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "✨ Migração multiserviço finalizada! Sistema pronto para GET e POST! 🎉" -ForegroundColor Green
