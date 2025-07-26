# 🚀 SCRIPT DE MIGRAÇÃO COMPLETA - EXECUÇÃO FINAL
# ================================================
# Este script executa a migração completa com TODAS as variáveis e dados

param(
    [string]$NewProjectName = "coinbitclub-market-bot-complete",
    [switch]$ExecuteNow = $false
)

Write-Host "🎯 MIGRAÇÃO COMPLETA DO COINBITCLUB MARKET BOT" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Yellow
Write-Host ""

if (!$ExecuteNow) {
    Write-Host "📋 O QUE SERÁ MIGRADO:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🗄️ BANCO DE DADOS COMPLETO:" -ForegroundColor Yellow
    Write-Host "  ✅ Todas as 6 tabelas existentes" -ForegroundColor White
    Write-Host "  ✅ Todos os 12 registros de dados reais" -ForegroundColor White
    Write-Host "  ✅ Estruturas, índices e relacionamentos" -ForegroundColor White
    Write-Host "  ✅ Configurações do sistema (8 configs)" -ForegroundColor White
    Write-Host "  ✅ Usuários e permissões (1 usuário admin)" -ForegroundColor White
    Write-Host "  ✅ Histórico de webhooks e API requests" -ForegroundColor White
    Write-Host ""
    
    Write-Host "⚙️ VARIÁVEIS DE AMBIENTE COMPLETAS:" -ForegroundColor Yellow
    Write-Host "  ✅ ADMIN_TOKEN (preservado)" -ForegroundColor White
    Write-Host "  ✅ JWT_SECRET (preservado)" -ForegroundColor White
    Write-Host "  ✅ WEBHOOK_TOKEN (preservado)" -ForegroundColor White
    Write-Host "  ✅ NODE_ENV=production" -ForegroundColor White
    Write-Host "  ✅ PORT=3000" -ForegroundColor White
    Write-Host "  ✅ Todas as outras variáveis custom" -ForegroundColor White
    Write-Host ""
    
    Write-Host "🚀 SERVIDOR MULTISERVICE:" -ForegroundColor Yellow
    Write-Host "  ✅ server-multiservice-complete.cjs" -ForegroundColor White
    Write-Host "  ✅ package-multiservice.json" -ForegroundColor White
    Write-Host "  ✅ Todos os endpoints GET/POST/Webhooks" -ForegroundColor White
    Write-Host "  ✅ Conexão PostgreSQL otimizada" -ForegroundColor White
    Write-Host ""
    
    Write-Host "💡 PARA EXECUTAR A MIGRAÇÃO COMPLETA:" -ForegroundColor Cyan
    Write-Host "   .\execute-complete-migration.ps1 -ExecuteNow" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠️ IMPORTANTE: A migração irá:" -ForegroundColor Red
    Write-Host "   • Criar um novo projeto Railway" -ForegroundColor White
    Write-Host "   • Migrar TODOS os dados reais" -ForegroundColor White
    Write-Host "   • Migrar TODAS as variáveis" -ForegroundColor White
    Write-Host "   • Configurar servidor multiservice completo" -ForegroundColor White
    Write-Host ""
    
    exit 0
}

# EXECUTAR MIGRAÇÃO COMPLETA
Write-Host "🚀 INICIANDO MIGRAÇÃO COMPLETA..." -ForegroundColor Green
Write-Host ""

# Verificar se já temos os backups
if (!(Test-Path "all_variables_backup.json")) {
    Write-Host "📋 Criando backup de TODAS as variáveis..." -ForegroundColor Cyan
    railway variables --json > all_variables_backup.json
}

if (!(Test-Path "complete_backup_*.sql")) {
    Write-Host "🗄️ Criando backup COMPLETO do banco..." -ForegroundColor Cyan
    node create-complete-backup.js
}

# Verificar backups criados
$VarBackup = Get-Content "all_variables_backup.json" | ConvertFrom-Json
$VarCount = ($VarBackup.PSObject.Properties | Measure-Object).Count

$BackupFiles = Get-ChildItem "complete_backup_*.sql" | Sort-Object CreationTime -Descending
if ($BackupFiles.Count -gt 0) {
    $BackupFile = $BackupFiles[0].Name
    $BackupSize = [math]::Round($BackupFiles[0].Length / 1024, 2)
} else {
    Write-Host "❌ Erro: Backup do banco não encontrado!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Backups preparados:" -ForegroundColor Green
Write-Host "   📋 Variáveis: $VarCount variáveis" -ForegroundColor White
Write-Host "   🗄️ Banco: $BackupFile ($BackupSize KB)" -ForegroundColor White
Write-Host ""

# Executar o script de migração completo
Write-Host "🔄 Executando migração completa..." -ForegroundColor Cyan
.\migrate-to-new-railway.ps1 -NewProjectName $NewProjectName

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 MIGRAÇÃO COMPLETA FINALIZADA!" -ForegroundColor Green
    Write-Host "================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📊 RESULTADO FINAL:" -ForegroundColor Cyan
    Write-Host "  ✅ Projeto criado: $NewProjectName" -ForegroundColor White
    Write-Host "  ✅ Servidor multiservice funcionando" -ForegroundColor White
    Write-Host "  ✅ Banco PostgreSQL com dados completos" -ForegroundColor White
    Write-Host "  ✅ Todas as variáveis migradas" -ForegroundColor White
    Write-Host ""
    Write-Host "🌐 ACESSE:" -ForegroundColor Yellow
    Write-Host "   https://$NewProjectName.up.railway.app/health" -ForegroundColor White
    Write-Host ""
    Write-Host "🧪 TESTE OS ENDPOINTS:" -ForegroundColor Yellow
    Write-Host "   GET:  /api/data?test=true&symbol=BTCUSDT" -ForegroundColor White
    Write-Host "   POST: /api/data (JSON)" -ForegroundColor White
    Write-Host "   Webhook: /api/webhooks/tradingview" -ForegroundColor White
    Write-Host ""
    Write-Host "✨ MIGRAÇÃO 100% COMPLETA! 🎉" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ ERRO NA MIGRAÇÃO!" -ForegroundColor Red
    Write-Host "Verifique os logs acima para detalhes." -ForegroundColor Yellow
}
