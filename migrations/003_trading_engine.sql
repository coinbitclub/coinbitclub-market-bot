-- ========================================
-- MARKETBOT DATABASE SCHEMA - FASE 3
-- Trading Engine & Exchange Connections
-- ========================================

-- ========================================
-- 1. TIPOS ENUM PARA TRADING
-- ========================================

-- Enum para exchanges suportadas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'exchange_type') THEN
        CREATE TYPE exchange_type AS ENUM ('BINANCE', 'BYBIT', 'BINANCE_TESTNET', 'BYBIT_TESTNET');
    END IF;
END
$$;

-- Enum para tipos de ordem
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_type') THEN
        CREATE TYPE order_type AS ENUM ('MARKET', 'LIMIT', 'STOP_MARKET', 'STOP_LIMIT', 'TAKE_PROFIT');
    END IF;
END
$$;

-- Enum para lado da ordem
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_side') THEN
        CREATE TYPE order_side AS ENUM ('BUY', 'SELL');
    END IF;
END
$$;

-- Enum para status da ordem
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM (
            'PENDING', 'SUBMITTED', 'FILLED', 'PARTIALLY_FILLED', 
            'CANCELLED', 'REJECTED', 'EXPIRED'
        );
    END IF;
END
$$;

-- Enum para status de posição
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'position_status') THEN
        CREATE TYPE position_status AS ENUM ('OPEN', 'CLOSED', 'LIQUIDATED');
    END IF;
END
$$;

-- Enum para tipo de sinal
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'signal_type') THEN
        CREATE TYPE signal_type AS ENUM ('LONG', 'SHORT', 'CLOSE_LONG', 'CLOSE_SHORT');
    END IF;
END
$$;

-- Enum para status do sinal
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'signal_status') THEN
        CREATE TYPE signal_status AS ENUM ('PENDING', 'PROCESSING', 'EXECUTED', 'FAILED', 'IGNORED');
    END IF;
END
$$;

-- ========================================
-- 2. TABELA DE CONEXÕES COM EXCHANGES
-- ========================================

CREATE TABLE IF NOT EXISTS user_exchange_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exchange exchange_type NOT NULL,
    account_name VARCHAR(100) NOT NULL, -- Nome dado pelo usuário
    api_key VARCHAR(500) NOT NULL, -- Criptografado
    api_secret VARCHAR(500) NOT NULL, -- Criptografado
    passphrase VARCHAR(200), -- Para exchanges que precisam (OKX, etc)
    is_testnet BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE, -- Verificado via test connection
    
    -- Permissões da API
    can_read BOOLEAN DEFAULT TRUE,
    can_trade BOOLEAN DEFAULT FALSE,
    can_withdraw BOOLEAN DEFAULT FALSE,
    
    -- Configurações de trading
    max_position_size_usd DECIMAL(15,2) DEFAULT 1000.00,
    daily_loss_limit_usd DECIMAL(15,2) DEFAULT 500.00,
    max_drawdown_percent DECIMAL(5,2) DEFAULT 10.00,
    
    -- Metadados
    last_connection_test TIMESTAMP WITH TIME ZONE,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    total_positions INTEGER DEFAULT 0,
    total_pnl_usd DECIMAL(15,2) DEFAULT 0.00,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_max_position_positive CHECK (max_position_size_usd > 0),
    CONSTRAINT chk_daily_loss_positive CHECK (daily_loss_limit_usd > 0),
    CONSTRAINT chk_drawdown_range CHECK (max_drawdown_percent BETWEEN 1 AND 50),
    CONSTRAINT uk_user_exchange_name UNIQUE (user_id, exchange, account_name)
);

-- ========================================
-- 3. TABELA DE SINAIS DE TRADING
-- ========================================

