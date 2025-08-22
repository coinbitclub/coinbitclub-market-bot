-- ========================================
-- MARKETBOT - SISTEMA 2FA (TWO FACTOR AUTHENTICATION)
-- Migration para sistema de autenticação de dois fatores
-- FASE 2 - Segurança crítica obrigatória
-- ========================================

BEGIN;

-- ========================================
-- TABELA PRINCIPAL DE 2FA DOS USUÁRIOS
-- ========================================

CREATE TABLE IF NOT EXISTS user_2fa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  secret VARCHAR(64) NOT NULL, -- Base32 secret para TOTP
  backup_codes JSONB DEFAULT '[]', -- Array de códigos de backup
  is_enabled BOOLEAN DEFAULT false,
  sms_enabled BOOLEAN DEFAULT false,
  last_verified TIMESTAMP WITH TIME ZONE,
  failed_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_2fa_user_id ON user_2fa(user_id);
CREATE INDEX idx_user_2fa_enabled ON user_2fa(is_enabled);
CREATE INDEX idx_user_2fa_locked ON user_2fa(locked_until);

-- ========================================
-- TABELA TEMPORÁRIA PARA SETUP 2FA
-- ========================================

CREATE TABLE IF NOT EXISTS temp_2fa_setup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  secret VARCHAR(64) NOT NULL,
  backup_codes JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Expira em 30 minutos
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_temp_2fa_setup_user_id ON temp_2fa_setup(user_id);
CREATE INDEX idx_temp_2fa_setup_expires ON temp_2fa_setup(expires_at);

-- ========================================
-- TABELA DE VERIFICAÇÃO SMS
-- ========================================

CREATE TABLE IF NOT EXISTS sms_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  code VARCHAR(6) NOT NULL, -- Código de 6 dígitos
  phone_number VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Expira em 5 minutos
  verified_at TIMESTAMP WITH TIME ZONE,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sms_verification_user_id ON sms_verification(user_id);
CREATE INDEX idx_sms_verification_expires ON sms_verification(expires_at);
CREATE INDEX idx_sms_verification_code ON sms_verification(code);

-- ========================================
-- TABELA DE AUDITORIA 2FA
-- ========================================

CREATE TABLE IF NOT EXISTS two_factor_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'ENABLED', 'DISABLED', 'VERIFIED', 'FAILED', 'LOCKED', 'SMS_SENT', 'BACKUP_USED'
  method VARCHAR(20), -- '2FA', 'SMS', 'BACKUP_CODE'
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  failure_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_two_factor_audit_user_id ON two_factor_audit(user_id);
CREATE INDEX idx_two_factor_audit_action ON two_factor_audit(action);
CREATE INDEX idx_two_factor_audit_created_at ON two_factor_audit(created_at);
CREATE INDEX idx_two_factor_audit_success ON two_factor_audit(success);

-- ========================================
-- ADIÇÃO DE CAMPOS À TABELA USERS
-- ========================================

-- Adicionar campos 2FA na tabela users se não existirem
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_setup_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP WITH TIME ZONE;

-- Índices para os novos campos
CREATE INDEX IF NOT EXISTS idx_users_two_factor_enabled ON users(two_factor_enabled);
CREATE INDEX IF NOT EXISTS idx_users_phone_verified ON users(phone_verified);

-- ========================================
-- TRIGGERS PARA UPDATED_AT
-- ========================================

-- Trigger para user_2fa
DROP TRIGGER IF EXISTS update_user_2fa_updated_at ON user_2fa;
CREATE TRIGGER update_user_2fa_updated_at 
  BEFORE UPDATE ON user_2fa 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ========================================
-- FUNÇÕES AUXILIARES PARA 2FA
-- ========================================

-- Função para limpar dados temporários expirados
CREATE OR REPLACE FUNCTION cleanup_expired_2fa_data()
RETURNS INTEGER AS $$
DECLARE
  cleaned_count INTEGER;
BEGIN
  -- Limpar setups temporários expirados
  DELETE FROM temp_2fa_setup WHERE expires_at < CURRENT_TIMESTAMP;
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  
  -- Limpar códigos SMS expirados
  DELETE FROM sms_verification WHERE expires_at < CURRENT_TIMESTAMP;
  
  -- Limpar auditoria antiga (manter apenas 90 dias)
  DELETE FROM two_factor_audit WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
  
  RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql;

-- Função para desbloquear usuários automaticamente
CREATE OR REPLACE FUNCTION unlock_expired_2fa_locks()
RETURNS INTEGER AS $$
DECLARE
  unlocked_count INTEGER;
BEGIN
  UPDATE user_2fa 
  SET locked_until = NULL, failed_attempts = 0, updated_at = CURRENT_TIMESTAMP
  WHERE locked_until IS NOT NULL AND locked_until < CURRENT_TIMESTAMP;
  
  GET DIAGNOSTICS unlocked_count = ROW_COUNT;
  RETURN unlocked_count;
END;
$$ LANGUAGE plpgsql;

-- Função para gerar estatísticas 2FA
CREATE OR REPLACE FUNCTION get_2fa_statistics()
RETURNS TABLE(
  total_users INTEGER,
  users_with_2fa INTEGER,
  users_with_sms INTEGER,
  active_setups INTEGER,
  locked_users INTEGER,
  percentage_adoption DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM users) as total_users,
    (SELECT COUNT(*)::INTEGER FROM users WHERE two_factor_enabled = true) as users_with_2fa,
    (SELECT COUNT(*)::INTEGER FROM user_2fa WHERE sms_enabled = true) as users_with_sms,
    (SELECT COUNT(*)::INTEGER FROM temp_2fa_setup WHERE expires_at > CURRENT_TIMESTAMP) as active_setups,
    (SELECT COUNT(*)::INTEGER FROM user_2fa WHERE locked_until > CURRENT_TIMESTAMP) as locked_users,
    CASE 
      WHEN (SELECT COUNT(*) FROM users) > 0 THEN
        ROUND((SELECT COUNT(*) FROM users WHERE two_factor_enabled = true)::DECIMAL / (SELECT COUNT(*) FROM users) * 100, 2)
      ELSE 0
    END as percentage_adoption;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- DADOS INICIAIS E CONFIGURAÇÕES
