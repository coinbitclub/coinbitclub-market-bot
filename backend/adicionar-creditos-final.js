/**
 * 💰 ADICIONAR CRÉDITOS FINAL - PALOMA E LUIZA
 * Usando estrutura correta do banco Railway
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

/**
 * 🔍 Buscar usuárias e seus saldos atuais
 */
async function findUsersAndBalances() {
    const client = new Client(DATABASE_CONFIG);
    
    try {
        await client.connect();
        
        console.log('🔍 Buscando Paloma e Luiza...');
        
        const query = `
            SELECT 
                u.id,
                u.name,
                u.email,
                u.status,
                ub.test_credit_balance,
                ub.currency,
                ub.id as balance_id
            FROM users u
            LEFT JOIN user_balances ub ON u.id = ub.user_id AND ub.currency = 'BRL'
            WHERE LOWER(u.name) LIKE '%paloma%' OR LOWER(u.name) LIKE '%luiza%'
            ORDER BY u.name;
        `;
        
        const result = await client.query(query);
        
        if (result.rows.length > 0) {
            console.log(`✅ ${result.rows.length} usuárias encontradas:`);
            
            result.rows.forEach(user => {
                console.log(`👤 ${user.name}`);
                console.log(`   ID: ${user.id}`);
                console.log(`   Email: ${user.email}`);
                console.log(`   Status: ${user.status}`);
                console.log(`   Saldo atual: R$ ${user.test_credit_balance || 0}`);
                console.log(`   Balance ID: ${user.balance_id || 'NÃO EXISTE'}`);
                console.log('');
            });
            
            return result.rows;
        } else {
            console.log('⚠️ Nenhuma usuária encontrada');
            return [];
        }

    } catch (error) {
        console.error('❌ Erro ao buscar usuárias:', error.message);
        return [];
    } finally {
        await client.end();
    }
}

/**
 * 🆕 Criar registro na tabela user_balances se não existir
 */
async function createUserBalance(userId, userName) {
    const client = new Client(DATABASE_CONFIG);
    
    try {
        await client.connect();
        
        console.log(`📝 Criando registro de saldo para ${userName}...`);
        
        const insertQuery = `
            INSERT INTO user_balances (
                id, user_id, currency, available_balance, locked_balance, 
                pending_balance, total_deposits, total_withdrawals, 
                test_credit_balance, test_credit_used, prepaid_balance,
                total_profit, total_loss, pending_commission, paid_commission,
                created_at, last_updated
            ) VALUES (
                gen_random_uuid(), $1, 'BRL', 0, 0, 
                0, 0, 0, 
                0, 0, 0,
                0, 0, 0, 0,
                NOW(), NOW()
            ) RETURNING id;
        `;
        
        const result = await client.query(insertQuery, [userId]);
        
        if (result.rows.length > 0) {
            console.log(`✅ Registro criado para ${userName} - ID: ${result.rows[0].id}`);
            return result.rows[0].id;
        }
        
        return null;

    } catch (error) {
        console.error(`❌ Erro ao criar registro para ${userName}:`, error.message);
        return null;
    } finally {
        await client.end();
    }
}

/**
 * 💰 Adicionar crédito à usuária
 */
async function addCreditToUser(userId, amount, userName, balanceId = null) {
    const client = new Client(DATABASE_CONFIG);
    
    try {
        await client.connect();
        
        console.log(`\n💰 Processando R$ ${amount} para ${userName}...`);
        
        // Se não tem balance_id, criar registro primeiro
        if (!balanceId) {
            console.log(`⚠️ ${userName} não tem registro em user_balances. Criando...`);
            balanceId = await createUserBalance(userId, userName);
            if (!balanceId) {
                console.log(`❌ Falha ao criar registro para ${userName}`);
                return false;
            }
        }
        
        // Buscar saldo atual
        const currentQuery = 'SELECT test_credit_balance FROM user_balances WHERE user_id = $1 AND currency = $2';
        const currentResult = await client.query(currentQuery, [userId, 'BRL']);
        
        if (currentResult.rows.length === 0) {
            console.log(`❌ Registro não encontrado para ${userName}`);
            return false;
        }
        
        const currentBalance = parseFloat(currentResult.rows[0].test_credit_balance) || 0;
        const newBalance = currentBalance + amount;
        
        // Atualizar saldo
        const updateQuery = `
            UPDATE user_balances 
            SET 
                test_credit_balance = $1,
                last_updated = NOW()
            WHERE user_id = $2 AND currency = $3
            RETURNING test_credit_balance;
        `;
        
        const updateResult = await client.query(updateQuery, [newBalance, userId, 'BRL']);
        
        if (updateResult.rows.length > 0) {
            console.log(`✅ Crédito adicionado para ${userName}`);
            console.log(`   Saldo anterior: R$ ${currentBalance}`);
            console.log(`   Valor adicionado: R$ ${amount}`);
            console.log(`   Novo saldo: R$ ${updateResult.rows[0].test_credit_balance}`);
            
            // Registrar na tabela test_credits
            try {
                const logQuery = `
                    INSERT INTO test_credits (
                        id, user_id, amount, currency, granted_at, 
                        granted_type, is_used, notes, created_at, updated_at
                    ) VALUES (
                        gen_random_uuid(), $1, $2, 'BRL', NOW(),
                        'admin_script', false, $3, NOW(), NOW()
                    );
                `;
                
                await client.query(logQuery, [
                    userId, 
                    amount, 
                    `Crédito administrativo para ${userName} - Script automático ${new Date().toLocaleString('pt-BR')}`
                ]);
                
                console.log(`📝 Log registrado na tabela test_credits`);
            } catch (logError) {
                console.log(`⚠️ Aviso: Não foi possível registrar log: ${logError.message}`);
            }
            
            return true;
        } else {
            console.log(`❌ Falha ao atualizar saldo de ${userName}`);
            return false;
        }

    } catch (error) {
        console.error(`❌ Erro ao adicionar crédito para ${userName}:`, error.message);
        return false;
    } finally {
        await client.end();
    }
}

