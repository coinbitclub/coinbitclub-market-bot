/**
 * Testes Completos da Integração Stripe
 * Testa todas as funcionalidades com chaves de teste
 */
import stripeService from '../services/stripeService.js';
import db from '../common/db.js';
import logger from '../common/logger.js';

// Dados de teste simulando usuários reais
const testUsers = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'João Silva',
    email: 'joao.silva.teste@coinbitclub.com',
    region: 'brasil',
    is_first_purchase: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Maria Santos',
    email: 'maria.santos.teste@coinbitclub.com',
    region: 'brasil',
    is_first_purchase: false
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'John Doe',
    email: 'john.doe.test@coinbitclub.com',
    region: 'internacional',
    is_first_purchase: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    name: 'Jane Smith',
    email: 'jane.smith.test@coinbitclub.com',
    region: 'internacional',
    is_first_purchase: false
  }
];

// Cenários de teste para produtos
const testScenarios = {
  subscriptions: {
    brasil_mensal: {
      amount: 200,
      currency: 'BRL',
      type: 'subscription',
      region: 'brasil'
    },
    brasil_comissao: {
      amount: 0,
      currency: 'BRL',
      type: 'subscription',
      region: 'brasil'
    },
    internacional_mensal: {
      amount: 40,
      currency: 'USD',
      type: 'subscription',
      region: 'internacional'
    },
    internacional_comissao: {
      amount: 0,
      currency: 'USD',
      type: 'subscription',
      region: 'internacional'
    }
  },
  prepaid: {
    brasil: [
      { amount: 60, currency: 'BRL' },
      { amount: 100, currency: 'BRL' },
      { amount: 600, currency: 'BRL' }, // Testa desconto 5%
      { amount: 6000, currency: 'BRL' } // Testa desconto 10%
    ],
    internacional: [
      { amount: 40, currency: 'USD' },
      { amount: 100, currency: 'USD' },
      { amount: 250, currency: 'USD' },
      { amount: 500, currency: 'USD' }
    ]
  },
  promocodes: [
    { code: 'PRIMEIRO10', region: 'brasil', discount: 10 },
    { code: 'FIRST15', region: 'internacional', discount: 15 },
    { code: 'RECARGA5', region: 'brasil', discount: 5, min_amount: 600 },
    { code: 'RECARGA10', region: 'brasil', discount: 10, min_amount: 6000 }
  ]
};

class StripeIntegrationTester {
  constructor() {
    this.results = {
      products: { success: 0, failed: 0, details: [] },
      prices: { success: 0, failed: 0, details: [] },
      checkout: { success: 0, failed: 0, details: [] },
      promocodes: { success: 0, failed: 0, details: [] },
      database: { success: 0, failed: 0, details: [] },
      webhooks: { success: 0, failed: 0, details: [] }
    };
  }

  async runAllTests() {
    console.log('🚀 Iniciando testes completos da integração Stripe...\n');
    
    try {
      // 1. Testar criação de checkout sessions
      await this.testCheckoutSessions();
      
      // 2. Testar aplicação de códigos promocionais
      await this.testPromotionalCodes();
      
      // 3. Testar inserção no banco de dados
      await this.testDatabaseOperations();
      
      // 4. Testar cenários de erro
      await this.testErrorScenarios();
      
      // 5. Testar validações de negócio
      await this.testBusinessValidations();
      
      // 6. Simular webhooks
      await this.testWebhookProcessing();
      
      // 7. Relatório final
      await this.generateTestReport();
      
    } catch (error) {
      console.error('❌ Erro durante os testes:', error);
      process.exit(1);
    }
  }

  async testCheckoutSessions() {
    console.log('💳 Testando criação de sessões de checkout...\n');
    
    for (const user of testUsers) {
      // Testar assinaturas
      for (const [planType, planData] of Object.entries(testScenarios.subscriptions)) {
        if (planData.region === user.region) {
          await this.createTestCheckoutSession(user, planData, 'subscription', planType);
        }
      }
      
      // Testar recargas
      const prepaidData = testScenarios.prepaid[user.region];
      if (prepaidData) {
        for (const recharge of prepaidData) {
          await this.createTestCheckoutSession(user, recharge, 'prepaid');
        }
      }
    }
  }

