/**
 * 💰 ADICIONAR CRÉDITOS VIA API - PALOMA E LUIZA
 * Paloma: R$ 100,00 | Luiza: R$ 500,00
 * (Usuárias já existem no cadastro)
 */

const axios = require('axios');

const BASE_URL = 'https://coinbitclub-market-bot.up.railway.app';
const ADMIN_TOKEN = 'admin-emergency-token';

/**
 * 🔍 Buscar usuárias existentes
 */
async function findExistingUsers() {
    try {
        console.log('🔍 Buscando usuárias existentes...');
        
        const response = await axios.get(`${BASE_URL}/api/admin/users`, {
            headers: {
                'Authorization': `Bearer ${ADMIN_TOKEN}`,
                'Content-Type': 'application/json'
            },
            timeout: 15000
        });

        if (response.status === 200) {
            const users = response.data.users || response.data;
            
            // Buscar Paloma
            const paloma = users.find(user => 
                user.name && user.name.toLowerCase().includes('paloma')
            );
            
            // Buscar Luiza
            const luiza = users.find(user => 
                user.name && user.name.toLowerCase().includes('luiza')
            );

            console.log(`✅ API acessível - ${users.length} usuários encontrados`);
            
            if (paloma) {
                console.log(`👤 Paloma encontrada: ID ${paloma.id} - ${paloma.name} (${paloma.email})`);
                console.log(`   Saldo atual: R$ ${paloma.test_credit_balance || 0}`);
            } else {
                console.log('⚠️ Paloma não encontrada');
            }

            if (luiza) {
                console.log(`👤 Luiza encontrada: ID ${luiza.id} - ${luiza.name} (${luiza.email})`);
                console.log(`   Saldo atual: R$ ${luiza.test_credit_balance || 0}`);
            } else {
                console.log('⚠️ Luiza não encontrada');
            }

            return { paloma, luiza, allUsers: users };
        }
    } catch (error) {
        console.error('❌ Erro ao buscar usuárias:', error.message);
        if (error.response) {
            console.log(`Status: ${error.response.status}`);
            console.log(`Dados: ${JSON.stringify(error.response.data, null, 2)}`);
        }
        return { paloma: null, luiza: null, allUsers: [] };
    }
}

/**
 * 💰 Adicionar crédito via API
 */
async function addCreditViaAPI(userId, amount, userName) {
    try {
        console.log(`\n💰 Adicionando R$ ${amount} para ${userName}...`);
        
        const response = await axios.post(`${BASE_URL}/api/admin/grant-credit`, {
            user_id: userId,
            amount: amount,
            currency: 'BRL',
            notes: `Crédito administrativo para ${userName} - Adicionado via script`
        }, {
            headers: {
                'Authorization': `Bearer ${ADMIN_TOKEN}`,
                'Content-Type': 'application/json'
            },
            timeout: 15000
        });

        if (response.status === 200) {
            console.log(`✅ Crédito adicionado com sucesso para ${userName}`);
            console.log(`   Valor: R$ ${amount}`);
            console.log(`   Novo saldo: R$ ${response.data.new_balance || 'N/A'}`);
            return true;
        }
    } catch (error) {
        console.error(`❌ Erro ao adicionar crédito para ${userName}:`, error.message);
        if (error.response) {
            console.log(`Status: ${error.response.status}`);
            console.log(`Dados: ${JSON.stringify(error.response.data, null, 2)}`);
        }
        return false;
    }
}

/**
 * 📊 Verificar saldos finais
 */
async function checkFinalBalances(userIds) {
    try {
        console.log('\n📊 Verificando saldos finais...');
        
        const response = await axios.get(`${BASE_URL}/api/admin/users`, {
            headers: {
                'Authorization': `Bearer ${ADMIN_TOKEN}`,
                'Content-Type': 'application/json'
            },
            timeout: 15000
        });

        if (response.status === 200) {
            const users = response.data.users || response.data;
            
            userIds.forEach(({ id, name }) => {
                const user = users.find(u => u.id === id);
                if (user) {
                    console.log(`👤 ${name}: R$ ${user.test_credit_balance || 0}`);
                }
            });
        }
    } catch (error) {
        console.error('❌ Erro ao verificar saldos finais:', error.message);
    }
}

/**
 * 🎯 Função principal
 */
async function addCreditsToUsers() {
    console.log('💰 SISTEMA COINBITCLUB - ADICIONAR CRÉDITOS');
    console.log('=' .repeat(50));
    console.log('👤 Paloma: R$ 100,00');
    console.log('👤 Luiza: R$ 500,00');
    console.log('🌐 Via API de produção');
    console.log('=' .repeat(50));

    try {
        // 1. Buscar usuárias existentes
        const { paloma, luiza } = await findExistingUsers();
        
        if (!paloma && !luiza) {
            console.log('❌ Nenhuma das usuárias foi encontrada. Verifique se estão cadastradas.');
            return;
        }

        let successCount = 0;
        const userIds = [];

        // 2. Adicionar crédito para Paloma
        if (paloma) {
            const palomaSuccess = await addCreditViaAPI(paloma.id, 100, 'Paloma');
            if (palomaSuccess) {
                successCount++;
                userIds.push({ id: paloma.id, name: 'Paloma' });
            }
        } else {
            console.log('⚠️ Paloma não encontrada - pulando');
        }

        // 3. Adicionar crédito para Luiza
        if (luiza) {
            const luizaSuccess = await addCreditViaAPI(luiza.id, 500, 'Luiza');
            if (luizaSuccess) {
                successCount++;
                userIds.push({ id: luiza.id, name: 'Luiza' });
            }
        } else {
            console.log('⚠️ Luiza não encontrada - pulando');
        }

        // 4. Verificar saldos finais
        if (userIds.length > 0) {
            await checkFinalBalances(userIds);
        }

        // 5. Resumo final
        console.log('\n' + '=' .repeat(50));
        console.log('📊 RESUMO FINAL');
        console.log('=' .repeat(50));
        
        if (successCount === 2) {
            console.log('🎉 TODOS OS CRÉDITOS ADICIONADOS COM SUCESSO!');
            console.log('✅ Paloma: R$ 100,00 adicionados');
            console.log('✅ Luiza: R$ 500,00 adicionados');
        } else if (successCount === 1) {
            console.log('⚠️ Apenas 1 crédito foi adicionado com sucesso');
        } else {
            console.log('❌ Nenhum crédito foi adicionado');
        }
        
        console.log(`\n📈 Total adicionado: R$ ${successCount === 2 ? '600,00' : successCount === 1 ? (paloma ? '100,00' : '500,00') : '0,00'}`);

    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

/**
 * 🔗 Testar conectividade da API
 */
async function testAPIConnectivity() {
    try {
        console.log('🔗 Testando conectividade da API...');
        
        const response = await axios.get(`${BASE_URL}/api/health`, {
            timeout: 10000
        });

        if (response.status === 200) {
            console.log('✅ API online e funcionando');
            console.log(`   Status: ${response.data.status || 'OK'}`);
            return true;
        }
    } catch (error) {
        console.error('❌ API indisponível:', error.message);
        return false;
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    testAPIConnectivity().then(apiOnline => {
        if (apiOnline) {
            addCreditsToUsers().catch(console.error);
        } else {
            console.log('💡 Verifique se o sistema está rodando em produção');
        }
    });
}

module.exports = {
    addCreditsToUsers,
    findExistingUsers,
    addCreditViaAPI,
    testAPIConnectivity
};
