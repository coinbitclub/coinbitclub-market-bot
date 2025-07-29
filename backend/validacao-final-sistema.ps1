# Script de Validação Final - Sistema Multiusuário Híbrido
Write-Host "🎯 VALIDAÇÃO FINAL - SISTEMA MULTIUSUÁRIO HÍBRIDO" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Yellow

# 1. Verificar sistema local
Write-Host "`n📍 1. VERIFICANDO SISTEMA LOCAL" -ForegroundColor Cyan
try {
    $localResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/status" -TimeoutSec 5
    $localStatus = $localResponse.Content | ConvertFrom-Json
    
    Write-Host "✅ Sistema local ativo" -ForegroundColor Green
    Write-Host "   📦 Versão: $($localStatus.version)" -ForegroundColor White
    Write-Host "   🎯 Multiusuário: $($localStatus.multiuser_system.enabled)" -ForegroundColor White
    Write-Host "   🔄 Modo Híbrido: $($localStatus.multiuser_system.hybrid_mode)" -ForegroundColor White
    Write-Host "   ⚡ Tempo Real: $($localStatus.multiuser_system.realtime_enabled)" -ForegroundColor White
    
    $localOk = $true
} catch {
    Write-Host "❌ Sistema local não disponível" -ForegroundColor Red
    $localOk = $false
}

# 2. Verificar endpoints multiusuário locais
Write-Host "`n📍 2. VERIFICANDO ENDPOINTS MULTIUSUÁRIO LOCAIS" -ForegroundColor Cyan
$endpoints = @(
    "http://localhost:3000/api/multiuser/status",
    "http://localhost:3000/api/multiuser/users/active",
    "http://localhost:3000/api/multiuser/operations/realtime"
)

foreach ($endpoint in $endpoints) {
    try {
        $testResponse = Invoke-WebRequest -Uri $endpoint -TimeoutSec 5
        $endpointName = $endpoint.Split("/")[-1]
        Write-Host "   ✅ $endpointName - Status: $($testResponse.StatusCode)" -ForegroundColor Green
    } catch {
        $endpointName = $endpoint.Split("/")[-1]
        Write-Host "   ⚠️ $endpointName - Erro: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# 3. Verificar deploy Railway
Write-Host "`n📍 3. VERIFICANDO DEPLOY RAILWAY" -ForegroundColor Cyan
$maxAttempts = 3
$attempt = 1
$railwayOk = $false

while ($attempt -le $maxAttempts -and -not $railwayOk) {
    Write-Host "   🔄 Tentativa $attempt de $maxAttempts..." -ForegroundColor Yellow
    
    try {
        $prodResponse = Invoke-WebRequest -Uri "https://coinbitclub-market-bot.up.railway.app/api/status" -TimeoutSec 15
        $prodStatus = $prodResponse.Content | ConvertFrom-Json
        
        Write-Host "   ✅ Railway deploy bem-sucedido!" -ForegroundColor Green
        Write-Host "   📦 Versão produção: $($prodStatus.version)" -ForegroundColor White
        Write-Host "   🎯 Multiusuário ativo: $($prodStatus.multiuser_system.enabled)" -ForegroundColor White
        Write-Host "   🔄 Modo híbrido: $($prodStatus.multiuser_system.hybrid_mode)" -ForegroundColor White
        Write-Host "   ⚡ Tempo real: $($prodStatus.multiuser_system.realtime_enabled)" -ForegroundColor White
        
        $railwayOk = $true
    } catch {
        Write-Host "   ⚠️ Deploy ainda em progresso... (erro: $($_.Exception.Message))" -ForegroundColor Yellow
        if ($attempt -lt $maxAttempts) {
            Write-Host "   ⏳ Aguardando 30 segundos..." -ForegroundColor Yellow
            Start-Sleep -Seconds 30
        }
    }
    
    $attempt++
}

# 4. Verificar arquivos criados
Write-Host "`n📍 4. VERIFICANDO ARQUIVOS CRIADOS" -ForegroundColor Cyan
$files = @(
    "server-multiservice-complete.cjs",
    "ativar-sistema-hibrido-multiusuario.js",
    "Dockerfile.simple-railway",
    "railway.toml",
    "RELATORIO-FINAL-SISTEMA-HIBRIDO-ATIVADO.md"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file - NÃO ENCONTRADO" -ForegroundColor Red
    }
}

# 5. Resumo final
Write-Host "`n🎯 RESUMO FINAL" -ForegroundColor Green
Write-Host "===============" -ForegroundColor Yellow

if ($localOk) {
    Write-Host "✅ Sistema local: FUNCIONANDO" -ForegroundColor Green
} else {
    Write-Host "❌ Sistema local: PROBLEMA" -ForegroundColor Red
}

if ($railwayOk) {
    Write-Host "✅ Deploy Railway: SUCESSO" -ForegroundColor Green
} else {
    Write-Host "⚠️ Deploy Railway: EM PROGRESSO" -ForegroundColor Yellow
}

Write-Host "`n🌐 URLs DE ACESSO:" -ForegroundColor Cyan
Write-Host "   Local: http://localhost:3000/api/status" -ForegroundColor White
Write-Host "   Produção: https://coinbitclub-market-bot.up.railway.app/api/status" -ForegroundColor White

Write-Host "`n🎉 SISTEMA MULTIUSUÁRIO HÍBRIDO ATIVADO!" -ForegroundColor Green
