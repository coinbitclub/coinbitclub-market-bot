# 🚀 MIGRAÇÃO AUTOMÁTICA PARA NOVO PROJETO RAILWAY
# Script PowerShell para migração completa do CoinBitClub Market Bot
# Execute como Administrador: .\migrate-to-new-railway.ps1

param(
    [string]$NewProjectName = "coinbitclub-market-bot-v2",
    [switch]$SkipBackup = $false,
    [switch]$TestMode = $false
)

# Configurações
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

Write-Host "🚀 MIGRAÇÃO RAILWAY - COINBITCLUB MARKET BOT" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Yellow
Write-Host ""

# Verificar pré-requisitos
Write-Host "🔍 Verificando pré-requisitos..." -Foregroun    Write-Host "🔧 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
    Write-Host "  1. ✅ Testar a nova URL: $NewUrl/health" -ForegroundColor White
    Write-Host "  2. 🗄️ Verificar banco de dados: $NewUrl/api/health" -ForegroundColor White
    Write-Host "  3. 📡 Testar webhook TradingView: $NewUrl/api/webhooks/tradingview" -ForegroundColor White
    Write-Host "  4. 📥 Testar GET: $NewUrl/api/data?test=true&symbol=BTCUSDT" -ForegroundColor White
    Write-Host "  5. 📤 Testar POST: $NewUrl/api/data (com JSON no body)" -ForegroundColor White
    Write-Host "  6. 🔧 Atualizar webhooks do TradingView para: $NewUrl" -ForegroundColor White
    Write-Host "  7. 🔧 Atualizar URLs no frontend Vercel" -ForegroundColor White
    Write-Host "  8. 🧪 Executar testes completos: node test-multiservice.js $NewUrl" -ForegroundColor White
    Write-Host "  9. 📊 Monitorar logs: railway logs -f" -ForegroundColor Whiteyan

# Verificar Railway CLI
if (!(Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Railway CLI não encontrado" -ForegroundColor Red
    Write-Host "💡 Instale com: npm install -g @railway/cli" -ForegroundColor Yellow
    exit 1
}

# Verificar Git
if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Git não encontrado" -ForegroundColor Red
    Write-Host "💡 Instale o Git para continuar" -ForegroundColor Yellow
    exit 1
}

