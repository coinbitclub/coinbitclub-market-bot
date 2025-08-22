/**
 * 🔍 VERIFICADOR DE STATUS DAS MIGRAÇÕES
 * 
 * Este script verifica quais migrações já foram executadas
 * e quais tabelas existem no banco de dados
 */

const { Pool } = require('pg');

// Carregar variáveis de ambiente
require('dotenv').config();

// Configuração do banco de dados
const dbConfig = {
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT,
    ssl: {
        rejectUnauthorized: false
    }
};

async function checkDatabaseStatus() {
    const pool = new Pool(dbConfig);
    
    try {
        console.log('🔍 VERIFICANDO STATUS DO BANCO DE DADOS...');
        console.log('==========================================\n');
        
        const client = await pool.connect();
        console.log('✅ Conectado ao banco de dados');
        
        // 1. Verificar tabelas existentes
        console.log('\n📊 TABELAS EXISTENTES:');
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        
        if (tablesResult.rows.length > 0) {
            tablesResult.rows.forEach(row => {
                console.log(`  ✅ ${row.table_name}`);
            });
        } else {
            console.log('  ❌ Nenhuma tabela encontrada');
        }
        
        // 2. Verificar se existe tabela de migrações
        console.log('\n📋 STATUS DE MIGRAÇÕES:');
        const migrationTableExists = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'schema_migrations'
            )
        `);
        
        if (migrationTableExists.rows[0].exists) {
            console.log('✅ Tabela schema_migrations existe');
            
            const migrations = await client.query(`
                SELECT version, applied_at 
                FROM schema_migrations 
                ORDER BY version
            `);
            
            if (migrations.rows.length > 0) {
                console.log('📄 Migrações aplicadas:');
                migrations.rows.forEach(row => {
                    console.log(`  ✅ ${row.version} - ${row.applied_at}`);
                });
            } else {
                console.log('❌ Nenhuma migração registrada');
            }
        } else {
            console.log('❌ Tabela schema_migrations não existe');
        }
        
        // 3. Verificar tabelas específicas importantes
        console.log('\n🔍 VERIFICAÇÃO DE TABELAS IMPORTANTES:');
        
        const importantTables = [
            'users',
            'user_sessions',
            'exchange_credentials',
            'trading_positions',
            'market_intelligence',
            'admin_trading_defaults'
        ];
        
        for (const table of importantTables) {
            const exists = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = $1
                )
            `, [table]);
            
            if (exists.rows[0].exists) {
                console.log(`  ✅ ${table} - existe`);
                
                // Contar registros
                const count = await client.query(`SELECT COUNT(*) FROM ${table}`);
                console.log(`      📊 ${count.rows[0].count} registros`);
            } else {
                console.log(`  ❌ ${table} - não existe`);
            }
        }
        
        // 4. Verificar extensões
        console.log('\n🔧 EXTENSÕES INSTALADAS:');
        const extensions = await client.query(`
            SELECT extname 
            FROM pg_extension 
            WHERE extname IN ('uuid-ossp', 'pgcrypto')
        `);
        
        extensions.rows.forEach(row => {
            console.log(`  ✅ ${row.extname}`);
        });
        
        client.release();
        
        console.log('\n🎯 RECOMENDAÇÕES:');
        
        if (!migrationTableExists.rows[0].exists) {
            console.log('📝 1. Execute as migrações na seguinte ordem:');
            console.log('     node scripts/run-migration.js 000_reset_database.sql');
            console.log('     node scripts/run-migration.js 002_auth_system.sql');
            console.log('     node scripts/run-migration.js 003_trading_engine.sql');
            console.log('     node scripts/run-migration.js 004_market_intelligence.sql');
            console.log('     node scripts/run-migration.js 005_admin_system.sql');
        } else {
            console.log('📝 1. Verificar quais migrações faltam executar');
            console.log('📝 2. Execute apenas as migrações pendentes');
        }
        
        console.log('\n✅ VERIFICAÇÃO CONCLUÍDA');
        
    } catch (error) {
        console.error('❌ ERRO NA VERIFICAÇÃO:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.error('💡 Verifique se o banco de dados está executando');
        } else if (error.code === '28P01') {
            console.error('💡 Verifique as credenciais do banco de dados');
        }
        
    } finally {
        await pool.end();
    }
}

// Executar verificação
checkDatabaseStatus().catch(console.error);
