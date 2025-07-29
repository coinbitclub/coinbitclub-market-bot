# 🔥 SCRIPT DE LIMPEZA COMPLETA E FORCE PUSH - SISTEMA V3
# Remove TODOS os arquivos antigos e força Railway a usar main.js

Write-Host "🔥 LIMPEZA COMPLETA PARA DEPLOYMENT V3" -ForegroundColor Red
Write-Host "======================================" -ForegroundColor Red

# 1. Remover TODOS os arquivos conflitantes
Write-Host "🗑️ Removendo arquivos antigos..." -ForegroundColor Yellow

$filesToRemove = @(
    "server-migration-v2.cjs",
    "server-clean.cjs", 
    "server-multiservice-complete.cjs",
    "package-clean.json",
    "package-complete.json",
    "package-migration.json",
    "servidor-integrado-completo.js"
)

foreach ($file in $filesToRemove) {
    if (Test-Path $file) {
        try {
            Remove-Item $file -Force -ErrorAction Stop
            Write-Host "   ❌ REMOVIDO: $file" -ForegroundColor Red
        } catch {
            Write-Host "   ⚠️ Erro ao remover: $file" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ⚪ Não encontrado: $file" -ForegroundColor Gray
    }
}

# 2. Limpar pastas antigas conflitantes
Write-Host "🗂️ Limpando pastas antigas..." -ForegroundColor Yellow
$foldersToRemove = @("api-gateway", "old-versions", "backups")
foreach ($folder in $foldersToRemove) {
    if (Test-Path $folder) {
        try {
            Remove-Item $folder -Recurse -Force -ErrorAction Stop
            Write-Host "   🗂️ PASTA REMOVIDA: $folder" -ForegroundColor Red
        } catch {
            Write-Host "   ⚠️ Erro ao remover pasta: $folder" -ForegroundColor Yellow
        }
    }
}

# 3. Criar package.json LIMPO
Write-Host "📝 Criando package.json LIMPO..." -ForegroundColor Green

$packageContent = @"
{
  "name": "coinbitclub-market-bot",
  "version": "3.0.0",
  "description": "CoinBitClub Market Bot V3 - Sistema Final Integrado",
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

$packageContent | Out-File -FilePath "package.json" -Encoding UTF8
Write-Host "✅ package.json LIMPO criado" -ForegroundColor Green

# 4. Criar railway.toml ESPECÍFICO
Write-Host "🚂 Criando railway.toml ESPECÍFICO..." -ForegroundColor Green

$railwayContent = @"
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "node main.js"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
healthcheckPath = "/health"
healthcheckTimeout = 30

[environments.production.variables]
NODE_ENV = "production"
PORT = "3000"
"@

$railwayContent | Out-File -FilePath "railway.toml" -Encoding UTF8
Write-Host "✅ railway.toml ESPECÍFICO criado" -ForegroundColor Green

# 5. Verificar main.js
Write-Host "🔍 Verificando main.js..." -ForegroundColor Yellow
if (Test-Path "main.js") {
    $mainContent = Get-Content "main.js" -Raw
    if ($mainContent -match "SISTEMA FINAL" -or $mainContent -match "Sistema Final") {
        Write-Host "✅ main.js CONFIRMADO (Sistema V3)" -ForegroundColor Green
    } else {
        Write-Host "⚠️ main.js pode não ser a versão correta" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ ERRO: main.js NÃO ENCONTRADO!" -ForegroundColor Red
    exit 1
}

# 6. Verificar Git
Write-Host "🔍 Verificando repositório Git..." -ForegroundColor Yellow
if (Test-Path ".git") {
    Write-Host "✅ Repositório Git encontrado" -ForegroundColor Green
} else {
    Write-Host "❌ ERRO: Não está em um repositório Git!" -ForegroundColor Red
    exit 1
}

# 7. Executar comandos Git
Write-Host "`n🚀 COMANDOS GIT:" -ForegroundColor Magenta
Write-Host "1. git add ." -ForegroundColor White
Write-Host "2. git commit -m 'FORCE: Deploy Sistema V3'" -ForegroundColor White  
Write-Host "3. git push origin main --force" -ForegroundColor White
Write-Host "`n⚠️ EXECUTANDO EM 3 SEGUNDOS..." -ForegroundColor Yellow

for ($i = 3; $i -gt 0; $i--) {
    Write-Host "⏰ $i..." -ForegroundColor Yellow
    Start-Sleep 1
}

Write-Host "`n🚀 EXECUTANDO FORCE PUSH..." -ForegroundColor Green

try {
    Write-Host "Executando: git add ." -ForegroundColor Cyan
    git add . 
    Write-Host "✅ Arquivos adicionados" -ForegroundColor Green
    
    Write-Host "Executando: git commit..." -ForegroundColor Cyan
    git commit -m "FORCE: Deploy Sistema V3 - Remove arquivos antigos completamente"
    Write-Host "✅ Commit realizado" -ForegroundColor Green
    
    Write-Host "Executando: git push --force..." -ForegroundColor Cyan
    git push origin main --force
    Write-Host "✅ FORCE PUSH REALIZADO!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ ERRO no Git: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n🔧 EXECUTE MANUALMENTE:" -ForegroundColor Yellow
    Write-Host "git add ." -ForegroundColor White
    Write-Host "git commit -m 'FORCE: Deploy Sistema V3'" -ForegroundColor White
    Write-Host "git push origin main --force" -ForegroundColor White
}

Write-Host "`n🎉 DEPLOYMENT FORÇADO CONCLUÍDO!" -ForegroundColor Green
Write-Host "⏰ Aguarde 3-5 minutos para Railway atualizar" -ForegroundColor Yellow
Write-Host "🔗 Teste: https://coinbitclub-market-bot.up.railway.app/health" -ForegroundColor Cyan
Write-Host "🎛️ Painel: https://coinbitclub-market-bot.up.railway.app/control" -ForegroundColor Cyan

Read-Host "`nPressione Enter para continuar"