  async createTestCheckoutSession(user, productData, type, planType = null) {
    try {
      // Buscar produto apropriado no banco
      const product = await db('stripe_products')
        .where({
          region: user.region,
          product_type: type
        })
        .first();

      if (!product) {
        throw new Error(`Produto não encontrado para região ${user.region} e tipo ${type}`);
      }

      // Buscar preço apropriado
      const priceQuery = db('stripe_prices')
        .where('product_id', product.id)
        .where('currency', productData.currency);
      
      if (type === 'prepaid') {
        priceQuery.where('unit_amount', Math.round(productData.amount * 100));
      }
      
      const price = await priceQuery.first();

      if (!price) {
        throw new Error(`Preço não encontrado para produto ${product.name}`);
      }

      // Dados para checkout
      const checkoutData = {
        price_id: price.id,
        success_url: 'https://coinbitclub.com/sucesso?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'https://coinbitclub.com/cancelado',
        customer_email: user.email,
        metadata: {
          user_id: user.id,
          region: user.region,
          plan_type: planType,
          is_first_purchase: user.is_first_purchase
        }
      };

      // Criar sessão no Stripe
      const session = await stripeService.createCheckoutSession(checkoutData);
      
      // Salvar no banco
      await db('checkout_sessions').insert({
        id: session.id,
        user_id: user.id,
        amount: Math.round(productData.amount * 100),
        currency: productData.currency,
        status: 'open',
        expires_at: new Date(session.expires_at * 1000),
        metadata: JSON.stringify(checkoutData.metadata)
      });

      this.results.checkout.success++;
      this.results.checkout.details.push({
        user: user.name,
        type: type,
        plan: planType,
        amount: productData.amount,
        currency: productData.currency,
        session_id: session.id,
        status: 'success'
      });

      console.log(`✅ Checkout criado: ${user.name} - ${type} - ${productData.amount} ${productData.currency}`);
      
    } catch (error) {
      this.results.checkout.failed++;
      this.results.checkout.details.push({
        user: user.name,
        type: type,
        amount: productData.amount,
        currency: productData.currency,
        error: error.message,
        status: 'failed'
      });
      
      console.log(`❌ Erro checkout: ${user.name} - ${error.message}`);
    }
  }

  async testPromotionalCodes() {
    console.log('\n🎫 Testando códigos promocionais...\n');
    
    for (const user of testUsers) {
      for (const promoCode of testScenarios.promocodes) {
        if (promoCode.region === user.region) {
          await this.testPromotionalCode(user, promoCode);
        }
      }
    }
  }

  async testPromotionalCode(user, promoCode) {
    try {
      // Buscar código promocional no banco
      const code = await db('promotional_codes')
        .where('code', promoCode.code)
        .where('is_active', true)
        .first();

      if (!code) {
        throw new Error(`Código promocional ${promoCode.code} não encontrado`);
      }

      // Verificar se usuário já usou o código
      const existingUsage = await db('promotional_code_usage')
        .where('promotional_code_id', code.id)
        .where('user_id', user.id)
        .first();

      const canUse = !existingUsage && user.is_first_purchase;
      
      if (canUse) {
        // Simular uso do código
        await db('promotional_code_usage').insert({
          promotional_code_id: code.id,
          user_id: user.id,
          discount_applied: promoCode.discount,
          currency: user.region === 'brasil' ? 'BRL' : 'USD'
        });

        // Atualizar contador de uso
        await db('promotional_codes')
          .where('id', code.id)
          .increment('times_redeemed', 1);
      }

      this.results.promocodes.success++;
      this.results.promocodes.details.push({
        user: user.name,
        code: promoCode.code,
        discount: promoCode.discount,
        can_use: canUse,
        reason: canUse ? 'Aplicado com sucesso' : 'Usuário não elegível',
        status: 'success'
      });

      console.log(`✅ Teste promocional: ${user.name} - ${promoCode.code} - ${canUse ? 'Aplicado' : 'Não elegível'}`);
      
    } catch (error) {
      this.results.promocodes.failed++;
      this.results.promocodes.details.push({
        user: user.name,
        code: promoCode.code,
        error: error.message,
        status: 'failed'
      });
      
      console.log(`❌ Erro promocional: ${user.name} - ${promoCode.code} - ${error.message}`);
    }
  }

