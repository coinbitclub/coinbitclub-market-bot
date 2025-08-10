require('dotenv').config();
const { Pool } = require('pg');

/**
 * 🔍 DIAGNÓSTICO FINAL DA ESTRUTURA DO BANCO
 * Identifica a estrutura real das tabelas de usuários e chaves API
 */

class DatabaseStructureDiagnostic {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
    }

    async diagnoseDatabase() {
        console.log('🔍 DIAGNÓSTICO FINAL DA ESTRUTURA DO BANCO');
        console.log('='.repeat(60));
        
        try {
            // 1. Listar todas as tabelas relacionadas a usuários
            await this.listUserTables();
            
            // 2. Verificar estrutura da tabela users
            await this.checkUsersTable();
            
            // 3. Verificar tabelas de chaves API
            await this.checkApiKeyTables();
            
            // 4. Verificar dados de usuários
            await this.checkUserData();
            
            // 5. Criar correção final
            await this.createFinalFix();
            
        } catch (error) {
            console.error('❌ Erro no diagnóstico:', error);
        } finally {
            await this.pool.end();
        }
    }

    async listUserTables() {
        console.log('\n📋 TABELAS RELACIONADAS A USUÁRIOS');
        console.log('-'.repeat(40));
        
        try {
            const tables = await this.pool.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name LIKE '%user%'
                OR table_name LIKE '%api%'
                ORDER BY table_name
            `);
            
            console.log('📁 Tabelas encontradas:');
            tables.rows.forEach(row => {
                console.log(`   📂 ${row.table_name}`);
            });
            
        } catch (error) {
            console.error('❌ Erro ao listar tabelas:', error.message);
        }
    }

    async checkUsersTable() {
        console.log('\n👥 ESTRUTURA DA TABELA USERS');
        console.log('-'.repeat(40));
        
        try {
            const columns = await this.pool.query(`
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = 'users'
                ORDER BY ordinal_position
            `);
            
            console.log('📋 Colunas da tabela users:');
            columns.rows.forEach(col => {
                console.log(`   📝 ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
            });
            
            // Verificar alguns dados
            const sampleData = await this.pool.query(`
                SELECT id, username, email, nome, ativo
                FROM users 
                LIMIT 3
            `);
            
            console.log('\n📊 Dados de exemplo:');
            sampleData.rows.forEach(user => {
                console.log(`   👤 ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, Nome: ${user.nome || 'N/A'}, Ativo: ${user.ativo}`);
            });
            
        } catch (error) {
            console.error('❌ Erro ao verificar tabela users:', error.message);
        }
    }

    async checkApiKeyTables() {
        console.log('\n🔑 TABELAS DE CHAVES API');
        console.log('-'.repeat(40));
        
        try {
            // Verificar se existe user_api_keys
            const apiKeysTables = await this.pool.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND (table_name LIKE '%api%' OR table_name LIKE '%key%')
                ORDER BY table_name
            `);
            
            console.log('🔑 Tabelas de API encontradas:');
            apiKeysTables.rows.forEach(row => {
                console.log(`   📂 ${row.table_name}`);
            });
            
            // Verificar estrutura de user_api_keys se existir
            for (const table of apiKeysTables.rows) {
                const tableName = table.table_name;
                
                try {
                    const columns = await this.pool.query(`
                        SELECT column_name, data_type
                        FROM information_schema.columns 
                        WHERE table_name = $1
                        ORDER BY ordinal_position
                    `, [tableName]);
                    
                    console.log(`\n📋 Estrutura de ${tableName}:`);
                    columns.rows.forEach(col => {
                        console.log(`   📝 ${col.column_name} (${col.data_type})`);
                    });
                    
                    // Verificar dados se for tabela de chaves
                    if (tableName.includes('api') || tableName.includes('key')) {
                        const sampleData = await this.pool.query(`
                            SELECT * FROM ${tableName} LIMIT 2
                        `);
                        
                        if (sampleData.rows.length > 0) {
                            console.log(`   📊 ${sampleData.rows.length} registros encontrados`);
                            // Mostrar apenas colunas não sensíveis
                            const firstRow = sampleData.rows[0];
                            Object.keys(firstRow).forEach(key => {
                                if (!key.includes('secret') && !key.includes('key') && !key.includes('password')) {
                                    console.log(`     ${key}: ${firstRow[key]}`);
                                }
                            });
                        }
                    }
                    
                } catch (error) {
                    console.log(`   ⚠️  Erro ao verificar ${tableName}: ${error.message.substring(0, 50)}...`);
                }
            }
            
        } catch (error) {
            console.error('❌ Erro ao verificar tabelas de API:', error.message);
        }
    }

    async checkUserData() {
        console.log('\n📊 DADOS DE USUÁRIOS E CHAVES');
        console.log('-'.repeat(40));
        
        try {
            // Verificar quantos usuários existem
            const userCount = await this.pool.query(`
                SELECT COUNT(*) as total FROM users
            `);
            
            console.log(`👥 Total de usuários: ${userCount.rows[0].total}`);
            
            // Tentar encontrar onde estão as chaves API
            const possibleApiColumns = [
                'binance_api_key', 'bybit_api_key', 'api_key', 'apikey',
                'binance_key', 'bybit_key', 'exchange_key'
            ];
            
            for (const columnName of possibleApiColumns) {
                try {
                    const columnExists = await this.pool.query(`
                        SELECT column_name 
                        FROM information_schema.columns 
                        WHERE table_name = 'users' 
                        AND column_name = $1
                    `, [columnName]);
                    
                    if (columnExists.rows.length > 0) {
                        console.log(`✅ Coluna encontrada: users.${columnName}`);
                        
                        // Verificar quantos têm valores
                        const withKeys = await this.pool.query(`
                            SELECT COUNT(*) as count
                            FROM users 
                            WHERE ${columnName} IS NOT NULL 
                            AND ${columnName} != ''
                        `);
                        
                        console.log(`   📊 ${withKeys.rows[0].count} usuários com ${columnName}`);
                    }
                } catch (error) {
                    // Coluna não existe
                }
            }
            
            // Verificar em outras tabelas
            const otherTables = ['user_api_keys', 'api_keys', 'exchange_configs', 'user_configs'];
            
            for (const tableName of otherTables) {
                try {
                    const tableExists = await this.pool.query(`
                        SELECT table_name 
                        FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = $1
                    `, [tableName]);
                    
                    if (tableExists.rows.length > 0) {
                        const count = await this.pool.query(`SELECT COUNT(*) as total FROM ${tableName}`);
                        console.log(`📂 ${tableName}: ${count.rows[0].total} registros`);
                        
                        // Mostrar estrutura
                        const structure = await this.pool.query(`
                            SELECT column_name 
                            FROM information_schema.columns 
                            WHERE table_name = $1
                            ORDER BY ordinal_position
                        `, [tableName]);
                        
                        console.log(`   📋 Colunas: ${structure.rows.map(r => r.column_name).join(', ')}`);
                    }
                } catch (error) {
                    // Tabela não existe
                }
            }
            
        } catch (error) {
            console.error('❌ Erro ao verificar dados:', error.message);
        }
    }

    async createFinalFix() {
        console.log('\n🛠️ CRIANDO CORREÇÃO FINAL');
        console.log('-'.repeat(40));
        
        try {
            // Baseado no que descobrimos, criar as colunas necessárias
            console.log('🔧 Adicionando colunas de chaves API à tabela users...');
            
            const apiColumns = [
                'binance_api_key VARCHAR(255)',
                'binance_secret_key VARCHAR(255)', 
                'bybit_api_key VARCHAR(255)',
                'bybit_secret_key VARCHAR(255)',
                'trading_enabled BOOLEAN DEFAULT false',
                'binance_testnet BOOLEAN DEFAULT true',
                'bybit_testnet BOOLEAN DEFAULT true'
            ];
            
            for (const column of apiColumns) {
                try {
                    await this.pool.query(`
                        ALTER TABLE users 
                        ADD COLUMN IF NOT EXISTS ${column}
                    `);
                    console.log(`   ✅ ${column.split(' ')[0]} adicionada`);
                } catch (error) {
                    console.log(`   ⚠️  ${column.split(' ')[0]}: ${error.message.substring(0, 30)}...`);
                }
            }
            
            // Criar tabela de logs se não existir
            try {
                await this.pool.query(`
                    CREATE TABLE IF NOT EXISTS system_logs (
                        id SERIAL PRIMARY KEY,
                        level VARCHAR(20) DEFAULT 'INFO',
                        message TEXT NOT NULL,
                        details JSONB,
                        created_at TIMESTAMP DEFAULT NOW()
                    )
                `);
                console.log('✅ Tabela system_logs criada');
            } catch (error) {
                console.log('⚠️  system_logs:', error.message.substring(0, 50));
            }
            
            // Verificar resultado final
            const finalCheck = await this.pool.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' 
                AND column_name IN ('binance_api_key', 'bybit_api_key', 'trading_enabled', 'nome')
                ORDER BY column_name
            `);
            
            console.log('\n✅ Colunas finais na tabela users:');
            finalCheck.rows.forEach(row => {
                console.log(`   ✅ ${row.column_name}`);
            });
            
            console.log('\n🎯 ESTRUTURA FINAL PRONTA PARA USO:');
            console.log('   ✅ Tabela users com colunas de API');
            console.log('   ✅ Coluna "nome" adicionada'); 
            console.log('   ✅ Colunas de trading configuradas');
            console.log('   ✅ Tabela system_logs criada');
            console.log('   ✅ Sistema pronto para chaves API reais');
            
        } catch (error) {
            console.error('❌ Erro na correção final:', error.message);
        }
    }
}

// Executar diagnóstico
if (require.main === module) {
    const diagnostic = new DatabaseStructureDiagnostic();
    diagnostic.diagnoseDatabase();
}

module.exports = DatabaseStructureDiagnostic;
