-- ========================================
-- MARKETBOT - RESET COMPLETO DO BANCO DE DADOS
-- Script para limpar tudo e recomeçar do zero
-- ========================================

-- ATENÇÃO: Este script irá APAGAR TODOS OS DADOS!
-- Use apenas em desenvolvimento ou quando necessário reset completo

-- ========================================
-- 1. REMOVER TODAS AS TABELAS
-- ========================================

-- Remove tabelas em ordem para evitar conflitos de FK
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS verification_tokens CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS affiliates CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS schema_migrations CASCADE;

-- ========================================
-- 2. REMOVER TODOS OS TIPOS ENUM
-- ========================================

DROP TYPE IF EXISTS user_type CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS plan_type CASCADE;
DROP TYPE IF EXISTS token_type CASCADE;

-- ========================================
-- 3. REMOVER TODAS AS FUNÇÕES
-- ========================================

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS audit_trigger_function() CASCADE;

-- ========================================
-- 4. REMOVER TODAS AS VIEWS
-- ========================================

DROP VIEW IF EXISTS user_stats_view CASCADE;

-- ========================================
-- 5. REMOVER EXTENSÕES (OPCIONAL)
-- ========================================

-- Descomente se quiser remover as extensões também
-- DROP EXTENSION IF EXISTS "uuid-ossp";
-- DROP EXTENSION IF EXISTS "pgcrypto";

-- ========================================
-- 6. LIMPEZA DE SEQUÊNCIAS
-- ========================================

-- Remove sequências órfãs se existirem
DO $$
DECLARE
    seq RECORD;
BEGIN
    FOR seq IN SELECT schemaname, sequencename 
               FROM pg_sequences 
               WHERE schemaname = 'public'
    LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(seq.schemaname) || '.' || quote_ident(seq.sequencename) || ' CASCADE';
    END LOOP;
END
$$;

-- ========================================
-- 7. VERIFICAÇÃO FINAL
-- ========================================

-- Lista o que sobrou (deve estar vazio)
SELECT 
    'Tables' as type, 
    table_name as name 
FROM information_schema.tables 
WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'

UNION ALL

SELECT 
    'Types' as type, 
    typname as name
FROM pg_type 
WHERE typnamespace = (
    SELECT oid FROM pg_namespace WHERE nspname = 'public'
) AND typtype = 'e'

UNION ALL

SELECT 
    'Functions' as type, 
    proname as name
FROM pg_proc 
WHERE pronamespace = (
    SELECT oid FROM pg_namespace WHERE nspname = 'public'
);

-- ========================================
-- 8. CONFIRMAÇÃO
-- ========================================

SELECT 
    'DATABASE CLEANUP COMPLETED' as status,
    current_timestamp as timestamp,
    'All tables, types, functions, and views removed' as message;
