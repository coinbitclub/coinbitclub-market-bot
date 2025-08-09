#!/usr/bin/env node
require('dotenv').config();
const { Pool } = require('pg');

async function verificarUserApiKeys() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔍 Verificando tabelas user_api_keys...');
        
        // Listar tabelas que contenham 'user_api'
        const tabelasApiKeys = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE '%user_api%'
            ORDER BY table_name
        `);
        
        console.log('\n📋 Tabelas user_api encontradas:');
        tabelasApiKeys.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });

        // Para cada tabela encontrada, mostrar estrutura
        for (const tabela of tabelasApiKeys.rows) {
            const tableName = tabela.table_name;
            
            console.log(`\n🔧 Estrutura da tabela '${tableName}':`);
            
            const colunas = await pool.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = $1
                ORDER BY ordinal_position
            `, [tableName]);
            
            colunas.rows.forEach(col => {
                console.log(`   ${col.column_name}: ${col.data_type} (null: ${col.is_nullable})`);
            });

            // Mostrar dados de exemplo
            const dados = await pool.query(`SELECT * FROM ${tableName} LIMIT 3`);
            console.log(`\n📊 Dados de exemplo da tabela '${tableName}':`);
            
            if (dados.rows.length === 0) {
                console.log('   (sem dados)');
            } else {
                dados.rows.forEach((row, index) => {
                    console.log(`   ${index + 1}. User ID: ${row.user_id || 'N/A'} | Exchange: ${row.exchange || 'N/A'} | Active: ${row.is_active || 'N/A'}`);
                    if (row.api_key) {
                        console.log(`      API Key: ${row.api_key.substring(0, 8)}... | Environment: ${row.environment || 'N/A'}`);
                    }
                });
            }
        }

    } catch (error) {
        console.error('❌ Erro ao verificar user_api_keys:', error.message);
    } finally {
        await pool.end();
    }
}

verificarUserApiKeys();
