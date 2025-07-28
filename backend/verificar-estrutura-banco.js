/**
 * 🔍 VERIFICAR ESTRUTURA DO BANCO - PALOMA E LUIZA
 * Descobrir colunas corretas e encontrar usuárias
 */

const { Client } = require('pg');

const DATABASE_CONFIG = {
    host: 'yamabiko.proxy.rlwy.net',
    port: 32866,
    database: 'railway',
    user: 'postgres',
    password: 'TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS',
    ssl: false,
    connectionTimeoutMillis: 30000
};

async function exploreDatabase() {
    const client = new Client(DATABASE_CONFIG);
    
    try {
        console.log('🔗 Conectando ao banco Railway...');
        await client.connect();
        console.log('✅ Conectado com sucesso');

        // 1. Listar todas as tabelas
        console.log('\n📋 TABELAS DISPONÍVEIS:');
        const tablesQuery = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `;
        
        const tablesResult = await client.query(tablesQuery);
        tablesResult.rows.forEach(row => {
            console.log(`   📄 ${row.table_name}`);
        });

        // 2. Verificar estrutura da tabela users
        console.log('\n👥 ESTRUTURA DA TABELA USERS:');
        const usersColumnsQuery = `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'users' AND table_schema = 'public'
            ORDER BY ordinal_position;
        `;
        
        const usersColumnsResult = await client.query(usersColumnsQuery);
        if (usersColumnsResult.rows.length > 0) {
            usersColumnsResult.rows.forEach(col => {
                console.log(`   🔸 ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? '- NOT NULL' : ''}`);
            });
        } else {
            console.log('   ⚠️ Tabela users não encontrada');
        }

        // 3. Verificar se existe tabela de créditos/balances
        console.log('\n💰 TABELAS RELACIONADAS A CRÉDITOS:');
        const creditTablesQuery = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND (table_name LIKE '%credit%' OR table_name LIKE '%balance%' OR table_name LIKE '%wallet%')
            ORDER BY table_name;
        `;
        
        const creditTablesResult = await client.query(creditTablesQuery);
        if (creditTablesResult.rows.length > 0) {
            for (const table of creditTablesResult.rows) {
                console.log(`\n📊 TABELA: ${table.table_name}`);
                
                const columnsQuery = `
                    SELECT column_name, data_type
                    FROM information_schema.columns 
                    WHERE table_name = $1 AND table_schema = 'public'
                    ORDER BY ordinal_position;
                `;
                
                const columnsResult = await client.query(columnsQuery, [table.table_name]);
                columnsResult.rows.forEach(col => {
                    console.log(`   🔸 ${col.column_name} (${col.data_type})`);
                });
            }
        } else {
            console.log('   ⚠️ Nenhuma tabela de créditos encontrada');
        }

        // 4. Buscar usuárias Paloma e Luiza com todas as colunas disponíveis
        console.log('\n🔍 BUSCANDO PALOMA E LUIZA:');
        try {
            const searchQuery = `
                SELECT * FROM users 
                WHERE LOWER(name) LIKE '%paloma%' OR LOWER(name) LIKE '%luiza%'
                ORDER BY name;
            `;
            
            const searchResult = await client.query(searchQuery);
            
            if (searchResult.rows.length > 0) {
                console.log(`✅ ${searchResult.rows.length} usuárias encontradas:`);
                
                searchResult.rows.forEach(user => {
                    console.log(`\n👤 USUÁRIA: ${user.name}`);
                    Object.keys(user).forEach(key => {
                        if (user[key] !== null) {
                            console.log(`   ${key}: ${user[key]}`);
                        }
                    });
                });
            } else {
                console.log('⚠️ Nenhuma usuária encontrada com os nomes especificados');
                
                // Mostrar algumas usuárias para referência
                console.log('\n📋 PRIMEIRAS 5 USUÁRIAS CADASTRADAS:');
                const allUsersQuery = 'SELECT * FROM users ORDER BY created_at LIMIT 5';
                const allUsersResult = await client.query(allUsersQuery);
                
                allUsersResult.rows.forEach((user, index) => {
                    console.log(`\n${index + 1}. ${user.name || 'Nome não informado'}`);
                    console.log(`   ID: ${user.id}`);
                    console.log(`   Email: ${user.email || 'Email não informado'}`);
                });
            }
        } catch (searchError) {
            console.error('❌ Erro ao buscar usuárias:', searchError.message);
        }

        // 5. Verificar tabela user_balances se existir
        console.log('\n💳 VERIFICANDO USER_BALANCES:');
        try {
            const balancesQuery = `
                SELECT column_name, data_type
                FROM information_schema.columns 
                WHERE table_name = 'user_balances' AND table_schema = 'public'
                ORDER BY ordinal_position;
            `;
            
            const balancesResult = await client.query(balancesQuery);
            if (balancesResult.rows.length > 0) {
                console.log('📊 Estrutura da tabela user_balances:');
                balancesResult.rows.forEach(col => {
                    console.log(`   🔸 ${col.column_name} (${col.data_type})`);
                });
                
                // Verificar se Paloma e Luiza têm registros
                const userBalancesQuery = `
                    SELECT ub.*, u.name 
                    FROM user_balances ub
                    JOIN users u ON ub.user_id = u.id
                    WHERE LOWER(u.name) LIKE '%paloma%' OR LOWER(u.name) LIKE '%luiza%';
                `;
                
                const userBalancesResult = await client.query(userBalancesQuery);
                if (userBalancesResult.rows.length > 0) {
                    console.log('💰 Saldos encontrados:');
                    userBalancesResult.rows.forEach(balance => {
                        console.log(`   👤 ${balance.name}: R$ ${balance.balance || 0}`);
                    });
                } else {
                    console.log('⚠️ Nenhum saldo encontrado para Paloma e Luiza');
                }
            } else {
                console.log('⚠️ Tabela user_balances não existe');
            }
        } catch (balanceError) {
            console.log('⚠️ Tabela user_balances não encontrada ou erro ao acessar');
        }

    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    } finally {
        await client.end();
    }
}

// Executar
if (require.main === module) {
    exploreDatabase().catch(console.error);
}

module.exports = { exploreDatabase };
