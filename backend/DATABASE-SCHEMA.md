# 🗃️ Database Schema - CoinBitClub Market Bot

![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-blue.svg)
![Tables](https://img.shields.io/badge/Tables-166-green.svg)
![Railway](https://img.shields.io/badge/Host-Railway-purple.svg)

## 📋 Índice

- [🌐 Visão Geral](#visão-geral)
- [🏗️ Estrutura Principal](#estrutura-principal)
- [👥 Sistema de Usuários](#sistema-de-usuários)
- [📊 Trading e Operações](#trading-e-operações)
- [💰 Sistema Financeiro](#sistema-financeiro)
- [🤖 IA e Monitoramento](#ia-e-monitoramento)
- [📈 Analytics e Relatórios](#analytics-e-relatórios)
- [🔧 Sistema e Configuração](#sistema-e-configuração)
- [📝 Relacionamentos](#relacionamentos)
- [🚀 Scripts de Migração](#scripts-de-migração)

---

## 🌐 Visão Geral

O banco de dados do CoinBitClub Market Bot utiliza **PostgreSQL** hospedado no **Railway** com **166 tabelas** organizadas em módulos funcionais para suportar todas as operações do sistema de trading automatizado.

### 📊 Estatísticas do Banco

- **Total de Tabelas:** 166
- **Índices:** 200+
- **Triggers:** 50+
- **Functions:** 25+
- **Views:** 15+

### 🔗 Conexão

```bash
# URL de conexão (Railway)
DATABASE_URL=postgresql://postgres:password@host:port/database

# Configuração local
HOST=localhost
PORT=5432
DATABASE=coinbitclub_bot
USERNAME=postgres
PASSWORD=your_password
```

---

## 🏗️ Estrutura Principal

### 📁 Organização por Módulos

```
Database (166 tables)
├── 👥 Users & Authentication (15 tables)
├── 📊 Trading & Operations (25 tables)
├── 💰 Financial System (20 tables)
├── 🤖 AI & Monitoring (18 tables)
├── 📈 Analytics & Reports (12 tables)
├── 🔧 System & Configuration (10 tables)
├── 🔑 API Keys & Security (8 tables)
├── 📝 Logs & Audit (15 tables)
├── 🎯 Gestores & Orchestration (10 tables)
├── 📊 Fear & Greed Data (5 tables)
├── 🔔 Notifications (8 tables)
├── 💳 Payments & Billing (10 tables)
└── 🌐 External Integrations (10 tables)
```

---

## 👥 Sistema de Usuários

### 📋 Tabela Principal: `users`

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    plan_type VARCHAR(50) DEFAULT 'BASIC', -- VIP, BASIC
    status VARCHAR(50) DEFAULT 'active',   -- active, inactive, suspended
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    
    -- Configurações de trading
    trading_enabled BOOLEAN DEFAULT true,
    max_positions INTEGER DEFAULT 5,
    risk_level VARCHAR(50) DEFAULT 'medium',
    
    -- Dados adicionais
    phone VARCHAR(50),
    country VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    CONSTRAINT users_plan_type_check CHECK (plan_type IN ('VIP', 'BASIC')),
    CONSTRAINT users_status_check CHECK (status IN ('active', 'inactive', 'suspended'))
);

-- Índices
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_plan_type ON users(plan_type);
CREATE INDEX idx_users_created_at ON users(created_at);
```

### 🔑 Tabela: `user_api_keys`

```sql
CREATE TABLE user_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exchange VARCHAR(50) NOT NULL DEFAULT 'bybit',
    api_key VARCHAR(500) NOT NULL,
    api_secret VARCHAR(500) NOT NULL,
    is_testnet BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Validação
    last_validated TIMESTAMP,
    validation_status VARCHAR(50) DEFAULT 'pending',
    validation_error TEXT,
    
    -- Permissões
    permissions JSONB DEFAULT '[]',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT uk_user_exchange UNIQUE(user_id, exchange),
    CONSTRAINT chk_validation_status CHECK (validation_status IN ('pending', 'valid', 'invalid', 'expired'))
);

-- Índices
CREATE INDEX idx_user_api_keys_user_id ON user_api_keys(user_id);
CREATE INDEX idx_user_api_keys_validation_status ON user_api_keys(validation_status);
```

### 👤 Tabela: `user_profiles`

```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Dados pessoais
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE,
    document_number VARCHAR(50),
    document_type VARCHAR(20),
    
    -- Endereço
    address JSONB,
    
    -- Configurações
    notification_preferences JSONB DEFAULT '{}',
    ui_preferences JSONB DEFAULT '{}',
    
    -- KYC
    kyc_status VARCHAR(50) DEFAULT 'pending',
    kyc_data JSONB,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📊 Trading e Operações

### 📡 Tabela: `trading_signals`

```sql
CREATE TABLE trading_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Dados do sinal
    symbol VARCHAR(50) NOT NULL,
    action VARCHAR(10) NOT NULL, -- BUY, SELL, LONG, SHORT
    price DECIMAL(20,8),
    quantity DECIMAL(20,8),
    
    -- Origem
    source VARCHAR(50) DEFAULT 'tradingview',
    source_id VARCHAR(255),
    
    -- Processamento
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP,
    processing_error TEXT,
    
    -- Validação Fear & Greed
    fear_greed_value INTEGER,
    fear_greed_compatible BOOLEAN,
    
    -- Dados adicionais
    timeframe VARCHAR(20),
    exchange VARCHAR(50) DEFAULT 'bybit',
    strategy_name VARCHAR(100),
    
    -- Metadata
    raw_data JSONB,
    
    -- Timestamps
    received_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT chk_action CHECK (action IN ('BUY', 'SELL', 'LONG', 'SHORT'))
);

-- Índices
CREATE INDEX idx_trading_signals_symbol ON trading_signals(symbol);
CREATE INDEX idx_trading_signals_action ON trading_signals(action);
CREATE INDEX idx_trading_signals_processed ON trading_signals(processed);
CREATE INDEX idx_trading_signals_received_at ON trading_signals(received_at);
```

### 💼 Tabela: `user_operations`

```sql
CREATE TABLE user_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    signal_id UUID REFERENCES trading_signals(id),
    
    -- Dados da operação
    symbol VARCHAR(50) NOT NULL,
    side VARCHAR(10) NOT NULL, -- Buy, Sell
    operation_type VARCHAR(20) DEFAULT 'SIGNAL', -- SIGNAL, MANUAL, AUTO
    
    -- Preços e quantidades
    entry_price DECIMAL(20,8),
    current_price DECIMAL(20,8),
    exit_price DECIMAL(20,8),
    quantity DECIMAL(20,8),
    
    -- P&L
    unrealized_pnl DECIMAL(20,8) DEFAULT 0,
    realized_pnl DECIMAL(20,8) DEFAULT 0,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending',
    -- pending, active, closed, cancelled, error
    
    -- Timestamps das fases
    created_at TIMESTAMP DEFAULT NOW(),
    opened_at TIMESTAMP,
    closed_at TIMESTAMP,
    
    -- Dados da exchange
    exchange_order_id VARCHAR(255),
    exchange_data JSONB,
    
    -- Stop Loss / Take Profit
    stop_loss DECIMAL(20,8),
    take_profit DECIMAL(20,8),
    
    -- Comissões
    commission DECIMAL(20,8) DEFAULT 0,
    
    CONSTRAINT chk_status CHECK (status IN ('pending', 'active', 'closed', 'cancelled', 'error'))
);

-- Índices
CREATE INDEX idx_user_operations_user_id ON user_operations(user_id);
CREATE INDEX idx_user_operations_status ON user_operations(status);
CREATE INDEX idx_user_operations_symbol ON user_operations(symbol);
CREATE INDEX idx_user_operations_created_at ON user_operations(created_at);
```

### 📈 Tabela: `position_monitoring`

```sql
CREATE TABLE position_monitoring (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation_id UUID NOT NULL REFERENCES user_operations(id),
    
    -- Dados de monitoramento
    current_price DECIMAL(20,8),
    unrealized_pnl DECIMAL(20,8),
    pnl_percentage DECIMAL(10,4),
    
    -- Indicadores técnicos
    rsi DECIMAL(10,4),
    moving_average_20 DECIMAL(20,8),
    moving_average_50 DECIMAL(20,8),
    
    -- Análise de risco
    risk_score INTEGER,
    risk_level VARCHAR(20),
    
    -- Recomendações IA
    ai_recommendation VARCHAR(50), -- HOLD, CLOSE, ADJUST_SL, ADJUST_TP
    ai_confidence DECIMAL(5,2),
    
    monitored_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_position_monitoring_operation_id ON position_monitoring(operation_id);
CREATE INDEX idx_position_monitoring_monitored_at ON position_monitoring(monitored_at);
```

---

## 💰 Sistema Financeiro

### 💳 Tabela: `user_balances`

```sql
CREATE TABLE user_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- Saldos
    total_balance DECIMAL(20,8) DEFAULT 0,
    available_balance DECIMAL(20,8) DEFAULT 0,
    locked_balance DECIMAL(20,8) DEFAULT 0,
    
    -- Por moeda
    currency VARCHAR(10) DEFAULT 'USDT',
    
    -- Timestamps
    last_updated TIMESTAMP DEFAULT NOW(),
    last_sync TIMESTAMP,
    
    -- Dados da exchange
    exchange_balance DECIMAL(20,8),
    exchange_data JSONB,
    
    CONSTRAINT uk_user_currency UNIQUE(user_id, currency)
);

-- Índices
CREATE INDEX idx_user_balances_user_id ON user_balances(user_id);
CREATE INDEX idx_user_balances_currency ON user_balances(currency);
```

### 💰 Tabela: `commission_calculations`

```sql
CREATE TABLE commission_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation_id UUID NOT NULL REFERENCES user_operations(id),
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- Dados da comissão
    operation_volume DECIMAL(20,8),
    commission_rate DECIMAL(5,4), -- Exemplo: 0.1000 = 10%
    commission_amount DECIMAL(20,8),
    
    -- Tipo de comissão
    commission_type VARCHAR(50) DEFAULT 'trading', -- trading, referral, bonus
    
    -- Status
    status VARCHAR(50) DEFAULT 'calculated',
    -- calculated, paid, pending, cancelled
    
    -- Processamento
    calculated_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP,
    
    -- Referência de pagamento
    payment_reference VARCHAR(255),
    
    CONSTRAINT chk_commission_status CHECK (status IN ('calculated', 'paid', 'pending', 'cancelled'))
);

-- Índices
CREATE INDEX idx_commission_calculations_user_id ON commission_calculations(user_id);
CREATE INDEX idx_commission_calculations_status ON commission_calculations(status);
CREATE INDEX idx_commission_calculations_calculated_at ON commission_calculations(calculated_at);
```

### 📊 Tabela: `financial_transactions`

```sql
CREATE TABLE financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- Dados da transação
    type VARCHAR(50) NOT NULL, -- deposit, withdrawal, commission, fee
    amount DECIMAL(20,8) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USDT',
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending',
    -- pending, completed, failed, cancelled
    
    -- Referências
    reference_id VARCHAR(255),
    external_reference VARCHAR(255),
    
    -- Descrição
    description TEXT,
    category VARCHAR(50),
    
    -- Processamento
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP,
    
    -- Dados adicionais
    metadata JSONB DEFAULT '{}',
    
    CONSTRAINT chk_transaction_type CHECK (type IN ('deposit', 'withdrawal', 'commission', 'fee', 'bonus', 'adjustment')),
    CONSTRAINT chk_transaction_status CHECK (status IN ('pending', 'completed', 'failed', 'cancelled'))
);

-- Índices
CREATE INDEX idx_financial_transactions_user_id ON financial_transactions(user_id);
CREATE INDEX idx_financial_transactions_type ON financial_transactions(type);
CREATE INDEX idx_financial_transactions_status ON financial_transactions(status);
CREATE INDEX idx_financial_transactions_created_at ON financial_transactions(created_at);
```

---

## 🤖 IA e Monitoramento

### 🧠 Tabela: `fear_greed_data`

```sql
CREATE TABLE fear_greed_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Dados do índice
    value INTEGER NOT NULL CHECK (value >= 0 AND value <= 100),
    classification VARCHAR(50) NOT NULL,
    -- EXTREME_FEAR, FEAR, NEUTRAL, GREED, EXTREME_GREED
    
    -- Direções permitidas
    directions_allowed JSONB DEFAULT '[]',
    -- ["LONG"], ["SHORT"], ["LONG", "SHORT"]
    
    -- Fonte dos dados
    source VARCHAR(50) DEFAULT 'alternative.me',
    source_timestamp TIMESTAMP,
    
    -- Timestamps
    collected_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Dados adicionais
    metadata JSONB DEFAULT '{}'
);

-- Índices
CREATE INDEX idx_fear_greed_data_value ON fear_greed_data(value);
CREATE INDEX idx_fear_greed_data_classification ON fear_greed_data(classification);
CREATE INDEX idx_fear_greed_data_collected_at ON fear_greed_data(collected_at);
```

### 🤖 Tabela: `ai_supervisor_logs`

```sql
CREATE TABLE ai_supervisor_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação do supervisor
    supervisor_name VARCHAR(100) NOT NULL,
    supervisor_type VARCHAR(50), -- FINANCIAL, TRADE_REALTIME, RISK
    
    -- Dados do log
    event_type VARCHAR(50) NOT NULL, -- ALERT, ANALYSIS, DECISION, ERROR
    severity VARCHAR(20) DEFAULT 'INFO', -- DEBUG, INFO, WARNING, ERROR, CRITICAL
    
    -- Conteúdo
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    
    -- Contexto
    related_user_id UUID REFERENCES users(id),
    related_operation_id UUID REFERENCES user_operations(id),
    
    -- Ação tomada
    action_taken VARCHAR(100),
    action_result VARCHAR(50),
    
    -- Timestamps
    logged_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT chk_severity CHECK (severity IN ('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'))
);

-- Índices
CREATE INDEX idx_ai_supervisor_logs_supervisor_name ON ai_supervisor_logs(supervisor_name);
CREATE INDEX idx_ai_supervisor_logs_event_type ON ai_supervisor_logs(event_type);
CREATE INDEX idx_ai_supervisor_logs_severity ON ai_supervisor_logs(severity);
CREATE INDEX idx_ai_supervisor_logs_logged_at ON ai_supervisor_logs(logged_at);
```

### 🛡️ Tabela: `ai_guardian_events`

```sql
CREATE TABLE ai_guardian_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Dados do evento
    event_type VARCHAR(50) NOT NULL, -- THREAT_DETECTED, SIGNAL_BLOCKED, ANOMALY_FOUND
    threat_level VARCHAR(20) DEFAULT 'LOW', -- LOW, MEDIUM, HIGH, CRITICAL
    
    -- Análise
    signal_id UUID REFERENCES trading_signals(id),
    analysis_result JSONB,
    confidence_score DECIMAL(5,2),
    
    -- Ação
    action_taken VARCHAR(100),
    blocked BOOLEAN DEFAULT false,
    
    -- Detalhes
    description TEXT,
    patterns_detected JSONB DEFAULT '[]',
    
    -- Timestamps
    detected_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    
    CONSTRAINT chk_threat_level CHECK (threat_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'))
);

-- Índices
CREATE INDEX idx_ai_guardian_events_event_type ON ai_guardian_events(event_type);
CREATE INDEX idx_ai_guardian_events_threat_level ON ai_guardian_events(threat_level);
CREATE INDEX idx_ai_guardian_events_detected_at ON ai_guardian_events(detected_at);
```

---

## 📈 Analytics e Relatórios

### 📊 Tabela: `daily_statistics`

```sql
CREATE TABLE daily_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Data de referência
    date DATE NOT NULL,
    
    -- Estatísticas de sinais
    signals_received INTEGER DEFAULT 0,
    signals_processed INTEGER DEFAULT 0,
    signals_executed INTEGER DEFAULT 0,
    
    -- Estatísticas de operações
    operations_opened INTEGER DEFAULT 0,
    operations_closed INTEGER DEFAULT 0,
    operations_active INTEGER DEFAULT 0,
    
    -- Volumes
    total_volume DECIMAL(20,8) DEFAULT 0,
    successful_operations INTEGER DEFAULT 0,
    failed_operations INTEGER DEFAULT 0,
    
    -- P&L
    total_pnl DECIMAL(20,8) DEFAULT 0,
    total_commission DECIMAL(20,8) DEFAULT 0,
    
    -- Usuários
    active_users INTEGER DEFAULT 0,
    new_users INTEGER DEFAULT 0,
    
    -- Sistema
    uptime_percentage DECIMAL(5,2) DEFAULT 100.00,
    errors_count INTEGER DEFAULT 0,
    
    -- Timestamps
    calculated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT uk_daily_statistics_date UNIQUE(date)
);

-- Índices
CREATE INDEX idx_daily_statistics_date ON daily_statistics(date);
```

### 📈 Tabela: `performance_metrics`

```sql
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação
    metric_name VARCHAR(100) NOT NULL,
    metric_category VARCHAR(50), -- SYSTEM, TRADING, FINANCIAL, USER
    
    -- Valor da métrica
    metric_value DECIMAL(20,8),
    metric_unit VARCHAR(20),
    
    -- Contexto
    user_id UUID REFERENCES users(id),
    timeframe VARCHAR(20), -- 1H, 1D, 1W, 1M
    
    -- Comparação
    previous_value DECIMAL(20,8),
    change_percentage DECIMAL(10,4),
    
    -- Timestamps
    measured_at TIMESTAMP DEFAULT NOW(),
    period_start TIMESTAMP,
    period_end TIMESTAMP,
    
    -- Dados adicionais
    metadata JSONB DEFAULT '{}'
);

-- Índices
CREATE INDEX idx_performance_metrics_metric_name ON performance_metrics(metric_name);
CREATE INDEX idx_performance_metrics_category ON performance_metrics(metric_category);
CREATE INDEX idx_performance_metrics_measured_at ON performance_metrics(measured_at);
```

---

## 🔧 Sistema e Configuração

### ⚙️ Tabela: `system_configuration`

```sql
CREATE TABLE system_configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Chave de configuração
    config_key VARCHAR(255) NOT NULL UNIQUE,
    config_value TEXT,
    config_type VARCHAR(50) DEFAULT 'STRING', -- STRING, INTEGER, DECIMAL, BOOLEAN, JSON
    
    -- Categoria
    category VARCHAR(100), -- TRADING, SYSTEM, AI, NOTIFICATIONS
    
    -- Descrição
    description TEXT,
    default_value TEXT,
    
    -- Validação
    validation_rules JSONB,
    is_required BOOLEAN DEFAULT false,
    is_sensitive BOOLEAN DEFAULT false,
    
    -- Controle
    last_modified_by UUID REFERENCES users(id),
    last_modified_at TIMESTAMP DEFAULT NOW(),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_system_configuration_key ON system_configuration(config_key);
CREATE INDEX idx_system_configuration_category ON system_configuration(category);
```

### 🔄 Tabela: `gestor_status`

```sql
CREATE TABLE gestor_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação do gestor
    gestor_name VARCHAR(100) NOT NULL,
    gestor_type VARCHAR(50), -- OPERATIONS, MONITORING, FINANCIAL, COMMISSION
    
    -- Status
    status VARCHAR(50) DEFAULT 'INACTIVE', -- ACTIVE, INACTIVE, ERROR, MAINTENANCE
    is_running BOOLEAN DEFAULT false,
    
    -- Estatísticas
    cycles_completed INTEGER DEFAULT 0,
    last_cycle_duration INTEGER, -- em segundos
    errors_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Timestamps
    started_at TIMESTAMP,
    last_cycle_at TIMESTAMP,
    last_error_at TIMESTAMP,
    
    -- Configuração
    configuration JSONB DEFAULT '{}',
    
    -- Dados adicionais
    metadata JSONB DEFAULT '{}',
    
    CONSTRAINT uk_gestor_name UNIQUE(gestor_name),
    CONSTRAINT chk_gestor_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'ERROR', 'MAINTENANCE'))
);

-- Índices
CREATE INDEX idx_gestor_status_name ON gestor_status(gestor_name);
CREATE INDEX idx_gestor_status_status ON gestor_status(status);
CREATE INDEX idx_gestor_status_type ON gestor_status(gestor_type);
```

---

## 📝 Relacionamentos

### 🔗 Principais Relacionamentos

```mermaid
erDiagram
    USERS ||--o{ USER_API_KEYS : has
    USERS ||--o{ USER_OPERATIONS : creates
    USERS ||--o{ USER_BALANCES : owns
    USERS ||--o{ COMMISSION_CALCULATIONS : earns
    
    TRADING_SIGNALS ||--o{ USER_OPERATIONS : generates
    USER_OPERATIONS ||--o{ POSITION_MONITORING : monitored_by
    USER_OPERATIONS ||--o{ COMMISSION_CALCULATIONS : generates
    
    FEAR_GREED_DATA ||--o{ TRADING_SIGNALS : validates
    AI_SUPERVISOR_LOGS ||--o{ USER_OPERATIONS : monitors
    AI_GUARDIAN_EVENTS ||--o{ TRADING_SIGNALS : protects
```

### 📊 Constraints e Triggers

```sql
-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar a todas as tabelas com updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para calcular P&L automaticamente
CREATE OR REPLACE FUNCTION calculate_pnl()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.current_price IS NOT NULL AND NEW.entry_price IS NOT NULL THEN
        CASE NEW.side
            WHEN 'Buy' THEN
                NEW.unrealized_pnl = (NEW.current_price - NEW.entry_price) * NEW.quantity;
            WHEN 'Sell' THEN
                NEW.unrealized_pnl = (NEW.entry_price - NEW.current_price) * NEW.quantity;
        END CASE;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_operation_pnl
    BEFORE UPDATE ON user_operations
    FOR EACH ROW EXECUTE FUNCTION calculate_pnl();
```

---

## 🚀 Scripts de Migração

### 📝 Schema Completo

```sql
-- Script principal: _schema_completo_final.sql
-- Cria todas as 166 tabelas do sistema

-- Aplicar schema
\i _schema_completo_final.sql

-- Ou via Node.js
node aplicar-schema-completo.js
```

### 🔧 Scripts de Manutenção

```sql
-- Limpeza de dados antigos
DELETE FROM ai_supervisor_logs 
WHERE logged_at < NOW() - INTERVAL '30 days';

-- Otimização de índices
REINDEX DATABASE coinbitclub_bot;

-- Análise de performance
ANALYZE;

-- Vacuum para limpeza
VACUUM ANALYZE;
```

### 📊 Scripts de Backup

```bash
# Backup completo
pg_dump -h host -U user -d database > backup_$(date +%Y%m%d).sql

# Backup específico (apenas dados)
pg_dump -h host -U user -d database --data-only > backup_data_$(date +%Y%m%d).sql

# Restore
psql -h host -U user -d database < backup_20250731.sql
```

### 🔍 Scripts de Análise

```sql
-- Verificar tamanho das tabelas
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Verificar atividade por tabela
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes
FROM pg_stat_user_tables
ORDER BY n_tup_ins DESC;
```

---

## 📚 Comandos Úteis

### 🔍 Consultas de Monitoramento

```sql
-- Status geral dos usuários
SELECT 
    plan_type,
    status,
    COUNT(*) as total
FROM users 
GROUP BY plan_type, status;

-- Operações ativas por usuário
SELECT 
    u.name,
    COUNT(uo.*) as active_operations,
    SUM(uo.unrealized_pnl) as total_pnl
FROM users u
LEFT JOIN user_operations uo ON u.id = uo.user_id 
WHERE uo.status = 'active'
GROUP BY u.id, u.name;

-- Últimos sinais processados
SELECT 
    symbol,
    action,
    price,
    processed,
    received_at
FROM trading_signals 
ORDER BY received_at DESC 
LIMIT 10;

-- Performance dos gestores
SELECT 
    gestor_name,
    status,
    cycles_completed,
    success_rate,
    last_cycle_at
FROM gestor_status
ORDER BY gestor_name;
```

### 📊 Relatórios Financeiros

```sql
-- Resumo diário de P&L
SELECT 
    DATE(created_at) as date,
    COUNT(*) as operations,
    SUM(realized_pnl) as total_pnl,
    AVG(realized_pnl) as avg_pnl
FROM user_operations 
WHERE status = 'closed'
    AND created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Comissões por usuário
SELECT 
    u.name,
    SUM(cc.commission_amount) as total_commission,
    COUNT(cc.*) as commission_operations
FROM users u
JOIN commission_calculations cc ON u.id = cc.user_id
WHERE cc.status = 'paid'
GROUP BY u.id, u.name
ORDER BY total_commission DESC;
```

---

**🗃️ Database schema completo e otimizado para alta performance!** 🚀
