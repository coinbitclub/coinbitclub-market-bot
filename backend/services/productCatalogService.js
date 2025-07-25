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
                name: 'CoinBitClub Brasil - Mensal + 10% Comissão',
                description: 'Plano mensal para traders brasileiros com 10% de comissão sobre lucros',
                features: [
                    'Trading automatizado completo',
                    'Sinais de trading profissionais',
                    'IA avançada para análise de mercado',
                    'Suporte prioritário',
                    'Dashboard completo',
                    'Comissão de 10% sobre lucros',
                    'Relatórios detalhados'
                ],
                prices: [
                    { amount: 20000, currency: 'BRL', interval: 'month' } // R$ 200,00
                ],
                metadata: {
                    type: 'subscription',
                    category: 'brasil_mensal',
                    commission_rate: '10',
                    region: 'brasil',
                    plan_type: 'monthly_commission'
                }
            },
            {
                name: 'CoinBitClub Brasil - 20% Comissão',
                description: 'Plano brasileiro apenas com comissão de 20% sobre lucros, sem mensalidade',
                features: [
                    'Trading automatizado completo',
                    'Sinais de trading profissionais',
                    'IA avançada para análise de mercado',
                    'Suporte prioritário',
                    'Dashboard completo',
                    'Comissão de 20% sobre lucros',
                    'Sem mensalidade',
                    'Relatórios detalhados'
                ],
                prices: [], // Sem preço recorrente, apenas comissão
                metadata: {
                    type: 'subscription',
                    category: 'brasil_comissao',
                    commission_rate: '20',
                    region: 'brasil',
                    plan_type: 'commission_only',
                    monthly_fee: '0'
                }
            },
            {
                name: 'CoinBitClub Exterior - Mensal + 10% Comissão',
                description: 'Plano mensal para traders internacionais com 10% de comissão sobre lucros',
                features: [
                    'Complete automated trading',
                    'Professional trading signals',
                    'Advanced AI market analysis',
                    'Priority support',
                    'Complete dashboard',
                    '10% commission on profits',
                    'Detailed reports'
                ],
                prices: [
                    { amount: 4000, currency: 'USD', interval: 'month' } // USD 40,00
                ],
                metadata: {
                    type: 'subscription',
                    category: 'exterior_mensal',
                    commission_rate: '10',
                    region: 'exterior',
                    plan_type: 'monthly_commission'
                }
            },
            {
                name: 'CoinBitClub Exterior - 20% Comissão',
                description: 'Plano internacional apenas com comissão de 20% sobre lucros, sem mensalidade',
                features: [
                    'Complete automated trading',
                    'Professional trading signals',
                    'Advanced AI market analysis',
                    'Priority support',
                    'Complete dashboard',
                    '20% commission on profits',
                    'No monthly fee',
                    'Detailed reports'
                ],
                prices: [], // Sem preço recorrente, apenas comissão
                metadata: {
                    type: 'subscription',
                    category: 'exterior_comissao',
                    commission_rate: '20',
                    region: 'exterior',
                    plan_type: 'commission_only',
                    monthly_fee: '0'
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
                
                // Apenas criar preços se o plano tiver mensalidade
                if (plan.prices && plan.prices.length > 0) {
                    for (const priceData of plan.prices) {
                        const price = await this.stripeService.createPrice({
                            product_id: product.stripe_id,
                            unit_amount: priceData.amount, // Já em centavos
                            currency: priceData.currency.toLowerCase(),
                            recurring: {
                                interval: priceData.interval
                            }
                        });
                        prices.push(price);
                    }
                } else {
                    // Para planos só com comissão, criar um "produto" sem preço recorrente
                    console.log(`Plano ${plan.name} criado sem mensalidade (apenas comissão)`);
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
                name: 'Recarga Personalizada Brasil',
                description: 'Recarga de qualquer valor a partir de R$ 60',
                amount: 6000, // R$ 60.00 mínimo
                currency: 'BRL',
                bonus_percentage: 0,
                is_custom: true
            },
            {
                name: 'Recarga Personalizada Exterior',
                description: 'Recarga de qualquer valor a partir de USD 40',
                amount: 4000, // USD 40.00 mínimo
                currency: 'USD',
                bonus_percentage: 0,
                is_custom: true
            },
            // Opções pré-definidas para facilitar
            {
                name: 'Recarga R$ 100',
                description: 'Adicione R$ 100 ao seu saldo para operações',
                amount: 10000,
                currency: 'BRL',
                bonus_percentage: 0
            },
            {
                name: 'Recarga R$ 300',
                description: 'Adicione R$ 300 ao seu saldo para operações',
                amount: 30000,
                currency: 'BRL',
                bonus_percentage: 0
            },
            {
                name: 'Recarga R$ 600 - 5% Desconto',
                description: 'Adicione R$ 600 ao seu saldo + 5% de desconto promocional',
                amount: 60000,
                currency: 'BRL',
                bonus_percentage: 5
            },
            {
                name: 'Recarga R$ 1.000 - 5% Desconto',
                description: 'Adicione R$ 1.000 ao seu saldo + 5% de desconto promocional',
                amount: 100000,
                currency: 'BRL',
                bonus_percentage: 5
            },
            {
                name: 'Recarga R$ 3.000 - 5% Desconto',
                description: 'Adicione R$ 3.000 ao seu saldo + 5% de desconto promocional',
                amount: 300000,
                currency: 'BRL',
                bonus_percentage: 5
            },
            {
                name: 'Recarga R$ 6.000 - 10% Desconto',
                description: 'Adicione R$ 6.000 ao seu saldo + 10% de desconto promocional',
                amount: 600000,
                currency: 'BRL',
                bonus_percentage: 10
            },
            {
                name: 'Recarga R$ 10.000 - 10% Desconto',
                description: 'Adicione R$ 10.000 ao seu saldo + 10% de desconto promocional',
                amount: 1000000,
                currency: 'BRL',
                bonus_percentage: 10
            },
            {
                name: 'Recarga R$ 20.000 - 10% Desconto',
                description: 'Adicione R$ 20.000 ao seu saldo + 10% de desconto promocional',
                amount: 2000000,
                currency: 'BRL',
                bonus_percentage: 10
            },
            // Opções em USD
            {
                name: 'Recarga USD $50',
                description: 'Add $50 to your balance for operations',
                amount: 5000,
                currency: 'USD',
                bonus_percentage: 0
            },
            {
                name: 'Recarga USD $100',
                description: 'Add $100 to your balance for operations',
                amount: 10000,
                currency: 'USD',
                bonus_percentage: 0
            },
            {
                name: 'Recarga USD $150 - 5% Desconto',
                description: 'Add $150 to your balance + 5% promotional discount',
                amount: 15000,
                currency: 'USD',
                bonus_percentage: 5
            },
            {
                name: 'Recarga USD $300 - 5% Desconto',
                description: 'Add $300 to your balance + 5% promotional discount',
                amount: 30000,
                currency: 'USD',
                bonus_percentage: 5
            },
            {
                name: 'Recarga USD $1.500 - 10% Desconto',
                description: 'Add $1,500 to your balance + 10% promotional discount',
                amount: 150000,
                currency: 'USD',
                bonus_percentage: 10
            },
            {
                name: 'Recarga USD $5.000 - 10% Desconto',
                description: 'Add $5,000 to your balance + 10% promotional discount',
                amount: 500000,
                currency: 'USD',
                bonus_percentage: 10
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
                        balance_amount: (option.amount / 100).toString(),
                        is_custom: option.is_custom ? 'true' : 'false',
                        minimum_amount: option.is_custom ? (option.amount / 100).toString() : null
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
                code: 'RECARGA5',
                percent_off: 5,
                duration: 'once',
                max_redemptions: 1000,
                restrictions: {
                    minimum_amount: 60000 // R$ 600.00 mínimo
                },
                description: '5% desconto para recargas de R$ 600 a R$ 5.999'
            },
            {
                code: 'RECARGA10',
                percent_off: 10,
                duration: 'once',
                max_redemptions: 500,
                restrictions: {
                    minimum_amount: 600000 // R$ 6.000.00 mínimo
                },
                description: '10% desconto para recargas de R$ 6.000 a R$ 20.000'
            },
            {
                code: 'USDRECARGA5',
                percent_off: 5,
                duration: 'once',
                max_redemptions: 500,
                restrictions: {
                    minimum_amount: 15000, // USD 150.00 mínimo
                    currency: 'usd'
                },
                description: '5% discount for recharges from $150 to $1,499'
            },
            {
                code: 'USDRECARGA10',
                percent_off: 10,
                duration: 'once',
                max_redemptions: 200,
                restrictions: {
                    minimum_amount: 150000, // USD 1,500.00 mínimo
                    currency: 'usd'
                },
                description: '10% discount for recharges from $1,500 to $5,000+'
            },
            {
                code: 'WELCOME',
                percent_off: 15,
                duration: 'once',
                max_redemptions: 1000,
                restrictions: {
                    first_time_transaction: true
                },
                description: 'Desconto de boas-vindas para novos usuários'
            },
            {
                code: 'BRASIL200',
                percent_off: 20,
                duration: 'once',
                max_redemptions: 300,
                restrictions: {
                    applies_to: 'brasil_mensal'
                },
                description: '20% desconto no primeiro mês do plano Brasil'
            },
            {
                code: 'EXTERIOR40',
                percent_off: 25,
                duration: 'once',
                max_redemptions: 200,
                restrictions: {
                    applies_to: 'exterior_mensal'
                },
                description: '25% discount on first month of International plan'
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
                    discount_type: 'percentage',
                    discount_value: promoData.percent_off,
                    currency: null,
                    max_redemptions: promoData.max_redemptions,
                    times_redeemed: 0,
                    restrictions: JSON.stringify(promoData.restrictions || {}),
                    is_active: true,
                    description: promoData.description,
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
