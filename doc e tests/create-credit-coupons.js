/**
 * CRIAR CUPONS DE CRÉDITO DIRETO - MarketBot
 * Cupons que dão crédito direto na carteira do usuário
 */

const { Pool } = require('pg');
require('dotenv').config();

// Configuração do banco
const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    ssl: { rejectUnauthorized: false }
});

async function createCreditCoupons() {
    try {
        console.log('🎫 CRIANDO CUPONS DE CRÉDITO DIRETO...');
        console.log('======================================');

        // Cupom 1: R$ 250 de crédito (usando discount_percentage = 99 como marcador especial)
        console.log('\n💰 Criando cupom de R$ 250...');
        const couponBRL = await pool.query(`
            INSERT INTO coupons (
                code, 
                description,
                discount_percentage,
                max_uses,
                valid_from,
                valid_until,
                is_active,
                created_by
            ) VALUES (
                'CREDIT250BRL',
                'CUPOM ESPECIAL: R$ 250 de crédito direto na carteira. Use: CREDIT250BRL',
                99,
                100,
                NOW(),
                '2025-12-31 23:59:59',
                true,
                1
            ) RETURNING *;
        `);

        console.log('✅ Cupom R$ 250 criado:');
        console.log(`   Código: ${couponBRL.rows[0].code}`);
        console.log(`   Descrição: ${couponBRL.rows[0].description}`);
        console.log(`   Valor: R$ 250 (crédito direto - marcador: 99%)`);
        console.log(`   Máximo usos: ${couponBRL.rows[0].max_uses}`);
        console.log(`   Válido até: ${couponBRL.rows[0].valid_until}`);

        // Cupom 2: USD $50 de crédito (usando discount_percentage = 98 como marcador especial)
        console.log('\n💰 Criando cupom de $50 USD...');
        const couponUSD = await pool.query(`
            INSERT INTO coupons (
                code, 
                description,
                discount_percentage,
                max_uses,
                valid_from,
                valid_until,
                is_active,
                created_by
            ) VALUES (
                'CREDIT50USD',
                'CUPOM ESPECIAL: $50 USD de crédito direto na carteira. Use: CREDIT50USD',
                98,
                100,
                NOW(),
                '2025-12-31 23:59:59',
                true,
                1
            ) RETURNING *;
        `);

        console.log('✅ Cupom $50 USD criado:');
        console.log(`   Código: ${couponUSD.rows[0].code}`);
        console.log(`   Descrição: ${couponUSD.rows[0].description}`);
        console.log(`   Valor: $50 USD (crédito direto - marcador: 98%)`);
        console.log(`   Máximo usos: ${couponUSD.rows[0].max_uses}`);
        console.log(`   Válido até: ${couponUSD.rows[0].valid_until}`);

        // Verificar se os cupons foram criados corretamente
        console.log('\n🔍 Verificando cupons criados...');
        const verification = await pool.query(`
            SELECT 
                code,
                description,
                discount_percentage,
                max_uses,
                current_uses,
                is_active,
                valid_until
            FROM coupons 
            WHERE code IN ('CREDIT250BRL', 'CREDIT50USD')
            ORDER BY code;
        `);

        console.log('\n📋 CUPONS DE CRÉDITO CRIADOS COM SUCESSO:');
        console.log('==========================================');
        
        verification.rows.forEach((coupon, index) => {
            const isBRL = coupon.code.includes('BRL');
            const creditAmount = isBRL ? 'R$ 250' : '$50 USD';
            console.log(`\n${index + 1}. 🎫 ${coupon.code}`);
            console.log(`   💰 Valor: ${creditAmount} (crédito direto)`);
            console.log(`   📝 Descrição: ${coupon.description}`);
            console.log(`   🔢 Usos disponíveis: ${coupon.max_uses - coupon.current_uses}/${coupon.max_uses}`);
            console.log(`   ✅ Status: ${coupon.is_active ? 'Ativo' : 'Inativo'}`);
            console.log(`   📅 Válido até: ${coupon.valid_until}`);
        });

        console.log('\n🚀 INSTRUÇÕES DE USO:');
        console.log('=====================');
        console.log('');
        console.log('🎫 Para usar o cupom de R$ 250:');
        console.log('   Código: CREDIT250BRL');
        console.log('   GET /api/v1/coupons-affiliates/validate-coupon/CREDIT250BRL');
        console.log('');
        console.log('🎫 Para usar o cupom de $50 USD:');
        console.log('   Código: CREDIT50USD');
        console.log('   GET /api/v1/coupons-affiliates/validate-coupon/CREDIT50USD');
        console.log('');
        console.log('💡 Estes cupons adicionam crédito diretamente na carteira do usuário!');
        console.log('🔄 Cada cupom pode ser usado 100 vezes até 31/12/2025');

    } catch (error) {
        console.error('❌ Erro ao criar cupons:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await pool.end();
    }
}

// Executar
createCreditCoupons();
