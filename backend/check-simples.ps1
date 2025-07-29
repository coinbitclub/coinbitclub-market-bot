# Verificacao simples antes de criar novo projeto Railway
Write-Host "VERIFICACAO SISTEMA V3" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan

# Verificar arquivos principais
if (Test-Path "main.js") {
    Write-Host "OK main.js encontrado" -ForegroundColor Green
} else {
    Write-Host "ERRO main.js nao encontrado" -ForegroundColor Red
}

if (Test-Path "package.json") {
    $pkg = Get-Content "package.json" | ConvertFrom-Json
    if ($pkg.main -eq "main.js") {
        Write-Host "OK package.json configurado para main.js" -ForegroundColor Green
    } else {
        Write-Host "ERRO package.json incorreto" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "DATABASE_URL para o novo projeto:" -ForegroundColor Yellow
Write-Host "postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway" -ForegroundColor Cyan

Write-Host ""
Write-Host "PROXIMOS PASSOS:" -ForegroundColor White
Write-Host "1. Acesse: https://railway.app/dashboard" -ForegroundColor White
Write-Host "2. New Project > Deploy from GitHub repo" -ForegroundColor White
Write-Host "3. Repo: coinbitclub/coinbitclub-market-bot" -ForegroundColor White
Write-Host "4. Configure DATABASE_URL acima" -ForegroundColor White
Write-Host "5. Root Directory: backend" -ForegroundColor White
Write-Host "6. Start Command: node main.js" -ForegroundColor White
