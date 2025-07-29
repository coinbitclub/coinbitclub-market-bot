/**
 * 🔧 MIGRAÇÃO SIMPLES - CORREÇÃO MONITOR
 * =====================================
 * Corrige problemas básicos do banco
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://coinbitclub_user:W0lvxNw7OQCNRGiUPh9S@coinbitclub-db.railway.app:5432/coinbitclub_db',
    ssl: { rejectUnauthorized: false }
});

async function corrigirBanco() {
    console.log('🔧 Corrigindo banco de dados...\n');
    
    try {
        // 1. Adicionar coluna closing_reason
        console.log('📝 1. Verificando/adicionando closing_reason...');
        await pool.query(`
            ALTER TABLE user_operations 
            ADD COLUMN IF NOT EXISTS closing_reason VARCHAR(50) DEFAULT NULL
        `);
        console.log('✅ closing_reason OK!');
        
        // 2. Verificar se commission_calculations existe
        console.log('\n📝 2. Verificando tabela commission_calculations...');
        const tableExists = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'commission_calculations'
            )
        `);
        
        if (!tableExists.rows[0].exists) {
            console.log('📝 Criando tabela commission_calculations...');
            await pool.query(`
                CREATE TABLE commission_calculations (
                    id SERIAL PRIMARY KEY,
                    operation_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    commission_amount DECIMAL(10,2) NOT NULL,
                    commission_type VARCHAR(20) NOT NULL DEFAULT 'REFERENT',
                    is_referent BOOLEAN NOT NULL DEFAULT TRUE,
                    counts_for_affiliate BOOLEAN NOT NULL DEFAULT FALSE,
                    counts_for_refund BOOLEAN NOT NULL DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            `);
            console.log('✅ Tabela commission_calculations criada!');
        } else {
            console.log('✅ Tabela commission_calculations já existe!');
        }
        
        // 3. Testar INSERT na tabela
        console.log('\n📝 3. Testando estrutura...');
        const testResult = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'user_operations' 
            AND column_name = 'closing_reason'
        `);
        
        if (testResult.rows.length > 0) {
            console.log('✅ Coluna closing_reason confirmada!');
        } else {
            console.log('⚠️ Problema com closing_reason');
        }
        
        console.log('\n✅ CORREÇÃO COMPLETADA!');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

if (require.main === module) {
    corrigirBanco();
}

module.exports = { corrigirBanco };
