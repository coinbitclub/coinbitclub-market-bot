-- Correção final da estrutura do banco de dados
-- CoinBitClub Market Bot - Conformidade 100% com especificação

-- 1. Adicionar campos faltantes na tabela user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20),
ADD COLUMN IF NOT EXISTS banco_nome VARCHAR(100),
ADD COLUMN IF NOT EXISTS conta_tipo VARCHAR(20),
ADD COLUMN IF NOT EXISTS agencia VARCHAR(10),
ADD COLUMN IF NOT EXISTS conta_numero VARCHAR(20),
ADD COLUMN IF NOT EXISTS pix_tipo VARCHAR(20),
ADD COLUMN IF NOT EXISTS pix_chave VARCHAR(100),
ADD COLUMN IF NOT EXISTS endereco_completo TEXT,
ADD COLUMN IF NOT EXISTS dados_validados BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS perfil_usuario VARCHAR(20) DEFAULT 'FREE';

-- 2. Criar enum para perfil_usuario se não existir
DO $$ BEGIN
    CREATE TYPE perfil_usuario_enum AS ENUM ('FREE', 'PRO', 'FLEX', 'PREMIUM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Ajustar tabela plans para incluir campos de comissão
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS comissao_percentual DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tipo_plano VARCHAR(20),
ADD COLUMN IF NOT EXISTS moeda VARCHAR(10) DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS nome_plano VARCHAR(100);

-- 4. Atualizar dados dos planos existentes
UPDATE plans SET 
  nome_plano = name,
  tipo_plano = CASE 
    WHEN UPPER(name) LIKE '%PRO%' THEN 'PRO'
    WHEN UPPER(name) LIKE '%FLEX%' THEN 'FLEX'
    WHEN UPPER(name) LIKE '%PREMIUM%' THEN 'PREMIUM'
    ELSE 'FREE'
  END,
  comissao_percentual = CASE 
    WHEN UPPER(name) LIKE '%PRO%' THEN 10
    WHEN UPPER(name) LIKE '%FLEX%' THEN 20
    WHEN UPPER(name) LIKE '%PREMIUM%' THEN 15
    ELSE 0
  END,
  moeda = CASE currency
    WHEN 'U' THEN 'USD'
    WHEN 'B' THEN 'BRL'
    ELSE 'USD'
  END
WHERE nome_plano IS NULL;

-- 5. Inserir planos padrão se não existirem
INSERT INTO plans (name, price_id, currency, unit_amount, nome_plano, tipo_plano, comissao_percentual, moeda, features) 
VALUES 
('PRO', 'price_pro_monthly', 'U', 49.90, 'PRO', 'PRO', 10, 'USD', '{"ai_analysis": true, "trading_signals": true, "affiliate_system": true}'),
('FLEX', 'price_flex_monthly', 'U', 99.90, 'FLEX', 'FLEX', 20, 'USD', '{"ai_analysis": true, "trading_signals": true, "affiliate_system": true, "priority_support": true}')
ON CONFLICT (price_id) DO UPDATE SET
  nome_plano = EXCLUDED.nome_plano,
  tipo_plano = EXCLUDED.tipo_plano,
  comissao_percentual = EXCLUDED.comissao_percentual,
  moeda = EXCLUDED.moeda;

-- 6. Criar tabela user_api_keys se não existir
CREATE TABLE IF NOT EXISTS user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
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

-- 7. Criar tabelas do sistema prepago se não existirem
CREATE TABLE IF NOT EXISTS prepaid_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  balance DECIMAL(20,8) DEFAULT 0,
  reserved_balance DECIMAL(20,8) DEFAULT 0,
  last_transaction_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, currency)
);

CREATE TABLE IF NOT EXISTS prepaid_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  balance_id UUID REFERENCES prepaid_balances(id),
  transaction_type VARCHAR(20) NOT NULL,
  amount DECIMAL(20,8) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  description TEXT,
  reference_id VARCHAR(100),
  reference_type VARCHAR(50),
  status VARCHAR(20) DEFAULT 'completed',
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP
);

-- 8. Criar trigger para atualizar saldo automaticamente
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

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS trigger_update_prepaid_balance ON prepaid_transactions;
CREATE TRIGGER trigger_update_prepaid_balance
  AFTER INSERT ON prepaid_transactions
  FOR EACH ROW EXECUTE FUNCTION update_prepaid_balance();

-- 9. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_cpf ON user_profiles(cpf);
CREATE INDEX IF NOT EXISTS idx_user_profiles_perfil ON user_profiles(perfil_usuario);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_active ON user_api_keys(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_prepaid_balances_user_currency ON prepaid_balances(user_id, currency);
CREATE INDEX IF NOT EXISTS idx_prepaid_transactions_user_type ON prepaid_transactions(user_id, transaction_type);

-- 10. Comentários para documentação
COMMENT ON COLUMN user_profiles.cpf IS 'CPF do usuário para validação KYC';
COMMENT ON COLUMN user_profiles.whatsapp IS 'Número WhatsApp para contato';
COMMENT ON COLUMN user_profiles.dados_validados IS 'Indica se dados bancários foram validados';
COMMENT ON COLUMN plans.comissao_percentual IS 'Percentual de comissão para afiliados';
COMMENT ON TABLE user_api_keys IS 'Chaves API dos usuários para exchanges';
COMMENT ON TABLE prepaid_balances IS 'Saldos prepagos por usuário e moeda';
COMMENT ON TABLE prepaid_transactions IS 'Histórico de transações prepagos';

-- 11. Verificar/Corrigir estrutura de notificações
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS dados_extras JSONB,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'enviada';

-- 12. Assegurar que a tabela de operações existe com estrutura correta
CREATE TABLE IF NOT EXISTS operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  symbol VARCHAR(20) NOT NULL,
  side VARCHAR(10) NOT NULL,
  quantity DECIMAL(20,8) NOT NULL,
  entry_price DECIMAL(20,8) NOT NULL,
  exit_price DECIMAL(20,8),
  profit DECIMAL(20,8) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'open',
  exchange VARCHAR(50),
  order_id VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Verificação final
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
WHERE table_name = 'plans' AND table_schema = 'public';

-- Verificar dados dos planos
SELECT nome_plano, tipo_plano, comissao_percentual, moeda FROM plans;
