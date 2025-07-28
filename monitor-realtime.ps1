# Monitor de Operações em Tempo Real - CoinBitClub Market Bot
# Desenvolvido para acompanhamento completo do sistema

param(
    [switch]$Compact,
    [int]$RefreshInterval = 5
)

Clear-Host

Write-Host "
╔══════════════════════════════════════════════════════════════════╗
║             🚀 COINBITCLUB MARKET BOT - MONITOR REAL TIME        ║
║                        🔄 Sistema Operacional                   ║
╚══════════════════════════════════════════════════════════════════╝
" -ForegroundColor Cyan

# URLs dos serviços
$API_GATEWAY = "http://localhost:8081"
$ADMIN_PANEL = "http://localhost:8082"  
$FRONTEND = "http://localhost:3000"
$RAILWAY_BACKEND = "https://coinbitclub-market-bot-production.up.railway.app"

# Função para verificar status de serviço
function Test-ServiceStatus {
    param(
        [string]$Url,
        [string]$ServiceName,
        [int]$TimeoutSec = 5
    )
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec $TimeoutSec -UseBasicParsing -ErrorAction Stop
        return @{
            Status = "ONLINE"
            StatusCode = $response.StatusCode
            ResponseTime = $response.Headers.'X-Response-Time'
            Color = "Green"
            Icon = "✅"
        }
    }
    catch {
        $errorMsg = $_.Exception.Message
        if ($errorMsg -like "*502*") {
            return @{ Status = "502 BAD GATEWAY"; StatusCode = 502; Color = "Red"; Icon = "❌" }
        }
        elseif ($errorMsg -like "*timeout*") {
            return @{ Status = "TIMEOUT"; StatusCode = "TIMEOUT"; Color = "Yellow"; Icon = "⏱️" }
        }
        elseif ($errorMsg -like "*refused*") {
            return @{ Status = "OFFLINE"; StatusCode = "REFUSED"; Color = "Red"; Icon = "🔴" }
        }
        else {
            return @{ Status = "ERROR"; StatusCode = "ERROR"; Color = "Red"; Icon = "⚠️" }
        }
    }
}

# Função para verificar processos Node.js
function Get-NodeProcesses {
    try {
        $nodeProcesses = Get-Process node -ErrorAction SilentlyContinue | Select-Object Id, ProcessName, CPU, WorkingSet, StartTime
        return $nodeProcesses
    }
    catch {
        return @()
    }
}

# Função para verificar portas
function Test-Ports {
    $ports = @(3000, 8081, 8082)
    $results = @()
    
    foreach ($port in $ports) {
        try {
            $connection = Test-NetConnection -ComputerName "localhost" -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue
            $results += @{
                Port = $port
                Status = if ($connection) { "LISTENING" } else { "CLOSED" }
                Color = if ($connection) { "Green" } else { "Red" }
                Icon = if ($connection) { "🟢" } else { "🔴" }
            }
        }
        catch {
            $results += @{ Port = $port; Status = "ERROR"; Color = "Red"; Icon = "⚠️" }
        }
    }
    
    return $results
}

# Função para obter métricas do sistema
function Get-SystemMetrics {
    $cpu = Get-WmiObject -Class Win32_Processor | Measure-Object -Property LoadPercentage -Average
    $memory = Get-WmiObject -Class Win32_OperatingSystem
    $memoryUsage = [math]::Round(((($memory.TotalVisibleMemorySize - $memory.FreePhysicalMemory) / $memory.TotalVisibleMemorySize) * 100), 2)
    
    return @{
        CPU = [math]::Round($cpu.Average, 2)
        Memory = $memoryUsage
        TotalRAM = [math]::Round($memory.TotalVisibleMemorySize / 1MB, 2)
        FreeRAM = [math]::Round($memory.FreePhysicalMemory / 1MB, 2)
    }
}

# Função para verificar logs recentes
function Get-RecentActivity {
    $activities = @()
    
    # Simular verificação de logs (em produção, isto viria do banco ou logs reais)
    $currentTime = Get-Date
    
    $activities += @{
        Time = $currentTime.AddSeconds(-30).ToString("HH:mm:ss")
        Event = "Sistema iniciado"
        Status = "INFO"
        Service = "Monitor"
    }
    
    $activities += @{
        Time = $currentTime.AddSeconds(-15).ToString("HH:mm:ss") 
        Event = "Health check executado"
        Status = "SUCCESS"
        Service = "API Gateway"
    }
    
    $activities += @{
        Time = $currentTime.ToString("HH:mm:ss")
        Event = "Monitoramento ativo"
        Status = "RUNNING"
        Service = "Monitor"
    }
    
    return $activities
}