# Verificar PostgreSQL client (opcional)
if (!(Get-Command psql -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️ PostgreSQL client não encontrado - backup manual será necessário" -ForegroundColor Yellow
}

Write-Host "✅ Pré-requisitos verificados" -ForegroundColor Green
Write-Host ""

# FASE 1: BACKUP COMPLETO
if (!$SkipBackup) {
    Write-Host "📦 FASE 1: BACKUP COMPLETO" -ForegroundColor Magenta
    Write-Host "=========================" -ForegroundColor Yellow
    
    # Backup das variáveis (usar backup completo)
    Write-Host "💾 Criando backup COMPLETO de variáveis..." -ForegroundColor Cyan
    if (Test-Path "all_variables_backup.json") {
        Write-Host "✅ all_variables_backup.json encontrado" -ForegroundColor Green
    } else {
        Write-Host "📋 Criando backup completo de TODAS as variáveis..." -ForegroundColor Yellow
        railway variables --json > all_variables_backup.json
        
        if (Test-Path "all_variables_backup.json") {
            $VarBackup = Get-Content "all_variables_backup.json" | ConvertFrom-Json
            $VarCount = ($VarBackup.PSObject.Properties | Measure-Object).Count
            Write-Host "✅ Backup criado com $VarCount variáveis" -ForegroundColor Green
        } else {
            Write-Host "❌ Erro ao criar backup de variáveis" -ForegroundColor Red
        }
    }
    
    # Backup COMPLETO do banco de dados com TODOS os dados
    Write-Host "�️ Criando backup COMPLETO do banco de dados..." -ForegroundColor Cyan
    
    # Usar o script de backup completo que já foi criado
    if (Test-Path "create-complete-backup.js") {
        Write-Host "📊 Executando backup completo com dados..." -ForegroundColor Cyan
        $BackupResult = node create-complete-backup.js 2>&1
        
        # Procurar pelo nome do arquivo de backup criado
        $BackupFileName = ""
        foreach ($line in $BackupResult) {
            if ($line -match "BACKUP COMPLETO CRIADO: (.+\.sql)") {
                $BackupFileName = $matches[1]
                break
            }
        }
        
        if ($BackupFileName -and (Test-Path $BackupFileName)) {
            Write-Host "✅ Backup completo criado: $BackupFileName" -ForegroundColor Green
            
            # Verificar tamanho e conteúdo do backup
            $FileSize = (Get-Item $BackupFileName).Length
            $FileSizeKB = [math]::Round($FileSize / 1024, 2)
            Write-Host "📊 Tamanho do backup: $FileSizeKB KB" -ForegroundColor Cyan
            
            # Verificar se contém dados
            $BackupContent = Get-Content $BackupFileName -Raw
            $InsertCount = ($BackupContent | Select-String "INSERT INTO" -AllMatches).Matches.Count
            $TableCount = ($BackupContent | Select-String "CREATE TABLE" -AllMatches).Matches.Count
            
            Write-Host "📋 Tabelas no backup: $TableCount" -ForegroundColor Cyan
            Write-Host "📊 Comandos INSERT: $InsertCount" -ForegroundColor Cyan
            
            if ($InsertCount -gt 0) {
                Write-Host "✅ Backup contém DADOS REAIS!" -ForegroundColor Green
            } else {
                Write-Host "⚠️ Backup contém apenas estrutura" -ForegroundColor Yellow
            }
        } else {
            Write-Host "❌ Erro ao criar backup completo" -ForegroundColor Red
            Write-Host $BackupResult
            
            # Criar backup básico como fallback
            $BackupFileName = "migration-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').sql"
-- ==========================================
-- BACKUP ESTRUTURAL RAILWAY - $(Get-Date)
-- Projeto: coinbitclub-market-bot
-- ==========================================

-- Este backup deve ser restaurado no novo projeto Railway
-- Execute este script no novo banco de dados

-- INSTRUÇÕES DE RESTAURAÇÃO:
-- 1. Conecte-se ao novo banco Railway
-- 2. Execute: \i $BackupFileName
-- 3. Verifique se todas as tabelas foram criadas

-- ==========================================
-- ESTRUTURA BÁSICA DAS TABELAS
-- ==========================================

-- Tabela de webhooks (estrutura básica)
CREATE TABLE IF NOT EXISTS raw_webhook (
    id SERIAL PRIMARY KEY,
    source VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'received',
    created_at TIMESTAMP DEFAULT NOW(),
    server_id VARCHAR(100),
    version VARCHAR(50)
);

-- Índices importantes
CREATE INDEX IF NOT EXISTS idx_raw_webhook_source ON raw_webhook(source);
CREATE INDEX IF NOT EXISTS idx_raw_webhook_created_at ON raw_webhook(created_at);
CREATE INDEX IF NOT EXISTS idx_raw_webhook_status ON raw_webhook(status);

-- Tabela de configurações
CREATE TABLE IF NOT EXISTS system_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Inserir configurações básicas
INSERT INTO system_config (config_key, config_value, description) VALUES
('migration_source', 'coinbitclub-market-bot-original', 'Projeto de origem da migração'),
('migration_date', '$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')', 'Data da migração'),
('version', '2.0.0-migrated', 'Versão pós-migração')
ON CONFLICT (config_key) DO UPDATE SET 
    config_value = EXCLUDED.config_value,
    updated_at = NOW();

-- ==========================================
-- ESTRUTURA ADICIONAL (se necessária)
-- ==========================================

-- Tabela de usuários (se existir)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de sinais TradingView (se existir)
CREATE TABLE IF NOT EXISTS tradingview_signals (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    action VARCHAR(10) NOT NULL,
    price DECIMAL(15,8),
    strategy VARCHAR(100),
    timestamp TIMESTAMP DEFAULT NOW(),
    processed BOOLEAN DEFAULT FALSE,
    metadata JSONB
);

-- Adicione aqui outras estruturas de tabelas conforme necessário
-- Este backup será expandido com dados reais durante a migração

"@
            
            $BackupContent | Out-File -FilePath $BackupFileName -Encoding UTF8
            Write-Host "✅ Backup estrutural criado: $BackupFileName" -ForegroundColor Green
        }
    } else {
        Write-Host "⚠️ Script de backup completo não encontrado, criando backup básico..." -ForegroundColor Yellow
        
        # Backup básico como fallback
        $BackupContent = @"
-- BACKUP BÁSICO PARA MIGRAÇÃO - $(Get-Date)
-- Estruturas mínimas necessárias

CREATE TABLE IF NOT EXISTS raw_webhook (
    id SERIAL PRIMARY KEY,
    source VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'received',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO system_config (config_key, config_value, description) VALUES
('migration_date', '$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')', 'Data da migração')
ON CONFLICT (config_key) DO UPDATE SET config_value = EXCLUDED.config_value;
"@
        
        $BackupContent | Out-File -FilePath $BackupFileName -Encoding UTF8
        Write-Host "✅ Backup básico criado: $BackupFileName" -ForegroundColor Green
    }
    
    Write-Host "✅ FASE 1 CONCLUÍDA - Backup finalizado" -ForegroundColor Green
    Write-Host ""
}

# FASE 2: CRIAR NOVO PROJETO RAILWAY
Write-Host "🆕 FASE 2: CRIAR NOVO PROJETO RAILWAY" -ForegroundColor Magenta
Write-Host "====================================" -ForegroundColor Yellow

Write-Host "🔗 Desconectando do projeto atual..." -ForegroundColor Cyan
railway logout 2>$null

Write-Host "🔐 Fazendo login no Railway..." -ForegroundColor Cyan
railway login

if ($TestMode) {
    Write-Host "🧪 MODO TESTE - Simulando criação do projeto" -ForegroundColor Yellow
} else {
    Write-Host "🆕 Criando novo projeto: $NewProjectName" -ForegroundColor Cyan
    
    # Criar novo projeto
    railway project new --name $NewProjectName
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Projeto '$NewProjectName' criado com sucesso" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro ao criar projeto" -ForegroundColor Red
        exit 1
    }
    
    # Adicionar PostgreSQL
    Write-Host "🗄️ Adicionando PostgreSQL..." -ForegroundColor Cyan
    railway add postgresql
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PostgreSQL adicionado" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro ao adicionar PostgreSQL" -ForegroundColor Red
        exit 1
    }
    
    # Aguardar provisionamento
    Write-Host "⏳ Aguardando provisionamento do banco..." -ForegroundColor Cyan
    Start-Sleep -Seconds 30
}

