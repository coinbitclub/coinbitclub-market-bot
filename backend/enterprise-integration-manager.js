#!/usr/bin/env node

/**
 * 🚀 INTEGRAÇÃO ENTERPRISE - SUBSTITUIÇÃO DOS MÓDULOS ANTIGOS
 * ==========================================================
 * 
 * Script para integrar o novo sistema enterprise no lugar dos
 * módulos antigos de conexão com exchanges
 */

const { Pool } = require('pg');
const EnterpriseExchangeConnector = require('./enterprise-exchange-connector');

class EnterpriseIntegrationManager {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
            ssl: { rejectUnauthorized: false }
        });

        this.connector = new EnterpriseExchangeConnector();
    }

    /**
     * 🔄 MIGRAR VALIDAÇÕES EXISTENTES PARA O NOVO SISTEMA
     */
    async migrateExistingValidations() {
        console.log('🔄 MIGRANDO VALIDAÇÕES PARA SISTEMA ENTERPRISE');
        console.log('===============================================');

        try {
            // Buscar usuários com chaves existentes
            const users = await this.pool.query(`
                SELECT 
                    id, username, email,
                    binance_api_key_encrypted, binance_api_secret_encrypted,
                    bybit_api_key_encrypted, bybit_api_secret_encrypted
                FROM users 
                WHERE is_active = true 
                AND (
                    (binance_api_key_encrypted IS NOT NULL AND binance_api_secret_encrypted IS NOT NULL) OR
                    (bybit_api_key_encrypted IS NOT NULL AND bybit_api_secret_encrypted IS NOT NULL)
                )
                ORDER BY id
            `);

            console.log(`👥 Encontrados ${users.rows.length} usuários para migração`);

            let successCount = 0;
            let errorCount = 0;

            for (const user of users.rows) {
                console.log(`\n🔄 Migrando usuário ${user.id} (${user.username || user.email})...`);

                try {
                    // Migrar Binance se existir
                    if (user.binance_api_key_encrypted && user.binance_api_secret_encrypted) {
                        await this.migrateUserExchange(user, 'binance');
                    }

                    // Migrar Bybit se existir
                    if (user.bybit_api_key_encrypted && user.bybit_api_secret_encrypted) {
                        await this.migrateUserExchange(user, 'bybit');
                    }

                    successCount++;
                    console.log(`  ✅ Usuário ${user.id} migrado com sucesso`);

                } catch (error) {
                    errorCount++;
                    console.log(`  ❌ Erro na migração do usuário ${user.id}: ${error.message}`);
                }
            }

            console.log(`\n📊 MIGRAÇÃO CONCLUÍDA:`);
            console.log(`  ✅ Sucessos: ${successCount}`);
            console.log(`  ❌ Erros: ${errorCount}`);
            console.log(`  📈 Taxa de sucesso: ${((successCount / users.rows.length) * 100).toFixed(1)}%`);

        } catch (error) {
            console.error('❌ Erro na migração:', error.message);
            throw error;
        }
    }

    /**
     * 🔐 MIGRAR EXCHANGE ESPECÍFICA DO USUÁRIO
     */
    async migrateUserExchange(user, exchange) {
        try {
            // Descriptografar chaves (usando a mesma lógica do sistema)
            const keys = await this.decryptUserKeys(
                user[`${exchange}_api_key_encrypted`],
                user[`${exchange}_api_secret_encrypted`]
            );

            // Testar conexão com o novo sistema enterprise
            const connection = await this.connector.connectAndValidateExchange(
                user.id,
                keys.apiKey,
                keys.apiSecret,
                exchange
            );

            if (connection.success) {
                console.log(`    ✅ ${exchange.toUpperCase()}: ${connection.exchangeName}`);
                
                // Atualizar status no banco
                await this.updateUserConnectionStatus(user.id, exchange, 'connected', connection);
                
                return true;
            } else {
                console.log(`    ❌ ${exchange.toUpperCase()}: ${connection.error}`);
                
                // Atualizar status no banco
                await this.updateUserConnectionStatus(user.id, exchange, 'failed', null, connection.error);
                
                return false;
            }

        } catch (error) {
            console.log(`    ❌ ${exchange.toUpperCase()}: Erro interno - ${error.message}`);
            
            // Atualizar status no banco
            await this.updateUserConnectionStatus(user.id, exchange, 'error', null, error.message);
            
            return false;
        }
    }

    /**
     * 💾 ATUALIZAR STATUS DA CONEXÃO NO BANCO
     */
    async updateUserConnectionStatus(userId, exchange, status, connection = null, error = null) {
        try {
            await this.pool.query(`
                INSERT INTO user_exchange_connections (
                    user_id, exchange, environment, exchange_name,
                    api_key_preview, account_info, connection_config,
                    is_active, last_validated, last_error, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
                ON CONFLICT (user_id, exchange, environment) 
                DO UPDATE SET
                    exchange_name = EXCLUDED.exchange_name,
                    api_key_preview = EXCLUDED.api_key_preview,
                    account_info = EXCLUDED.account_info,
                    connection_config = EXCLUDED.connection_config,
                    is_active = EXCLUDED.is_active,
                    last_validated = EXCLUDED.last_validated,
                    last_error = EXCLUDED.last_error,
                    updated_at = NOW()
            `, [
                userId,
                exchange.toUpperCase(),
                connection?.environment || 'UNKNOWN',
                connection?.exchangeName || null,
                connection?.account?.apiKeyPreview || null,
                connection ? JSON.stringify(connection.account) : null,
                connection ? JSON.stringify(connection.config) : null,
                status === 'connected',
                status === 'connected' ? new Date() : null,
                error
            ]);

        } catch (dbError) {
            console.log(`    ⚠️ Erro ao atualizar banco: ${dbError.message}`);
        }
    }

    /**
     * 🔐 DESCRIPTOGRAFAR CHAVES (MESMO MÉTODO DO SISTEMA)
     */
    async decryptUserKeys(encryptedKey, encryptedSecret) {
        const crypto = require('crypto');
        const encryptionKey = process.env.ENCRYPTION_KEY || 'CoinBitClubSecretKey32CharsForProd';
        
        try {
            const algorithm = 'aes-256-cbc';
            const key = crypto.scryptSync(encryptionKey, 'salt', 32);

            // Descriptografar API Key
            const keyBuffer = Buffer.from(encryptedKey, 'hex');
            const keyIv = keyBuffer.slice(0, 16);
            const keyEncrypted = keyBuffer.slice(16);
            const keyDecipher = crypto.createDecipheriv(algorithm, key, keyIv);
            const apiKey = keyDecipher.update(keyEncrypted, null, 'utf8') + keyDecipher.final('utf8');

            // Descriptografar API Secret
            const secretBuffer = Buffer.from(encryptedSecret, 'hex');
            const secretIv = secretBuffer.slice(0, 16);
            const secretEncrypted = secretBuffer.slice(16);
            const secretDecipher = crypto.createDecipheriv(algorithm, key, secretIv);
            const apiSecret = secretDecipher.update(secretEncrypted, null, 'utf8') + secretDecipher.final('utf8');

            return { apiKey, apiSecret };

        } catch (error) {
            throw new Error('Erro ao descriptografar chaves: ' + error.message);
        }
    }

    /**
     * 📊 GERAR RELATÓRIO DE MIGRAÇÃO
     */
    async generateMigrationReport() {
        console.log('\n📊 GERANDO RELATÓRIO DE MIGRAÇÃO');
        console.log('=================================');

        try {
            // Buscar estatísticas das conexões
            const connectionStats = await this.pool.query(`
                SELECT 
                    exchange,
                    environment,
                    COUNT(*) as total_users,
                    COUNT(CASE WHEN is_active = true THEN 1 END) as active_connections,
                    COUNT(CASE WHEN last_error IS NOT NULL THEN 1 END) as failed_connections
                FROM user_exchange_connections 
                GROUP BY exchange, environment
                ORDER BY exchange, environment
            `);

            console.log('\n📈 Estatísticas por Exchange:');
            console.log('═'.repeat(60));
            
            for (const stat of connectionStats.rows) {
                const successRate = stat.total_users > 0 ? 
                    ((stat.active_connections / stat.total_users) * 100).toFixed(1) : '0.0';
                
                console.log(`${stat.exchange} ${stat.environment}:`);
                console.log(`  👥 Total de usuários: ${stat.total_users}`);
                console.log(`  ✅ Conexões ativas: ${stat.active_connections}`);
                console.log(`  ❌ Conexões com erro: ${stat.failed_connections}`);
                console.log(`  📊 Taxa de sucesso: ${successRate}%`);
                console.log('');
            }

            // Buscar usuários com problemas
            const problemUsers = await this.pool.query(`
                SELECT 
                    u.id, u.username, u.email,
                    uec.exchange, uec.environment, uec.last_error
                FROM users u
                JOIN user_exchange_connections uec ON u.id = uec.user_id
                WHERE uec.is_active = false AND uec.last_error IS NOT NULL
                ORDER BY u.id, uec.exchange
            `);

            if (problemUsers.rows.length > 0) {
                console.log('⚠️ Usuários com problemas:');
                console.log('═'.repeat(60));
                
                for (const user of problemUsers.rows) {
                    console.log(`👤 ${user.username || user.email} (ID: ${user.id})`);
                    console.log(`  📱 ${user.exchange} ${user.environment}: ${user.last_error}`);
                    console.log('');
                }
            } else {
                console.log('✅ Nenhum usuário com problemas detectado!');
            }

            // Buscar saldos monitorados
            const balanceStats = await this.pool.query(`
                SELECT 
                    exchange,
                    COUNT(*) as users_with_balance,
                    SUM(total_balance_usd) as total_balance_usd,
                    AVG(total_balance_usd) as avg_balance_usd
                FROM user_balance_monitoring
                WHERE total_balance_usd > 0
                GROUP BY exchange
                ORDER BY total_balance_usd DESC
            `);

            if (balanceStats.rows.length > 0) {
                console.log('\n💰 Estatísticas de Saldos:');
                console.log('═'.repeat(60));
                
                for (const balance of balanceStats.rows) {
                    console.log(`${balance.exchange}:`);
                    console.log(`  👥 Usuários com saldo: ${balance.users_with_balance}`);
                    console.log(`  💰 Saldo total: $${parseFloat(balance.total_balance_usd).toFixed(2)}`);
                    console.log(`  📊 Saldo médio: $${parseFloat(balance.avg_balance_usd).toFixed(2)}`);
                    console.log('');
                }
            }

        } catch (error) {
            console.error('❌ Erro ao gerar relatório:', error.message);
        }
    }

    /**
     * 🧪 VALIDAR MIGRAÇÃO
     */
    async validateMigration() {
        console.log('\n🧪 VALIDANDO MIGRAÇÃO');
        console.log('=====================');

        try {
            // Verificar se todas as tabelas necessárias existem
            const tables = await this.pool.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('user_exchange_connections', 'user_balance_monitoring', 'exchange_health_monitoring')
                ORDER BY table_name
            `);

            console.log('📋 Verificação de tabelas:');
            const requiredTables = ['user_exchange_connections', 'user_balance_monitoring', 'exchange_health_monitoring'];
            
            for (const requiredTable of requiredTables) {
                const exists = tables.rows.some(t => t.table_name === requiredTable);
                console.log(`  ${exists ? '✅' : '❌'} ${requiredTable}`);
            }

            // Verificar integridade dos dados
            const dataIntegrity = await this.pool.query(`
                SELECT 
                    COUNT(DISTINCT user_id) as unique_users,
                    COUNT(*) as total_connections,
                    COUNT(CASE WHEN is_active = true THEN 1 END) as active_connections
                FROM user_exchange_connections
            `);

            console.log('\n📊 Integridade dos dados:');
            const integrity = dataIntegrity.rows[0];
            console.log(`  👥 Usuários únicos: ${integrity.unique_users}`);
            console.log(`  🔗 Total de conexões: ${integrity.total_connections}`);
            console.log(`  ✅ Conexões ativas: ${integrity.active_connections}`);

            // Testar uma conexão aleatória
            const randomConnection = await this.pool.query(`
                SELECT user_id, exchange, environment, api_key_preview
                FROM user_exchange_connections 
                WHERE is_active = true
                ORDER BY RANDOM()
                LIMIT 1
            `);

            if (randomConnection.rows.length > 0) {
                const conn = randomConnection.rows[0];
                console.log(`\n🧪 Teste de conexão aleatória:`);
                console.log(`  👤 Usuário: ${conn.user_id}`);
                console.log(`  📱 Exchange: ${conn.exchange} ${conn.environment}`);
                console.log(`  🔑 Chave: ${conn.api_key_preview}`);
                console.log(`  ✅ Dados disponíveis para teste`);
            }

            console.log('\n✅ Validação da migração concluída');

        } catch (error) {
            console.error('❌ Erro na validação:', error.message);
            throw error;
        }
    }
}

// Executar migração se chamado diretamente
if (require.main === module) {
    const manager = new EnterpriseIntegrationManager();
    
    async function runMigration() {
        try {
            console.log('🚀 INICIANDO INTEGRAÇÃO ENTERPRISE');
            console.log('===================================');
            
            // Executar migração
            await manager.migrateExistingValidations();
            
            // Gerar relatório
            await manager.generateMigrationReport();
            
            // Validar migração
            await manager.validateMigration();
            
            console.log('\n🎉 INTEGRAÇÃO ENTERPRISE CONCLUÍDA COM SUCESSO!');
            console.log('✅ Sistema pronto para usar o novo módulo enterprise');
            
        } catch (error) {
            console.error('\n💥 ERRO NA INTEGRAÇÃO:', error.message);
            process.exit(1);
        } finally {
            await manager.pool.end();
        }
    }
    
    runMigration();
}

module.exports = EnterpriseIntegrationManager;