CREATE TABLE IF NOT EXISTS trading_signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Origem do sinal
    source VARCHAR(50) NOT NULL, -- 'TRADINGVIEW', 'MANUAL', 'BOT'
    webhook_id VARCHAR(100), -- ID do webhook para rastreamento
    
    -- Dados do sinal
    symbol VARCHAR(20) NOT NULL, -- Ex: BTCUSDT
    signal_type signal_type NOT NULL,
    leverage INTEGER DEFAULT 1,
    
    -- Preços e targets
    entry_price DECIMAL(20,8),
    stop_loss DECIMAL(20,8),
    take_profit_1 DECIMAL(20,8),
    take_profit_2 DECIMAL(20,8),
    take_profit_3 DECIMAL(20,8),
    
    -- Configurações
    position_size_percent DECIMAL(5,2) DEFAULT 30.00, -- % do saldo
    risk_reward_ratio DECIMAL(8,2),
    
    -- Status e execução
    status signal_status DEFAULT 'PENDING',
    received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadados
    raw_data JSONB, -- Dados brutos do webhook
    notes TEXT,
    
    -- Constraints
    CONSTRAINT chk_leverage_range CHECK (leverage BETWEEN 1 AND 100),
    CONSTRAINT chk_position_size_range CHECK (position_size_percent BETWEEN 1 AND 100),
    CONSTRAINT chk_prices_positive CHECK (
        (entry_price IS NULL OR entry_price > 0) AND
        (stop_loss IS NULL OR stop_loss > 0) AND
        (take_profit_1 IS NULL OR take_profit_1 > 0)
    )
);

-- ========================================
-- 4. TABELA DE POSIÇÕES
-- ========================================

CREATE TABLE IF NOT EXISTS trading_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exchange_account_id UUID NOT NULL REFERENCES user_exchange_accounts(id) ON DELETE CASCADE,
    signal_id UUID REFERENCES trading_signals(id),
    
    -- Dados da posição
    symbol VARCHAR(20) NOT NULL,
    side order_side NOT NULL, -- BUY (LONG) or SELL (SHORT)
    size DECIMAL(20,8) NOT NULL, -- Quantidade em moeda base
    entry_price DECIMAL(20,8) NOT NULL,
    current_price DECIMAL(20,8),
    
    -- Configurações de risco
    leverage INTEGER DEFAULT 1,
    stop_loss DECIMAL(20,8),
    take_profit DECIMAL(20,8),
    
    -- Status e timing
    status position_status DEFAULT 'OPEN',
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITH TIME ZONE,
    
    -- PnL e métricas
    unrealized_pnl_usd DECIMAL(15,2) DEFAULT 0.00,
    realized_pnl_usd DECIMAL(15,2) DEFAULT 0.00,
    fees_paid_usd DECIMAL(10,2) DEFAULT 0.00,
    
    -- IDs externos da exchange
    exchange_position_id VARCHAR(100),
    exchange_order_ids JSONB, -- Array de IDs das ordens
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_size_positive CHECK (size > 0),
    CONSTRAINT chk_entry_price_positive CHECK (entry_price > 0),
    CONSTRAINT chk_position_leverage CHECK (leverage BETWEEN 1 AND 100)
);

-- ========================================
-- 5. TABELA DE ORDENS
-- ========================================

CREATE TABLE IF NOT EXISTS trading_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exchange_account_id UUID NOT NULL REFERENCES user_exchange_accounts(id) ON DELETE CASCADE,
    position_id UUID REFERENCES trading_positions(id),
    signal_id UUID REFERENCES trading_signals(id),
    
    -- Dados da ordem
    symbol VARCHAR(20) NOT NULL,
    type order_type NOT NULL,
    side order_side NOT NULL,
    amount DECIMAL(20,8) NOT NULL, -- Quantidade
    price DECIMAL(20,8), -- NULL para market orders
    
    -- Status e execução
    status order_status DEFAULT 'PENDING',
    filled_amount DECIMAL(20,8) DEFAULT 0,
    average_price DECIMAL(20,8),
    
    -- IDs da exchange
    exchange_order_id VARCHAR(100),
    client_order_id VARCHAR(100),
    
    -- Timestamps
    submitted_at TIMESTAMP WITH TIME ZONE,
    filled_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    -- Fees e custos
    fee_amount DECIMAL(15,8) DEFAULT 0,
    fee_currency VARCHAR(10),
    
    -- Metadados
    raw_response JSONB, -- Resposta completa da exchange
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_amount_positive CHECK (amount > 0),
    CONSTRAINT chk_price_positive CHECK (price IS NULL OR price > 0),
    CONSTRAINT chk_filled_amount_valid CHECK (filled_amount >= 0 AND filled_amount <= amount)
);

