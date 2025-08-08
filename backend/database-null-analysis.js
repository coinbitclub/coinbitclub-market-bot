#!/usr/bin/env node

/**
 * 🔍 ANÁLISE COMPLETA DE DADOS NULL NO BANCO
 * ===========================================
 * 
 * Verifica todas as tabelas e identifica campos NULL
 * que podem estar impactando o processamento de ordens
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

class DatabaseNullAnalyzer {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
    }

    async analyzeAllTables() {
        console.log('🔍 INICIANDO ANÁLISE COMPLETA DE DADOS NULL');
        console.log('============================================');
        
        try {
            // 1. Listar todas as tabelas
            const tables = await this.getAllTables();
            console.log(`📊 Encontradas ${tables.length} tabelas para análise`);
            
            const criticalTables = [
                'users', 'positions', 'trades', 'signals', 'active_positions',
                'user_api_keys', 'signal_metrics_log', 'signal_conditions_tracking',
                'fear_greed_index', 'top100_data', 'btc_dominance_analysis'
            ];

            console.log('\n🎯 ANÁLISE DE TABELAS CRÍTICAS PARA TRADING');
            console.log('============================================');

            for (const tableName of criticalTables) {
                if (tables.includes(tableName)) {
                    await this.analyzeTableNulls(tableName);
                    console.log(''); // Linha em branco
                } else {
                    console.log(`❌ TABELA AUSENTE: ${tableName}`);
                }
            }

            // 2. Verificar problemas específicos de processamento
            await this.analyzeProcessingIssues();

            // 3. Verificar integridade referencial
            await this.analyzeReferentialIntegrity();

            console.log('\n✅ ANÁLISE COMPLETA FINALIZADA');

        } catch (error) {
            console.error('❌ Erro na análise:', error.message);
        } finally {
            await this.pool.end();
        }
    }

    async getAllTables() {
        const result = await this.pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        return result.rows.map(row => row.table_name);
    }

    async analyzeTableNulls(tableName) {
        try {
            console.log(`📋 TABELA: ${tableName.toUpperCase()}`);
            
            // Contar total de registros
            const totalResult = await this.pool.query(`SELECT COUNT(*) as total FROM ${tableName}`);
            const totalRecords = parseInt(totalResult.rows[0].total);
            
            console.log(`   📊 Total de registros: ${totalRecords}`);
            
            if (totalRecords === 0) {
                console.log(`   ⚠️  TABELA VAZIA`);
                return;
            }

            // Obter informações das colunas
            const columnsResult = await this.pool.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = $1 AND table_schema = 'public'
                ORDER BY ordinal_position
            `, [tableName]);

            const nullCounts = [];

            for (const column of columnsResult.rows) {
                const nullCountResult = await this.pool.query(`
                    SELECT COUNT(*) as null_count 
                    FROM ${tableName} 
                    WHERE ${column.column_name} IS NULL
                `);
                
                const nullCount = parseInt(nullCountResult.rows[0].null_count);
                const nullPercentage = ((nullCount / totalRecords) * 100).toFixed(1);
                
                if (nullCount > 0) {
                    nullCounts.push({
                        column: column.column_name,
                        type: column.data_type,
                        nullable: column.is_nullable,
                        nullCount: nullCount,
                        nullPercentage: nullPercentage
                    });
                }
            }

            if (nullCounts.length === 0) {
                console.log(`   ✅ Nenhum campo NULL encontrado`);
            } else {
                console.log(`   🚨 Campos com valores NULL:`);
                nullCounts.forEach(item => {
                    const status = item.nullable === 'YES' ? '🟡' : '🔴';
                    console.log(`      ${status} ${item.column} (${item.type}): ${item.nullCount} NULLs (${item.nullPercentage}%)`);
                });
            }

            // Verificar campos críticos específicos por tabela
            await this.checkCriticalFields(tableName, totalRecords);

        } catch (error) {
            console.log(`   ❌ Erro ao analisar ${tableName}: ${error.message}`);
        }
    }

    async checkCriticalFields(tableName, totalRecords) {
        const criticalFieldsByTable = {
            'users': ['email', 'is_active', 'plan_type'],
            'positions': ['user_id', 'symbol', 'side', 'entry_price'],
            'active_positions': ['user_id', 'ticker', 'side', 'status'],
            'trades': ['user_id', 'symbol', 'side', 'quantity', 'price'],
            'signals': ['symbol', 'signal_type', 'timestamp'],
            'signal_metrics_log': ['ticker', 'signal_type', 'ai_approved'],
            'user_api_keys': ['user_id', 'exchange', 'api_key', 'secret_key']
        };

        const criticalFields = criticalFieldsByTable[tableName];
        if (!criticalFields) return;

        const criticalNulls = [];

        for (const field of criticalFields) {
            try {
                const result = await this.pool.query(`
                    SELECT COUNT(*) as count 
                    FROM ${tableName} 
                    WHERE ${field} IS NULL
                `);
                
                const nullCount = parseInt(result.rows[0].count);
                if (nullCount > 0) {
                    criticalNulls.push({ field, count: nullCount });
                }
            } catch (error) {
                // Campo pode não existir
            }
        }

        if (criticalNulls.length > 0) {
            console.log(`   🚨 CAMPOS CRÍTICOS COM NULL:`);
            criticalNulls.forEach(item => {
                console.log(`      🔴 ${item.field}: ${item.count} registros NULL`);
            });
        }
    }

    async analyzeProcessingIssues() {
        console.log('\n🔧 ANÁLISE DE PROBLEMAS DE PROCESSAMENTO');
        console.log('========================================');

        try {
            // 1. Verificar sinais sem processamento
            const unprocessedSignals = await this.pool.query(`
                SELECT COUNT(*) as count 
                FROM signal_metrics_log 
                WHERE ai_approved IS NULL OR ai_reason IS NULL
            `);
            
            if (unprocessedSignals.rows[0] && parseInt(unprocessedSignals.rows[0].count) > 0) {
                console.log(`🚨 Sinais não processados: ${unprocessedSignals.rows[0].count}`);
            }

            // 2. Verificar usuários sem chaves de API
            const usersWithoutKeys = await this.pool.query(`
                SELECT COUNT(*) as count 
                FROM users u 
                WHERE u.is_active = true 
                AND NOT EXISTS (
                    SELECT 1 FROM user_api_keys uak 
                    WHERE uak.user_id = u.id 
                    AND uak.api_key IS NOT NULL 
                    AND uak.secret_key IS NOT NULL
                )
            `);
            
            if (usersWithoutKeys.rows[0] && parseInt(usersWithoutKeys.rows[0].count) > 0) {
                console.log(`🚨 Usuários ativos sem chaves API: ${usersWithoutKeys.rows[0].count}`);
            }

            // 3. Verificar posições sem dados essenciais
            const positionsIncomplete = await this.pool.query(`
                SELECT COUNT(*) as count 
                FROM active_positions 
                WHERE user_id IS NULL OR ticker IS NULL OR side IS NULL OR status IS NULL
            `);
            
            if (positionsIncomplete.rows[0] && parseInt(positionsIncomplete.rows[0].count) > 0) {
                console.log(`🚨 Posições com dados incompletos: ${positionsIncomplete.rows[0].count}`);
            }

            // 4. Verificar dados de mercado ausentes
            const marketDataIssues = await this.pool.query(`
                SELECT 
                    'fear_greed_index' as table_name,
                    COUNT(*) as total,
                    COUNT(CASE WHEN value IS NULL THEN 1 END) as null_values
                FROM fear_greed_index
                WHERE created_at >= NOW() - INTERVAL '24 hours'
                
                UNION ALL
                
                SELECT 
                    'top100_data' as table_name,
                    COUNT(*) as total,
                    COUNT(CASE WHEN percentage_up IS NULL THEN 1 END) as null_values
                FROM top100_data
                WHERE collected_at >= NOW() - INTERVAL '24 hours'
            `);

            marketDataIssues.rows.forEach(row => {
                if (parseInt(row.null_values) > 0) {
                    console.log(`🚨 ${row.table_name}: ${row.null_values}/${row.total} registros com valores NULL`);
                }
            });

        } catch (error) {
            console.log(`❌ Erro na análise de processamento: ${error.message}`);
        }
    }

    async analyzeReferentialIntegrity() {
        console.log('\n🔗 ANÁLISE DE INTEGRIDADE REFERENCIAL');
        console.log('====================================');

        try {
            // 1. Verificar usuários órfãos em posições
            const orphanPositions = await this.pool.query(`
                SELECT COUNT(*) as count 
                FROM active_positions ap 
                WHERE ap.user_id IS NOT NULL 
                AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = ap.user_id)
            `);
            
            if (orphanPositions.rows[0] && parseInt(orphanPositions.rows[0].count) > 0) {
                console.log(`🚨 Posições órfãs (usuário inexistente): ${orphanPositions.rows[0].count}`);
            }

            // 2. Verificar chaves de API órfãs
            const orphanApiKeys = await this.pool.query(`
                SELECT COUNT(*) as count 
                FROM user_api_keys uak 
                WHERE uak.user_id IS NOT NULL 
                AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = uak.user_id)
            `);
            
            if (orphanApiKeys.rows[0] && parseInt(orphanApiKeys.rows[0].count) > 0) {
                console.log(`🚨 Chaves API órfãs: ${orphanApiKeys.rows[0].count}`);
            }

            // 3. Verificar transações órfãs
            const orphanTransactions = await this.pool.query(`
                SELECT COUNT(*) as count 
                FROM transactions t 
                WHERE t.user_id IS NOT NULL 
                AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = t.user_id)
            `);
            
            if (orphanTransactions.rows[0] && parseInt(orphanTransactions.rows[0].count) > 0) {
                console.log(`🚨 Transações órfãs: ${orphanTransactions.rows[0].count}`);
            }

        } catch (error) {
            console.log(`❌ Erro na análise de integridade: ${error.message}`);
        }
    }
}

// Executar análise
if (require.main === module) {
    const analyzer = new DatabaseNullAnalyzer();
    analyzer.analyzeAllTables();
}

module.exports = DatabaseNullAnalyzer;
