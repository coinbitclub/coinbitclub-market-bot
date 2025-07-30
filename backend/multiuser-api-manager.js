const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

class MultiUserApiKeyManager {
    constructor() {
        this.pool = pool;
    }

    // 1. Buscar chaves API de um usuário específico
    async getUserApiKeys(userId, exchange = 'bybit') {
        try {
            const result = await this.pool.query(`
                SELECT * FROM user_api_keys 
                WHERE user_id = $1 AND exchange = $2 AND is_active = true
                ORDER BY created_at DESC
                LIMIT 1
            `, [userId, exchange]);

            if (result.rows.length === 0) {
                console.log(`⚠️  Usuário ${userId} não possui chaves para ${exchange}`);
                return null;
            }

            return result.rows[0];
        } catch (error) {
            console.error(`❌ Erro ao buscar chaves do usuário ${userId}:`, error.message);
            return null;
        }
    }

    // 2. Validar se as chaves de um usuário estão funcionando
    async validateUserKeys(userId) {
        try {
            const keys = await this.getUserApiKeys(userId);
            if (!keys) return false;

            // Aqui você pode implementar teste real da API da Bybit
            // Por enquanto, vamos validar o formato básico
            const isValidFormat = keys.api_key && 
                                keys.api_key.length > 10 && 
                                keys.secret_key && 
                                keys.secret_key.length > 10;

            if (isValidFormat) {
                await this.pool.query(`
                    UPDATE user_api_keys 
                    SET validation_status = 'valid', last_validated_at = NOW()
                    WHERE id = $1
                `, [keys.id]);
                return true;
            } else {
                await this.pool.query(`
                    UPDATE user_api_keys 
                    SET validation_status = 'error', error_message = 'Formato de chave inválido'
                    WHERE id = $1
                `, [keys.id]);
                return false;
            }
        } catch (error) {
            console.error(`❌ Erro ao validar chaves do usuário ${userId}:`, error.message);
            return false;
        }
    }

    // 3. Adicionar/Atualizar chaves de um usuário
    async setUserApiKeys(userId, apiKey, secretKey, exchange = 'bybit', environment = 'mainnet') {
        try {
            // Desativar chaves antigas
            await this.pool.query(`
                UPDATE user_api_keys 
                SET is_active = false 
                WHERE user_id = $1 AND exchange = $2
            `, [userId, exchange]);

            // Inserir nova chave
            const result = await this.pool.query(`
                INSERT INTO user_api_keys (
                    user_id, exchange, api_key, secret_key, environment,
                    is_active, validation_status, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, true, 'pending', NOW(), NOW())
                RETURNING *
            `, [userId, exchange, apiKey, secretKey, environment]);

            console.log(`✅ Chaves atualizadas para usuário ${userId}`);
            return result.rows[0];
        } catch (error) {
            console.error(`❌ Erro ao definir chaves do usuário ${userId}:`, error.message);
            return null;
        }
    }

    // 4. Listar todos os usuários e suas chaves
    async listAllUsersWithKeys() {
        try {
            const result = await this.pool.query(`
                SELECT 
                    u.id, u.name, u.email, u.vip_status, u.is_active,
                    ak.id as key_id, ak.exchange, ak.environment, 
                    ak.validation_status, ak.is_active as key_active,
                    SUBSTRING(ak.api_key, 1, 15) || '...' as api_key_preview
                FROM users u
                LEFT JOIN user_api_keys ak ON u.id = ak.user_id AND ak.is_active = true
                WHERE u.is_active = true
                ORDER BY u.id, ak.exchange
            `);

            return result.rows;
        } catch (error) {
            console.error('❌ Erro ao listar usuários:', error.message);
            return [];
        }
    }

    // 5. Configurar chaves padrão para usuários sem chaves
    async setupDefaultKeys() {
        try {
            console.log('🔧 CONFIGURANDO CHAVES PADRÃO PARA USUÁRIOS SEM CHAVES');
            
            // Buscar usuários ativos sem chaves
            const usersWithoutKeys = await this.pool.query(`
                SELECT u.* FROM users u 
                LEFT JOIN user_api_keys ak ON u.id = ak.user_id AND ak.is_active = true
                WHERE u.is_active = true AND ak.id IS NULL
            `);

            console.log(`📋 Encontrados ${usersWithoutKeys.rows.length} usuários sem chaves`);

            for (const user of usersWithoutKeys.rows) {
                console.log(`⚙️  Configurando chaves para: ${user.name} (ID: ${user.id})`);
                
                // Para usuários VIP, criar placeholder para chaves individuais
                if (user.vip_status === true) {
                    await this.setUserApiKeys(
                        user.id,
                        `VIP_API_KEY_${user.id}_PENDING`,
                        `VIP_SECRET_KEY_${user.id}_PENDING`,
                        'bybit',
                        'mainnet'
                    );
                    console.log(`   ⭐ Placeholder VIP criado para ${user.name}`);
                } else {
                    // Para usuários comuns, usar chaves compartilhadas (se necessário)
                    // Por enquanto, não criar chaves automáticas
                    console.log(`   ⏸️  Usuário comum - chaves serão definidas manualmente`);
                }
            }

            return usersWithoutKeys.rows.length;
        } catch (error) {
            console.error('❌ Erro ao configurar chaves padrão:', error.message);
            return 0;
        }
    }

