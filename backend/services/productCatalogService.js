const { StripeProductService } = require('../services/stripeProductService');

class ProductCatalogService {
    constructor() {
        this.stripeService = new StripeProductService();
    }

    async initializeProductCatalog() {
        try {
            console.log('Inicializando catálogo de produtos...');

            // 1. Planos de Assinatura
            const subscriptionProducts = await this.createSubscriptionPlans();
            console.log('Planos de assinatura criados:', subscriptionProducts.length);

            // 2. Produtos de Recarga
            const prepaidProducts = await this.createPrepaidProducts();
            console.log('Produtos de recarga criados:', prepaidProducts.length);

            // 3. Códigos promocionais
            const promoCodes = await this.createPromotionalCodes();
            console.log('Códigos promocionais criados:', promoCodes.length);

            return {
                success: true,
                data: {
                    subscription_products: subscriptionProducts,
                    prepaid_products: prepaidProducts,
                    promotional_codes: promoCodes
                }
            };
        } catch (error) {
            console.error('Erro ao inicializar catálogo:', error);
            throw error;
        }
    }

    async createSubscriptionPlans() {
        const plans = [
            {
                name: 'CoinBitClub Básico',
                description: 'Plano básico para iniciantes no trading automatizado',
                features: [
                    'Sinais de trading básicos',
                    'Análise técnica automatizada',
                    'Suporte por email',
                    'Dashboard básico'
                ],
                prices: [
                    { amount: 2999, currency: 'BRL', interval: 'month' },
                    { amount: 29999, currency: 'BRL', interval: 'year' }
                ],
                metadata: {
                    type: 'subscription',
                    category: 'basic',
                    max_operations_per_day: '10',
                    max_balance: '1000'
                }
            },
            {
                name: 'CoinBitClub Profissional',
                description: 'Plano profissional com recursos avançados',
                features: [
                    'Sinais de trading avançados',
                    'IA para análise de mercado',
                    'Suporte prioritário',
                    'Dashboard avançado',
                    'Relatórios detalhados',
                    'API Access'
                ],
                prices: [
                    { amount: 9999, currency: 'BRL', interval: 'month' },
                    { amount: 99999, currency: 'BRL', interval: 'year' },
                    { amount: 49, currency: 'USD', interval: 'month' },
                    { amount: 499, currency: 'USD', interval: 'year' }
                ],
                metadata: {
                    type: 'subscription',
                    category: 'professional',
                    max_operations_per_day: '50',
                    max_balance: '10000'
                }
            },
            {
                name: 'CoinBitClub Premium',
                description: 'Plano premium para traders experientes',
                features: [
                    'Todos os recursos profissionais',
                    'IA avançada com aprendizado de máquina',
                    'Suporte 24/7',
                    'Dashboard personalizado',
                    'Análise de risco avançada',
                    'Trading automatizado completo',
                    'Consultoria personalizada'
                ],
                prices: [
                    { amount: 19999, currency: 'BRL', interval: 'month' },
                    { amount: 199999, currency: 'BRL', interval: 'year' },
                    { amount: 99, currency: 'USD', interval: 'month' },
                    { amount: 999, currency: 'USD', interval: 'year' }
                ],
                metadata: {
                    type: 'subscription',
                    category: 'premium',
                    max_operations_per_day: 'unlimited',
                    max_balance: 'unlimited'
                }
            },
            {
                name: 'CoinBitClub Enterprise',
                description: 'Solução corporativa para instituições',
                features: [
                    'Todos os recursos premium',
                    'API personalizada',
                    'Integração com sistemas externos',
                    'Suporte dedicado',
                    'SLA garantido',
                    'Relatórios customizados',
                    'Análise de compliance',
                    'Multi-usuários'
                ],
                prices: [
                    { amount: 49999, currency: 'BRL', interval: 'month' },
                    { amount: 499999, currency: 'BRL', interval: 'year' },
                    { amount: 249, currency: 'USD', interval: 'month' },
                    { amount: 2499, currency: 'USD', interval: 'year' }
                ],
                metadata: {
                    type: 'subscription',
                    category: 'enterprise',
                    max_operations_per_day: 'unlimited',
                    max_balance: 'unlimited',
                    max_users: '50'
                }
            }
        ];

        const createdProducts = [];

        for (const plan of plans) {
            try {
                const product = await this.stripeService.createProduct({
                    name: plan.name,
                    description: plan.description,
                    metadata: plan.metadata,
                    images: [`https://coinbitclub.com/images/plans/${plan.metadata.category}.jpg`]
                });

                const prices = [];
                for (const priceData of plan.prices) {
                    const price = await this.stripeService.createPrice({
                        product_id: product.stripe_id,
                        unit_amount: priceData.amount * 100, // Stripe usa centavos
                        currency: priceData.currency.toLowerCase(),
                        recurring: {
                            interval: priceData.interval
                        }
                    });
                    prices.push(price);
                }

                createdProducts.push({
                    product,
                    prices,
                    features: plan.features
                });
            } catch (error) {
                console.error(`Erro ao criar produto ${plan.name}:`, error);
            }
        }

        return createdProducts;
    }

