-- CRIAÇÃO COMPLETA DAS TABELAS MARKETBOT
-- Este script cria todas as tabelas necessárias para o sistema

-- 1. Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  trading_ativo BOOLEAN DEFAULT false,
  saldo_disponivel DECIMAL(15,2) DEFAULT 0.00,
  exchange_principal VARCHAR(50) DEFAULT 'binance',
  api_key_binance TEXT,
  api_secret_binance TEXT,
  api_key_bybit TEXT,
  api_secret_bybit TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de sinais
CREATE TABLE IF NOT EXISTS sinais (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  action VARCHAR(10) NOT NULL, -- 'BUY' ou 'SELL'
  confidence INTEGER DEFAULT 50,
  price DECIMAL(15,8),
  source VARCHAR(100) DEFAULT 'webhook',
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

-- 3. Tabela de ordens
CREATE TABLE IF NOT EXISTS ordens (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id),
  signal_id INTEGER REFERENCES sinais(id),
  symbol VARCHAR(20) NOT NULL,
  side VARCHAR(10) NOT NULL, -- 'buy' ou 'sell'
  quantity DECIMAL(15,8) NOT NULL,
  price DECIMAL(15,8),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'filled', 'cancelled', 'failed'
  exchange VARCHAR(50) NOT NULL,
  exchange_order_id VARCHAR(100),
  filled_quantity DECIMAL(15,8) DEFAULT 0,
  avg_price DECIMAL(15,8),
  commission DECIMAL(15,8) DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabela de configurações de trading
CREATE TABLE IF NOT EXISTS configuracoes_trading (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id) UNIQUE,
  valor_operacao DECIMAL(10,2) DEFAULT 100.00,
  max_operacoes_simultaneas INTEGER DEFAULT 3,
  stop_loss_percent DECIMAL(5,2) DEFAULT 2.00,
  take_profit_percent DECIMAL(5,2) DEFAULT 5.00,
  exchanges_ativas TEXT[] DEFAULT ARRAY['binance','bybit'],
  symbols_ativos TEXT[] DEFAULT ARRAY['BTCUSDT','ETHUSDT','ADAUSDT'],
  risk_management JSONB DEFAULT '{"max_daily_loss": 500, "max_position_size": 1000}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabela de Market Intelligence
CREATE TABLE IF NOT EXISTS market_intelligence (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fear_greed_index INTEGER,
  btc_dominance DECIMAL(5,2),
  market_pulse JSONB,
  top_gainers JSONB,
  top_losers JSONB,
  volume_analysis JSONB,
  sentiment_score DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Verificar se webhook_signals já existe, senão criar
CREATE TABLE IF NOT EXISTS webhook_signals (
  id SERIAL PRIMARY KEY,
  signal_data JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_trading_ativo ON usuarios(trading_ativo);
CREATE INDEX IF NOT EXISTS idx_sinais_symbol ON sinais(symbol);
CREATE INDEX IF NOT EXISTS idx_sinais_processed ON sinais(processed);
CREATE INDEX IF NOT EXISTS idx_sinais_created_at ON sinais(created_at);
CREATE INDEX IF NOT EXISTS idx_ordens_usuario_id ON ordens(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ordens_status ON ordens(status);
CREATE INDEX IF NOT EXISTS idx_ordens_symbol ON ordens(symbol);
CREATE INDEX IF NOT EXISTS idx_ordens_created_at ON ordens(created_at);
CREATE INDEX IF NOT EXISTS idx_market_intelligence_timestamp ON market_intelligence(timestamp);
CREATE INDEX IF NOT EXISTS idx_webhook_signals_processed ON webhook_signals(processed);

-- Inserir usuário de teste com trading ativo
INSERT INTO usuarios (nome, email, senha_hash, trading_ativo, saldo_disponivel, exchange_principal)
VALUES 
  ('Trading Bot Demo', 'demo@marketbot.com', '$2b$10$dummy_hash_for_demo', true, 1000.00, 'binance'),
  ('Usuário Real 1', 'user1@coinbitclub.com', '$2b$10$dummy_hash_for_user1', true, 5000.00, 'binance'),
  ('Usuário Real 2', 'user2@coinbitclub.com', '$2b$10$dummy_hash_for_user2', true, 2500.00, 'bybit')
ON CONFLICT (email) DO NOTHING;

-- Inserir configurações de trading para os usuários
INSERT INTO configuracoes_trading (usuario_id, valor_operacao, max_operacoes_simultaneas, stop_loss_percent, take_profit_percent)
SELECT id, 100.00, 3, 2.00, 5.00 
FROM usuarios 
WHERE trading_ativo = true
ON CONFLICT (usuario_id) DO UPDATE SET
  valor_operacao = EXCLUDED.valor_operacao,
  max_operacoes_simultaneas = EXCLUDED.max_operacoes_simultaneas,
  stop_loss_percent = EXCLUDED.stop_loss_percent,
  take_profit_percent = EXCLUDED.take_profit_percent;

-- Inserir dados de exemplo de Market Intelligence
INSERT INTO market_intelligence (fear_greed_index, btc_dominance, market_pulse, sentiment_score)
VALUES (45, 52.3, '{"trend": "bullish", "volume": "high", "momentum": "positive"}', 0.65);

-- Inserir sinais de exemplo
INSERT INTO sinais (symbol, action, confidence, price, source)
VALUES 
  ('BTCUSDT', 'BUY', 75, 65000.00, 'technical_analysis'),
  ('ETHUSDT', 'BUY', 68, 3200.00, 'market_intelligence'),
  ('ADAUSDT', 'SELL', 72, 0.45, 'webhook');
