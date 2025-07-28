/**
 * 🔍 VERIFICAR ESTRUTURA TABELA OPERATIONS
 * Para corrigir o monitor tempo real
 */

const { Client } = require('pg');

const DATABASE_CONFIG = {
    host: 'yamabiko.proxy.rlwy.net',
    port: 32866,
    database: 'railway',
    user: 'postgres',
    password: 'TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS',
    ssl: false,
    connectionTimeoutMillis: 30000
};

async function checkOperationsTable() {
    const client = new Client(DATABASE_CONFIG);
    
    try {
        await client.connect();
        
        // Verificar estrutura da tabela operations
        console.log('📊 ESTRUTURA DA TABELA OPERATIONS:');
        const columnsQuery = `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'operations' AND table_schema = 'public'
            ORDER BY ordinal_position;
        `;
        
        const columnsResult = await client.query(columnsQuery);
        if (columnsResult.rows.length > 0) {
            columnsResult.rows.forEach(col => {
                console.log(`   🔸 ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? '- NOT NULL' : ''}`);
            });
        } else {
            console.log('   ⚠️ Tabela operations não encontrada');
        }

        // Mostrar alguns registros
        console.log('\n📋 REGISTROS DE EXEMPLO:');
        const sampleQuery = 'SELECT * FROM operations LIMIT 3';
        const sampleResult = await client.query(sampleQuery);
        
        if (sampleResult.rows.length > 0) {
            sampleResult.rows.forEach((row, index) => {
                console.log(`\n${index + 1}. OPERATION ID: ${row.id}`);
                Object.keys(row).forEach(key => {
                    if (row[key] !== null) {
                        console.log(`   ${key}: ${row[key]}`);
                    }
                });
            });
        } else {
            console.log('   ⚠️ Nenhum registro encontrado');
        }

        // Verificar outras tabelas relacionadas
        console.log('\n📊 OUTRAS TABELAS RELACIONADAS:');
        const relatedTablesQuery = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND (table_name LIKE '%operation%' OR table_name LIKE '%order%' OR table_name LIKE '%trade%')
            ORDER BY table_name;
        `;
        
        const relatedResult = await client.query(relatedTablesQuery);
        relatedResult.rows.forEach(table => {
            console.log(`   📄 ${table.table_name}`);
        });

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await client.end();
    }
}

// Executar
if (require.main === module) {
    checkOperationsTable().catch(console.error);
}

module.exports = { checkOperationsTable };
