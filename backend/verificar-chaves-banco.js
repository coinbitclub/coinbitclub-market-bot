/**
 * 🔍 VERIFICAR CHAVES API NO BANCO
 * 
 * Examinar as chaves API armazenadas no banco de dados
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function verificarChavesAPI() {
    try {
        console.log('🔍 VERIFICAÇÃO DE CHAVES API NO BANCO DE DADOS');
        console.log('='.repeat(60));
        
        const query = `
            SELECT 
                u.name,
                u.email,
                u.created_at as user_created,
                uak.api_key,
                uak.secret_key,
                uak.exchange,
                uak.environment,
                uak.is_active,
                uak.created_at as key_created
            FROM users u
            INNER JOIN user_api_keys uak ON u.id = uak.user_id
            WHERE u.email IN (
                'mauroalves150391@gmail.com',
                'pamaral15@hotmail.com',
                'erica.andrade.santos@hotmail.com'
            )
            ORDER BY u.name, uak.exchange;
        `;
        
        const result = await pool.query(query);
        
        if (result.rows.length === 0) {
            console.log('❌ Nenhuma chave API encontrada');
            return;
        }
        
        console.log(`📊 ${result.rows.length} chave(s) encontrada(s):\n`);
        
        result.rows.forEach((row, index) => {
            console.log(`${index + 1}. 👤 ${row.name}`);
            console.log(`   📧 Email: ${row.email}`);
            console.log(`   🏢 Exchange: ${row.exchange}`);
            console.log(`   🌍 Environment: ${row.environment}`);
            console.log(`   ✅ Ativa: ${row.is_active}`);
            console.log(`   🔑 API Key: ${row.api_key}`);
            console.log(`   🔐 Secret Key: ${row.secret_key}`);
            console.log(`   📅 Usuário criado: ${row.user_created}`);
            console.log(`   📅 Chave criada: ${row.key_created}`);
            console.log('');
        });
        
        // Verificar se as chaves têm o formato correto
        console.log('🔍 ANÁLISE DO FORMATO DAS CHAVES:');
        console.log('-'.repeat(40));
        
        result.rows.forEach((row) => {
            console.log(`👤 ${row.name}:`);
            
            // Verificar API Key
            if (row.api_key && row.api_key.length >= 16) {
                console.log('   ✅ API Key - formato OK');
            } else {
                console.log('   ❌ API Key - formato suspeito (muito curta)');
            }
            
            // Verificar Secret Key
            if (row.secret_key && row.secret_key.length >= 16) {
                console.log('   ✅ Secret Key - formato OK');
            } else {
                console.log('   ❌ Secret Key - formato suspeito (muito curta)');
            }
            
            console.log('');
        });
        
    } catch (error) {
        console.error('❌ Erro ao verificar chaves:', error.message);
    } finally {
        await pool.end();
    }
}

verificarChavesAPI();
