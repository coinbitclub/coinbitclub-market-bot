# Script de diagnóstico simples
Write-Host "=== DIAGNOSTICO DO SISTEMA ===" -ForegroundColor Cyan
Write-Host ""

# Verificar se os serviços locais estão rodando
Write-Host "1. Verificando servicos locais..." -ForegroundColor Yellow

# Frontend
Write-Host "Frontend (localhost:3000): " -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 3
    Write-Host "OK ($($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "OFFLINE" -ForegroundColor Red
}

# API Gateway
Write-Host "API Gateway (localhost:8081): " -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081" -UseBasicParsing -TimeoutSec 3
    Write-Host "OK ($($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "OFFLINE" -ForegroundColor Red
}

# Admin Panel
Write-Host "Admin Panel (localhost:8082): " -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8082" -UseBasicParsing -TimeoutSec 3
    Write-Host "OK ($($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "OFFLINE" -ForegroundColor Red
}

Write-Host ""
Write-Host "2. Verificando processos Node.js..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Processos Node.js encontrados: $($nodeProcesses.Count)" -ForegroundColor Green
    foreach ($process in $nodeProcesses) {
        Write-Host "  PID: $($process.Id) - CPU: $($process.CPU)" -ForegroundColor White
    }
} else {
    Write-Host "Nenhum processo Node.js encontrado" -ForegroundColor Red
}

Write-Host ""
Write-Host "3. Verificando estrutura de arquivos..." -ForegroundColor Yellow

if (Test-Path "package.json") {
    Write-Host "package.json: OK" -ForegroundColor Green
} else {
    Write-Host "package.json: NAO ENCONTRADO" -ForegroundColor Red
}

if (Test-Path "coinbitclub-frontend-premium") {
    Write-Host "Frontend directory: OK" -ForegroundColor Green
} else {
    Write-Host "Frontend directory: NAO ENCONTRADO" -ForegroundColor Red
}

if (Test-Path "backend") {
    Write-Host "Backend directory: OK" -ForegroundColor Green
} else {
    Write-Host "Backend directory: NAO ENCONTRADO" -ForegroundColor Red
}

Write-Host ""
Write-Host "4. Verificando git status..." -ForegroundColor Yellow
try {
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-Host "Arquivos modificados: $($gitStatus.Count) arquivos" -ForegroundColor Yellow
    } else {
        Write-Host "Working directory limpo" -ForegroundColor Green
    }
} catch {
    Write-Host "Git nao disponivel ou erro" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== DIAGNOSTICO COMPLETO ===" -ForegroundColor Cyan
