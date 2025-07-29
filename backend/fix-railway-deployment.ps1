# 🚀 Script para Forçar Atualização do Railway
# Resolve o problema do sistema antigo persistindo

Write-Host "🔄 FORÇANDO ATUALIZAÇÃO DO SISTEMA NO RAILWAY" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

# 1. Substituir package.json com configuração correta
Write-Host "📝 Atualizando package.json..." -ForegroundColor Yellow

$packageJson = @"
{
  "name": "coinbitclub-market-bot",
  "version": "3.0.0",
  "description": "CoinBitClub Market Bot V3 - Sistema Integrado Final",
  "main": "main.js",
  "scripts": {
    "start": "node main.js",
    "production": "NODE_ENV=production node main.js"
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

$packageJson | Out-File -FilePath "package.json" -Encoding UTF8
Write-Host "✅ package.json atualizado para main.js" -ForegroundColor Green

# 2. Remover arquivos antigos que podem estar causando conflito
Write-Host "🗑️ Removendo arquivos conflitantes..." -ForegroundColor Yellow

$filesToRemove = @(
    "server-clean.cjs",
    "server-multiservice-complete.cjs",
    "package-clean.json"
)

foreach ($file in $filesToRemove) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "   ❌ Removido: $file" -ForegroundColor Red
    }
}

# 3. Verificar se main.js existe
if (Test-Path "main.js") {
    Write-Host "✅ main.js encontrado (Sistema V3)" -ForegroundColor Green
} else {
    Write-Host "❌ ERRO: main.js não encontrado!" -ForegroundColor Red
    exit 1
}

# 4. Verificar railway.toml
Write-Host "🔧 Verificando railway.toml..." -ForegroundColor Yellow
if (Test-Path "railway.toml") {
    $railwayContent = Get-Content "railway.toml" -Raw
    if ($railwayContent -match "main\.js") {
        Write-Host "✅ railway.toml já configurado para main.js" -ForegroundColor Green
    } else {
        Write-Host "⚠️ railway.toml pode precisar de atualização" -ForegroundColor Yellow
    }
}

# 5. Executar Git Push Automaticamente
Write-Host ""
Write-Host "🚀 EXECUTANDO GIT PUSH..." -ForegroundColor Cyan

# Verificar se está no repositório git
if (Test-Path ".git") {
    Write-Host "✅ Repositório Git encontrado" -ForegroundColor Green
    
    try {
        # Adicionar arquivos
        git add .
        Write-Host "✅ Arquivos adicionados ao staging" -ForegroundColor Green
        
        # Commit
        git commit -m "FIX: Força deployment Sistema V3 - Remove arquivos conflitantes"
        Write-Host "✅ Commit realizado" -ForegroundColor Green
        
        # Push
        git push origin main
        Write-Host "✅ PUSH REALIZADO COM SUCESSO!" -ForegroundColor Green
        
    } catch {
        Write-Host "❌ ERRO no Git: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Execute manualmente:" -ForegroundColor Yellow
        Write-Host "  git add ." -ForegroundColor White
        Write-Host "  git commit -m 'FIX: Deploy Sistema V3'" -ForegroundColor White
        Write-Host "  git push origin main" -ForegroundColor White
    }
} else {
    Write-Host "❌ Não está em repositório Git. Execute manualmente:" -ForegroundColor Red
    Write-Host "  git add ." -ForegroundColor White
    Write-Host "  git commit -m 'FIX: Deploy Sistema V3'" -ForegroundColor White
    Write-Host "  git push origin main" -ForegroundColor White
}

Write-Host ""
Write-Host "🎯 DEPLOYMENT INICIADO!" -ForegroundColor Green
Write-Host "⏰ Aguarde 3-5 minutos para Railway processar" -ForegroundColor Yellow
Write-Host "🔗 Teste: https://coinbitclub-market-bot.up.railway.app/health" -ForegroundColor Cyan
Write-Host "🎛️ Painel: https://coinbitclub-market-bot.up.railway.app/control" -ForegroundColor Cyan
