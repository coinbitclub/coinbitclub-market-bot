# Script para corrigir e fazer redeploy no Railway
# Corrige os problemas identificados no diagnostico

Write-Host "=== CORRIGINDO PROBLEMAS RAILWAY ===" -ForegroundColor Cyan

# 1. Verificar se Railway CLI esta instalado
Write-Host "`n1. Verificando Railway CLI..." -ForegroundColor Yellow
try {
    $railwayVersion = railway --version
    Write-Host "Railway CLI encontrado: $railwayVersion" -ForegroundColor Green
} catch {
    Write-Host "Railway CLI nao encontrado. Instalando..." -ForegroundColor Red
    Write-Host "Execute: npm install -g @railway/cli" -ForegroundColor White
    Write-Host "Ou baixe de: https://railway.app/cli" -ForegroundColor White
    exit 1
}

# 2. Login no Railway (se necessario)
Write-Host "`n2. Verificando login Railway..." -ForegroundColor Yellow
try {
    $railwayWhoami = railway whoami
    Write-Host "Logado como: $railwayWhoami" -ForegroundColor Green
} catch {
    Write-Host "Nao logado no Railway. Fazendo login..." -ForegroundColor Yellow
    railway login
}

# 3. Listar projetos
Write-Host "`n3. Listando projetos Railway..." -ForegroundColor Yellow
railway projects

# 4. Fazer redeploy
Write-Host "`n4. Fazendo redeploy do projeto..." -ForegroundColor Yellow
Write-Host "IMPORTANTE: Certifique-se de estar no projeto correto!" -ForegroundColor Red
$confirmDeploy = Read-Host "Deseja fazer o redeploy? (y/N)"

if ($confirmDeploy -eq "y" -or $confirmDeploy -eq "Y") {
    Write-Host "Iniciando redeploy..." -ForegroundColor Green
    railway up --detach
    
    Write-Host "`n5. Verificando logs apos redeploy..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
    railway logs
    
    Write-Host "`n6. Testando endpoints apos redeploy..." -ForegroundColor Yellow
    Start-Sleep -Seconds 60
    
    # Teste rapido de conectividade
    try {
        $response = Invoke-RestMethod -Uri "https://coinbitclub-market-bot-production.up.railway.app/health" -Method GET -TimeoutSec 10
        Write-Host "Endpoint /health funcionando!" -ForegroundColor Green
        $response | ConvertTo-Json
    } catch {
        Write-Host "Endpoint /health ainda com problema:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
} else {
    Write-Host "Redeploy cancelado pelo usuario" -ForegroundColor Yellow
}

Write-Host "`n=== COMANDOS RAILWAY UTEIS ===" -ForegroundColor Cyan
Write-Host "railway login                    # Fazer login" -ForegroundColor White
Write-Host "railway projects                 # Listar projetos" -ForegroundColor White
Write-Host "railway link                     # Vincular projeto local" -ForegroundColor White
Write-Host "railway up                       # Deploy" -ForegroundColor White
Write-Host "railway logs                     # Ver logs" -ForegroundColor White
Write-Host "railway status                   # Ver status" -ForegroundColor White
Write-Host "railway open                     # Abrir no browser" -ForegroundColor White
Write-Host "railway variables                # Ver variaveis" -ForegroundColor White

Write-Host "`n=== PROBLEMAS CORRIGIDOS ===" -ForegroundColor Cyan
Write-Host "1. Removido 'type: module' do package.json" -ForegroundColor Green
Write-Host "2. Configurado main: server.cjs" -ForegroundColor Green
Write-Host "3. Adicionado healthcheck no railway.toml" -ForegroundColor Green
Write-Host "4. Comando start direto: node server.cjs" -ForegroundColor Green

Write-Host "`nSe ainda houver problemas, execute o diagnostico novamente:" -ForegroundColor Yellow
Write-Host "powershell -ExecutionPolicy Bypass -File diagnostico-railway-fixed.ps1" -ForegroundColor White
