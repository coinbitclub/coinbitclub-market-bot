-- ========================================
-- MARKETBOT - SISTEMA 2FA (TWO FACTOR AUTHENTICATION) - VERSÃO SIMPLIFICADA
-- Migration para sistema de autenticação de dois fatores
-- FASE 2 - Segurança crítica obrigatória
-- ========================================

-- ========================================
-- VERIFICAR E ADICIONAR COLUNAS 2FA NA TABELA USERS
-- ========================================

-- Adicionar colunas 2FA na tabela users se não existirem
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;

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
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ========================================

COMMENT ON TABLE user_2fa IS 'Configurações 2FA dos usuários - segredos TOTP e códigos de backup';
COMMENT ON TABLE temp_2fa_setup IS 'Setup temporário para configuração inicial do 2FA';
COMMENT ON TABLE sms_verification IS 'Códigos SMS para verificação e backup de 2FA';
COMMENT ON TABLE two_factor_audit IS 'Auditoria completa de todas as ações relacionadas ao 2FA';

-- ========================================
-- INSERIR DADOS DE TESTE (APENAS DESENVOLVIMENTO)
-- ========================================

-- Inserir dados de exemplo para desenvolvimento e testes
INSERT INTO user_2fa (user_id, secret, backup_codes, is_enabled, sms_enabled)
SELECT 
  id, 
  'JBSWY3DPEHPK3PXP', -- Secret de exemplo para desenvolvimento
  '["12345678", "87654321", "11111111", "22222222", "33333333"]'::jsonb,
  false,
  false
FROM users 
WHERE email LIKE '%@test.com' -- Apenas para usuários de teste
ON CONFLICT (user_id) DO NOTHING;

-- ========================================
-- MENSAGEM DE CONCLUSÃO
-- ========================================

SELECT 'Sistema 2FA instalado com sucesso!' as status,
       'Tabelas criadas: user_2fa, temp_2fa_setup, sms_verification, two_factor_audit' as details;
