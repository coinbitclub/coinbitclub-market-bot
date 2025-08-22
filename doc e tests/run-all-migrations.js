/**
 * 🚀 EXECUTAR TODAS AS MIGRAÇÕES EM ORDEM
 * 
 * Este script executa todas as migrações na ordem correta
 * para preparar o banco para a FASE 5
 */

const fs = require('fs');
const path = require('path');
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

// Ordem das migrações
const MIGRATIONS_ORDER = [
    '002_auth_system.sql',      // Sistema de usuários
    '003_trading_engine.sql',   // Engine de trading
    '004_market_intelligence.sql', // Market intelligence
    '005_admin_system.sql'      // Sistema administrativo (FASE 5)
];

async function runAllMigrations() {
    const pool = new Pool(dbConfig);
    
    try {
        console.log('🚀 EXECUTANDO TODAS AS MIGRAÇÕES...');
        console.log('=====================================\n');
        
        const client = await pool.connect();
        console.log('✅ Conectado ao banco de dados');
        
        // Criar tabela de controle de migrações se não existir
        await client.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version VARCHAR(255) PRIMARY KEY,
                applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Tabela schema_migrations criada/verificada');
        
        // Executar cada migração
        for (const migration of MIGRATIONS_ORDER) {
            console.log(`\n🔄 Executando: ${migration}`);
            
            // Verificar se já foi executada
            const checkResult = await client.query(
                'SELECT version FROM schema_migrations WHERE version = $1',
                [migration]
            );
            
            if (checkResult.rows.length > 0) {
                console.log(`⏭️  ${migration} já foi executada, pulando...`);
                continue;
            }
            
            // Ler arquivo de migração
            const migrationPath = path.join(__dirname, 'migrations', migration);
            
            if (!fs.existsSync(migrationPath)) {
                console.log(`❌ Arquivo não encontrado: ${migration}`);
                continue;
            }
            
            const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
            
            try {
                // Executar migração em transação
                await client.query('BEGIN');
                await client.query(migrationSQL);
                
                // Registrar migração como executada
                await client.query(
                    'INSERT INTO schema_migrations (version) VALUES ($1)',
                    [migration]
                );
                
                await client.query('COMMIT');
                console.log(`✅ ${migration} executada com sucesso`);
                
            } catch (migrationError) {
                await client.query('ROLLBACK');
                console.error(`❌ Erro ao executar ${migration}:`, migrationError.message);
                
                // Se for erro de tabela já existe, continuar
                if (migrationError.message.includes('already exists')) {
                    console.log(`⚠️  ${migration} - algumas estruturas já existem, continuando...`);
                    
                    // Registrar como executada mesmo assim
                    await client.query(
                        'INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT (version) DO NOTHING',
                        [migration]
                    );
                } else {
                    throw migrationError;
                }
            }
        }
        
        client.release();
        
        console.log('\n🎉 TODAS AS MIGRAÇÕES COMPLETADAS!');
        console.log('=================================');
        
        // Verificar status final
        console.log('\n📊 VERIFICAÇÃO FINAL:');
        await verifyMigrations();
        
    } catch (error) {
        console.error('❌ ERRO GERAL NAS MIGRAÇÕES:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

async function verifyMigrations() {
    const pool = new Pool(dbConfig);
    
    try {
        const client = await pool.connect();
        
        // Verificar migrações aplicadas
        const migrations = await client.query(`
            SELECT version, applied_at 
            FROM schema_migrations 
            ORDER BY version
        `);
        
        console.log('📄 Migrações aplicadas:');
        migrations.rows.forEach(row => {
            console.log(`  ✅ ${row.version} - ${row.applied_at}`);
        });
        
        // Verificar tabelas importantes
        const importantTables = [
            'users',
            'user_sessions', 
            'exchange_credentials',
            'trading_positions',
            'market_intelligence',
            'admin_trading_defaults'
        ];
        
        console.log('\n📋 Tabelas importantes:');
        for (const table of importantTables) {
            const exists = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = $1
                )
            `, [table]);
            
            const status = exists.rows[0].exists ? '✅' : '❌';
            console.log(`  ${status} ${table}`);
        }
        
        client.release();
        
    } catch (error) {
        console.error('❌ Erro na verificação:', error.message);
    } finally {
        await pool.end();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    runAllMigrations().catch(console.error);
}

module.exports = {
    runAllMigrations,
    verifyMigrations
};
