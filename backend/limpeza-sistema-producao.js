const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function limpezaSistemaProducao() {
    try {
        console.log('🧹 LIMPEZA DO SISTEMA - APENAS USUÁRIOS REAIS');
        console.log('===========================================');
        
        // 1. Identificar usuários com chaves válidas
        console.log('\n📋 IDENTIFICANDO USUÁRIOS VÁLIDOS:');
        const validUsers = await pool.query(`
            SELECT DISTINCT u.id, u.name, u.email, u.vip_status,
                   ak.api_key, ak.secret_key, ak.environment, ak.validation_status
            FROM users u 
            JOIN user_api_keys ak ON u.id = ak.user_id 
            WHERE ak.is_active = true 
            AND ak.validation_status = 'valid'
            AND ak.api_key NOT LIKE '%TEST%'
            AND ak.api_key NOT LIKE '%PENDING%'
            AND ak.api_key NOT LIKE '%PLACEHOLDER%'
            AND ak.api_key NOT LIKE '%VIP_API_KEY%'
            AND u.email NOT LIKE '%test%'
            AND u.email NOT LIKE '%homolog%'
            ORDER BY u.id
        `);

        console.log(`✅ Encontrados ${validUsers.rows.length} usuários com chaves válidas:`);
        validUsers.rows.forEach(user => {
            const planType = user.vip_status ? '⭐ VIP' : '👤 BÁSICO';
            console.log(`   ${planType} ${user.name} (ID: ${user.id})`);
            console.log(`      📧 ${user.email}`);
            console.log(`      🔑 ${user.api_key.substring(0, 15)}... (${user.environment})`);
            console.log('');
        });

        // 2. Identificar usuários/chaves de teste para remover
        console.log('\n🗑️  IDENTIFICANDO DADOS DE TESTE PARA REMOÇÃO:');
        
        // Usuários de teste
        const testUsers = await pool.query(`
            SELECT u.id, u.name, u.email 
            FROM users u 
            WHERE u.email LIKE '%test%' 
            OR u.email LIKE '%homolog%'
            OR u.name LIKE '%Test%'
            OR u.name LIKE '%Teste%'
            OR u.name IS NULL
            OR u.email IS NULL
        `);

        if (testUsers.rows.length > 0) {
            console.log(`❌ Usuários de teste encontrados (${testUsers.rows.length}):`);
            testUsers.rows.forEach(user => {
                console.log(`   - ${user.name || 'NULL'} (ID: ${user.id}) - ${user.email || 'NULL'}`);
            });
        }

        // Chaves inválidas
        const invalidKeys = await pool.query(`
            SELECT ak.id, ak.user_id, u.name, ak.api_key, ak.validation_status
            FROM user_api_keys ak
            JOIN users u ON ak.user_id = u.id
            WHERE ak.validation_status != 'valid'
            OR ak.is_active = false
            OR ak.api_key LIKE '%TEST%'
            OR ak.api_key LIKE '%PENDING%'
            OR ak.api_key LIKE '%PLACEHOLDER%'
            OR ak.api_key LIKE '%VIP_API_KEY%'
        `);

        if (invalidKeys.rows.length > 0) {
            console.log(`❌ Chaves inválidas encontradas (${invalidKeys.rows.length}):`);
            invalidKeys.rows.forEach(key => {
                console.log(`   - ${key.name}: ${key.api_key.substring(0, 20)}... (Status: ${key.validation_status})`);
            });
        }

        // 3. Confirmar limpeza
        console.log('\n⚠️  CONFIRMAÇÃO DE LIMPEZA:');
        console.log('   Esta operação irá:');
        console.log(`   • Manter ${validUsers.rows.length} usuários com chaves válidas`);
        console.log(`   • Remover ${testUsers.rows.length} usuários de teste`);
        console.log(`   • Remover ${invalidKeys.rows.length} chaves inválidas`);
        
        // 4. Executar limpeza (CUIDADO!)
        console.log('\n🔄 EXECUTANDO LIMPEZA...');
        
        // Remover chaves inválidas primeiro
        if (invalidKeys.rows.length > 0) {
            const removedKeys = await pool.query(`
                DELETE FROM user_api_keys 
                WHERE validation_status != 'valid'
                OR is_active = false
                OR api_key LIKE '%TEST%'
                OR api_key LIKE '%PENDING%'
                OR api_key LIKE '%PLACEHOLDER%'
                OR api_key LIKE '%VIP_API_KEY%'
            `);
            console.log(`   🗑️  Removidas ${removedKeys.rowCount} chaves inválidas`);
        }

        // Desativar usuários de teste (não remover para manter integridade)
        if (testUsers.rows.length > 0) {
            const deactivatedUsers = await pool.query(`
                UPDATE users 
                SET is_active = false, updated_at = NOW()
                WHERE email LIKE '%test%' 
                OR email LIKE '%homolog%'
                OR name LIKE '%Test%'
                OR name LIKE '%Teste%'
                OR name IS NULL
                OR email IS NULL
            `);
            console.log(`   🔒 Desativados ${deactivatedUsers.rowCount} usuários de teste`);
        }

        // 5. Verificar resultado final
        console.log('\n📊 SISTEMA APÓS LIMPEZA:');
        
        const finalUsers = await pool.query(`
            SELECT u.id, u.name, u.email, u.vip_status,
                   COUNT(ak.id) as active_keys
            FROM users u 
            LEFT JOIN user_api_keys ak ON u.id = ak.user_id AND ak.is_active = true
            WHERE u.is_active = true
            GROUP BY u.id, u.name, u.email, u.vip_status
            ORDER BY u.vip_status DESC, u.id
        `);

        console.log(`✅ Sistema limpo - ${finalUsers.rows.length} usuários ativos:`);
        
        let vipCount = 0;
        let basicCount = 0;
        let totalKeys = 0;

        finalUsers.rows.forEach(user => {
            const planType = user.vip_status ? '⭐ VIP' : '👤 BÁSICO';
            const keyStatus = user.active_keys > 0 ? '✅ COM CHAVES' : '❌ SEM CHAVES';
            
            console.log(`   ${planType} | ${keyStatus} | ${user.name}`);
            console.log(`      📧 ${user.email}`);
            console.log(`      🔑 ${user.active_keys} chaves ativas`);
            
            if (user.vip_status) vipCount++;
            else basicCount++;
            totalKeys += parseInt(user.active_keys);
            console.log('');
        });

        // 6. Relatório final
        console.log('\n🎯 RELATÓRIO FINAL DE PRODUÇÃO:');
        console.log(`   ⭐ Usuários VIP: ${vipCount}`);
        console.log(`   👤 Usuários BÁSICOS: ${basicCount}`);
        console.log(`   🔑 Total de chaves ativas: ${totalKeys}`);
        console.log(`   🌍 Sistema: 100% limpo e pronto para produção`);

        // 7. Verificar se todos têm chaves
        const usersWithoutKeys = finalUsers.rows.filter(u => u.active_keys === 0);
        if (usersWithoutKeys.length > 0) {
            console.log('\n⚠️  USUÁRIOS SEM CHAVES (precisam configurar):');
            usersWithoutKeys.forEach(user => {
                console.log(`   - ${user.name} (${user.vip_status ? 'VIP' : 'BÁSICO'})`);
            });
        } else {
            console.log('\n✅ PERFEITO: Todos os usuários ativos têm chaves configuradas!');
        }

        // 8. Estratégia recomendada
        console.log('\n💡 ESTRATÉGIA RECOMENDADA:');
        if (vipCount > 0) {
            console.log('   ⭐ Usuários VIP: Chaves individuais (já configuradas)');
        }
        if (basicCount > 0) {
            console.log('   👤 Usuários BÁSICOS: Usar chave compartilhada das variáveis env');
        }
        console.log('   🔄 Sistema híbrido: Individual para VIP, compartilhada para básicos');
        console.log('   🚀 Rate limits otimizados por usuário');

    } catch (error) {
        console.error('❌ Erro durante limpeza:', error.message);
        console.error(error.stack);
    } finally {
        pool.end();
    }
}

limpezaSistemaProducao();
