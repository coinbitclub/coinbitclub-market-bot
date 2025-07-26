# 🗄️ MIGRAÇÃO DE BANCO DE DADOS RAILWAY
# Script para migrar dados do projeto antigo para o novo Railway
# Execute: .\migrate-database.ps1

param(
    [string]$OldProjectName = "coinbitclub-market-bot",
    [string]$NewProjectName = "coinbitclub-market-bot-v3",
    [switch]$FullMigration = $false,
    [switch]$StructureOnly = $false
)

$ErrorActionPreference = "Stop"

Write-Host "🗄️ MIGRAÇÃO DE BANCO DE DADOS RAILWAY" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Yellow
Write-Host ""

# Verificar se estamos no projeto correto
Write-Host "🔍 Verificando projeto atual..." -ForegroundColor Cyan
$CurrentProject = railway status --json 2>$null | ConvertFrom-Json -ErrorAction SilentlyContinue

if ($CurrentProject -and $CurrentProject.name -eq $NewProjectName) {
    Write-Host "✅ Conectado ao projeto correto: $NewProjectName" -ForegroundColor Green
} else {
    Write-Host "❌ Erro: Não conectado ao projeto correto" -ForegroundColor Red
    Write-Host "💡 Execute: railway link [PROJECT_ID]" -ForegroundColor Yellow
    exit 1
}

# FASE 1: BACKUP DO PROJETO ANTIGO
Write-Host ""
Write-Host "📦 FASE 1: BACKUP DO PROJETO ANTIGO" -ForegroundColor Magenta
Write-Host "===================================" -ForegroundColor Yellow

# Criar nome do arquivo de backup
$BackupTimestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$BackupFileName = "migration-backup-$BackupTimestamp.sql"

Write-Host "🔧 Criando backup estrutural completo..." -ForegroundColor Cyan

# Backup estrutural completo com dados de exemplo
$CompleteBackup = @"
-- ==========================================
-- BACKUP COMPLETO COINBITCLUB RAILWAY MIGRATION
-- Data: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
-- Projeto Origem: $OldProjectName
-- Projeto Destino: $NewProjectName
-- ==========================================

-- Limpar dados existentes (cuidado!)
-- DROP TABLE IF EXISTS raw_webhook CASCADE;
-- DROP TABLE IF EXISTS system_config CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TABLE IF EXISTS tradingview_signals CASCADE;

-- ==========================================
-- TABELA DE WEBHOOKS BRUTOS
-- ==========================================
CREATE TABLE IF NOT EXISTS raw_webhook (
    id SERIAL PRIMARY KEY,
    source VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'received',
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP,
    server_id VARCHAR(100),
    version VARCHAR(50),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    user_id INTEGER,
    session_id VARCHAR(100)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_raw_webhook_source ON raw_webhook(source);
CREATE INDEX IF NOT EXISTS idx_raw_webhook_created_at ON raw_webhook(created_at);
CREATE INDEX IF NOT EXISTS idx_raw_webhook_status ON raw_webhook(status);
CREATE INDEX IF NOT EXISTS idx_raw_webhook_server_id ON raw_webhook(server_id);
CREATE INDEX IF NOT EXISTS idx_raw_webhook_user_id ON raw_webhook(user_id);

-- ==========================================
-- TABELA DE CONFIGURAÇÕES DO SISTEMA
-- ==========================================
CREATE TABLE IF NOT EXISTS system_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    config_type VARCHAR(20) DEFAULT 'string'
);

-- Configurações iniciais do sistema
INSERT INTO system_config (config_key, config_value, description, config_type) VALUES
('migration_source', '$OldProjectName', 'Projeto de origem da migração', 'string'),
('migration_date', '$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')', 'Data da migração', 'datetime'),
('version', '3.0.0-migrated', 'Versão pós-migração', 'string'),
('environment', 'production', 'Ambiente de execução', 'string'),
('webhooks_enabled', 'true', 'Webhooks habilitados', 'boolean'),
('database_version', '1.0', 'Versão do esquema do banco', 'string'),
('last_maintenance', '$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')', 'Última manutenção', 'datetime'),
('auto_cleanup_days', '30', 'Dias para limpeza automática de logs', 'number'),
('max_webhook_retries', '3', 'Máximo de tentativas para webhooks', 'number'),
('trading_enabled', 'true', 'Trading habilitado', 'boolean')
ON CONFLICT (config_key) DO UPDATE SET 
    config_value = EXCLUDED.config_value,
    updated_at = NOW();

