-- ========================================
-- MARKETBOT - SISTEMA 2FA (TWO FACTOR AUTHENTICATION)
-- Migration para sistema de autenticação de dois fatores
-- FASE 2 - Segurança crítica obrigatória
-- ========================================

BEGIN;

-- ========================================
-- VERIFICAR SE COLUNAS 2FA EXISTEM NA TABELA USERS
-- ========================================

-- Adicionar colunas 2FA na tabela users se não existirem
DO $$
BEGIN
    -- Verifica e adiciona two_factor_enabled
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'two_factor_enabled'
    ) THEN
        ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT false;
    END IF;
    
    -- Verifica e adiciona phone_number
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'phone_number'
    ) THEN
        ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);
    END IF;
    
    -- Verifica e adiciona phone_verified
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'phone_verified'
    ) THEN
        ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT false;
    END IF;
END $$;

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

CREATE INDEX IF NOT EXISTS idx_user_2fa_user_id ON user_2fa(user_id);
CREATE INDEX IF NOT EXISTS idx_user_2fa_enabled ON user_2fa(is_enabled);
CREATE INDEX IF NOT EXISTS idx_user_2fa_locked ON user_2fa(locked_until);

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

CREATE INDEX IF NOT EXISTS idx_temp_2fa_setup_user_id ON temp_2fa_setup(user_id);
CREATE INDEX IF NOT EXISTS idx_temp_2fa_setup_expires ON temp_2fa_setup(expires_at);

-- ========================================
-- TABELA DE VERIFICAÇÃO SMS
-- ========================================

CREATE TABLE IF NOT EXISTS sms_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  verification_code VARCHAR(6) NOT NULL,
  code_type VARCHAR(20) NOT NULL, -- 'LOGIN', 'BACKUP', 'RECOVERY'
  is_used BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Expira em 5 minutos
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sms_verification_user_id ON sms_verification(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_verification_phone ON sms_verification(phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_verification_code ON sms_verification(verification_code);
CREATE INDEX IF NOT EXISTS idx_sms_verification_expires ON sms_verification(expires_at);

-- ========================================
-- TABELA DE AUDITORIA 2FA
-- ========================================

CREATE TABLE IF NOT EXISTS two_factor_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'SETUP', 'ENABLE', 'DISABLE', 'LOGIN', 'RECOVERY'
  method VARCHAR(20) NOT NULL, -- 'TOTP', 'SMS', 'BACKUP_CODE'
  success BOOLEAN NOT NULL,
  ip_address INET,
  user_agent TEXT,
  failure_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_two_factor_audit_user_id ON two_factor_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_two_factor_audit_action ON two_factor_audit(action);
CREATE INDEX IF NOT EXISTS idx_two_factor_audit_created_at ON two_factor_audit(created_at);
CREATE INDEX IF NOT EXISTS idx_two_factor_audit_success ON two_factor_audit(success);

-- ========================================
-- FUNÇÕES AUXILIARES
-- ========================================

-- Função para limpar registros expirados
CREATE OR REPLACE FUNCTION cleanup_expired_2fa_data()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Limpa setups temporários expirados
  DELETE FROM temp_2fa_setup WHERE expires_at < CURRENT_TIMESTAMP;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Limpa códigos SMS expirados
  DELETE FROM sms_verification WHERE expires_at < CURRENT_TIMESTAMP;
  GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
  
  -- Limpa auditoria antiga (> 90 dias)
  DELETE FROM two_factor_audit 
  WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
  GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar se usuário pode tentar 2FA
CREATE OR REPLACE FUNCTION can_attempt_2fa(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_2fa_record RECORD;
BEGIN
  SELECT * INTO user_2fa_record 
  FROM user_2fa 
  WHERE user_id = p_user_id;
  
  -- Se não tem 2FA configurado, pode tentar
  IF NOT FOUND THEN
    RETURN true;
  END IF;
  
  -- Se está bloqueado, verifica se ainda está em vigência
  IF user_2fa_record.locked_until IS NOT NULL AND 
     user_2fa_record.locked_until > CURRENT_TIMESTAMP THEN
    RETURN false;
  END IF;
  
  -- Se passou do bloqueio, reseta tentativas
  IF user_2fa_record.locked_until IS NOT NULL AND 
     user_2fa_record.locked_until <= CURRENT_TIMESTAMP THEN
    UPDATE user_2fa 
    SET failed_attempts = 0, locked_until = NULL 
    WHERE user_id = p_user_id;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Função para registrar tentativa de 2FA
CREATE OR REPLACE FUNCTION record_2fa_attempt(
  p_user_id UUID,
  p_action VARCHAR(50),
  p_method VARCHAR(20),
  p_success BOOLEAN,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_failure_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  current_attempts INTEGER := 0;
BEGIN
  -- Registra na auditoria
  INSERT INTO two_factor_audit (
    user_id, action, method, success, ip_address, user_agent, failure_reason
  ) VALUES (
    p_user_id, p_action, p_method, p_success, p_ip_address, p_user_agent, p_failure_reason
  );
  
  -- Se falhou, incrementa contador de tentativas
  IF NOT p_success THEN
    UPDATE user_2fa 
    SET 
      failed_attempts = failed_attempts + 1,
      updated_at = CURRENT_TIMESTAMP
    WHERE user_id = p_user_id
    RETURNING failed_attempts INTO current_attempts;
    
    -- Se atingiu limite, bloqueia por 30 minutos
    IF current_attempts >= 5 THEN
      UPDATE user_2fa 
      SET 
        locked_until = CURRENT_TIMESTAMP + INTERVAL '30 minutes',
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = p_user_id;
    END IF;
  ELSE
    -- Se sucesso, reseta tentativas
    UPDATE user_2fa 
    SET 
      failed_attempts = 0,
      locked_until = NULL,
      last_verified = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE user_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Função para gerar códigos de backup únicos
CREATE OR REPLACE FUNCTION generate_backup_codes(count INTEGER DEFAULT 10)
RETURNS JSONB AS $$
DECLARE
  codes JSONB := '[]';
  code TEXT;
  i INTEGER;
BEGIN
  FOR i IN 1..count LOOP
    -- Gera código de 8 caracteres alfanuméricos
    code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CURRENT_TIMESTAMP::TEXT) FROM 1 FOR 8));
    codes := codes || jsonb_build_array(code);
  END LOOP;
  
  RETURN codes;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- ========================================

-- Trigger para atualizar updated_at em user_2fa
CREATE OR REPLACE FUNCTION update_user_2fa_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_2fa_timestamp
  BEFORE UPDATE ON user_2fa
  FOR EACH ROW
  EXECUTE FUNCTION update_user_2fa_timestamp();

-- Trigger para sincronizar two_factor_enabled na tabela users
CREATE OR REPLACE FUNCTION sync_user_2fa_status()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE users 
    SET two_factor_enabled = NEW.is_enabled
    WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE users 
    SET two_factor_enabled = false
    WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_user_2fa_status
  AFTER INSERT OR UPDATE OR DELETE ON user_2fa
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_2fa_status();

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
  u.email,
  u2fa.failed_attempts,
  u2fa.locked_until,
  u2fa.last_verified,
  CASE 
    WHEN u2fa.locked_until > CURRENT_TIMESTAMP THEN 'LOCKED'
    WHEN u2fa.failed_attempts >= 3 THEN 'WARNING'
    ELSE 'OK'
  END as status
FROM users u
JOIN user_2fa u2fa ON u.id = u2fa.user_id
WHERE u2fa.failed_attempts > 0 OR u2fa.locked_until IS NOT NULL
ORDER BY u2fa.failed_attempts DESC, u2fa.locked_until DESC;

-- View para relatório de segurança
CREATE OR REPLACE VIEW v_2fa_security_report AS
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN u.two_factor_enabled THEN 1 END) as users_with_2fa,
  COUNT(CASE WHEN u2fa.locked_until > CURRENT_TIMESTAMP THEN 1 END) as locked_users,
  AVG(CASE WHEN u2fa.failed_attempts > 0 THEN u2fa.failed_attempts END) as avg_failed_attempts,
  COUNT(CASE WHEN tfa.created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours' 
               AND tfa.success = false THEN 1 END) as failed_attempts_24h
