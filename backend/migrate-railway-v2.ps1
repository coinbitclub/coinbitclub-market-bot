# SCRIPT DE MIGRAÇÃO RAILWAY V2
# PowerShell script para migrar e testar

Write-Host "🚀 INICIANDO MIGRAÇÃO RAILWAY V2" -ForegroundColor Green
Write-Host "=" * 60

# Função de teste
function Test-NewProject {
    param([string]$BaseUrl)
    
    Write-Host "`n🔍 Testando novo projeto: $BaseUrl" -ForegroundColor Cyan
    
    $endpoints = @(
        @{ Path = "/health"; Name = "Health Check" },
        @{ Path = "/"; Name = "Root Endpoint" },
        @{ Path = "/api/health"; Name = "API Health" },
        @{ Path = "/api/status"; Name = "Status" }
    )
    
    $successCount = 0
    
    foreach ($endpoint in $endpoints) {
        Write-Host "   Testing $($endpoint.Name)..." -NoNewline
        
        try {
            $response = Invoke-WebRequest -Uri "$BaseUrl$($endpoint.Path)" -Method GET -TimeoutSec 30
            
            if ($response.StatusCode -eq 200) {
                Write-Host " ✅ $($response.StatusCode)" -ForegroundColor Green
                $successCount++
            } else {
                Write-Host " ⚠️ $($response.StatusCode)" -ForegroundColor Yellow
            }
        }
        catch {
            Write-Host " ❌ Error" -ForegroundColor Red
        }
        
        Start-Sleep 1
    }
    
    Write-Host "`n📊 Resultado: $successCount/$($endpoints.Count) endpoints OK"
    return $successCount -eq $endpoints.Count
}

# Função webhook test
function Test-Webhook {
    param([string]$BaseUrl)
    
    Write-Host "`n📡 Testando webhook..." -ForegroundColor Cyan
    
    $webhookData = @{
        test = "migration_test"
        timestamp = (Get-Date).ToString()
        project = "railway_v2"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "$BaseUrl/webhook/test" -Method POST -Body $webhookData -ContentType "application/json" -TimeoutSec 30
        
        if ($response.StatusCode -eq 200) {
            Write-Host "   ✅ Webhook test OK - Status: $($response.StatusCode)" -ForegroundColor Green
            return $true
        }
    }
    catch {
        Write-Host "   ❌ Webhook test failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    return $false
}

# ===== EXECUÇÃO =====

Write-Host "`n🎯 PASSOS DA MIGRAÇÃO:" -ForegroundColor Yellow
Write-Host "1. Criar novo projeto Railway: 'coinbitclub-api-v2'"
Write-Host "2. Conectar mesmo repositório GitHub"
Write-Host "3. Configurar Dockerfile.v2 e railway-v2.toml"
Write-Host "4. Fazer deploy"
Write-Host "5. Testar endpoints"
Write-Host "6. Migrar URLs no frontend"
Write-Host ""

# URLs para teste
$currentUrl = "https://coinbitclub-market-bot-production.up.railway.app"
$newUrl = "https://coinbitclub-api-v2-production.up.railway.app"  # URL do novo projeto

Write-Host "📋 INFORMAÇÕES DA MIGRAÇÃO:" -ForegroundColor Cyan
Write-Host "   Projeto atual: coinbitclub-market-bot-production"
Write-Host "   URL atual: $currentUrl"
Write-Host "   Novo projeto: coinbitclub-api-v2"
Write-Host "   Nova URL: $newUrl"
Write-Host "   Banco: MESMO (yamabiko.proxy.rlwy.net:32866)"
Write-Host ""

# Testar projeto atual
Write-Host "🔍 TESTANDO PROJETO ATUAL (para comparação):"
$currentWorking = Test-NewProject -BaseUrl $currentUrl

if (-not $currentWorking) {
    Write-Host "❌ Projeto atual com problemas - Migração necessária!" -ForegroundColor Red
} else {
    Write-Host "✅ Projeto atual funcionando" -ForegroundColor Green
}

Write-Host "`n⏳ Para testar o novo projeto:" -ForegroundColor Yellow
Write-Host "1. Crie o projeto 'coinbitclub-api-v2' no Railway"
Write-Host "2. Configure Dockerfile.v2 como dockerfile"
Write-Host "3. Adicione variável DATABASE_URL"
Write-Host "4. Execute: Test-NewProject -BaseUrl '$newUrl'"
Write-Host ""

Write-Host "🔗 ARQUIVOS PREPARADOS PARA MIGRAÇÃO:" -ForegroundColor Green
Write-Host "   ✅ server-v2-clean.js - Servidor limpo"
Write-Host "   ✅ Dockerfile.v2 - Container otimizado"  
Write-Host "   ✅ railway-v2.toml - Configuração Railway"
Write-Host "   ✅ MIGRATION-RAILWAY-PLAN.md - Plano completo"
Write-Host ""

Write-Host "🎉 MIGRAÇÃO PREPARADA - Pronto para novo projeto!" -ForegroundColor Green
