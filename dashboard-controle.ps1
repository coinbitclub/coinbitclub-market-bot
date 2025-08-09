# Dashboard de Controle - CoinBitClub Market Bot
# Monitor simplificado para operadores

Clear-Host

Write-Host "
==================================================================
    COINBITCLUB MARKET BOT - DASHBOARD DE CONTROLE OPERACIONAL    
                          Status: ATIVO                           
==================================================================
" -ForegroundColor Green

# Verificar todos os serviços
function Test-AllServices {
    $services = @()
    
    # Frontend
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
        $services += @{ Name = "Frontend"; Port = 3000; Status = "ONLINE"; Color = "Green" }
    } catch {
        $services += @{ Name = "Frontend"; Port = 3000; Status = "OFFLINE"; Color = "Red" }
    }
    
    # API Gateway
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8081/health" -Method GET -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
        $services += @{ Name = "API Gateway"; Port = 8081; Status = "ONLINE"; Color = "Green" }
    } catch {
        $services += @{ Name = "API Gateway"; Port = 8081; Status = "OFFLINE"; Color = "Red" }
    }
    
    # Admin Panel
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8082/health" -Method GET -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
        $services += @{ Name = "Admin Panel"; Port = 8082; Status = "ONLINE"; Color = "Green" }
    } catch {
        $services += @{ Name = "Admin Panel"; Port = 8082; Status = "OFFLINE"; Color = "Red" }
    }
    
    # Railway Backend
    try {
        $response = Invoke-WebRequest -Uri "https://coinbitclub-market-bot-production.up.railway.app/health" -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        $services += @{ Name = "Railway Backend"; Port = "Cloud"; Status = "ONLINE"; Color = "Green" }
    } catch {
        $services += @{ Name = "Railway Backend"; Port = "Cloud"; Status = "OFFLINE"; Color = "Red" }
    }
    
    return $services
}

Write-Host "VERIFICANDO STATUS DOS SERVICOS..." -ForegroundColor Yellow

$services = Test-AllServices

Write-Host "`nSTATUS DOS SERVICOS PRINCIPAIS:" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan

foreach ($service in $services) {
    $icon = if ($service.Status -eq "ONLINE") { "[OK]" } else { "[ERRO]" }
    Write-Host "$icon $($service.Name.PadRight(20)) | Porta: $($service.Port.ToString().PadLeft(5)) | " -NoNewline
    Write-Host "$($service.Status)" -ForegroundColor $service.Color
}

# Contagem de processos Node.js
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
$nodeCount = if ($nodeProcesses) { $nodeProcesses.Count } else { 0 }

Write-Host "`nMETRICAS OPERACIONAIS:" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host "Processos Node.js ativos: $nodeCount" -ForegroundColor $(if ($nodeCount -gt 0) { "Green" } else { "Red" })

# Sistema
$cpu = Get-WmiObject -Class Win32_Processor | Measure-Object -Property LoadPercentage -Average
$memory = Get-WmiObject -Class Win32_OperatingSystem
$memoryUsage = [math]::Round(((($memory.TotalVisibleMemorySize - $memory.FreePhysicalMemory) / $memory.TotalVisibleMemorySize) * 100), 2)

Write-Host "CPU: $([math]::Round($cpu.Average, 2))%" -ForegroundColor $(if ($cpu.Average -lt 80) { "Green" } else { "Red" })
Write-Host "Memoria: $memoryUsage%" -ForegroundColor $(if ($memoryUsage -lt 80) { "Green" } else { "Red" })

Write-Host "`nACESSOS RAPIDOS:" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan
Write-Host "• Frontend (Usuario):    http://localhost:3000" -ForegroundColor White
Write-Host "• Dashboard Admin:       http://localhost:3000/admin" -ForegroundColor White
Write-Host "• Admin Panel:           http://localhost:8082" -ForegroundColor White
Write-Host "• API Gateway:           http://localhost:8081" -ForegroundColor White
Write-Host "• Health Check API:      http://localhost:8081/health" -ForegroundColor White
Write-Host "• Railway Backend:       https://coinbitclub-market-bot-production.up.railway.app" -ForegroundColor White

Write-Host "`nOPERACAO:" -ForegroundColor Yellow
Write-Host "==========" -ForegroundColor Yellow

$onlineServices = ($services | Where-Object { $_.Status -eq "ONLINE" }).Count
$totalServices = $services.Count

if ($onlineServices -eq $totalServices) {
    Write-Host "SISTEMA TOTALMENTE OPERACIONAL" -ForegroundColor Green
    Write-Host "Todos os $totalServices servicos estao funcionando normalmente" -ForegroundColor Green
} elseif ($onlineServices -gt 0) {
    Write-Host "SISTEMA PARCIALMENTE OPERACIONAL" -ForegroundColor Yellow
    Write-Host "$onlineServices de $totalServices servicos funcionando" -ForegroundColor Yellow
} else {
    Write-Host "SISTEMA OFFLINE" -ForegroundColor Red
    Write-Host "Nenhum servico esta respondendo" -ForegroundColor Red
}

Write-Host "`nTIMESTAMP: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor Gray

Write-Host "`n==================================================================`n" -ForegroundColor Green
