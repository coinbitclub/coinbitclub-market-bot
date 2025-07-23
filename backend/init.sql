-- Criação de extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Configuração do timezone
SET timezone = 'UTC';

-- Criação do schema principal se não existir
CREATE SCHEMA IF NOT EXISTS public;

-- Garantir que o usuário postgres tem permissões completas
GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres;

-- Log de inicialização
DO $$
BEGIN
    RAISE NOTICE 'CoinBitClub Database inicializado com sucesso!';
    RAISE NOTICE 'Timestamp: %', NOW();
    RAISE NOTICE 'Database: %', current_database();
    RAISE NOTICE 'User: %', current_user;
END $$;
