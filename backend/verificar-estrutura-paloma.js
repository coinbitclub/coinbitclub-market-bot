/**
 * 🔍 VERIFICAR ESTRUTURA DAS TABELAS
 * Para entender como configurar corretamente a conta da Paloma
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function verificarEstruturaTabelasPaloma() {
    try {
        console.log('🔍 VERIFICANDO ESTRUTURA DAS TABELAS');
        console.log('='.repeat(50));
        
        // 1. Verificar tabela user_api_keys
        console.log('🔑 ESTRUTURA DA TABELA user_api_keys:');
        const apiKeysQuery = `
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'user_api_keys'
            ORDER BY ordinal_position;
        `;
        
        const apiKeysResult = await pool.query(apiKeysQuery);
        if (apiKeysResult.rows.length > 0) {
            apiKeysResult.rows.forEach(col => {
                console.log(`   ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
            });
        } else {
            console.log('   ❌ Tabela user_api_keys não existe');
        }
        
        // 2. Verificar tabela user_balances
        console.log('\n💰 ESTRUTURA DA TABELA user_balances:');
        const balancesQuery = `
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'user_balances'
            ORDER BY ordinal_position;
        `;
        
        const balancesResult = await pool.query(balancesQuery);
        if (balancesResult.rows.length > 0) {
            balancesResult.rows.forEach(col => {
                console.log(`   ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
            });
        } else {
            console.log('   ❌ Tabela user_balances não existe');
        }
        
        // 3. Verificar tabela user_operations
        console.log('\n📊 ESTRUTURA DA TABELA user_operations:');
        const operationsQuery = `
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'user_operations'
            ORDER BY ordinal_position;
        `;
        
        const operationsResult = await pool.query(operationsQuery);
        if (operationsResult.rows.length > 0) {
            operationsResult.rows.forEach(col => {
                console.log(`   ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
            });
        } else {
            console.log('   ❌ Tabela user_operations não existe');
        }
        
        // 4. Verificar dados atuais da Paloma
        console.log('\n👤 DADOS ATUAIS DA PALOMA:');
        const palomaQuery = `
            SELECT id, name, email 
            FROM users 
            WHERE email = 'pamaral15@hotmail.com';
        `;
        
        const palomaResult = await pool.query(palomaQuery);
        if (palomaResult.rows.length > 0) {
            const paloma = palomaResult.rows[0];
            console.log(`   ID: ${paloma.id}`);
            console.log(`   Nome: ${paloma.name}`);
            console.log(`   Email: ${paloma.email}`);
            
            // Verificar saldo atual
            const saldoQuery = `
                SELECT balance, available_balance, locked_balance, updated_at
                FROM user_balances 
                WHERE user_id = $1;
            `;
            
            const saldoResult = await pool.query(saldoQuery, [paloma.id]);
            if (saldoResult.rows.length > 0) {
                const saldo = saldoResult.rows[0];
                console.log(`   💰 Saldo: $${saldo.balance}`);
                console.log(`   💰 Disponível: $${saldo.available_balance}`);
                console.log(`   🔒 Bloqueado: $${saldo.locked_balance}`);
                console.log(`   ⏰ Atualizado: ${saldo.updated_at}`);
            } else {
                console.log('   ❌ Sem dados de saldo');
            }
            
            // Verificar operações
            const opsQuery = `
                SELECT COUNT(*) as total,
                       COUNT(CASE WHEN status = 'open' THEN 1 END) as abertas
                FROM user_operations 
                WHERE user_id = $1;
            `;
            
            const opsResult = await pool.query(opsQuery, [paloma.id]);
            const ops = opsResult.rows[0];
            console.log(`   📊 Operações total: ${ops.total}`);
            console.log(`   📈 Operações abertas: ${ops.abertas}`);
            
        } else {
            console.log('   ❌ Paloma não encontrada');
        }
        
        console.log('\n✅ VERIFICAÇÃO CONCLUÍDA');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        console.error(error);
    } finally {
        await pool.end();
    }
}

verificarEstruturaTabelasPaloma();
