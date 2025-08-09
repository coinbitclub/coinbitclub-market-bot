# SCRIPT DE SANITIZACAO - REMOCAO DE CREDENCIAIS SENSIVEIS

Write-Host "Iniciando sanitizacao de credenciais..." -ForegroundColor Yellow

# Arquivos que contem credenciais sensiveis para remover/sanitizar
$arquivos_sensiveis = @(
    "backend/configurar-railway-completo.js",
    "backend/teste-chave-openai-producao.js", 
    "backend/teste-integracoes-completo-final.js",
    "backend/atualizar-railway-automatico.js",
    "backend/atualizar-railway-corrigido.js",
    "backend/dia4-ia-aguia-sistema-completo.js",
    "backend/gerador-relatorio-aguia-news.js",
    "backend/teste-final-twilio-openai-completo.js",
    "backend/dia5-sms-twilio-avancado-completo.js",
    "backend/dia2-stripe-integration-completa.js"
)

foreach ($arquivo in $arquivos_sensiveis) {
    if (Test-Path $arquivo) {
        Write-Host "Removendo: $arquivo" -ForegroundColor Red
        Remove-Item $arquivo -Force
    }
}

# Criar arquivo .gitignore atualizado
$gitignore_content = @"
# Credenciais e chaves de API
*.key
*.pem
.env
.env.local
.env.production
.env.staging

# Arquivos com credenciais
**/configurar-railway-completo.js
**/teste-chave-openai-producao.js
**/teste-integracoes-completo-final.js
**/atualizar-railway-automatico.js
**/atualizar-railway-corrigido.js
**/dia4-ia-aguia-sistema-completo.js
**/gerador-relatorio-aguia-news.js
**/teste-final-twilio-openai-completo.js
**/dia5-sms-twilio-avancado-completo.js
**/dia2-stripe-integration-completa.js

# Logs e dados temporários
logs/
*.log
temp/
tmp/

# Node modules
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
.next/
out/
dist/
build/

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
"@

Set-Content -Path ".gitignore" -Value $gitignore_content -Encoding UTF8

Write-Host "Sanitizacao concluida! Arquivos sensiveis removidos." -ForegroundColor Green
Write-Host ".gitignore atualizado para prevenir futuras exposicoes." -ForegroundColor Green
