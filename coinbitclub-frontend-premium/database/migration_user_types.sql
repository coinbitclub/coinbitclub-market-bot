-- Migração para adicionar user_type na tabela users
-- Execute esta migração no seu banco de dados PostgreSQL

-- Adicionar coluna user_type se ela não existir
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS user_type VARCHAR(20) DEFAULT 'user' 
CHECK (user_type IN ('user', 'affiliate', 'admin'));

-- Atualizar usuários existentes baseado no campo is_admin
UPDATE users 
SET user_type = CASE 
    WHEN is_admin = TRUE THEN 'admin'
    ELSE 'user'
END 
WHERE user_type = 'user' OR user_type IS NULL;

-- Criar tabela de afiliados se não existir
CREATE TABLE IF NOT EXISTS affiliates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    affiliate_code VARCHAR(20) UNIQUE NOT NULL,
    commission_rate DECIMAL(5,2) DEFAULT 10.00, -- Percentage
    total_referrals INTEGER DEFAULT 0,
    total_commission_earned DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_affiliates_code ON affiliates(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliates_user_id ON affiliates(user_id);

-- Função para gerar código de afiliado único
CREATE OR REPLACE FUNCTION generate_affiliate_code() RETURNS VARCHAR(20) AS $$
DECLARE
    code VARCHAR(20);
    exists_check INTEGER;
BEGIN
    LOOP
        -- Gerar código com 8 caracteres (letras e números)
        code := upper(substring(md5(random()::text) from 1 for 8));
        
        -- Verificar se já existe
        SELECT COUNT(*) INTO exists_check FROM affiliates WHERE affiliate_code = code;
        
        -- Se não existe, retornar o código
        IF exists_check = 0 THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger nas tabelas
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_affiliates_updated_at ON affiliates;
CREATE TRIGGER update_affiliates_updated_at
    BEFORE UPDATE ON affiliates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
