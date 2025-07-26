-- ===== MIGRAÇÃO ZAPI - WhatsApp Business API Integration =====
-- CoinBitClub Market Bot - Versão 3.0.0
-- Data: 26/07/2025
-- 
-- Sistema completo de integração com Zapi para 100% de conformidade

-- ===== TABELAS PARA LOGS E CONTROLE ZAPI =====

-- Tabela de logs de API WhatsApp (Zapi)
CREATE TABLE IF NOT EXISTS whatsapp_api_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    whatsapp_number VARCHAR(20) NOT NULL,
    message_content TEXT NOT NULL,
    message_type VARCHAR(30) NOT NULL CHECK (message_type IN ('verification', 'password_reset', 'notification', 'verification_success', 'verification_error')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'error', 'failed')),
    external_message_id VARCHAR(100),
    provider VARCHAR(20) DEFAULT 'zapi',
    provider_response JSONB,
    delivery_status VARCHAR(20),
    status_updated_at TIMESTAMP,
    provider_status_data JSONB,
    error_message TEXT,
    sent_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de mensagens recebidas via WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_received_messages (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    whatsapp_number VARCHAR(20) NOT NULL,
    message_content TEXT,
    external_message_id VARCHAR(100),
    provider VARCHAR(20) DEFAULT 'zapi',
    received_at TIMESTAMP NOT NULL,
    raw_data JSONB,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de logs de webhooks do Zapi
CREATE TABLE IF NOT EXISTS whatsapp_webhook_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    webhook_type VARCHAR(50) NOT NULL,
    provider VARCHAR(20) DEFAULT 'zapi',
    raw_payload JSONB NOT NULL,
    processed_at TIMESTAMP DEFAULT NOW(),
    processing_status VARCHAR(20) DEFAULT 'success',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de eventos do sistema
CREATE TABLE IF NOT EXISTS system_events (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de configurações Zapi
CREATE TABLE IF NOT EXISTS zapi_configurations (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    instance_id VARCHAR(100) NOT NULL UNIQUE,
    instance_name VARCHAR(100),
    token_encrypted TEXT NOT NULL,
    webhook_url TEXT,
    webhook_secret_encrypted TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    phone_number VARCHAR(20),
    connection_status VARCHAR(20) DEFAULT 'disconnected',
    last_ping TIMESTAMP,
    battery_level INTEGER,
    configuration_data JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ===== ÍNDICES PARA PERFORMANCE =====

CREATE INDEX IF NOT EXISTS idx_whatsapp_api_logs_number ON whatsapp_api_logs(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_api_logs_status ON whatsapp_api_logs(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_api_logs_type ON whatsapp_api_logs(message_type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_api_logs_external_id ON whatsapp_api_logs(external_message_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_api_logs_sent_at ON whatsapp_api_logs(sent_at);

CREATE INDEX IF NOT EXISTS idx_whatsapp_received_number ON whatsapp_received_messages(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_received_processed ON whatsapp_received_messages(processed);
CREATE INDEX IF NOT EXISTS idx_whatsapp_received_at ON whatsapp_received_messages(received_at);

CREATE INDEX IF NOT EXISTS idx_whatsapp_webhook_type ON whatsapp_webhook_logs(webhook_type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_webhook_processed ON whatsapp_webhook_logs(processed_at);

CREATE INDEX IF NOT EXISTS idx_system_events_type ON system_events(event_type);
CREATE INDEX IF NOT EXISTS idx_system_events_created ON system_events(created_at);

CREATE INDEX IF NOT EXISTS idx_zapi_instance_id ON zapi_configurations(instance_id);
CREATE INDEX IF NOT EXISTS idx_zapi_status ON zapi_configurations(status);

-- ===== FUNÇÕES PARA INTEGRAÇÃO ZAPI =====

-- Função para buscar configuração ativa do Zapi
CREATE OR REPLACE FUNCTION get_active_zapi_config()
RETURNS JSON AS $$
DECLARE
    config_record RECORD;
BEGIN
    SELECT 
        instance_id,
        instance_name,
        token_encrypted,
        webhook_url,
        phone_number,
        connection_status,
        battery_level
    INTO config_record
    FROM zapi_configurations
    WHERE status = 'active'
    AND connection_status = 'connected'
    ORDER BY last_ping DESC
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Nenhuma configuração Zapi ativa encontrada',
            'code', 'NO_ACTIVE_CONFIG'
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'instance_id', config_record.instance_id,
        'instance_name', config_record.instance_name,
        'phone_number', config_record.phone_number,
        'connection_status', config_record.connection_status,
        'battery_level', config_record.battery_level
    );
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar status da instância Zapi
CREATE OR REPLACE FUNCTION update_zapi_instance_status(
    p_instance_id VARCHAR,
    p_connection_status VARCHAR,
    p_battery_level INTEGER DEFAULT NULL,
    p_phone_number VARCHAR DEFAULT NULL
)
RETURNS JSON AS $$
BEGIN
    UPDATE zapi_configurations
    SET 
        connection_status = p_connection_status,
        battery_level = COALESCE(p_battery_level, battery_level),
        phone_number = COALESCE(p_phone_number, phone_number),
        last_ping = NOW(),
        updated_at = NOW()
    WHERE instance_id = p_instance_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Instância não encontrada',
            'code', 'INSTANCE_NOT_FOUND'
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Status atualizado com sucesso',
        'updated_at', NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- Função para registrar envio de mensagem
CREATE OR REPLACE FUNCTION register_whatsapp_message_sent(
    p_whatsapp_number VARCHAR,
    p_message_content TEXT,
    p_message_type VARCHAR,
    p_external_message_id VARCHAR DEFAULT NULL,
    p_provider_response JSONB DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_log_id VARCHAR;
BEGIN
    v_log_id := gen_random_uuid()::text;
    
    INSERT INTO whatsapp_api_logs (
        id,
        whatsapp_number,
        message_content,
        message_type,
        status,
        external_message_id,
        provider_response
    ) VALUES (
        v_log_id,
        p_whatsapp_number,
        p_message_content,
        p_message_type,
        'sent',
        p_external_message_id,
        p_provider_response
    );
    
    RETURN json_build_object(
        'success', true,
        'log_id', v_log_id,
        'message', 'Mensagem registrada com sucesso'
    );
END;
$$ LANGUAGE plpgsql;

-- Função para obter estatísticas de mensagens
CREATE OR REPLACE FUNCTION get_whatsapp_message_stats(
    p_days INTEGER DEFAULT 30
)
RETURNS JSON AS $$
DECLARE
    v_stats RECORD;
    v_daily_stats JSON;
BEGIN
    -- Estatísticas gerais
    SELECT 
        COUNT(*) as total_messages,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_messages,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_messages,
        COUNT(CASE WHEN status = 'read' THEN 1 END) as read_messages,
        COUNT(CASE WHEN status = 'error' THEN 1 END) as error_messages,
        ROUND(
            COUNT(CASE WHEN status = 'delivered' THEN 1 END)::DECIMAL / 
            NULLIF(COUNT(CASE WHEN status = 'sent' THEN 1 END), 0) * 100, 2
        ) as delivery_rate
    INTO v_stats
    FROM whatsapp_api_logs
    WHERE sent_at >= NOW() - INTERVAL '1 day' * p_days;
    
    -- Estatísticas diárias
    SELECT json_agg(
        json_build_object(
            'date', DATE(sent_at),
            'total', daily_total,
            'sent', daily_sent,
            'delivered', daily_delivered,
            'errors', daily_errors
        ) ORDER BY DATE(sent_at) DESC
    ) INTO v_daily_stats
    FROM (
        SELECT 
            DATE(sent_at) as date,
            COUNT(*) as daily_total,
            COUNT(CASE WHEN status = 'sent' THEN 1 END) as daily_sent,
            COUNT(CASE WHEN status = 'delivered' THEN 1 END) as daily_delivered,
            COUNT(CASE WHEN status = 'error' THEN 1 END) as daily_errors
        FROM whatsapp_api_logs
        WHERE sent_at >= NOW() - INTERVAL '1 day' * p_days
        GROUP BY DATE(sent_at)
    ) daily_data;
    
    RETURN json_build_object(
        'success', true,
        'period_days', p_days,
        'total_messages', v_stats.total_messages,
        'sent_messages', v_stats.sent_messages,
        'delivered_messages', v_stats.delivered_messages,
        'read_messages', v_stats.read_messages,
        'error_messages', v_stats.error_messages,
        'delivery_rate_pct', v_stats.delivery_rate,
        'daily_stats', COALESCE(v_daily_stats, '[]'::json),
        'generated_at', NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- Função para limpeza de logs antigos
CREATE OR REPLACE FUNCTION cleanup_old_whatsapp_logs()
RETURNS JSON AS $$
DECLARE
    v_deleted_api_logs INTEGER;
    v_deleted_received INTEGER;
    v_deleted_webhooks INTEGER;
BEGIN
    -- Limpar logs de API antigas (90 dias)
    DELETE FROM whatsapp_api_logs
    WHERE sent_at < NOW() - INTERVAL '90 days';
    GET DIAGNOSTICS v_deleted_api_logs = ROW_COUNT;
    
    -- Limpar mensagens recebidas antigas (90 dias)
    DELETE FROM whatsapp_received_messages
    WHERE received_at < NOW() - INTERVAL '90 days';
    GET DIAGNOSTICS v_deleted_received = ROW_COUNT;
    
    -- Limpar logs de webhooks antigos (30 dias)
    DELETE FROM whatsapp_webhook_logs
    WHERE processed_at < NOW() - INTERVAL '30 days';
    GET DIAGNOSTICS v_deleted_webhooks = ROW_COUNT;
    
    RETURN json_build_object(
        'success', true,
        'deleted_api_logs', v_deleted_api_logs,
        'deleted_received_messages', v_deleted_received,
        'deleted_webhook_logs', v_deleted_webhooks,
        'cleaned_at', NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- ===== TRIGGER PARA ATUALIZAÇÃO AUTOMÁTICA =====

-- Trigger para updated_at em zapi_configurations
CREATE OR REPLACE FUNCTION update_zapi_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_zapi_updated_at
    BEFORE UPDATE ON zapi_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_zapi_updated_at();

-- ===== INSERIR CONFIGURAÇÃO INICIAL =====

-- Inserir configuração padrão do Zapi (será atualizada via ambiente)
INSERT INTO zapi_configurations (
    instance_id,
    instance_name,
    token_encrypted,
    webhook_url,
    status
) VALUES (
    'coinbitclub-instance',
    'CoinBitClub WhatsApp Instance',
    'token-sera-definido-via-env',
    '/api/webhooks/zapi',
    'active'
) ON CONFLICT (instance_id) DO NOTHING;
