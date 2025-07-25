#!/usr/bin/env node

const { ProductCatalogService } = require('../services/productCatalogService');
const { StripeProductService } = require('../services/stripeProductService');

async function initializeCatalog() {
    console.log('🚀 Iniciando configuração do catálogo de produtos CoinBitClub...\n');

    try {
        const catalogService = new ProductCatalogService();
        const stripeService = new StripeProductService();

        // Verificar conexão com Stripe
        console.log('🔍 Verificando conexão com Stripe...');
        try {
            await stripeService.stripe.accounts.retrieve();
            console.log('✅ Conexão com Stripe estabelecida\n');
        } catch (error) {
            console.error('❌ Erro na conexão com Stripe:', error.message);
            process.exit(1);
        }

        // Verificar conexão com banco de dados
        console.log('🔍 Verificando conexão com banco de dados...');
        try {
            await stripeService.db.raw('SELECT 1');
            console.log('✅ Conexão com banco de dados estabelecida\n');
        } catch (error) {
            console.error('❌ Erro na conexão com banco de dados:', error.message);
            process.exit(1);
        }

        // Inicializar catálogo
        console.log('📦 Criando produtos e planos...');
        const result = await catalogService.initializeProductCatalog();

        // Exibir resumo
        console.log('\n📊 RESUMO DA INICIALIZAÇÃO:');
        console.log('═══════════════════════════════════════════════');
        
        console.log(`\n🔔 PLANOS DE ASSINATURA: ${result.data.subscription_products.length}`);
        result.data.subscription_products.forEach((product, index) => {
            console.log(`  ${index + 1}. ${product.product.name}`);
            console.log(`     Preços: ${product.prices.length} opções`);
            console.log(`     Categoria: ${product.product.metadata?.category || 'N/A'}`);
        });

        console.log(`\n💰 PRODUTOS DE RECARGA: ${result.data.prepaid_products.length}`);
        result.data.prepaid_products.forEach((product, index) => {
            const metadata = product.product.metadata ? JSON.parse(product.product.metadata) : {};
            console.log(`  ${index + 1}. ${product.product.name}`);
            console.log(`     Valor: ${metadata.currency} ${metadata.balance_amount}`);
            console.log(`     Bônus: ${metadata.bonus_percentage}%`);
        });

        console.log(`\n🎟️  CÓDIGOS PROMOCIONAIS: ${result.data.promotional_codes.length}`);
        result.data.promotional_codes.forEach((promo, index) => {
            console.log(`  ${index + 1}. ${promo.database_record.code}`);
            console.log(`     Desconto: ${promo.database_record.percent_off}%`);
            console.log(`     Duração: ${promo.database_record.duration}`);
            console.log(`     Máximo uso: ${promo.database_record.max_redemptions}`);
        });

        console.log('\n🔗 LINKS ÚTEIS:');
        console.log('═══════════════════════════════════════════════');
        console.log('📄 Página de checkout: http://localhost:3000/checkout.html');
        console.log('🎛️  Dashboard admin: http://localhost:3000/admin-dashboard.html');
        console.log('🔗 API catálogo público: http://localhost:3000/api/catalog/public');
        console.log('🔗 API produtos: http://localhost:3000/api/catalog/products');

        console.log('\n📋 PRÓXIMOS PASSOS:');
        console.log('═══════════════════════════════════════════════');
        console.log('1. Configure os webhooks do Stripe:');
        console.log('   • URL: http://your-domain.com/api/stripe/webhook');
        console.log('   • Eventos: checkout.session.completed, invoice.payment_succeeded');
        console.log('');
        console.log('2. Configure as variáveis de ambiente:');
        console.log('   • STRIPE_PUBLISHABLE_KEY (para frontend)');
        console.log('   • STRIPE_SECRET_KEY (para backend)');
        console.log('   • STRIPE_WEBHOOK_SECRET (para verificação de webhooks)');
        console.log('');
        console.log('3. Teste o sistema:');
        console.log('   • Acesse a página de checkout');
        console.log('   • Faça uma compra de teste');
        console.log('   • Verifique os webhooks');
        console.log('');
        console.log('4. Configure o domínio de produção nos success_url e cancel_url');

        console.log('\n✅ Inicialização do catálogo concluída com sucesso!');
        console.log('🎉 O sistema está pronto para usar!\n');

        // Testar alguns endpoints
        await testEndpoints(catalogService);

    } catch (error) {
        console.error('\n❌ Erro durante a inicialização:', error);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

async function testEndpoints(catalogService) {
    console.log('🧪 Executando testes básicos...\n');

    try {
        // Teste 1: Buscar catálogo público
        console.log('1. Testando busca do catálogo público...');
        const catalog = await catalogService.getProductCatalog();
        console.log(`   ✅ ${catalog.subscription_plans.length} planos e ${catalog.prepaid_options.length} opções de recarga encontrados`);

        // Teste 2: Sincronizar com Stripe
        console.log('2. Testando sincronização com Stripe...');
        const syncResult = await catalogService.syncWithStripe();
        console.log(`   ✅ Sincronização: ${syncResult.updated} atualizados, ${syncResult.created} criados`);

        console.log('\n✅ Todos os testes passaram!\n');
    } catch (error) {
        console.error('❌ Erro nos testes:', error.message);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    initializeCatalog()
        .then(() => {
            process.exit(0);
        })
        .catch((error) => {
            console.error('Erro fatal:', error);
            process.exit(1);
        });
}

module.exports = { initializeCatalog };
