-- ===============================================
-- SCRIPT DE LIMPEZA BANCO DE DADOS PRODUÇÃO
-- Remove dados de teste mantendo estrutura
-- Data: 2025-07-29
-- ===============================================

BEGIN;

-- 1. BACKUP DE SEGURANÇA DOS IDs ANTES DA LIMPEZA
CREATE TEMP TABLE backup_test_users AS
SELECT id, name, email FROM users 
WHERE 
    email ILIKE '%test%' 
    OR email ILIKE '%demo%' 
    OR email ILIKE '%exemplo%'
    OR name ILIKE '%test%'
    OR name ILIKE '%demo%'
    OR email IN ('erica@gmail.com', 'luiza@gmail.com', 'paloma@gmail.com', 'rosemary@gmail.com');

-- Exibir usuários que serão removidos
SELECT 'USUÁRIOS QUE SERÃO REMOVIDOS:' as info;
SELECT * FROM backup_test_users;

-- 2. LIMPEZA DE DADOS RELACIONADOS (em ordem de dependência)

-- Remover comissões de afiliados de usuários teste
DELETE FROM affiliate_commissions 
WHERE referred_user_id IN (SELECT id FROM backup_test_users)
   OR affiliate_id IN (SELECT id FROM backup_test_users);

-- Remover comissões de usuários teste
DELETE FROM commission_events 
WHERE user_id IN (SELECT id FROM backup_test_users);

-- Remover execuções de ordens de usuários teste
DELETE FROM order_executions 
WHERE user_id IN (SELECT id FROM backup_test_users);

-- Remover operações de usuários teste
DELETE FROM operations 
WHERE user_id IN (SELECT id FROM backup_test_users);

-- Remover configurações de usuários teste
DELETE FROM usuario_configuracoes 
WHERE user_id IN (SELECT id FROM backup_test_users);

-- Remover chaves API de usuários teste
DELETE FROM user_api_keys 
WHERE user_id IN (SELECT id FROM backup_test_users);

-- Remover saldos de usuários teste
DELETE FROM user_balances 
WHERE user_id IN (SELECT id FROM backup_test_users);

-- Remover créditos de teste
DELETE FROM test_credits 
WHERE user_id IN (SELECT id FROM backup_test_users);

-- Remover financial de usuários teste
DELETE FROM user_financial 
WHERE user_id IN (SELECT id FROM backup_test_users);

-- Remover perfis de usuários teste
DELETE FROM user_profiles 
WHERE user_id IN (SELECT id FROM backup_test_users);

-- Remover credenciais de usuários teste
DELETE FROM user_credentials 
WHERE user_id IN (SELECT id FROM backup_test_users);

DELETE FROM credentials 
WHERE user_id IN (SELECT id FROM backup_test_users);

-- Remover configurações de usuários teste
DELETE FROM user_settings 
WHERE user_id IN (SELECT id FROM backup_test_users);

-- Remover assinaturas de usuários teste
DELETE FROM user_subscriptions 
WHERE user_id IN (SELECT id FROM backup_test_users);

DELETE FROM subscriptions 
WHERE user_id IN (SELECT id FROM backup_test_users);

-- Remover notificações de usuários teste
DELETE FROM notifications 
WHERE user_id IN (SELECT id FROM backup_test_users);

-- Remover dados de pagamento de usuários teste
DELETE FROM prepaid_transactions 
WHERE user_id IN (SELECT id FROM backup_test_users);

DELETE FROM prepaid_balances 
WHERE user_id IN (SELECT id FROM backup_test_users);

DELETE FROM user_prepaid_balance 
WHERE user_id IN (SELECT id FROM backup_test_users);

DELETE FROM payments 
WHERE user_id IN (SELECT id FROM backup_test_users);

DELETE FROM checkout_sessions 
WHERE user_id IN (SELECT id FROM backup_test_users);

-- Remover afiliados de usuários teste
DELETE FROM affiliates 
WHERE user_id IN (SELECT id FROM backup_test_users);

-- Remover requisições de saque de usuários teste
DELETE FROM withdrawal_requests 
WHERE user_id IN (SELECT id FROM backup_test_users);

DELETE FROM refund_requests 
WHERE user_id IN (SELECT id FROM backup_test_users);

-- 3. REMOVER USUÁRIOS DE TESTE
DELETE FROM users 
WHERE id IN (SELECT id FROM backup_test_users);

