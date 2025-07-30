
-- 🔧 SCRIPT DE CORREÇÃO PÓS-MIGRAÇÃO RAILWAY
-- Execute este script após obter as chaves reais da Paloma

-- 1. Atualizar chaves reais da Paloma
UPDATE user_api_keys SET
    api_key = 'CHAVE_API_REAL_AQUI',  -- Substituir pela chave real
    secret_key = 'SECRET_REAL_AQUI',   -- Substituir pelo secret real
    validation_status = 'pending',
    error_message = NULL,
    updated_at = NOW()
WHERE user_id = (
    SELECT id FROM users WHERE name ILIKE '%paloma%'
) AND exchange = 'bybit';

-- 2. Verificar atualização
SELECT 
    u.name,
    k.api_key,
    k.secret_key,
    k.validation_status,
    k.updated_at
FROM user_api_keys k
JOIN users u ON k.user_id = u.id
WHERE u.name ILIKE '%paloma%';
        