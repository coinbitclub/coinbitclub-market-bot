# 🚀 DEPLOY AUTOMATIZADO PARA RAILWAY (PowerShell)
# ================================================

Write-Host "🚀 INICIANDO DEPLOY AUTOMATIZADO RAILWAY" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Verificar se Railway CLI está instalado
if (!(Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Instalando Railway CLI..." -ForegroundColor Yellow
    npm install -g @railway/cli
}

# Verificar se está logado no Railway
Write-Host "🔐 Verificando login Railway..." -ForegroundColor Cyan
try {
    railway whoami | Out-Null
    Write-Host "✅ Railway CLI configurado" -ForegroundColor Green
} catch {
    Write-Host "❌ Não está logado no Railway" -ForegroundColor Red
    Write-Host "Execute: railway login" -ForegroundColor Yellow
    exit 1
}

# Verificar arquivos necessários
Write-Host "📋 Verificando arquivos de deploy..." -ForegroundColor Cyan
$required_files = @(
    "server-multiusuario-limpo.js",
    "package.json",
    ".env.production",
    "railway.json",
    "Procfile"
)

foreach ($file in $required_files) {
    if (!(Test-Path $file)) {
        Write-Host "❌ Arquivo obrigatório não encontrado: $file" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ $file encontrado" -ForegroundColor Green
}

# Fazer deploy
Write-Host "🚀 Iniciando deploy..." -ForegroundColor Yellow
$deployResult = railway up 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deploy realizado com sucesso!" -ForegroundColor Green
    
    # Obter URL da aplicação via railway status
    Write-Host "🔍 Obtendo URL da aplicação..." -ForegroundColor Cyan
    try {
        $statusOutput = railway status --json | ConvertFrom-Json
        $url = $statusOutput.deployments[0].url
        
        if ($url -and $url -ne "null") {
            Write-Host "🌐 Aplicação disponível em: $url" -ForegroundColor Green
            
            # Aguardar alguns segundos para aplicação inicializar
            Write-Host "⏳ Aguardando inicialização (30s)..." -ForegroundColor Yellow
            Start-Sleep 30
            
            # Verificar health check
            Write-Host "🔍 Verificando health check..." -ForegroundColor Cyan
            try {
                $response = Invoke-WebRequest -Uri "$url/health" -TimeoutSec 10
                if ($response.StatusCode -eq 200) {
                    Write-Host "✅ Health check OK" -ForegroundColor Green
                    Write-Host "🎉 DEPLOY CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
                    Write-Host "🌐 URL: $url" -ForegroundColor Cyan
                    Write-Host "🔍 Health: $url/health" -ForegroundColor Cyan
                    Write-Host "🔌 API: $url/api/health" -ForegroundColor Cyan
                } else {
                    Write-Host "⚠️ Health check retornou status: $($response.StatusCode)" -ForegroundColor Yellow
                }
            } catch {
                Write-Host "⚠️ Health check falhou - verificar logs" -ForegroundColor Yellow
                Write-Host "📊 Verificar: railway logs" -ForegroundColor Cyan
            }
        } else {
            Write-Host "⚠️ URL não encontrada - verificar Railway dashboard" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️ Erro ao obter status - verificar Railway dashboard" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Falha no deploy" -ForegroundColor Red
    Write-Host $deployResult -ForegroundColor Red
    Write-Host "📊 Verificar logs: railway logs" -ForegroundColor Cyan
    exit 1
}

Write-Host ""
Write-Host "📋 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. Configurar variáveis de ambiente no Railway" -ForegroundColor White
Write-Host "2. Adicionar credenciais Twilio" -ForegroundColor White
Write-Host "3. Testar endpoints" -ForegroundColor White
Write-Host "4. Conectar frontend" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Railway Dashboard: https://railway.app/dashboard" -ForegroundColor Cyan

# Pausar para o usuário ver o resultado
Read-Host "Pressione Enter para continuar..."
