# 🔍 DIAGNÓSTICO AVANÇADO RAILWAY - POWERSHELL
# Testes completos para descobrir configurações que não funcionam

# URLs para teste
$RAILWAY_URL = "https://coinbitclub-market-bot-production.up.railway.app"
$LOCAL_URL = "http://localhost:3000"

Write-Host "🚀 INICIANDO DIAGNÓSTICO AVANÇADO RAILWAY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan

# TESTE 1: Verificar conectividade básica
Write-Host "`n📡 TESTE 1: CONECTIVIDADE BÁSICA" -ForegroundColor Yellow
Write-Host "────────────────────────────────────" -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri $RAILWAY_URL -Method GET -TimeoutSec 10 -ErrorAction Stop
    Write-Host "✅ Conectividade OK - Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Erro de conectividade:" -ForegroundColor Red
    Write-Host "StatusCode: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "StatusDescription: $($_.Exception.Response.StatusDescription)" -ForegroundColor Red
    Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
}

# TESTE 2: Headers detalhados
Write-Host "`n🔍 TESTE 2: ANÁLISE DE HEADERS" -ForegroundColor Yellow
Write-Host "────────────────────────────────────" -ForegroundColor Yellow

try {
    $webRequest = [System.Net.WebRequest]::Create($RAILWAY_URL)
    $webRequest.Method = "GET"
    $webRequest.Timeout = 10000
    
    $response = $webRequest.GetResponse()
    Write-Host "✅ Headers da resposta:" -ForegroundColor Green
    foreach ($header in $response.Headers.AllKeys) {
        Write-Host "$header`: $($response.Headers[$header])" -ForegroundColor White
    }
    $response.Close()
} catch {
    Write-Host "❌ Erro ao obter headers:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# TESTE 3: Teste de endpoints específicos
Write-Host "`n📊 TESTE 3: ENDPOINTS ESPECÍFICOS" -ForegroundColor Yellow
Write-Host "────────────────────────────────────" -ForegroundColor Yellow

$endpoints = @(
    "/",
    "/api/health",
    "/api/status",
    "/health",
    "/status"
)

foreach ($endpoint in $endpoints) {
    $fullUrl = $RAILWAY_URL + $endpoint
    Write-Host "`n🔍 Testando: $fullUrl" -ForegroundColor Cyan
    
    try {
        $response = Invoke-WebRequest -Uri $fullUrl -Method GET -TimeoutSec 10 -ErrorAction Stop
        Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "📝 Content-Type: $($response.Headers['Content-Type'])" -ForegroundColor White
        
        if ($response.Content.Length -lt 500) {
            Write-Host "📄 Response Body:" -ForegroundColor White
            Write-Host $response.Content -ForegroundColor Gray
        } else {
            Write-Host "📄 Response Body (truncated): $($response.Content.Substring(0, 200))..." -ForegroundColor Gray
        }
    } catch {
        Write-Host "❌ Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        if ($_.Exception.Response.StatusCode -eq 404) {
            try {
                $errorStream = $_.Exception.Response.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($errorStream)
                $errorBody = $reader.ReadToEnd()
                Write-Host "📄 Error Body: $errorBody" -ForegroundColor Red
                $reader.Close()
                $errorStream.Close()
            } catch {
                Write-Host "Não foi possível ler o corpo do erro" -ForegroundColor Red
            }
        }
    }
}

# TESTE 4: Webhook TradingView com dados reais
Write-Host "`n📡 TESTE 4: WEBHOOK TRADINGVIEW" -ForegroundColor Yellow
Write-Host "────────────────────────────────────" -ForegroundColor Yellow

$webhookData = @{
    token = "coinbitclub_webhook_secret_2024"
    strategy = "TradingView_PowerShell_Test"
    symbol = "BTCUSDT"
    action = "BUY"
    price = 67890.50
    timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    indicators = @{
        ema9_30 = 67750.25
        rsi_4h = 65.8
        rsi_15 = 42.3
        momentum_15 = 1.95
        atr_30 = 1250.40
        atr_pct_30 = 1.84
    }
    test_mode = $true
    test_timestamp = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
} | ConvertTo-Json -Depth 3

$webhookUrl = $RAILWAY_URL + "/api/webhooks/tradingview"
Write-Host "🎯 URL: $webhookUrl" -ForegroundColor Cyan
Write-Host "📦 Payload:" -ForegroundColor Cyan
Write-Host $webhookData -ForegroundColor Gray

try {
    $headers = @{
        "Content-Type" = "application/json"
        "User-Agent" = "TradingView-PowerShell-Test"
        "X-Test-Signal" = "true"
    }
    
    $response = Invoke-RestMethod -Uri $webhookUrl -Method POST -Body $webhookData -Headers $headers -TimeoutSec 15 -ErrorAction Stop
    Write-Host "✅ WEBHOOK SUCESSO!" -ForegroundColor Green
    Write-Host "📊 Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ WEBHOOK ERRO!" -ForegroundColor Red
    Write-Host "StatusCode: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        try {
            $errorStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorStream)
            $errorBody = $reader.ReadToEnd()
            Write-Host "📄 Error Body: $errorBody" -ForegroundColor Red
            $reader.Close()
            $errorStream.Close()
        } catch {
            Write-Host "Não foi possível ler o corpo do erro" -ForegroundColor Red
        }
    }
}

