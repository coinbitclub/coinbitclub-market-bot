# 🚀 COINBITCLUB SYSTEM MANAGER - PowerShell
# Sistema de controle completo

param(
    [Parameter(Position=0)]
    [ValidateSet("ligar", "desligar", "reiniciar", "status", "dashboard", "logs", "quick")]
    [string]$Comando = "status"
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  🚀 COINBITCLUB SYSTEM MANAGER V4.0.0" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

switch ($Comando) {
    "ligar" {
        Write-Host "🔋 Ligando sistema completo..." -ForegroundColor Green
        node gestor-universal-sistema.js ligar
    }
    
    "desligar" {
        Write-Host "🔌 Desligando sistema..." -ForegroundColor Red
        node gestor-universal-sistema.js desligar
    }
    
    "reiniciar" {
        Write-Host "🔄 Reiniciando sistema..." -ForegroundColor Yellow
        node gestor-universal-sistema.js reiniciar
    }
    
    "status" {
        Write-Host "📊 Verificando status..." -ForegroundColor Blue
        node gestor-universal-sistema.js status
    }
    
    "dashboard" {
        Write-Host "📊 Abrindo dashboard..." -ForegroundColor Magenta
        Start-Process "http://localhost:3009"
    }
    
    "logs" {
        Write-Host "📜 URLs dos Serviços:" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 Dashboard:      http://localhost:3009" -ForegroundColor White
        Write-Host "💹 Trading:        http://localhost:3010" -ForegroundColor White  
        Write-Host "📡 Sinais:         http://localhost:9001" -ForegroundColor White
        Write-Host "⚠️  Risco:          http://localhost:3011" -ForegroundColor White
        Write-Host "🔧 Operações:      http://localhost:3012" -ForegroundColor White
        Write-Host "📈 Monitoramento:  http://localhost:3013" -ForegroundColor White
        Write-Host "📊 Indicadores:    http://localhost:3014" -ForegroundColor White
        Write-Host "🌐 WebSocket:      http://localhost:3015" -ForegroundColor White
    }
    
    "quick" {
        Write-Host "⚡ Inicializacao Rapida..." -ForegroundColor Yellow
        Write-Host ""
        
        # Ligar sistema
        Write-Host "1️⃣ Ligando todos os componentes..." -ForegroundColor Green
        node gestor-universal-sistema.js ligar
        
        Write-Host ""
        Write-Host "2️⃣ Aguardando estabilizacao..." -ForegroundColor Yellow
        Start-Sleep -Seconds 3
        
        # Verificar status
        Write-Host "3️⃣ Verificando status final..." -ForegroundColor Blue
        node gestor-universal-sistema.js status
        
        Write-Host ""
        Write-Host "4️⃣ Abrindo dashboard..." -ForegroundColor Magenta
        Start-Process "http://localhost:3009"
        
        Write-Host ""
        Write-Host "✅ Sistema pronto para uso!" -ForegroundColor Green
    }
    
    default {
        Write-Host "📋 Comandos disponíveis:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  .\system.ps1 status       - Verificar status" -ForegroundColor White
        Write-Host "  .\system.ps1 ligar        - Ligar sistema completo" -ForegroundColor White
        Write-Host "  .\system.ps1 desligar     - Desligar sistema" -ForegroundColor White
        Write-Host "  .\system.ps1 reiniciar    - Reiniciar sistema" -ForegroundColor White
        Write-Host "  .\system.ps1 dashboard    - Abrir dashboard" -ForegroundColor White
        Write-Host "  .\system.ps1 logs         - Ver URLs dos servicos" -ForegroundColor White
        Write-Host "  .\system.ps1 quick        - Inicializacao rapida completa" -ForegroundColor White
    }
}

Write-Host ""
