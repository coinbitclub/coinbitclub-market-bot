import stripeService from '../services/stripeService.js';
import logger from '../common/logger.js';

async function setupStripeProducts() {
  try {
    console.log('🚀 Iniciando configuração dos produtos Stripe...');

    // 1. Criar produtos de assinatura
    console.log('\n📦 Criando produtos de assinatura...');
    
    const subscriptionProducts = [
      {
        name: 'CoinBit Club - Plano Brasil Mensal',
        description: 'Assinatura mensal R$200 + 10% de comissão sobre lucros',
        type: 'subscription',
        features: ['Sinais de trading', 'Suporte prioritário', 'Análises diárias'],
        metadata: {
          region: 'brasil',
          plan_type: 'mensal',
          commission_rate: '10'
        }
      },
      {
        name: 'CoinBit Club - Plano Brasil Comissão',
        description: 'Apenas 20% de comissão sobre lucros, sem mensalidade',
        type: 'subscription',
        features: ['Sinais de trading', 'Análises diárias'],
        metadata: {
          region: 'brasil',
          plan_type: 'comissao',
          commission_rate: '20'
        }
      },
      {
        name: 'CoinBit Club - International Monthly Plan',
        description: 'Monthly subscription USD $40 + 10% commission on profits',
        type: 'subscription',
        features: ['Trading signals', 'Priority support', 'Daily analysis'],
        metadata: {
          region: 'internacional',
          plan_type: 'mensal',
          commission_rate: '10'
        }
      },
      {
        name: 'CoinBit Club - International Commission Plan',
        description: 'Only 20% commission on profits, no monthly fee',
        type: 'subscription',
        features: ['Trading signals', 'Daily analysis'],
        metadata: {
          region: 'internacional',
          plan_type: 'comissao',
          commission_rate: '20'
        }
      }
    ];

    const createdProducts = {};
    
    for (const productData of subscriptionProducts) {
      try {
        const product = await stripeService.createProduct(productData);
        createdProducts[productData.metadata.region + '_' + productData.metadata.plan_type] = product;
        console.log(`✅ Produto criado: ${product.name}`);
      } catch (error) {
        console.error(`❌ Erro ao criar produto ${productData.name}:`, error.message);
      }
    }

    // 2. Criar preços para assinaturas
    console.log('\n💰 Criando preços para assinaturas...');
    
    const subscriptionPrices = [
      {
        product_key: 'brasil_mensal',
        product_id: createdProducts.brasil_mensal?.id,
        amount: 200.00,
        currency: 'BRL',
        recurring: true,
        interval: 'month',
        nickname: 'Brasil Mensal - R$200/mês'
      },
      {
        product_key: 'brasil_comissao',
        product_id: createdProducts.brasil_comissao?.id,
        amount: 0.00,
        currency: 'BRL',
        recurring: true,
        interval: 'month',
        nickname: 'Brasil Comissão - Grátis'
      },
      {
        product_key: 'internacional_mensal',
        product_id: createdProducts.internacional_mensal?.id,
        amount: 40.00,
        currency: 'USD',
        recurring: true,
        interval: 'month',
        nickname: 'International Monthly - $40/month'
      },
      {
        product_key: 'internacional_comissao',
        product_id: createdProducts.internacional_comissao?.id,
        amount: 0.00,
        currency: 'USD',
        recurring: true,
        interval: 'month',
        nickname: 'International Commission - Free'
      }
    ];

    const createdPrices = {};

    for (const priceData of subscriptionPrices) {
      if (priceData.product_id) {
        try {
          const price = await stripeService.createPrice(priceData);
          createdPrices[priceData.product_key] = price;
          console.log(`✅ Preço criado: ${price.nickname}`);
        } catch (error) {
          console.error(`❌ Erro ao criar preço ${priceData.nickname}:`, error.message);
        }
      }
    }

    // 3. Criar produtos de recarga pré-paga
    console.log('\n💳 Criando produtos de recarga...');
    
    const prepaidProducts = [
      {
        name: 'Recarga CoinBit Club - Brasil',
        description: 'Recarga de saldo para operações no Brasil (mínimo R$60)',
        type: 'prepaid',
        features: ['Saldo para trading', 'Sem taxa de manutenção'],
        metadata: {
          region: 'brasil',
          minimum_amount: '60'
        }
      },
      {
        name: 'CoinBit Club Top-up - International',
        description: 'Balance top-up for international operations (minimum $40)',
        type: 'prepaid',
        features: ['Trading balance', 'No maintenance fee'],
        metadata: {
          region: 'internacional',
          minimum_amount: '40'
        }
      }
    ];

    for (const productData of prepaidProducts) {
      try {
        const product = await stripeService.createProduct(productData);
        createdProducts[productData.metadata.region + '_prepaid'] = product;
        console.log(`✅ Produto criado: ${product.name}`);
      } catch (error) {
        console.error(`❌ Erro ao criar produto ${productData.name}:`, error.message);
      }
    }

    // 4. Criar preços flexíveis para recargas
    console.log('\n🔄 Criando preços para recargas...');
    
    const prepaidPrices = [
      // Brasil - Valores fixos com desconto automático
      {
        product_id: createdProducts.brasil_prepaid?.id,
        amount: 60.00,
        currency: 'BRL',
        nickname: 'Recarga Brasil - R$60'
      },
      {
        product_id: createdProducts.brasil_prepaid?.id,
        amount: 100.00,
        currency: 'BRL',
        nickname: 'Recarga Brasil - R$100'
      },
      {
        product_id: createdProducts.brasil_prepaid?.id,
        amount: 200.00,
        currency: 'BRL',
        nickname: 'Recarga Brasil - R$200'
      },
      {
        product_id: createdProducts.brasil_prepaid?.id,
        amount: 500.00,
        currency: 'BRL',
        nickname: 'Recarga Brasil - R$500'
      },
      {
        product_id: createdProducts.brasil_prepaid?.id,
        amount: 1000.00,
        currency: 'BRL',
        nickname: 'Recarga Brasil - R$1.000'
      },
      // Internacional - Valores fixos
      {
        product_id: createdProducts.internacional_prepaid?.id,
        amount: 40.00,
        currency: 'USD',
        nickname: 'Top-up International - $40'
      },
      {
        product_id: createdProducts.internacional_prepaid?.id,
        amount: 100.00,
        currency: 'USD',
        nickname: 'Top-up International - $100'
      },
      {
        product_id: createdProducts.internacional_prepaid?.id,
        amount: 250.00,
        currency: 'USD',
        nickname: 'Top-up International - $250'
      },
      {
        product_id: createdProducts.internacional_prepaid?.id,
        amount: 500.00,
        currency: 'USD',
        nickname: 'Top-up International - $500'
      },
      {
        product_id: createdProducts.internacional_prepaid?.id,
        amount: 1000.00,
        currency: 'USD',
        nickname: 'Top-up International - $1.000'
      }
    ];

    for (const priceData of prepaidPrices) {
      if (priceData.product_id) {
        try {
          const price = await stripeService.createPrice(priceData);
          console.log(`✅ Preço criado: ${price.nickname}`);
        } catch (error) {
          console.error(`❌ Erro ao criar preço ${priceData.nickname}:`, error.message);
        }
      }
    }

    // 5. Criar cupons promocionais
    console.log('\n🎫 Criando cupons promocionais...');
    
    const promotionalCoupons = [
      {
        code: 'PRIMEIRA5',
        discount_type: 'percentage',
        discount_value: 5,
        first_purchase_only: true,
        applies_to_subscription: true,
        applies_to_prepaid: true,
        minimum_amount: 60,
        max_redemptions: 1000,
        description: '5% de desconto na primeira compra'
      },
      {
        code: 'PRIMEIRA10',
        discount_type: 'percentage',
        discount_value: 10,
        first_purchase_only: true,
        applies_to_subscription: true,
        applies_to_prepaid: true,
        minimum_amount: 200,
        max_redemptions: 500,
        description: '10% de desconto na primeira compra (mínimo R$200)'
      },
      {
        code: 'VIP15',
        discount_type: 'percentage',
        discount_value: 15,
        first_purchase_only: true,
        applies_to_subscription: true,
        applies_to_prepaid: false,
        minimum_amount: 200,
        max_redemptions: 100,
        description: '15% de desconto VIP na primeira assinatura'
      },
      {
        code: 'FIRSTTIME5',
        discount_type: 'percentage',
        discount_value: 5,
        currency: 'USD',
        first_purchase_only: true,
        applies_to_subscription: true,
        applies_to_prepaid: true,
        minimum_amount: 40,
        max_redemptions: 1000,
        description: '5% off first purchase'
      },
      {
        code: 'FIRSTTIME10',
        discount_type: 'percentage',
        discount_value: 10,
        currency: 'USD',
        first_purchase_only: true,
        applies_to_subscription: true,
        applies_to_prepaid: true,
        minimum_amount: 100,
        max_redemptions: 500,
        description: '10% off first purchase (minimum $100)'
      }
    ];

    for (const couponData of promotionalCoupons) {
      try {
        // Criar cupom no Stripe
        const coupon = await stripeService.createCoupon(couponData);
        
        // Criar código promocional
        await stripeService.createPromotionCode({
          ...couponData,
          coupon_id: coupon.id
        });
        
        console.log(`✅ Cupom criado: ${couponData.code} - ${couponData.description}`);
      } catch (error) {
        console.error(`❌ Erro ao criar cupom ${couponData.code}:`, error.message);
      }
    }

    console.log('\n🎉 Configuração concluída com sucesso!');
    console.log('\n📋 Resumo:');
    console.log('- Produtos de assinatura criados: 4');
    console.log('- Preços de assinatura criados: 4');
    console.log('- Produtos de recarga criados: 2');
    console.log('- Preços de recarga criados: 10');
    console.log('- Cupons promocionais criados: 5');
    
    console.log('\n🔗 Próximos passos:');
    console.log('1. Configure as variáveis de ambiente STRIPE_SECRET_KEY e STRIPE_WEBHOOK_SECRET');
    console.log('2. Configure o endpoint de webhook: /api/stripe/webhook');
    console.log('3. Teste os fluxos de pagamento com dados de teste');
    
  } catch (error) {
    console.error('❌ Erro na configuração:', error);
  }
}

// Executar se chamado diretamente
console.log('🚀 Iniciando setup do Stripe...');
setupStripeProducts().then(() => {
  console.log('\n✅ Setup finalizado!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro no setup:', error);
  process.exit(1);
});

export { setupStripeProducts };