-- ========================================

-- Inserir configurações padrão do sistema 2FA
INSERT INTO system_config (key, value, description, category, created_at) VALUES
  ('2fa_required_for_admin', 'true', 'Exigir 2FA obrigatório para administradores', '2FA', CURRENT_TIMESTAMP),
  ('2fa_required_for_trading', 'true', 'Exigir 2FA para operações de trading', '2FA', CURRENT_TIMESTAMP),
  ('2fa_lockout_attempts', '5', 'Número de tentativas antes do bloqueio', '2FA', CURRENT_TIMESTAMP),
  ('2fa_lockout_duration', '30', 'Duração do bloqueio em minutos', '2FA', CURRENT_TIMESTAMP),
  ('2fa_backup_codes_count', '10', 'Quantidade de códigos de backup gerados', '2FA', CURRENT_TIMESTAMP),
  ('sms_code_expiry', '5', 'Tempo de expiração do código SMS em minutos', '2FA', CURRENT_TIMESTAMP),
  ('2fa_setup_expiry', '30', 'Tempo de expiração do setup 2FA em minutos', '2FA', CURRENT_TIMESTAMP)
ON CONFLICT (key) DO NOTHING;

-- ========================================
-- VIEWS PARA RELATÓRIOS 2FA
-- ========================================

-- View para estatísticas de adoção 2FA
CREATE OR REPLACE VIEW v_2fa_adoption_stats AS
SELECT 
  DATE_TRUNC('day', u.created_at) as registration_date,
  COUNT(*) as total_registrations,
  COUNT(CASE WHEN u.two_factor_enabled THEN 1 END) as with_2fa,
  ROUND(
    COUNT(CASE WHEN u.two_factor_enabled THEN 1 END)::DECIMAL / COUNT(*) * 100, 2
  ) as adoption_percentage
FROM users u
GROUP BY DATE_TRUNC('day', u.created_at)
ORDER BY registration_date DESC;

-- View para atividade 2FA recente
CREATE OR REPLACE VIEW v_2fa_recent_activity AS
SELECT 
  u.email,
  tfa.action,
  tfa.method,
  tfa.success,
  tfa.ip_address,
  tfa.created_at
FROM two_factor_audit tfa
JOIN users u ON tfa.user_id = u.id
WHERE tfa.created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
ORDER BY tfa.created_at DESC
LIMIT 100;

-- View para usuários com problemas 2FA
CREATE OR REPLACE VIEW v_2fa_problem_users AS
SELECT 
  u.id,
  u.email,
  u.two_factor_enabled,
  u2fa.failed_attempts,
  u2fa.locked_until,
  u2fa.last_verified,
  CASE 
    WHEN u2fa.locked_until > CURRENT_TIMESTAMP THEN 'LOCKED'
    WHEN u2fa.failed_attempts >= 3 THEN 'HIGH_FAILURES'
    WHEN u.two_factor_enabled AND u2fa.last_verified < CURRENT_TIMESTAMP - INTERVAL '30 days' THEN 'INACTIVE'
    ELSE 'OK'
  END as status
FROM users u
LEFT JOIN user_2fa u2fa ON u.id = u2fa.user_id
WHERE (
  u2fa.locked_until > CURRENT_TIMESTAMP OR
  u2fa.failed_attempts >= 3 OR
  (u.two_factor_enabled AND u2fa.last_verified < CURRENT_TIMESTAMP - INTERVAL '30 days')
)
ORDER BY 
  CASE 
    WHEN u2fa.locked_until > CURRENT_TIMESTAMP THEN 1
    WHEN u2fa.failed_attempts >= 5 THEN 2
    WHEN u2fa.failed_attempts >= 3 THEN 3
    ELSE 4
  END;

-- ========================================
-- PROCEDIMENTOS DE MANUTENÇÃO
-- ========================================

-- Criar job de limpeza automática (executar a cada hora)
-- Nota: Implementação específica depende do agendador usado (pg_cron, etc.)

COMMIT;

-- ========================================
-- COMENTÁRIOS DA MIGRATION
-- ========================================

COMMENT ON TABLE user_2fa IS 'Configurações 2FA dos usuários com secrets e códigos de backup';
COMMENT ON TABLE temp_2fa_setup IS 'Dados temporários durante setup inicial do 2FA';
COMMENT ON TABLE sms_verification IS 'Códigos SMS para verificação e backup';
COMMENT ON TABLE two_factor_audit IS 'Auditoria completa de todas as ações 2FA';

COMMENT ON FUNCTION cleanup_expired_2fa_data() IS 'Limpa dados temporários e auditoria antiga do 2FA';
COMMENT ON FUNCTION unlock_expired_2fa_locks() IS 'Desbloqueia automaticamente usuários com lockout expirado';
COMMENT ON FUNCTION get_2fa_statistics() IS 'Retorna estatísticas de adoção e uso do 2FA';

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================

SELECT 'Sistema 2FA instalado com sucesso!' as status,
       (SELECT COUNT(*) FROM user_2fa) as total_2fa_users,
       (SELECT COUNT(*) FROM temp_2fa_setup) as active_setups;
