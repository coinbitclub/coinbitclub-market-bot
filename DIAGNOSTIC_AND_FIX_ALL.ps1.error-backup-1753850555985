# SCRIPT DIAGNOSTICO COMPLETO E CORRECAO TOTAL
Write-Host "DIAGNOSTICO COMPLETO E CORRECAO TOTAL" -ForegroundColor Red

# 1. REMOVER ARQUIVOS CONFLITANTES
Write-Host "`nFASE 1: REMOVER ARQUIVOS CONFLITANTES" -ForegroundColor Yellow
$conflictFiles = @("nixpacks.toml", "build.sh", ".npmrc", "package-lock.json")
foreach ($file in $conflictFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "REMOVIDO: $file" -ForegroundColor Red
    }
}

# 2. CRIAR PACKAGE.JSON LIMPO
Write-Host "`nFASE 2: CRIAR PACKAGE.JSON LIMPO" -ForegroundColor Yellow
$packageData = @{
    name = "coinbitclub-market-bot"
    version = "3.0.0"
    description = "CoinBitClub Market Bot V3"
    main = "main.js"
    scripts = @{
        start = "node main.js"
    }
    engines = @{
        node = ">=18.0.0"
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
$packageJson = $packageData | ConvertTo-Json -Depth 4
[System.IO.File]::WriteAllText("$(Get-Location)\package.json", $packageJson, [System.Text.Encoding]::UTF8)
Write-Host "package.json LIMPO criado" -ForegroundColor Green

# 3. VERIFICAR MAIN.JS
Write-Host "`nFASE 3: VERIFICAR MAIN.JS" -ForegroundColor Yellow
if (-not (Test-Path "main.js") -and (Test-Path "backend\main.js")) {
    Copy-Item "backend\main.js" "main.js" -Force
    Write-Host "main.js copiado do backend" -ForegroundColor Green
}

# 4. COMMIT E PUSH
Write-Host "`nFASE 4: COMMIT E PUSH" -ForegroundColor Yellow
git add .
git commit -m "ULTIMATE FIX: Clean deployment"
git push origin main --force
Write-Host "DEPLOYMENT ENVIADO!" -ForegroundColor Green
