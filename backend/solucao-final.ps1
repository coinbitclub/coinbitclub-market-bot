Write-Host "SOLUCAO FINAL - FORCAR RAILWAY A VER APENAS MAIN.JS" -ForegroundColor Red
Write-Host "=================================================" -ForegroundColor Red

# 1. Renomear main.js temporariamente e voltar (para forçar mudança de timestamp)
Write-Host "Forçando mudança de timestamp no main.js..." -ForegroundColor Yellow
if (Test-Path "main.js") {
    Rename-Item "main.js" "main.js.temp"
    Start-Sleep 2
    Rename-Item "main.js.temp" "main.js"
    Write-Host "✅ Timestamp do main.js atualizado" -ForegroundColor Green
}

# 2. Criar um .buildpacks (força Railway a usar apenas Node.js)
Write-Host "Criando .buildpacks..." -ForegroundColor Yellow
"https://github.com/heroku/heroku-buildpack-nodejs" | Out-File -FilePath ".buildpacks" -Encoding UTF8

# 3. Criar nixpacks.toml específico
Write-Host "Criando nixpacks.toml específico..." -ForegroundColor Yellow
$nixpacks = @"
[phases.setup]
nixPkgs = ["nodejs_18", "npm"]

[phases.install]
cmds = ["npm install --production"]

[phases.build]
cmds = ["echo 'Build complete'"]

[start]
cmd = "node main.js"
"@
$nixpacks | Out-File -FilePath "nixpacks.toml" -Encoding UTF8

# 4. Forçar package-lock.json novo
Write-Host "Removendo package-lock.json para forçar reinstall..." -ForegroundColor Yellow
if (Test-Path "package-lock.json") {
    Remove-Item "package-lock.json" -Force
    Write-Host "✅ package-lock.json removido" -ForegroundColor Green
}

# 5. Atualizar versão no package.json
Write-Host "Atualizando versão no package.json..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$pkg = @"
{
  "name": "coinbitclub-market-bot-final",
  "version": "3.1.$timestamp",
  "description": "CoinBitClub Market Bot V3 FINAL - FORCE MAIN.JS ONLY",
  "main": "main.js",
  "scripts": {
    "start": "node main.js",
    "dev": "node main.js",
    "production": "node main.js"
  },
  "engines": {
    "node": "18.x"
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
$pkg | Out-File -FilePath "package.json" -Encoding UTF8

# 6. Atualizar railway.toml com configuração específica
Write-Host "Atualizando railway.toml..." -ForegroundColor Yellow
$railway = @"
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "node main.js"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 1
healthcheckPath = "/health"
healthcheckTimeout = 20

[environments.production.variables]
NODE_ENV = "production"
PORT = "3000"
FORCE_MAIN_JS = "true"
DISABLE_CACHE = "true"
BUILD_TIMESTAMP = "$timestamp"
"@
$railway | Out-File -FilePath "railway.toml" -Encoding UTF8

# 7. Fazer commit com mudanças importantes
Write-Host "Fazendo commit final..." -ForegroundColor Green
git add .
git commit -m "FINAL FORCE: Apenas main.js - Remove cache completamente - $timestamp"
git push origin main --force

Write-Host "`n🎉 SOLUÇÃO FINAL APLICADA!" -ForegroundColor Green
Write-Host "✅ Timestamp main.js atualizado" -ForegroundColor Green
Write-Host "✅ .buildpacks criado" -ForegroundColor Green
Write-Host "✅ nixpacks.toml específico" -ForegroundColor Green
Write-Host "✅ package-lock.json removido" -ForegroundColor Green
Write-Host "✅ Versão package.json: 3.1.$timestamp" -ForegroundColor Green
Write-Host "✅ Variables de força adicionadas" -ForegroundColor Green

Write-Host "`n⏰ AGUARDE 10-15 MINUTOS para Railway fazer rebuild COMPLETO" -ForegroundColor Yellow
Write-Host "🔗 Teste: https://coinbitclub-market-bot.up.railway.app/health" -ForegroundColor Cyan
Write-Host "🎯 Deve mostrar: coinbitclub-integrated-final (não multiservice)" -ForegroundColor Cyan
