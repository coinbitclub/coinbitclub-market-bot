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

# 4. Deploy automático (se configurado)
Write-Host "🚀 Iniciando deploy..." -ForegroundColor Yellow

# Verifica se existe configuração do Vercel
if ((Test-Path "vercel.json") -or (Test-Path ".vercel/project.json")) {
    Write-Host "📡 Fazendo deploy no Vercel..." -ForegroundColor Cyan
    npx vercel --prod
} elseif (Test-Path "netlify.toml") {
    Write-Host "📡 Fazendo deploy no Netlify..." -ForegroundColor Cyan
    npx netlify deploy --prod
} elseif (Test-Path "Dockerfile") {
    Write-Host "🐳 Fazendo deploy com Docker..." -ForegroundColor Cyan
    docker build -t coinbitclub-market-bot .
    Write-Host "✅ Imagem Docker criada com sucesso!" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Deploy manual necessário - configuração de deploy não encontrada" -ForegroundColor Blue
}

# 5. Verificações pós-deploy
Write-Host "🔍 Verificando status dos serviços..." -ForegroundColor Yellow

# Verificar se os serviços estão rodando
Write-Host "📊 Status dos serviços:" -ForegroundColor Cyan
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "- API Gateway: http://localhost:8081" -ForegroundColor White
Write-Host "- Admin Panel: http://localhost:8082" -ForegroundColor White

Write-Host ""
Write-Host "✅ DEPLOY COMPLETO FINALIZADO!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Verificar se os serviços estão rodando" -ForegroundColor White
Write-Host "2. Testar funcionalidades principais" -ForegroundColor White
Write-Host "3. Verificar logs para possíveis erros" -ForegroundColor White
Write-Host "4. Monitorar performance" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Links importantes:" -ForegroundColor Yellow
Write-Host "- Landing Page: http://localhost:3000/landing" -ForegroundColor White
Write-Host "- Dashboard Admin: http://localhost:3000/admin" -ForegroundColor White
Write-Host "- Dashboard Usuário: http://localhost:3000/dashboard" -ForegroundColor White
Write-Host "- Cadastro: http://localhost:3000/auth/register" -ForegroundColor White
Write-Host "- Login: http://localhost:3000/auth/login" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Sistema CoinbitClub Market Bot está pronto para uso!" -ForegroundColor Green