    async createPrepaidProducts() {
        const prepaidOptions = [
            {
                name: 'Recarga R$ 50',
                description: 'Adicione R$ 50 ao seu saldo para operações',
                amount: 5000, // R$ 50.00
                currency: 'BRL',
                bonus_percentage: 0
            },
            {
                name: 'Recarga R$ 100',
                description: 'Adicione R$ 100 ao seu saldo para operações',
                amount: 10000, // R$ 100.00
                currency: 'BRL',
                bonus_percentage: 5
            },
            {
                name: 'Recarga R$ 250',
                description: 'Adicione R$ 250 ao seu saldo para operações + 10% bônus',
                amount: 25000, // R$ 250.00
                currency: 'BRL',
                bonus_percentage: 10
            },
            {
                name: 'Recarga R$ 500',
                description: 'Adicione R$ 500 ao seu saldo para operações + 15% bônus',
                amount: 50000, // R$ 500.00
                currency: 'BRL',
                bonus_percentage: 15
            },
            {
                name: 'Recarga R$ 1.000',
                description: 'Adicione R$ 1.000 ao seu saldo para operações + 20% bônus',
                amount: 100000, // R$ 1.000.00
                currency: 'BRL',
                bonus_percentage: 20
            },
            {
                name: 'Recarga USD $25',
                description: 'Add $25 to your balance for operations',
                amount: 2500, // $25.00
                currency: 'USD',
                bonus_percentage: 0
            },
            {
                name: 'Recarga USD $50',
                description: 'Add $50 to your balance for operations + 5% bonus',
                amount: 5000, // $50.00
                currency: 'USD',
                bonus_percentage: 5
            },
            {
                name: 'Recarga USD $100',
                description: 'Add $100 to your balance for operations + 10% bonus',
                amount: 10000, // $100.00
                currency: 'USD',
                bonus_percentage: 10
            },
            {
                name: 'Recarga USD $250',
                description: 'Add $250 to your balance for operations + 15% bonus',
                amount: 25000, // $250.00
                currency: 'USD',
                bonus_percentage: 15
            },
            {
                name: 'Recarga USD $500',
                description: 'Add $500 to your balance for operations + 20% bonus',
                amount: 50000, // $500.00
                currency: 'USD',
                bonus_percentage: 20
            }
        ];

        const createdProducts = [];

        for (const option of prepaidOptions) {
            try {
                const product = await this.stripeService.createProduct({
                    name: option.name,
                    description: option.description,
                    metadata: {
                        type: 'prepaid',
                        currency: option.currency,
                        bonus_percentage: option.bonus_percentage.toString(),
                        balance_amount: (option.amount / 100).toString()
                    },
                    images: [`https://coinbitclub.com/images/prepaid/${option.currency.toLowerCase()}.jpg`]
                });

                const price = await this.stripeService.createPrice({
                    product_id: product.stripe_id,
                    unit_amount: option.amount,
                    currency: option.currency.toLowerCase()
                });

                createdProducts.push({
                    product,
                    price,
                    bonus_percentage: option.bonus_percentage
                });
            } catch (error) {
                console.error(`Erro ao criar produto de recarga ${option.name}:`, error);
            }
        }

        return createdProducts;
    }

    async createPromotionalCodes() {
        const promoCodes = [
            {
                code: 'WELCOME20',
                percent_off: 20,
                duration: 'once',
                max_redemptions: 1000,
                restrictions: {
                    first_time_transaction: true
                }
            },
            {
                code: 'MONTHLY10',
                percent_off: 10,
                duration: 'repeating',
                duration_in_months: 3,
                max_redemptions: 500
            },
            {
                code: 'PREMIUM50',
                percent_off: 50,
                duration: 'once',
                max_redemptions: 100,
                restrictions: {
                    minimum_amount: 10000 // R$ 100.00
                }
            },
            {
                code: 'ANNUAL25',
                percent_off: 25,
                duration: 'once',
                max_redemptions: 200,
                restrictions: {
                    applies_to: 'annual_plans'
                }
            },
            {
                code: 'ENTERPRISE15',
                percent_off: 15,
                duration: 'forever',
                max_redemptions: 50,
                restrictions: {
                    applies_to: 'enterprise_only'
                }
            }
        ];

        const createdCodes = [];

        for (const promoData of promoCodes) {
            try {
                // Primeiro criar o cupom no Stripe
                const stripeCoupon = await this.stripeService.stripe.coupons.create({
                    id: promoData.code,
                    percent_off: promoData.percent_off,
                    duration: promoData.duration,
                    duration_in_months: promoData.duration_in_months,
                    max_redemptions: promoData.max_redemptions,
                    restrictions: promoData.restrictions
                });

                // Depois criar o código promocional
                const stripePromoCode = await this.stripeService.stripe.promotionCodes.create({
                    coupon: stripeCoupon.id,
                    code: promoData.code,
                    active: true,
                    max_redemptions: promoData.max_redemptions
                });

                // Salvar no banco de dados
                const savedCode = await this.stripeService.db('promotional_codes').insert({
                    code: promoData.code,
                    stripe_coupon_id: stripeCoupon.id,
                    stripe_promotion_code_id: stripePromoCode.id,
                    percent_off: promoData.percent_off,
                    duration: promoData.duration,
                    duration_in_months: promoData.duration_in_months || null,
                    max_redemptions: promoData.max_redemptions,
                    restrictions: JSON.stringify(promoData.restrictions || {}),
                    is_active: true,
                    created_at: new Date(),
                    updated_at: new Date()
                }).returning('*');

                createdCodes.push({
                    database_record: savedCode[0],
                    stripe_coupon: stripeCoupon,
                    stripe_promo_code: stripePromoCode
                });
            } catch (error) {
                console.error(`Erro ao criar código promocional ${promoData.code}:`, error);
            }
        }

        return createdCodes;
    }