# TESTE 5: Webhook genérico /webhook/signal1
Write-Host "`n📡 TESTE 5: WEBHOOK GENÉRICO /webhook/signal1" -ForegroundColor Yellow
Write-Host "────────────────────────────────────────────────" -ForegroundColor Yellow

$genericWebhookData = @{
    strategy = "TradingView_Generic_Test"
    symbol = "ETHUSDT"
    action = "SELL"
    price = 3245.80
    timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    source = "PowerShell_Test"
} | ConvertTo-Json -Depth 2

$genericWebhookUrl = $RAILWAY_URL + "/webhook/signal1"
Write-Host "🎯 URL: $genericWebhookUrl" -ForegroundColor Cyan
Write-Host "📦 Payload:" -ForegroundColor Cyan
Write-Host $genericWebhookData -ForegroundColor Gray

try {
    $headers = @{
        "Content-Type" = "application/json"
        "User-Agent" = "TradingView-PowerShell-Generic"
    }
    
    $response = Invoke-RestMethod -Uri $genericWebhookUrl -Method POST -Body $genericWebhookData -Headers $headers -TimeoutSec 15 -ErrorAction Stop
    Write-Host "✅ WEBHOOK GENÉRICO SUCESSO!" -ForegroundColor Green
    Write-Host "📊 Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ WEBHOOK GENÉRICO ERRO!" -ForegroundColor Red
    Write-Host "StatusCode: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
}

# TESTE 6: Teste de DNS e conectividade de rede
Write-Host "`n🌐 TESTE 6: DIAGNÓSTICO DNS E REDE" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────" -ForegroundColor Yellow

$domain = "coinbitclub-market-bot-backend-production.up.railway.app"
Write-Host "🔍 Resolvendo DNS para: $domain" -ForegroundColor Cyan

try {
    $dnsResult = Resolve-DnsName -Name $domain -ErrorAction Stop
    Write-Host "✅ DNS Resolution:" -ForegroundColor Green
    foreach ($record in $dnsResult) {
        Write-Host "Type: $($record.Type), IP: $($record.IPAddress)" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Erro DNS: $($_.Exception.Message)" -ForegroundColor Red
}

# TESTE 7: Ping e conectividade TCP
Write-Host "`n🏓 TESTE 7: PING E CONECTIVIDADE TCP" -ForegroundColor Yellow
Write-Host "──────────────────────────────────────" -ForegroundColor Yellow

try {
    $pingResult = Test-Connection -ComputerName $domain -Count 3 -ErrorAction Stop
    Write-Host "✅ Ping OK - Tempo médio: $([math]::Round(($pingResult | Measure-Object ResponseTime -Average).Average, 2))ms" -ForegroundColor Green
} catch {
    Write-Host "❌ Ping falhou: $($_.Exception.Message)" -ForegroundColor Red
}

# TESTE 8: Trace Route (simplificado)
Write-Host "`n🛣️ TESTE 8: TRACE ROUTE" -ForegroundColor Yellow
Write-Host "──────────────────────────" -ForegroundColor Yellow

try {
    $traceResult = Test-NetConnection -ComputerName $domain -Port 443 -InformationLevel Detailed
    Write-Host "✅ Trace Route:" -ForegroundColor Green
    Write-Host "RemoteAddress: $($traceResult.RemoteAddress)" -ForegroundColor White
    Write-Host "PingSucceeded: $($traceResult.PingSucceeded)" -ForegroundColor White
    Write-Host "TcpTestSucceeded: $($traceResult.TcpTestSucceeded)" -ForegroundColor White
} catch {
    Write-Host "❌ Trace Route falhou: $($_.Exception.Message)" -ForegroundColor Red
}

# RESUMO FINAL
Write-Host "`n🏆 RESUMO DO DIAGNÓSTICO" -ForegroundColor Cyan
Write-Host "══════════════════════════" -ForegroundColor Cyan

Write-Host "`n📊 STATUS GERAL:" -ForegroundColor Yellow
Write-Host "• DNS Resolution: Verificar logs acima" -ForegroundColor White
Write-Host "• Conectividade TCP: Verificar logs acima" -ForegroundColor White  
Write-Host "• Endpoints HTTP: Verificar status de cada endpoint" -ForegroundColor White
Write-Host "• Webhook TradingView: Verificar se retornou 200 ou erro" -ForegroundColor White
Write-Host "• Webhook Genérico: Verificar se /webhook/signal1 funciona" -ForegroundColor White

Write-Host "`n🔧 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. Analisar os logs de erro acima" -ForegroundColor White
Write-Host "2. Verificar configurações Railway se todos falharam" -ForegroundColor White
Write-Host "3. Testar localmente se Railway não responder" -ForegroundColor White
Write-Host "4. Verificar configuração de domínio Railway" -ForegroundColor White

Write-Host "`n✅ DIAGNÓSTICO CONCLUÍDO!" -ForegroundColor Green