-- ========================================
-- 6. TABELA DE CONFIGURAÇÕES DE TRADING
-- ========================================

CREATE TABLE IF NOT EXISTS trading_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Configurações gerais
    auto_trading_enabled BOOLEAN DEFAULT FALSE,
    preferred_exchange exchange_type DEFAULT 'BINANCE',
    use_testnet BOOLEAN DEFAULT TRUE,
    
    -- Gerenciamento de risco
    max_concurrent_positions INTEGER DEFAULT 3,
    max_daily_trades INTEGER DEFAULT 10,
    daily_loss_limit_usd DECIMAL(10,2) DEFAULT 500.00,
    max_position_size_percent DECIMAL(5,2) DEFAULT 30.00,
    
    -- Stop Loss e Take Profit padrão
    default_stop_loss_percent DECIMAL(5,2) DEFAULT 2.00,
    default_take_profit_percent DECIMAL(5,2) DEFAULT 4.00,
    use_trailing_stop BOOLEAN DEFAULT FALSE,
    trailing_stop_percent DECIMAL(5,2) DEFAULT 1.50,
    
    -- Configurações de leverage
    default_leverage INTEGER DEFAULT 5,
    max_allowed_leverage INTEGER DEFAULT 10,
    
    -- Filtros de sinais
    min_risk_reward_ratio DECIMAL(8,2) DEFAULT 1.50,
    allowed_symbols JSONB, -- Array de símbolos permitidos
    blocked_symbols JSONB, -- Array de símbolos bloqueados
    
    -- Horários de trading
    trading_start_hour INTEGER DEFAULT 0, -- UTC
    trading_end_hour INTEGER DEFAULT 24, -- UTC
    trade_on_weekends BOOLEAN DEFAULT TRUE,
    
    -- Notificações
    notify_on_signal BOOLEAN DEFAULT TRUE,
    notify_on_fill BOOLEAN DEFAULT TRUE,
    notify_on_stop_loss BOOLEAN DEFAULT TRUE,
    notify_on_take_profit BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_max_positions CHECK (max_concurrent_positions BETWEEN 1 AND 20),
    CONSTRAINT chk_max_daily_trades CHECK (max_daily_trades BETWEEN 1 AND 100),
    CONSTRAINT chk_daily_loss_positive CHECK (daily_loss_limit_usd > 0),
    CONSTRAINT chk_position_size_valid CHECK (max_position_size_percent BETWEEN 1 AND 100),
    CONSTRAINT chk_stop_loss_valid CHECK (default_stop_loss_percent BETWEEN 0.1 AND 20),
    CONSTRAINT chk_take_profit_valid CHECK (default_take_profit_percent BETWEEN 0.1 AND 50),
    CONSTRAINT chk_leverage_valid CHECK (default_leverage BETWEEN 1 AND max_allowed_leverage),
    CONSTRAINT chk_hours_valid CHECK (
        trading_start_hour BETWEEN 0 AND 23 AND 
        trading_end_hour BETWEEN 0 AND 24
    ),
    CONSTRAINT uk_user_trading_settings UNIQUE (user_id)
);

-- ========================================
-- 7. TABELA DE DADOS DE MERCADO
-- ========================================

CREATE TABLE IF NOT EXISTS market_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(20) NOT NULL,
    exchange exchange_type NOT NULL,
    
    -- OHLCV data
    open_price DECIMAL(20,8) NOT NULL,
    high_price DECIMAL(20,8) NOT NULL,
    low_price DECIMAL(20,8) NOT NULL,
    close_price DECIMAL(20,8) NOT NULL,
    volume DECIMAL(20,8) NOT NULL,
    
    -- Timestamp
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    timeframe VARCHAR(10) NOT NULL, -- 1m, 5m, 15m, 1h, 4h, 1d
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_ohlcv_positive CHECK (
        open_price > 0 AND high_price > 0 AND 
        low_price > 0 AND close_price > 0 AND volume >= 0
    ),
    CONSTRAINT chk_high_low CHECK (high_price >= low_price),
    CONSTRAINT uk_market_data UNIQUE (symbol, exchange, timestamp, timeframe)
);

-- ========================================
-- 8. ÍNDICES PARA PERFORMANCE
-- ========================================