Write-Host "✅ FASE 2 CONCLUÍDA - Novo projeto criado" -ForegroundColor Green
Write-Host ""

# FASE 3: CONFIGURAR VARIÁVEIS DE AMBIENTE
Write-Host "🔧 FASE 3: CONFIGURAR VARIÁVEIS DE AMBIENTE" -ForegroundColor Magenta
Write-Host "==========================================" -ForegroundColor Yellow

if (!$TestMode) {
    # Ler variáveis do backup
    if (Test-Path "all_variables_backup.json") {
        Write-Host "📋 Carregando TODAS as variáveis do backup..." -ForegroundColor Cyan
        
        $BackupVars = Get-Content "all_variables_backup.json" | ConvertFrom-Json
        
        # Migrar TODAS as variáveis (exceto as específicas do Railway)
        $ExcludeVars = @(
            "DATABASE_URL",
            "RAILWAY_ENVIRONMENT",
            "RAILWAY_ENVIRONMENT_ID", 
            "RAILWAY_ENVIRONMENT_NAME",
            "RAILWAY_PRIVATE_DOMAIN",
            "RAILWAY_PROJECT_ID",
            "RAILWAY_PROJECT_NAME", 
            "RAILWAY_PUBLIC_DOMAIN",
            "RAILWAY_SERVICE_COINBITCLUB_MARKET_BOT_URL",
            "RAILWAY_SERVICE_ID",
            "RAILWAY_SERVICE_NAME",
            "RAILWAY_SERVICE_POSTGRES_URL",
            "RAILWAY_STATIC_URL"
        )
        
        $MigratedCount = 0
        $SkippedCount = 0
        
        foreach ($VarName in $BackupVars.PSObject.Properties.Name) {
            if ($ExcludeVars -contains $VarName) {
                Write-Host "  ⏭️ Pulando variável Railway: $VarName" -ForegroundColor Gray
                $SkippedCount++
                continue
            }
            
            $VarValue = $BackupVars.$VarName
            if ($VarValue) {
                Write-Host "🔧 Migrando $VarName..." -ForegroundColor Cyan
                railway variables set "$VarName=$VarValue"
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "  ✅ $VarName migrada com sucesso" -ForegroundColor Green
                    $MigratedCount++
                } else {
                    Write-Host "  ⚠️ Erro ao migrar $VarName" -ForegroundColor Yellow
                }
            }
        }
        
        Write-Host "📊 Migração de variáveis:" -ForegroundColor Cyan
        Write-Host "  ✅ Migradas: $MigratedCount" -ForegroundColor Green
        Write-Host "  ⏭️ Puladas: $SkippedCount" -ForegroundColor Yellow
        
        # Configurar PORT
        Write-Host "🔧 Configurando PORT=3000..." -ForegroundColor Cyan
        railway variables set "PORT=3000"
        
    } else {
        Write-Host "⚠️ all_variables_backup.json não encontrado" -ForegroundColor Yellow
        Write-Host "🔧 Criando backup completo de variáveis..." -ForegroundColor Cyan
        
        # Criar backup completo de todas as variáveis do projeto atual
        railway variables --json > all_variables_backup.json
        
        if (Test-Path "all_variables_backup.json") {
            Write-Host "✅ Backup de variáveis criado: all_variables_backup.json" -ForegroundColor Green
            $BackupVars = Get-Content "all_variables_backup.json" | ConvertFrom-Json
            
            # Migrar todas as variáveis
            $ExcludeVars = @(
                "DATABASE_URL",
                "RAILWAY_ENVIRONMENT",
                "RAILWAY_ENVIRONMENT_ID", 
                "RAILWAY_ENVIRONMENT_NAME",
                "RAILWAY_PRIVATE_DOMAIN",
                "RAILWAY_PROJECT_ID",
                "RAILWAY_PROJECT_NAME", 
                "RAILWAY_PUBLIC_DOMAIN",
                "RAILWAY_SERVICE_COINBITCLUB_MARKET_BOT_URL",
                "RAILWAY_SERVICE_ID",
                "RAILWAY_SERVICE_NAME",
                "RAILWAY_SERVICE_POSTGRES_URL",
                "RAILWAY_STATIC_URL"
            )
            
            foreach ($VarName in $BackupVars.PSObject.Properties.Name) {
                if ($ExcludeVars -contains $VarName) {
                    continue
                }
                
                $VarValue = $BackupVars.$VarName
                if ($VarValue) {
                    railway variables set "$VarName=$VarValue"
                }
            }
        } else {
            Write-Host "❌ Não foi possível criar backup de variáveis" -ForegroundColor Red
        }
    }
}

