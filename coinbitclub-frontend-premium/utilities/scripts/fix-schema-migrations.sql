-- Script de Migração para Corrigir Esquema do Banco de Dados
-- CoinBitClub - Fix Schema Issues

-- Adicionar coluna user_type na tabela users (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'user_type'
    ) THEN
        ALTER TABLE users ADD COLUMN user_type VARCHAR(20) DEFAULT 'user';
        COMMENT ON COLUMN users.user_type IS 'Tipo de usuário: user, affiliate, admin';
    END IF;
END $$;

-- Adicionar coluna is_active na tabela affiliates (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'affiliates' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE affiliates ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
        COMMENT ON COLUMN affiliates.is_active IS 'Status ativo/inativo do afiliado';
    END IF;
END $$;

-- Atualizar registros existentes para definir user_type baseado em lógica atual
UPDATE users 
SET user_type = CASE 
    WHEN is_admin = TRUE THEN 'admin'
    WHEN id IN (SELECT user_id FROM affiliates) THEN 'affiliate'
    ELSE 'user'
END
WHERE user_type = 'user';

-- Verificar estrutura atualizada
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('users', 'affiliates')
    AND column_name IN ('user_type', 'is_active', 'phone')
ORDER BY table_name, column_name;

-- Log de migração
INSERT INTO migrations_log (version, description, executed_at) 
VALUES ('2025.01.25.001', 'Adicionar colunas user_type e is_active', NOW())
ON CONFLICT DO NOTHING;

-- Criar tabela de log de migrações se não existir
CREATE TABLE IF NOT EXISTS migrations_log (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    executed_at TIMESTAMP DEFAULT NOW()
);

COMMIT;
