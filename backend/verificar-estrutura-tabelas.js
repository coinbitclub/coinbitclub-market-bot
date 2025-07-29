/**
 * 🔍 VERIFICAÇÃO DA ESTRUTURA DAS TABELAS
 * =======================================
 */

const { Pool } = require('pg');

async function verificarEstrutura() {
    console.log('🔍 VERIFICAÇÃO DA ESTRUTURA DAS TABELAS');
    console.log('======================================');
    
    const pool = new Pool({
        connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
        ssl: { rejectUnauthorized: false }
    });
    
    try {
        const tabelas = ['users', 'user_api_keys', 'user_trading_params', 'user_balances', 'affiliates', 'subscriptions'];
        
        for (const tabela of tabelas) {
            console.log(`\n📋 ESTRUTURA: ${tabela.toUpperCase()}`);
            console.log('─'.repeat(50));
            
            const colunas = await pool.query(`
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = $1 AND table_schema = 'public'
                ORDER BY ordinal_position
            `, [tabela]);
            
            if (colunas.rows.length > 0) {
                colunas.rows.forEach(col => {
                    const nullable = col.is_nullable === 'YES' ? '' : ' (NOT NULL)';
                    const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
                    console.log(`  ${col.column_name}: ${col.data_type}${nullable}${defaultVal}`);
                });
            } else {
                console.log('  ❌ Tabela não encontrada');
            }
        }
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

verificarEstrutura();
