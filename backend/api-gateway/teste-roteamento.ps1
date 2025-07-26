# Teste especifico de roteamento Railway
Write-Host "Analisando problema de roteamento Railway..." -ForegroundColor Cyan

# TESTE 1: Diferentes User-Agents
Write-Host "`nTESTE 1: Diferentes User-Agents" -ForegroundColor Yellow
$userAgents = @(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "TradingView-Webhook/1.0",
    "curl/7.68.0",
    "PostmanRuntime/7.29.0"
)

foreach ($ua in $userAgents) {
    try {
        $headers = @{"User-Agent" = $ua}
        $response = Invoke-WebRequest -Uri "https://coinbitclub-market-bot-backend-production.up.railway.app/" -Headers $headers -TimeoutSec 5
        Write-Host "UA: $ua - Status: $($response.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "UA: $ua - Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

# TESTE 2: Diferentes ports e protocolos
Write-Host "`nTESTE 2: Testar diferentes portas" -ForegroundColor Yellow
$ports = @(80, 443, 3000, 8080)
$ip = "35.212.94.98"

foreach ($port in $ports) {
    try {
        $tcpTest = Test-NetConnection -ComputerName $ip -Port $port -WarningAction SilentlyContinue
        Write-Host "IP:$ip Port:$port - TCP: $($tcpTest.TcpTestSucceeded)" -ForegroundColor $(if($tcpTest.TcpTestSucceeded){"Green"}else{"Red"})
    } catch {
        Write-Host "IP:$ip Port:$port - Erro: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# TESTE 3: Verificar subdominios Railway
Write-Host "`nTESTE 3: Testar subdominios Railway similares" -ForegroundColor Yellow
$subdomains = @(
    "coinbitclub-market-bot-backend-production.up.railway.app",
    "coinbitclub-market-bot-production.up.railway.app",
    "market-bot-backend-production.up.railway.app"
)

foreach ($subdomain in $subdomains) {
    try {
        $dns = Resolve-DnsName -Name $subdomain -ErrorAction Stop
        Write-Host "$subdomain - DNS OK: $($dns[0].IPAddress)" -ForegroundColor Green
        
        # Testar HTTP
        try {
            $http = Invoke-WebRequest -Uri "https://$subdomain/" -TimeoutSec 5
            Write-Host "$subdomain - HTTP: $($http.StatusCode)" -ForegroundColor Green
        } catch {
            Write-Host "$subdomain - HTTP: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        }
    } catch {
        Write-Host "$subdomain - DNS FALHOU" -ForegroundColor Yellow
    }
}

# TESTE 4: Teste com curl simulado
Write-Host "`nTESTE 4: Simulando requisicao TradingView real" -ForegroundColor Yellow

$tradingViewPayload = @{
    action = "BUY"
    symbol = "BTCUSDT"
    price = 67500
    volume = 1.0
    timestamp = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
} | ConvertTo-Json

try {
    $headers = @{
        "Content-Type" = "application/json"
        "User-Agent" = "TradingView-Webhook"
        "Accept" = "application/json"
        "Cache-Control" = "no-cache"
    }
    
    $response = Invoke-RestMethod -Uri "https://coinbitclub-market-bot-backend-production.up.railway.app/webhook/signal1" -Method POST -Body $tradingViewPayload -Headers $headers -TimeoutSec 10
    Write-Host "TradingView simulado - SUCESSO!" -ForegroundColor Green
    $response | ConvertTo-Json
} catch {
    Write-Host "TradingView simulado - ERRO: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

# TESTE 5: Verificar se Railway tem problema de cold start
Write-Host "`nTESTE 5: Teste de Cold Start" -ForegroundColor Yellow
Write-Host "Fazendo multiplas requisicoes para verificar cold start..." -ForegroundColor Cyan

for ($i = 1; $i -le 5; $i++) {
    $startTime = Get-Date
    try {
        $response = Invoke-WebRequest -Uri "https://coinbitclub-market-bot-backend-production.up.railway.app/" -TimeoutSec 10
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalMilliseconds
        Write-Host "Tentativa $i - Status: $($response.StatusCode) - Tempo: $([math]::Round($duration))ms" -ForegroundColor Green
    } catch {
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalMilliseconds
        Write-Host "Tentativa $i - Status: $($_.Exception.Response.StatusCode) - Tempo: $([math]::Round($duration))ms" -ForegroundColor Red
    }
    Start-Sleep -Seconds 2
}

Write-Host "`nRESUMO DO DIAGNOSTICO:" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host "1. TCP conecta normalmente na porta 443" -ForegroundColor White
Write-Host "2. HTTP retorna 404 consistentemente" -ForegroundColor White
Write-Host "3. DNS resolve para IP valido" -ForegroundColor White
Write-Host "4. Problema: Railway nao esta roteando para aplicacao" -ForegroundColor Red
Write-Host "" -ForegroundColor White
Write-Host "ACOES NECESSARIAS:" -ForegroundColor Yellow
Write-Host "- Verificar configuracao de dominio no painel Railway" -ForegroundColor White
Write-Host "- Recriar servico Railway se necessario" -ForegroundColor White
Write-Host "- Verificar se aplicacao esta realmente deployada" -ForegroundColor White