FROM users u
LEFT JOIN user_2fa u2fa ON u.id = u2fa.user_id
LEFT JOIN two_factor_audit tfa ON u.id = tfa.user_id;

-- ========================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ========================================

COMMENT ON TABLE user_2fa IS 'Configurações 2FA dos usuários - segredos TOTP e códigos de backup';
COMMENT ON TABLE temp_2fa_setup IS 'Setup temporário para configuração inicial do 2FA';
COMMENT ON TABLE sms_verification IS 'Códigos SMS para verificação e backup de 2FA';
COMMENT ON TABLE two_factor_audit IS 'Auditoria completa de todas as ações relacionadas ao 2FA';

COMMENT ON FUNCTION cleanup_expired_2fa_data() IS 'Limpa dados expirados das tabelas de 2FA';
COMMENT ON FUNCTION can_attempt_2fa(UUID) IS 'Verifica se usuário pode tentar autenticação 2FA';
COMMENT ON FUNCTION record_2fa_attempt(UUID, VARCHAR, VARCHAR, BOOLEAN, INET, TEXT, TEXT) IS 'Registra tentativa de 2FA e aplica políticas de bloqueio';
COMMENT ON FUNCTION generate_backup_codes(INTEGER) IS 'Gera códigos de backup únicos para 2FA';

-- ========================================
-- COMMIT DA TRANSAÇÃO
-- ========================================

COMMIT;

-- ========================================
-- MENSAGEM DE CONCLUSÃO
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '✅ Sistema 2FA instalado com sucesso!';
  RAISE NOTICE '📊 Tabelas criadas: user_2fa, temp_2fa_setup, sms_verification, two_factor_audit';
  RAISE NOTICE '🔧 Funções instaladas: cleanup_expired_2fa_data, can_attempt_2fa, record_2fa_attempt, generate_backup_codes';
  RAISE NOTICE '📈 Views instaladas: v_2fa_adoption_stats, v_2fa_recent_activity, v_2fa_problem_users, v_2fa_security_report';
  RAISE NOTICE '🔒 Sistema pronto para configuração obrigatória de 2FA';
END $$;
