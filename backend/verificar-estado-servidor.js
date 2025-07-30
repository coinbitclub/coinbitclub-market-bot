const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function verificarEstadoCompleto() {
    try {
        console.log('🔍 VERIFICAÇÃO COMPLETA DO ESTADO DO SERVIDOR');
        console.log('==============================================');
        
        // 1. Verificar IP atual do servidor
        console.log('\n1. 🌐 IP DO SERVIDOR:');
        const axios = require('axios');
        try {
            const ipResponse = await axios.get('https://api.ipify.org?format=json');
            console.log(`   📍 IP Railway: ${ipResponse.data.ip}`);
        } catch (error) {
            console.log('   ❌ Erro ao obter IP:', error.message);
        }

        // 2. Verificar usuários e suas chaves
        console.log('\n2. 👥 USUÁRIOS E CHAVES API:');
        const usersQuery = `
            SELECT 
                u.id,
                u.nome,
                u.email,
                u.nivel_vip,
                u.saldo_total,
                uak.api_key,
                uak.secret_key,
                uak.exchange,
                uak.validation_status,
                uak.error_message
            FROM users u
            LEFT JOIN user_api_keys uak ON u.id = uak.user_id
            WHERE uak.is_active = true
            ORDER BY u.id
        `;
        
        const users = await pool.query(usersQuery);
        
        users.rows.forEach(user => {
            console.log(`\n📋 ${user.nome || 'Sem nome'} (ID: ${user.id})`);
            console.log(`   📧 Email: ${user.email || 'N/A'}`);
            console.log(`   ⭐ Nível VIP: ${user.nivel_vip || 'N/A'}`);
            console.log(`   💰 Saldo: $${user.saldo_total || '0'}`);
            console.log(`   🔑 API Key: ${user.api_key || 'N/A'}`);
            console.log(`   🏪 Exchange: ${user.exchange || 'N/A'}`);
            console.log(`   📊 Status: ${user.validation_status || 'N/A'}`);
            if (user.error_message) {
                console.log(`   ❌ Erro: ${user.error_message}`);
            }
        });

        // 3. Verificar se há chaves com valores placeholder
        console.log('\n3. 🔍 ANÁLISE DAS CHAVES:');
        const placeholderKeys = users.rows.filter(u => 
            u.api_key && (
                u.api_key.includes('API_KEY_REAL_') || 
                u.api_key.includes('SECRET_KEY_') ||
                u.secret_key && u.secret_key.includes('SECRET_KEY_')
            )
        );

        if (placeholderKeys.length > 0) {
            console.log('   🚨 CHAVES PLACEHOLDER ENCONTRADAS:');
            placeholderKeys.forEach(user => {
                console.log(`   • ${user.nome || 'ID:' + user.id}: ${user.api_key}`);
            });
        } else {
            console.log('   ✅ Nenhuma chave placeholder encontrada');
        }

        // 4. Verificar chaves reais vs cointech2u
        console.log('\n4. 🤖 COMPARAÇÃO COM COINTECH2U:');
        console.log('   📝 Informações fornecidas:');
        console.log('   • CoinTech2U consegue usar as mesmas chaves');
        console.log('   • Isso indica que as chaves estão corretas');
        console.log('   • O problema pode ser:');
        console.log('     - IP diferente entre sistemas');
        console.log('     - Implementação de headers');
        console.log('     - Configuração de whitelist separada');
        console.log('     - Endpoint ou versão da API');

        // 5. Status atual das chaves reais
        console.log('\n5. 📊 RESUMO DAS CHAVES REAIS:');
        const realKeys = users.rows.filter(u => 
            u.api_key && !u.api_key.includes('API_KEY_REAL_') && 
            !u.api_key.includes('SECRET_KEY_')
        );

        realKeys.forEach(user => {
            console.log(`   ✅ ${user.nome || 'ID:' + user.id}: ${user.api_key.substring(0, 10)}...`);
        });

        // 6. Verificar se há diferença na implementação
        console.log('\n6. 💡 PRÓXIMOS PASSOS SUGERIDOS:');
        console.log('   1. Confirmar se todas as chaves placeholder foram substituídas');
        console.log('   2. Verificar se CoinTech2U usa IP diferente');
        console.log('   3. Comparar implementação de autenticação');
        console.log('   4. Testar com diferentes endpoints');

        console.log('\n📋 ESTADO ATUAL DO SERVIDOR:');
        console.log(`   • Banco: Railway PostgreSQL (144 tabelas)`);
        console.log(`   • Sistema: V3.0.0-FINAL-1753835119745`);
        console.log(`   • IP: 132.255.160.140`);
        console.log(`   • Usuários ativos: ${users.rows.length}`);
        console.log(`   • Chaves reais: ${realKeys.length}`);
        console.log(`   • Chaves placeholder: ${placeholderKeys.length}`);

    } catch (error) {
        console.error('❌ Erro na verificação:', error.message);
    } finally {
        await pool.end();
    }
}

verificarEstadoCompleto();
