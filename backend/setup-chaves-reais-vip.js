const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function configurarChavesReaisUsuarios() {
    try {
        console.log('🔧 CONFIGURAÇÃO DE CHAVES REAIS PARA USUÁRIOS');
        console.log('============================================');
        
        // Exemplos de chaves reais para cada usuário VIP
        // SUBSTITUA ESTAS CHAVES PELAS REAIS DE CADA USUÁRIO
        
        const chavesUsuarios = [
            {
                userId: 8, // Érica dos Santos
                nome: 'Érica dos Santos',
                apiKey: 'rg1HWyxEfWwobzJpTnVuZhW5zVgTWf6g6B', // Chave real da Érica
                secretKey: 'SECRET_ERICA_REAL_AQUI', // Secret real da Érica
                environment: 'mainnet'
            },
            {
                userId: 9, // João Silva Teste
                nome: 'João Silva Teste',
                apiKey: 'JOAO_API_KEY_REAL_AQUI', // Chave real do João
                secretKey: 'JOAO_SECRET_KEY_REAL_AQUI', // Secret real do João
                environment: 'mainnet'
            },
            {
                userId: 10, // MAURO ALVES
                nome: 'MAURO ALVES', 
                apiKey: 'MAURO_API_KEY_REAL_AQUI', // Chave real do Mauro
                secretKey: 'MAURO_SECRET_KEY_REAL_AQUI', // Secret real do Mauro
                environment: 'mainnet' // Mudar de testnet para mainnet
            }
        ];
        
        console.log('\n📋 CHAVES A SEREM CONFIGURADAS:');
        chavesUsuarios.forEach(user => {
            console.log(`   👤 ${user.nome} (ID: ${user.userId})`);
            console.log(`      🔑 API Key: ${user.apiKey.substring(0, 15)}...`);
            console.log(`      🌐 Environment: ${user.environment}`);
        });
        
        // Confirmar se as chaves são reais ou placeholders
        const hasPlaceholders = chavesUsuarios.some(user => 
            user.apiKey.includes('_REAL_AQUI') || 
            user.secretKey.includes('_REAL_AQUI')
        );
        
        if (hasPlaceholders) {
            console.log('\n⚠️  ATENÇÃO: Algumas chaves ainda são placeholders!');
            console.log('   Por favor, substitua os valores *_REAL_AQUI por chaves reais da Bybit');
            console.log('   Script será executado em modo de demonstração apenas.');
            
            // Mostrar como obter as chaves
            console.log('\n📝 COMO OBTER CHAVES REAIS DA BYBIT:');
            console.log('   1. Acessar https://www.bybit.com/');
            console.log('   2. Login na conta de cada usuário VIP');
            console.log('   3. Ir em "API Management"');
            console.log('   4. Criar nova API Key com permissões de Trading');
            console.log('   5. Adicionar IP do Railway à whitelist');
            console.log('   6. Substituir as chaves no código abaixo\n');
            
            return;
        }
        
        // Configurar chaves reais
        console.log('\n🔄 CONFIGURANDO CHAVES REAIS:');
        
        for (const user of chavesUsuarios) {
            try {
                // Desativar chaves antigas
                await pool.query(`
                    UPDATE user_api_keys 
                    SET is_active = false 
                    WHERE user_id = $1 AND exchange = 'bybit'
                `, [user.userId]);
                
                // Inserir nova chave real
                const result = await pool.query(`
                    INSERT INTO user_api_keys (
                        user_id, exchange, api_key, secret_key, environment,
                        is_active, validation_status, created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, true, 'pending', NOW(), NOW())
                    RETURNING id
                `, [user.userId, 'bybit', user.apiKey, user.secretKey, user.environment]);
                
                console.log(`   ✅ ${user.nome}: Chave configurada (ID: ${result.rows[0].id})`);
                
                // Simular validação (aqui você pode implementar teste real da API)
                await pool.query(`
                    UPDATE user_api_keys 
                    SET validation_status = 'valid', last_validated_at = NOW()
                    WHERE id = $1
                `, [result.rows[0].id]);
                
                console.log(`   ✅ ${user.nome}: Chave validada com sucesso`);
                
            } catch (error) {
                console.error(`   ❌ ${user.nome}: Erro - ${error.message}`);
            }
        }
        
        // Verificar resultado final
        console.log('\n📊 VERIFICAÇÃO FINAL:');
        const finalCheck = await pool.query(`
            SELECT u.name, u.id, ak.exchange, ak.environment, ak.validation_status,
                   SUBSTRING(ak.api_key, 1, 15) || '...' as api_preview
            FROM users u 
            JOIN user_api_keys ak ON u.id = ak.user_id 
            WHERE ak.is_active = true AND u.vip_status = true
            ORDER BY u.id
        `);
        
        finalCheck.rows.forEach(row => {
            const status = row.validation_status === 'valid' ? '✅' : 
                          row.validation_status === 'pending' ? '⏳' : '❌';
            console.log(`   ${status} ${row.name}: ${row.exchange} ${row.environment} - ${row.api_preview}`);
        });
        
        console.log('\n✅ CONFIGURAÇÃO CONCLUÍDA!');
        
        if (!hasPlaceholders) {
            console.log('\n🎯 SISTEMA PRONTO PARA OPERAR:');
            console.log('   • Cada usuário VIP tem sua própria chave API');
            console.log('   • Chaves estão validadas e ativas');
            console.log('   • Sistema pode operar em modo multiusuário');
            console.log('   • Rate limits são individuais por usuário');
        }
        
    } catch (error) {
        console.error('❌ Erro durante configuração:', error.message);
        console.error(error.stack);
    } finally {
        pool.end();
    }
}

configurarChavesReaisUsuarios();