-- Exchange Accounts
CREATE INDEX idx_exchange_accounts_user_id ON user_exchange_accounts(user_id);
CREATE INDEX idx_exchange_accounts_exchange ON user_exchange_accounts(exchange);
CREATE INDEX idx_exchange_accounts_active ON user_exchange_accounts(is_active);

-- Trading Signals
CREATE INDEX idx_signals_status ON trading_signals(status);
CREATE INDEX idx_signals_symbol ON trading_signals(symbol);
CREATE INDEX idx_signals_received_at ON trading_signals(received_at);
CREATE INDEX idx_signals_source ON trading_signals(source);
CREATE INDEX idx_signals_expires_at ON trading_signals(expires_at);

-- Positions
CREATE INDEX idx_positions_user_id ON trading_positions(user_id);
CREATE INDEX idx_positions_exchange_account ON trading_positions(exchange_account_id);
CREATE INDEX idx_positions_symbol ON trading_positions(symbol);
CREATE INDEX idx_positions_status ON trading_positions(status);
CREATE INDEX idx_positions_opened_at ON trading_positions(opened_at);
CREATE INDEX idx_positions_signal_id ON trading_positions(signal_id);

-- Orders
CREATE INDEX idx_orders_user_id ON trading_orders(user_id);
CREATE INDEX idx_orders_exchange_account ON trading_orders(exchange_account_id);
CREATE INDEX idx_orders_position_id ON trading_orders(position_id);
CREATE INDEX idx_orders_symbol ON trading_orders(symbol);
CREATE INDEX idx_orders_status ON trading_orders(status);
CREATE INDEX idx_orders_exchange_order_id ON trading_orders(exchange_order_id);
CREATE INDEX idx_orders_submitted_at ON trading_orders(submitted_at);

-- Trading Settings
CREATE INDEX idx_trading_settings_user_id ON trading_settings(user_id);

-- Market Data
CREATE INDEX idx_market_data_symbol ON market_data(symbol);
CREATE INDEX idx_market_data_exchange ON market_data(exchange);
CREATE INDEX idx_market_data_timestamp ON market_data(timestamp);
CREATE INDEX idx_market_data_timeframe ON market_data(timeframe);
CREATE INDEX idx_market_data_symbol_timeframe ON market_data(symbol, timeframe, timestamp);

-- ========================================
-- 9. TRIGGERS PARA UPDATED_AT
-- ========================================

CREATE TRIGGER update_exchange_accounts_updated_at BEFORE UPDATE ON user_exchange_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON trading_positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON trading_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trading_settings_updated_at BEFORE UPDATE ON trading_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 10. FUNÇÕES AUXILIARES PARA TRADING
-- ========================================

-- Função para calcular PnL de uma posição
CREATE OR REPLACE FUNCTION calculate_position_pnl(
    p_side order_side,
    p_entry_price DECIMAL(20,8),
    p_current_price DECIMAL(20,8),
    p_size DECIMAL(20,8)
) RETURNS DECIMAL(15,2) AS $$
DECLARE
    pnl DECIMAL(15,2);
BEGIN
    IF p_side = 'BUY' THEN
        -- Long position: PnL = (current_price - entry_price) * size
        pnl := (p_current_price - p_entry_price) * p_size;
    ELSE
        -- Short position: PnL = (entry_price - current_price) * size
        pnl := (p_entry_price - p_current_price) * p_size;
    END IF;
    
    RETURN pnl;
END;
$$ LANGUAGE plpgsql;