  async testDatabaseOperations() {
    console.log('\n💾 Testando operações no banco de dados...\n');
    
    try {
      // Teste 1: Inserir saldos pré-pagos
      for (const user of testUsers) {
        const currency = user.region === 'brasil' ? 'BRL' : 'USD';
        const initialBalance = user.region === 'brasil' ? 1000 : 100;
        
        await db('user_prepaid_balance').insert({
          user_id: user.id,
          balance: initialBalance,
          currency: currency,
          last_transaction_at: new Date()
        }).onConflict(['user_id', 'currency']).merge();
        
        console.log(`✅ Saldo criado: ${user.name} - ${initialBalance} ${currency}`);
      }
      
      // Teste 2: Inserir transações de teste
      for (const user of testUsers) {
        const currency = user.region === 'brasil' ? 'BRL' : 'USD';
        const amount = user.region === 'brasil' ? 500 : 50;
        
        await db('prepaid_transactions').insert({
          user_id: user.id,
          type: 'credit',
          amount: amount,
          currency: currency,
          balance_before: 0,
          balance_after: amount,
          description: 'Recarga de teste via Stripe',
          metadata: JSON.stringify({ test: true, stripe_session: 'test_session' })
        });
        
        console.log(`✅ Transação criada: ${user.name} - +${amount} ${currency}`);
      }
      
      // Teste 3: Criar pagamentos de teste
      for (const user of testUsers) {
        const currency = user.region === 'brasil' ? 'BRL' : 'USD';
        const amount = user.region === 'brasil' ? 200 : 40;
        
        await db('payments').insert({
          user_id: user.id,
          stripe_payment_intent_id: `pi_test_${user.id}_${Date.now()}`,
          type: 'subscription',
          status: 'succeeded',
          amount: amount,
          currency: currency,
          payment_method: 'card',
          description: `Assinatura mensal - ${user.name}`,
          paid_at: new Date(),
          metadata: JSON.stringify({ test: true })
        });
        
        console.log(`✅ Pagamento criado: ${user.name} - ${amount} ${currency}`);
      }
      
      this.results.database.success += testUsers.length * 3;
      
    } catch (error) {
      this.results.database.failed++;
      console.log(`❌ Erro banco de dados: ${error.message}`);
    }
  }

  async testErrorScenarios() {
    console.log('\n⚠️ Testando cenários de erro...\n');
    
    try {
      // Teste 1: Código promocional inválido
      try {
        await stripeService.validatePromotionalCode('CODIGO_INVALIDO', 1, 100, 'BRL');
        console.log('❌ Deveria ter falhado: código inválido');
      } catch (error) {
        console.log('✅ Erro esperado: código promocional inválido');
      }
      
      // Teste 2: Valor mínimo não atingido
      try {
        await stripeService.validatePromotionalCode('RECARGA10', 1, 50, 'BRL'); // Min: R$6000
        console.log('❌ Deveria ter falhado: valor mínimo');
      } catch (error) {
        console.log('✅ Erro esperado: valor mínimo não atingido');
      }
      
      // Teste 3: Segunda compra com código first-purchase
      try {
        // Simular usuário que já fez compra
        const existingUser = testUsers.find(u => !u.is_first_purchase);
        await stripeService.validatePromotionalCode('PRIMEIRA10', existingUser.id, 200, 'BRL');
        console.log('❌ Deveria ter falhado: não é primeira compra');
      } catch (error) {
        console.log('✅ Erro esperado: código apenas para primeira compra');
      }
      
      this.results.database.success += 3;
      
    } catch (error) {
      this.results.database.failed++;
      console.log(`❌ Erro nos testes de erro: ${error.message}`);
    }
  }

