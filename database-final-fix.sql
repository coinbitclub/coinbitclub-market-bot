-- Correção para trabalhar com IDs INTEGER na tabela users
-- CoinBitClub Market Bot - Ajuste de compatibilidade

-- 1. Remover tabelas com foreign key problemáticas e recriar
DROP TABLE IF EXISTS user_api_keys CASCADE;
DROP TABLE IF EXISTS prepaid_balances CASCADE;

-- 2. Criar tabela user_api_keys com ID INTEGER
CREATE TABLE user_api_keys (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  exchange VARCHAR(50) NOT NULL,
  api_key TEXT NOT NULL,
  secret_key TEXT NOT NULL,
  passphrase TEXT,
  environment VARCHAR(20) DEFAULT 'testnet',
  is_active BOOLEAN DEFAULT true,
  validation_status VARCHAR(20) DEFAULT 'pending',
  last_validated_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, exchange, environment)
);

-- 3. Criar tabela prepaid_balances com ID INTEGER
CREATE TABLE prepaid_balances (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  balance DECIMAL(20,8) DEFAULT 0,
  reserved_balance DECIMAL(20,8) DEFAULT 0,
  last_transaction_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, currency)
);

-- 4. Ajustar tabela prepaid_transactions para usar IDs INTEGER
ALTER TABLE prepaid_transactions 
DROP COLUMN IF EXISTS id CASCADE,
DROP COLUMN IF EXISTS user_id CASCADE,
DROP COLUMN IF EXISTS balance_id CASCADE;

ALTER TABLE prepaid_transactions 
ADD COLUMN id SERIAL PRIMARY KEY,
ADD COLUMN user_id INTEGER NOT NULL REFERENCES users(id),
ADD COLUMN balance_id INTEGER REFERENCES prepaid_balances(id);

-- 5. Ajustar user_profiles para usar user_id INTEGER
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey,
ALTER COLUMN user_id TYPE INTEGER USING user_id::INTEGER,
ADD CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

-- 6. Inserir planos corretos se não existirem
INSERT INTO plans (name, price_id, currency, unit_amount, nome_plano, tipo_plano, comissao_percentual, moeda, features) 
VALUES 
('PRO', 'price_pro_monthly', 'U', 49.90, 'PRO', 'PRO', 10, 'USD', '{"ai_analysis": true, "trading_signals": true, "affiliate_system": true}'),
('FLEX', 'price_flex_monthly', 'U', 99.90, 'FLEX', 'FLEX', 20, 'USD', '{"ai_analysis": true, "trading_signals": true, "affiliate_system": true, "priority_support": true}')
ON CONFLICT (id) DO NOTHING;

-- 7. Recriar função de trigger para usar IDs INTEGER
CREATE OR REPLACE FUNCTION update_prepaid_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar saldo na tabela de balanços
  INSERT INTO prepaid_balances (user_id, currency, balance)
  VALUES (NEW.user_id, NEW.currency, NEW.amount)
  ON CONFLICT (user_id, currency)
  DO UPDATE SET 
    balance = prepaid_balances.balance + NEW.amount,
    updated_at = CURRENT_TIMESTAMP,
    last_transaction_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Recriar trigger
DROP TRIGGER IF EXISTS trigger_update_prepaid_balance ON prepaid_transactions;
CREATE TRIGGER trigger_update_prepaid_balance
  AFTER INSERT ON prepaid_transactions
  FOR EACH ROW EXECUTE FUNCTION update_prepaid_balance();

-- 9. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_api_keys_active ON user_api_keys(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_prepaid_balances_user_currency ON prepaid_balances(user_id, currency);
CREATE INDEX IF NOT EXISTS idx_prepaid_transactions_user_type ON prepaid_transactions(user_id, transaction_type);

-- 10. Ajustar operations table para usar INTEGER user_id
ALTER TABLE operations 
DROP CONSTRAINT IF EXISTS operations_user_id_fkey,
ALTER COLUMN user_id TYPE INTEGER USING user_id::INTEGER,
ADD CONSTRAINT operations_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

-- 11. Verificar estrutura final
SELECT 
  'user_profiles' as table_name,
  COUNT(*) as total_columns,
  COUNT(CASE WHEN column_name IN ('cpf', 'whatsapp', 'banco_nome', 'dados_validados') THEN 1 END) as required_fields
FROM information_schema.columns 
WHERE table_name = 'user_profiles' AND table_schema = 'public'
UNION ALL
SELECT 
  'plans' as table_name,
  COUNT(*) as total_columns,
  COUNT(CASE WHEN column_name IN ('comissao_percentual', 'tipo_plano', 'nome_plano') THEN 1 END) as required_fields
FROM information_schema.columns 
WHERE table_name = 'plans' AND table_schema = 'public'
UNION ALL
SELECT 
  'user_api_keys' as table_name,
  COUNT(*) as total_columns,
  1 as required_fields
FROM information_schema.columns 
WHERE table_name = 'user_api_keys' AND table_schema = 'public'
UNION ALL
SELECT 
  'prepaid_balances' as table_name,
  COUNT(*) as total_columns,
  1 as required_fields
FROM information_schema.columns 
WHERE table_name = 'prepaid_balances' AND table_schema = 'public';

-- 12. Mostrar planos atuais
SELECT nome_plano, tipo_plano, comissao_percentual, moeda, unit_amount FROM plans;
