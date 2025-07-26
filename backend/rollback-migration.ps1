# 🔄 SCRIPT DE ROLLBACK - MIGRAÇÃO RAILWAY
# Em caso de problemas na migração, este script reverte as alterações
# Execute: .\rollback-migration.ps1

param(
    [switch]$Force = $false,
    [switch]$KeepBackups = $false
)

$ErrorActionPreference = "Stop"

Write-Host "🔄 ROLLBACK DA MIGRAÇÃO RAILWAY" -ForegroundColor Red
Write-Host "===============================" -ForegroundColor Yellow
Write-Host ""

# Verificar se realmente quer fazer rollback
if (!$Force) {
    Write-Host "⚠️ ATENÇÃO: Este script irá reverter a migração!" -ForegroundColor Red
    Write-Host "📋 Ações que serão realizadas:" -ForegroundColor Yellow
    Write-Host "   • Restaurar arquivos de backup" -ForegroundColor White
    Write-Host "   • Reconectar ao projeto original" -ForegroundColor White
    Write-Host "   • Restaurar variáveis de ambiente" -ForegroundColor White
    Write-Host "   • Gerar relatório de rollback" -ForegroundColor White
    Write-Host ""
    
    $confirm = Read-Host "Deseja continuar? (sim/não)"
    if ($confirm -ne "sim") {
        Write-Host "❌ Rollback cancelado pelo usuário" -ForegroundColor Yellow
        exit 0
    }
}

Write-Host "🚀 Iniciando processo de rollback..." -ForegroundColor Green
Write-Host ""

# FASE 1: VERIFICAR BACKUPS
Write-Host "💾 FASE 1: VERIFICANDO BACKUPS" -ForegroundColor Magenta
Write-Host "==============================" -ForegroundColor Yellow

$BackupFiles = @(
    "backup_variables.json",
    ".env.backup-migration",
    ".env.production.backup-migration",
    "api-gateway/.env.backup-migration",
    "api-gateway/.env.production.backup-migration"
)

$AvailableBackups = @()

foreach ($BackupFile in $BackupFiles) {
    if (Test-Path $BackupFile) {
        Write-Host "✅ Backup encontrado: $BackupFile" -ForegroundColor Green
        $AvailableBackups += $BackupFile
    } else {
        Write-Host "⚠️ Backup não encontrado: $BackupFile" -ForegroundColor Yellow
    }
}

if ($AvailableBackups.Count -eq 0) {
    Write-Host "❌ Nenhum backup encontrado - rollback não é possível" -ForegroundColor Red
    Write-Host "💡 Verifique se os arquivos de backup existem" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📊 Total de backups encontrados: $($AvailableBackups.Count)" -ForegroundColor Green
Write-Host ""

# FASE 2: RESTAURAR ARQUIVOS
Write-Host "📁 FASE 2: RESTAURANDO ARQUIVOS" -ForegroundColor Magenta
Write-Host "===============================" -ForegroundColor Yellow

$RestoredFiles = @()

# Restaurar arquivos .env
$EnvBackups = $AvailableBackups | Where-Object { $_ -like "*.backup-migration" }

foreach ($BackupFile in $EnvBackups) {
    $OriginalFile = $BackupFile -replace "\.backup-migration$", ""
    
    if (Test-Path $BackupFile) {
        Write-Host "🔄 Restaurando: $OriginalFile" -ForegroundColor Cyan
        
        # Fazer backup do arquivo atual (por precaução)
        if (Test-Path $OriginalFile) {
            $RollbackBackup = "$OriginalFile.rollback-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
            Copy-Item $OriginalFile $RollbackBackup
            Write-Host "   💾 Backup do arquivo atual: $RollbackBackup" -ForegroundColor Gray
        }
        
        # Restaurar do backup
        Copy-Item $BackupFile $OriginalFile -Force
        Write-Host "   ✅ $OriginalFile restaurado" -ForegroundColor Green
        $RestoredFiles += $OriginalFile
    }
}

Write-Host ""
Write-Host "📊 Arquivos restaurados: $($RestoredFiles.Count)" -ForegroundColor Green
Write-Host ""

# FASE 3: RECONECTAR AO PROJETO ORIGINAL
Write-Host "🔗 FASE 3: RECONECTANDO AO PROJETO ORIGINAL" -ForegroundColor Magenta
Write-Host "===========================================" -ForegroundColor Yellow

# Verificar se Railway CLI está disponível
if (!(Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️ Railway CLI não encontrado - pular reconexão" -ForegroundColor Yellow
} else {
    Write-Host "🔐 Fazendo login no Railway..." -ForegroundColor Cyan
    railway login
    
    Write-Host "🔗 Conectando ao projeto original..." -ForegroundColor Cyan
    railway link coinbitclub-market-bot
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Reconectado ao projeto original" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Erro ao reconectar - faça manualmente" -ForegroundColor Yellow
    }
}

Write-Host ""

# FASE 4: RESTAURAR VARIÁVEIS DE AMBIENTE
Write-Host "🔧 FASE 4: RESTAURANDO VARIÁVEIS" -ForegroundColor Magenta
Write-Host "================================" -ForegroundColor Yellow

if (Test-Path "backup_variables.json") {
    Write-Host "📋 Carregando variáveis do backup..." -ForegroundColor Cyan
    
    $BackupVars = Get-Content "backup_variables.json" | ConvertFrom-Json
    
    # Lista de variáveis críticas para restaurar
    $CriticalVars = @(
        "DATABASE_URL",
        "OPENAI_API_KEY",
        "JWT_SECRET",
        "STRIPE_SECRET_KEY",
        "STRIPE_PUBLISHABLE_KEY",
        "REACT_APP_API_URL",
        "FRONTEND_URL"
    )
    
    $RestoredVars = @()
    
    foreach ($VarName in $CriticalVars) {
        if ($BackupVars.$VarName) {
            Write-Host "🔧 Restaurando $VarName..." -ForegroundColor Cyan
            
            if (Get-Command railway -ErrorAction SilentlyContinue) {
                railway variables set "$VarName=$($BackupVars.$VarName)"
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "  ✅ $VarName restaurada" -ForegroundColor Green
                    $RestoredVars += $VarName
                } else {
                    Write-Host "  ⚠️ Erro ao restaurar $VarName" -ForegroundColor Yellow
                }
            } else {
                Write-Host "  ⚠️ Railway CLI não disponível - restaure manualmente" -ForegroundColor Yellow
            }
        }
    }
    
    Write-Host ""
    Write-Host "📊 Variáveis restauradas: $($RestoredVars.Count)" -ForegroundColor Green
} else {
    Write-Host "⚠️ backup_variables.json não encontrado" -ForegroundColor Yellow
}

