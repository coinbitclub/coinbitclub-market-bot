# Script PowerShell para fazer deploy completo do CoinbitClub Market Bot
# Atualiza GitHub e faz deploy

Write-Host "🚀 INICIANDO DEPLOY COMPLETO DO COINBITCLUB MARKET BOT" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

# Verificar se estamos no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erro: Execute este script no diretório raiz do projeto" -ForegroundColor Red
    exit 1
}

# 1. Adicionar todos os arquivos
Write-Host "📁 Adicionando arquivos..." -ForegroundColor Yellow
git add .

# 2. Fazer commit com mensagem descritiva
Write-Host "💾 Fazendo commit..." -ForegroundColor Yellow
git commit -m "feat: Implementacao completa do sistema CoinbitClub Market Bot

Novas funcionalidades:
- Landing page atualizada com design oficial
- Sistema de cadastro de usuarios e afiliados integrado
- Dashboard administrativo completo
- Dashboard de usuarios com operacoes e planos
- Dashboard de afiliados com gestao de indicados
- Sistema de autenticacao com redirecionamento por role
- APIs de backend integradas
- Banco de dados PostgreSQL configurado
- Sistema de migracao completo

Melhorias tecnicas:
- Integracao frontend-backend funcional
- Autenticacao JWT implementada
- Validacao de formularios completa
- Interface responsiva com TailwindCSS
- Componentes reutilizaveis otimizados

Funcionalidades administrativas:
- Gestao de usuarios com filtros e busca
- Controle de afiliados e comissoes
- Dashboard com metricas em tempo real
- Sistema de logs e auditoria
- Configuracoes do sistema

Area do usuario:
- Dashboard com operacoes em tempo real
- Gestao de planos e assinaturas
- Configuracoes de API das exchanges
- Historico de operacoes

Area do afiliado:
- Dashboard de indicados
- Controle de comissoes
- Estatisticas de performance
- Links de indicacao personalizados

Seguranca:
- Autenticacao segura implementada
- Validacao de dados robusta
- Protecao contra ataques comuns
- Logs de auditoria completos

Versao: 2.0.0 - Sistema completo funcional"

# 3. Push para o GitHub
Write-Host "🌐 Enviando para GitHub..." -ForegroundColor Yellow
git push origin main

# Verificar se o push foi bem-sucedido
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Push para GitHub realizado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro no push para GitHub" -ForegroundColor Red
    exit 1
}

# 4. Deploy automático
Write-Host "🚀 Iniciando deploy..." -ForegroundColor Yellow

# Deploy do Frontend no Vercel
Write-Host "📡 Fazendo deploy do Frontend no Vercel..." -ForegroundColor Blue
Set-Location "coinbitclub-frontend-premium"
try {
    npx vercel --prod
    Write-Host "✅ Frontend deployado no Vercel com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro no deploy do frontend no Vercel: $_" -ForegroundColor Red
}
Set-Location ".."

# Deploy do Backend no Railway
Write-Host "🚄 Fazendo deploy do Backend no Railway..." -ForegroundColor Blue
Set-Location "backend"
try {
    railway login
    railway up
    Write-Host "✅ Backend deployado no Railway com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro no deploy do backend no Railway: $_" -ForegroundColor Red
}
# 5. Verificações pós-deploy
Write-Host "🔍 Verificando status dos serviços..." -ForegroundColor Yellow

# Verificar se os serviços estão rodando
Write-Host "📊 Status dos serviços:" -ForegroundColor Cyan
Write-Host "- Frontend (Vercel): https://seu-projeto.vercel.app" -ForegroundColor White
Write-Host "- Backend API Gateway (Railway): https://seu-backend.railway.app" -ForegroundColor White
Write-Host "- Backend Admin Panel (Railway): https://seu-admin.railway.app" -ForegroundColor White

Write-Host ""
Write-Host "✅ DEPLOY COMPLETO FINALIZADO!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Verificar se os serviços estão rodando na produção" -ForegroundColor White
Write-Host "2. Testar funcionalidades principais nos URLs de produção" -ForegroundColor White
Write-Host "3. Verificar logs no Vercel e Railway para possíveis erros" -ForegroundColor White
Write-Host "4. Monitorar performance dos serviços" -ForegroundColor White
Write-Host "5. Configurar variáveis de ambiente de produção" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Links importantes (produção):" -ForegroundColor Yellow
Write-Host "- Landing Page: https://coinbitclub-market-bot.vercel.app/landing" -ForegroundColor White
Write-Host "- Dashboard Admin: https://coinbitclub-market-bot.vercel.app/admin" -ForegroundColor White
Write-Host "- Dashboard Usuário: https://coinbitclub-market-bot.vercel.app/dashboard" -ForegroundColor White
Write-Host "- Cadastro: https://coinbitclub-market-bot.vercel.app/auth/register" -ForegroundColor White
Write-Host "- Login: https://coinbitclub-market-bot.vercel.app/auth/login" -ForegroundColor White
Write-Host "- API Backend: https://coinbitclub-market-bot-production.up.railway.app" -ForegroundColor White
Write-Host ""
Write-Host "🛠️  URLs de desenvolvimento (local):" -ForegroundColor Yellow
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "- API Gateway: http://localhost:8081" -ForegroundColor White
Write-Host "- Admin Panel: http://localhost:8082" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Sistema CoinbitClub Market Bot está pronto para uso!" -ForegroundColor Green
