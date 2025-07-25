const { ProductCatalogService } = require('../services/productCatalogService');
const { StripeProductService } = require('../services/stripeProductService');

class ProductCatalogController {
    constructor() {
        this.catalogService = new ProductCatalogService();
        this.stripeService = new StripeProductService();
    }

    // Inicializar catálogo completo
    async initializeCatalog(req, res) {
        try {
            const result = await this.catalogService.initializeProductCatalog();
            
            res.json({
                success: true,
                message: 'Catálogo inicializado com sucesso',
                data: result.data
            });
        } catch (error) {
            console.error('Erro ao inicializar catálogo:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: error.message
            });
        }
    }

    // Buscar catálogo público
    async getPublicCatalog(req, res) {
        try {
            const catalog = await this.catalogService.getProductCatalog();
            
            // Remover informações sensíveis para o catálogo público
            const publicCatalog = {
                subscription_plans: catalog.subscription_plans.map(plan => ({
                    id: plan.id,
                    name: plan.name,
                    description: plan.description,
                    features: this.extractFeatures(plan.metadata),
                    prices: plan.prices.map(price => ({
                        id: price.id,
                        amount: price.unit_amount,
                        currency: price.currency.toUpperCase(),
                        interval: price.recurring_interval,
                        formatted_amount: this.formatPrice(price.unit_amount, price.currency)
                    })),
                    category: plan.metadata?.category || 'basic',
                    popular: plan.metadata?.category === 'professional'
                })),
                prepaid_options: catalog.prepaid_options.map(option => ({
                    id: option.id,
                    name: option.name,
                    description: option.description,
                    prices: option.prices.map(price => ({
                        id: price.id,
                        amount: price.unit_amount,
                        currency: price.currency.toUpperCase(),
                        formatted_amount: this.formatPrice(price.unit_amount, price.currency)
                    })),
                    bonus_percentage: parseInt(option.metadata?.bonus_percentage || '0'),
                    balance_amount: parseFloat(option.metadata?.balance_amount || '0')
                }))
            };

            res.json({
                success: true,
                data: publicCatalog
            });
        } catch (error) {
            console.error('Erro ao buscar catálogo público:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Buscar catálogo administrativo (completo)
    async getAdminCatalog(req, res) {
        try {
            const catalog = await this.catalogService.getProductCatalog();
            
            // Adicionar estatísticas de vendas
            for (const plan of catalog.subscription_plans) {
                plan.sales_stats = await this.getSalesStats(plan.id, 'subscription');
            }
            
            for (const option of catalog.prepaid_options) {
                option.sales_stats = await this.getSalesStats(option.id, 'prepaid');
            }

            res.json({
                success: true,
                data: catalog
            });
        } catch (error) {
            console.error('Erro ao buscar catálogo admin:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Sincronizar com Stripe
    async syncWithStripe(req, res) {
        try {
            const result = await this.catalogService.syncWithStripe();
            
            res.json({
                success: true,
                message: 'Sincronização concluída',
                data: result
            });
        } catch (error) {
            console.error('Erro na sincronização:', error);
            res.status(500).json({
                success: false,
                message: 'Erro na sincronização',
                error: error.message
            });
        }
    }

    // Criar checkout para produto específico
    async createProductCheckout(req, res) {
        try {
            const { product_id, price_id, success_url, cancel_url, customer_email, promo_code } = req.body;

            if (!product_id || !price_id) {
                return res.status(400).json({
                    success: false,
                    message: 'product_id e price_id são obrigatórios'
                });
            }

            // Buscar produto e preço
            const product = await this.stripeService.db('stripe_products')
                .where('id', product_id)
                .first();

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Produto não encontrado'
                });
            }

            const price = await this.stripeService.db('stripe_prices')
                .where('id', price_id)
                .where('product_id', product_id)
                .first();

            if (!price) {
                return res.status(404).json({
                    success: false,
                    message: 'Preço não encontrado'
                });
            }

            // Criar sessão de checkout
            const sessionData = {
                price_id: price.stripe_id,
                success_url: success_url || `${req.protocol}://${req.get('host')}/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: cancel_url || `${req.protocol}://${req.get('host')}/checkout`,
                customer_email,
                metadata: {
                    product_type: product.metadata?.type || 'unknown',
                    product_category: product.metadata?.category || 'unknown'
                }
            };

            // Aplicar código promocional se fornecido
            if (promo_code) {
                const promoRecord = await this.stripeService.db('promotional_codes')
                    .where('code', promo_code.toUpperCase())
                    .where('is_active', true)
                    .first();

                if (promoRecord) {
                    sessionData.discounts = [{
                        promotion_code: promoRecord.stripe_promotion_code_id
                    }];
                }
            }

            const session = await this.stripeService.createCheckoutSession(sessionData);

            res.json({
                success: true,
                data: {
                    checkout_url: session.checkout_url,
                    session_id: session.session_id
                }
            });
        } catch (error) {
            console.error('Erro ao criar checkout:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: error.message
            });
        }
    }

    // Validar código promocional
    async validatePromoCode(req, res) {
        try {
            const { code, product_id } = req.query;

            if (!code) {
                return res.status(400).json({
                    success: false,
                    message: 'Código promocional é obrigatório'
                });
            }

            const promoRecord = await this.stripeService.db('promotional_codes')
                .where('code', code.toUpperCase())
                .where('is_active', true)
                .first();

            if (!promoRecord) {
                return res.status(404).json({
                    success: false,
                    message: 'Código promocional inválido ou expirado'
                });
            }

            // Verificar restrições
            const restrictions = promoRecord.restrictions ? JSON.parse(promoRecord.restrictions) : {};
            
            let isValid = true;
            let validationErrors = [];

            // Verificar se aplica ao produto específico
            if (product_id && restrictions.applies_to) {
                const product = await this.stripeService.db('stripe_products')
                    .where('id', product_id)
                    .first();

                if (product) {
                    const metadata = product.metadata ? JSON.parse(product.metadata) : {};
                    
                    if (restrictions.applies_to === 'annual_plans' && 
                        (!metadata.category || !metadata.category.includes('annual'))) {
                        isValid = false;
                        validationErrors.push('Este código só se aplica a planos anuais');
                    }
                    
                    if (restrictions.applies_to === 'enterprise_only' && 
                        metadata.category !== 'enterprise') {
                        isValid = false;
                        validationErrors.push('Este código só se aplica ao plano Enterprise');
                    }
                }
            }

            // Verificar uso máximo
            if (promoRecord.current_redemptions >= promoRecord.max_redemptions) {
                isValid = false;
                validationErrors.push('Código promocional esgotado');
            }

            res.json({
                success: true,
                data: {
                    is_valid: isValid,
                    code: promoRecord.code,
                    percent_off: promoRecord.percent_off,
                    duration: promoRecord.duration,
                    validation_errors: validationErrors,
                    expires_at: promoRecord.expires_at
                }
            });
        } catch (error) {
            console.error('Erro ao validar código promocional:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Buscar produtos por categoria
    async getProductsByCategory(req, res) {
        try {
            const { category, type } = req.query;

            let query = this.stripeService.db('stripe_products')
                .select('*')
                .where('is_active', true);

            if (type) {
                query = query.whereRaw("JSON_EXTRACT(metadata, '$.type') = ?", [type]);
            }

            if (category) {
                query = query.whereRaw("JSON_EXTRACT(metadata, '$.category') = ?", [category]);
            }

            const products = await query.orderBy('created_at', 'desc');

            // Buscar preços para cada produto
            for (const product of products) {
                product.prices = await this.stripeService.db('stripe_prices')
                    .select('*')
                    .where('product_id', product.id)
                    .where('is_active', true)
                    .orderBy('unit_amount', 'asc');
                
                product.metadata = product.metadata ? JSON.parse(product.metadata) : {};
            }

            res.json({
                success: true,
                data: products
            });
        } catch (error) {
            console.error('Erro ao buscar produtos por categoria:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    // Métodos auxiliares
    extractFeatures(metadata) {
        if (!metadata) return [];
        
        const features = metadata.features;
        if (typeof features === 'string') {
            try {
                return JSON.parse(features);
            } catch (e) {
                return features.split(',').map(f => f.trim());
            }
        }
        
        return features || [];
    }

    formatPrice(amount, currency) {
        const symbols = {
            'brl': 'R$',
            'usd': '$',
            'eur': '€'
        };
        
        const symbol = symbols[currency.toLowerCase()] || currency.toUpperCase();
        const value = (amount / 100).toFixed(2);
        
        return `${symbol} ${value}`;
    }

    async getSalesStats(productId, type) {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // Esta é uma implementação básica
            // Você pode expandir para incluir mais estatísticas
            const stats = await this.stripeService.db('checkout_sessions')
                .where('product_id', productId)
                .where('status', 'completed')
                .where('created_at', '>=', thirtyDaysAgo)
                .count('* as total_sales')
                .sum('amount_total as total_revenue')
                .first();

            return {
                total_sales_30d: parseInt(stats.total_sales || 0),
                total_revenue_30d: parseFloat(stats.total_revenue || 0),
                conversion_rate: 0, // Implementar lógica de conversão
                avg_order_value: stats.total_sales > 0 ? 
                    (stats.total_revenue / stats.total_sales) : 0
            };
        } catch (error) {
            console.error('Erro ao buscar estatísticas de vendas:', error);
            return {
                total_sales_30d: 0,
                total_revenue_30d: 0,
                conversion_rate: 0,
                avg_order_value: 0
            };
        }
    }
}

module.exports = { ProductCatalogController };
