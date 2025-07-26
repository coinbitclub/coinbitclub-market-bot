# Diagnostico Railway - PowerShell
Write-Host "Iniciando diagnostico Railway..." -ForegroundColor Cyan

$RAILWAY_URL = "https://coinbitclub-market-bot-backend-production.up.railway.app"

# TESTE 1: Conectividade basica
Write-Host "`nTESTE 1: Conectividade basica" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri $RAILWAY_URL -Method GET -TimeoutSec 10
    Write-Host "Sucesso - Response:" -ForegroundColor Green
    $response | ConvertTo-Json
} catch {
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "StatusCode: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

# TESTE 2: Endpoints especificos
Write-Host "`nTESTE 2: Endpoints especificos" -ForegroundColor Yellow
$endpoints = @("/", "/api/health", "/api/status")

foreach ($endpoint in $endpoints) {
    $url = $RAILWAY_URL + $endpoint
    Write-Host "Testando: $url" -ForegroundColor Cyan
    
    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 10
        Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "Content: $($response.Content.Substring(0, [Math]::Min(200, $response.Content.Length)))" -ForegroundColor Gray
    } catch {
        Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# TESTE 3: Webhook TradingView
Write-Host "`nTESTE 3: Webhook TradingView" -ForegroundColor Yellow

$webhookData = @{
    token = "coinbitclub_webhook_secret_2024"
    strategy = "PowerShell_Test"
    symbol = "BTCUSDT"
    action = "BUY"
    price = 67890.50
    timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    test_mode = $true
} | ConvertTo-Json

$webhookUrl = $RAILWAY_URL + "/api/webhooks/tradingview"
Write-Host "URL: $webhookUrl" -ForegroundColor Cyan

try {
    $headers = @{"Content-Type" = "application/json"}
    $response = Invoke-RestMethod -Uri $webhookUrl -Method POST -Body $webhookData -Headers $headers -TimeoutSec 15
    Write-Host "WEBHOOK SUCESSO!" -ForegroundColor Green
    $response | ConvertTo-Json
} catch {
    Write-Host "WEBHOOK ERRO: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "StatusCode: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

# TESTE 4: Webhook generico
Write-Host "`nTESTE 4: Webhook generico /webhook/signal1" -ForegroundColor Yellow

$genericData = @{
    strategy = "PowerShell_Generic"
    symbol = "ETHUSDT"
    action = "SELL"
    price = 3245.80
} | ConvertTo-Json

$genericUrl = $RAILWAY_URL + "/webhook/signal1"
Write-Host "URL: $genericUrl" -ForegroundColor Cyan

try {
    $headers = @{"Content-Type" = "application/json"}
    $response = Invoke-RestMethod -Uri $genericUrl -Method POST -Body $genericData -Headers $headers -TimeoutSec 15
    Write-Host "WEBHOOK GENERICO SUCESSO!" -ForegroundColor Green
    $response | ConvertTo-Json
} catch {
    Write-Host "WEBHOOK GENERICO ERRO: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "StatusCode: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

# TESTE 5: DNS
Write-Host "`nTESTE 5: DNS Resolution" -ForegroundColor Yellow
try {
    $dns = Resolve-DnsName -Name "coinbitclub-market-bot-backend-production.up.railway.app"
    Write-Host "DNS OK:" -ForegroundColor Green
    $dns | ForEach-Object { Write-Host "IP: $($_.IPAddress)" }
} catch {
    Write-Host "DNS ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nDiagnostico concluido!" -ForegroundColor Green