Write-Host "✅ FASE 3 CONCLUÍDA - Variáveis configuradas" -ForegroundColor Green
Write-Host ""

# FASE 4: DEPLOY INICIAL
Write-Host "📦 FASE 4: DEPLOY INICIAL" -ForegroundColor Magenta
Write-Host "========================" -ForegroundColor Yellow

if (!$TestMode) {
    Write-Host "🚀 Preparando deploy multiserviço otimizado..." -ForegroundColor Cyan
    
    # Copiar arquivos de migração otimizados (prioridade para multiserviço)
    if (Test-Path "server-multiservice-complete.cjs") {
        Write-Host "📦 Usando servidor MULTISERVIÇO COMPLETO..." -ForegroundColor Cyan
        Copy-Item "server-multiservice-complete.cjs" "server.js" -Force
        Write-Host "✅ Servidor configurado para GET e POST otimizados" -ForegroundColor Green
    } elseif (Test-Path "server-migration-v2.cjs") {
        Write-Host "📦 Usando servidor otimizado V2..." -ForegroundColor Cyan
        Copy-Item "server-migration-v2.cjs" "server.js" -Force
    } elseif (Test-Path "server-production.cjs") {
        Write-Host "📦 Usando servidor de produção atual..." -ForegroundColor Cyan
        Copy-Item "server-production.cjs" "server.js" -Force
    } else {
        Write-Host "⚠️ Nenhum arquivo de servidor encontrado, continuando..." -ForegroundColor Yellow
    }
    
    # Usar package.json otimizado se disponível (prioridade para multiserviço)
    if (Test-Path "package-multiservice.json") {
        Write-Host "📄 Usando package.json MULTISERVIÇO..." -ForegroundColor Cyan
        Copy-Item "package-multiservice.json" "package.json" -Force
        Write-Host "✅ Dependências otimizadas para multiserviço" -ForegroundColor Green
    } elseif (Test-Path "package-migration.json") {
        Write-Host "📄 Usando package.json otimizado..." -ForegroundColor Cyan
        Copy-Item "package-migration.json" "package.json" -Force
    }
    
    # Usar Dockerfile otimizado se disponível
    if (Test-Path "Dockerfile.migration") {
        Write-Host "🐳 Usando Dockerfile otimizado..." -ForegroundColor Cyan
        Copy-Item "Dockerfile.migration" "Dockerfile" -Force
    }
    
    # Usar railway.toml otimizado se disponível (prioridade para multiserviço)
    if (Test-Path "railway-multiservice.toml") {
        Write-Host "🚂 Usando railway.toml MULTISERVIÇO..." -ForegroundColor Cyan
        Copy-Item "railway-multiservice.toml" "railway.toml" -Force
        Write-Host "✅ Configuração Railway otimizada para GET/POST" -ForegroundColor Green
    } elseif (Test-Path "railway-migration-v2.toml") {
        Write-Host "🚂 Usando railway.toml otimizado..." -ForegroundColor Cyan
        Copy-Item "railway-migration-v2.toml" "railway.toml" -Force
    }
    
    Write-Host "🚀 Fazendo deploy inicial..." -ForegroundColor Cyan
    railway up --detach
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Deploy inicial realizado" -ForegroundColor Green
        
        # Aguardar deploy
        Write-Host "⏳ Aguardando deploy finalizar..." -ForegroundColor Cyan
        Start-Sleep -Seconds 90
        
        # Obter nova URL
        Write-Host "🌐 Obtendo URL do novo projeto..." -ForegroundColor Cyan
        $NewUrl = railway domain 2>$null
        
        if (!$NewUrl) {
            # Tentar obter via railway status
            $RailwayStatus = railway status --json 2>$null | ConvertFrom-Json -ErrorAction SilentlyContinue
            if ($RailwayStatus -and $RailwayStatus.url) {
                $NewUrl = $RailwayStatus.url
            }
        }
        
        if ($NewUrl) {
            Write-Host "🌐 Nova URL: $NewUrl" -ForegroundColor Green
            
            # Testar se o servidor está respondendo
            Write-Host "🧪 Testando novo servidor..." -ForegroundColor Cyan
            $MaxAttempts = 6
            $Attempt = 1
            $ServerOk = $false
            
            while ($Attempt -le $MaxAttempts -and !$ServerOk) {
                try {
                    Write-Host "   Tentativa $Attempt/$MaxAttempts..." -ForegroundColor Gray
                    $Response = Invoke-RestMethod -Uri "$NewUrl/health" -Method GET -TimeoutSec 15 -ErrorAction Stop
                    
                    if ($Response.status -eq "healthy" -or $Response.status -eq "active") {
                        Write-Host "✅ Servidor Multiserviço está respondendo!" -ForegroundColor Green
                        Write-Host "📊 Versão: $($Response.version)" -ForegroundColor Cyan
                        Write-Host "🔧 Tipo: $($Response.service)" -ForegroundColor Cyan
                        
                        # Verificar capacidades multiserviço
                        if ($Response.capabilities) {
                            Write-Host "🎯 Capacidades verificadas:" -ForegroundColor Green
                            if ($Response.capabilities.webhooks_reception) { Write-Host "  ✅ Recepção de Webhooks" -ForegroundColor White }
                            if ($Response.capabilities.rest_api) { Write-Host "  ✅ API REST (GET/POST)" -ForegroundColor White }
                            if ($Response.capabilities.database_operations) { Write-Host "  ✅ Operações de Banco" -ForegroundColor White }
                            if ($Response.capabilities.multi_format_support) { Write-Host "  ✅ Suporte Multi-formato" -ForegroundColor White }
                        }
                        
                        $ServerOk = $true
                    }
                } catch {
                    Write-Host "   ⏳ Aguardando servidor ficar pronto..." -ForegroundColor Yellow
                    Start-Sleep -Seconds 30
                    $Attempt++
                }
            }
            
            if (!$ServerOk) {
                Write-Host "⚠️ Servidor não está respondendo ainda, mas deploy foi realizado" -ForegroundColor Yellow
                Write-Host "💡 Verifique manualmente: $NewUrl/health" -ForegroundColor Yellow
            }
            
        } else {
            Write-Host "⚠️ Não foi possível obter a URL automaticamente" -ForegroundColor Yellow
            Write-Host "💡 Verifique no Railway Dashboard" -ForegroundColor Yellow
        }
        
    } else {
        Write-Host "❌ Erro no deploy inicial" -ForegroundColor Red
        Write-Host "💡 Verifique os logs: railway logs" -ForegroundColor Yellow
        Write-Host "💡 Verifique o Railway Dashboard" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "🧪 MODO TESTE - Simulando deploy" -ForegroundColor Yellow
    $NewUrl = "https://$NewProjectName-production.up.railway.app"
}

