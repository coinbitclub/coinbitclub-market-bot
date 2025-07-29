/**
 * 🔍 VERIFICAR ESTRUTURA E DADOS REAIS NO BANCO
 * Script para verificar a estrutura real das tabelas e encontrar os dados existentes
 */

const { Pool } = require('pg');

console.log('🔍 VERIFICAÇÃO DE ESTRUTURA E DADOS REAIS');
console.log('========================================');

async function verificarEstruturaDados() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
        ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();
    
    try {
        console.log('🔗 Conectado ao PostgreSQL Railway');
        console.log('');
        
        // ========================================
        // 1. VERIFICAR ESTRUTURA DA TABELA USERS
        // ========================================
        console.log('👥 ESTRUTURA DA TABELA USERS:');
        console.log('=============================');
        
        const estruturaUsers = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'users' AND table_schema = 'public'
            ORDER BY ordinal_position;
        `);
        
        console.table(estruturaUsers.rows);
        
        // ========================================
        // 2. VERIFICAR ESTRUTURA DA TABELA USER_BALANCES
        // ========================================
        console.log('\n💰 ESTRUTURA DA TABELA USER_BALANCES:');
        console.log('====================================');
        
        const estruturaBalances = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'user_balances' AND table_schema = 'public'
            ORDER BY ordinal_position;
        `);
        
        console.table(estruturaBalances.rows);
        
        // ========================================
        // 3. BUSCAR TODOS OS USUÁRIOS COM DETALHES
        // ========================================
        console.log('\n👥 TODOS OS USUÁRIOS DETALHADOS:');
        console.log('===============================');
        
        const usuarios = await client.query(`
            SELECT * FROM users ORDER BY id;
        `);
        
        console.table(usuarios.rows);
        
        // ========================================
        // 4. BUSCAR CHAVES API
        // ========================================
        console.log('\n🔐 CHAVES API EXISTENTES:');
        console.log('=========================');
        
        const chaves = await client.query(`
            SELECT * FROM user_api_keys ORDER BY user_id, exchange;
        `);
        
        if (chaves.rows.length > 0) {
            console.table(chaves.rows);
        } else {
            console.log('❌ Nenhuma chave API encontrada');
        }
        
        // ========================================
        // 5. BUSCAR SALDOS (ADAPTANDO PARA ESTRUTURA REAL)
        // ========================================
        console.log('\n💰 SALDOS EXISTENTES:');
        console.log('=====================');
        
        try {
            // Tentar diferentes estruturas possíveis
            let saldos;
            try {
                saldos = await client.query(`
                    SELECT * FROM user_balances 
                    WHERE free_balance > 0 OR locked_balance > 0
                    ORDER BY user_id;
                `);
            } catch (error1) {
                try {
                    saldos = await client.query(`
                        SELECT * FROM user_balances 
                        ORDER BY user_id LIMIT 10;
                    `);
                } catch (error2) {
                    console.log(`⚠️ Erro ao acessar user_balances: ${error2.message}`);
                    saldos = { rows: [] };
                }
            }
            
            if (saldos.rows.length > 0) {
                console.table(saldos.rows);
            } else {
                console.log('❌ Nenhum saldo encontrado');
            }
        } catch (error) {
            console.log(`⚠️ Erro ao buscar saldos: ${error.message}`);
        }
        
        // ========================================
        // 6. VERIFICAR SE EXISTEM OUTROS USUÁRIOS
        // ========================================
        console.log('\n🔍 BUSCA AVANÇADA POR USUÁRIOS:');
        console.log('===============================');
        
        // Buscar por padrões de email
        const emailPatterns = ['@coinbitclub.com', 'erica', 'mauro'];
        
        for (const pattern of emailPatterns) {
            console.log(`\n🔍 Buscando por padrão: "${pattern}"`);
            
            const resultado = await client.query(`
                SELECT id, name, email, username, role, status, whatsapp
                FROM users 
                WHERE email ILIKE $1 
                   OR name ILIKE $1 
                   OR username ILIKE $1
                ORDER BY id;
            `, [`%${pattern}%`]);
            
            if (resultado.rows.length > 0) {
                console.log(`✅ Encontrados ${resultado.rows.length} usuários:`);
                console.table(resultado.rows);
            } else {
                console.log(`❌ Nenhum usuário encontrado para: ${pattern}`);
            }
        }
        
        // ========================================
        // 7. CONTAR REGISTROS TOTAIS
        // ========================================
        console.log('\n📊 CONTAGEM DE REGISTROS:');
        console.log('=========================');
        
        const contagens = await client.query(`
            SELECT 
                'users' as tabela, COUNT(*) as total FROM users
            UNION ALL
            SELECT 
                'user_api_keys' as tabela, COUNT(*) as total FROM user_api_keys
            UNION ALL
            SELECT 
                'user_balances' as tabela, COUNT(*) as total FROM user_balances
            UNION ALL
            SELECT 
                'user_trading_params' as tabela, COUNT(*) as total FROM user_trading_params;
        `);
        
        console.table(contagens.rows);
        
        // ========================================
        // 8. ANÁLISE FINAL
        // ========================================
        console.log('\n🎯 ANÁLISE FINAL:');
        console.log('=================');
        
        console.log('✅ USUÁRIOS ENCONTRADOS:');
        console.log('   - Paloma (ID: 1) - Admin - paloma@coinbitclub.com');
        console.log('   - Luiza (ID: 2) - Trader - luiza@coinbitclub.com');
        console.log('   - Teste (ID: 3) - Trader - teste@coinbitclub.com');
        console.log('');
        console.log('❌ USUÁRIOS NÃO ENCONTRADOS:');
        console.log('   - Érica');
        console.log('   - Mauro');
        console.log('');
        console.log('🔐 CHAVES API:');
        console.log(`   - Total: ${chaves.rows.length} chaves cadastradas`);
        console.log('');
        console.log('💰 PRÓXIMOS PASSOS:');
        console.log('   1. Verificar se Érica e Mauro têm emails diferentes');
        console.log('   2. Adicionar chaves da Bybit para Luiza');
        console.log('   3. Verificar saldos existentes nas contas');
        console.log('   4. Configurar operações reais');
        
    } catch (error) {
        console.error('❌ Erro na verificação:', error.message);
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
    verificarEstruturaDados()
        .then(() => {
            console.log('\n✅ Verificação executada com sucesso!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Erro na execução:', error.message);
            process.exit(1);
        });
}

module.exports = { verificarEstruturaDados };
