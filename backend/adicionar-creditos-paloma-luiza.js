/**
 * 💰 ADICIONAR CRÉDITOS PARA USUÁRIAS PALOMA E LUIZA
 * Paloma: R$ 100,00 | Luiza: R$ 500,00
 */

const { Pool } = require('pg');
const axios = require('axios');

// Configuração do banco de dados
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS@yamabiko.proxy.rlwy.net:32866/railway',
    ssl: false // Desabilitar SSL para conexão local
});

const BASE_URL = 'https://coinbitclub-market-bot.up.railway.app';

/**
 * 🔍 Buscar usuária por nome
 */
async function findUserByName(name) {
    try {
        const result = await pool.query(
            'SELECT id, name, email FROM users WHERE LOWER(name) LIKE LOWER($1) OR LOWER(email) LIKE LOWER($1)',
            [`%${name}%`]
        );
        return result.rows;
    } catch (error) {
        console.error(`❌ Erro ao buscar usuária ${name}:`, error.message);
        return [];
    }
}

/**
 * 👤 Criar usuária se não existir
 */
async function createUserIfNotExists(name, email) {
    try {
        // Verificar se já existe
        let users = await findUserByName(name);
        if (users.length > 0) {
            return users[0];
        }

        // Criar nova usuária
        const result = await pool.query(
            'INSERT INTO users (name, email, created_at) VALUES ($1, $2, NOW()) RETURNING id, name, email',
            [name, email]
        );
        
        console.log(`✅ Usuária ${name} criada com sucesso`);
        return result.rows[0];
    } catch (error) {
        console.error(`❌ Erro ao criar usuária ${name}:`, error.message);
        return null;
    }
}

/**
 * 💰 Adicionar crédito teste
 */
async function addTestCredit(userId, amount, notes) {
    try {
        // 1. Adicionar registro na tabela test_credits
        await pool.query(
            `INSERT INTO test_credits (user_id, amount, currency, granted_by, notes, created_at) 
             VALUES ($1, $2, 'BRL', 1, $3, NOW())`,
            [userId, amount, notes]
        );

        // 2. Criar ou atualizar user_balances
        await pool.query(
            `INSERT INTO user_balances (user_id, test_credit_balance, prepaid_balance, created_at, updated_at)
             VALUES ($1, $2, 0, NOW(), NOW())
             ON CONFLICT (user_id) 
             DO UPDATE SET 
                test_credit_balance = user_balances.test_credit_balance + $2,
                updated_at = NOW()`,
            [userId, amount]
        );

        console.log(`✅ Crédito de R$ ${amount.toFixed(2)} adicionado com sucesso`);
        return true;
    } catch (error) {
        console.error(`❌ Erro ao adicionar crédito:`, error.message);
        return false;
    }
}

/**
 * 📊 Verificar saldo final
 */
async function checkBalance(userId, userName) {
    try {
        const result = await pool.query(
            'SELECT test_credit_balance, prepaid_balance FROM user_balances WHERE user_id = $1',
            [userId]
        );

        if (result.rows.length > 0) {
            const balance = result.rows[0];
            console.log(`💰 ${userName} - Saldo final:`);
            console.log(`   Crédito Teste: R$ ${parseFloat(balance.test_credit_balance || 0).toFixed(2)}`);
            console.log(`   Pré-pago: R$ ${parseFloat(balance.prepaid_balance || 0).toFixed(2)}`);
            return balance;
        } else {
            console.log(`⚠️ Nenhum saldo encontrado para ${userName}`);
            return null;
        }
    } catch (error) {
        console.error(`❌ Erro ao verificar saldo de ${userName}:`, error.message);
        return null;
    }
}

/**
 * 🎯 Função principal
 */
