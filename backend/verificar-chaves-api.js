/**
 * 🔍 VERIFICADOR DE CHAVES API BYBIT
 * 
 * Script para verificar se as chaves estão corretas no banco
 */

const { Pool } = require('pg');

// Configuração do banco de dados
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: {
        rejectUnauthorized: false
    }
});

async function verificarChavesAPI() {
    try {
        console.log('🔍 VERIFICANDO CHAVES API NO BANCO DE DADOS');
        console.log('='.repeat(50));
        
        // Buscar todos os usuários e chaves
        const queryTodos = `
            SELECT 
                u.id,
                u.name,
                u.email,
                uak.exchange,
                uak.api_key,
                LEFT(uak.secret_key, 15) as secret_preview,
                uak.environment,
                uak.is_active,
                uak.created_at
            FROM users u
            LEFT JOIN user_api_keys uak ON u.id = uak.user_id
            ORDER BY u.name, uak.exchange;
        `;
        
        const result = await pool.query(queryTodos);
        
        console.log(`📊 Total de registros encontrados: ${result.rows.length}`);
        console.log('');
        
        if (result.rows.length === 0) {
            console.log('❌ Nenhum usuário ou chave encontrada no banco');
            return;
        }
        
        // Agrupar por usuário
        const usuarios = {};
        result.rows.forEach(row => {
            const userId = row.id;
            if (!usuarios[userId]) {
                usuarios[userId] = {
                    name: row.name,
                    email: row.email,
                    chaves: []
                };
            }
            
            if (row.exchange) {
                usuarios[userId].chaves.push({
                    exchange: row.exchange,
                    api_key: row.api_key,
                    secret_preview: row.secret_preview,
                    environment: row.environment,
                    is_active: row.is_active,
                    created_at: row.created_at
                });
            }
        });
        
        // Exibir dados
        Object.keys(usuarios).forEach(userId => {
            const user = usuarios[userId];
            console.log(`👤 USUÁRIO: ${user.name}`);
            console.log(`📧 Email: ${user.email}`);
            
            if (user.chaves.length === 0) {
                console.log('   ❌ Nenhuma chave API configurada');
            } else {
                user.chaves.forEach(chave => {
                    console.log(`   🔑 ${chave.exchange.toUpperCase()}:`);
                    console.log(`      📍 API Key: ${chave.api_key}`);
                    console.log(`      🔐 Secret (preview): ${chave.secret_preview}...`);
                    console.log(`      🌍 Environment: ${chave.environment}`);
                    console.log(`      ✅ Ativa: ${chave.is_active}`);
                    console.log(`      📅 Criada em: ${chave.created_at}`);
                });
            }
            console.log('');
        });
        
        // Buscar especificamente a Érica
        console.log('🔍 VERIFICAÇÃO ESPECÍFICA - ÉRICA DOS SANTOS:');
        console.log('-'.repeat(50));
        
        const queryErica = `
            SELECT 
                u.name,
                u.email,
                uak.api_key,
                uak.secret_key,
                uak.exchange,
                uak.is_active
            FROM user_api_keys uak
            INNER JOIN users u ON uak.user_id = u.id
            WHERE u.email = 'erica.andrade.santos@hotmail.com'
            AND uak.exchange = 'bybit'
            AND uak.is_active = true;
        `;
        
        const resultErica = await pool.query(queryErica);
        
        if (resultErica.rows.length === 0) {
            console.log('❌ Chave da Érica não encontrada ou não ativa');
        } else {
            const chave = resultErica.rows[0];
            console.log(`✅ Chave encontrada para: ${chave.name}`);
            console.log(`📧 Email: ${chave.email}`);
            console.log(`🔑 API Key: ${chave.api_key}`);
            console.log(`🔐 Secret Key: ${chave.secret_key.substring(0, 15)}...`);
            console.log(`🏪 Exchange: ${chave.exchange}`);
            console.log(`✅ Ativa: ${chave.is_active}`);
        }
        
    } catch (error) {
        console.error('❌ Erro ao verificar chaves:', error.message);
    } finally {
        await pool.end();
    }
}

// Executar verificação
verificarChavesAPI();
