#!/usr/bin/env node
require('dotenv').config();
const { Pool } = require('pg');

async function buscarChavesEspecificas() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔍 Buscando chaves específicas da imagem no banco...\n');
        
        // Chaves da imagem que queremos encontrar
        const chavesParaBuscar = [
            '9HZy9BiUW95iXprVRl',  // LUIZA api_key
            'QJjDXNmsIQq1gakTUk7FHAHZnjlEN8AaRkQ0',  // LUIZA api_secret
            '2iNeNZQepHJS0lWBkf',  // ERICA api_key
            '1KkVFTExPQKzZwHsXaUKwzGVSCxCRW6izgDn'  // ERICA api_secret
        ];

        console.log('📋 CHAVES A BUSCAR:');
        chavesParaBuscar.forEach((chave, index) => {
            const tipo = index % 2 === 0 ? 'API KEY' : 'SECRET';
            const usuario = index < 2 ? 'LUIZA' : 'ERICA';
            console.log(`   ${index + 1}. ${usuario} ${tipo}: ${chave}`);
        });
        console.log('');

        // Buscar em todas as colunas possíveis onde as chaves podem estar
        for (const chave of chavesParaBuscar) {
            console.log(`🔎 Buscando: ${chave}`);
            
            // Buscar em user_api_keys
            const result1 = await pool.query(`
                SELECT u.id, u.username, u.email, 
                       k.id as key_id, k.exchange, k.environment,
                       k.api_key, k.api_secret, k.validation_status,
                       k.created_at, k.updated_at, k.is_active
                FROM users u 
                JOIN user_api_keys k ON u.id = k.user_id 
                WHERE k.api_key = $1 OR k.api_secret = $1 
                   OR k.api_key LIKE $2 OR k.api_secret LIKE $2
            `, [chave, `%${chave}%`]);

            if (result1.rows.length > 0) {
                console.log(`✅ ENCONTRADO em user_api_keys:`);
                result1.rows.forEach(row => {
                    console.log(`   👤 Usuário: ${row.username} (ID ${row.id})`);
                    console.log(`   📧 Email: ${row.email}`);
                    console.log(`   🏢 Exchange: ${row.exchange}`);
                    console.log(`   🌐 Environment: ${row.environment}`);
                    console.log(`   🔑 API Key: ${row.api_key}`);
                    console.log(`   🔒 API Secret: ${row.api_secret}`);
                    console.log(`   ✅ Status: ${row.validation_status}`);
                    console.log(`   📅 Criado: ${row.created_at}`);
                    console.log('');
                });
            }

            // Buscar em colunas encriptadas
            const result2 = await pool.query(`
                SELECT u.id, u.username, u.email,
                       k.id as key_id, k.exchange, k.environment,
                       k.api_key_encrypted, k.secret_key_encrypted,
                       k.api_key, k.api_secret, k.validation_status
                FROM users u 
                JOIN user_api_keys k ON u.id = k.user_id 
                WHERE k.api_key_encrypted LIKE $1 OR k.secret_key_encrypted LIKE $1
            `, [`%${chave}%`]);

            if (result2.rows.length > 0) {
                console.log(`✅ ENCONTRADO em colunas encriptadas:`);
                result2.rows.forEach(row => {
                    console.log(`   👤 Usuário: ${row.username} (ID ${row.id})`);
                    console.log(`   🏢 Exchange: ${row.exchange}`);
                    console.log(`   🔐 Encrypted Key: ${row.api_key_encrypted?.substring(0, 50)}...`);
                    console.log(`   🔐 Encrypted Secret: ${row.secret_key_encrypted?.substring(0, 50)}...`);
                    console.log('');
                });
            }

            // Buscar em outras tabelas possíveis
            try {
                const result3 = await pool.query(`
                    SELECT table_name, column_name 
                    FROM information_schema.columns 
                    WHERE (column_name LIKE '%api%' OR column_name LIKE '%key%' OR column_name LIKE '%secret%')
                    AND table_schema = 'public'
                    ORDER BY table_name, column_name
                `);

                if (result3.rows.length > 0) {
                    console.log(`🔍 Verificando outras tabelas com colunas de API/Key/Secret...`);
                    
                    for (const col of result3.rows) {
                        try {
                            const searchResult = await pool.query(`
                                SELECT * FROM ${col.table_name} 
                                WHERE ${col.column_name}::text = $1 
                                   OR ${col.column_name}::text LIKE $2
                                LIMIT 5
                            `, [chave, `%${chave}%`]);
                            
                            if (searchResult.rows.length > 0) {
                                console.log(`   ✅ Encontrado em ${col.table_name}.${col.column_name}:`);
                                searchResult.rows.forEach(row => {
                                    console.log(`      📊 Dados:`, JSON.stringify(row, null, 2));
                                });
                            }
                        } catch (e) {
                            // Ignorar erros de tabelas que não existem ou colunas incompatíveis
                        }
                    }
                }
            } catch (error) {
                console.log(`   ⚠️ Erro na busca em outras tabelas: ${error.message}`);
            }

            if (result1.rows.length === 0 && result2.rows.length === 0) {
                console.log(`   ❌ NÃO ENCONTRADO: ${chave}`);
            }
            console.log('');
        }

        // Buscar por nomes dos usuários (Luiza e Erica)
        console.log('👥 BUSCANDO POR NOMES DE USUÁRIOS...');
        const userResult = await pool.query(`
            SELECT u.id, u.username, u.email, u.created_at,
                   k.id as key_id, k.exchange, k.api_key, k.api_secret,
                   k.validation_status, k.environment
            FROM users u 
            LEFT JOIN user_api_keys k ON u.id = k.user_id 
            WHERE LOWER(u.username) LIKE '%luiza%' 
               OR LOWER(u.username) LIKE '%erica%'
               OR LOWER(u.email) LIKE '%luiza%'
               OR LOWER(u.email) LIKE '%erica%'
               OR LOWER(u.email) LIKE '%lmariadeapinto%'
               OR LOWER(u.email) LIKE '%santos%'
            ORDER BY u.id, k.exchange
        `);

        if (userResult.rows.length > 0) {
            console.log('✅ USUÁRIOS ENCONTRADOS:');
            userResult.rows.forEach(row => {
                console.log(`   👤 ${row.username} (ID ${row.id}) - ${row.email}`);
                if (row.key_id) {
                    console.log(`      🏢 ${row.exchange}: Key=${row.api_key} | Secret=${row.api_secret}`);
                    console.log(`      📊 Status: ${row.validation_status} | Env: ${row.environment}`);
                }
                console.log('');
            });
        }

        console.log('🎯 RESUMO DA BUSCA CONCLUÍDO!');

    } catch (error) {
        console.error('❌ Erro na busca:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await pool.end();
    }
}

buscarChavesEspecificas();