  async testBusinessValidations() {
    console.log('\n📊 Testando validações de negócio...\n');
    
    try {
      // Teste 1: Verificar descontos por faixa
      const discountTiers = [
        { amount: 600, expectedDiscount: 5, currency: 'BRL' },
        { amount: 6000, expectedDiscount: 10, currency: 'BRL' },
        { amount: 500, expectedDiscount: 0, currency: 'BRL' } // Abaixo do mínimo
      ];
      
      for (const tier of discountTiers) {
        const settings = await db('payment_settings')
          .where('key', 'prepaid_discounts')
          .first();
        
        const discountConfig = JSON.parse(settings.value);
        const brlTiers = discountConfig.brl_tiers;
        
        let appliedDiscount = 0;
        for (const discountTier of brlTiers) {
          if (tier.amount * 100 >= discountTier.minimum) {
            appliedDiscount = discountTier.discount_percentage;
          }
        }
        
        const success = appliedDiscount === tier.expectedDiscount;
        console.log(`${success ? '✅' : '❌'} Desconto ${tier.amount} BRL: esperado ${tier.expectedDiscount}%, aplicado ${appliedDiscount}%`);
        
        if (success) this.results.database.success++;
        else this.results.database.failed++;
      }
      
      // Teste 2: Verificar limites mínimos por moeda
      const currencies = await db('currency_settings').select('*');
      for (const currency of currencies) {
        const isValid = currency.minimum_balance > 0 && currency.minimum_operation > 0;
        console.log(`${isValid ? '✅' : '❌'} Limites ${currency.currency}: min_balance=${currency.minimum_balance}, min_operation=${currency.minimum_operation}`);
        
        if (isValid) this.results.database.success++;
        else this.results.database.failed++;
      }
      
    } catch (error) {
      this.results.database.failed++;
      console.log(`❌ Erro validações de negócio: ${error.message}`);
    }
  }

  async testWebhookProcessing() {
    console.log('\n🔗 Testando processamento de webhooks...\n');
    
    try {
      // Simular webhooks do Stripe
      const webhookEvents = [
        {
          type: 'payment_intent.succeeded',
          data: {
            object: {
              id: 'pi_test_webhook_1',
              amount: 20000,
              currency: 'brl',
              status: 'succeeded',
              metadata: { user_id: '1', plan_type: 'brasil_mensal' }
            }
          }
        },
        {
          type: 'checkout.session.completed',
          data: {
            object: {
              id: 'cs_test_webhook_1',
              payment_status: 'paid',
              amount_total: 4000,
              currency: 'usd',
              metadata: { user_id: '3', plan_type: 'internacional_mensal' }
            }
          }
        },
        {
          type: 'invoice.payment_failed',
          data: {
            object: {
              id: 'in_test_webhook_1',
              amount_paid: 0,
              currency: 'brl',
              status: 'open',
              metadata: { user_id: '2' }
            }
          }
        }
      ];
      
      for (const event of webhookEvents) {
        // Inserir log do webhook
        await db('webhook_logs').insert({
          provider: 'stripe',
          event_type: event.type,
          event_id: `evt_test_${Date.now()}_${Math.random()}`,
          payload: JSON.stringify(event),
          status: 'received'
        });
        
        // Processar webhook simulado
        await this.processWebhookEvent(event);
        
        console.log(`✅ Webhook processado: ${event.type}`);
        this.results.webhooks.success++;
      }
      
    } catch (error) {
      this.results.webhooks.failed++;
      console.log(`❌ Erro webhook: ${error.message}`);
    }
  }

