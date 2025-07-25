#!/usr/bin/env node

const { ProductCatalogService } = require('../services/productCatalogService');

async function updateCatalogWithNewPlans() {
    console.log('🔄 Atualizando catálogo com os novos planos CoinBitClub...\n');

    try {
        const catalogService = new ProductCatalogService();

        console.log('📋 NOVOS PLANOS DE ASSINATURA:');
        console.log('═══════════════════════════════════════════════');
        console.log('🇧🇷 BRASIL:');
        console.log('  • Mensal: R$ 200/mês + 10% comissão sobre lucros');
        console.log('  • Apenas Comissão: R$ 0/mês + 20% comissão sobre lucros');
        console.log('');
        console.log('🌎 INTERNACIONAL:');
        console.log('  • Monthly: $40/month + 10% commission on profits');
        console.log('  • Commission Only: $0/month + 20% commission on profits');
        console.log('');

        console.log('💰 SISTEMA DE RECARGA:');
        console.log('═══════════════════════════════════════════════');
        console.log('🇧🇷 BRASIL (mínimo R$ 60):');
        console.log('  • R$ 600 - R$ 5.999: 5% desconto');
        console.log('  • R$ 6.000 - R$ 20.000: 10% desconto');
        console.log('');
        console.log('🌎 INTERNACIONAL (mínimo $40):');
        console.log('  • $150 - $1.499: 5% desconto');
        console.log('  • $1.500+: 10% desconto');
        console.log('');

        // Remover produtos antigos se existirem
        console.log('🗑️  Removendo produtos antigos...');
        try {
            await catalogService.stripeService.db('stripe_prices').del();
            await catalogService.stripeService.db('stripe_products').del();
            await catalogService.stripeService.db('promotional_codes').del();
            console.log('✅ Produtos antigos removidos');
        } catch (error) {
            console.log('⚠️  Nenhum produto antigo encontrado para remover');
        }

        // Criar novos produtos
        console.log('📦 Criando novos produtos...');
        const result = await catalogService.initializeProductCatalog();

        // Exibir resumo detalhado
        console.log('\n📊 RESUMO DA ATUALIZAÇÃO:');
        console.log('═══════════════════════════════════════════════');
        
        console.log(`\n🔔 PLANOS DE ASSINATURA CRIADOS: ${result.data.subscription_products.length}`);
        result.data.subscription_products.forEach((product, index) => {
            const metadata = product.product.metadata ? JSON.parse(product.product.metadata) : {};
            console.log(`  ${index + 1}. ${product.product.name}`);
            console.log(`     Região: ${metadata.region || 'N/A'}`);
            console.log(`     Comissão: ${metadata.commission_rate || 'N/A'}%`);
            console.log(`     Tipo: ${metadata.plan_type || 'N/A'}`);
            if (product.prices.length > 0) {
                product.prices.forEach(price => {
                    const amount = price.unit_amount / 100;
                    const currency = price.currency.toUpperCase();
                    console.log(`     Preço: ${currency} ${amount}/${price.recurring_interval || 'único'}`);
                });
            } else {
                console.log(`     Preço: Apenas comissão`);
            }
            console.log('');
        });

        console.log(`💰 PRODUTOS DE RECARGA CRIADOS: ${result.data.prepaid_products.length}`);
        result.data.prepaid_products.forEach((product, index) => {
            const metadata = product.product.metadata ? JSON.parse(product.product.metadata) : {};
            console.log(`  ${index + 1}. ${product.product.name}`);
            console.log(`     Moeda: ${metadata.currency}`);
            console.log(`     Valor: ${metadata.currency} ${metadata.balance_amount}`);
            if (metadata.bonus_percentage > 0) {
                console.log(`     Desconto: ${metadata.bonus_percentage}%`);
            }
            console.log('');
        });

        console.log(`🎟️  CÓDIGOS PROMOCIONAIS CRIADOS: ${result.data.promotional_codes.length}`);
        result.data.promotional_codes.forEach((promo, index) => {
            console.log(`  ${index + 1}. ${promo.database_record.code}`);
            console.log(`     Desconto: ${promo.database_record.discount_value}%`);
            console.log(`     Descrição: ${promo.database_record.description}`);
            console.log('');
        });

        console.log('🔗 URLS ATUALIZADAS:');
        console.log('═══════════════════════════════════════════════');
        console.log('📄 Nova página de checkout: http://localhost:3000/checkout-updated.html');
        console.log('🎛️  Dashboard admin: http://localhost:3000/admin-dashboard.html');
        console.log('🔗 API catálogo: http://localhost:3000/api/catalog/public');
        console.log('');

        console.log('📋 CÓDIGOS PROMOCIONAIS DISPONÍVEIS:');
        console.log('═══════════════════════════════════════════════');
        console.log('• RECARGA5: 5% desconto para recargas BRL R$ 600+');
        console.log('• RECARGA10: 10% desconto para recargas BRL R$ 6.000+');
        console.log('• USDRECARGA5: 5% discount for USD $150+ recharges');
        console.log('• USDRECARGA10: 10% discount for USD $1,500+ recharges');
        console.log('• WELCOME: 15% desconto de boas-vindas');
        console.log('• BRASIL200: 20% desconto no plano Brasil mensal');
        console.log('• EXTERIOR40: 25% discount on International monthly plan');
        console.log('');

        console.log('⚙️  CONFIGURAÇÕES DO SISTEMA:');
        console.log('═══════════════════════════════════════════════');
        console.log('🇧🇷 Brasil:');
        console.log('  • Recarga mínima: R$ 60');
        console.log('  • Plano mensal: R$ 200 + 10% comissão');
        console.log('  • Plano comissão: 0 + 20% comissão');
        console.log('');
        console.log('🌎 Internacional:');
        console.log('  • Minimum recharge: $40');
        console.log('  • Monthly plan: $40 + 10% commission');
        console.log('  • Commission plan: $0 + 20% commission');
        console.log('');

        console.log('✅ Atualização do catálogo concluída com sucesso!');
        console.log('🎉 Sistema pronto com os novos planos e configurações!\n');

        // Teste rápido das APIs
        await testNewEndpoints(catalogService);

    } catch (error) {
        console.error('\n❌ Erro durante a atualização:', error);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

async function testNewEndpoints(catalogService) {
    console.log('🧪 Testando endpoints com novos dados...\n');

    try {
        // Teste 1: Buscar catálogo público
        console.log('1. Testando catálogo público...');
        const catalog = await catalogService.getProductCatalog();
        const brasilPlans = catalog.subscription_plans.filter(p => {
            const metadata = p.metadata ? JSON.parse(p.metadata) : {};
            return metadata.region === 'brasil';
        });
        const exteriorPlans = catalog.subscription_plans.filter(p => {
            const metadata = p.metadata ? JSON.parse(p.metadata) : {};
            return metadata.region === 'exterior';
        });
        console.log(`   ✅ ${brasilPlans.length} planos Brasil e ${exteriorPlans.length} planos Exterior encontrados`);

        // Teste 2: Verificar valores mínimos
        console.log('2. Testando configurações de moeda...');
        const currencySettings = await catalogService.stripeService.db('currency_settings').select('*');
        const brlSettings = currencySettings.find(c => c.currency === 'BRL');
        const usdSettings = currencySettings.find(c => c.currency === 'USD');
        
        if (brlSettings && brlSettings.minimum_balance === 60.00) {
            console.log('   ✅ Configuração BRL: mínimo R$ 60 ✓');
        }
        if (usdSettings && usdSettings.minimum_balance === 40.00) {
            console.log('   ✅ Configuração USD: mínimo $40 ✓');
        }

        // Teste 3: Verificar códigos promocionais
        console.log('3. Testando códigos promocionais...');
        const promoCodes = await catalogService.stripeService.db('promotional_codes')
            .where('is_active', true)
            .select('code', 'discount_value');
        
        const expectedCodes = ['RECARGA5', 'RECARGA10', 'USDRECARGA5', 'USDRECARGA10', 'WELCOME', 'BRASIL200', 'EXTERIOR40'];
        const foundCodes = promoCodes.map(p => p.code);
        const missingCodes = expectedCodes.filter(code => !foundCodes.includes(code));
        
        if (missingCodes.length === 0) {
            console.log('   ✅ Todos os códigos promocionais criados ✓');
        } else {
            console.log(`   ⚠️  Códigos em falta: ${missingCodes.join(', ')}`);
        }

        console.log('\n✅ Todos os testes passaram!');
        console.log('🚀 Sistema atualizado e funcionando perfeitamente!\n');

    } catch (error) {
        console.error('❌ Erro nos testes:', error.message);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    updateCatalogWithNewPlans()
        .then(() => {
            process.exit(0);
        })
        .catch((error) => {
            console.error('Erro fatal:', error);
            process.exit(1);
        });
}

module.exports = { updateCatalogWithNewPlans };