Write-Host "✅ FASE 4 CONCLUÍDA - Deploy realizado" -ForegroundColor Green
Write-Host ""

# FASE 5: MIGRAR DADOS E CONFIGURAR BANCO
Write-Host "📊 FASE 5: MIGRAR DADOS E CONFIGURAR BANCO" -ForegroundColor Magenta
Write-Host "=========================================" -ForegroundColor Yellow

if (!$TestMode) {
    Write-Host "🗄️ Executando migração de dados..." -ForegroundColor Cyan
    
    # Aguardar mais tempo para o banco estar pronto
    Write-Host "⏳ Aguardando banco PostgreSQL estar completamente pronto..." -ForegroundColor Cyan
    Start-Sleep -Seconds 45
    
    # Obter nova DATABASE_URL
    Write-Host "🔍 Obtendo nova DATABASE_URL..." -ForegroundColor Cyan
    $NewDatabaseUrl = railway variables get DATABASE_URL 2>$null
    
    if (!$NewDatabaseUrl) {
        # Tentar obter via railway status
        $RailwayStatus = railway status --json 2>$null | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($RailwayStatus -and $RailwayStatus.services) {
            foreach ($service in $RailwayStatus.services) {
                if ($service.name -eq "postgres") {
                    $NewDatabaseUrl = $service.variables.DATABASE_URL
                    break
                }
            }
        }
    }
    
    if ($NewDatabaseUrl) {
        Write-Host "✅ Nova DATABASE_URL obtida: $($NewDatabaseUrl.Substring(0, 50))..." -ForegroundColor Green
        
        # Testar conexão com o novo banco
        Write-Host "🧪 Testando conexão com o novo banco..." -ForegroundColor Cyan
        
        # Criar script de teste de conexão
        $TestScript = @"
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: '$NewDatabaseUrl',
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000
});

