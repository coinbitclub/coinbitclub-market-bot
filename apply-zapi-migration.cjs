#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuração do banco
const pool = new Pool({
    host: 'autorack.proxy.rlwy.net',
    port: 17089,
    database: 'railway',
    user: 'postgres',
    password: 'dWpajeMBclUlEAkrCVdKZGvyJzxQWJzl',
    ssl: { rejectUnauthorized: false }
});

async function applyZapiMigration() {
    console.log('🚀 APLICANDO MIGRAÇÃO ZAPI - Integração WhatsApp Business API');
    console.log('📅 Data:', new Date().toISOString());
    console.log('🗄️ Banco: PostgreSQL Railway Production\n');

    try {
        // Ler arquivo de migração
        const migrationPath = path.join(__dirname, 'migrations', 'zapi_integration.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('📋 Executando migração...');
        console.log(`📄 Arquivo: ${migrationPath}`);
        console.log(`📏 Tamanho: ${migrationSQL.length} caracteres\n`);

        // Executar migração
        await pool.query(migrationSQL);

        console.log('✅ MIGRAÇÃO ZAPI APLICADA COM SUCESSO!\n');

        // Verificar tabelas criadas
        console.log('🔍 Verificando tabelas criadas...');
        
        const tablesQuery = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE '%whatsapp%' OR table_name LIKE '%zapi%'
            ORDER BY table_name
        `;
        
        const tablesResult = await pool.query(tablesQuery);
        
        console.log('📊 TABELAS ZAPI CRIADAS:');
        tablesResult.rows.forEach((row, index) => {
            console.log(`   ${index + 1}. ${row.table_name}`);
        });

        // Verificar funções criadas
        console.log('\n🔍 Verificando funções criadas...');
        
        const functionsQuery = `
            SELECT routine_name 
            FROM information_schema.routines 
            WHERE routine_schema = 'public' 
            AND (routine_name LIKE '%zapi%' OR routine_name LIKE '%whatsapp_message%')
            ORDER BY routine_name
        `;
        
        const functionsResult = await pool.query(functionsQuery);
        
        console.log('⚙️ FUNÇÕES ZAPI CRIADAS:');
        functionsResult.rows.forEach((row, index) => {
            console.log(`   ${index + 1}. ${row.routine_name}()`);
        });

        // Testar configuração inicial
        console.log('\n🧪 Testando configuração inicial...');
        
        const configTest = await pool.query('SELECT get_active_zapi_config() as config');
        const config = configTest.rows[0].config;
        
        console.log('📋 Configuração ativa:', JSON.stringify(config, null, 2));

        // Testar função de estatísticas
        console.log('\n📊 Testando estatísticas...');
        
        const statsTest = await pool.query('SELECT get_whatsapp_message_stats(7) as stats');
        const stats = statsTest.rows[0].stats;
        
        console.log('📈 Estatísticas (7 dias):', JSON.stringify(stats, null, 2));

        console.log('\n🎉 SISTEMA ZAPI PRONTO PARA USO!');
        console.log('📋 PRÓXIMOS PASSOS:');
        console.log('   1. ✅ Tabelas criadas');
        console.log('   2. ✅ Funções implementadas');
        console.log('   3. ✅ Configuração inicial inserida');
        console.log('   4. 🔧 Configurar variáveis de ambiente:');
        console.log('      - ZAPI_INSTANCE_ID');
        console.log('      - ZAPI_TOKEN');
        console.log('      - ZAPI_BASE_URL');
        console.log('      - ZAPI_WEBHOOK_SECRET');
        console.log('   5. 🔗 Configurar webhook no Zapi');
        console.log('   6. 🚀 Reiniciar servidor');

    } catch (error) {
        console.error('❌ ERRO NA MIGRAÇÃO:', error.message);
        console.error('🔍 Detalhes:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Executar migração
applyZapiMigration();