async function addCreditsToUsers() {
    console.log('💰 ADICIONANDO CRÉDITOS PARA USUÁRIAS');
    console.log('=' .repeat(50));
    console.log('👤 Paloma: R$ 100,00');
    console.log('👤 Luiza: R$ 500,00');
    console.log('=' .repeat(50));

    try {
        // 1. Processar Paloma - R$ 100
        console.log('\n👤 PROCESSANDO PALOMA...');
        let paloma = await findUserByName('Paloma');
        
        if (paloma.length === 0) {
            console.log('⚠️ Usuária Paloma não encontrada, criando...');
            paloma = await createUserIfNotExists('Paloma', 'paloma@coinbitclub.com');
            if (!paloma) {
                throw new Error('Não foi possível criar usuária Paloma');
            }
        } else {
            paloma = paloma[0];
            console.log(`✅ Usuária Paloma encontrada: ID ${paloma.id}`);
        }

        const palomaSuccess = await addTestCredit(
            paloma.id, 
            100.00, 
            'Crédito administrativo - Adicionado via script'
        );

        if (palomaSuccess) {
            await checkBalance(paloma.id, 'Paloma');
        }

        // 2. Processar Luiza - R$ 500
        console.log('\n👤 PROCESSANDO LUIZA...');
        let luiza = await findUserByName('Luiza');
        
        if (luiza.length === 0) {
            console.log('⚠️ Usuária Luiza não encontrada, criando...');
            luiza = await createUserIfNotExists('Luiza', 'luiza@coinbitclub.com');
            if (!luiza) {
                throw new Error('Não foi possível criar usuária Luiza');
            }
        } else {
            luiza = luiza[0];
            console.log(`✅ Usuária Luiza encontrada: ID ${luiza.id}`);
        }

        const luizaSuccess = await addTestCredit(
            luiza.id, 
            500.00, 
            'Crédito administrativo - Adicionado via script'
        );

        if (luizaSuccess) {
            await checkBalance(luiza.id, 'Luiza');
        }

        // 3. Resumo final
        console.log('\n' + '=' .repeat(50));
        console.log('📊 RESUMO FINAL');
        console.log('=' .repeat(50));
        
        if (palomaSuccess && luizaSuccess) {
            console.log('✅ TODOS OS CRÉDITOS ADICIONADOS COM SUCESSO!');
            console.log(`👤 Paloma (ID: ${paloma.id}): R$ 100,00 ✅`);
            console.log(`👤 Luiza (ID: ${luiza.id}): R$ 500,00 ✅`);
            
            // Testar via API se possível
            console.log('\n🔗 Testando via API...');
            await testAPIAccess();
        } else {
            console.log('❌ Alguns créditos falharam ao ser adicionados');
        }

    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    } finally {
        await pool.end();
    }
}

/**
 * 🔗 Testar acesso via API
 */
async function testAPIAccess() {
    try {
        const response = await axios.get(`${BASE_URL}/api/admin/users`, {
            headers: {
                'Authorization': 'Bearer admin-emergency-token'
            },
            timeout: 10000
        });

        if (response.status === 200) {
            console.log('✅ API funcionando - dados atualizados');
            
            // Procurar Paloma e Luiza na resposta
            const users = response.data.users || response.data;
            const paloma = users.find(u => u.name && u.name.toLowerCase().includes('paloma'));
            const luiza = users.find(u => u.name && u.name.toLowerCase().includes('luiza'));
            
            if (paloma) {
                console.log(`👤 Paloma na API: ${paloma.name} - Saldo: R$ ${paloma.test_credit_balance || 0}`);
            }
            if (luiza) {
                console.log(`👤 Luiza na API: ${luiza.name} - Saldo: R$ ${luiza.test_credit_balance || 0}`);
            }
        }
    } catch (error) {
        console.log(`⚠️ API não acessível: ${error.message}`);
        console.log('💡 Os créditos foram adicionados no banco, mas a API pode estar indisponível');
    }
}

/**
 * 📋 Verificar estrutura das tabelas
 */
async function checkTableStructure() {
    try {
        console.log('\n🔍 VERIFICANDO ESTRUTURA DAS TABELAS...');
        
        // Verificar tabela users
        const usersResult = await pool.query(
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position"
        );
        console.log('👥 Tabela users:', usersResult.rows.map(r => r.column_name).join(', '));

        // Verificar tabela test_credits
        const creditsResult = await pool.query(
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'test_credits' ORDER BY ordinal_position"
        );
        console.log('💳 Tabela test_credits:', creditsResult.rows.map(r => r.column_name).join(', '));

        // Verificar tabela user_balances
        const balancesResult = await pool.query(
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_balances' ORDER BY ordinal_position"
        );
        console.log('💰 Tabela user_balances:', balancesResult.rows.map(r => r.column_name).join(', '));

        return true;
    } catch (error) {
        console.error('❌ Erro ao verificar tabelas:', error.message);
        return false;
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    checkTableStructure().then(() => {
        addCreditsToUsers().catch(console.error);
    });
}

module.exports = {
    addCreditsToUsers,
    findUserByName,
    createUserIfNotExists,
    addTestCredit,
    checkBalance
};
