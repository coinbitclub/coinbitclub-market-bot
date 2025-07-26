# Script simples para migrar banco de dados
param(
    [switch]$Execute = $false
)

Write-Host "🗄️ MIGRAÇÃO DE BANCO DE DADOS RAILWAY" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Yellow

# Obter DATABASE_URL
Write-Host "🔍 Obtendo DATABASE_URL..." -ForegroundColor Cyan
$DatabaseUrl = railway variables --json | ConvertFrom-Json | Select-Object -ExpandProperty DATABASE_URL

if (!$DatabaseUrl) {
    Write-Host "❌ DATABASE_URL não encontrada" -ForegroundColor Red
    exit 1
}

Write-Host "✅ DATABASE_URL obtida" -ForegroundColor Green

# Criar script SQL simples
$SqlScript = @"
-- MIGRAÇÃO COINBITCLUB RAILWAY V3
-- Estrutura básica do banco de dados

-- Tabela de webhooks
CREATE TABLE IF NOT EXISTS raw_webhook (
    id SERIAL PRIMARY KEY,
    source VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'received',
    created_at TIMESTAMP DEFAULT NOW(),
    server_id VARCHAR(100),
    version VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS idx_raw_webhook_source ON raw_webhook(source);
CREATE INDEX IF NOT EXISTS idx_raw_webhook_created_at ON raw_webhook(created_at);

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
('migration_date', NOW()::text, 'Data da migração'),
('version', '3.0.0-migrated', 'Versão pós-migração'),
('environment', 'production', 'Ambiente')
ON CONFLICT (config_key) DO UPDATE SET 
    config_value = EXCLUDED.config_value,
    updated_at = NOW();

-- Tabela de usuários  
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Usuário admin
INSERT INTO users (email, name, role, status) VALUES
('admin@coinbitclub.com', 'CoinBitClub Admin', 'admin', 'active')
ON CONFLICT (email) DO UPDATE SET updated_at = NOW();

-- Tabela de sinais TradingView
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

CREATE INDEX IF NOT EXISTS idx_tradingview_signals_symbol ON tradingview_signals(symbol);
CREATE INDEX IF NOT EXISTS idx_tradingview_signals_timestamp ON tradingview_signals(timestamp);

-- Dados de teste
INSERT INTO raw_webhook (source, payload, status, server_id, version) VALUES
('migration', '{"type":"migration","success":true}', 'processed', 'migration-script', '3.0.0');
"@

$SqlScript | Out-File -FilePath "migration.sql" -Encoding UTF8

# Script Node.js simples
$NodeScript = @"
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: '$DatabaseUrl',
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    console.log('🗄️ Iniciando migração...');
    
    const sql = fs.readFileSync('migration.sql', 'utf8');
    await pool.query(sql);
    
    console.log('✅ Migração concluída!');
    
    const result = await pool.query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\'');
    console.log('📊 Tabelas criadas:', result.rows.length);
    result.rows.forEach(row => console.log('  -', row.table_name));
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

migrate();
"@

$NodeScript | Out-File -FilePath "migrate.js" -Encoding UTF8

if ($Execute) {
    Write-Host "🚀 Executando migração..." -ForegroundColor Cyan
    node migrate.js
    
    Write-Host "🧹 Limpando arquivos..." -ForegroundColor Cyan
    Remove-Item "migration.sql", "migrate.js" -ErrorAction SilentlyContinue
} else {
    Write-Host "📝 Arquivos criados: migration.sql, migrate.js" -ForegroundColor Yellow
    Write-Host "💡 Execute: .\migrate-db-simple.ps1 -Execute" -ForegroundColor Yellow
}
