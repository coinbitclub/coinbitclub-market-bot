# 🎯 SCRIPT DE VERIFICAÇÃO PRÉ-CRIAÇÃO NOVO PROJETO
# Garante que tudo está pronto para criar o novo projeto Railway

param(
    [string]$NovaURL = ""
)

Write-Host "🎯 VERIFICAÇÃO PRÉ-CRIAÇÃO NOVO PROJETO RAILWAY" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar arquivos críticos
Write-Host "📁 VERIFICANDO ARQUIVOS CRÍTICOS:" -ForegroundColor Yellow
Write-Host "-----------------------------------" -ForegroundColor Yellow

$arquivosCriticos = @(
    @{Nome="main.js"; Descricao="Sistema V3 principal"},
    @{Nome="package.json"; Descricao="Configuração Node.js"},
    @{Nome="railway.toml"; Descricao="Configuração Railway"},
    @{Nome="Dockerfile"; Descricao="Container config"}
)

$tudoOK = $true

foreach ($arquivo in $arquivosCriticos) {
    if (Test-Path $arquivo.Nome) {
        $tamanho = [math]::Round((Get-Item $arquivo.Nome).Length / 1KB, 1)
        Write-Host "✅ $($arquivo.Nome) - $($tamanho)KB - $($arquivo.Descricao)" -ForegroundColor Green
    } else {
        Write-Host "❌ $($arquivo.Nome) - NÃO ENCONTRADO" -ForegroundColor Red
        $tudoOK = $false
    }
}

if (-not $tudoOK) {
    Write-Host ""
    Write-Host "❌ ERRO: Arquivos críticos faltando!" -ForegroundColor Red
    Write-Host "💡 Execute primeiro o fix-railway-deployment.ps1" -ForegroundColor Yellow
    exit 1
}

# 2. Verificar package.json
Write-Host ""
Write-Host "📋 VERIFICANDO PACKAGE.JSON:" -ForegroundColor Yellow
Write-Host "-----------------------------" -ForegroundColor Yellow

try {
    $packageContent = Get-Content "package.json" -Raw | ConvertFrom-Json
    
    if ($packageContent.main -eq "main.js") {
        Write-Host "✅ Main configurado para: $($packageContent.main)" -ForegroundColor Green
    } else {
        Write-Host "❌ Main incorreto: $($packageContent.main)" -ForegroundColor Red
        $tudoOK = $false
    }
    
    if ($packageContent.scripts.start -like "*main.js*") {
        Write-Host "✅ Start script: $($packageContent.scripts.start)" -ForegroundColor Green
    } else {
        Write-Host "❌ Start script incorreto: $($packageContent.scripts.start)" -ForegroundColor Red
        $tudoOK = $false
    }
    
    Write-Host "📦 Versão: $($packageContent.version)" -ForegroundColor White
    Write-Host "📝 Nome: $($packageContent.name)" -ForegroundColor White
    
} catch {
    Write-Host "❌ Erro ao ler package.json: $($_.Exception.Message)" -ForegroundColor Red
    $tudoOK = $false
}

# 3. Verificar railway.toml
Write-Host ""
Write-Host "🚂 VERIFICANDO RAILWAY.TOML:" -ForegroundColor Yellow
Write-Host "-----------------------------" -ForegroundColor Yellow

try {
    $railwayContent = Get-Content "railway.toml" -Raw
    
    if ($railwayContent -match "main\.js") {
        Write-Host "✅ Railway configurado para main.js" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Railway pode não estar configurado para main.js" -ForegroundColor Yellow
    }
    
    if ($railwayContent -match "startCommand.*main\.js") {
        Write-Host "✅ Start command correto no railway.toml" -ForegroundColor Green
    }
    
} catch {
    Write-Host "⚠️ Erro ao ler railway.toml: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 4. Verificar se há arquivos conflitantes
Write-Host ""
Write-Host "🗑️ VERIFICANDO ARQUIVOS CONFLITANTES:" -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor Yellow

$arquivosConflito = @(
    "server-clean.cjs",
    "server-multiservice-complete.cjs",
    "package-clean.json"
)

$temConflitos = $false
foreach ($arquivo in $arquivosConflito) {
    if (Test-Path $arquivo) {
        Write-Host "⚠️ $arquivo - PRESENTE (pode causar conflito)" -ForegroundColor Yellow
        $temConflitos = $true
    } else {
        Write-Host "✅ $arquivo - REMOVIDO" -ForegroundColor Green
    }
}

if (-not $temConflitos) {
    Write-Host "✅ Nenhum arquivo conflitante encontrado" -ForegroundColor Green
}

# 5. Mostrar informações do banco
Write-Host ""
Write-Host "🗄️ INFORMAÇÕES DO BANCO DE DADOS:" -ForegroundColor Yellow
Write-Host "-----------------------------------" -ForegroundColor Yellow
Write-Host "DATABASE_URL atual:" -ForegroundColor White
Write-Host "postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️ IMPORTANTE: Use exatamente esta URL no novo projeto!" -ForegroundColor Red

# 6. Resultado final
Write-Host ""
Write-Host "🎯 RESULTADO DA VERIFICAÇÃO:" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

if ($tudoOK) {
    Write-Host "🎉 TUDO PRONTO PARA CRIAR NOVO PROJETO!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 PRÓXIMOS PASSOS:" -ForegroundColor White
    Write-Host "1. Acesse: https://railway.app/dashboard" -ForegroundColor White
    Write-Host "2. Clique em 'New Project'" -ForegroundColor White
    Write-Host "3. 'Deploy from GitHub repo'" -ForegroundColor White
    Write-Host "4. Repo: coinbitclub/coinbitclub-market-bot" -ForegroundColor White
    Write-Host "5. Nome: coinbitclub-market-bot-v3" -ForegroundColor White
    Write-Host ""
    Write-Host "🔧 CONFIGURAÇÕES NECESSÁRIAS:" -ForegroundColor White
    Write-Host "Root Directory: backend" -ForegroundColor White
    Write-Host "Start Command: node main.js" -ForegroundColor White
    Write-Host "DATABASE_URL: (usar a mesma URL acima)" -ForegroundColor White
    
} else {
    Write-Host "❌ CORREÇÕES NECESSÁRIAS ANTES DE CRIAR PROJETO" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 EXECUTE PRIMEIRO:" -ForegroundColor Yellow
    Write-Host ".\fix-railway-deployment.ps1" -ForegroundColor White
}

# 7. Teste do novo projeto (se URL fornecida)
if ($NovaURL -ne "") {
    Write-Host ""
    Write-Host "🧪 TESTANDO NOVO PROJETO:" -ForegroundColor Yellow
    Write-Host "-------------------------" -ForegroundColor Yellow
    Write-Host "URL: $NovaURL" -ForegroundColor White
    
    node teste-novo-projeto.js $NovaURL
}

Write-Host ""
Write-Host "📄 Consulte o guia completo em: GUIA-NOVO-PROJETO-RAILWAY.md" -ForegroundColor Cyan
