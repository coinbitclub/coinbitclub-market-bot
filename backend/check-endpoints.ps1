Write-Host "VERIFICANDO ENDPOINTS NO main.js" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green

# 1. Verificar se main.js tem os endpoints corretos
Write-Host "Verificando endpoints no main.js..." -ForegroundColor Yellow
if (Test-Path "main.js") {
    $mainContent = Get-Content "main.js" -Raw
    
    Write-Host "`nEndpoints encontrados:" -ForegroundColor Cyan
    if ($mainContent -match "app\.get\('\/'") {
        Write-Host "✅ GET /" -ForegroundColor Green
    }
    if ($mainContent -match "app\.get\('\/health'") {
        Write-Host "✅ GET /health" -ForegroundColor Green
    }
    if ($mainContent -match "app\.get\('\/api\/health'") {
        Write-Host "✅ GET /api/health" -ForegroundColor Green
    }
    if ($mainContent -match "app\.get\('\/control'") {
        Write-Host "✅ GET /control" -ForegroundColor Green
    }
    if ($mainContent -match "app\.get\('\/api\/system\/status'") {
        Write-Host "✅ GET /api/system/status" -ForegroundColor Green
    }
    if ($mainContent -match "app\.post\('\/api\/system\/toggle'") {
        Write-Host "✅ POST /api/system/toggle" -ForegroundColor Green
    }
    
    Write-Host "`nVerificando versão definida..." -ForegroundColor Cyan
    if ($mainContent -match "SYSTEM_VERSION.*integrated-final") {
        Write-Host "✅ Versão correta: integrated-final (não multiservice)" -ForegroundColor Green
    } else {
        Write-Host "❌ Versão incorreta ou não encontrada" -ForegroundColor Red
    }
    
    Write-Host "`nVerificando service name..." -ForegroundColor Cyan
    if ($mainContent -match "coinbitclub-integrated-final") {
        Write-Host "✅ Service name correto: coinbitclub-integrated-final" -ForegroundColor Green
    } else {
        Write-Host "❌ Service name incorreto" -ForegroundColor Red
    }
    
} else {
    Write-Host "❌ main.js não encontrado!" -ForegroundColor Red
}

# 2. Listar TODOS os arquivos .js no diretório
Write-Host "`nListando TODOS os arquivos .js:" -ForegroundColor Yellow
Get-ChildItem -Name "*.js" | ForEach-Object {
    if ($_ -eq "main.js") {
        Write-Host "✅ $_" -ForegroundColor Green
    } else {
        Write-Host "⚠️ $_" -ForegroundColor Yellow
    }
}

# 3. Verificar se há algum arquivo que possa estar sendo usado
Write-Host "`nVerificando arquivos suspeitos..." -ForegroundColor Yellow
$suspiciousFiles = @("app.js", "server.js", "index.js")
foreach ($file in $suspiciousFiles) {
    if (Test-Path $file) {
        Write-Host "🚨 ENCONTRADO: $file (pode estar sendo usado pelo Railway)" -ForegroundColor Red
    }
}

Write-Host "`nCONCLUSÃO:" -ForegroundColor Magenta
Write-Host "Se main.js está correto mas Railway retorna multiservice," -ForegroundColor Yellow
Write-Host "significa que Railway não está usando main.js ainda." -ForegroundColor Yellow
Write-Host "Necessário forçar rebuild ou aguardar mais tempo." -ForegroundColor Yellow
