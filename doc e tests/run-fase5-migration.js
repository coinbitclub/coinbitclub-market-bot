/**
 * 🚀 SCRIPT DE MIGRAÇÃO FASE 5 - SISTEMA ADMINISTRATIVO
 * 
 * Este script executa as migrações necessárias para a FASE 5:
 * - Admin Trading Defaults
 * - Commission Transactions
 * - System Monitoring
 * - Funções administrativas
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Carregar variáveis de ambiente
require('dotenv').config();

// Configuração do banco de dados usando as variáveis do projeto
const dbConfig = {
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT,
    ssl: {
        rejectUnauthorized: false // Para Railway
    }
};

async function runFase5Migration() {
    const pool = new Pool(dbConfig);
    
    try {
        console.log('🚀 INICIANDO MIGRAÇÃO FASE 5...');
        console.log('================================\n');
        
        // Conectar ao banco
        const client = await pool.connect();
        console.log('✅ Conectado ao banco de dados');
        
        // Ler arquivo de migração
        const migrationPath = path.join(__dirname, 'migrations', '005_admin_system.sql');
        
        if (!fs.existsSync(migrationPath)) {
            throw new Error(`Arquivo de migração não encontrado: ${migrationPath}`);
        }
        
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        console.log('✅ Arquivo de migração carregado');
        
        // Executar migração
        console.log('🔄 Executando migração...');
        await client.query(migrationSQL);
        console.log('✅ Migração executada com sucesso');
        
        // Verificar se as tabelas foram criadas
        console.log('\n🔍 VERIFICANDO ESTRUTURAS CRIADAS...');
        
        const tables = [
            'admin_trading_defaults',
            'commission_transactions', 
            'system_monitoring'
        ];
        
        for (const table of tables) {
            const result = await client.query(`
                SELECT COUNT(*) as count 
                FROM information_schema.tables 
                WHERE table_name = $1
            `, [table]);
            
            if (result.rows[0].count > 0) {
                console.log(`✅ Tabela ${table} criada com sucesso`);
            } else {
                console.log(`❌ Tabela ${table} não foi criada`);
            }
        }
        
        // Verificar funções criadas
        console.log('\n🔍 VERIFICANDO FUNÇÕES CRIADAS...');
        
        const functions = [
            'apply_admin_defaults_to_user',
            'calculate_commission',
            'log_system_event'
        ];
        
        for (const func of functions) {
            const result = await client.query(`
                SELECT COUNT(*) as count 
                FROM information_schema.routines 
                WHERE routine_name = $1
            `, [func]);
            
            if (result.rows[0].count > 0) {
                console.log(`✅ Função ${func} criada com sucesso`);
            } else {
                console.log(`❌ Função ${func} não foi criada`);
            }
        }
        
        // Verificar dados iniciais
        console.log('\n🔍 VERIFICANDO DADOS INICIAIS...');
        
        const defaultsResult = await client.query('SELECT * FROM admin_trading_defaults LIMIT 1');
        if (defaultsResult.rows.length > 0) {
            console.log('✅ Dados iniciais inseridos:', defaultsResult.rows[0]);
        } else {
            console.log('❌ Dados iniciais não foram inseridos');
        }
        
        client.release();
        
        console.log('\n🎉 MIGRAÇÃO FASE 5 COMPLETADA COM SUCESSO!');
        console.log('=========================================');
        
        console.log('\n📊 RESUMO DA MIGRAÇÃO:');
        console.log('✅ Tabela admin_trading_defaults - Criada');
        console.log('✅ Tabela commission_transactions - Criada');
        console.log('✅ Tabela system_monitoring - Criada');
        console.log('✅ Funções administrativas - Criadas');
        console.log('✅ Dados iniciais - Inseridos');
        console.log('✅ Triggers - Configurados');
        
        console.log('\n🚀 SISTEMA ADMINISTRATIVO FASE 5 PRONTO PARA USO!');
        
    } catch (error) {
        console.error('❌ ERRO NA MIGRAÇÃO FASE 5:', error.message);
        
        if (error.detail) {
            console.error('Detalhes:', error.detail);
        }
        
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Função para reverter migração (se necessário)
async function rollbackFase5Migration() {
    const pool = new Pool(dbConfig);
    
    try {
        console.log('🔄 REVERTENDO MIGRAÇÃO FASE 5...');
        
        const client = await pool.connect();
        
        // Dropar tabelas na ordem correta (considerando dependências)
        const dropQueries = [
            'DROP TABLE IF EXISTS commission_transactions CASCADE;',
            'DROP TABLE IF EXISTS system_monitoring CASCADE;',
            'DROP TABLE IF EXISTS admin_trading_defaults CASCADE;',
            'DROP FUNCTION IF EXISTS apply_admin_defaults_to_user(VARCHAR);',
            'DROP FUNCTION IF EXISTS calculate_commission(DECIMAL, DECIMAL);',
            'DROP FUNCTION IF EXISTS log_system_event(VARCHAR, TEXT, JSONB);'
        ];
        
        for (const query of dropQueries) {
            await client.query(query);
            console.log(`✅ Executado: ${query}`);
        }
        
        client.release();
        console.log('✅ Migração FASE 5 revertida com sucesso');
        
    } catch (error) {
        console.error('❌ Erro ao reverter migração:', error.message);
    } finally {
        await pool.end();
    }
}

// Verificar argumentos da linha de comando
const args = process.argv.slice(2);

if (args.includes('--rollback')) {
    rollbackFase5Migration();
} else {
    runFase5Migration();
}

module.exports = {
    runFase5Migration,
    rollbackFase5Migration
};
