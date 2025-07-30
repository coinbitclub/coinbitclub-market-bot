-- Corrigir schema da tabela trading_signals para todos os gestores funcionarem
-- Adicionar colunas que estão faltando

-- Primeiro, verificar se a tabela existe e criar se necessário
CREATE TABLE IF NOT EXISTS trading_signals (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    action VARCHAR(10) NOT NULL,
    price DECIMAL(20,8),
    signal_data JSONB DEFAULT '{}',
    source VARCHAR(50) DEFAULT 'tradingview',
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Adicionar colunas que estão faltando (se não existirem)
DO $$ 
BEGIN
    -- Adicionar received_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trading_signals' AND column_name = 'received_at') THEN
        ALTER TABLE trading_signals ADD COLUMN received_at TIMESTAMP DEFAULT NOW();
    END IF;
    
    -- Adicionar processed
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trading_signals' AND column_name = 'processed') THEN
        ALTER TABLE trading_signals ADD COLUMN processed BOOLEAN DEFAULT false;
    END IF;
    
    -- Adicionar processed_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trading_signals' AND column_name = 'processed_at') THEN
        ALTER TABLE trading_signals ADD COLUMN processed_at TIMESTAMP;
    END IF;
    
    -- Adicionar user_id (para relacionar com usuários)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trading_signals' AND column_name = 'user_id') THEN
        ALTER TABLE trading_signals ADD COLUMN user_id INTEGER REFERENCES users(id);
    END IF;
    
    -- Adicionar fear_greed_value
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trading_signals' AND column_name = 'fear_greed_value') THEN
        ALTER TABLE trading_signals ADD COLUMN fear_greed_value INTEGER;
    END IF;
    
    -- Adicionar direction_allowed
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trading_signals' AND column_name = 'direction_allowed') THEN
        ALTER TABLE trading_signals ADD COLUMN direction_allowed VARCHAR(10);
    END IF;
    
    -- Adicionar signal_direction
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trading_signals' AND column_name = 'signal_direction') THEN
        ALTER TABLE trading_signals ADD COLUMN signal_direction VARCHAR(10);
    END IF;
    
    -- Adicionar validation_passed
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trading_signals' AND column_name = 'validation_passed') THEN
        ALTER TABLE trading_signals ADD COLUMN validation_passed BOOLEAN DEFAULT false;
    END IF;
    
    -- Adicionar rejection_reason
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trading_signals' AND column_name = 'rejection_reason') THEN
        ALTER TABLE trading_signals ADD COLUMN rejection_reason TEXT;
    END IF;
    
    -- Adicionar updated_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trading_signals' AND column_name = 'updated_at') THEN
        ALTER TABLE trading_signals ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    END IF;
    
END $$;

-- Atualizar dados existentes se necessário
UPDATE trading_signals 
SET received_at = created_at 
WHERE received_at IS NULL;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_trading_signals_status ON trading_signals(status);
CREATE INDEX IF NOT EXISTS idx_trading_signals_processed ON trading_signals(processed);
CREATE INDEX IF NOT EXISTS idx_trading_signals_received_at ON trading_signals(received_at);
CREATE INDEX IF NOT EXISTS idx_trading_signals_symbol ON trading_signals(symbol);
CREATE INDEX IF NOT EXISTS idx_trading_signals_user_id ON trading_signals(user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_trading_signals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_trading_signals_updated_at ON trading_signals;
CREATE TRIGGER update_trading_signals_updated_at 
    BEFORE UPDATE ON trading_signals 
    FOR EACH ROW EXECUTE FUNCTION update_trading_signals_updated_at();

-- Também precisamos da tabela user_operations (rename de trading_operations)
CREATE TABLE IF NOT EXISTS user_operations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Dados da operação
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL CHECK (side IN ('BUY', 'SELL', 'LONG', 'SHORT')),
    entry_price DECIMAL(20,8) NOT NULL,
    exit_price DECIMAL(20,8),
    quantity DECIMAL(20,8) NOT NULL,
    leverage DECIMAL(5,2) DEFAULT 1.0,
    
    -- Stop Loss e Take Profit
    take_profit DECIMAL(20,8),
    stop_loss DECIMAL(20,8),
    
    -- Resultado
    profit_loss DECIMAL(15,2),
    profit_loss_percentage DECIMAL(8,4),
    
    -- Controle
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled', 'pending')),
    exchange_name VARCHAR(50) NOT NULL,
    order_id VARCHAR(100),
    
    -- Fechamento
    close_reason VARCHAR(50),
    auto_closed BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    closed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Metadados
    metadata JSONB DEFAULT '{}'
);

-- Criar índices para user_operations
CREATE INDEX IF NOT EXISTS idx_user_operations_user_status ON user_operations(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_operations_created_at ON user_operations(created_at);
CREATE INDEX IF NOT EXISTS idx_user_operations_symbol ON user_operations(symbol);

-- Migrar dados de trading_operations para user_operations se necessário
INSERT INTO user_operations (
    user_id, symbol, side, entry_price, exit_price, quantity, leverage,
    take_profit, stop_loss, profit_loss, profit_loss_percentage,
    status, exchange_name, order_id, close_reason, auto_closed,
    created_at, closed_at, metadata
)
SELECT 
    user_id, symbol, side, entry_price, exit_price, quantity, leverage,
    take_profit, stop_loss, profit_loss, profit_loss_percentage,
    status, exchange_name, order_id, close_reason, auto_closed,
    created_at, closed_at, metadata
FROM trading_operations 
WHERE NOT EXISTS (
    SELECT 1 FROM user_operations uo 
    WHERE uo.user_id = trading_operations.user_id 
    AND uo.symbol = trading_operations.symbol 
    AND uo.created_at = trading_operations.created_at
);

SELECT '✅ Schema de trading_signals corrigido com todas as colunas necessárias!' as result;
