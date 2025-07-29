# Verificacao Pre-Criacao do Novo Projeto Railway
# Garante que tudo esta pronto antes de criar novo projeto

Write-Host "VERIFICACAO PRE-CRIACAO - NOVO PROJETO RAILWAY" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

# 1. Verificar arquivos principais
Write-Host ""
Write-Host "VERIFICANDO ARQUIVOS PRINCIPAIS:" -ForegroundColor Yellow

$criticalFiles = @("main.js", "package.json", "railway.toml", "Dockerfile")
$allFilesExist = $true

foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        $size = [math]::Round((Get-Item $file).Length / 1KB, 1)
        Write-Host "   OK $file - $size KB" -ForegroundColor Green
    } else {
        Write-Host "   ERRO $file - NAO ENCONTRADO" -ForegroundColor Red
        $allFilesExist = $false
    }
}

# 2. Verificar package.json
Write-Host ""
Write-Host "VERIFICANDO PACKAGE.JSON:" -ForegroundColor Yellow

if (Test-Path "package.json") {
    try {
        $pkg = Get-Content "package.json" -Raw | ConvertFrom-Json
        Write-Host "   Nome: $($pkg.name)" -ForegroundColor White
        Write-Host "   Versao: $($pkg.version)" -ForegroundColor White
        Write-Host "   Main: $($pkg.main)" -ForegroundColor White
        Write-Host "   Start: $($pkg.scripts.start)" -ForegroundColor White
        
        if ($pkg.main -eq "main.js" -and $pkg.scripts.start -match "main\.js") {
            Write-Host "   OK Package.json configurado para Sistema V3" -ForegroundColor Green
        } else {
            Write-Host "   ERRO Package.json nao configurado para Sistema V3" -ForegroundColor Red
            $allFilesExist = $false
        }
    }
    catch {
        Write-Host "   ERRO ao ler package.json: $_" -ForegroundColor Red
        $allFilesExist = $false
    }
}

# 3. Informacoes do banco
Write-Host ""
Write-Host "INFORMACOES DO BANCO DE DADOS:" -ForegroundColor Yellow
Write-Host "   Host: maglev.proxy.rlwy.net" -ForegroundColor White
Write-Host "   Port: 42095" -ForegroundColor White
Write-Host "   Database: railway" -ForegroundColor White
Write-Host "   User: postgres" -ForegroundColor White
Write-Host "   OK Banco sera mantido (zero perda de dados)" -ForegroundColor Green

# 4. Resumo final
Write-Host ""
Write-Host "RESUMO DA VERIFICACAO:" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan

if ($allFilesExist) {
    Write-Host "OK TUDO PRONTO PARA CRIAR NOVO PROJETO!" -ForegroundColor Green
    Write-Host ""
    Write-Host "PROXIMOS PASSOS:" -ForegroundColor Yellow
    Write-Host "1. Acessar: https://railway.app/dashboard" -ForegroundColor White
    Write-Host "2. Clicar 'New Project' -> 'Deploy from GitHub repo'" -ForegroundColor White
    Write-Host "3. Escolher: coinbitclub/coinbitclub-market-bot" -ForegroundColor White
    Write-Host "4. Nome: coinbitclub-market-bot-v3-production" -ForegroundColor White
    Write-Host ""
    Write-Host "VARIAVEIS PARA ADICIONAR:" -ForegroundColor Yellow
    Write-Host "DATABASE_URL=postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway" -ForegroundColor Cyan
    Write-Host "NODE_ENV=production" -ForegroundColor Cyan
    Write-Host "PORT=3000" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "CONFIGURACOES:" -ForegroundColor Yellow
    Write-Host "Root Directory: backend" -ForegroundColor Cyan
    Write-Host "Start Command: node main.js" -ForegroundColor Cyan
} else {
    Write-Host "ERRO PROBLEMAS ENCONTRADOS!" -ForegroundColor Red
    Write-Host "Corrija os problemas acima antes de criar novo projeto" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Para testar apos criacao, execute:" -ForegroundColor Cyan
Write-Host "node testar-novo-projeto.js" -ForegroundColor Yellow