-- 4. LIMPEZA DE DADOS ÓRFÃOS E DE TESTE

-- Remover sinais de TradingView antigos de teste (mantém apenas últimos 7 dias)
DELETE FROM tradingview_signals 
WHERE created_at < NOW() - INTERVAL '7 days';

-- Remover sinais antigos da especificação (mantém apenas últimos 7 dias)
DELETE FROM sinais_tradingview_especificacao 
WHERE created_at < NOW() - INTERVAL '7 days';

-- Remover logs antigos (mantém apenas últimos 30 dias)
DELETE FROM bot_logs 
WHERE timestamp < NOW() - INTERVAL '30 days';

DELETE FROM ai_logs 
WHERE timestamp < NOW() - INTERVAL '30 days';

DELETE FROM event_logs 
WHERE timestamp < NOW() - INTERVAL '30 days';

DELETE FROM system_logs 
WHERE created_at < NOW() - INTERVAL '30 days';

DELETE FROM openai_logs 
WHERE timestamp < NOW() - INTERVAL '30 days';

-- Remover webhooks antigos (mantém apenas últimos 7 dias)
DELETE FROM raw_webhook 
WHERE created_at < NOW() - INTERVAL '7 days';

DELETE FROM webhook_logs 
WHERE created_at < NOW() - INTERVAL '7 days';

-- Remover dados de mercado antigos (mantém apenas últimos 30 dias)
DELETE FROM market_data 
WHERE timestamp < NOW() - INTERVAL '30 days';

DELETE FROM coin_prices 
WHERE created_at < NOW() - INTERVAL '30 days';

-- Remover dados de Fear & Greed antigos (mantém apenas últimos 90 dias)
DELETE FROM fear_greed_index 
WHERE created_at < NOW() - INTERVAL '90 days';

DELETE FROM fear_greed_historico 
WHERE created_at < NOW() - INTERVAL '90 days';

-- Remover dados de dominância BTC antigos (mantém apenas últimos 90 dias)
DELETE FROM btc_dominance 
WHERE created_at < NOW() - INTERVAL '90 days';

-- 5. LIMPEZA DE TABELAS DE PROCESSAMENTO
DELETE FROM signal_processing_queue 
WHERE created_at < NOW() - INTERVAL '7 days';

DELETE FROM signal_user_processing 
WHERE created_at < NOW() - INTERVAL '7 days';

-- 6. RESETAR SEQUÊNCIAS E CONTADORES
UPDATE system_config SET value = '0' WHERE name = 'daily_signal_count';
UPDATE system_config SET value = '0' WHERE name = 'daily_user_count';

-- 7. ATUALIZAR ESTATÍSTICAS
UPDATE signal_stats SET signal_count = 0, success_count = 0 
WHERE date < CURRENT_DATE - INTERVAL '7 days';

-- 8. VERIFICAR RESULTADOS DA LIMPEZA
SELECT 'RESUMO PÓS-LIMPEZA:' as info;

SELECT 
    'users' as tabela,
    COUNT(*) as registros_restantes
FROM users
WHERE email NOT ILIKE '%coinbitclub%'
  AND email NOT ILIKE '%admin%'

UNION ALL

SELECT 
    'operations' as tabela,
    COUNT(*) as registros_restantes
FROM operations

UNION ALL

SELECT 
    'tradingview_signals' as tabela,
    COUNT(*) as registros_restantes
FROM tradingview_signals

UNION ALL

SELECT 
    'bot_logs' as tabela,
    COUNT(*) as registros_restantes
FROM bot_logs

UNION ALL

SELECT 
    'fear_greed_index' as tabela,
    COUNT(*) as registros_restantes
FROM fear_greed_index

ORDER BY tabela;

-- 9. VACUUM E REINDEX PARA OTIMIZAR
VACUUM ANALYZE users;
VACUUM ANALYZE operations;
VACUUM ANALYZE tradingview_signals;
VACUUM ANALYZE bot_logs;

-- Se tudo estiver correto, faça COMMIT
-- Caso contrário, faça ROLLBACK
SELECT 'LIMPEZA CONCLUÍDA COM SUCESSO!' as resultado;
SELECT 'Execute COMMIT para confirmar ou ROLLBACK para cancelar' as acao;

-- COMMIT; -- Descomente para confirmar
-- ROLLBACK; -- Descomente para cancelar