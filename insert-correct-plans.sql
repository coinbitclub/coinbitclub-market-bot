-- Inserir planos PRO e FLEX com comissões corretas
-- Garantir 100% de conformidade com especificação

INSERT INTO plans (
  name, 
  price_id, 
  currency, 
  unit_amount, 
  nome_plano, 
  tipo_plano, 
  comissao_percentual, 
  moeda, 
  features
) VALUES 
(
  'PRO Plan', 
  'price_pro_monthly', 
  'U', 
  49.90, 
  'PRO', 
  'PRO', 
  10.00, 
  'USD', 
  '{"ai_analysis": true, "trading_signals": true, "affiliate_system": true, "priority_support": false}'
),
(
  'FLEX Plan', 
  'price_flex_monthly', 
  'U', 
  99.90, 
  'FLEX', 
  'FLEX', 
  20.00, 
  'USD', 
  '{"ai_analysis": true, "trading_signals": true, "affiliate_system": true, "priority_support": true, "advanced_analytics": true}'
)
ON CONFLICT (price_id) DO UPDATE SET 
  nome_plano = EXCLUDED.nome_plano,
  tipo_plano = EXCLUDED.tipo_plano,
  comissao_percentual = EXCLUDED.comissao_percentual,
  moeda = EXCLUDED.moeda,
  features = EXCLUDED.features;

-- Verificar planos inseridos
SELECT 
  name,
  nome_plano,
  tipo_plano,
  comissao_percentual,
  moeda,
  unit_amount,
  features
FROM plans 
WHERE tipo_plano IN ('PRO', 'FLEX')
ORDER BY comissao_percentual;