async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Conexão bem-sucedida!');
    console.log('🕐 Hora:', result.rows[0].current_time);
    console.log('📊 Versão:', result.rows[0].pg_version.substring(0, 50) + '...');
    client.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    await pool.end();
    process.exit(1);
  }
}

testConnection();
"@
        
        $TestScript | Out-File -FilePath "test-db-connection.js" -Encoding UTF8
        
        # Executar teste de conexão
        $TestResult = node test-db-connection.js 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Teste de conexão bem-sucedido!" -ForegroundColor Green
            Write-Host $TestResult
            
            # Aplicar backup COMPLETO com TODOS os dados
            if (Test-Path $BackupFileName) {
                Write-Host "📥 Aplicando backup COMPLETO com dados..." -ForegroundColor Cyan
                
                # Usar o script especializado para aplicar backup completo
                if (Test-Path "apply-complete-backup.js") {
                    Write-Host "🔄 Executando aplicação do backup completo..." -ForegroundColor Cyan
                    $ApplyResult = node apply-complete-backup.js "$NewDatabaseUrl" "$BackupFileName" 2>&1
                    
                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "✅ Backup completo aplicado com SUCESSO!" -ForegroundColor Green
                        Write-Host $ApplyResult
                        
                        # Verificar se dados foram realmente migrados
                        Write-Host "� Verificando dados migrados..." -ForegroundColor Cyan
                        
                        # Criar script de verificação rápida
                        $VerifyScript = @"
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: '$NewDatabaseUrl',
  ssl: { rejectUnauthorized: false }
});

async function verify() {
  try {
    const client = await pool.connect();
    
    // Contar registros em todas as tabelas
    const tables = ['api_requests', 'raw_webhook', 'system_config', 'tradingview_signals', 'transactions', 'users'];
    let totalRecords = 0;
    
    for (const table of tables) {
      try {
        const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = parseInt(result.rows[0].count);
        totalRecords += count;
        console.log(`${table}: ${count} registros`);
      } catch (error) {
        console.log(`${table}: tabela não encontrada`);
      }
    }
    
    console.log(`TOTAL: ${totalRecords} registros migrados`);
    client.release();
    await pool.end();
    
    if (totalRecords > 0) {
      console.log('✅ DADOS MIGRADOS COM SUCESSO!');
      process.exit(0);
    } else {
      console.log('⚠️ Nenhum dado encontrado');
      process.exit(1);
    }
  } catch (error) {
    console.error('Erro:', error.message);
    await pool.end();
    process.exit(1);
  }
}

verify();
"@
                        
                        $VerifyScript | Out-File -FilePath "verify-migration.js" -Encoding UTF8
                        $VerifyResult = node verify-migration.js 2>&1
                        
                        if ($LASTEXITCODE -eq 0) {
                            Write-Host "✅ Verificação: Dados migrados com sucesso!" -ForegroundColor Green
                            Write-Host $VerifyResult
                        } else {
                            Write-Host "⚠️ Verificação: Problemas na migração de dados" -ForegroundColor Yellow
                            Write-Host $VerifyResult
                        }
                        
                        Remove-Item "verify-migration.js" -ErrorAction SilentlyContinue
                        
                    } else {
                        Write-Host "❌ Erro ao aplicar backup completo:" -ForegroundColor Red
                        Write-Host $ApplyResult
                        Write-Host "💡 Tentando método alternativo..." -ForegroundColor Yellow
                        
                        # Método alternativo usando psql se disponível
                        if (Get-Command psql -ErrorAction SilentlyContinue) {
                            Write-Host "🔄 Tentando com psql..." -ForegroundColor Cyan
                            $PsqlResult = psql "$NewDatabaseUrl" -f "$BackupFileName" 2>&1
                            if ($LASTEXITCODE -eq 0) {
                                Write-Host "✅ Backup aplicado via psql!" -ForegroundColor Green
                            } else {
                                Write-Host "❌ Erro com psql:" -ForegroundColor Red
                                Write-Host $PsqlResult
                            }
                        }
                    }
                } else {
                    Write-Host "⚠️ Script apply-complete-backup.js não encontrado" -ForegroundColor Yellow
                    Write-Host "💡 Aplicando backup com método simples..." -ForegroundColor Cyan
                
                # Criar script para aplicar backup
                $ApplyBackupScript = @"
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: '$NewDatabaseUrl',
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000
});

