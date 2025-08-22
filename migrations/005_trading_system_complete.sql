-- ========================================
-- MARKETBOT - MIGRAÇÃO SPRINT 5
-- Sistema de Trading Avançado com Configurações e Fila
-- ========================================

BEGIN;

-- ========================================
-- 1. TABELA DE CONFIGURAÇÕES DE TRADING
-- ========================================

CREATE TABLE IF NOT EXISTS trading_configurations (
    id SERIAL PRIMARY KEY,
    
    -- Configurações globais
    global_max_leverage DECIMAL(5,2) DEFAULT 20.00,
    global_max_position_size_percent DECIMAL(5,2) DEFAULT 50.00,
    global_max_stop_loss_percent DECIMAL(5,2) DEFAULT 20.00,
    global_min_stop_loss_percent DECIMAL(5,2) DEFAULT 1.00,
    global_max_take_profit_percent DECIMAL(5,2) DEFAULT 100.00,
    global_min_take_profit_percent DECIMAL(5,2) DEFAULT 5.00,
    
    -- Rate limiting
    rate_limit_per_minute INTEGER DEFAULT 10,
    rate_limit_per_hour INTEGER DEFAULT 100,
    
    -- Configurações de ambiente
    mainnet_enabled BOOLEAN DEFAULT true,
    testnet_enabled BOOLEAN DEFAULT true,
    
    -- Exchanges suportadas
    supported_exchanges TEXT[] DEFAULT ARRAY['binance', 'bybit', 'okx'],
    
    -- Símbolos permitidos
    allowed_symbols TEXT[] DEFAULT ARRAY['BTCUSDT', 'ETHUSDT', 'ADAUSDT'],
    
    -- Configurações de risco
    max_daily_loss_percent DECIMAL(5,2) DEFAULT 10.00,
    max_daily_trades INTEGER DEFAULT 50,
    max_concurrent_positions INTEGER DEFAULT 10,
    
    -- Configurações de ordem
    default_order_type VARCHAR(20) DEFAULT 'MARKET',
    require_confirmation BOOLEAN DEFAULT false,
    auto_cancel_minutes INTEGER DEFAULT 60,
    
    -- Configurações de margin
    margin_mode VARCHAR(20) DEFAULT 'CROSS',
    position_mode VARCHAR(20) DEFAULT 'HEDGE',
    
    -- Sistema
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- ========================================
-- 2. LIMITES PERSONALIZADOS POR USUÁRIO
-- ========================================

CREATE TABLE IF NOT EXISTS user_trading_limits (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    
    -- Limites específicos do usuário
    max_leverage DECIMAL(5,2),
    max_position_size_percent DECIMAL(5,2),
    max_stop_loss_percent DECIMAL(5,2),
    min_stop_loss_percent DECIMAL(5,2),
    max_take_profit_percent DECIMAL(5,2),
    min_take_profit_percent DECIMAL(5,2),
    
    -- Limites diários
    daily_loss_limit_usd DECIMAL(15,2),
    daily_trade_limit INTEGER,
    max_concurrent_positions INTEGER,
    
    -- Exchanges permitidas para este usuário
    allowed_exchanges TEXT[],
    allowed_symbols TEXT[],
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP,
    
    -- Auditoria
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255),
    reason VARCHAR(500),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id)
);

-- ========================================
-- 3. FILA DE TRADING
-- ========================================

CREATE TABLE IF NOT EXISTS trading_queue (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    
    -- Dados da operação
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL CHECK (side IN ('BUY', 'SELL')),
    leverage DECIMAL(5,2) NOT NULL,
    position_size_percent DECIMAL(5,2) NOT NULL,
    stop_loss_percent DECIMAL(5,2) NOT NULL,
    take_profit_percent DECIMAL(5,2) NOT NULL,
    amount_usd DECIMAL(15,2) NOT NULL,
    
    -- Configurações da ordem
    order_type VARCHAR(20) DEFAULT 'MARKET',
    time_in_force VARCHAR(20) DEFAULT 'GTC',
    reduce_only BOOLEAN DEFAULT false,
    
    -- Sistema de prioridades
    priority VARCHAR(10) NOT NULL CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW')),
    environment VARCHAR(10) NOT NULL CHECK (environment IN ('MAINNET', 'TESTNET')),
    exchange VARCHAR(20) NOT NULL,
    
    -- Status e controle
    status VARCHAR(20) DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    
    -- Mensagens e logs
    error_message TEXT,
    execution_logs JSONB,
    
    -- Estimativas e timing
    estimated_execution_time TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Relações
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ========================================
-- 4. POSIÇÕES DE TRADING
-- ========================================

CREATE TABLE IF NOT EXISTS trading_positions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    queue_id VARCHAR(100), -- Referência à ordem original
    
    -- Dados da posição
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL CHECK (side IN ('BUY', 'SELL')),
    leverage DECIMAL(5,2) NOT NULL,
    amount_usd DECIMAL(15,2) NOT NULL,
    quantity DECIMAL(20,8) NOT NULL,
    
    -- Preços
    entry_price DECIMAL(20,8),
    mark_price DECIMAL(20,8),
    liquidation_price DECIMAL(20,8),
    
    -- Stop loss e take profit
    stop_loss DECIMAL(5,2),
    take_profit DECIMAL(5,2),
    stop_loss_price DECIMAL(20,8),
    take_profit_price DECIMAL(20,8),
    
    -- PnL
    unrealized_pnl DECIMAL(15,2) DEFAULT 0,
    realized_pnl DECIMAL(15,2) DEFAULT 0,
    fees_paid DECIMAL(15,2) DEFAULT 0,
    
    -- Exchange e ambiente
    exchange VARCHAR(20) NOT NULL,
    environment VARCHAR(10) NOT NULL CHECK (environment IN ('MAINNET', 'TESTNET')),
    exchange_position_id VARCHAR(100),
    
    -- Status
    status VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED', 'LIQUIDATED', 'CANCELLED')),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    closed_at TIMESTAMP,
    
    -- Relações
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (queue_id) REFERENCES trading_queue(id) ON DELETE SET NULL
);