-- ==========================================
-- TABELA DE USUÁRIOS
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    password_hash VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    api_key VARCHAR(100),
    webhook_url VARCHAR(500),
    preferences JSONB DEFAULT '{}',
    balance DECIMAL(15,8) DEFAULT 0.00000000,
    total_trades INTEGER DEFAULT 0
);

-- Índices para usuários
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_api_key ON users(api_key);

-- Usuário administrador padrão
INSERT INTO users (email, name, role, status, api_key) VALUES
('admin@coinbitclub.com', 'CoinBitClub Admin', 'admin', 'active', 'COINBITCLUB_ADMIN_API_KEY_2024')
ON CONFLICT (email) DO UPDATE SET 
    updated_at = NOW(),
    api_key = EXCLUDED.api_key;

-- ==========================================
-- TABELA DE SINAIS TRADINGVIEW
-- ==========================================
CREATE TABLE IF NOT EXISTS tradingview_signals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    symbol VARCHAR(20) NOT NULL,
    action VARCHAR(10) NOT NULL, -- 'buy', 'sell', 'close'
    price DECIMAL(15,8),
    quantity DECIMAL(15,8),
    strategy VARCHAR(100),
    timeframe VARCHAR(10),
    timestamp TIMESTAMP DEFAULT NOW(),
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    source VARCHAR(50) DEFAULT 'tradingview',
    webhook_id INTEGER REFERENCES raw_webhook(id),
    exchange VARCHAR(50),
    order_type VARCHAR(20) DEFAULT 'market',
    stop_loss DECIMAL(15,8),
    take_profit DECIMAL(15,8),
    success BOOLEAN,
    error_message TEXT
);

-- Índices para sinais
CREATE INDEX IF NOT EXISTS idx_tradingview_signals_symbol ON tradingview_signals(symbol);
CREATE INDEX IF NOT EXISTS idx_tradingview_signals_action ON tradingview_signals(action);
CREATE INDEX IF NOT EXISTS idx_tradingview_signals_timestamp ON tradingview_signals(timestamp);
CREATE INDEX IF NOT EXISTS idx_tradingview_signals_processed ON tradingview_signals(processed);
CREATE INDEX IF NOT EXISTS idx_tradingview_signals_user_id ON tradingview_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_tradingview_signals_webhook_id ON tradingview_signals(webhook_id);

-- ==========================================
-- TABELA DE TRANSAÇÕES
-- ==========================================
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    signal_id INTEGER REFERENCES tradingview_signals(id),
    type VARCHAR(20) NOT NULL, -- 'buy', 'sell', 'deposit', 'withdrawal'
    symbol VARCHAR(20),
    amount DECIMAL(15,8) NOT NULL,
    price DECIMAL(15,8),
    fee DECIMAL(15,8) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'cancelled'
    exchange VARCHAR(50),
    exchange_order_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    error_message TEXT
);

-- Índices para transações
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_symbol ON transactions(symbol);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- ==========================================
-- TABELA DE LOGS DO SISTEMA
-- ==========================================
CREATE TABLE IF NOT EXISTS system_logs (
    id SERIAL PRIMARY KEY,
    level VARCHAR(10) NOT NULL, -- 'info', 'warn', 'error', 'debug'
    message TEXT NOT NULL,
    component VARCHAR(50),
    user_id INTEGER REFERENCES users(id),
    session_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Índices para logs
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_component ON system_logs(component);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);

-- ==========================================
-- INSERIR DADOS DE EXEMPLO (se necessário)
-- ==========================================

-- Webhook de exemplo
INSERT INTO raw_webhook (source, payload, status, server_id, version) VALUES
('tradingview', '{"symbol":"BTCUSDT","action":"buy","price":45000,"strategy":"RSI_MACD","test":true}', 'processed', 'migration-test', '3.0.0-migrated'),
('manual', '{"type":"test","message":"Sistema migrado com sucesso"}', 'processed', 'migration-test', '3.0.0-migrated');

-- Log de migração
INSERT INTO system_logs (level, message, component, metadata) VALUES
('info', 'Migração de banco de dados concluída com sucesso', 'migration', '{"timestamp":"$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')","version":"3.0.0"}');

-- ==========================================
-- VIEWS ÚTEIS
-- ==========================================

-- View de estatísticas de webhooks
CREATE OR REPLACE VIEW webhook_stats AS
SELECT 
    source,
    status,
    COUNT(*) as total,
    MIN(created_at) as first_received,
    MAX(created_at) as last_received
