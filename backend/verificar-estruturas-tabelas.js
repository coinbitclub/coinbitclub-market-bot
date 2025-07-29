/**
 * 🔍 VERIFICAR ESTRUTURA DAS TABELAS EXISTENTES
 * Script para verificar as colunas das tabelas user_api_keys e user_trading_params
 */

const { Pool } = require('pg');

console.log('🔍 VERIFICAÇÃO DAS ESTRUTURAS DAS TABELAS');
console.log('========================================');

async function verificarEstruturasTabelas() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
        ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();
    
    try {
        console.log('🔗 Conectado ao PostgreSQL Railway');
        console.log('');
        
        // ========================================
        // 1. VERIFICAR ESTRUTURA USER_API_KEYS
        // ========================================
        console.log('🔐 Estrutura da tabela USER_API_KEYS:');
        
        const colunasApiKeys = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'user_api_keys' AND table_schema = 'public'
            ORDER BY ordinal_position;
        `);
        
        console.table(colunasApiKeys.rows);
        
        // ========================================
        // 2. VERIFICAR ESTRUTURA USER_TRADING_PARAMS
        // ========================================
        console.log('⚙️ Estrutura da tabela USER_TRADING_PARAMS:');
        
        const colunasTradingParams = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'user_trading_params' AND table_schema = 'public'
            ORDER BY ordinal_position;
        `);
        
        console.table(colunasTradingParams.rows);
        
        // ========================================
        // 3. VERIFICAR DADOS EXISTENTES
        // ========================================
        console.log('📊 Dados existentes:');
        
        const dadosApiKeys = await client.query('SELECT COUNT(*) as total FROM user_api_keys;');
        const dadosTradingParams = await client.query('SELECT COUNT(*) as total FROM user_trading_params;');
        
        console.log(`🔐 user_api_keys: ${dadosApiKeys.rows[0].total} registros`);
        console.log(`⚙️ user_trading_params: ${dadosTradingParams.rows[0].total} registros`);
        
        // ========================================
        // 4. MOSTRAR EXEMPLO DE DADOS
        // ========================================
        if (parseInt(dadosApiKeys.rows[0].total) > 0) {
            console.log('\n🔐 Primeiros registros de user_api_keys:');
            const exemploApiKeys = await client.query('SELECT * FROM user_api_keys LIMIT 3;');
            console.table(exemploApiKeys.rows);
        }
        
        if (parseInt(dadosTradingParams.rows[0].total) > 0) {
            console.log('\n⚙️ Primeiros registros de user_trading_params:');
            const exemploTradingParams = await client.query('SELECT * FROM user_trading_params LIMIT 3;');
            console.table(exemploTradingParams.rows);
        }
        
    } catch (error) {
        console.error('❌ Erro ao verificar estruturas:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// ========================================
// 🚀 EXECUTAR VERIFICAÇÃO
// ========================================
if (require.main === module) {
    verificarEstruturasTabelas()
        .then(() => {
            console.log('\n✅ Verificação executada com sucesso!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Erro na execução:', error.message);
            process.exit(1);
        });
}

module.exports = { verificarEstruturasTabelas };
