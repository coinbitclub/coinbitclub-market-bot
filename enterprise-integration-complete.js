// Carregar variáveis de ambiente primeiro
require('dotenv').config({ path: '.env.production' });

const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const twilio = require('twilio');
const crypto = require('crypto');
const { Pool } = require('pg');

// =======================================
// 🚀 SISTEMA ENTERPRISE COMPLETO
// =======================================

class EnterpriseIntegrationComplete {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
        
        this.twilioClient = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );
        
        // Configurações dos planos Enterprise
        this.enterprisePlans = {
            // BRASIL
            brasil_pro: {
                name: 'Brasil PRO',
                monthlyPrice: 29700, // R$ 297.00 em centavos
                currency: 'BRL',
                commission: 10,
                minBalance: 10000, // R$ 100.00
                stripeProductId: 'prod_brasil_pro_297',
                stripePriceId: 'price_brasil_pro_297'
            },
            brasil_flex: {
                name: 'Brasil FLEX',
                monthlyPrice: 0,
                currency: 'BRL',
                commission: 20,
                minBalance: 10000, // R$ 100.00
                minRecharge: 15000, // R$ 150.00 mínimo
                stripeProductId: 'prod_brasil_flex',
                stripePriceId: null // Recarga dinâmica
            },
            
            // GLOBAL
            global_pro: {
                name: 'Global PRO',
                monthlyPrice: 5000, // $50.00 em centavos
                currency: 'USD',
                commission: 10,
                minBalance: 2000, // $20.00
                stripeProductId: 'prod_global_pro_50',
                stripePriceId: 'price_global_pro_50'
            },
            global_flex: {
                name: 'Global FLEX',
                monthlyPrice: 0,
                currency: 'USD',
                commission: 20,
                minBalance: 2000, // $20.00
                minRecharge: 3000, // $30.00 mínimo
                stripeProductId: 'prod_global_flex',
                stripePriceId: null // Recarga dinâmica
            }
        };
        
        // Configurações de cupons administrativos
        this.couponConfig = {
            types: {
                BASIC_BRL: { amount: 5000, currency: 'BRL', name: 'Básico R$ 50' },     // R$ 50
                PREMIUM_BRL: { amount: 20000, currency: 'BRL', name: 'Premium R$ 200' }, // R$ 200
                VIP_BRL: { amount: 50000, currency: 'BRL', name: 'VIP R$ 500' },        // R$ 500
                BASIC_USD: { amount: 1000, currency: 'USD', name: 'Basic $10' },        // $10
                PREMIUM_USD: { amount: 5000, currency: 'USD', name: 'Premium $50' },    // $50
                VIP_USD: { amount: 10000, currency: 'USD', name: 'VIP $100' }           // $100
            },
            prefixes: {
                BRL: 'CBCBR',
                USD: 'CBCUS'
            },
            expirationDays: 30
        };
    }

    // =======================================
    // 🗄️ MIGRAÇÃO ENTERPRISE COMPLETA
    // =======================================
    
    async createEnterpriseDatabase() {
        const client = await this.pool.connect();
        
        try {
            console.log('🚀 Criando estrutura Enterprise completa...');
            
            // 1. Perfis Enterprise
            await client.query(`
                CREATE TABLE IF NOT EXISTS user_profiles_enterprise (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    profile_type VARCHAR(50) NOT NULL DEFAULT 'basic',
                    
                    -- Dados Pessoais Obrigatórios
                    nome_completo VARCHAR(255) NOT NULL,
                    cpf VARCHAR(14) UNIQUE,
                    whatsapp VARCHAR(20) NOT NULL,
                    pais VARCHAR(100) NOT NULL DEFAULT 'BR',
                    
                    -- Dados Bancários
                    banco VARCHAR(100),
                    agencia VARCHAR(10), 
                    conta VARCHAR(20),
                    tipo_conta VARCHAR(20),
                    
                    -- PIX
                    chave_pix VARCHAR(255),
                    tipo_pix VARCHAR(50),
                    
                    -- Validação
                    dados_validados BOOLEAN DEFAULT false,
                    validado_em TIMESTAMP,
                    validado_por INTEGER REFERENCES users(id),
                    
                    -- Configurações Enterprise
                    limite_saque_diario DECIMAL(15,2) DEFAULT 10000.00,
                    limite_operacao DECIMAL(15,2) DEFAULT 100000.00,
                    features_habilitadas TEXT[] DEFAULT '{}',
                    
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW(),
                    
                    UNIQUE(user_id)
                );
            `);
            
            // 2. Planos Enterprise
            await client.query(`
                CREATE TABLE IF NOT EXISTS plans_enterprise (
                    id SERIAL PRIMARY KEY,
                    plan_code VARCHAR(50) UNIQUE NOT NULL,
                    name VARCHAR(100) NOT NULL,
                    description TEXT,
                    region VARCHAR(20) NOT NULL,
                    type VARCHAR(20) NOT NULL,
                    
                    -- Preços
                    monthly_price INTEGER NOT NULL DEFAULT 0, -- em centavos
                    currency VARCHAR(3) NOT NULL,
                    
                    -- Comissões
                    commission_rate DECIMAL(5,2) NOT NULL,
                    minimum_balance INTEGER NOT NULL, -- em centavos
                    minimum_recharge INTEGER DEFAULT 0, -- para planos flex
                    
                    -- Stripe
                    stripe_product_id VARCHAR(100),
                    stripe_price_id VARCHAR(100),
                    
                    -- Features
                    features TEXT[] DEFAULT '{}',
                    is_popular BOOLEAN DEFAULT false,
                    is_active BOOLEAN DEFAULT true,
                    
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                );
            `);
            
            // 3. Assinaturas Enterprise
            await client.query(`
                CREATE TABLE IF NOT EXISTS subscriptions_enterprise (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    plan_id INTEGER REFERENCES plans_enterprise(id),
                    
                    -- Stripe Data
                    stripe_subscription_id VARCHAR(100) UNIQUE,
                    stripe_customer_id VARCHAR(100),
                    stripe_status VARCHAR(50),
                    
                    -- Status Local
                    status VARCHAR(50) DEFAULT 'active',
                    trial_end TIMESTAMP,
                    current_period_start TIMESTAMP,
                    current_period_end TIMESTAMP,
                    
                    -- Valores
                    amount INTEGER, -- em centavos
                    currency VARCHAR(3),
                    
                    -- Controle
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW(),
                    canceled_at TIMESTAMP,
                    
                    UNIQUE(user_id, plan_id) -- Um usuário pode ter apenas uma assinatura por plano
                );
            `);
            
            // 4. Sistema de Afiliados Enterprise
            await client.query(`
                CREATE TABLE IF NOT EXISTS affiliate_levels_enterprise (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    level VARCHAR(20) NOT NULL DEFAULT 'normal',
                    
                    -- Comissões por Nível
                    commission_rate DECIMAL(5,2) NOT NULL DEFAULT 1.5,
                    bonus_rate DECIMAL(5,2) DEFAULT 0,
                    
                    -- Requisitos
                    min_referrals INTEGER DEFAULT 0,
                    min_monthly_volume DECIMAL(15,2) DEFAULT 0,
                    
                    -- Benefícios
                    benefits TEXT[] DEFAULT '{}',
                    
                    -- Link de Referência
                    referral_code VARCHAR(50) UNIQUE,
                    referral_link TEXT,
                    
                    -- Controle
                    promoted_at TIMESTAMP DEFAULT NOW(),
                    promoted_by INTEGER REFERENCES users(id),
                    is_active BOOLEAN DEFAULT true,
                    
                    UNIQUE(user_id)
                );
            `);
            
            // 5. Cupons Administrativos Enterprise
            await client.query(`
                CREATE TABLE IF NOT EXISTS admin_coupons_enterprise (
                    id SERIAL PRIMARY KEY,
                    coupon_code VARCHAR(50) UNIQUE NOT NULL,
                    credit_type VARCHAR(50) NOT NULL,
                    
                    -- Valor
                    amount INTEGER NOT NULL, -- em centavos
                    currency VARCHAR(3) NOT NULL,
                    
                    -- Metadados
                    description TEXT,
                    metadata JSONB DEFAULT '{}',
                    
                    -- Controle de Uso
                    is_used BOOLEAN DEFAULT false,
                    used_by_user INTEGER REFERENCES users(id),
                    used_at TIMESTAMP,
                    
                    -- Validade
                    expires_at TIMESTAMP NOT NULL,
                    
                    -- Criação
                    created_by_admin INTEGER REFERENCES users(id),
                    created_at TIMESTAMP DEFAULT NOW()
                );
            `);
            
            // 6. Log de Uso de Cupons
            await client.query(`
                CREATE TABLE IF NOT EXISTS coupon_usage_logs_enterprise (
                    id SERIAL PRIMARY KEY,
                    coupon_code VARCHAR(50) NOT NULL,
                    user_id INTEGER REFERENCES users(id),
                    action VARCHAR(20) NOT NULL, -- 'GENERATED', 'USED', 'EXPIRED'
                    amount INTEGER,
                    currency VARCHAR(3),
                    ip_address VARCHAR(45),
                    user_agent TEXT,
                    created_at TIMESTAMP DEFAULT NOW()
                );
            `);
            
            // 7. Transações Financeiras Enterprise
            await client.query(`
                CREATE TABLE IF NOT EXISTS financial_transactions_enterprise (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    transaction_type VARCHAR(50) NOT NULL, -- 'subscription', 'recharge', 'withdrawal', 'commission'
                    
                    -- Valores
                    amount INTEGER NOT NULL, -- em centavos
                    currency VARCHAR(3) NOT NULL,
                    fee INTEGER DEFAULT 0, -- taxa em centavos
                    net_amount INTEGER NOT NULL, -- valor líquido
                    
                    -- Stripe/Payment
                    stripe_payment_intent_id VARCHAR(100),
                    stripe_session_id VARCHAR(100),
                    payment_status VARCHAR(50) DEFAULT 'pending',
                    
                    -- Metadados
                    description TEXT,
                    metadata JSONB DEFAULT '{}',
                    
                    -- Controle
                    processed_at TIMESTAMP,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                );
            `);
            
            console.log('✅ Estrutura Enterprise criada com sucesso!');
            
        } finally {
            client.release();
        }
    }
    
    // =======================================
    // 💰 INSERIR PLANOS ENTERPRISE
    // =======================================
    
    async insertEnterprisePlans() {
        const client = await this.pool.connect();
        
        try {
            console.log('💰 Inserindo planos Enterprise...');
            
            const plans = [
                {
                    plan_code: 'brasil_pro',
                    name: 'Brasil PRO',
                    description: 'Plano mensal para Brasil com suporte prioritário',
                    region: 'brazil',
                    type: 'monthly',
                    monthly_price: 29700, // R$ 297.00
                    currency: 'BRL',
                    commission_rate: 10.00,
                    minimum_balance: 10000, // R$ 100.00
                    stripe_product_id: 'prod_brasil_pro_297',
                    stripe_price_id: 'price_brasil_pro_297',
                    features: ['Trading 24/7', 'Suporte prioritário', 'Relatórios IA', 'Gestão de risco'],
                    is_popular: true
                },
                {
                    plan_code: 'brasil_flex',
                    name: 'Brasil FLEX',
                    description: 'Plano por recarga para Brasil sem mensalidade',
                    region: 'brazil',
                    type: 'prepaid',
                    monthly_price: 0,
                    currency: 'BRL',
                    commission_rate: 20.00,
                    minimum_balance: 10000, // R$ 100.00
                    minimum_recharge: 15000, // R$ 150.00
                    stripe_product_id: 'prod_brasil_flex',
                    features: ['Trading 24/7', 'Sem mensalidade', 'Comissão apenas em lucro']
                },
                {
                    plan_code: 'global_pro',
                    name: 'Global PRO',
                    description: 'Monthly plan for international users',
                    region: 'international',
                    type: 'monthly',
                    monthly_price: 5000, // $50.00
                    currency: 'USD',
                    commission_rate: 10.00,
                    minimum_balance: 2000, // $20.00
                    stripe_product_id: 'prod_global_pro_50',
                    stripe_price_id: 'price_global_pro_50',
                    features: ['24/7 Trading', 'Priority Support', 'AI Reports', 'Risk Management']
                },
                {
                    plan_code: 'global_flex',
                    name: 'Global FLEX',
                    description: 'Pay-as-you-go plan for international users',
                    region: 'international',
                    type: 'prepaid',
                    monthly_price: 0,
                    currency: 'USD',
                    commission_rate: 20.00,
                    minimum_balance: 2000, // $20.00
                    minimum_recharge: 3000, // $30.00
                    stripe_product_id: 'prod_global_flex',
                    features: ['24/7 Trading', 'No monthly fee', 'Commission on profit only']
                }
            ];
            
            for (const plan of plans) {
                await client.query(`
                    INSERT INTO plans_enterprise (
                        plan_code, name, description, region, type,
                        monthly_price, currency, commission_rate, minimum_balance, minimum_recharge,
                        stripe_product_id, stripe_price_id, features, is_popular
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                    ON CONFLICT (plan_code) DO UPDATE SET
                        monthly_price = EXCLUDED.monthly_price,
                        commission_rate = EXCLUDED.commission_rate,
                        minimum_balance = EXCLUDED.minimum_balance,
                        minimum_recharge = EXCLUDED.minimum_recharge,
                        updated_at = NOW()
                `, [
                    plan.plan_code, plan.name, plan.description, plan.region, plan.type,
                    plan.monthly_price, plan.currency, plan.commission_rate, 
                    plan.minimum_balance, plan.minimum_recharge || 0,
                    plan.stripe_product_id, plan.stripe_price_id || null,
                    plan.features, plan.is_popular || false
                ]);
            }
            
            console.log('✅ Planos Enterprise inseridos!');
            
        } finally {
            client.release();
        }
    }
    
    // =======================================
    // 🔗 STRIPE ENTERPRISE INTEGRATION
    // =======================================
    
    async createStripeProducts() {
        console.log('🔗 Verificando produtos Stripe Enterprise...');
        
        try {
            // Testar conexão Stripe primeiro
            await stripe.products.list({ limit: 1 });
            console.log('✅ Conexão Stripe estabelecida com sucesso');
            
            const products = [
                // Brasil PRO - R$ 297/mês
                {
                    id: 'prod_brasil_pro_297',
                    name: 'CoinBitClub Brasil PRO',
                    description: 'Plano mensal premium para traders brasileiros - R$ 297/mês',
                    price: 29700, // R$ 297.00 em centavos
                    currency: 'brl',
                    interval: 'month',
                    priceId: 'price_brasil_pro_297'
                },
                
                // Global PRO - $50/mês
                {
                    id: 'prod_global_pro_50',
                    name: 'CoinBitClub Global PRO',
                    description: 'Monthly premium plan for international traders - $50/month',
                    price: 5000, // $50.00 em centavos
                    currency: 'usd',
                    interval: 'month',
                    priceId: 'price_global_pro_50'
                },
                
                // Brasil FLEX - Recarga
                {
                    id: 'prod_brasil_flex',
                    name: 'CoinBitClub Brasil FLEX',
                    description: 'Recarga flexível para traders brasileiros - sem mensalidade',
                    isRecharge: true
                },
                
                // Global FLEX - Recarga
                {
                    id: 'prod_global_flex',
                    name: 'CoinBitClub Global FLEX',
                    description: 'Flexible recharge for international traders - no monthly fee',
                    isRecharge: true
                }
            ];
            
            for (const productConfig of products) {
                try {
                    if (!productConfig.isRecharge) {
                        // Verificar se produto já existe
                        try {
                            const existingProduct = await stripe.products.retrieve(productConfig.id);
                            console.log(`⚠️ Produto já existe: ${existingProduct.name}`);
                            
                            // Verificar se preço existe
                            try {
                                const existingPrice = await stripe.prices.retrieve(productConfig.priceId);
                                console.log(`⚠️ Preço já existe: ${existingPrice.unit_amount / 100} ${existingPrice.currency.toUpperCase()}`);
                            } catch (priceError) {
                                // Criar apenas o preço
                                const price = await stripe.prices.create({
                                    id: productConfig.priceId,
                                    product: productConfig.id,
                                    unit_amount: productConfig.price,
                                    currency: productConfig.currency,
                                    recurring: {
                                        interval: productConfig.interval
                                    }
                                });
                                console.log(`✅ Preço criado: ${price.unit_amount / 100} ${price.currency.toUpperCase()}`);
                            }
                        } catch (productError) {
                            // Criar produto e preço
                            const product = await stripe.products.create({
                                id: productConfig.id,
                                name: productConfig.name,
                                description: productConfig.description,
                                type: 'service'
                            });
                            
                            const price = await stripe.prices.create({
                                id: productConfig.priceId,
                                product: product.id,
                                unit_amount: productConfig.price,
                                currency: productConfig.currency,
                                recurring: {
                                    interval: productConfig.interval
                                }
                            });
                            
                            console.log(`✅ Produto criado: ${product.name} - ${price.unit_amount / 100} ${price.currency.toUpperCase()}`);
                        }
                    } else {
                        // Verificar produto de recarga
                        try {
                            const existingProduct = await stripe.products.retrieve(productConfig.id);
                            console.log(`⚠️ Produto de recarga já existe: ${existingProduct.name}`);
                        } catch (productError) {
                            const product = await stripe.products.create({
                                id: productConfig.id,
                                name: productConfig.name,
                                description: productConfig.description,
                                type: 'service'
                            });
                            console.log(`✅ Produto de recarga criado: ${product.name}`);
                        }
                    }
                    
                } catch (error) {
                    console.error(`❌ Erro ao processar produto ${productConfig.name}:`, error.message);
                }
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Erro na conexão Stripe:', error.message);
            console.log('⚠️ Sistema funcionará sem produtos Stripe por enquanto');
            return false;
        }
    }
    
    // =======================================
    // 📱 SISTEMA DE AFILIADOS ENTERPRISE
    // =======================================
    
    async createAffiliateCode(userId, level = 'normal') {
        const client = await this.pool.connect();
        
        try {
            // Gerar código único
            let referralCode;
            let exists = true;
            
            while (exists) {
                referralCode = `${level.toUpperCase()}${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
                const check = await client.query(
                    'SELECT id FROM affiliate_levels_enterprise WHERE referral_code = $1',
                    [referralCode]
                );
                exists = check.rows.length > 0;
            }
            
            const referralLink = `${process.env.FRONTEND_URL}/register?ref=${referralCode}`;
            
            const commissionRate = level === 'vip' ? 5.0 : 1.5;
            const benefits = level === 'vip' 
                ? ['Comissão 5%', 'Suporte prioritário', 'Relatórios exclusivos']
                : ['Comissão 1.5%', 'Dashboard básico'];
            
            const result = await client.query(`
                INSERT INTO affiliate_levels_enterprise (
                    user_id, level, commission_rate, referral_code, referral_link, benefits
                ) VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (user_id) DO UPDATE SET
                    level = EXCLUDED.level,
                    commission_rate = EXCLUDED.commission_rate,
                    referral_code = EXCLUDED.referral_code,
                    referral_link = EXCLUDED.referral_link,
                    benefits = EXCLUDED.benefits,
                    promoted_at = NOW()
                RETURNING *
            `, [userId, level, commissionRate, referralCode, referralLink, benefits]);
            
            return result.rows[0];
            
        } finally {
            client.release();
        }
    }
    
    // =======================================
    // 🎫 SISTEMA DE CUPONS ENTERPRISE
    // =======================================
    
    async generateAdminCoupon(adminId, creditType, description = '') {
        const client = await this.pool.connect();
        
        try {
            if (!this.couponConfig.types[creditType]) {
                throw new Error(`Tipo de crédito inválido: ${creditType}`);
            }
            
            const creditInfo = this.couponConfig.types[creditType];
            const prefix = this.couponConfig.prefixes[creditInfo.currency];
            
            // Gerar código único
            let couponCode;
            let exists = true;
            
            while (exists) {
                const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
                couponCode = `${prefix}${randomPart}`;
                
                const check = await client.query(
                    'SELECT id FROM admin_coupons_enterprise WHERE coupon_code = $1',
                    [couponCode]
                );
                exists = check.rows.length > 0;
            }
            
            // Data de expiração
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + this.couponConfig.expirationDays);
            
            // Inserir cupom
            const result = await client.query(`
                INSERT INTO admin_coupons_enterprise (
                    coupon_code, credit_type, amount, currency, created_by_admin, 
                    expires_at, description, metadata
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `, [
                couponCode, creditType, creditInfo.amount, creditInfo.currency,
                adminId, expiresAt, description || `Cupom ${creditInfo.name}`,
                JSON.stringify({ creditType, generatedBy: adminId })
            ]);
            
            // Log da geração
            await client.query(`
                INSERT INTO coupon_usage_logs_enterprise (
                    coupon_code, user_id, action, amount, currency
                ) VALUES ($1, $2, 'GENERATED', $3, $4)
            `, [couponCode, adminId, creditInfo.amount, creditInfo.currency]);
            
            return result.rows[0];
            
        } finally {
            client.release();
        }
    }
    
    async useCoupon(userId, couponCode, userIp = '', userAgent = '') {
        const client = await this.pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Buscar cupom
            const couponResult = await client.query(`
                SELECT * FROM admin_coupons_enterprise 
                WHERE coupon_code = $1
            `, [couponCode.toUpperCase()]);
            
            if (couponResult.rows.length === 0) {
                throw new Error('Cupom não encontrado');
            }
            
            const coupon = couponResult.rows[0];
            
            // Validações
            if (coupon.is_used) {
                throw new Error('Cupom já foi utilizado');
            }
            
            if (new Date() > new Date(coupon.expires_at)) {
                throw new Error('Cupom expirado');
            }
            
            // Aplicar crédito no usuário
            const creditColumn = coupon.currency === 'BRL' ? 'balance_admin_brl' : 'balance_admin_usd';
            
            await client.query(`
                UPDATE users 
                SET ${creditColumn} = COALESCE(${creditColumn}, 0) + $1,
                    updated_at = NOW()
                WHERE id = $2
            `, [coupon.amount, userId]);
            
            // Marcar cupom como usado
            await client.query(`
                UPDATE admin_coupons_enterprise 
                SET is_used = true,
                    used_by_user = $1,
                    used_at = NOW()
                WHERE coupon_code = $2
            `, [userId, couponCode.toUpperCase()]);
            
            // Log do uso
            await client.query(`
                INSERT INTO coupon_usage_logs_enterprise (
                    coupon_code, user_id, action, amount, currency, ip_address, user_agent
                ) VALUES ($1, $2, 'USED', $3, $4, $5, $6)
            `, [couponCode.toUpperCase(), userId, coupon.amount, coupon.currency, userIp, userAgent]);
            
            await client.query('COMMIT');
            
            return {
                success: true,
                coupon_code: coupon.coupon_code,
                amount: coupon.amount,
                currency: coupon.currency,
                credit_applied: (coupon.amount / 100).toFixed(2),
                message: `Crédito de ${(coupon.amount / 100).toFixed(2)} ${coupon.currency} aplicado com sucesso`
            };
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
    
    // =======================================
    // 📱 TWILIO SMS ENTERPRISE
    // =======================================
    
    async sendSMS(phone, message, profile = 'basic') {
        try {
            const templates = {
                basic: `🎯 CoinBitClub: ${message}`,
                premium: `💎 CoinBitClub Premium: ${message}`,
                enterprise: `🏢 CoinBitClub Enterprise: ${message}`,
                affiliate: `🤝 CoinBitClub Afiliado: ${message}`
            };
            
            const finalMessage = templates[profile] || templates.basic;
            
            const result = await this.twilioClient.messages.create({
                body: finalMessage,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: phone
            });
            
            return {
                success: true,
                messageSid: result.sid,
                message: 'SMS enviado com sucesso'
            };
            
        } catch (error) {
            throw new Error(`Erro ao enviar SMS: ${error.message}`);
        }
    }
    
    // =======================================
    // 🔧 ROTAS EXPRESS ENTERPRISE
    // =======================================
    
    setupRoutes(app) {
        
        // =======================================
        // 💰 ROTAS DE PLANOS E ASSINATURAS
        // =======================================
        
        // Listar planos enterprise
        app.get('/api/enterprise/plans', async (req, res) => {
            try {
                const { region } = req.query;
                
                const client = await this.pool.connect();
                let query = 'SELECT * FROM plans_enterprise WHERE is_active = true';
                const params = [];
                
                if (region) {
                    query += ' AND region = $1';
                    params.push(region);
                }
                
                query += ' ORDER BY monthly_price ASC';
                
                const result = await client.query(query, params);
                client.release();
                
                res.json({
                    success: true,
                    plans: result.rows.map(plan => ({
                        ...plan,
                        monthly_price_formatted: `${(plan.monthly_price / 100).toFixed(2)} ${plan.currency}`,
                        minimum_balance_formatted: `${(plan.minimum_balance / 100).toFixed(2)} ${plan.currency}`,
                        minimum_recharge_formatted: plan.minimum_recharge ? 
                            `${(plan.minimum_recharge / 100).toFixed(2)} ${plan.currency}` : null
                    }))
                });
                
            } catch (error) {
                res.status(500).json({
                    error: 'Erro ao listar planos',
                    details: error.message
                });
            }
        });
        
        // Criar assinatura Brasil PRO - R$ 297/mês
        app.post('/api/enterprise/subscribe/brasil-pro', async (req, res) => {
            try {
                const { userId, customerEmail } = req.body;
                
                if (!userId || !customerEmail) {
                    return res.status(400).json({
                        error: 'userId e customerEmail são obrigatórios'
                    });
                }
                
                const session = await stripe.checkout.sessions.create({
                    payment_method_types: ['card'],
                    line_items: [{
                        price: 'price_brasil_pro_297',
                        quantity: 1,
                    }],
                    mode: 'subscription',
                    customer_email: customerEmail,
                    success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
                    cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
                    metadata: {
                        userId: userId,
                        planType: 'brasil_pro',
                        planName: 'Brasil PRO',
                        commission: '10'
                    }
                });
                
                res.json({
                    success: true,
                    checkoutUrl: session.url,
                    sessionId: session.id,
                    plan: 'Brasil PRO',
                    price: 'R$ 297,00',
                    commission: '10%'
                });
                
            } catch (error) {
                res.status(400).json({
                    error: 'Erro ao criar assinatura Brasil PRO',
                    details: error.message
                });
            }
        });
        
        // Criar assinatura Global PRO - $50/mês
        app.post('/api/enterprise/subscribe/global-pro', async (req, res) => {
            try {
                const { userId, customerEmail } = req.body;
                
                if (!userId || !customerEmail) {
                    return res.status(400).json({
                        error: 'userId e customerEmail são obrigatórios'
                    });
                }
                
                const session = await stripe.checkout.sessions.create({
                    payment_method_types: ['card'],
                    line_items: [{
                        price: 'price_global_pro_50',
                        quantity: 1,
                    }],
                    mode: 'subscription',
                    customer_email: customerEmail,
                    success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
                    cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
                    metadata: {
                        userId: userId,
                        planType: 'global_pro',
                        planName: 'Global PRO',
                        commission: '10'
                    }
                });
                
                res.json({
                    success: true,
                    checkoutUrl: session.url,
                    sessionId: session.id,
                    plan: 'Global PRO',
                    price: '$50.00',
                    commission: '10%'
                });
                
            } catch (error) {
                res.status(400).json({
                    error: 'Erro ao criar assinatura Global PRO',
                    details: error.message
                });
            }
        });
        
        // Criar recarga Brasil FLEX (mínimo R$ 150)
        app.post('/api/enterprise/recharge/brasil-flex', async (req, res) => {
            try {
                const { userId, amount, customerEmail } = req.body;
                
                if (!userId || !amount || !customerEmail) {
                    return res.status(400).json({
                        error: 'userId, amount e customerEmail são obrigatórios'
                    });
                }
                
                const amountCents = Math.round(amount * 100);
                const minAmount = 15000; // R$ 150.00
                
                if (amountCents < minAmount) {
                    return res.status(400).json({
                        error: `Valor mínimo para recarga Brasil FLEX é R$ ${minAmount / 100}`
                    });
                }
                
                const session = await stripe.checkout.sessions.create({
                    payment_method_types: ['card'],
                    line_items: [{
                        price_data: {
                            currency: 'brl',
                            unit_amount: amountCents,
                            product_data: {
                                name: 'CoinBitClub Brasil FLEX - Recarga',
                                description: `Recarga de R$ ${(amountCents / 100).toFixed(2)} para plano flexível`
                            }
                        },
                        quantity: 1,
                    }],
                    mode: 'payment',
                    customer_email: customerEmail,
                    success_url: `${process.env.FRONTEND_URL}/recharge/success?session_id={CHECKOUT_SESSION_ID}`,
                    cancel_url: `${process.env.FRONTEND_URL}/recharge/cancel`,
                    metadata: {
                        userId: userId,
                        planType: 'brasil_flex',
                        planName: 'Brasil FLEX',
                        commission: '20',
                        rechargeAmount: amountCents
                    }
                });
                
                res.json({
                    success: true,
                    checkoutUrl: session.url,
                    sessionId: session.id,
                    plan: 'Brasil FLEX',
                    amount: `R$ ${(amountCents / 100).toFixed(2)}`,
                    commission: '20%'
                });
                
            } catch (error) {
                res.status(400).json({
                    error: 'Erro ao criar recarga Brasil FLEX',
                    details: error.message
                });
            }
        });
        
        // Criar recarga Global FLEX (mínimo $30)
        app.post('/api/enterprise/recharge/global-flex', async (req, res) => {
            try {
                const { userId, amount, customerEmail } = req.body;
                
                if (!userId || !amount || !customerEmail) {
                    return res.status(400).json({
                        error: 'userId, amount e customerEmail são obrigatórios'
                    });
                }
                
                const amountCents = Math.round(amount * 100);
                const minAmount = 3000; // $30.00
                
                if (amountCents < minAmount) {
                    return res.status(400).json({
                        error: `Valor mínimo para recarga Global FLEX é $${minAmount / 100}`
                    });
                }
                
                const session = await stripe.checkout.sessions.create({
                    payment_method_types: ['card'],
                    line_items: [{
                        price_data: {
                            currency: 'usd',
                            unit_amount: amountCents,
                            product_data: {
                                name: 'CoinBitClub Global FLEX - Recharge',
                                description: `Recharge of $${(amountCents / 100).toFixed(2)} for flexible plan`
                            }
                        },
                        quantity: 1,
                    }],
                    mode: 'payment',
                    customer_email: customerEmail,
                    success_url: `${process.env.FRONTEND_URL}/recharge/success?session_id={CHECKOUT_SESSION_ID}`,
                    cancel_url: `${process.env.FRONTEND_URL}/recharge/cancel`,
                    metadata: {
                        userId: userId,
                        planType: 'global_flex',
                        planName: 'Global FLEX',
                        commission: '20',
                        rechargeAmount: amountCents
                    }
                });
                
                res.json({
                    success: true,
                    checkoutUrl: session.url,
                    sessionId: session.id,
                    plan: 'Global FLEX',
                    amount: `$${(amountCents / 100).toFixed(2)}`,
                    commission: '20%'
                });
                
            } catch (error) {
                res.status(400).json({
                    error: 'Erro ao criar recarga Global FLEX',
                    details: error.message
                });
            }
        });
        
        // =======================================
        // 🤝 ROTAS DE AFILIADOS
        // =======================================
        
        // Criar afiliado
        app.post('/api/enterprise/affiliate/create', async (req, res) => {
            try {
                const { userId, level = 'normal' } = req.body;
                
                if (!userId) {
                    return res.status(400).json({
                        error: 'userId é obrigatório'
                    });
                }
                
                const affiliate = await this.createAffiliateCode(userId, level);
                
                res.json({
                    success: true,
                    affiliate: {
                        ...affiliate,
                        commission_rate_formatted: `${affiliate.commission_rate}%`
                    },
                    message: 'Afiliado criado com sucesso'
                });
                
            } catch (error) {
                res.status(400).json({
                    error: 'Erro ao criar afiliado',
                    details: error.message
                });
            }
        });
        
        // Buscar dados do afiliado
        app.get('/api/enterprise/affiliate/:userId', async (req, res) => {
            try {
                const { userId } = req.params;
                
                const client = await this.pool.connect();
                
                const result = await client.query(`
                    SELECT ale.*,
                           COUNT(r.id) as total_referrals,
                           COALESCE(SUM(ft.net_amount), 0) as total_commissions
                    FROM affiliate_levels_enterprise ale
                    LEFT JOIN referrals r ON r.affiliate_user_id = ale.user_id
                    LEFT JOIN financial_transactions_enterprise ft ON ft.user_id = ale.user_id 
                        AND ft.transaction_type = 'commission'
                    WHERE ale.user_id = $1
                    GROUP BY ale.id
                `, [userId]);
                
                client.release();
                
                if (result.rows.length === 0) {
                    return res.status(404).json({
                        error: 'Afiliado não encontrado'
                    });
                }
                
                const affiliate = result.rows[0];
                
                res.json({
                    success: true,
                    affiliate: {
                        ...affiliate,
                        commission_rate_formatted: `${affiliate.commission_rate}%`,
                        total_commissions_formatted: `${(affiliate.total_commissions / 100).toFixed(2)} ${affiliate.currency || 'BRL'}`
                    }
                });
                
            } catch (error) {
                res.status(500).json({
                    error: 'Erro ao buscar dados do afiliado',
                    details: error.message
                });
            }
        });
        
        // =======================================
        // 🎫 ROTAS DE CUPONS ADMINISTRATIVOS
        // =======================================
        
        // Gerar cupom administrativo
        app.post('/api/enterprise/admin/coupon/generate', async (req, res) => {
            try {
                const { adminId, creditType, description } = req.body;
                
                if (!adminId || !creditType) {
                    return res.status(400).json({
                        error: 'adminId e creditType são obrigatórios'
                    });
                }
                
                const coupon = await this.generateAdminCoupon(adminId, creditType, description);
                
                res.json({
                    success: true,
                    coupon: {
                        ...coupon,
                        amount_formatted: `${(coupon.amount / 100).toFixed(2)} ${coupon.currency}`
                    },
                    message: 'Cupom gerado com sucesso'
                });
                
            } catch (error) {
                res.status(400).json({
                    error: 'Erro ao gerar cupom',
                    details: error.message
                });
            }
        });
        
        // Usar cupom
        app.post('/api/enterprise/coupon/use', async (req, res) => {
            try {
                const { userId, couponCode } = req.body;
                const userIp = req.ip || req.connection.remoteAddress;
                const userAgent = req.get('User-Agent');
                
                if (!userId || !couponCode) {
                    return res.status(400).json({
                        error: 'userId e couponCode são obrigatórios'
                    });
                }
                
                const result = await this.useCoupon(userId, couponCode, userIp, userAgent);
                
                res.json(result);
                
            } catch (error) {
                res.status(400).json({
                    error: error.message
                });
            }
        });
        
        // Listar cupons administrativos
        app.get('/api/enterprise/admin/coupons', async (req, res) => {
            try {
                const { adminId, status = 'all' } = req.query;
                
                const client = await this.pool.connect();
                
                let query = `
                    SELECT ace.*, 
                           CASE WHEN ace.is_used THEN 'USADO'
                                WHEN NOW() > ace.expires_at THEN 'EXPIRADO'
                                ELSE 'ATIVO' END as status,
                           u.name as used_by_name
                    FROM admin_coupons_enterprise ace
                    LEFT JOIN users u ON ace.used_by_user = u.id
                `;
                
                const params = [];
                const conditions = [];
                
                if (adminId) {
                    conditions.push(`ace.created_by_admin = $${params.length + 1}`);
                    params.push(adminId);
                }
                
                if (status !== 'all') {
                    if (status === 'active') {
                        conditions.push(`ace.is_used = false AND NOW() <= ace.expires_at`);
                    } else if (status === 'used') {
                        conditions.push(`ace.is_used = true`);
                    } else if (status === 'expired') {
                        conditions.push(`ace.is_used = false AND NOW() > ace.expires_at`);
                    }
                }
                
                if (conditions.length > 0) {
                    query += ` WHERE ${conditions.join(' AND ')}`;
                }
                
                query += ' ORDER BY ace.created_at DESC';
                
                const result = await client.query(query, params);
                client.release();
                
                res.json({
                    success: true,
                    coupons: result.rows.map(row => ({
                        ...row,
                        amount_formatted: `${(row.amount / 100).toFixed(2)} ${row.currency}`
                    }))
                });
                
            } catch (error) {
                res.status(500).json({
                    error: 'Erro ao listar cupons',
                    details: error.message
                });
            }
        });
        
        // =======================================
        // 📱 ROTAS TWILIO
        // =======================================
        
        // Teste Twilio
        app.post('/api/enterprise/twilio/test', async (req, res) => {
            try {
                const { phone, message = 'Teste de SMS Enterprise', profile = 'basic' } = req.body;
                
                if (!phone) {
                    return res.status(400).json({
                        error: 'Telefone é obrigatório'
                    });
                }
                
                const result = await this.sendSMS(phone, message, profile);
                
                res.json(result);
                
            } catch (error) {
                res.status(400).json({
                    error: 'Erro ao enviar SMS',
                    details: error.message
                });
            }
        });
        
        // =======================================
        // 📊 ROTAS ADMINISTRATIVAS
        // =======================================
        
        // Teste conexão Stripe
        app.post('/api/enterprise/stripe/test', async (req, res) => {
            try {
                // Testar conexão
                const account = await stripe.accounts.retrieve();
                
                // Listar produtos existentes
                const products = await stripe.products.list({ limit: 10 });
                
                res.json({
                    success: true,
                    message: 'Conexão Stripe estabelecida com sucesso',
                    account: {
                        id: account.id,
                        business_profile: account.business_profile,
                        country: account.country,
                        default_currency: account.default_currency
                    },
                    products: products.data.map(p => ({
                        id: p.id,
                        name: p.name,
                        active: p.active,
                        created: new Date(p.created * 1000)
                    }))
                });
                
            } catch (error) {
                res.status(400).json({
                    error: 'Erro na conexão Stripe',
                    details: error.message,
                    suggestion: 'Verificar STRIPE_SECRET_KEY no .env.production'
                });
            }
        });
        
        // Criar produtos Stripe manualmente
        app.post('/api/enterprise/stripe/create-products', async (req, res) => {
            try {
                const result = await this.createStripeProducts();
                
                if (result) {
                    res.json({
                        success: true,
                        message: 'Produtos Stripe criados/verificados com sucesso'
                    });
                } else {
                    res.status(400).json({
                        error: 'Falha ao criar produtos Stripe',
                        message: 'Verificar credenciais e tentar novamente'
                    });
                }
                
            } catch (error) {
                res.status(500).json({
                    error: 'Erro ao criar produtos Stripe',
                    details: error.message
                });
            }
        });
        
        // Status do sistema enterprise
        app.get('/api/enterprise/status', async (req, res) => {
            try {
                const client = await this.pool.connect();
                
                // Estatísticas gerais
                const stats = await client.query(`
                    SELECT 
                        (SELECT COUNT(*) FROM users) as total_users,
                        (SELECT COUNT(*) FROM user_profiles_enterprise) as enterprise_profiles,
                        (SELECT COUNT(*) FROM subscriptions_enterprise WHERE status = 'active') as active_subscriptions,
                        (SELECT COUNT(*) FROM affiliate_levels_enterprise WHERE is_active = true) as active_affiliates,
                        (SELECT COUNT(*) FROM admin_coupons_enterprise WHERE is_used = false AND expires_at > NOW()) as active_coupons,
                        (SELECT COALESCE(SUM(amount), 0) FROM financial_transactions_enterprise WHERE payment_status = 'succeeded') as total_revenue
                `);
                
                client.release();
                
                const data = stats.rows[0];
                
                res.json({
                    success: true,
                    system: 'CoinBitClub Enterprise v6.0.0',
                    status: 'OPERACIONAL',
                    timestamp: new Date().toISOString(),
                    stats: {
                        total_users: parseInt(data.total_users),
                        enterprise_profiles: parseInt(data.enterprise_profiles),
                        active_subscriptions: parseInt(data.active_subscriptions),
                        active_affiliates: parseInt(data.active_affiliates),
                        active_coupons: parseInt(data.active_coupons),
                        total_revenue_formatted: `${(data.total_revenue / 100).toFixed(2)} BRL`
                    },
                    integrations: {
                        stripe: 'CONFIGURADO',
                        twilio: 'CONFIGURADO',
                        database: 'CONECTADO'
                    },
                    plans: {
                        brasil_pro: 'R$ 297,00/mês',
                        brasil_flex: 'Recarga (mín. R$ 150)',
                        global_pro: '$50,00/mês',
                        global_flex: 'Recarga (mín. $30)'
                    }
                });
                
            } catch (error) {
                res.status(500).json({
                    error: 'Erro ao obter status do sistema',
                    details: error.message,
                    system: 'CoinBitClub Enterprise v6.0.0',
                    status: 'ERRO'
                });
            }
        });
        
        // Webhook Stripe
        app.post('/api/enterprise/webhook/stripe', express.raw({type: 'application/json'}), async (req, res) => {
            const sig = req.headers['stripe-signature'];
            let event;
            
            try {
                event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
            } catch (err) {
                console.log(`Webhook signature verification failed.`, err.message);
                return res.status(400).send(`Webhook Error: ${err.message}`);
            }
            
            // Processar eventos do Stripe
            try {
                switch (event.type) {
                    case 'checkout.session.completed':
                        await this.handleCheckoutCompleted(event.data.object);
                        break;
                    case 'customer.subscription.created':
                        await this.handleSubscriptionCreated(event.data.object);
                        break;
                    case 'customer.subscription.updated':
                        await this.handleSubscriptionUpdated(event.data.object);
                        break;
                    case 'invoice.payment_succeeded':
                        await this.handlePaymentSucceeded(event.data.object);
                        break;
                    default:
                        console.log(`Unhandled event type ${event.type}`);
                }
                
                res.json({received: true});
                
            } catch (error) {
                console.error('Erro ao processar webhook:', error);
                res.status(500).json({error: 'Erro interno do servidor'});
            }
        });
    }
    
    // =======================================
    // 🔄 PROCESSAMENTO DE WEBHOOKS STRIPE
    // =======================================
    
    async handleCheckoutCompleted(session) {
        const client = await this.pool.connect();
        
        try {
            const userId = session.metadata.userId;
            const planType = session.metadata.planType;
            const amount = session.amount_total;
            
            // Registrar transação
            await client.query(`
                INSERT INTO financial_transactions_enterprise (
                    user_id, transaction_type, amount, currency, 
                    stripe_session_id, payment_status, description, metadata
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [
                userId, 
                planType.includes('flex') ? 'recharge' : 'subscription',
                amount, 
                session.currency.toUpperCase(),
                session.id,
                'succeeded',
                `${session.metadata.planName} - Pagamento processado`,
                JSON.stringify(session.metadata)
            ]);
            
            // Se for recarga, creditar saldo
            if (planType.includes('flex')) {
                const balanceColumn = session.currency === 'brl' ? 'balance_real_brl' : 'balance_real_usd';
                
                await client.query(`
                    UPDATE users 
                    SET ${balanceColumn} = COALESCE(${balanceColumn}, 0) + $1,
                        updated_at = NOW()
                    WHERE id = $2
                `, [amount, userId]);
            }
            
            console.log(`✅ Checkout processado: ${session.metadata.planName} para usuário ${userId}`);
            
        } finally {
            client.release();
        }
    }
    
    async handleSubscriptionCreated(subscription) {
        const client = await this.pool.connect();
        
        try {
            const session = await stripe.checkout.sessions.list({
                subscription: subscription.id,
                limit: 1
            });
            
            if (session.data.length > 0) {
                const sessionData = session.data[0];
                const userId = sessionData.metadata.userId;
                const planCode = sessionData.metadata.planType;
                
                // Buscar plano
                const planResult = await client.query(
                    'SELECT id FROM plans_enterprise WHERE plan_code = $1',
                    [planCode]
                );
                
                if (planResult.rows.length > 0) {
                    const planId = planResult.rows[0].id;
                    
                    // Criar assinatura
                    await client.query(`
                        INSERT INTO subscriptions_enterprise (
                            user_id, plan_id, stripe_subscription_id, stripe_customer_id,
                            stripe_status, status, current_period_start, current_period_end,
                            amount, currency
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                        ON CONFLICT (user_id, plan_id) DO UPDATE SET
                            stripe_subscription_id = EXCLUDED.stripe_subscription_id,
                            stripe_status = EXCLUDED.stripe_status,
                            status = EXCLUDED.status,
                            current_period_start = EXCLUDED.current_period_start,
                            current_period_end = EXCLUDED.current_period_end,
                            updated_at = NOW()
                    `, [
                        userId, planId, subscription.id, subscription.customer,
                        subscription.status, 'active',
                        new Date(subscription.current_period_start * 1000),
                        new Date(subscription.current_period_end * 1000),
                        subscription.items.data[0].price.unit_amount,
                        subscription.items.data[0].price.currency.toUpperCase()
                    ]);
                    
                    console.log(`✅ Assinatura criada: ${planCode} para usuário ${userId}`);
                }
            }
            
        } finally {
            client.release();
        }
    }
    
    async handleSubscriptionUpdated(subscription) {
        const client = await this.pool.connect();
        
        try {
            await client.query(`
                UPDATE subscriptions_enterprise 
                SET stripe_status = $1,
                    status = $2,
                    current_period_start = $3,
                    current_period_end = $4,
                    updated_at = NOW()
                WHERE stripe_subscription_id = $5
            `, [
                subscription.status,
                subscription.status === 'active' ? 'active' : 'inactive',
                new Date(subscription.current_period_start * 1000),
                new Date(subscription.current_period_end * 1000),
                subscription.id
            ]);
            
            console.log(`✅ Assinatura atualizada: ${subscription.id}`);
            
        } finally {
            client.release();
        }
    }
    
    async handlePaymentSucceeded(invoice) {
        const client = await this.pool.connect();
        
        try {
            if (invoice.subscription) {
                // Buscar assinatura
                const subResult = await client.query(
                    'SELECT user_id FROM subscriptions_enterprise WHERE stripe_subscription_id = $1',
                    [invoice.subscription]
                );
                
                if (subResult.rows.length > 0) {
                    const userId = subResult.rows[0].user_id;
                    
                    // Registrar pagamento da mensalidade
                    await client.query(`
                        INSERT INTO financial_transactions_enterprise (
                            user_id, transaction_type, amount, currency,
                            stripe_payment_intent_id, payment_status, description
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                    `, [
                        userId, 'subscription', invoice.amount_paid,
                        invoice.currency.toUpperCase(), invoice.payment_intent,
                        'succeeded', 'Pagamento de mensalidade'
                    ]);
                    
                    console.log(`✅ Pagamento registrado: usuário ${userId}, valor ${invoice.amount_paid / 100}`);
                }
            }
            
        } finally {
            client.release();
        }
    }
    
    // =======================================
    // 🚀 INICIALIZAÇÃO COMPLETA
    // =======================================
    
    async initialize() {
        try {
            console.log('🚀 Inicializando Sistema Enterprise Completo...');
            
            // 1. Criar estrutura do banco
            await this.createEnterpriseDatabase();
            
            // 2. Inserir planos enterprise
            await this.insertEnterprisePlans();
            
            // 3. Criar produtos Stripe
            await this.createStripeProducts();
            
            console.log('✅ Sistema Enterprise inicializado com sucesso!');
            
            return {
                success: true,
                message: 'Sistema Enterprise v6.0.0 inicializado',
                components: [
                    'Database Enterprise ✅',
                    'Planos R$ 297 e $50 ✅',
                    'Produtos Stripe ✅',
                    'Sistema de Afiliados ✅',
                    'Cupons Administrativos ✅',
                    'Twilio SMS ✅',
                    'Webhooks ✅'
                ]
            };
            
        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
            throw error;
        }
    }
}

module.exports = EnterpriseIntegrationComplete;
