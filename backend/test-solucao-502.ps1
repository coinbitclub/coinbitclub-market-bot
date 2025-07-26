# SCRIPT DE TESTES COMPLETOS - Verificar solução 502
# PowerShell script para testar todos os endpoints

Write-Host "🚀 INICIANDO TESTES COMPLETOS - SOLUÇÃO 502" -ForegroundColor Green
Write-Host "=" * 60

# Aguardar deploy Railway
Write-Host "⏳ Aguardando deploy Railway (2 minutos)..." -ForegroundColor Yellow
Start-Sleep 120

# Função para testar endpoint
function Test-Endpoint {
    param(
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Body = @{},
        [string]$Description
    )
    
    Write-Host "`n🔍 Testando: $Description" -ForegroundColor Cyan
    Write-Host "   URL: $Url"
    Write-Host "   Method: $Method"
    
    try {
        if ($Method -eq "GET") {
            $response = Invoke-WebRequest -Uri $Url -Method $Method -TimeoutSec 30
        } else {
            $jsonBody = $Body | ConvertTo-Json
            $response = Invoke-WebRequest -Uri $Url -Method $Method -Body $jsonBody -ContentType "application/json" -TimeoutSec 30
        }
        
        Write-Host "   ✅ STATUS: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "   📄 RESPONSE:" -ForegroundColor Gray
        
        # Parse JSON se possível
        try {
            $jsonResponse = $response.Content | ConvertFrom-Json
            $jsonResponse | ConvertTo-Json -Depth 3 | Write-Host
        } catch {
            Write-Host $response.Content
        }
        
        return $true
    }
    catch {
        Write-Host "   ❌ ERRO: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# URLs para teste
$baseUrl = "https://coinbitclub-market-bot-production.up.railway.app"

# Array de testes
$tests = @(
    @{ Url = "$baseUrl/health"; Description = "Health Check Railway" },
    @{ Url = "$baseUrl/"; Description = "Root Endpoint" },
    @{ Url = "$baseUrl/api/health"; Description = "API Health Check" },
    @{ 
        Url = "$baseUrl/webhook/test"; 
        Method = "POST"; 
        Body = @{ test = "webhook_test"; timestamp = (Get-Date).ToString() }; 
        Description = "Webhook Test" 
    },
    @{ 
        Url = "$baseUrl/api/webhooks/tradingview"; 
        Method = "POST"; 
        Body = @{ symbol = "BTCUSDT"; action = "BUY"; price = 50000; test = $true }; 
        Description = "TradingView Webhook" 
    }
)

# Executar testes
$successCount = 0
$totalTests = $tests.Count

foreach ($test in $tests) {
    $method = if ($test.Method) { $test.Method } else { "GET" }
    $body = if ($test.Body) { $test.Body } else { @{} }
    
    $result = Test-Endpoint -Url $test.Url -Method $method -Body $body -Description $test.Description
    if ($result) { $successCount++ }
    Start-Sleep 2
}

# Resultado final
Write-Host "`n" + "=" * 60
Write-Host "🎯 RESULTADO FINAL DOS TESTES" -ForegroundColor Yellow
Write-Host "✅ Sucessos: $successCount/$totalTests" -ForegroundColor Green

if ($successCount -eq $totalTests) {
    Write-Host "🎉 TODOS OS TESTES PASSARAM - ERRO 502 RESOLVIDO!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Alguns testes falharam - Investigar..." -ForegroundColor Yellow
}

Write-Host "=" * 60