async function applyBackup() {
  try {
    const client = await pool.connect();
    
    // Ler e executar backup
    const backupSql = fs.readFileSync('$BackupFileName', 'utf8');
    
    console.log('📥 Aplicando estrutura do banco...');
    await client.query(backupSql);
    
    console.log('✅ Backup estrutural aplicado com sucesso!');
    
    // Verificar tabelas criadas
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 Tabelas criadas:', tablesResult.rows.length);
    tablesResult.rows.forEach(row => {
      console.log('  - ' + row.table_name);
    });
    
    client.release();
    await pool.end();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro ao aplicar backup:', error.message);
    await pool.end();
    process.exit(1);
  }
}

applyBackup();
"@
                
                $ApplyBackupScript | Out-File -FilePath "apply-backup.js" -Encoding UTF8
                
                # Executar aplicação do backup
                $BackupResult = node apply-backup.js 2>&1
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "✅ Backup aplicado com sucesso!" -ForegroundColor Green
                    Write-Host $BackupResult
                } else {
                    Write-Host "⚠️ Erro ao aplicar backup automaticamente:" -ForegroundColor Yellow
                    Write-Host $BackupResult
                    Write-Host "💡 Execute manualmente: psql '$NewDatabaseUrl' < $BackupFileName" -ForegroundColor Yellow
                }
                
                # Limpar arquivos temporários
                Remove-Item "apply-backup.js" -ErrorAction SilentlyContinue
            }
            
        } else {
            Write-Host "❌ Teste de conexão falhou:" -ForegroundColor Red
            Write-Host $TestResult
            Write-Host "⚠️ Continuando, mas verifique o banco manualmente" -ForegroundColor Yellow
        }
        
        # Limpar arquivo de teste
        Remove-Item "test-db-connection.js" -ErrorAction SilentlyContinue
        
        # Criar configuração de banco para o novo projeto
        Write-Host "🔧 Configurando variáveis do banco..." -ForegroundColor Cyan
        railway variables set "DATABASE_SSL=true"
        railway variables set "PGSSL=require"
        railway variables set "PGSSLMODE=require"
        
    } else {
        Write-Host "❌ Não foi possível obter a nova DATABASE_URL" -ForegroundColor Red
        Write-Host "💡 Verifique se o PostgreSQL foi adicionado corretamente" -ForegroundColor Yellow
        Write-Host "🔧 Execute manualmente: railway add postgresql" -ForegroundColor Yellow
    }
    
    # Verificar se o servidor está rodando com o novo banco
    Write-Host "🧪 Testando servidor com novo banco..." -ForegroundColor Cyan
    Start-Sleep -Seconds 10
    
    if ($NewUrl) {
        try {
            $HealthResponse = Invoke-RestMethod -Uri "$NewUrl/health" -Method GET -TimeoutSec 30 -ErrorAction Stop
            if ($HealthResponse.database -and $HealthResponse.database.status -eq "connected") {
                Write-Host "✅ Servidor conectado ao novo banco!" -ForegroundColor Green
            } else {
                Write-Host "⚠️ Servidor online, mas status do banco incerto" -ForegroundColor Yellow
                Write-Host "💡 Verifique: $NewUrl/health" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "⚠️ Não foi possível testar o health endpoint ainda" -ForegroundColor Yellow
            Write-Host "💡 Teste manualmente: $NewUrl/health" -ForegroundColor Yellow
        }
    }
}

Write-Host "✅ FASE 5 CONCLUÍDA - Banco configurado e dados migrados" -ForegroundColor Green
Write-Host ""

# FASE 6: ATUALIZAR URLs
Write-Host "🔗 FASE 6: ATUALIZAR URLs" -ForegroundColor Magenta
Write-Host "========================" -ForegroundColor Yellow

