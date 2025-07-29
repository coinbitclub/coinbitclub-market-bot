# Teste direto do sistema Railway
# URL: https://coinbitclub-market-bot.up.railway.app

Write-Host "TESTE DIRETO DO SISTEMA RAILWAY" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan

$url = "https://coinbitclub-market-bot.up.railway.app"

Write-Host ""
Write-Host "Testando Health Check..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "$url/health" -UseBasicParsing -TimeoutSec 10
    $content = $response.Content | ConvertFrom-Json
    
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Versao: $($content.version)" -ForegroundColor White
    Write-Host "Servico: $($content.service)" -ForegroundColor White
    
    if ($content.version -like "*integrated-final*") {
        Write-Host "SISTEMA V3 DETECTADO!" -ForegroundColor Green
    } elseif ($content.version -like "*multiservice-hybrid*") {
        Write-Host "SISTEMA ANTIGO AINDA ATIVO" -ForegroundColor Red
    }
    
} catch {
    Write-Host "Erro ao testar health: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Testando Painel de Controle..." -ForegroundColor Yellow

try {
    $controlResponse = Invoke-WebRequest -Uri "$url/control" -UseBasicParsing -TimeoutSec 10
    Write-Host "Status /control: $($controlResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Painel de controle disponivel!" -ForegroundColor Green
} catch {
    Write-Host "Erro ao testar /control: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "PROXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "1. Se Sistema V3 ativo: Configurar chaves exchanges" -ForegroundColor White
Write-Host "2. Se sistema antigo: Atualizar BACKEND_URL" -ForegroundColor White
Write-Host "3. Acessar: $url/control" -ForegroundColor Yellow
