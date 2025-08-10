#!/usr/bin/env node

/**
 * CORREÇÃO CRÍTICA: Fix de Constraint Duplicate Key + API Keys
 * Este script resolve os problemas de chaves duplicadas e valida API keys
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function corrigirProblemasConstraint() {
    console.log('🔧 CORREÇÃO CRÍTICA DE CONSTRAINTS E API KEYS');
    console.log('===============================================\n');
    
    try {
        // 1. CORRIGIR CONSTRAINT DUPLICATE KEY NA TABELA BALANCES
        console.log('📊 Analisando duplicatas na tabela balances...');
        
        const duplicatesQuery = await pool.query(`
            SELECT 
                user_id, 
                asset, 
                account_type, 
                COUNT(*) as duplicates
            FROM balances 
            GROUP BY user_id, asset, account_type 
            HAVING COUNT(*) > 1
            ORDER BY duplicates DESC
        `);
        
        if (duplicatesQuery.rows.length > 0) {
            console.log(`❌ Encontradas ${duplicatesQuery.rows.length} duplicatas:`);
            console.table(duplicatesQuery.rows);
            
            // Remover duplicatas mantendo o registro mais recente
            console.log('\n🧹 Removendo duplicatas...');
            
            for (const dup of duplicatesQuery.rows) {
                await pool.query(`
                    DELETE FROM balances 
                    WHERE id NOT IN (
                        SELECT MAX(id) 
                        FROM balances 
                        WHERE user_id = $1 AND asset = $2 AND account_type = $3
                    )
                    AND user_id = $1 AND asset = $2 AND account_type = $3
                `, [dup.user_id, dup.asset, dup.account_type]);
                
                console.log(`   ✅ Removidas duplicatas para usuário ${dup.user_id}, asset ${dup.asset}`);
            }
        } else {
            console.log('✅ Nenhuma duplicata encontrada na tabela balances');
        }

        // 2. VERIFICAR E CORRIGIR API KEYS PROBLEMÁTICAS
        console.log('\n🔑 Analisando API keys problemáticas...');
        
        const apiKeysQuery = await pool.query(`
            SELECT 
                id,
                user_id,
                exchange,
                api_key,
                CASE 
                    WHEN api_key IS NULL THEN 'NULL'
                    WHEN LENGTH(api_key) < 10 THEN 'MUITO_CURTA'
                    WHEN api_key LIKE '%test%' OR api_key LIKE '%invalid%' THEN 'INVALIDA'
                    ELSE 'OK'
                END as status_key,
                environment,
                is_active
            FROM user_api_keys 
            WHERE user_id = 16
            ORDER BY exchange, environment
        `);
        
        console.log('\n📋 API Keys do usuário 16 (Erica dos Santos):');
        console.table(apiKeysQuery.rows);

        // 3. IDENTIFICAR PROBLEMAS ESPECÍFICOS
        const problemKeys = apiKeysQuery.rows.filter(key => 
            key.status_key !== 'OK' || !key.is_active
        );
        
        if (problemKeys.length > 0) {
            console.log('\n⚠️ API Keys com problemas:');
            console.table(problemKeys);
            
            // Desativar keys problemáticas
            for (const key of problemKeys) {
                await pool.query(`
                    UPDATE user_api_keys 
                    SET is_active = false, 
                        updated_at = CURRENT_TIMESTAMP,
                        notes = CONCAT(COALESCE(notes, ''), ' [DESATIVADA: ', $1, ']')
                    WHERE id = $2
                `, [key.status_key, key.id]);
                
                console.log(`   🔒 Desativada key ${key.id} (${key.exchange}/${key.environment}): ${key.status_key}`);
            }
        }

        // 4. VERIFICAR RESTRIÇÕES GEOGRÁFICAS
        console.log('\n🌍 Verificando configurações de exchange...');
        
        const exchangeConfig = {
            binance_mainnet: { 
                blocked: true, 
                reason: 'Restricted location (Brazil)',
                solution: 'Use testnet or VPN'
            },
            binance_testnet: { 
                blocked: false, 
                reason: 'Available for testing',
                solution: 'Fix API key format'
            },
            bybit_mainnet: { 
                blocked: false, 
                reason: 'Available but needs valid keys',
                solution: 'Check API permissions'
            },
            bybit_testnet: { 
                blocked: false, 
                reason: 'Available for testing',
                solution: 'Generate new test keys'
            }
        };
        
        console.table(exchangeConfig);

        // 5. CRIAR CONFIGURAÇÃO CORRIGIDA PARA O USUÁRIO 16
        console.log('\n🛠️ Criando configuração corrigida...');
        
        await pool.query(`
            INSERT INTO user_settings (user_id, setting_key, setting_value, created_at)
            VALUES 
                (16, 'exchange_priority', 'bybit_testnet,binance_testnet', CURRENT_TIMESTAMP),
                (16, 'skip_mainnet', 'true', CURRENT_TIMESTAMP),
                (16, 'auto_recovery_enabled', 'true', CURRENT_TIMESTAMP)
            ON CONFLICT (user_id, setting_key) 
            DO UPDATE SET 
                setting_value = EXCLUDED.setting_value,
                updated_at = CURRENT_TIMESTAMP
        `);

        // 6. RESUMO FINAL
        console.log('\n📊 RESUMO DA CORREÇÃO:');
        console.log('=====================');
        
        const finalStatus = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM balances WHERE user_id = 16) as balances_count,
                (SELECT COUNT(*) FROM user_api_keys WHERE user_id = 16 AND is_active = true) as active_keys,
                (SELECT COUNT(*) FROM user_api_keys WHERE user_id = 16 AND is_active = false) as inactive_keys
        `);
        
        const stats = finalStatus.rows[0];
        console.log(`✅ Balances do usuário 16: ${stats.balances_count}`);
        console.log(`🔑 API Keys ativas: ${stats.active_keys}`);
        console.log(`🔒 API Keys desativadas: ${stats.inactive_keys}`);
        
        console.log('\n🎯 AÇÕES RECOMENDADAS:');
        console.log('- Usuário deve gerar novas API keys válidas');
        console.log('- Focar em testnet para evitar bloqueios geográficos');
        console.log('- Verificar permissões de trading nas exchanges');
        console.log('- Constraint duplicate key foi corrigida');

    } catch (error) {
        console.error('❌ Erro durante correção:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await pool.end();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    corrigirProblemasConstraint();
}

module.exports = { corrigirProblemasConstraint };
