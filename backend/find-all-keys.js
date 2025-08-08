#!/usr/bin/env node

/**
 * 🔍 BUSCAR TODAS AS CHAVES NO BANCO
 * ==================================
 * 
 * Script para identificar todos os usuários com chaves de API
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

class AllKeysInvestigator {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
            ssl: { rejectUnauthorized: false }
        });
    }

    async findAllKeys() {
        console.log('🔍 BUSCANDO TODAS AS CHAVES NO BANCO DE DADOS...\n');
        
        const client = await this.pool.connect();
        
        try {
            // Buscar TODOS os usuários que têm chaves de API (independente do auto_trading)
            const allKeysQuery = await client.query(`
                SELECT 
                    id,
                    username,
                    email,
                    exchange_auto_trading,
                    exchange_testnet_mode,
                    binance_api_key_encrypted IS NOT NULL as has_binance_key,
                    binance_api_secret_encrypted IS NOT NULL as has_binance_secret,
                    bybit_api_key_encrypted IS NOT NULL as has_bybit_key,
                    bybit_api_secret_encrypted IS NOT NULL as has_bybit_secret,
                    api_validation_status,
                    created_at
                FROM users 
                WHERE 
                    binance_api_key_encrypted IS NOT NULL 
                    OR binance_api_secret_encrypted IS NOT NULL
                    OR bybit_api_key_encrypted IS NOT NULL 
                    OR bybit_api_secret_encrypted IS NOT NULL
                ORDER BY id
            `);
            
            console.log(`📊 TOTAL DE USUÁRIOS COM CHAVES: ${allKeysQuery.rows.length}`);
            console.log('===============================================');
            
            if (allKeysQuery.rows.length === 0) {
                console.log('❌ NENHUM usuário encontrado com chaves de API!');
                return;
            }
            
            allKeysQuery.rows.forEach(user => {
                console.log(`\n🔹 ID ${user.id}: ${user.username} (${user.email})`);
                console.log(`   Auto Trading: ${user.exchange_auto_trading ? '✅ ATIVO' : '❌ INATIVO'}`);
                console.log(`   Testnet: ${user.exchange_testnet_mode ? 'SIM' : 'NÃO'}`);
                console.log(`   Binance: Key=${user.has_binance_key ? '✅' : '❌'} Secret=${user.has_binance_secret ? '✅' : '❌'}`);
                console.log(`   Bybit: Key=${user.has_bybit_key ? '✅' : '❌'} Secret=${user.has_bybit_secret ? '✅' : '❌'}`);
                console.log(`   Status API: ${user.api_validation_status}`);
                
                const hasCompleteKeys = (user.has_binance_key && user.has_binance_secret) || (user.has_bybit_key && user.has_bybit_secret);
                if (hasCompleteKeys) {
                    console.log(`   🎯 ELEGÍVEL: ${user.exchange_auto_trading ? 'JÁ ATIVO' : 'PRECISA ATIVAR AUTO_TRADING'}`);
                } else {
                    console.log(`   ⚠️  INCOMPLETO: Faltam chaves`);
                }
            });
            
            // Estatísticas
            const stats = allKeysQuery.rows.reduce((acc, user) => {
                if (user.exchange_auto_trading) acc.autoTradingAtivo++;
                if (!user.exchange_auto_trading) acc.autoTradingInativo++;
                
                const hasCompleteKeys = (user.has_binance_key && user.has_binance_secret) || (user.has_bybit_key && user.has_bybit_secret);
                if (hasCompleteKeys) acc.chavesCompletas++;
                else acc.chavesIncompletas++;
                
                if (hasCompleteKeys && !user.exchange_auto_trading) acc.precisaAtivar++;
                
                return acc;
            }, {
                autoTradingAtivo: 0,
                autoTradingInativo: 0,
                chavesCompletas: 0,
                chavesIncompletas: 0,
                precisaAtivar: 0
            });
            
            console.log('\n\n📈 ESTATÍSTICAS:');
            console.log('================');
            console.log(`Total com chaves: ${allKeysQuery.rows.length}`);
            console.log(`Auto Trading ATIVO: ${stats.autoTradingAtivo}`);
            console.log(`Auto Trading INATIVO: ${stats.autoTradingInativo}`);
            console.log(`Chaves COMPLETAS: ${stats.chavesCompletas}`);
            console.log(`Chaves INCOMPLETAS: ${stats.chavesIncompletas}`);
            console.log(`PRECISAM ATIVAR: ${stats.precisaAtivar}`);
            
            // Mostrar comando para ativar
            if (stats.precisaAtivar > 0) {
                console.log('\n\n💡 SOLUÇÃO SUGERIDA:');
                console.log('===================');
                console.log('Para ativar auto trading para todos com chaves completas:');
                
                const idsParaAtivar = allKeysQuery.rows
                    .filter(user => {
                        const hasCompleteKeys = (user.has_binance_key && user.has_binance_secret) || (user.has_bybit_key && user.has_bybit_secret);
                        return hasCompleteKeys && !user.exchange_auto_trading;
                    })
                    .map(user => user.id);
                
                if (idsParaAtivar.length > 0) {
                    console.log(`\nSQL: UPDATE users SET exchange_auto_trading = true WHERE id IN (${idsParaAtivar.join(', ')});`);
                    console.log(`\nIDs para ativar: ${idsParaAtivar.join(', ')}`);
                }
            }
            
            return {
                totalUsers: allKeysQuery.rows.length,
                userDetails: allKeysQuery.rows,
                stats,
                idsToActivate: allKeysQuery.rows
                    .filter(user => {
                        const hasCompleteKeys = (user.has_binance_key && user.has_binance_secret) || (user.has_bybit_key && user.has_bybit_secret);
                        return hasCompleteKeys && !user.exchange_auto_trading;
                    })
                    .map(user => user.id)
            };
            
        } finally {
            client.release();
        }
    }

    async activateAutoTradingForAll() {
        console.log('\n\n🚀 ATIVANDO AUTO TRADING PARA TODOS COM CHAVES COMPLETAS...');
        
        const client = await this.pool.connect();
        
        try {
            // Ativar auto trading para todos que têm chaves completas
            const updateResult = await client.query(`
                UPDATE users 
                SET exchange_auto_trading = true 
                WHERE 
                    exchange_auto_trading = false
                    AND (
                        (binance_api_key_encrypted IS NOT NULL AND binance_api_secret_encrypted IS NOT NULL) OR
                        (bybit_api_key_encrypted IS NOT NULL AND bybit_api_secret_encrypted IS NOT NULL)
                    )
            `);
            
            console.log(`✅ ${updateResult.rowCount} usuários tiveram auto trading ATIVADO!`);
            
            return updateResult.rowCount;
            
        } finally {
            client.release();
        }
    }

    async close() {
        await this.pool.end();
    }
}

// Executar investigação
if (require.main === module) {
    const investigator = new AllKeysInvestigator();
    investigator.findAllKeys()
        .then((result) => {
            console.log('\n🎯 INVESTIGAÇÃO CONCLUÍDA!');
            
            if (result && result.idsToActivate.length > 0) {
                console.log(`\n❓ Deseja ativar auto trading para os ${result.idsToActivate.length} usuários com chaves completas?`);
                console.log('   Execute: node find-all-keys.js --activate');
            }
            
            return investigator.close();
        })
        .then(() => {
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 ERRO na investigação:', error);
            process.exit(1);
        });
    
    // Verificar se foi passado parâmetro para ativar
    if (process.argv.includes('--activate')) {
        investigator.activateAutoTradingForAll()
            .then((count) => {
                console.log(`\n🎉 AUTO TRADING ATIVADO PARA ${count} USUÁRIOS!`);
                return investigator.close();
            })
            .then(() => {
                process.exit(0);
            })
            .catch(error => {
                console.error('💥 ERRO na ativação:', error);
                process.exit(1);
            });
    }
}

module.exports = AllKeysInvestigator;
