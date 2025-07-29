/**
 * CORRETOR DE ESQUEMA PARA DASHBOARD
 * ===================================
 * Corrige incompatibilidades de colunas detectadas no dashboard
 */

const { Pool } = require('pg');

const pool = new Pool({
    host: 'monorail.proxy.rlwy.net',
    port: 33325,
    user: 'postgres',
    password: 'PZlSCzzKdQMRvOqPaIgCnzEhKBMngjLT',
    database: 'railway',
    ssl: { rejectUnauthorized: false }
});

async function corrigirEsquemaAfiliados() {
    const client = await pool.connect();
    
    try {
        console.log('🔧 INICIANDO CORREÇÃO DO ESQUEMA');
        
        // 1. Verificar e criar coluna total_earnings na tabela affiliates
        console.log('📊 Verificando tabela affiliates...');
        
        const checkAffiliatesQuery = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'affiliates' 
            AND column_name = 'total_earnings'
        `;
        
        const affiliatesCheck = await client.query(checkAffiliatesQuery);
        
        if (affiliatesCheck.rows.length === 0) {
            console.log('➕ Adicionando coluna total_earnings...');
            await client.query(`
                ALTER TABLE affiliates 
                ADD COLUMN total_earnings DECIMAL(15,2) DEFAULT 0.00
            `);
            console.log('✅ Coluna total_earnings adicionada');
        } else {
            console.log('✅ Coluna total_earnings já existe');
        }
        
        // 2. Verificar e criar coluna commission_amount na tabela user_operations
        console.log('📊 Verificando tabela user_operations...');
        
        const checkCommissionQuery = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'user_operations' 
            AND column_name = 'commission_amount'
        `;
        
        const commissionCheck = await client.query(checkCommissionQuery);
        
        if (commissionCheck.rows.length === 0) {
            console.log('➕ Adicionando coluna commission_amount...');
            await client.query(`
                ALTER TABLE user_operations 
                ADD COLUMN commission_amount DECIMAL(15,2) DEFAULT 0.00
            `);
            console.log('✅ Coluna commission_amount adicionada');
        } else {
            console.log('✅ Coluna commission_amount já existe');
        }
        
        // 3. Verificar tipo da coluna affiliate_id
        console.log('📊 Verificando tipo da coluna affiliate_id...');
        
        const checkAffiliateIdQuery = `
            SELECT data_type 
            FROM information_schema.columns 
            WHERE table_name = 'affiliates' 
            AND column_name = 'affiliate_id'
        `;
        
        const affiliateIdCheck = await client.query(checkAffiliateIdQuery);
        
        if (affiliateIdCheck.rows.length > 0) {
            console.log(`📋 Tipo da coluna affiliate_id: ${affiliateIdCheck.rows[0].data_type}`);
            
            // Se for UUID, vamos criar um índice para melhor performance
            if (affiliateIdCheck.rows[0].data_type === 'uuid') {
                try {
                    await client.query(`
                        CREATE INDEX IF NOT EXISTS idx_affiliates_affiliate_id 
                        ON affiliates(affiliate_id)
                    `);
                    console.log('✅ Índice criado para affiliate_id');
                } catch (err) {
                    console.log('⚠️ Índice já existe ou erro na criação');
                }
            }
        }
        
        // 4. Verificar estrutura da tabela payments
        console.log('📊 Verificando tabela payments...');
        
        const checkPaymentsQuery = `
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'payments'
            ORDER BY ordinal_position
        `;
        
        const paymentsCheck = await client.query(checkPaymentsQuery);
        console.log('📋 Estrutura da tabela payments:');
        paymentsCheck.rows.forEach(row => {
            console.log(`   ${row.column_name}: ${row.data_type}`);
        });
        
        // 5. Atualizar total_earnings baseado nas comissões existentes
        console.log('💰 Calculando total_earnings dos afiliados...');
        
        await client.query(`
            UPDATE affiliates 
            SET total_earnings = COALESCE((
                SELECT SUM(commission_amount) 
                FROM user_operations uo 
                WHERE uo.user_id::text = affiliates.affiliate_id::text
                AND commission_amount > 0
            ), 0)
        `);
        
        console.log('✅ Total_earnings atualizado');
        
        // 6. Criar view para facilitar consultas do dashboard
        console.log('📊 Criando view do dashboard...');
        
        await client.query(`
            CREATE OR REPLACE VIEW dashboard_operations AS
            SELECT 
                uo.*,
                u.username,
                u.account_type,
                CASE 
                    WHEN p.payment_method = 'STRIPE' THEN 'REAL'
                    ELSE 'BONUS'
                END as revenue_type
            FROM user_operations uo
            LEFT JOIN users u ON u.id = uo.user_id
            LEFT JOIN payments p ON p.user_id = uo.user_id
        `);
        
        console.log('✅ View dashboard_operations criada');
        
        console.log('🎉 CORREÇÃO DO ESQUEMA CONCLUÍDA COM SUCESSO!');
        
    } catch (error) {
        console.error('❌ Erro na correção do esquema:', error);
    } finally {
        client.release();
    }
}

async function testarEstrutura() {
    const client = await pool.connect();
    
    try {
        console.log('\n🔍 TESTANDO ESTRUTURA CORRIGIDA');
        
        // Teste 1: Operações por tipo de receita
        console.log('📊 Teste 1: Operações por tipo de receita');
        const operationsTest = await client.query(`
            SELECT 
                CASE 
                    WHEN p.payment_method = 'STRIPE' THEN 'REAL'
                    ELSE 'BONUS'
                END as revenue_type,
                COUNT(*) as total_operations,
                AVG(profit_loss) as avg_result
            FROM user_operations uo
            LEFT JOIN payments p ON p.user_id = uo.user_id
            WHERE uo.created_at >= NOW() - INTERVAL '7 days'
            GROUP BY revenue_type
        `);
        
        console.log('✅ Teste operações por tipo:', operationsTest.rows);
        
        // Teste 2: Indicadores financeiros
        console.log('📊 Teste 2: Indicadores financeiros');
        const financialTest = await client.query(`
            SELECT 
                COUNT(*) as total_operations,
                SUM(COALESCE(commission_amount, 0)) as total_commissions,
                AVG(profit_loss) as avg_profit
            FROM user_operations
            WHERE created_at >= NOW() - INTERVAL '30 days'
        `);
        
        console.log('✅ Teste indicadores financeiros:', financialTest.rows);
        
        // Teste 3: Dashboard de afiliados
        console.log('📊 Teste 3: Dashboard de afiliados');
        const affiliatesTest = await client.query(`
            SELECT 
                affiliate_id,
                referral_count,
                commission_rate,
                total_earnings,
                created_at
            FROM affiliates
            LIMIT 5
        `);
        
        console.log('✅ Teste dashboard afiliados:', affiliatesTest.rows);
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    } finally {
        client.release();
    }
}

// Executar correções
async function main() {
    await corrigirEsquemaAfiliados();
    await testarEstrutura();
    await pool.end();
}

main();