-- Função para limpar dados de mercado antigos
CREATE OR REPLACE FUNCTION cleanup_old_market_data(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM market_data 
    WHERE created_at < CURRENT_TIMESTAMP - (days_to_keep || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar limites de risco diários
CREATE OR REPLACE FUNCTION check_daily_trading_limits(p_user_id UUID)
RETURNS TABLE (
    can_trade BOOLEAN,
    daily_pnl DECIMAL(15,2),
    daily_trades INTEGER,
    open_positions INTEGER
) AS $$
DECLARE
    settings_rec RECORD;
    today_start TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Busca configurações do usuário
    SELECT * INTO settings_rec FROM trading_settings WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        -- Valores padrão se não houver configurações
        settings_rec.max_daily_trades := 10;
        settings_rec.daily_loss_limit_usd := 500.00;
        settings_rec.max_concurrent_positions := 3;
    END IF;
    
    -- Início do dia atual
    today_start := date_trunc('day', CURRENT_TIMESTAMP);
    
    -- Calcula métricas do dia
    SELECT 
        COALESCE(SUM(realized_pnl_usd), 0) +
        COALESCE(SUM(unrealized_pnl_usd), 0),
        COUNT(DISTINCT CASE WHEN created_at >= today_start THEN id END),
        COUNT(CASE WHEN status = 'OPEN' THEN 1 END)
    INTO daily_pnl, daily_trades, open_positions
    FROM trading_positions 
    WHERE user_id = p_user_id;
    
    -- Verifica se pode continuar tradando
    can_trade := (
        daily_trades < settings_rec.max_daily_trades AND
        daily_pnl > -settings_rec.daily_loss_limit_usd AND
        open_positions < settings_rec.max_concurrent_positions
    );
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 11. VIEWS PARA RELATÓRIOS DE TRADING
-- ========================================

-- View para estatísticas de trading por usuário
CREATE VIEW v_trading_statistics AS
SELECT 
    u.id as user_id,
    u.email,
    COUNT(DISTINCT tp.id) as total_positions,
    COUNT(DISTINCT CASE WHEN tp.status = 'OPEN' THEN tp.id END) as open_positions,
    COUNT(DISTINCT CASE WHEN tp.status = 'CLOSED' THEN tp.id END) as closed_positions,
    COALESCE(SUM(tp.realized_pnl_usd), 0) as total_realized_pnl,
    COALESCE(SUM(tp.unrealized_pnl_usd), 0) as total_unrealized_pnl,
    COALESCE(SUM(tp.fees_paid_usd), 0) as total_fees_paid,
    COUNT(DISTINCT CASE WHEN tp.realized_pnl_usd > 0 THEN tp.id END) as winning_trades,
    COUNT(DISTINCT CASE WHEN tp.realized_pnl_usd < 0 THEN tp.id END) as losing_trades,
    CASE 
        WHEN COUNT(DISTINCT CASE WHEN tp.status = 'CLOSED' THEN tp.id END) > 0 
        THEN COUNT(DISTINCT CASE WHEN tp.realized_pnl_usd > 0 THEN tp.id END)::DECIMAL / 
             COUNT(DISTINCT CASE WHEN tp.status = 'CLOSED' THEN tp.id END) * 100
        ELSE 0 
    END as win_rate_percent
FROM users u
LEFT JOIN trading_positions tp ON u.id = tp.user_id
GROUP BY u.id, u.email;

-- View para sinais ativos
CREATE VIEW v_active_signals AS
SELECT 
    ts.*,
    COUNT(tp.id) as positions_created,
    SUM(CASE WHEN tp.status = 'OPEN' THEN 1 ELSE 0 END) as open_positions
FROM trading_signals ts
LEFT JOIN trading_positions tp ON ts.id = tp.signal_id
WHERE ts.status IN ('PENDING', 'PROCESSING')
    AND (ts.expires_at IS NULL OR ts.expires_at > CURRENT_TIMESTAMP)
GROUP BY ts.id;

-- ========================================
-- 12. DADOS INICIAIS PARA DESENVOLVIMENTO
-- ========================================

-- Insere configurações padrão para o usuário admin
INSERT INTO trading_settings (
    user_id,
    auto_trading_enabled,
    use_testnet,
    max_concurrent_positions,
    daily_loss_limit_usd,
    default_stop_loss_percent,
    default_take_profit_percent,
    default_leverage
) 
SELECT 
    id,
    FALSE,
    TRUE,
    3,
    500.00,
    2.00,
    4.00,
    5
FROM users 
WHERE email = 'admin@marketbot.com'
ON CONFLICT (user_id) DO NOTHING;

-- ========================================
-- SCHEMA DE TRADING CRIADO COM SUCESSO
-- ========================================

-- Verifica se todas as tabelas foram criadas
SELECT 
    'Trading tables created' as status,
    COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'user_exchange_accounts', 'trading_signals', 'trading_positions', 
    'trading_orders', 'trading_settings', 'market_data'
);
