const { Client } = require('pg');
require('dotenv').config();

async function runFinancialMigration() {
    console.log('🗄️  INICIANDO MIGRAÇÃO CORRIGIDA DO SISTEMA FINANCEIRO...');
    console.log('========================================');
    
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });
    
    try {
        await client.connect();
        console.log('✅ Conectado ao banco de dados');
        
        // Primeiro, vamos criar as tabelas principais
        console.log('\n📊 FASE 1: CRIANDO TABELAS...');
        
        const tables = [
            {
                name: 'coupons',
                sql: `CREATE TABLE IF NOT EXISTS coupons (
                    id SERIAL PRIMARY KEY,
                    code VARCHAR(20) UNIQUE NOT NULL,
                    description TEXT,
                    discount_percentage DECIMAL(5,2) NOT NULL,
                    max_uses INTEGER DEFAULT NULL,
                    current_uses INTEGER DEFAULT 0,
                    valid_from TIMESTAMP DEFAULT NOW(),
                    valid_until TIMESTAMP,
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT NOW(),
                    created_by INTEGER,
                    CONSTRAINT discount_range CHECK (discount_percentage > 0 AND discount_percentage <= 100)
                )`
            },
            {
                name: 'coupon_usage',
                sql: `CREATE TABLE IF NOT EXISTS coupon_usage (
                    id SERIAL PRIMARY KEY,
                    coupon_id INTEGER REFERENCES coupons(id),
                    user_id INTEGER NOT NULL,
                    used_at TIMESTAMP DEFAULT NOW(),
                    amount DECIMAL(10,2),
                    discount_amount DECIMAL(10,2)
                )`
            },
            {
                name: 'affiliates',
                sql: `CREATE TABLE IF NOT EXISTS affiliates (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER UNIQUE NOT NULL,
                    affiliate_code VARCHAR(20) UNIQUE NOT NULL,
                    commission_rate DECIMAL(5,2) DEFAULT 10.00,
                    total_referrals INTEGER DEFAULT 0,
                    total_earnings DECIMAL(10,2) DEFAULT 0.00,
                    status VARCHAR(20) DEFAULT 'active',
                    created_at TIMESTAMP DEFAULT NOW(),
                    CONSTRAINT commission_range CHECK (commission_rate >= 0 AND commission_rate <= 50)
                )`
            },
            {
                name: 'referrals',
                sql: `CREATE TABLE IF NOT EXISTS referrals (
                    id SERIAL PRIMARY KEY,
                    affiliate_id INTEGER REFERENCES affiliates(id),
                    referred_user_id INTEGER NOT NULL,
                    registration_date TIMESTAMP DEFAULT NOW(),
                    first_payment_date TIMESTAMP,
                    total_payments DECIMAL(10,2) DEFAULT 0.00,
                    commission_earned DECIMAL(10,2) DEFAULT 0.00,
                    status VARCHAR(20) DEFAULT 'pending'
                )`
            },
            {
                name: 'commission_payments',
                sql: `CREATE TABLE IF NOT EXISTS commission_payments (
                    id SERIAL PRIMARY KEY,
                    affiliate_id INTEGER REFERENCES affiliates(id),
                    amount DECIMAL(10,2) NOT NULL,
                    payment_method VARCHAR(50),
                    payment_details TEXT,
                    status VARCHAR(20) DEFAULT 'pending',
                    requested_at TIMESTAMP DEFAULT NOW(),
                    paid_at TIMESTAMP,
                    stripe_transfer_id VARCHAR(255)
                )`
            },
            {
                name: 'payment_history',
                sql: `CREATE TABLE IF NOT EXISTS payment_history (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    stripe_payment_intent_id VARCHAR(255),
                    amount DECIMAL(10,2) NOT NULL,
                    currency VARCHAR(3) DEFAULT 'BRL',
                    payment_type VARCHAR(50) NOT NULL,
                    status VARCHAR(20) DEFAULT 'pending',
                    coupon_id INTEGER REFERENCES coupons(id),
                    affiliate_id INTEGER REFERENCES affiliates(id),
                    metadata JSONB,
                    created_at TIMESTAMP DEFAULT NOW(),
                    completed_at TIMESTAMP
                )`
            }
        ];
        
        for (const table of tables) {
            try {
                await client.query(table.sql);
                console.log(`   ✅ Tabela ${table.name} criada/verificada`);
            } catch (error) {
                console.log(`   ❌ Erro na tabela ${table.name}: ${error.message}`);
            }
        }
        
        // Fase 2: Índices
        console.log('\n🔍 FASE 2: CRIANDO ÍNDICES...');
        
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code)',
            'CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active, valid_until)',
            'CREATE INDEX IF NOT EXISTS idx_coupon_usage_user ON coupon_usage(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_affiliates_code ON affiliates(affiliate_code)',
            'CREATE INDEX IF NOT EXISTS idx_affiliates_user ON affiliates(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_referrals_affiliate ON referrals(affiliate_id)',
            'CREATE INDEX IF NOT EXISTS idx_commission_status ON commission_payments(status)',
            'CREATE INDEX IF NOT EXISTS idx_payment_user ON payment_history(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_payment_stripe ON payment_history(stripe_payment_intent_id)',
            'CREATE INDEX IF NOT EXISTS idx_payment_status ON payment_history(status)',
            'CREATE INDEX IF NOT EXISTS idx_payment_type ON payment_history(payment_type)'
        ];
        
        for (const indexSql of indexes) {
            try {
                await client.query(indexSql);
                console.log(`   ✅ Índice criado`);
            } catch (error) {
                console.log(`   ❌ Erro no índice: ${error.message}`);
            }
        }
        
        // Fase 3: Triggers e Funções
        console.log('\n⚡ FASE 3: CRIANDO TRIGGERS...');
        
        // Função para atualizar contador de afiliados
        const updateAffiliateFunction = `
        CREATE OR REPLACE FUNCTION update_affiliate_stats()
        RETURNS TRIGGER AS $$
        BEGIN
            IF TG_OP = 'INSERT' THEN
                UPDATE affiliates 
                SET total_referrals = total_referrals + 1
                WHERE id = NEW.affiliate_id;
                RETURN NEW;
            ELSIF TG_OP = 'UPDATE' AND OLD.commission_earned != NEW.commission_earned THEN
                UPDATE affiliates 
                SET total_earnings = total_earnings + (NEW.commission_earned - OLD.commission_earned)
                WHERE id = NEW.affiliate_id;
                RETURN NEW;
            END IF;
            RETURN NULL;
        END;
        $$ LANGUAGE plpgsql;
        `;
        
        try {
            await client.query(updateAffiliateFunction);
            console.log('   ✅ Função update_affiliate_stats criada');
        } catch (error) {
            console.log(`   ❌ Erro na função: ${error.message}`);
        }
        
        // Trigger para referrals
        const referralTrigger = `
        DROP TRIGGER IF EXISTS trigger_update_affiliate_stats ON referrals;
        CREATE TRIGGER trigger_update_affiliate_stats
            AFTER INSERT OR UPDATE ON referrals
            FOR EACH ROW EXECUTE FUNCTION update_affiliate_stats();
        `;
        
        try {
            await client.query(referralTrigger);
            console.log('   ✅ Trigger de referrals criado');
        } catch (error) {
            console.log(`   ❌ Erro no trigger: ${error.message}`);
        }
        
        // Função para verificar validade do cupom
        const validateCouponFunction = `
        CREATE OR REPLACE FUNCTION validate_coupon(coupon_code VARCHAR)
        RETURNS TABLE(
            id INTEGER,
            discount_percentage DECIMAL,
            is_valid BOOLEAN,
            reason TEXT
        ) AS $$
        DECLARE
            coupon_record RECORD;
        BEGIN
            SELECT * INTO coupon_record FROM coupons WHERE code = coupon_code;
            
            IF NOT FOUND THEN
                RETURN QUERY SELECT NULL::INTEGER, NULL::DECIMAL, FALSE, 'Cupom não encontrado'::TEXT;
                RETURN;
            END IF;
            
            IF NOT coupon_record.is_active THEN
                RETURN QUERY SELECT coupon_record.id, coupon_record.discount_percentage, FALSE, 'Cupom inativo'::TEXT;
                RETURN;
            END IF;
            
            IF coupon_record.valid_until IS NOT NULL AND coupon_record.valid_until < NOW() THEN
                RETURN QUERY SELECT coupon_record.id, coupon_record.discount_percentage, FALSE, 'Cupom expirado'::TEXT;
                RETURN;
            END IF;
            
            IF coupon_record.max_uses IS NOT NULL AND coupon_record.current_uses >= coupon_record.max_uses THEN
                RETURN QUERY SELECT coupon_record.id, coupon_record.discount_percentage, FALSE, 'Cupom esgotado'::TEXT;
                RETURN;
            END IF;
            
            RETURN QUERY SELECT coupon_record.id, coupon_record.discount_percentage, TRUE, 'Cupom válido'::TEXT;
        END;
        $$ LANGUAGE plpgsql;
        `;
        
        try {
            await client.query(validateCouponFunction);
            console.log('   ✅ Função validate_coupon criada');
        } catch (error) {
            console.log(`   ❌ Erro na função validate_coupon: ${error.message}`);
        }
        
        // Fase 4: Views
        console.log('\n👁️  FASE 4: CRIANDO VIEWS...');
        
        const affiliateStatsView = `
        CREATE OR REPLACE VIEW affiliate_stats AS
        SELECT 
            a.id,
            a.user_id,
            a.affiliate_code,
            a.commission_rate,
            a.total_referrals,
            a.total_earnings,
            a.status,
            COUNT(r.id) as active_referrals,
            COALESCE(SUM(r.total_payments), 0) as total_referral_payments,
            COALESCE(AVG(r.commission_earned), 0) as avg_commission_per_referral
        FROM affiliates a
        LEFT JOIN referrals r ON a.id = r.affiliate_id
        GROUP BY a.id, a.user_id, a.affiliate_code, a.commission_rate, a.total_referrals, a.total_earnings, a.status;
        `;
        
        try {
            await client.query(affiliateStatsView);
            console.log('   ✅ View affiliate_stats criada');
        } catch (error) {
            console.log(`   ❌ Erro na view: ${error.message}`);
        }
        
        const couponStatsView = `
        CREATE OR REPLACE VIEW coupon_stats AS
        SELECT 
            c.id,
            c.code,
            c.description,
            c.discount_percentage,
            c.max_uses,
            c.current_uses,
            c.is_active,
            COUNT(cu.id) as total_usages,
            COALESCE(SUM(cu.amount), 0) as total_amount,
            COALESCE(SUM(cu.discount_amount), 0) as total_discount_given
        FROM coupons c
        LEFT JOIN coupon_usage cu ON c.id = cu.coupon_id
        GROUP BY c.id, c.code, c.description, c.discount_percentage, c.max_uses, c.current_uses, c.is_active;
        `;
        
        try {
            await client.query(couponStatsView);
            console.log('   ✅ View coupon_stats criada');
        } catch (error) {
            console.log(`   ❌ Erro na view: ${error.message}`);
        }
        
        // Fase 5: Dados iniciais
        console.log('\n🎯 FASE 5: INSERINDO DADOS INICIAIS...');
        
        const initialCoupons = [
            { code: 'WELCOME10', description: 'Cupom de boas-vindas', discount: 10 },
            { code: 'PROMO20', description: 'Promoção especial', discount: 20 },
            { code: 'VIP25', description: 'Desconto VIP', discount: 25 }
        ];
        
        for (const coupon of initialCoupons) {
            try {
                await client.query(`
                    INSERT INTO coupons (code, description, discount_percentage, max_uses, valid_until)
                    VALUES ($1, $2, $3, 100, NOW() + INTERVAL '30 days')
                    ON CONFLICT (code) DO NOTHING
                `, [coupon.code, coupon.description, coupon.discount]);
                console.log(`   ✅ Cupom ${coupon.code} inserido`);
            } catch (error) {
                console.log(`   ❌ Erro no cupom ${coupon.code}: ${error.message}`);
            }
        }
        
        // Verificação final
        console.log('\n🔍 VERIFICAÇÃO FINAL...');
        
        const tableCheck = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('coupons', 'coupon_usage', 'affiliates', 'referrals', 'commission_payments', 'user_subscriptions', 'payment_history')
            ORDER BY table_name
        `);
        
        console.log(`📊 Tabelas criadas: ${tableCheck.rows.length}/7`);
        tableCheck.rows.forEach(row => {
            console.log(`   ✅ ${row.table_name}`);
        });
        
        const viewCheck = await client.query(`
            SELECT table_name 
            FROM information_schema.views 
            WHERE table_schema = 'public' 
            AND table_name IN ('affiliate_stats', 'coupon_stats')
        `);
        
        console.log(`📈 Views criadas: ${viewCheck.rows.length}/2`);
        viewCheck.rows.forEach(row => {
            console.log(`   ✅ ${row.table_name}`);
        });
        
        const couponCount = await client.query('SELECT COUNT(*) as count FROM coupons');
        console.log(`🎫 Cupons iniciais: ${couponCount.rows[0].count}`);
        
        console.log('\n🎉 MIGRAÇÃO FINANCEIRA CONCLUÍDA COM SUCESSO!');
        
    } catch (error) {
        console.error('❌ ERRO CRÍTICO NA MIGRAÇÃO:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await client.end();
        console.log('🔌 Conexão com banco encerrada');
    }
}

runFinancialMigration();
