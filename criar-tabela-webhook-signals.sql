-- ========================================
-- CRIAR TABELA PARA WEBHOOK SIGNALS
-- ========================================

-- Tabela para armazenar sinais recebidos do TradingView
CREATE TABLE IF NOT EXISTS webhook_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(50) NOT NULL DEFAULT 'TRADINGVIEW',
    webhook_id VARCHAR(255),
    raw_data JSONB NOT NULL,
    parsed_data JSONB,
    token VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    received_at TIMESTAMP WITH TIME ZONE NOT NULL,
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_webhook_signals_received_at ON webhook_signals(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_signals_processed ON webhook_signals(processed, received_at);
CREATE INDEX IF NOT EXISTS idx_webhook_signals_source ON webhook_signals(source);

-- Adicionar campo webhook_signal_id na tabela trading_positions se não existir
ALTER TABLE trading_positions 
ADD COLUMN IF NOT EXISTS webhook_signal_id UUID REFERENCES webhook_signals(id);

-- Índice para relacionamento
CREATE INDEX IF NOT EXISTS idx_trading_positions_webhook_signal ON trading_positions(webhook_signal_id);

-- Comentários para documentação
COMMENT ON TABLE webhook_signals IS 'Armazena todos os sinais recebidos via webhook do TradingView';
COMMENT ON COLUMN webhook_signals.raw_data IS 'Dados brutos recebidos do TradingView';
COMMENT ON COLUMN webhook_signals.parsed_data IS 'Dados processados e interpretados';
COMMENT ON COLUMN webhook_signals.processed IS 'Indica se o sinal foi processado pelo orquestrador';

-- Inserir um registro de teste
INSERT INTO webhook_signals (
    source, webhook_id, raw_data, token, ip_address,
    received_at, processed
) VALUES (
    'TRADINGVIEW', 
    'test-webhook-001',
    '{"message": "Sistema de webhook configurado com sucesso", "test": true}',
    '210406',
    '127.0.0.1',
    CURRENT_TIMESTAMP,
    true
) ON CONFLICT DO NOTHING;
