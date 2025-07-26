# INSTRUÇÕES PARA CRIAR NOVO PROJETO RAILWAY
# Execute estes passos EXATAMENTE como descrito

Write-Host "🎯 INSTRUÇÕES PARA CRIAR NOVO PROJETO RAILWAY" -ForegroundColor Cyan
Write-Host "=" * 60

Write-Host "`n📋 PASSO A PASSO:" -ForegroundColor Yellow

Write-Host "`n1️⃣ ACESSE O RAILWAY:" -ForegroundColor Green
Write-Host "   • Abra: https://railway.app/dashboard"
Write-Host "   • Faça login na sua conta"

Write-Host "`n2️⃣ CRIAR NOVO PROJETO:" -ForegroundColor Green
Write-Host "   • Clique em 'New Project'"
Write-Host "   • Selecione 'Deploy from GitHub repo'"
Write-Host "   • Escolha: coinbitclub/coinbitclub-market-bot"
Write-Host "   • Nome do projeto: 'coinbitclub-api-v2'"

Write-Host "`n3️⃣ CONFIGURAR VARIÁVEIS:" -ForegroundColor Green
Write-Host "   • Vá em 'Variables'"
Write-Host "   • Adicione estas variáveis:"
Write-Host "     DATABASE_URL = postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway"
Write-Host "     NODE_ENV = production"

Write-Host "`n4️⃣ CONFIGURAR BUILD:" -ForegroundColor Green
Write-Host "   • Vá em 'Settings'"
Write-Host "   • Build Command: (deixar vazio)"
Write-Host "   • Start Command: node server.js"
Write-Host "   • Root Directory: backend"

Write-Host "`n5️⃣ FAZER DEPLOY:" -ForegroundColor Green
Write-Host "   • Clique em 'Deploy'"
Write-Host "   • Aguarde o build terminar"
Write-Host "   • Anote a nova URL (será algo como: https://coinbitclub-api-v2-production.up.railway.app)"

Write-Host "`n6️⃣ VERIFICAR FUNCIONAMENTO:" -ForegroundColor Green
Write-Host "   • Teste a nova URL/health"
Write-Host "   • Deve retornar STATUS 200"
Write-Host "   • Confirme que banco está conectado"

Write-Host "`n🎯 ARQUIVOS JÁ PREPARADOS:" -ForegroundColor Cyan
Write-Host "   ✅ server-v2-clean.js - Servidor otimizado"
Write-Host "   ✅ Dockerfile.v2 - Container limpo"
Write-Host "   ✅ railway.toml - Configuração atualizada"
Write-Host "   ✅ Todos os arquivos já foram commitados"

Write-Host "`n🚨 IMPORTANTE:" -ForegroundColor Red
Write-Host "   • O novo projeto deve usar o MESMO banco de dados"
Write-Host "   • Não altere a string de conexão DATABASE_URL"
Write-Host "   • O projeto antigo ficará como backup"

Write-Host "`n✅ APÓS CRIAR O NOVO PROJETO:" -ForegroundColor Green
Write-Host "   • Execute este comando para testar:"
Write-Host "   • Invoke-WebRequest -Uri 'https://SUA_NOVA_URL/health'"
Write-Host "   • Deve retornar STATUS 200 (sem 502!)"

Write-Host "`n" + "=" * 60
Write-Host "🎉 NOVO PROJETO = ERRO 502 RESOLVIDO!" -ForegroundColor Green
