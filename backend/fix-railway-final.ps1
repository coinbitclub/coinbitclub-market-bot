# SOLUCAO FINAL RAILWAY - REMOVE NIXPACKS E USA PROCESSO PADRAO
Write-Host "SOLUCAO RAILWAY FINAL" -ForegroundColor Red
Write-Host "====================" -ForegroundColor Red

# 1. Remover nixpacks.toml - forcar processo padrao Node.js
Write-Host "Removendo nixpacks.toml..." -ForegroundColor Yellow
if (Test-Path "../nixpacks.toml") { Remove-Item "../nixpacks.toml" -Force }
if (Test-Path "../build.sh") { Remove-Item "../build.sh" -Force }

# 2. Criar package.json super simples
Write-Host "Criando package.json simplificado..." -ForegroundColor Green
$packageSimple = @{
    name = "coinbitclub-market-bot"
    version = "3.0.0"
    main = "main.js"
    scripts = @{
        start = "node main.js"
    }
    engines = @{
        node = "18.x"
    }
    dependencies = @{
        express = "^4.18.2"
        cors = "^2.8.5"
        helmet = "^7.0.0"
        compression = "^1.7.4"
        ws = "^8.13.0"
        pg = "^8.11.3"
        axios = "^1.4.0"
    }
}

$packageSimple | ConvertTo-Json -Depth 3 | Out-File -FilePath "../package.json" -Encoding UTF8

# 3. Criar railway.toml simples
Write-Host "Criando railway.toml simples..." -ForegroundColor Green
@"
[deploy]
startCommand = "node main.js"
healthcheckPath = "/health"
"@ | Out-File -FilePath "../railway.toml" -Encoding UTF8

# 4. Verificar main.js
Write-Host "Verificando main.js..." -ForegroundColor Green
if (Test-Path "../main.js") {
    Write-Host "main.js encontrado" -ForegroundColor Green
} else {
    Write-Host "main.js nao encontrado!" -ForegroundColor Red
    exit 1
}

# 5. Force push final
Write-Host "EXECUTANDO FORCE PUSH FINAL..." -ForegroundColor Magenta
cd ..
git add .
git commit -m "RAILWAY FIX: Remove nixpacks, use standard Node.js process"
git push origin main --force

Write-Host "DEPLOYMENT FINAL ENVIADO!" -ForegroundColor Green
Write-Host "Aguarde 2-3 minutos e teste:" -ForegroundColor Yellow
Write-Host "https://coinbitclub-market-bot.up.railway.app/health" -ForegroundColor Cyan