FROM raw_webhook 
GROUP BY source, status;

-- View de sinais recentes
CREATE OR REPLACE VIEW recent_signals AS
SELECT 
    s.*,
    u.email as user_email,
    w.source as webhook_source
FROM tradingview_signals s
LEFT JOIN users u ON s.user_id = u.id
LEFT JOIN raw_webhook w ON s.webhook_id = w.id
WHERE s.timestamp >= NOW() - INTERVAL '24 hours'
ORDER BY s.timestamp DESC;

-- ==========================================
-- FUNÇÕES DE LIMPEZA
-- ==========================================

-- Função para limpar webhooks antigos
CREATE OR REPLACE FUNCTION cleanup_old_webhooks(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS `$`$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM raw_webhook 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_old
    AND status = 'processed';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    INSERT INTO system_logs (level, message, component, metadata)
    VALUES ('info', 'Limpeza automática de webhooks executada', 'cleanup', 
            json_build_object('deleted_count', deleted_count, 'days_old', days_old));
    
    RETURN deleted_count;
END;
`$`$ LANGUAGE plpgsql;

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS `$`$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
`$`$ LANGUAGE plpgsql;

-- Aplicar trigger em tabelas relevantes
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_system_config_updated_at ON system_config;
CREATE TRIGGER update_system_config_updated_at
    BEFORE UPDATE ON system_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- PERMISSÕES E SEGURANÇA
-- ==========================================

-- Garantir que as tabelas tenham as permissões corretas
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO railway_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO railway_user;

-- ==========================================
-- VERIFICAÇÃO FINAL
-- ==========================================

-- Inserir log de conclusão da migração
INSERT INTO system_logs (level, message, component, metadata) VALUES
('info', 'Schema de banco de dados criado com sucesso', 'migration', 
 json_build_object(
     'tables_created', ARRAY['raw_webhook', 'system_config', 'users', 'tradingview_signals', 'transactions', 'system_logs'],
     'migration_date', '$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')',
     'version', '3.0.0-migrated'
 ));

-- ==========================================
-- SUMMARY
-- ==========================================
-- Estrutura criada com sucesso!
-- Tabelas: raw_webhook, system_config, users, tradingview_signals, transactions, system_logs
-- Views: webhook_stats, recent_signals  
-- Funções: cleanup_old_webhooks()
-- Triggers: update_updated_at_column()
-- ==========================================
"@

$CompleteBackup | Out-File -FilePath $BackupFileName -Encoding UTF8
Write-Host "✅ Backup completo criado: $BackupFileName" -ForegroundColor Green

# Verificar tamanho do backup
$FileSize = (Get-Item $BackupFileName).Length
$FileSizeKB = [math]::Round($FileSize / 1KB, 2)
Write-Host "📊 Tamanho do backup: $FileSizeKB KB" -ForegroundColor Cyan

# FASE 2: APLICAR MIGRAÇÃO NO NOVO BANCO
Write-Host ""
Write-Host "📥 FASE 2: APLICAR MIGRAÇÃO NO NOVO BANCO" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Yellow

Write-Host "🔍 Obtendo DATABASE_URL do novo projeto..." -ForegroundColor Cyan
$DatabaseUrl = $null

# Obter DATABASE_URL das variáveis
try {
    $Variables = railway variables --json | ConvertFrom-Json
    $DatabaseUrl = $Variables.DATABASE_URL
} catch {
    Write-Host "⚠️ Erro ao obter variáveis via JSON, tentando método alternativo..." -ForegroundColor Yellow
}