    // 6. Relatório completo do sistema
    async generateReport() {
        try {
            console.log('📊 RELATÓRIO COMPLETO - SISTEMA MULTIUSUÁRIO');
            console.log('===========================================');

            const users = await this.listAllUsersWithKeys();
            
            // Agrupar por usuário
            const userMap = {};
            users.forEach(row => {
                if (!userMap[row.id]) {
                    userMap[row.id] = {
                        user: {
                            id: row.id,
                            name: row.name,
                            email: row.email,
                            vip_status: row.vip_status,
                            is_active: row.is_active
                        },
                        keys: []
                    };
                }
                
                if (row.key_id) {
                    userMap[row.id].keys.push({
                        id: row.key_id,
                        exchange: row.exchange,
                        environment: row.environment,
                        validation_status: row.validation_status,
                        key_active: row.key_active,
                        api_key_preview: row.api_key_preview
                    });
                }
            });

            // Estatísticas gerais
            const totalUsers = Object.keys(userMap).length;
            const usersWithKeys = Object.values(userMap).filter(u => u.keys.length > 0).length;
            const vipUsers = Object.values(userMap).filter(u => u.user.vip_status === true).length;
            const validKeys = Object.values(userMap).reduce((acc, u) => 
                acc + u.keys.filter(k => k.validation_status === 'valid').length, 0);

            console.log('\n📈 ESTATÍSTICAS:');
            console.log(`   👥 Total de usuários: ${totalUsers}`);
            console.log(`   🔑 Usuários com chaves: ${usersWithKeys}`);
            console.log(`   ⭐ Usuários VIP: ${vipUsers}`);
            console.log(`   ✅ Chaves válidas: ${validKeys}`);

            console.log('\n👥 DETALHES POR USUÁRIO:');
            Object.values(userMap).forEach(userData => {
                const { user, keys } = userData;
                const vipIcon = user.vip_status ? '⭐' : '👤';
                const statusIcon = keys.length > 0 ? 
                    (keys.some(k => k.validation_status === 'valid') ? '✅' : 
                     keys.some(k => k.validation_status === 'pending') ? '⏳' : '❌') : '🚫';

                console.log(`\n   ${statusIcon} ${vipIcon} ${user.name || 'N/A'} (ID: ${user.id})`);
                console.log(`      📧 Email: ${user.email || 'N/A'}`);
                
                if (keys.length === 0) {
                    console.log(`      ❌ NENHUMA CHAVE CONFIGURADA`);
                } else {
                    keys.forEach(key => {
                        const keyStatus = key.validation_status === 'valid' ? '✅' : 
                                        key.validation_status === 'pending' ? '⏳' : '❌';
                        console.log(`      🔑 ${key.exchange} (${key.environment}): ${keyStatus} ${key.validation_status}`);
                        console.log(`         Chave: ${key.api_key_preview}`);
                    });
                }
            });

            return userMap;
        } catch (error) {
            console.error('❌ Erro ao gerar relatório:', error.message);
            return {};
        }
    }

    // 7. Limpar chaves inválidas
    async cleanupInvalidKeys() {
        try {
            console.log('🧹 LIMPANDO CHAVES INVÁLIDAS E DUPLICADAS');
            
            // Desativar chaves com erro permanente
            const errorKeys = await this.pool.query(`
                UPDATE user_api_keys 
                SET is_active = false 
                WHERE validation_status = 'error' AND is_active = true
                RETURNING id, user_id
            `);

            console.log(`   🗑️  ${errorKeys.rows.length} chaves com erro foram desativadas`);

            // Desativar chaves duplicadas (manter apenas a mais recente)
            await this.pool.query(`
                UPDATE user_api_keys 
                SET is_active = false 
                WHERE id NOT IN (
                    SELECT DISTINCT ON (user_id, exchange) id
                    FROM user_api_keys 
                    WHERE is_active = true
                    ORDER BY user_id, exchange, created_at DESC
                )
            `);

            console.log('   ✅ Chaves duplicadas removidas');

            return errorKeys.rows.length;
        } catch (error) {
            console.error('❌ Erro durante limpeza:', error.message);
            return 0;
        }
    }

    // 8. Fechar conexão
    async close() {
        await this.pool.end();
    }
}

// Função principal para executar diagnóstico e correções
async function main() {
    const manager = new MultiUserApiKeyManager();

    try {
        // 1. Gerar relatório inicial
        await manager.generateReport();

        // 2. Configurar chaves padrão para usuários sem chaves
        await manager.setupDefaultKeys();

        // 3. Limpar chaves inválidas
        await manager.cleanupInvalidKeys();

        // 4. Gerar relatório final
        console.log('\n' + '='.repeat(50));
        console.log('📋 RELATÓRIO FINAL APÓS CORREÇÕES:');
        console.log('='.repeat(50));
        await manager.generateReport();

        console.log('\n✅ SISTEMA MULTIUSUÁRIO CONFIGURADO COM SUCESSO!');
        console.log('\n📝 PRÓXIMOS PASSOS:');
        console.log('   1. 🔑 Substituir placeholders VIP por chaves reais da Bybit');
        console.log('   2. 🧪 Testar operações com cada usuário');
        console.log('   3. 📊 Implementar monitoramento de rate limits por usuário');
        console.log('   4. 🔒 Configurar rotação automática de chaves');

    } catch (error) {
        console.error('❌ Erro durante execução:', error.message);
    } finally {
        await manager.close();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = MultiUserApiKeyManager;