# Loop principal de monitoramento
while ($true) {
    $currentTime = Get-Date
    
    Clear-Host
    
    Write-Host "
╔══════════════════════════════════════════════════════════════════╗
║             🚀 COINBITCLUB MARKET BOT - MONITOR REAL TIME        ║
║                    📊 Status: $($currentTime.ToString('dd/MM/yyyy HH:mm:ss'))                    ║
╚══════════════════════════════════════════════════════════════════╝
" -ForegroundColor Cyan

    # ===== STATUS DOS SERVIÇOS =====
    Write-Host "📡 STATUS DOS SERVIÇOS" -ForegroundColor Yellow
    Write-Host "═══════════════════════" -ForegroundColor Yellow
    
    $services = @(
        @{ Name = "API Gateway"; Url = "$API_GATEWAY/health"; Port = "8081" }
        @{ Name = "Admin Panel"; Url = "$ADMIN_PANEL/health"; Port = "8082" }
        @{ Name = "Frontend"; Url = "$FRONTEND"; Port = "3000" }
        @{ Name = "Railway Backend"; Url = "$RAILWAY_BACKEND/health"; Port = "Railway" }
    )
    
    foreach ($service in $services) {
        $status = Test-ServiceStatus -Url $service.Url -ServiceName $service.Name
        Write-Host "$($status.Icon) $($service.Name.PadRight(15)) | $($service.Port.PadRight(8)) | " -NoNewline
        Write-Host "$($status.Status)" -ForegroundColor $status.Color
    }
    
    # ===== STATUS DAS PORTAS =====
    Write-Host "`n🔌 STATUS DAS PORTAS" -ForegroundColor Yellow
    Write-Host "═══════════════════════" -ForegroundColor Yellow
    
    $portStatus = Test-Ports
    foreach ($port in $portStatus) {
        Write-Host "$($port.Icon) Porta $($port.Port.ToString().PadRight(5)) | " -NoNewline
        Write-Host "$($port.Status)" -ForegroundColor $port.Color
    }
    
    # ===== PROCESSOS NODE.JS =====
    Write-Host "`n⚙️  PROCESSOS NODE.JS ATIVOS" -ForegroundColor Yellow
    Write-Host "════════════════════════════" -ForegroundColor Yellow
    
    $nodeProcesses = Get-NodeProcesses
    if ($nodeProcesses.Count -gt 0) {
        foreach ($process in $nodeProcesses) {
            $memoryMB = [math]::Round($process.WorkingSet / 1MB, 2)
            $runtime = if ($process.StartTime) { 
                $span = $currentTime - $process.StartTime
                "$($span.Hours.ToString().PadLeft(2,'0')):$($span.Minutes.ToString().PadLeft(2,'0')):$($span.Seconds.ToString().PadLeft(2,'0'))"
            } else { "N/A" }
            
            Write-Host "🟢 PID: $($process.Id.ToString().PadRight(6)) | Memória: $($memoryMB.ToString().PadLeft(6)) MB | Runtime: $runtime" -ForegroundColor Green
        }
    } else {
        Write-Host "🔴 Nenhum processo Node.js encontrado" -ForegroundColor Red
    }
    
    # ===== MÉTRICAS DO SISTEMA =====
    Write-Host "`n📊 MÉTRICAS DO SISTEMA" -ForegroundColor Yellow
    Write-Host "══════════════════════" -ForegroundColor Yellow
    
    $metrics = Get-SystemMetrics
    Write-Host "🖥️  CPU: $($metrics.CPU)%" -ForegroundColor $(if ($metrics.CPU -lt 70) { "Green" } elseif ($metrics.CPU -lt 90) { "Yellow" } else { "Red" })
    Write-Host "🧠 RAM: $($metrics.Memory)% ($($metrics.FreeRAM) MB livres de $($metrics.TotalRAM) MB)" -ForegroundColor $(if ($metrics.Memory -lt 70) { "Green" } elseif ($metrics.Memory -lt 90) { "Yellow" } else { "Red" })
    
    # ===== ATIVIDADE RECENTE =====
    Write-Host "`n📝 ATIVIDADE RECENTE" -ForegroundColor Yellow
    Write-Host "═══════════════════════" -ForegroundColor Yellow
    
    $activities = Get-RecentActivity
    foreach ($activity in $activities) {
        $color = switch ($activity.Status) {
            "SUCCESS" { "Green" }
            "INFO" { "Cyan" }
            "RUNNING" { "Yellow" }
            "ERROR" { "Red" }
            default { "White" }
        }
        Write-Host "[$($activity.Time)] $($activity.Service.PadRight(12)) | $($activity.Event)" -ForegroundColor $color
    }
    
    # ===== CONTROLES =====
    Write-Host "`n🎮 CONTROLES DISPONÍVEIS" -ForegroundColor Yellow
    Write-Host "═══════════════════════════" -ForegroundColor Yellow
    Write-Host "• CTRL+C para sair do monitor" -ForegroundColor Gray
    Write-Host "• Atualização automática a cada $RefreshInterval segundos" -ForegroundColor Gray
    
    # ===== URLs DE ACESSO =====
    Write-Host "`n🌐 ACESSO AOS SERVIÇOS" -ForegroundColor Yellow  
    Write-Host "═════════════════════════" -ForegroundColor Yellow
    Write-Host "• Frontend:     http://localhost:3000" -ForegroundColor Cyan
    Write-Host "• Admin Panel:  http://localhost:8082" -ForegroundColor Cyan
    Write-Host "• API Gateway:  http://localhost:8081" -ForegroundColor Cyan
    Write-Host "• Railway:      https://coinbitclub-market-bot-production.up.railway.app" -ForegroundColor Cyan
    
    Write-Host "`n⏱️ Próxima atualização em $RefreshInterval segundos..." -ForegroundColor Gray
    
    # Aguardar antes da próxima atualização
    Start-Sleep -Seconds $RefreshInterval
}
