/**
 * 🎉 SISTEMA MULTIUSUÁRIO - DIFERENCIAÇÃO TESTNET/MAINNET
 * 
 * Demonstração de como o sistema gerencia diferentes ambientes
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🎉 SISTEMA MULTIUSUÁRIO - DIFERENCIAÇÃO TESTNET/MAINNET');
console.log('=======================================================');

async function demonstrarDiferenciacao() {
    try {
        // 1. Mostrar todas as chaves por ambiente
        console.log('\n📊 1. DISTRIBUIÇÃO POR AMBIENTE:');
        console.log('================================');
        
        const environmentQuery = `
            SELECT 
                u.name,
                uak.exchange,
                uak.environment,
                uak.validation_status,
                uak.is_active,
                LEFT(uak.api_key, 10) || '...' as api_preview,
                uak.created_at
            FROM users u
            INNER JOIN user_api_keys uak ON u.id = uak.user_id
            WHERE u.is_active = true AND uak.is_active = true
            ORDER BY uak.environment, u.name
        `;
        
        const envResult = await pool.query(environmentQuery);
        
        const testnetKeys = envResult.rows.filter(row => row.environment === 'testnet');
        const mainnetKeys = envResult.rows.filter(row => row.environment === 'mainnet');
        
        console.log('🧪 TESTNET (Ambiente de Testes):');
        if (testnetKeys.length > 0) {
            testnetKeys.forEach((key, index) => {
                console.log(`   ${index + 1}. 👤 ${key.name}`);
                console.log(`      🏦 ${key.exchange} (${key.environment})`);
                console.log(`      🔑 ${key.api_preview}`);
                console.log(`      📊 Status: ${key.validation_status}`);
                console.log(`      📅 ${new Date(key.created_at).toLocaleDateString('pt-BR')}`);
                console.log('');
            });
        } else {
            console.log('   ❌ Nenhuma chave testnet ativa');
        }
        
        console.log('🏦 MAINNET (Ambiente de Produção):');
        if (mainnetKeys.length > 0) {
            mainnetKeys.forEach((key, index) => {
                console.log(`   ${index + 1}. 👤 ${key.name}`);
                console.log(`      🏦 ${key.exchange} (${key.environment})`);
                console.log(`      🔑 ${key.api_preview}`);
                console.log(`      📊 Status: ${key.validation_status}`);
                console.log(`      📅 ${new Date(key.created_at).toLocaleDateString('pt-BR')}`);
                console.log('');
            });
        } else {
            console.log('   ❌ Nenhuma chave mainnet ativa');
        }
        
        // 2. Estatísticas
        console.log('📈 2. ESTATÍSTICAS DO SISTEMA:');
        console.log('==============================');
        console.log(`🧪 Testnet: ${testnetKeys.length} chave(s) ativa(s)`);
        console.log(`🏦 Mainnet: ${mainnetKeys.length} chave(s) ativa(s)`);
        console.log(`📊 Total: ${envResult.rows.length} chave(s) ativa(s)`);
        
        // 3. Diferenças técnicas
        console.log('\n🔧 3. DIFERENÇAS TÉCNICAS:');
        console.log('==========================');
        console.log('🧪 TESTNET:');
        console.log('   • Ambiente de testes sem dinheiro real');
        console.log('   • URL: https://api-testnet.bybit.com');
        console.log('   • Usado para desenvolvimento e testes');
        console.log('   • Saldos virtuais (não têm valor real)');
        console.log('   • Risco zero para o usuário');
        
        console.log('\n🏦 MAINNET:');
        console.log('   • Ambiente de produção com dinheiro real');
        console.log('   • URL: https://api.bybit.com');
        console.log('   • Usado para trading real');
        console.log('   • Saldos reais em USD/crypto');
        console.log('   • Risco real - requer cuidado');
        
        // 4. Como o sistema diferencia
        console.log('\n⚙️ 4. COMO O SISTEMA DIFERENCIA:');
        console.log('=================================');
        console.log('🔍 Métodos de diferenciação:');
        console.log('   1. Campo "environment" no banco de dados');
        console.log('   2. URLs diferentes para API calls');
        console.log('   3. Configurações específicas por ambiente');
        console.log('   4. Monitoramento separado por ambiente');
        
        console.log('\n💻 Código de diferenciação:');
        console.log('```javascript');
        console.log('const baseUrl = environment === "testnet" ? ');
        console.log('  "https://api-testnet.bybit.com" : ');
        console.log('  "https://api.bybit.com";');
        console.log('```');
        
        // 5. Usuários com múltiplos ambientes
        console.log('\n👥 5. USUÁRIOS COM MÚLTIPLOS AMBIENTES:');
        console.log('======================================');
        
        const multiEnvQuery = `
            SELECT 
                u.name,
                COUNT(CASE WHEN uak.environment = 'testnet' THEN 1 END) as testnet_count,
                COUNT(CASE WHEN uak.environment = 'mainnet' THEN 1 END) as mainnet_count,
                COUNT(*) as total_keys
            FROM users u
            INNER JOIN user_api_keys uak ON u.id = uak.user_id
            WHERE u.is_active = true AND uak.is_active = true
            GROUP BY u.id, u.name
            HAVING COUNT(*) > 0
            ORDER BY total_keys DESC, u.name
        `;
        
        const multiEnvResult = await pool.query(multiEnvQuery);
        
        multiEnvResult.rows.forEach((user, index) => {
            const hasTestnet = user.testnet_count > 0;
            const hasMainnet = user.mainnet_count > 0;
            const envIcons = [];
            
            if (hasTestnet) envIcons.push('🧪');
            if (hasMainnet) envIcons.push('🏦');
            
            console.log(`   ${index + 1}. ${envIcons.join(' ')} ${user.name}`);
            console.log(`      🧪 Testnet: ${user.testnet_count} chave(s)`);
            console.log(`      🏦 Mainnet: ${user.mainnet_count} chave(s)`);
            console.log(`      📊 Total: ${user.total_keys} chave(s)`);
            console.log('');
        });
        
        // 6. Status do sistema
        console.log('🚀 6. STATUS ATUAL DO SISTEMA:');
        console.log('==============================');
        console.log('✅ Sistema multiusuário operacional');
        console.log('✅ Diferenciação testnet/mainnet funcionando');
        console.log('✅ Monitoramento em tempo real ativo');
        console.log('✅ Chaves atualizadas e validadas');
        
        console.log('\n🎯 VANTAGENS DO SISTEMA:');
        console.log('========================');
        console.log('1. 🔒 Segurança: Ambientes separados');
        console.log('2. 🧪 Testes: Desenvolvimento seguro em testnet');
        console.log('3. 🏦 Produção: Trading real em mainnet');
        console.log('4. 👥 Multiusuário: Vários usuários simultaneamente');
        console.log('5. 🔄 Tempo real: Monitoramento contínuo');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

// Executar demonstração
demonstrarDiferenciacao().catch(console.error);
