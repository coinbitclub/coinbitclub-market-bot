# Script para verificar o deploy do Railway e corrigir problemas

Write-Host "VERIFICANDO DEPLOY RAILWAY..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# URLs para teste
$RAILWAY_URL = "https://coinbitclub-market-bot-production.up.railway.app"

# TESTE 1: Verificar Deploy Logs
Write-Host "`nVERIFICANDO STATUS DO DEPLOY" -ForegroundColor Yellow
Write-Host "-------------------------------" -ForegroundColor Yellow

# TESTE 2: Testar endpoints simples primeiro
$simpleEndpoints = @(
    "/",
    "/health",
    "/api/health"
)

foreach ($endpoint in $simpleEndpoints) {
    $fullUrl = $RAILWAY_URL + $endpoint
    Write-Host "`nTestando: $fullUrl" -ForegroundColor Cyan
    
    try {
        # Usar timeout maior para dar tempo do Railway responder
        $response = Invoke-WebRequest -Uri $fullUrl -Method GET -TimeoutSec 30 -ErrorAction Stop
        Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "Headers: $($response.Headers | ConvertTo-Json -Compress)" -ForegroundColor White
        
        if ($response.Content.Length -lt 1000) {
            Write-Host "Response Body:" -ForegroundColor White
            Write-Host $response.Content -ForegroundColor Gray
        } else {
            Write-Host "Response Body (primeiros 300 chars): $($response.Content.Substring(0, 300))..." -ForegroundColor Gray
        }
    } catch {
        Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
        
        # Tentar obter mais detalhes do erro
        if ($_.Exception.Response) {
            try {
                $errorStream = $_.Exception.Response.GetResponseStream()
                if ($errorStream) {
                    $reader = New-Object System.IO.StreamReader($errorStream)
                    $errorBody = $reader.ReadToEnd()
                    Write-Host "Error Details: $errorBody" -ForegroundColor Red
                    $reader.Close()
                    $errorStream.Close()
                }
            } catch {
                Write-Host "Erro adicional ao ler detalhes: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    }
    
    # Aguardar um pouco entre testes
    Start-Sleep -Seconds 2
}

# TESTE 3: Verificar conectividade TCP direta
Write-Host "`nTESTE DE CONECTIVIDADE TCP" -ForegroundColor Yellow
Write-Host "-----------------------------" -ForegroundColor Yellow

$railwayDomain = "coinbitclub-market-bot-production.up.railway.app"
try {
    $tcpTest = Test-NetConnection -ComputerName $railwayDomain -Port 443 -InformationLevel Detailed
    Write-Host "TCP Connection:" -ForegroundColor Green
    Write-Host "   Remote Address: $($tcpTest.RemoteAddress)" -ForegroundColor White
    Write-Host "   TCP Test Success: $($tcpTest.TcpTestSucceeded)" -ForegroundColor White
    Write-Host "   Ping Success: $($tcpTest.PingSucceeded)" -ForegroundColor White
    
    if ($tcpTest.TcpTestSucceeded) {
        Write-Host "Conexao TCP OK - problema pode ser no servidor interno" -ForegroundColor Green
    } else {
        Write-Host "Falha na conexao TCP" -ForegroundColor Red
    }
} catch {
    Write-Host "Erro no teste TCP: $($_.Exception.Message)" -ForegroundColor Red
}

# TESTE 4: Aguardar e testar novamente (às vezes Railway demora para responder)
Write-Host "`nAGUARDANDO 30 SEGUNDOS E TESTANDO NOVAMENTE..." -ForegroundColor Yellow
Write-Host "-----------------------------------------------" -ForegroundColor Yellow

Start-Sleep -Seconds 30

Write-Host "Tentativa apos aguardar..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$RAILWAY_URL/api/health" -Method GET -TimeoutSec 30 -ErrorAction Stop
    Write-Host "SUCESSO APOS AGUARDAR!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 2
} catch {
    Write-Host "Ainda com erro apos aguardar:" -ForegroundColor Red
    Write-Host "   StatusCode: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "   Message: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nVERIFICACAO CONCLUIDA" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