Write-Host ""

# FASE 5: LIMPEZA (OPCIONAL)
Write-Host "🧹 FASE 5: LIMPEZA" -ForegroundColor Magenta
Write-Host "==================" -ForegroundColor Yellow

$MigrationFiles = @(
    "server-migration-v2.cjs",
    "Dockerfile.migration",
    "railway-migration-v2.toml",
    "package-migration.json",
    "test-migration.js",
    "update-urls-after-migration.js",
    "migration-info.json",
    "migration-urls-report.json",
    "update-railway-urls.ps1"
)

if (!$KeepBackups) {
    Write-Host "🗑️ Removendo arquivos de migração..." -ForegroundColor Cyan
    
    $RemovedFiles = @()
    
    foreach ($File in $MigrationFiles) {
        if (Test-Path $File) {
            Remove-Item $File -Force
            Write-Host "  🗑️ Removido: $File" -ForegroundColor Gray
            $RemovedFiles += $File
        }
    }
    
    # Remover backups se solicitado
    Write-Host "🗑️ Removendo arquivos de backup..." -ForegroundColor Cyan
    
    foreach ($BackupFile in $AvailableBackups) {
        if (Test-Path $BackupFile) {
            Remove-Item $BackupFile -Force
            Write-Host "  🗑️ Removido: $BackupFile" -ForegroundColor Gray
            $RemovedFiles += $BackupFile
        }
    }
    
    Write-Host ""
    Write-Host "📊 Arquivos removidos: $($RemovedFiles.Count)" -ForegroundColor Green
    
} else {
    Write-Host "💾 Mantendo arquivos de backup (--KeepBackups)" -ForegroundColor Yellow
}

Write-Host ""

# FASE 6: GERAR RELATÓRIO DE ROLLBACK
Write-Host "📊 FASE 6: GERANDO RELATÓRIO" -ForegroundColor Magenta
Write-Host "============================" -ForegroundColor Yellow

$RollbackReport = @{
    rollback_date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    rollback_reason = "Manual rollback execution"
    restored_files = $RestoredFiles
    restored_variables = $RestoredVars
    original_project = "coinbitclub-market-bot"
    original_url = "https://coinbitclub-market-bot-production.up.railway.app"
    next_steps = @(
        "Verificar se o projeto original está funcionando",
        "Testar endpoints críticos",
        "Monitorar logs por possíveis problemas",
        "Avaliar causa da necessidade de rollback"
    )
    backup_info = @{
        backups_found = $AvailableBackups.Count
        backups_used = $AvailableBackups
        backups_kept = $KeepBackups
    }
}

$RollbackReport | ConvertTo-Json -Depth 3 | Out-File "rollback-report.json" -Encoding UTF8

Write-Host "📄 Relatório de rollback salvo: rollback-report.json" -ForegroundColor Green
Write-Host ""

# RESUMO FINAL
Write-Host "🎯 ROLLBACK CONCLUÍDO" -ForegroundColor Green
Write-Host "=====================" -ForegroundColor Yellow
Write-Host ""

Write-Host "📊 RESUMO DO ROLLBACK:" -ForegroundColor Cyan
Write-Host "  • Arquivos restaurados: $($RestoredFiles.Count)" -ForegroundColor White
Write-Host "  • Variáveis restauradas: $($RestoredVars.Count)" -ForegroundColor White
Write-Host "  • Projeto reconectado: coinbitclub-market-bot" -ForegroundColor White
Write-Host "  • URL original: https://coinbitclub-market-bot-production.up.railway.app" -ForegroundColor White
Write-Host ""

Write-Host "🔧 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "  1. ✅ Testar a URL original: https://coinbitclub-market-bot-production.up.railway.app/health" -ForegroundColor White
Write-Host "  2. 🧪 Executar testes completos" -ForegroundColor White
Write-Host "  3. 📊 Monitorar logs: railway logs -f" -ForegroundColor White
Write-Host "  4. 🔍 Investigar causa do problema na migração" -ForegroundColor White
Write-Host ""

Write-Host "⚠️ IMPORTANTE:" -ForegroundColor Red
Write-Host "  • Verifique se todos os sistemas estão funcionando" -ForegroundColor White
Write-Host "  • Monitore por possíveis problemas" -ForegroundColor White
Write-Host "  • Considere nova tentativa de migração após correções" -ForegroundColor White
Write-Host ""

Write-Host "✅ Rollback finalizado com sucesso! 🎉" -ForegroundColor Green
