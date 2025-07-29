# 🚨 SCRIPT PARA FORÇAR SISTEMA V3 NO RAILWAY
# Remove completamente sistema antigo e força V3

Write-Host "🚨 FORÇANDO SISTEMA V3 - REMOVENDO SISTEMA ANTIGO" -ForegroundColor Red
Write-Host "================================================" -ForegroundColor Red

# 1. Remover TODOS os arquivos antigos
Write-Host "🗑️ REMOVENDO TODOS OS ARQUIVOS ANTIGOS..." -ForegroundColor Yellow

$filesToDelete = @(
    "servidor-integrado-completo.js",
    "servidor-multiservice-complete.js", 
    "server-multiservice-complete.cjs",
    "server-clean.cjs",
    "package-clean.json",
    "multiservice-hybrid.js",
    "servidor-completo.js",
    "app.js"
)

foreach ($file in $filesToDelete) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "   ❌ DELETADO: $file" -ForegroundColor Red
    } else {
        Write-Host "   ✅ Não existe: $file" -ForegroundColor Green
    }
}

# 2. Verificar main.js existe
if (-not (Test-Path "main.js")) {
    Write-Host "❌ ERRO CRÍTICO: main.js não encontrado!" -ForegroundColor Red
    exit 1
}

# 3. Criar package.json LIMPO apontando APENAS para main.js
Write-Host "📝 CRIANDO PACKAGE.JSON LIMPO..." -ForegroundColor Yellow

$cleanPackage = @"
{
  "name": "coinbitclub-market-bot",
  "version": "3.0.0", 
  "description": "CoinBitClub Market Bot V3 Sistema Integrado Final",
  "main": "main.js",
  "scripts": {
    "start": "node main.js"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5", 
    "helmet": "^7.0.0",
    "compression": "^1.7.4",
    "ws": "^8.13.0",
    "pg": "^8.11.3",
    "axios": "^1.4.0"
  }
}
"@

$cleanPackage | Out-File -FilePath "package.json" -Encoding UTF8 -Force
Write-Host "✅ package.json criado apontando para main.js" -ForegroundColor Green

# 4. Criar railway.toml FORÇADO
Write-Host "🚂 CRIANDO RAILWAY.TOML FORÇADO..." -ForegroundColor Yellow

$railwayConfig = @"
[build]
builder = "nixpacks"

[deploy]
startCommand = "node main.js"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "on-failure"
restartPolicyMaxRetries = 10

[build.env]
NODE_ENV = "production"
"@

$railwayConfig | Out-File -FilePath "railway.toml" -Encoding UTF8 -Force
Write-Host "✅ railway.toml criado forçando main.js" -ForegroundColor Green

# 5. Verificar conteúdo do main.js
Write-Host "🔍 VERIFICANDO MAIN.JS..." -ForegroundColor Yellow
$mainContent = Get-Content "main.js" -Raw
if ($mainContent -match "SISTEMA FINAL" -and $mainContent -match "v3\.0\.0-integrated-final") {
    Write-Host "✅ main.js é o Sistema V3 correto!" -ForegroundColor Green
} else {
    Write-Host "❌ ERRO: main.js não é o Sistema V3!" -ForegroundColor Red
}

# 6. Criar .gitignore para não subir arquivos antigos
Write-Host "📝 CRIANDO .GITIGNORE..." -ForegroundColor Yellow
$gitignore = @"
# Arquivos antigos do sistema
servidor-*.js
server-*.cjs
multiservice-*.js
package-clean.json
app.js

# Node modules
node_modules/
npm-debug.log*

# Environment
.env
.env.local
.env.production

# Logs
logs/
*.log
"@

$gitignore | Out-File -FilePath ".gitignore" -Encoding UTF8 -Force
Write-Host "✅ .gitignore criado" -ForegroundColor Green

Write-Host ""
Write-Host "🎯 AGORA EXECUTE ESTES COMANDOS:" -ForegroundColor Cyan
Write-Host "git add ." -ForegroundColor White
Write-Host "git commit -m 'FORÇA SISTEMA V3: Remove arquivos antigos, apenas main.js'" -ForegroundColor White
Write-Host "git push origin main --force" -ForegroundColor White
Write-Host ""
Write-Host "⏰ Aguarde 3-5 minutos para redeploy automático" -ForegroundColor Yellow
Write-Host "🔗 Teste: https://coinbitclub-market-bot.up.railway.app/health" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Se aparecer 'v3.0.0-integrated-final' = SUCESSO!" -ForegroundColor Green