    async getProductCatalog() {
        try {
            const products = await this.stripeService.db('stripe_products')
                .select('*')
                .where('is_active', true)
                .orderBy('created_at', 'desc');

            const catalog = {
                subscription_plans: [],
                prepaid_options: []
            };

            for (const product of products) {
                const prices = await this.stripeService.db('stripe_prices')
                    .select('*')
                    .where('product_id', product.id)
                    .where('is_active', true);

                const productData = {
                    ...product,
                    prices: prices,
                    metadata: product.metadata ? JSON.parse(product.metadata) : {}
                };

                if (productData.metadata.type === 'subscription') {
                    catalog.subscription_plans.push(productData);
                } else if (productData.metadata.type === 'prepaid') {
                    catalog.prepaid_options.push(productData);
                }
            }

            return catalog;
        } catch (error) {
            console.error('Erro ao buscar catálogo:', error);
            throw error;
        }
    }

    async syncWithStripe() {
        try {
            console.log('Sincronizando produtos com Stripe...');

            // Buscar todos os produtos do Stripe
            const stripeProducts = await this.stripeService.stripe.products.list({
                limit: 100,
                active: true
            });

            const syncResults = {
                updated: 0,
                created: 0,
                errors: []
            };

            for (const stripeProduct of stripeProducts.data) {
                try {
                    // Verificar se já existe no banco
                    const existingProduct = await this.stripeService.db('stripe_products')
                        .where('stripe_id', stripeProduct.id)
                        .first();

                    if (existingProduct) {
                        // Atualizar produto existente
                        await this.stripeService.db('stripe_products')
                            .where('id', existingProduct.id)
                            .update({
                                name: stripeProduct.name,
                                description: stripeProduct.description,
                                metadata: JSON.stringify(stripeProduct.metadata || {}),
                                updated_at: new Date()
                            });
                        syncResults.updated++;
                    } else {
                        // Criar novo produto
                        await this.stripeService.db('stripe_products').insert({
                            stripe_id: stripeProduct.id,
                            name: stripeProduct.name,
                            description: stripeProduct.description,
                            metadata: JSON.stringify(stripeProduct.metadata || {}),
                            is_active: stripeProduct.active,
                            created_at: new Date(),
                            updated_at: new Date()
                        });
                        syncResults.created++;
                    }

                    // Sincronizar preços
                    const stripePrices = await this.stripeService.stripe.prices.list({
                        product: stripeProduct.id,
                        active: true
                    });

                    for (const stripePrice of stripePrices.data) {
                        const existingPrice = await this.stripeService.db('stripe_prices')
                            .where('stripe_id', stripePrice.id)
                            .first();

                        if (!existingPrice) {
                            const product = await this.stripeService.db('stripe_products')
                                .where('stripe_id', stripeProduct.id)
                                .first();

                            await this.stripeService.db('stripe_prices').insert({
                                stripe_id: stripePrice.id,
                                product_id: product.id,
                                unit_amount: stripePrice.unit_amount,
                                currency: stripePrice.currency,
                                type: stripePrice.type,
                                recurring_interval: stripePrice.recurring?.interval || null,
                                recurring_interval_count: stripePrice.recurring?.interval_count || null,
                                is_active: stripePrice.active,
                                created_at: new Date(),
                                updated_at: new Date()
                            });
                        }
                    }
                } catch (error) {
                    console.error(`Erro ao sincronizar produto ${stripeProduct.id}:`, error);
                    syncResults.errors.push({
                        product_id: stripeProduct.id,
                        error: error.message
                    });
                }
            }

            console.log('Sincronização concluída:', syncResults);
            return syncResults;
        } catch (error) {
            console.error('Erro na sincronização:', error);
            throw error;
        }
    }
}

module.exports = { ProductCatalogService };