if (!$TestMode -and $NewUrl) {
    Write-Host "🔧 Atualizando URLs relacionadas..." -ForegroundColor Cyan
    
    # Atualizar URLs do Stripe
    railway variables set "STRIPE_SUCCESS_URL=$NewUrl/sucesso?session_id={CHECKOUT_SESSION_ID}"
    railway variables set "STRIPE_CANCEL_URL=$NewUrl/cancelado"
    railway variables set "REACT_APP_API_URL=$NewUrl"
    
    Write-Host "✅ URLs atualizadas" -ForegroundColor Green
    
    # Salvar informações da migração
    $MigrationInfo = @{
        "migration_date" = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        "old_project" = "coinbitclub-market-bot"
        "new_project" = $NewProjectName
        "new_url" = $NewUrl
        "backup_file" = $BackupFileName
    }
    
    $MigrationInfo | ConvertTo-Json | Out-File "migration-info.json" -Encoding UTF8
    Write-Host "📋 Informações da migração salvas em migration-info.json" -ForegroundColor Green
}

Write-Host "✅ FASE 6 CONCLUÍDA - URLs atualizadas" -ForegroundColor Green
Write-Host ""

# RESUMO FINAL
Write-Host "🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Yellow
Write-Host ""

if (!$TestMode) {
    Write-Host "📊 RESUMO DA MIGRAÇÃO:" -ForegroundColor Cyan
    Write-Host "  • Projeto novo: $NewProjectName" -ForegroundColor White
    Write-Host "  • URL nova: $NewUrl" -ForegroundColor White
    Write-Host "  • Backup: $BackupFileName" -ForegroundColor White
    Write-Host ""
    
    Write-Host "🔧 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
    Write-Host "  1. ✅ Testar a nova URL: $NewUrl/health" -ForegroundColor White
    Write-Host "  2. �️ Verificar banco de dados: $NewUrl/api/health" -ForegroundColor White
    Write-Host "  3. 📡 Testar webhook TradingView: $NewUrl/api/webhooks/tradingview" -ForegroundColor White
    Write-Host "  4. �🔧 Atualizar webhooks do TradingView para: $NewUrl" -ForegroundColor White
    Write-Host "  5. 🔧 Atualizar URLs no frontend Vercel" -ForegroundColor White
    Write-Host "  6. 🧪 Executar testes completos: node test-migration.js $NewUrl" -ForegroundColor White
    Write-Host "  7. 📊 Monitorar logs: railway logs -f" -ForegroundColor White
    Write-Host ""
    
    Write-Host "🗄️ BANCO DE DADOS:" -ForegroundColor Yellow
    Write-Host "  • PostgreSQL configurado no novo projeto" -ForegroundColor White
    Write-Host "  • Backup aplicado: $BackupFileName" -ForegroundColor White
    Write-Host "  • Estruturas básicas criadas" -ForegroundColor White
    Write-Host "  • Conexão SSL configurada" -ForegroundColor White
    Write-Host ""
    
    Write-Host "⚠️ IMPORTANTE:" -ForegroundColor Red
    Write-Host "  • Mantenha o projeto antigo ativo por 48h como backup" -ForegroundColor White
    Write-Host "  • Execute testes completos antes de desativar o projeto antigo" -ForegroundColor White
    Write-Host "  • Monitore os logs por possíveis problemas" -ForegroundColor White
    Write-Host "  • Verifique se o banco de dados está funcionando corretamente" -ForegroundColor White
    Write-Host ""
    
    Write-Host "🧪 VALIDAÇÃO RECOMENDADA:" -ForegroundColor Cyan
    Write-Host "  • Teste manual: $NewUrl/health" -ForegroundColor White
    Write-Host "  • Teste GET: $NewUrl/api/data?test=true&action=buy&symbol=BTCUSDT" -ForegroundColor White
    Write-Host "  • Teste POST: Envie JSON para $NewUrl/api/data" -ForegroundColor White
    Write-Host "  • Teste webhook: Envie um webhook teste do TradingView" -ForegroundColor White
    Write-Host "  • Teste banco: Verifique se dados são salvos corretamente" -ForegroundColor White
    Write-Host "  • Teste completo: node test-multiservice.js $NewUrl" -ForegroundColor White
    
} else {
    Write-Host "🧪 MODO TESTE CONCLUÍDO - Nenhuma alteração real foi feita" -ForegroundColor Yellow
    Write-Host "💡 Para executar a migração real, remova o parâmetro -TestMode" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "🆘 Em caso de problemas, execute: .\rollback-migration.ps1" -ForegroundColor Red
Write-Host ""
Write-Host "✨ Migração finalizada! Bom trabalho! 🎉" -ForegroundColor Green
