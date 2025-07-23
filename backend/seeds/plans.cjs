/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Clear existing data
  await knex('plans').del();
  
  // Insert plans
  await knex('plans').insert([
    {
      id: 1,
      name: 'Trial',
      stripe_product_id: 'prod_trial_coinbitclub',
      stripe_price_id_monthly: 'price_trial_monthly',
      price_monthly: 0,
      price_yearly: 0,
      features: JSON.stringify([
        'Acesso testnet apenas',
        'Máximo 1 operação simultânea',
        'Uso de 30% do capital',
        'Sinais básicos',
        'Suporte por email'
      ]),
      max_concurrent_operations: 1,
      active: true
    },
    {
      id: 2,
      name: 'Basic',
      stripe_product_id: 'prod_basic_coinbitclub',
      stripe_price_id_monthly: 'price_basic_monthly',
      stripe_price_id_yearly: 'price_basic_yearly',
      price_monthly: 29.99,
      price_yearly: 299.99,
      features: JSON.stringify([
        'Acesso real + testnet',
        'Máximo 2 operações simultâneas',
        'Uso de 50% do capital',
        'Sinais avançados',
        'Decisões por IA',
        'Suporte prioritário'
      ]),
      max_concurrent_operations: 2,
      active: true
    },
    {
      id: 3,
      name: 'Professional',
      stripe_product_id: 'prod_professional_coinbitclub',
      stripe_price_id_monthly: 'price_professional_monthly',
      stripe_price_id_yearly: 'price_professional_yearly',
      price_monthly: 79.99,
      price_yearly: 799.99,
      features: JSON.stringify([
        'Acesso real + testnet',
        'Máximo 5 operações simultâneas',
        'Uso de 80% do capital',
        'Sinais premium',
        'IA avançada',
        'Relatórios detalhados',
        'Suporte VIP 24/7'
      ]),
      max_concurrent_operations: 5,
      active: true
    },
    {
      id: 4,
      name: 'Enterprise',
      stripe_product_id: 'prod_enterprise_coinbitclub',
      stripe_price_id_monthly: 'price_enterprise_monthly',
      stripe_price_id_yearly: 'price_enterprise_yearly',
      price_monthly: 199.99,
      price_yearly: 1999.99,
      features: JSON.stringify([
        'Acesso real + testnet',
        'Operações simultâneas ilimitadas',
        'Uso de 100% do capital',
        'Sinais premium + personalizados',
        'IA empresarial',
        'API dedicada',
        'Gerente de conta dedicado',
        'Suporte 24/7 prioritário'
      ]),
      max_concurrent_operations: 999,
      active: true
    }
  ]);
};