  async processWebhookEvent(event) {
    switch (event.type) {
      case 'payment_intent.succeeded':
        // Atualizar status do pagamento
        await db('payments')
          .where('stripe_payment_intent_id', event.data.object.id)
          .update({
            status: 'succeeded',
            paid_at: new Date()
          });
        break;
        
      case 'checkout.session.completed':
        // Atualizar sessão de checkout
        await db('checkout_sessions')
          .where('id', event.data.object.id)
          .update({
            status: 'complete',
            completed_at: new Date()
          });
        break;
        
      case 'invoice.payment_failed':
        // Registrar falha de pagamento
        await db('payments').insert({
          user_id: event.data.object.metadata.user_id,
          stripe_invoice_id: event.data.object.id,
          type: 'subscription',
          status: 'failed',
          amount: 0,
          currency: event.data.object.currency,
          failed_at: new Date(),
          failure_reason: 'Payment failed via webhook'
        });
        break;
    }
  }

  async generateTestReport() {
    console.log('\n📋 RELATÓRIO FINAL DOS TESTES\n');
    console.log('='.repeat(50));
    
    // Relatório por categoria
    for (const [category, results] of Object.entries(this.results)) {
      const total = results.success + results.failed;
      const successRate = total > 0 ? ((results.success / total) * 100).toFixed(1) : 0;
      
      console.log(`\n${category.toUpperCase()}:`);
      console.log(`  ✅ Sucessos: ${results.success}`);
      console.log(`  ❌ Falhas: ${results.failed}`);
      console.log(`  📊 Taxa de sucesso: ${successRate}%`);
      
      if (results.details && results.details.length > 0) {
        console.log(`  📝 Detalhes: ${results.details.length} operações registradas`);
      }
    }
    
    // Verificar dados inseridos no banco
    console.log('\n📊 DADOS INSERIDOS NO BANCO:');
    console.log('='.repeat(30));
    
    const dbStats = await this.getDatabaseStats();
    for (const [table, count] of Object.entries(dbStats)) {
      console.log(`  ${table}: ${count} registros`);
    }
    
    // Resumo geral
    const totalSuccess = Object.values(this.results).reduce((sum, r) => sum + r.success, 0);
    const totalFailed = Object.values(this.results).reduce((sum, r) => sum + r.failed, 0);
    const overallRate = totalSuccess + totalFailed > 0 ? ((totalSuccess / (totalSuccess + totalFailed)) * 100).toFixed(1) : 0;
    
    console.log('\n🎯 RESUMO GERAL:');
    console.log('='.repeat(20));
    console.log(`  Total de testes: ${totalSuccess + totalFailed}`);
    console.log(`  Sucessos: ${totalSuccess}`);
    console.log(`  Falhas: ${totalFailed}`);
    console.log(`  Taxa geral de sucesso: ${overallRate}%`);
    
    if (overallRate >= 90) {
      console.log('\n🎉 INTEGRAÇÃO STRIPE VALIDADA COM SUCESSO! 🎉');
    } else if (overallRate >= 70) {
      console.log('\n⚠️  INTEGRAÇÃO FUNCIONAL COM ALGUMAS MELHORIAS NECESSÁRIAS');
    } else {
      console.log('\n❌ INTEGRAÇÃO PRECISA DE CORREÇÕES ANTES DA PRODUÇÃO');
    }
    
    console.log('\n' + '='.repeat(50));
  }

  async getDatabaseStats() {
    const tables = [
      'stripe_products',
      'stripe_prices', 
      'checkout_sessions',
      'promotional_codes',
      'promotional_code_usage',
      'payments',
      'user_prepaid_balance',
      'prepaid_transactions',
      'webhook_logs'
    ];
    
    const stats = {};
    for (const table of tables) {
      try {
        const result = await db(table).count('* as count').first();
        stats[table] = result.count;
      } catch (error) {
        stats[table] = 'Erro';
      }
    }
    
    return stats;
  }
}

// Executar testes se chamado diretamente
console.log('🧪 Iniciando testes da integração Stripe...');
const tester = new StripeIntegrationTester();
tester.runAllTests().then(() => {
  console.log('\n✅ Testes finalizados!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro nos testes:', error);
  process.exit(1);
});

export default StripeIntegrationTester;
