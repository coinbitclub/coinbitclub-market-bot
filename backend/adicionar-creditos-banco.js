/**
 * 💰 ADICIONAR CRÉDITOS DIRETO NO BANCO - PALOMA E LUIZA
 * Conexão simplificada sem SSL para Railway
 */

const { Client } = require('pg');

// Configuração Railway simplificada
const DATABASE_CONFIG = {
    host: 'yamabiko.proxy.rlwy.net',
    port: 32866,
    database: 'railway',
    user: 'postgres',
    password: 'TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS',
    ssl: false,
    connectionTimeoutMillis: 30000,
    idleTimeoutMillis: 30000
};

/**
 * 🔍 Buscar usuárias no banco
 */
async function findUsersInDatabase() {
    const client = new Client(DATABASE_CONFIG);
    
    try {
        console.log('🔗 Conectando ao banco Railway...');
        await client.connect();
        console.log('✅ Conectado ao banco com sucesso');

        // Buscar Paloma e Luiza
        const query = `
            SELECT id, name, email, test_credit_balance, created_at
            FROM users 
            WHERE LOWER(name) LIKE '%paloma%' OR LOWER(name) LIKE '%luiza%'
            ORDER BY name;
        `;
        
        console.log('🔍 Buscando usuárias Paloma e Luiza...');
        const result = await client.query(query);
        
        if (result.rows.length > 0) {
            console.log(`✅ ${result.rows.length} usuárias encontradas:`);
            
            result.rows.forEach(user => {
                console.log(`👤 ${user.name} (ID: ${user.id})`);
                console.log(`   Email: ${user.email}`);
                console.log(`   Saldo atual: R$ ${user.test_credit_balance || 0}`);
                console.log(`   Cadastro: ${new Date(user.created_at).toLocaleDateString('pt-BR')}`);
                console.log('');
            });
            
            return result.rows;
        } else {
            console.log('⚠️ Nenhuma usuária encontrada com os nomes Paloma ou Luiza');
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
 * 💰 Adicionar crédito no banco
 */
async function addCreditToUser(userId, amount, userName) {
    const client = new Client(DATABASE_CONFIG);
    
    try {
        await client.connect();
        
        console.log(`💰 Adicionando R$ ${amount} para ${userName}...`);
        
        // Verificar saldo atual
        const currentBalanceQuery = 'SELECT test_credit_balance FROM users WHERE id = $1';
        const currentResult = await client.query(currentBalanceQuery, [userId]);
        
        if (currentResult.rows.length === 0) {
            console.log(`❌ Usuária ${userName} não encontrada`);
            return false;
        }
        
        const currentBalance = parseFloat(currentResult.rows[0].test_credit_balance) || 0;
        const newBalance = currentBalance + amount;
        
        // Atualizar saldo
        const updateQuery = `
            UPDATE users 
            SET test_credit_balance = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING test_credit_balance;
        `;
        
        const updateResult = await client.query(updateQuery, [newBalance, userId]);
        
        if (updateResult.rows.length > 0) {
            console.log(`✅ Crédito adicionado com sucesso para ${userName}`);
            console.log(`   Saldo anterior: R$ ${currentBalance}`);
            console.log(`   Valor adicionado: R$ ${amount}`);
            console.log(`   Novo saldo: R$ ${updateResult.rows[0].test_credit_balance}`);
            
            // Registrar na tabela de test_credits se existir
            try {
                const insertCreditQuery = `
                    INSERT INTO test_credits (user_id, amount, currency, notes, created_at)
                    VALUES ($1, $2, 'BRL', $3, NOW());
                `;
                
                await client.query(insertCreditQuery, [
                    userId, 
                    amount, 
                    `Crédito administrativo para ${userName} - Script automático`
                ]);
                
                console.log(`📝 Registro criado na tabela test_credits`);
            } catch (creditError) {
                console.log(`⚠️ Aviso: Não foi possível registrar em test_credits: ${creditError.message}`);
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
async function checkFinalBalances(userIds) {
    const client = new Client(DATABASE_CONFIG);
    
    try {
        await client.connect();
        
        console.log('📊 Verificando saldos finais...');
        
        for (const { id, name } of userIds) {
            const query = 'SELECT test_credit_balance FROM users WHERE id = $1';
            const result = await client.query(query, [id]);
            
            if (result.rows.length > 0) {
                console.log(`👤 ${name}: R$ ${result.rows[0].test_credit_balance}`);
            }
        }

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
    console.log('💰 COINBITCLUB - ADICIONAR CRÉDITOS (BANCO DIRETO)');
    console.log('=' .repeat(55));
    console.log('👤 Paloma: R$ 100,00');
    console.log('👤 Luiza: R$ 500,00');
    console.log('🔗 Conexão direta Railway PostgreSQL');
    console.log('=' .repeat(55));

    try {
        // 1. Buscar usuárias
        const users = await findUsersInDatabase();
        
        if (users.length === 0) {
            console.log('❌ Nenhuma usuária encontrada para adicionar créditos');
            return;
        }

        // 2. Encontrar Paloma e Luiza
        const paloma = users.find(user => user.name.toLowerCase().includes('paloma'));
        const luiza = users.find(user => user.name.toLowerCase().includes('luiza'));

        let successCount = 0;
        const processedUsers = [];

        // 3. Adicionar crédito para Paloma
        if (paloma) {
            const palomaSuccess = await addCreditToUser(paloma.id, 100, 'Paloma');
            if (palomaSuccess) {
                successCount++;
                processedUsers.push({ id: paloma.id, name: 'Paloma' });
            }
        } else {
            console.log('⚠️ Paloma não encontrada no banco');
        }

        // 4. Adicionar crédito para Luiza  
        if (luiza) {
            const luizaSuccess = await addCreditToUser(luiza.id, 500, 'Luiza');
            if (luizaSuccess) {
                successCount++;
                processedUsers.push({ id: luiza.id, name: 'Luiza' });
            }
        } else {
            console.log('⚠️ Luiza não encontrada no banco');
        }

        // 5. Verificar saldos finais
        if (processedUsers.length > 0) {
            await checkFinalBalances(processedUsers);
        }

        // 6. Resumo final
        console.log('\n' + '=' .repeat(55));
        console.log('📊 RESUMO FINAL');
        console.log('=' .repeat(55));
        
        if (successCount === 2) {
            console.log('🎉 TODOS OS CRÉDITOS ADICIONADOS COM SUCESSO!');
            console.log('✅ Paloma: R$ 100,00 adicionados');
            console.log('✅ Luiza: R$ 500,00 adicionados');
            console.log('💰 Total: R$ 600,00 em créditos');
        } else if (successCount === 1) {
            console.log('⚠️ Apenas 1 crédito foi adicionado com sucesso');
            if (paloma && processedUsers.find(u => u.name === 'Paloma')) {
                console.log('✅ Paloma: R$ 100,00 adicionados');
            }
            if (luiza && processedUsers.find(u => u.name === 'Luiza')) {
                console.log('✅ Luiza: R$ 500,00 adicionados');
            }
        } else {
            console.log('❌ Nenhum crédito foi adicionado');
        }

        console.log('\n🔍 Para verificar no sistema:');
        console.log('• Acessar painel administrativo');
        console.log('• Verificar seção de usuários/créditos');
        console.log('• Conferir histórico de transações');

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
    findUsersInDatabase,
    addCreditToUser
};
