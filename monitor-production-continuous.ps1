# 📊 MONITOR DE PRODUÇÃO CONTÍNUO
# Monitora a saúde do sistema em produção em tempo real

param(
    [string]$FrontendUrl = "",
    [string]$BackendUrl = "",
    [int]$IntervalSeconds = 60,
    [switch]$AlertsEnabled = $false,
    [string]$LogFile = "production-monitor.log"
)

$ErrorActionPreference = "Continue"

# Cores para output
$Colors = @{
    Success = "Green"
    Warning = "Yellow"
    Error = "Red"
    Info = "Cyan"
    Neutral = "White"
}

function Write-ColoredOutput {
    param(
        [string]$Message,
        [string]$Color = "White",
        [switch]$NoNewline
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $Message"
    
    # Escrever no console
    if ($NoNewline) {
        Write-Host $logMessage -ForegroundColor $Color -NoNewline
    } else {
        Write-Host $logMessage -ForegroundColor $Color
    }
    
    # Escrever no log
    Add-Content -Path $LogFile -Value $logMessage -ErrorAction SilentlyContinue
}

function Test-ServiceHealth {
    param(
        [string]$Url,
        [string]$ServiceName,
        [int]$TimeoutSeconds = 10
    )
    
    try {
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec $TimeoutSeconds -UseBasicParsing
        
        $result = @{
            ServiceName = $ServiceName
            Status = "HEALTHY"
            StatusCode = $response.StatusCode
            ResponseTime = $response.ResponseLength
            Error = $null
            Timestamp = Get-Date
        }
        
        return $result
    }
    catch {
        $result = @{
            ServiceName = $ServiceName
            Status = "UNHEALTHY"
            StatusCode = $null
            ResponseTime = $null
            Error = $_.Exception.Message
            Timestamp = Get-Date
        }
        
        return $result
    }
}

function Send-Alert {
    param(
        [string]$Service,
        [string]$Status,
        [string]$Error = ""
    )
    
    if ($AlertsEnabled) {
        $alertMessage = "🚨 ALERTA DE PRODUÇÃO: $Service está $Status"
        if ($Error) {
            $alertMessage += " - Erro: $Error"
        }
        
        Write-ColoredOutput $alertMessage $Colors.Error
        
        # Aqui você pode adicionar integração com:
        # - Slack
        # - Discord
        # - Email
        # - SMS
        # - Webhook personalizado
        
        # Exemplo de webhook (descomente e configure):
        # try {
        #     $webhookUrl = "YOUR_WEBHOOK_URL_HERE"
        #     $payload = @{
        #         text = $alertMessage
        #         username = "CoinBitClub Monitor"
        #         icon_emoji = ":warning:"
        #     } | ConvertTo-Json
        #     
        #     Invoke-RestMethod -Uri $webhookUrl -Method Post -Body $payload -ContentType "application/json"
        # }
        # catch {
        #     Write-ColoredOutput "Erro ao enviar alerta: $($_.Exception.Message)" $Colors.Error
        # }
    }
}

function Show-MonitoringDashboard {
    param(
        [object]$FrontendHealth,
        [object]$BackendHealth,
        [object]$Stats
    )
    
    Clear-Host
    
    Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor $Colors.Info
    Write-Host "║                 🚀 COINBITCLUB PRODUCTION MONITOR               ║" -ForegroundColor $Colors.Info
    Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor $Colors.Info
    Write-Host ""
    
    # Status dos Serviços
    Write-Host "📊 STATUS DOS SERVIÇOS" -ForegroundColor $Colors.Info
    Write-Host "────────────────────────" -ForegroundColor $Colors.Info
    
    # Frontend Status
    $frontendColor = if ($FrontendHealth.Status -eq "HEALTHY") { $Colors.Success } else { $Colors.Error }
    $frontendIcon = if ($FrontendHealth.Status -eq "HEALTHY") { "✅" } else { "❌" }
    Write-Host "$frontendIcon Frontend: $($FrontendHealth.Status)" -ForegroundColor $frontendColor
    if ($FrontendHealth.StatusCode) {
        Write-Host "   └─ Status Code: $($FrontendHealth.StatusCode)" -ForegroundColor $Colors.Neutral
    }
    if ($FrontendHealth.Error) {
        Write-Host "   └─ Erro: $($FrontendHealth.Error)" -ForegroundColor $Colors.Error
    }
    
    # Backend Status
    $backendColor = if ($BackendHealth.Status -eq "HEALTHY") { $Colors.Success } else { $Colors.Error }
    $backendIcon = if ($BackendHealth.Status -eq "HEALTHY") { "✅" } else { "❌" }
    Write-Host "$backendIcon Backend: $($BackendHealth.Status)" -ForegroundColor $backendColor
    if ($BackendHealth.StatusCode) {
        Write-Host "   └─ Status Code: $($BackendHealth.StatusCode)" -ForegroundColor $Colors.Neutral
    }
    if ($BackendHealth.Error) {
        Write-Host "   └─ Erro: $($BackendHealth.Error)" -ForegroundColor $Colors.Error
    }
    
    Write-Host ""
    
    # Estatísticas
    Write-Host "📈 ESTATÍSTICAS" -ForegroundColor $Colors.Info
    Write-Host "──────────────────" -ForegroundColor $Colors.Info
    Write-Host "⏰ Tempo de execução: $($Stats.Uptime)" -ForegroundColor $Colors.Neutral
    Write-Host "🔄 Verificações realizadas: $($Stats.TotalChecks)" -ForegroundColor $Colors.Neutral
    Write-Host "✅ Sucessos: $($Stats.SuccessCount)" -ForegroundColor $Colors.Success
    Write-Host "❌ Falhas: $($Stats.FailureCount)" -ForegroundColor $Colors.Error
    
    if ($Stats.TotalChecks -gt 0) {
        $successRate = [math]::Round(($Stats.SuccessCount / $Stats.TotalChecks) * 100, 2)
        $successColor = if ($successRate -ge 95) { $Colors.Success } elseif ($successRate -ge 90) { $Colors.Warning } else { $Colors.Error }
        Write-Host "📊 Taxa de sucesso: $successRate%" -ForegroundColor $successColor
    }
    
    Write-Host ""
    
    # Configuração
    Write-Host "⚙️ CONFIGURAÇÃO" -ForegroundColor $Colors.Info
    Write-Host "─────────────────" -ForegroundColor $Colors.Info
    Write-Host "🌐 Frontend URL: $FrontendUrl" -ForegroundColor $Colors.Neutral
    Write-Host "🖥️ Backend URL: $BackendUrl" -ForegroundColor $Colors.Neutral
    Write-Host "⏱️ Intervalo: $IntervalSeconds segundos" -ForegroundColor $Colors.Neutral
    Write-Host "🚨 Alertas: $(if ($AlertsEnabled) { 'Habilitados' } else { 'Desabilitados' })" -ForegroundColor $Colors.Neutral
    Write-Host "📝 Log: $LogFile" -ForegroundColor $Colors.Neutral
    
    Write-Host ""
    Write-Host "💡 Pressione Ctrl+C para parar o monitoramento" -ForegroundColor $Colors.Warning
    Write-Host ""
}

function Start-ProductionMonitoring {
    Write-ColoredOutput "🚀 Iniciando monitoramento de produção..." $Colors.Info
    Write-ColoredOutput "Frontend: $FrontendUrl" $Colors.Info
    Write-ColoredOutput "Backend: $BackendUrl" $Colors.Info
    Write-ColoredOutput "Intervalo: $IntervalSeconds segundos" $Colors.Info
    Write-ColoredOutput "Log: $LogFile" $Colors.Info
    
    $stats = @{
        StartTime = Get-Date
        TotalChecks = 0
        SuccessCount = 0
        FailureCount = 0
        Uptime = "0m"
    }
    
    $previousFrontendStatus = ""
    $previousBackendStatus = ""
    
    while ($true) {
        try {
            # Verificar Frontend
            $frontendHealth = Test-ServiceHealth -Url $FrontendUrl -ServiceName "Frontend"
            
            # Verificar Backend
            $backendHealthUrl = if ($BackendUrl.EndsWith('/')) { "$BackendUrl" + "health" } else { "$BackendUrl/health" }
            $backendHealth = Test-ServiceHealth -Url $backendHealthUrl -ServiceName "Backend"
            
            # Atualizar estatísticas
            $stats.TotalChecks++
            
            if ($frontendHealth.Status -eq "HEALTHY") {
                $stats.SuccessCount++
            } else {
                $stats.FailureCount++
            }
            
            if ($backendHealth.Status -eq "HEALTHY") {
                $stats.SuccessCount++
            } else {
                $stats.FailureCount++
            }
            
            # Calcular uptime
            $uptime = New-TimeSpan -Start $stats.StartTime -End (Get-Date)
            $stats.Uptime = if ($uptime.Days -gt 0) {
                "$($uptime.Days)d $($uptime.Hours)h $($uptime.Minutes)m"
            } elseif ($uptime.Hours -gt 0) {
                "$($uptime.Hours)h $($uptime.Minutes)m"
            } else {
                "$($uptime.Minutes)m"
            }
            
            # Verificar mudanças de status e enviar alertas
            if ($frontendHealth.Status -ne $previousFrontendStatus -and $previousFrontendStatus -ne "") {
                if ($frontendHealth.Status -eq "UNHEALTHY") {
                    Send-Alert -Service "Frontend" -Status "UNHEALTHY" -Error $frontendHealth.Error
                } elseif ($frontendHealth.Status -eq "HEALTHY") {
                    Write-ColoredOutput "✅ Frontend recuperado!" $Colors.Success
                }
            }
            
            if ($backendHealth.Status -ne $previousBackendStatus -and $previousBackendStatus -ne "") {
                if ($backendHealth.Status -eq "UNHEALTHY") {
                    Send-Alert -Service "Backend" -Status "UNHEALTHY" -Error $backendHealth.Error
                } elseif ($backendHealth.Status -eq "HEALTHY") {
                    Write-ColoredOutput "✅ Backend recuperado!" $Colors.Success
                }
            }
            
            $previousFrontendStatus = $frontendHealth.Status
            $previousBackendStatus = $backendHealth.Status
            
            # Mostrar dashboard
            Show-MonitoringDashboard -FrontendHealth $frontendHealth -BackendHealth $backendHealth -Stats $stats
            
            # Aguardar próxima verificação
            Start-Sleep -Seconds $IntervalSeconds
        }
        catch {
            Write-ColoredOutput "Erro no monitoramento: $($_.Exception.Message)" $Colors.Error
            Start-Sleep -Seconds 5
        }
    }
}

# Verificar parâmetros
if (!$FrontendUrl -or !$BackendUrl) {
    Write-Host "🔧 CONFIGURAÇÃO DO MONITOR DE PRODUÇÃO" -ForegroundColor $Colors.Info
    Write-Host "======================================" -ForegroundColor $Colors.Info
    Write-Host ""
    
    if (!$FrontendUrl) {
        $FrontendUrl = Read-Host "Digite a URL do Frontend (ex: https://coinbitclub.vercel.app)"
    }
    
    if (!$BackendUrl) {
        $BackendUrl = Read-Host "Digite a URL do Backend (ex: https://coinbitclub-backend.railway.app)"
    }
    
    Write-Host ""
    Write-Host "⚙️ Configuração opcional:" -ForegroundColor $Colors.Info
    $customInterval = Read-Host "Intervalo de verificação em segundos (padrão: 60)"
    if ($customInterval) {
        $IntervalSeconds = [int]$customInterval
    }
    
    $enableAlerts = Read-Host "Habilitar alertas? (s/N)"
    if ($enableAlerts -eq 's' -or $enableAlerts -eq 'S') {
        $AlertsEnabled = $true
    }
    
    Write-Host ""
}

# Validar URLs
if (!$FrontendUrl.StartsWith("http")) {
    Write-Host "❌ URL do Frontend inválida: $FrontendUrl" -ForegroundColor $Colors.Error
    exit 1
}

if (!$BackendUrl.StartsWith("http")) {
    Write-Host "❌ URL do Backend inválida: $BackendUrl" -ForegroundColor $Colors.Error
    exit 1
}

# Iniciar monitoramento
try {
    Start-ProductionMonitoring
}
catch {
    Write-ColoredOutput "❌ Erro crítico no monitoramento: $($_.Exception.Message)" $Colors.Error
    exit 1
}