/**
 * 📊 Verificar saldos finais
 */
async function checkFinalBalances() {
    const client = new Client(DATABASE_CONFIG);
    
    try {
        await client.connect();
        
        console.log('\n📊 SALDOS FINAIS:');
        
        const query = `
            SELECT 
                u.name,
                ub.test_credit_balance,
                ub.last_updated
            FROM users u
            JOIN user_balances ub ON u.id = ub.user_id
            WHERE (LOWER(u.name) LIKE '%paloma%' OR LOWER(u.name) LIKE '%luiza%')
            AND ub.currency = 'BRL'
            ORDER BY u.name;
        `;
        
        const result = await client.query(query);
        
        result.rows.forEach(user => {
            console.log(`👤 ${user.name}: R$ ${user.test_credit_balance}`);
            console.log(`   Última atualização: ${new Date(user.last_updated).toLocaleString('pt-BR')}`);
        });

    } catch (error) {
        console.error('❌ Erro ao verificar saldos finais:', error.message);
    } finally {
        await client.end();
    }
}

/**
 * 🎯 Função principal
 */
async function addCreditsToUsers() {
    console.log('💰 COINBITCLUB - ADICIONAR CRÉDITOS TESTE');
    console.log('=' .repeat(50));
    console.log('👤 PALOMA AMARAL: R$ 100,00');
    console.log('👤 LUIZA MARIA: R$ 500,00');
    console.log('🔗 Railway PostgreSQL - Estrutura correta');
    console.log('=' .repeat(50));

    try {
        // 1. Buscar usuárias e saldos
        const users = await findUsersAndBalances();
        
        if (users.length === 0) {
            console.log('❌ Nenhuma usuária encontrada');
            return;
        }

        // 2. Identificar usuárias
        const paloma = users.find(user => user.name.toLowerCase().includes('paloma'));
        const luiza = users.find(user => user.name.toLowerCase().includes('luiza'));

        let successCount = 0;

        // 3. Adicionar crédito para Paloma
        if (paloma) {
            const palomaSuccess = await addCreditToUser(
                paloma.id, 
                100, 
                'PALOMA AMARAL', 
                paloma.balance_id
            );
            if (palomaSuccess) successCount++;
        } else {
            console.log('⚠️ PALOMA não encontrada');
        }

        // 4. Adicionar crédito para Luiza  
        if (luiza) {
            const luizaSuccess = await addCreditToUser(
                luiza.id, 
                500, 
                'LUIZA MARIA', 
                luiza.balance_id
            );
            if (luizaSuccess) successCount++;
        } else {
            console.log('⚠️ LUIZA não encontrada');
        }

        // 5. Verificar saldos finais
        await checkFinalBalances();

        // 6. Resumo final
        console.log('\n' + '=' .repeat(50));
        console.log('🎯 RESUMO FINAL');
        console.log('=' .repeat(50));
        
        if (successCount === 2) {
            console.log('🎉 TODOS OS CRÉDITOS ADICIONADOS COM SUCESSO!');
            console.log('✅ PALOMA AMARAL: R$ 100,00 ✓');
            console.log('✅ LUIZA MARIA: R$ 500,00 ✓');
            console.log('💰 TOTAL ADICIONADO: R$ 600,00');
        } else if (successCount === 1) {
            console.log('⚠️ Apenas 1 usuária recebeu créditos');
        } else {
            console.log('❌ Nenhum crédito foi adicionado');
        }

        console.log('\n📱 As usuárias podem verificar os créditos:');
        console.log('• Acessando a plataforma CoinbitClub');
        console.log('• Na seção "Meu Saldo" ou "Créditos"');
        console.log('• Os créditos aparecem como "Saldo de Teste"');

    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    addCreditsToUsers().catch(console.error);
}

module.exports = {
    addCreditsToUsers,
    findUsersAndBalances,
    addCreditToUser,
    checkFinalBalances
};
