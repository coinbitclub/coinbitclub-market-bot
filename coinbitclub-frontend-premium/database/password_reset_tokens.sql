-- Script SQL para criar tabela de tokens de recuperação de senha
-- Execute este script no seu banco PostgreSQL Railway

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    used_at TIMESTAMP NULL,
    UNIQUE(user_id)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Comentários para documentação
COMMENT ON TABLE password_reset_tokens IS 'Tabela para armazenar tokens de recuperação de senha';
COMMENT ON COLUMN password_reset_tokens.user_id IS 'ID do usuário que solicitou a recuperação';
COMMENT ON COLUMN password_reset_tokens.token IS 'Token único para recuperação de senha';
COMMENT ON COLUMN password_reset_tokens.expires_at IS 'Data/hora de expiração do token (24h)';
COMMENT ON COLUMN password_reset_tokens.used_at IS 'Data/hora quando o token foi usado (NULL se não usado)';

-- Limpar tokens expirados (execute periodicamente)
-- DELETE FROM password_reset_tokens WHERE expires_at < NOW();
