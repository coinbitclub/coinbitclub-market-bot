
-- 🔧 SCRIPT DE CORREÇÃO - TRUNCAMENTO DE CHAVES API
-- Execute este script para corrigir os limites de caracteres

-- 1. Backup da tabela atual
CREATE TABLE user_api_keys_backup AS SELECT * FROM user_api_keys;

-- 2. Aumentar limite das colunas
ALTER TABLE user_api_keys 
ALTER COLUMN api_key TYPE VARCHAR(128);

ALTER TABLE user_api_keys 
ALTER COLUMN secret_key TYPE VARCHAR(256);

-- 3. Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_api_keys_exchange 
ON user_api_keys(exchange);

CREATE INDEX IF NOT EXISTS idx_user_api_keys_validation_status 
ON user_api_keys(validation_status);

-- 4. Adicionar check constraints para validação
ALTER TABLE user_api_keys 
ADD CONSTRAINT check_api_key_length 
CHECK (LENGTH(api_key) >= 10);

ALTER TABLE user_api_keys 
ADD CONSTRAINT check_secret_key_length 
CHECK (LENGTH(secret_key) >= 20);

-- 5. Marcar chaves existentes como "needs_update" se suspeitas
UPDATE user_api_keys 
SET validation_status = 'needs_update'
WHERE (exchange = 'bybit' AND (LENGTH(api_key) < 18 OR LENGTH(secret_key) < 36))
   OR (exchange = 'binance' AND (LENGTH(api_key) != 64 OR LENGTH(secret_key) != 64));

COMMIT;
    