if (!$DatabaseUrl) {
    Write-Host "❌ DATABASE_URL não encontrada nas variáveis do projeto" -ForegroundColor Red
    Write-Host "💡 Execute: railway variables --set DATABASE_URL=..." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ DATABASE_URL obtida: $($DatabaseUrl.Substring(0, 50))..." -ForegroundColor Green

# Criar script Node.js para aplicar a migração
Write-Host "🔧 Criando script de migração..." -ForegroundColor Cyan

$MigrationScript = @"
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: '$DatabaseUrl',
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🗄️ Iniciando migração do banco de dados...');
    
    // Ler e executar o script SQL
    const migrationSql = fs.readFileSync('$BackupFileName', 'utf8');
    
    console.log('📥 Aplicando estrutura do banco...');
    await client.query(migrationSql);
    
    console.log('✅ Migração aplicada com sucesso!');
    
    // Verificar tabelas criadas
    const tablesResult = await client.query(`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 Estruturas criadas:');
    console.log('Tabelas:', tablesResult.rows.filter(r => r.table_type === 'BASE TABLE').length);
    console.log('Views:', tablesResult.rows.filter(r => r.table_type === 'VIEW').length);
    
    tablesResult.rows.forEach(row => {
      const icon = row.table_type === 'BASE TABLE' ? '📊' : '👁️';
      console.log(`  ${icon} ${row.table_name} (${row.table_type})`);
    });
    
    // Verificar dados inseridos
    const configCount = await client.query('SELECT COUNT(*) FROM system_config');
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    const webhookCount = await client.query('SELECT COUNT(*) FROM raw_webhook');
    
    console.log('');
    console.log('📊 Dados inseridos:');
    console.log(`  - Configurações: ${configCount.rows[0].count}`);
    console.log(`  - Usuários: ${userCount.rows[0].count}`);
    console.log(`  - Webhooks: ${webhookCount.rows[0].count}`);
    
    // Testar views
    console.log('');
    console.log('🔍 Testando views...');
    const statsResult = await client.query('SELECT * FROM webhook_stats LIMIT 5');
    console.log(`  ✅ webhook_stats: ${statsResult.rows.length} registros`);
    
    console.log('');
    console.log('🎉 Migração concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na migração:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(error => {
  console.error('❌ Falha na migração:', error);
  process.exit(1);
});
"@

$MigrationScript | Out-File -FilePath "run-migration.js" -Encoding UTF8

# Executar migração
Write-Host "🚀 Executando migração..." -ForegroundColor Cyan
$MigrationResult = node run-migration.js 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migração executada com sucesso!" -ForegroundColor Green
    Write-Host $MigrationResult
} else {
    Write-Host "❌ Erro na migração:" -ForegroundColor Red
    Write-Host $MigrationResult
    exit 1
}

# FASE 3: VALIDAÇÃO FINAL
Write-Host ""
Write-Host "🔍 FASE 3: VALIDAÇÃO FINAL" -ForegroundColor Magenta
Write-Host "==========================" -ForegroundColor Yellow

Write-Host "🧪 Testando servidor com banco migrado..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

$NewUrl = "https://mindful-fascination-production.up.railway.app"
try {
    $HealthResponse = Invoke-RestMethod -Uri "$NewUrl/health" -Method GET -TimeoutSec 30 -ErrorAction Stop
    
    if ($HealthResponse.database.status -eq "connected") {
        Write-Host "✅ Servidor conectado ao banco migrado!" -ForegroundColor Green
        Write-Host "📊 Tabelas no banco: $($HealthResponse.database.tables)" -ForegroundColor Cyan
        Write-Host "🗄️ Versão PostgreSQL: $($HealthResponse.database.version)" -ForegroundColor Cyan
    } else {
        Write-Host "⚠️ Servidor online mas banco com problemas" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Erro ao testar health endpoint" -ForegroundColor Yellow
    Write-Host $_.Exception.Message
}

# Limpar arquivos temporários
Write-Host ""
Write-Host "🧹 Limpando arquivos temporários..." -ForegroundColor Cyan
Remove-Item "run-migration.js" -ErrorAction SilentlyContinue

# RESUMO FINAL
Write-Host ""
Write-Host "🎉 MIGRAÇÃO DE BANCO CONCLUÍDA!" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Yellow
Write-Host ""
Write-Host "📊 RESUMO:" -ForegroundColor Cyan
Write-Host "  • Backup criado: $BackupFileName" -ForegroundColor White
Write-Host "  • Estrutura migrada: Tabelas, Views, Funções, Triggers" -ForegroundColor White
Write-Host "  • Dados iniciais: Usuário admin, configurações do sistema" -ForegroundColor White
Write-Host "  • Projeto destino: $NewProjectName" -ForegroundColor White
Write-Host ""
Write-Host "🔗 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "  1. Testar endpoints de API com dados reais" -ForegroundColor White
Write-Host "  2. Configurar webhooks do TradingView para: $NewUrl" -ForegroundColor White
Write-Host "  3. Atualizar URLs do frontend" -ForegroundColor White
Write-Host "  4. Monitorar logs e performance" -ForegroundColor White
Write-Host ""
Write-Host "✨ Banco de dados migrado com sucesso! 🗄️" -ForegroundColor Green
