# Teste direto no IP do Railway
Write-Host "Testando IP direto do Railway..." -ForegroundColor Cyan

$IP = "35.212.94.98"
$PORT = "443"

# TESTE 1: Conectividade TCP no IP
Write-Host "`nTESTE 1: Conectividade TCP direta" -ForegroundColor Yellow
try {
    $tcpTest = Test-NetConnection -ComputerName $IP -Port $PORT
    Write-Host "TCP Test: $($tcpTest.TcpTestSucceeded)" -ForegroundColor Green
    Write-Host "Ping: $($tcpTest.PingSucceeded)" -ForegroundColor Green
} catch {
    Write-Host "Erro TCP: $($_.Exception.Message)" -ForegroundColor Red
}

# TESTE 2: Teste HTTP direto no IP
Write-Host "`nTESTE 2: HTTP direto no IP" -ForegroundColor Yellow
try {
    $headers = @{
        "Host" = "coinbitclub-market-bot-backend-production.up.railway.app"
        "User-Agent" = "PowerShell-Direct-Test"
    }
    $response = Invoke-WebRequest -Uri "https://$IP/" -Headers $headers -TimeoutSec 10
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Content: $($response.Content.Substring(0, [Math]::Min(200, $response.Content.Length)))" -ForegroundColor Gray
} catch {
    Write-Host "Erro HTTP direto: $($_.Exception.Message)" -ForegroundColor Red
}

# TESTE 3: Verificar se Railway esta realmente ativo
Write-Host "`nTESTE 3: Verificar servicos Railway" -ForegroundColor Yellow

# Testar outros dominios Railway para comparacao
$railwayDomains = @(
    "railway.app",
    "up.railway.app"
)

foreach ($domain in $railwayDomains) {
    Write-Host "Testando dominio base: $domain" -ForegroundColor Cyan
    try {
        $test = Test-NetConnection -ComputerName $domain -Port 443
        Write-Host "$domain - TCP: $($test.TcpTestSucceeded)" -ForegroundColor White
    } catch {
        Write-Host "$domain - Erro: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# TESTE 4: Verificar headers de erro detalhados
Write-Host "`nTESTE 4: Headers de erro detalhados" -ForegroundColor Yellow
try {
    $errorResponse = Invoke-WebRequest -Uri "https://coinbitclub-market-bot-backend-production.up.railway.app/" -ErrorAction Stop
} catch {
    Write-Host "Headers de erro:" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorResponse = $_.Exception.Response
        Write-Host "Status: $($errorResponse.StatusCode)" -ForegroundColor Red
        Write-Host "StatusDescription: $($errorResponse.StatusDescription)" -ForegroundColor Red
        
        # Tentar ler corpo do erro
        try {
            $stream = $errorResponse.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $errorBody = $reader.ReadToEnd()
            Write-Host "Error Body: $errorBody" -ForegroundColor Red
            $reader.Close()
            $stream.Close()
        } catch {
            Write-Host "Nao foi possivel ler corpo do erro" -ForegroundColor Red
        }
    }
}

# TESTE 5: Comparar com URL local (se estiver rodando)
Write-Host "`nTESTE 5: Comparar com servidor local" -ForegroundColor Yellow
try {
    $localResponse = Invoke-RestMethod -Uri "http://localhost:3003/" -TimeoutSec 5
    Write-Host "LOCAL FUNCIONANDO:" -ForegroundColor Green
    $localResponse | ConvertTo-Json
} catch {
    Write-Host "Local nao esta rodando: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`nAnalise concluida!" -ForegroundColor Green
Write-Host "`nCONCLUSAO:" -ForegroundColor Cyan
Write-Host "- IP Railway: $IP" -ForegroundColor White
Write-Host "- DNS resolve mas HTTP 404" -ForegroundColor White  
Write-Host "- Provavel problema: Configuracao Railway incorreta" -ForegroundColor White
Write-Host "- Solucao: Verificar/recriar servico Railway" -ForegroundColor White
