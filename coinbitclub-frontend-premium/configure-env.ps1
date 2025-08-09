# Script PowerShell para configurar variáveis de ambiente no Vercel e Railway
# Execute este script após configurar manualmente as variáveis nos dashboards

Write-Host "🚀 Configuração de Variáveis de Ambiente - CoinBitClub Market Bot" -ForegroundColor Blue
Write-Host "=================================================================" -ForegroundColor Blue
Write-Host ""

Write-Host "Frontend URL: " -NoNewline -ForegroundColor Cyan
Write-Host "https://coinbitclub-marketbot.vercel.app"
Write-Host "Backend URL: " -NoNewline -ForegroundColor Cyan  
Write-Host "https://coinbitclub-market-bot.up.railway.app"
Write-Host ""

# Teste de conectividade com o backend
Write-Host "🔍 Testando conectividade com o backend..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri "https://coinbitclub-market-bot.up.railway.app" -Method Head -TimeoutSec 10 | Out-Null
    Write-Host "✅ Backend está online" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend não está respondendo" -ForegroundColor Red
}

# Teste de conectividade com o frontend
Write-Host "🔍 Testando conectividade com o frontend..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri "https://coinbitclub-marketbot.vercel.app" -Method Head -TimeoutSec 10 | Out-Null
    Write-Host "✅ Frontend está online" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend não está respondendo" -ForegroundColor Red
}

Write-Host ""
Write-Host "📋 Checklist de Configuração:" -ForegroundColor Yellow
Write-Host ""

Write-Host "VERCEL (Frontend):" -ForegroundColor Blue
Write-Host "1. Acesse: https://vercel.com/dashboard"
Write-Host "2. Selecione projeto: coinbitclub-marketbot"
Write-Host "3. Settings → Environment Variables"
Write-Host "4. Configure as variáveis listadas no arquivo CONFIGURACAO-VARIAVEIS-AMBIENTE.md"
Write-Host ""

Write-Host "RAILWAY (Backend):" -ForegroundColor Blue
Write-Host "1. Acesse: https://railway.app/dashboard"
Write-Host "2. Selecione projeto: coinbitclub-market-bot"
Write-Host "3. Variables tab"
Write-Host "4. Configure as variáveis listadas no arquivo CONFIGURACAO-VARIAVEIS-AMBIENTE.md"
Write-Host ""

Write-Host "📝 Variáveis Críticas:" -ForegroundColor Yellow
Write-Host "- NEXT_PUBLIC_API_URL (Vercel) → https://coinbitclub-market-bot.up.railway.app"
Write-Host "- DATABASE_URL (Railway) → PostgreSQL connection string"
Write-Host "- FRONTEND_URL (Railway) → https://coinbitclub-marketbot.vercel.app"
Write-Host "- JWT_SECRET (Railway) → Chave secreta segura"
Write-Host "- STRIPE keys → Chaves de produção válidas"
Write-Host ""

Write-Host "🎯 Próximos passos:" -ForegroundColor Green
Write-Host "1. Configure as variáveis nos dashboards"
Write-Host "2. Faça deploy do frontend (Vercel)"
Write-Host "3. Verifique os logs de ambos os serviços"
Write-Host "4. Teste a aplicação completa"
Write-Host ""

Write-Host "📚 Documentação:" -ForegroundColor Blue
Write-Host "- Vercel: https://vercel.com/docs/concepts/projects/environment-variables"
Write-Host "- Railway: https://docs.railway.app/develop/variables"
Write-Host ""

# Verifica se o arquivo de configuração existe
$configFile = "CONFIGURACAO-VARIAVEIS-AMBIENTE.md"
if (Test-Path $configFile) {
    Write-Host "📄 Arquivo de configuração encontrado: $configFile" -ForegroundColor Green
} else {
    Write-Host "⚠️  Arquivo de configuração não encontrado: $configFile" -ForegroundColor Red
}

Write-Host ""
Write-Host "=================================================================" -ForegroundColor Blue
Write-Host "✅ Script concluído! Consulte CONFIGURACAO-VARIAVEIS-AMBIENTE.md para detalhes." -ForegroundColor Green

# Pausa para que o usuário possa ler a saída
Write-Host ""
Write-Host "Pressione qualquer tecla para continuar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
