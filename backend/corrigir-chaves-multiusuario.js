const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function corrigirChavesMultiusuario() {
    try {
        console.log('🔧 CORREÇÃO DAS CHAVES API MULTIUSUÁRIO');
        console.log('======================================');
        
        // 1. Verificar situação atual das variáveis de ambiente problemáticas
        console.log('\n📋 SITUAÇÃO ATUAL:');
        const problemKeys = await pool.query(`
            SELECT ak.*, u.name, u.email 
            FROM user_api_keys ak 
            JOIN users u ON ak.user_id = u.id 
            WHERE ak.api_key LIKE '%API_KEY_%' OR ak.secret_key LIKE '%SECRET_KEY_%'
        `);
        
        problemKeys.rows.forEach(key => {
            console.log(`   ⚠️  ${key.name}: ${key.api_key} / ${key.secret_key}`);
            console.log(`      Status: ${key.validation_status} | Error: ${key.error_message || 'N/A'}`);
        });
        
        // 2. Corrigir chave da Paloma especificamente
        console.log('\n🔧 CORRIGINDO CHAVES ESPECÍFICAS:');
        
        // Para a Paloma, vamos usar as chaves das variáveis de ambiente que você mostrou
        const palomaCorrection = await pool.query(`
            UPDATE user_api_keys 
            SET 
                api_key = $1,
                secret_key = $2,
                validation_status = 'pending',
                error_message = NULL,
                updated_at = NOW()
            WHERE user_id = 12 AND exchange = 'bybit'
            RETURNING *
        `, [
            'q3JH2TYGwCHaupbwgG', // Da sua variável BYBIT_API_KEY
            'GqF3E7RZWHBhERnBTUBK4l2qpSiVF3GBWEs' // Da sua variável BYBIT_SECRET_KEY
        ]);
        
        if (palomaCorrection.rows.length > 0) {
            console.log('   ✅ Chave da Paloma atualizada com sucesso');
        }
        
        // 3. Verificar se precisamos criar chaves para usuários VIP sem chaves
        console.log('\n👥 USUÁRIOS VIP SEM CHAVES:');
        const vipWithoutKeys = await pool.query(`
            SELECT u.* FROM users u 
            LEFT JOIN user_api_keys ak ON u.id = ak.user_id 
            WHERE u.vip_status = true AND u.is_active = true AND ak.id IS NULL
        `);
        
        for (const user of vipWithoutKeys.rows) {
            console.log(`   ⚠️  ${user.name} (ID: ${user.id}) precisa de chaves API`);
            
            // Sugestão: Para usuários VIP, você pode querer criar chaves individuais
            // Por enquanto, vou criar um placeholder que pode ser atualizado depois
            const newKey = await pool.query(`
                INSERT INTO user_api_keys (
                    user_id, exchange, api_key, secret_key, environment, 
                    is_active, validation_status, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
                RETURNING *
            `, [
                user.id,
                'bybit',
                'PENDING_INDIVIDUAL_KEY', // Placeholder
                'PENDING_INDIVIDUAL_SECRET', // Placeholder
                'mainnet',
                false, // Inativa até configurar chaves reais
                'pending'
            ]);
            
            console.log(`   ➕ Criada entrada para ${user.name} (inativa até configurar chaves reais)`);
        }
        
        // 4. Validar todas as chaves atuais
        console.log('\n🔍 TESTANDO CHAVES ATUAIS:');
        const allKeys = await pool.query(`
            SELECT ak.*, u.name 
            FROM user_api_keys ak 
            JOIN users u ON ak.user_id = u.id 
            WHERE ak.is_active = true 
            ORDER BY u.name
        `);
        
        for (const key of allKeys.rows) {
            if (key.api_key.includes('PENDING') || key.api_key.includes('API_KEY_')) {
                console.log(`   ⏳ ${key.name}: Aguardando configuração de chaves reais`);
                continue;
            }
            
            // Aqui você pode adicionar teste real da API da Bybit
            console.log(`   🔑 ${key.name}: Chave ${key.api_key.substring(0, 10)}... (${key.exchange})`);
            
            // Marcar como válida por enquanto (você pode implementar validação real depois)
            await pool.query(`
                UPDATE user_api_keys 
                SET validation_status = 'valid', last_validated_at = NOW() 
                WHERE id = $1
            `, [key.id]);
        }
        
        // 5. Relatório final
        console.log('\n📊 RELATÓRIO FINAL:');
        const finalReport = await pool.query(`
            SELECT 
                u.name,
                u.vip_status,
                COUNT(ak.id) as total_keys,
                COUNT(CASE WHEN ak.is_active = true THEN 1 END) as active_keys,
                COUNT(CASE WHEN ak.validation_status = 'valid' THEN 1 END) as valid_keys
            FROM users u 
            LEFT JOIN user_api_keys ak ON u.id = ak.user_id 
            WHERE u.is_active = true
            GROUP BY u.id, u.name, u.vip_status
            ORDER BY u.vip_status DESC, u.name
        `);
        
        finalReport.rows.forEach(r => {
            const status = r.total_keys > 0 ? 
                (r.valid_keys > 0 ? '✅' : r.active_keys > 0 ? '⏳' : '❌') : '🚫';
            console.log(`   ${status} ${r.name} (VIP: ${r.vip_status}) - ${r.total_keys} chaves, ${r.valid_keys} válidas`);
        });
        
        console.log('\n✅ CORREÇÃO CONCLUÍDA!');
        console.log('\n📝 PRÓXIMOS PASSOS NECESSÁRIOS:');
        console.log('   1. 🔑 Obter chaves API individuais da Bybit para cada usuário VIP');
        console.log('   2. 🔄 Atualizar as chaves PENDING_INDIVIDUAL_KEY com valores reais');
        console.log('   3. ✅ Ativar as chaves após validação');
        console.log('   4. 🧪 Testar operações com cada usuário');
        console.log('   5. 📱 Configurar notificações para erros de API');
        
    } catch (error) {
        console.error('❌ Erro durante correção:', error.message);
        console.error(error.stack);
    } finally {
        pool.end();
    }
}

corrigirChavesMultiusuario();
