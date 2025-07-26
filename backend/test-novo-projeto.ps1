# SCRIPT DE TESTE PARA NOVO PROJETO RAILWAY
param(
    [Parameter(Mandatory=$true)]
    [string]$NovaURL
)

Write-Host "🧪 TESTANDO NOVO PROJETO RAILWAY" -ForegroundColor Green
Write-Host "URL: $NovaURL"
Write-Host "=" * 60

# Função de teste
function Test-Endpoint {
    param([string]$Url, [string]$Name)
    
    Write-Host "`n🔍 Testando $Name..." -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 30
        
        if ($response.StatusCode -eq 200) {
            Write-Host " ✅ $($response.StatusCode)" -ForegroundColor Green
            return $true
        } else {
            Write-Host " ⚠️ $($response.StatusCode)" -ForegroundColor Yellow
            return $false
        }
    }
    catch {
        Write-Host " ❌ $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Testes
$tests = @(
    @{ Url = "$NovaURL/health"; Name = "Health Check" },
    @{ Url = "$NovaURL/"; Name = "Root Endpoint" },
    @{ Url = "$NovaURL/api/health"; Name = "API Health" },
    @{ Url = "$NovaURL/api/status"; Name = "API Status" }
)

$successCount = 0

foreach ($test in $tests) {
    if (Test-Endpoint -Url $test.Url -Name $test.Name) {
        $successCount++
    }
    Start-Sleep 2
}

# Teste de webhook
Write-Host "`n📡 Testando webhook..." -NoNewline

try {
    $webhookData = @{
        test = "novo_projeto"
        timestamp = (Get-Date).ToString()
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$NovaURL/webhook/test" -Method POST -Body $webhookData -ContentType "application/json" -TimeoutSec 30
    
    if ($response.StatusCode -eq 200) {
        Write-Host " ✅ $($response.StatusCode)" -ForegroundColor Green
        $successCount++
    }
}
catch {
    Write-Host " ❌ $($_.Exception.Message)" -ForegroundColor Red
}

# Resultado
Write-Host "`n" + "=" * 60
Write-Host "📊 RESULTADO DOS TESTES:" -ForegroundColor Yellow
Write-Host "✅ Sucessos: $successCount/5" -ForegroundColor Green

if ($successCount -eq 5) {
    Write-Host "`n🎉 TODOS OS TESTES PASSARAM!" -ForegroundColor Green
    Write-Host "✅ ERRO 502 RESOLVIDO NO NOVO PROJETO!" -ForegroundColor Green
} else {
    Write-Host "`n⚠️ Alguns testes falharam" -ForegroundColor Yellow
}

Write-Host "`n💡 Para usar este script:" -ForegroundColor Cyan
Write-Host ".\test-novo-projeto.ps1 -NovaURL 'https://sua-nova-url.railway.app'"
