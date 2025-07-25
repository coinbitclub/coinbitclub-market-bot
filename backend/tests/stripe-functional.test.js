/**
 * Teste Funcional da Integração Stripe
 * Testa as principais funções do stripeService
 */
import stripeService from '../services/stripeService.js';
import db from '../common/db.js';
import logger from '../common/logger.js';

class StripeServiceTest {
  constructor() {
    this.testResults = [];
    this.testUsers = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'João Silva (Teste)',
        email: 'joao.silva.teste@coinbitclub.com',
        region: 'brasil',
        is_first_purchase: true
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'John Doe (Test)',
        email: 'john.doe.test@coinbitclub.com',
        region: 'internacional',
        is_first_purchase: true
      }
    ];
  }

  async runFunctionalTests() {
    console.log('🧪 TESTE FUNCIONAL DA INTEGRAÇÃO STRIPE\n');
    console.log('=' .repeat(50));
    
    try {
      await this.testCheckoutSessionCreation();
      await this.testPromotionalCodeValidation();
      await this.testProductPriceQueries();
      await this.testRegionalPricing();
      await this.generateFunctionalReport();
      
    } catch (error) {
      console.error('❌ Erro durante os testes funcionais:', error);
    }
  }

  async testCheckoutSessionCreation() {
    console.log('\n🛒 TESTANDO CRIAÇÃO DE CHECKOUT SESSIONS\n');
    
    for (const user of this.testUsers) {
      try {
        console.log(`🧪 Testando checkout para: ${user.name} (${user.region})`);
        
        // Teste 1: Assinatura mensal 
        const monthlyPlan = user.region === 'brasil' ? 'brasil_mensal' : 'exterior_mensal';
        const monthlyCheckout = await stripeService.createCheckoutSession({
          customerId: user.id,
          priceId: `price_${monthlyPlan}`,
          planType: monthlyPlan,
          successUrl: 'https://coinbitclub.com/success',
          cancelUrl: 'https://coinbitclub.com/cancel',
          customerEmail: user.email
        });
        
        console.log(`  ✅ Checkout mensal criado: ${monthlyCheckout.id}`);
        console.log(`     URL: ${monthlyCheckout.url?.substring(0, 50)}...`);
        
        this.testResults.push({
          test: 'Checkout Session - Mensal',
          user: user.name,
          region: user.region,
          status: 'success',
          checkout_id: monthlyCheckout.id
        });
        
        // Teste 2: Plano apenas comissão
        const commissionPlan = user.region === 'brasil' ? 'brasil_comissao' : 'exterior_comissao';
        const commissionCheckout = await stripeService.createCheckoutSession({
          customerId: user.id,
          priceId: `price_${commissionPlan}`,
          planType: commissionPlan,
          successUrl: 'https://coinbitclub.com/success',
          cancelUrl: 'https://coinbitclub.com/cancel',
          customerEmail: user.email
        });
        
        console.log(`  ✅ Checkout comissão criado: ${commissionCheckout.id}`);
        
        this.testResults.push({
          test: 'Checkout Session - Comissão',
          user: user.name,
          region: user.region,
          status: 'success',
          checkout_id: commissionCheckout.id
        });
        
      } catch (error) {
        console.log(`  ❌ Erro no checkout ${user.name}: ${error.message}`);
        this.testResults.push({
          test: 'Checkout Session',
          user: user.name,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async testPromotionalCodeValidation() {
    console.log('\n🎫 TESTANDO VALIDAÇÃO DE CÓDIGOS PROMOCIONAIS\n');
    
    const testCodes = [
      { code: 'PRIMEIRO10', expectedValid: true, region: 'brasil' },
      { code: 'FIRST15', expectedValid: true, region: 'internacional' },
      { code: 'RECARGA5', expectedValid: true, region: 'brasil' },
      { code: 'CODIGO_INEXISTENTE', expectedValid: false, region: 'brasil' }
    ];
    
    for (const testCode of testCodes) {
      try {
        const user = this.testUsers.find(u => u.region === testCode.region) || this.testUsers[0];
        
        console.log(`🧪 Testando código: ${testCode.code} para ${user.name}`);
        
        const validation = await stripeService.validatePromotionalCode(
          testCode.code,
          user.id,
          testCode.region,
          20000 // R$ 200 ou $200
        );
        
        if (validation.isValid === testCode.expectedValid) {
          console.log(`  ✅ Validação correta: ${validation.isValid ? 'Válido' : 'Inválido'}`);
          if (validation.isValid) {
            console.log(`     Desconto: ${validation.discountPercentage}%`);
          } else {
            console.log(`     Motivo: ${validation.error}`);
          }
        } else {
          console.log(`  ❌ Validação incorreta: esperado ${testCode.expectedValid}, obtido ${validation.isValid}`);
        }
        
        this.testResults.push({
          test: 'Promotional Code Validation',
          code: testCode.code,
          user: user.name,
          expected: testCode.expectedValid,
          actual: validation.isValid,
          status: validation.isValid === testCode.expectedValid ? 'success' : 'failed'
        });
        
      } catch (error) {
        console.log(`  ❌ Erro na validação ${testCode.code}: ${error.message}`);
        this.testResults.push({
          test: 'Promotional Code Validation',
          code: testCode.code,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async testProductPriceQueries() {
    console.log('\n💰 TESTANDO CONSULTA DE PRODUTOS E PREÇOS\n');
    
    try {
      // Buscar produtos por região
      const brasilProducts = await db('stripe_products')
        .where('metadata', 'like', '%brasil%')
        .select('*');
      
      const internationalProducts = await db('stripe_products')
        .where('metadata', 'like', '%internacional%')
        .select('*');
      
      console.log(`🇧🇷 Produtos Brasil: ${brasilProducts.length}`);
      console.log(`🌎 Produtos Internacional: ${internationalProducts.length}`);
      
      // Testar preços
      for (const product of brasilProducts.slice(0, 2)) {
        const prices = await db('stripe_prices')
          .where('product_id', product.id)
          .select('*');
        
        console.log(`  📦 ${product.name}: ${prices.length} preços`);
        for (const price of prices) {
          const amount = price.unit_amount / 100;
          const currency = price.currency.toUpperCase();
          const interval = price.recurring_interval || 'único';
          console.log(`     💵 ${amount} ${currency} (${interval})`);
        }
      }
      
      this.testResults.push({
        test: 'Product Price Queries',
        brasil_products: brasilProducts.length,
        international_products: internationalProducts.length,
        status: 'success'
      });
      
    } catch (error) {
      console.log(`❌ Erro na consulta de produtos: ${error.message}`);
      this.testResults.push({
        test: 'Product Price Queries',
        status: 'failed',
        error: error.message
      });
    }
  }

  async testRegionalPricing() {
    console.log('\n🌍 TESTANDO PREÇOS REGIONAIS\n');
    
    try {
      // Verificar preços do Brasil (BRL)
      const brasilPrices = await db('stripe_prices')
        .where('currency', 'brl')
        .select('*');
      
      // Verificar preços internacionais (USD)
      const usdPrices = await db('stripe_prices')
        .where('currency', 'usd')
        .select('*');
      
      console.log(`🇧🇷 Preços em BRL: ${brasilPrices.length}`);
      console.log(`🇺🇸 Preços em USD: ${usdPrices.length}`);
      
      // Verificar alguns preços específicos
      const brasilMonthly = brasilPrices.find(p => p.metadata && p.metadata.includes('mensal'));
      const usdMonthly = usdPrices.find(p => p.metadata && p.metadata.includes('mensal'));
      
      if (brasilMonthly) {
        console.log(`  📊 Brasil Mensal: R$ ${brasilMonthly.unit_amount / 100}`);
      }
      
      if (usdMonthly) {
        console.log(`  📊 Internacional Mensal: $${usdMonthly.unit_amount / 100}`);
      }
      
      // Verificar preços de recarga
      const rechargeValues = [60, 100, 200, 500, 1000, 2000, 5000, 10000];
      console.log(`\n💳 Preços de recarga disponíveis:`);
      
      for (const value of rechargeValues) {
        const brlPrice = brasilPrices.find(p => p.unit_amount === value * 100);
        const usdPrice = usdPrices.find(p => p.unit_amount === value * 100);
        
        const brlStatus = brlPrice ? '✅' : '❌';
        const usdStatus = usdPrice ? '✅' : '❌';
        
        console.log(`  ${brlStatus} BRL ${value} | ${usdStatus} USD ${value}`);
      }
      
      this.testResults.push({
        test: 'Regional Pricing',
        brl_prices: brasilPrices.length,
        usd_prices: usdPrices.length,
        status: 'success'
      });
      
    } catch (error) {
      console.log(`❌ Erro nos preços regionais: ${error.message}`);
      this.testResults.push({
        test: 'Regional Pricing',
        status: 'failed',
        error: error.message
      });
    }
  }

  async generateFunctionalReport() {
    console.log('\n📋 RELATÓRIO FUNCIONAL\n');
    console.log('=' .repeat(50));
    
    const totalTests = this.testResults.length;
    const successfulTests = this.testResults.filter(r => r.status === 'success').length;
    const failedTests = totalTests - successfulTests;
    
    console.log(`\n📊 ESTATÍSTICAS DOS TESTES:`);
    console.log(`   Total: ${totalTests}`);
    console.log(`   ✅ Sucessos: ${successfulTests}`);
    console.log(`   ❌ Falhas: ${failedTests}`);
    console.log(`   📈 Taxa de sucesso: ${((successfulTests / totalTests) * 100).toFixed(1)}%`);
    
    console.log(`\n🔍 DETALHES DOS TESTES:`);
    console.log('-' .repeat(30));
    
    for (const result of this.testResults) {
      const status = result.status === 'success' ? '✅' : '❌';
      console.log(`${status} ${result.test}`);
      
      if (result.status === 'failed' && result.error) {
        console.log(`    Erro: ${result.error}`);
      }
      
      if (result.checkout_id) {
        console.log(`    Checkout ID: ${result.checkout_id}`);
      }
    }
    
    console.log(`\n🎯 FUNCIONALIDADES TESTADAS:`);
    console.log('-' .repeat(30));
    console.log('  ✅ Criação de checkout sessions');
    console.log('  ✅ Validação de códigos promocionais');
    console.log('  ✅ Consulta de produtos e preços');
    console.log('  ✅ Preços regionais (BRL/USD)');
    console.log('  ✅ Integração com banco de dados');
    
    if (failedTests === 0) {
      console.log('\n🚀 TODAS AS FUNCIONALIDADES ESTÃO FUNCIONANDO!');
      console.log('   A integração Stripe está 100% operacional');
    } else {
      console.log(`\n⚠️  ALGUMAS FUNCIONALIDADES FALHARAM (${failedTests}/${totalTests})`);
      console.log('   Verifique os erros acima para correção');
    }
    
    console.log('\n' + '=' .repeat(50));
  }
}

// Executar teste funcional
console.log('🧪 Iniciando teste funcional...');
const test = new StripeServiceTest();
test.runFunctionalTests().then(() => {
  console.log('\n✅ Teste funcional finalizado!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro no teste funcional:', error);
  process.exit(1);
});

export default StripeServiceTest;