-- ========================================
-- 5. AUDITORIA DE CONFIGURAÇÕES
-- ========================================

CREATE TABLE IF NOT EXISTS trading_config_audit (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id VARCHAR(100) NOT NULL,
    operation VARCHAR(20) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    
    -- Dados da alteração
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    
    -- Contexto
    user_id VARCHAR(255),
    admin_user VARCHAR(255),
    reason VARCHAR(500),
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- 6. ÍNDICES PARA PERFORMANCE
-- ========================================

-- Índices para trading_queue
CREATE INDEX IF NOT EXISTS idx_trading_queue_status ON trading_queue(status);
CREATE INDEX IF NOT EXISTS idx_trading_queue_priority ON trading_queue(priority);
CREATE INDEX IF NOT EXISTS idx_trading_queue_user_status ON trading_queue(user_id, status);
CREATE INDEX IF NOT EXISTS idx_trading_queue_created_at ON trading_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_trading_queue_estimated_time ON trading_queue(estimated_execution_time);

-- Índices para trading_positions
CREATE INDEX IF NOT EXISTS idx_trading_positions_user_status ON trading_positions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_trading_positions_symbol ON trading_positions(symbol);
CREATE INDEX IF NOT EXISTS idx_trading_positions_created_at ON trading_positions(created_at);
CREATE INDEX IF NOT EXISTS idx_trading_positions_queue_id ON trading_positions(queue_id);

-- Índices para user_trading_limits
CREATE INDEX IF NOT EXISTS idx_user_trading_limits_active ON user_trading_limits(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_trading_limits_expires ON user_trading_limits(expires_at);

-- Índices para auditoria
CREATE INDEX IF NOT EXISTS idx_trading_config_audit_table_record ON trading_config_audit(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_trading_config_audit_created_at ON trading_config_audit(created_at);
CREATE INDEX IF NOT EXISTS idx_trading_config_audit_admin_user ON trading_config_audit(admin_user);

-- ========================================
-- 7. TRIGGERS PARA AUDITORIA AUTOMÁTICA
-- ========================================

-- Função para auditoria automática
CREATE OR REPLACE FUNCTION audit_trading_config_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Inserir registro de auditoria para UPDATEs
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO trading_config_audit (
            table_name, record_id, operation, old_values, new_values,
            changed_fields, created_at
        ) VALUES (
            TG_TABLE_NAME,
            COALESCE(NEW.id::text, OLD.id::text),
            'UPDATE',
            to_jsonb(OLD),
            to_jsonb(NEW),
            (SELECT array_agg(key) FROM (
                SELECT key FROM jsonb_each(to_jsonb(OLD))
                EXCEPT
                SELECT key FROM jsonb_each(to_jsonb(NEW))
                UNION
                SELECT key FROM jsonb_each(to_jsonb(NEW))
                EXCEPT
                SELECT key FROM jsonb_each(to_jsonb(OLD))
            ) t),
            NOW()
        );
        RETURN NEW;
    END IF;

    -- Inserir registro de auditoria para INSERTs
    IF TG_OP = 'INSERT' THEN
        INSERT INTO trading_config_audit (
            table_name, record_id, operation, new_values, created_at
        ) VALUES (
            TG_TABLE_NAME,
            NEW.id::text,
            'INSERT',
            to_jsonb(NEW),
            NOW()
        );
        RETURN NEW;
    END IF;

    -- Inserir registro de auditoria para DELETEs
    IF TG_OP = 'DELETE' THEN
        INSERT INTO trading_config_audit (
            table_name, record_id, operation, old_values, created_at
        ) VALUES (
            TG_TABLE_NAME,
            OLD.id::text,
            'DELETE',
            to_jsonb(OLD),
            NOW()
        );
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers
DROP TRIGGER IF EXISTS audit_trading_configurations_trigger ON trading_configurations;
CREATE TRIGGER audit_trading_configurations_trigger
    AFTER INSERT OR UPDATE OR DELETE ON trading_configurations
    FOR EACH ROW EXECUTE FUNCTION audit_trading_config_changes();

DROP TRIGGER IF EXISTS audit_user_trading_limits_trigger ON user_trading_limits;
CREATE TRIGGER audit_user_trading_limits_trigger
    AFTER INSERT OR UPDATE OR DELETE ON user_trading_limits
    FOR EACH ROW EXECUTE FUNCTION audit_trading_config_changes();

-- ========================================
-- 8. TRIGGER PARA AUTO-UPDATE DOS TIMESTAMPS
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers de updated_at
DROP TRIGGER IF EXISTS update_trading_configurations_updated_at ON trading_configurations;
CREATE TRIGGER update_trading_configurations_updated_at
    BEFORE UPDATE ON trading_configurations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_trading_limits_updated_at ON user_trading_limits;
CREATE TRIGGER update_user_trading_limits_updated_at
    BEFORE UPDATE ON user_trading_limits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trading_queue_updated_at ON trading_queue;
CREATE TRIGGER update_trading_queue_updated_at
    BEFORE UPDATE ON trading_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trading_positions_updated_at ON trading_positions;
CREATE TRIGGER update_trading_positions_updated_at
    BEFORE UPDATE ON trading_positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 9. INSERIR CONFIGURAÇÃO PADRÃO
-- ========================================

INSERT INTO trading_configurations (
    global_max_leverage,
    global_max_position_size_percent,
    global_max_stop_loss_percent,
    global_min_stop_loss_percent,
    global_max_take_profit_percent,
    global_min_take_profit_percent,
    rate_limit_per_minute,
    rate_limit_per_hour,
    mainnet_enabled,
    testnet_enabled,
    supported_exchanges,
    allowed_symbols,
    max_daily_loss_percent,
    max_daily_trades,
    max_concurrent_positions,
    created_by
) VALUES (
    20.00,   -- Max leverage
    50.00,   -- Max position size %
    20.00,   -- Max stop loss %
    1.00,    -- Min stop loss %
    100.00,  -- Max take profit %
    5.00,    -- Min take profit %
    10,      -- Rate limit per minute
    100,     -- Rate limit per hour
    true,    -- Mainnet enabled
    true,    -- Testnet enabled
    ARRAY['binance', 'bybit', 'okx'],
    ARRAY['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT'],
    10.00,   -- Max daily loss %
    50,      -- Max daily trades
    10,      -- Max concurrent positions
    'SYSTEM'
) ON CONFLICT DO NOTHING;

-- ========================================
-- 10. VIEWS PARA RELATÓRIOS
-- ========================================

-- View para estatísticas da fila
CREATE OR REPLACE VIEW trading_queue_stats AS
SELECT 
    status,
    priority,
    environment,
    exchange,
    COUNT(*) as count,
    AVG(EXTRACT(EPOCH FROM (COALESCE(started_at, NOW()) - created_at))) as avg_wait_time_seconds,
    AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_processing_time_seconds,
    MIN(created_at) as oldest_trade,
    MAX(created_at) as newest_trade
FROM trading_queue 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status, priority, environment, exchange
ORDER BY priority DESC, status;

-- View para posições ativas por usuário
CREATE OR REPLACE VIEW active_positions_summary AS
SELECT 
    user_id,
    COUNT(*) as total_positions,
    SUM(amount_usd) as total_amount_usd,
    SUM(unrealized_pnl) as total_unrealized_pnl,
    SUM(realized_pnl) as total_realized_pnl,
    AVG(leverage) as avg_leverage,
    array_agg(DISTINCT symbol) as symbols_traded,
    array_agg(DISTINCT exchange) as exchanges_used
FROM trading_positions 
WHERE status = 'OPEN'
GROUP BY user_id;

-- View para auditoria recente
CREATE OR REPLACE VIEW recent_config_changes AS
SELECT 
    a.*,
    u.name as admin_name,
    u.email as admin_email
FROM trading_config_audit a
LEFT JOIN users u ON a.admin_user = u.id
WHERE a.created_at > NOW() - INTERVAL '7 days'
ORDER BY a.created_at DESC;

COMMIT;

-- ========================================
-- MIGRAÇÃO COMPLETA! 
-- Sistema de Trading Enterprise está pronto para Sprint 5
-- ========================================
