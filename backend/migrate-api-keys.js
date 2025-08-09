#!/usr/bin/env node

/**
 * 🔄 MIGRAÇÃO DE CHAVES DE API
 * ============================
 * 
 * Migra chaves da tabela user_api_keys para colunas na tabela users
 * e remove a tabela antiga para evitar confusão
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

class ApiKeysMigrator {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
            ssl: { rejectUnauthorized: false }
        });
    }

    async migrate() {
        console.log('🔄 INICIANDO MIGRAÇÃO DE CHAVES DE API...\n');
        
        try {
            await this.verifyCurrentState();
            await this.migrateKeys();
            await this.verifyMigration();
            await this.cleanupOldTable();
            
            console.log('\n✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
            
        } catch (error) {
            console.error('❌ ERRO na migração:', error);
            throw error;
        }
    }

    async verifyCurrentState() {
        console.log('🔍 VERIFICANDO ESTADO ATUAL...');
        
        const client = await this.pool.connect();
        
        try {
            // Verificar se tabela user_api_keys existe
            const tableExists = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'user_api_keys'
                )
            `);
            
            if (!tableExists.rows[0].exists) {
                console.log('❌ Tabela user_api_keys não existe! Migração não necessária.');
                return;
            }
            
            // Contar chaves na tabela antiga
            const oldKeysCount = await client.query(`SELECT COUNT(*) FROM user_api_keys`);
            console.log(`📊 Chaves encontradas na tabela user_api_keys: ${oldKeysCount.rows[0].count}`);
            
            // Mostrar chaves existentes
            const existingKeys = await client.query(`
                SELECT 
                    user_id,
                    exchange,
                    environment,
                    api_key_encrypted,
                    secret_key_encrypted
                FROM user_api_keys 
                ORDER BY user_id, exchange
            `);
            
            console.log('\n📋 CHAVES A SEREM MIGRADAS:');
            existingKeys.rows.forEach(key => {
                console.log(`   • User ${key.user_id}: ${key.exchange} (${key.environment})`);
            });
            
        } finally {
            client.release();
        }
    }

    async migrateKeys() {
        console.log('\n🚀 MIGRANDO CHAVES PARA TABELA USERS...');
        
        const client = await this.pool.connect();
        
        try {
            // Buscar todas as chaves
            const keys = await client.query(`
                SELECT 
                    user_id,
                    exchange,
                    environment,
                    api_key_encrypted,
                    secret_key_encrypted
                FROM user_api_keys 
                ORDER BY user_id, exchange
            `);
            
            console.log(`📦 Processando ${keys.rows.length} chaves...`);
            
            // Agrupar chaves por usuário
            const userKeys = {};
            keys.rows.forEach(key => {
                if (!userKeys[key.user_id]) {
                    userKeys[key.user_id] = {};
                }
                userKeys[key.user_id][key.exchange] = {
                    api_key: key.api_key_encrypted,
                    secret: key.secret_key_encrypted,
                    environment: key.environment
                };
            });
            
            // Migrar para cada usuário
            for (const [userId, exchanges] of Object.entries(userKeys)) {
                console.log(`\n🔹 Migrando usuário ${userId}...`);
                
                const updateFields = [];
                const updateValues = [];
                let paramIndex = 1;
                
                // Preparar campos para update
                if (exchanges.binance) {
                    updateFields.push(`binance_api_key_encrypted = $${paramIndex++}`);
                    updateFields.push(`binance_api_secret_encrypted = $${paramIndex++}`);
                    updateValues.push(exchanges.binance.api_key, exchanges.binance.secret);
                    console.log(`   ✅ Binance: ${exchanges.binance.environment}`);
                }
                
                if (exchanges.bybit) {
                    updateFields.push(`bybit_api_key_encrypted = $${paramIndex++}`);
                    updateFields.push(`bybit_api_secret_encrypted = $${paramIndex++}`);
                    updateValues.push(exchanges.bybit.api_key, exchanges.bybit.secret);
                    console.log(`   ✅ Bybit: ${exchanges.bybit.environment}`);
                }
                
                // Ativar auto trading automaticamente
                updateFields.push(`exchange_auto_trading = $${paramIndex++}`);
                updateValues.push(true);
                
                // Definir testnet mode baseado no environment
                const isTestnet = Object.values(exchanges).some(ex => ex.environment === 'testnet');
                updateFields.push(`exchange_testnet_mode = $${paramIndex++}`);
                updateValues.push(isTestnet);
                
                updateValues.push(userId);
                
                // Executar update
                const updateQuery = `
                    UPDATE users 
                    SET ${updateFields.join(', ')}
                    WHERE id = $${paramIndex}
                `;
                
                await client.query(updateQuery, updateValues);
                console.log(`   ✅ Usuário ${userId} atualizado`);
            }
            
            console.log(`\n✅ ${Object.keys(userKeys).length} usuários migrados com sucesso!`);
            
        } finally {
            client.release();
        }
    }

    async verifyMigration() {
        console.log('\n🔍 VERIFICANDO MIGRAÇÃO...');
        
        const client = await this.pool.connect();
        
        try {
            // Contar usuários com chaves migradas
            const migratedCount = await client.query(`
                SELECT COUNT(*) 
                FROM users 
                WHERE 
                    binance_api_key_encrypted IS NOT NULL 
                    OR bybit_api_key_encrypted IS NOT NULL
            `);
            
            console.log(`📊 Usuários com chaves migradas: ${migratedCount.rows[0].count}`);
            
            // Mostrar usuários migrados
            const migratedUsers = await client.query(`
                SELECT 
                    id,
                    username,
                    exchange_auto_trading,
                    exchange_testnet_mode,
                    binance_api_key_encrypted IS NOT NULL as has_binance,
                    bybit_api_key_encrypted IS NOT NULL as has_bybit
                FROM users 
                WHERE 
                    binance_api_key_encrypted IS NOT NULL 
                    OR bybit_api_key_encrypted IS NOT NULL
                ORDER BY id
            `);
            
            console.log('\n📋 USUÁRIOS MIGRADOS:');
            migratedUsers.rows.forEach(user => {
                const exchanges = [];
                if (user.has_binance) exchanges.push('Binance');
                if (user.has_bybit) exchanges.push('Bybit');
                
                console.log(`   • ID ${user.id}: ${user.username}`);
                console.log(`     Exchanges: ${exchanges.join(', ')}`);
                console.log(`     Auto Trading: ${user.exchange_auto_trading ? '✅ ATIVO' : '❌ INATIVO'}`);
                console.log(`     Testnet: ${user.exchange_testnet_mode ? 'SIM' : 'NÃO'}`);
            });
            
        } finally {
            client.release();
        }
    }

    async cleanupOldTable() {
        console.log('\n🗑️ REMOVENDO TABELA ANTIGA...');
        
        const client = await this.pool.connect();
        
        try {
            // Fazer backup dos dados antes de deletar (opcional)
            console.log('📦 Criando backup dos dados...');
            await client.query(`
                CREATE TABLE IF NOT EXISTS user_api_keys_backup AS 
                SELECT * FROM user_api_keys
            `);
            console.log('   ✅ Backup criado como user_api_keys_backup');
            
            // Remover tabela original
            await client.query('DROP TABLE user_api_keys');
            console.log('   ✅ Tabela user_api_keys removida');
            
            console.log('\n💡 NOTA: Backup mantido em user_api_keys_backup (pode ser removido futuramente)');
            
        } finally {
            client.release();
        }
    }

    async testNewSystem() {
        console.log('\n🧪 TESTANDO NOVO SISTEMA...');
        
        const client = await this.pool.connect();
        
        try {
            // Testar consulta do sistema atualizado
            const activeUsers = await client.query(`
                SELECT 
                    id,
                    username,
                    exchange_auto_trading,
                    CASE WHEN binance_api_key_encrypted IS NOT NULL AND binance_api_secret_encrypted IS NOT NULL THEN true ELSE false END as has_binance_complete,
                    CASE WHEN bybit_api_key_encrypted IS NOT NULL AND bybit_api_secret_encrypted IS NOT NULL THEN true ELSE false END as has_bybit_complete
                FROM users 
                WHERE 
                    (
                        (binance_api_key_encrypted IS NOT NULL AND binance_api_secret_encrypted IS NOT NULL) OR
                        (bybit_api_key_encrypted IS NOT NULL AND bybit_api_secret_encrypted IS NOT NULL)
                    )
                ORDER BY id
            `);
            
            console.log(`🎯 Sistema encontrará ${activeUsers.rows.length} usuários ativos:`);
            activeUsers.rows.forEach(user => {
                const exchanges = [];
                if (user.has_binance_complete) exchanges.push('🟢 Binance');
                if (user.has_bybit_complete) exchanges.push('🟡 Bybit');
                
                console.log(`   • ID ${user.id}: ${user.username} | ${exchanges.join(', ')}`);
            });
            
        } finally {
            client.release();
        }
    }

    async close() {
        await this.pool.end();
    }
}

// Executar migração
if (require.main === module) {
    const migrator = new ApiKeysMigrator();
    migrator.migrate()
        .then(() => migrator.testNewSystem())
        .then(() => {
            console.log('\n🎉 MIGRAÇÃO CONCLUÍDA! SISTEMA PRONTO PARA USO!');
            return migrator.close();
        })
        .then(() => {
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 FALHA na migração:', error);
            process.exit(1);
        });
}

module.exports = ApiKeysMigrator;
