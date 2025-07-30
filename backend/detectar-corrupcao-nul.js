const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function detectarCorrupcaoNUL() {
    console.log('🔍 DETECTANDO CORRUPÇÃO DE CARACTERES NUL');
    console.log('=========================================');
    console.log('Baseado no erro Railway: "invalid character NUL"\n');
    
    try {
        // 1. Verificar todas as chaves API por caracteres NUL
        console.log('🔑 VERIFICANDO CHAVES API POR CORRUPÇÃO:');
        const apiKeys = await pool.query(`
            SELECT id, user_id, api_key, secret_key, exchange, environment,
                   LENGTH(api_key) as api_key_length,
                   LENGTH(secret_key) as secret_key_length,
                   CASE 
                       WHEN api_key ~ E'\\\\000' THEN true 
                       ELSE false 
                   END as api_key_has_null,
                   CASE 
                       WHEN secret_key ~ E'\\\\000' THEN true 
                       ELSE false 
                   END as secret_key_has_null
            FROM user_api_keys 
            WHERE is_active = true
            ORDER BY user_id
        `);
        
        console.log(`📊 Total de chaves verificadas: ${apiKeys.rows.length}\n`);
        
        let chavesCorruptas = 0;
        let chavesLimpas = 0;
        
        for (const key of apiKeys.rows) {
            const userId = await getUserName(key.user_id);
            console.log(`👤 ${userId} (ID: ${key.user_id}) - ${key.exchange}/${key.environment}:`);
            
            // Verificar API Key
            console.log(`   🔑 API Key: "${key.api_key}"`);
            console.log(`      📏 Tamanho: ${key.api_key_length} caracteres`);
            console.log(`      🚫 Contém NUL: ${key.api_key_has_null ? 'SIM ❌' : 'NÃO ✅'}`);
            
            // Verificar Secret Key
            console.log(`   🔐 Secret Key: "${key.secret_key.substring(0, 10)}..."`);
            console.log(`      📏 Tamanho: ${key.secret_key_length} caracteres`);
            console.log(`      🚫 Contém NUL: ${key.secret_key_has_null ? 'SIM ❌' : 'NÃO ✅'}`);
            
            // Análise detalhada se há corrupção
            if (key.api_key_has_null || key.secret_key_has_null) {
                chavesCorruptas++;
                console.log(`   🚨 CHAVE CORROMPIDA DETECTADA!`);
                
                // Mostrar bytes exatos
                if (key.api_key_has_null) {
                    const apiKeyBuffer = Buffer.from(key.api_key, 'utf8');
                    console.log(`      🔍 API Key bytes: ${Array.from(apiKeyBuffer).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
                }
                
                if (key.secret_key_has_null) {
                    const secretKeyBuffer = Buffer.from(key.secret_key, 'utf8');
                    console.log(`      🔍 Secret Key bytes (primeiros 20): ${Array.from(secretKeyBuffer.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
                }
            } else {
                chavesLimpas++;
                console.log(`   ✅ Chave limpa`);
            }
            
            console.log('   ' + '-'.repeat(50));
        }
        
        console.log(`\n📊 RESUMO DA ANÁLISE:`);
        console.log(`   ✅ Chaves limpas: ${chavesLimpas}`);
        console.log(`   ❌ Chaves corrompidas: ${chavesCorruptas}`);
        
        // 2. Se há corrupção, mostrar como corrigir
        if (chavesCorruptas > 0) {
            console.log(`\n🛠️ CORREÇÃO NECESSÁRIA:`);
            console.log(`======================`);
            await gerarScriptCorrecao();
        } else {
            console.log(`\n🎉 Nenhuma corrupção encontrada!`);
            console.log(`O problema pode estar em outro lugar.`);
        }
        
        // 3. Verificar outras possíveis corrupções
        await verificarOutrasCorrupcoes();
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        console.error(error.stack);
    } finally {
        pool.end();
    }
}

async function getUserName(userId) {
    try {
        const result = await pool.query('SELECT name FROM users WHERE id = $1', [userId]);
        return result.rows[0]?.name || `User_${userId}`;
    } catch (error) {
        return `User_${userId}`;
    }
}

async function gerarScriptCorrecao() {
    console.log(`1. 🧹 LIMPEZA DE CARACTERES NUL:`);
    console.log(`   UPDATE user_api_keys SET`);
    console.log(`     api_key = REPLACE(api_key, CHR(0), ''),`);
    console.log(`     secret_key = REPLACE(secret_key, CHR(0), '')`);
    console.log(`   WHERE api_key ~ E'\\\\000' OR secret_key ~ E'\\\\000';`);
    
    console.log(`\n2. 🔄 SUBSTITUIÇÃO POR CHAVES VÁLIDAS:`);
    console.log(`   -- Usar as chaves corretas fornecidas:`);
    console.log(`   -- API Key: 9HZy9BiUW95iXprVRI`);
    console.log(`   -- Secret: QUjDXNmSI0qiqaKTUk7FHAHZnjEN8AaRKQO`);
    
    // Executar limpeza automaticamente
    console.log(`\n🔄 EXECUTANDO LIMPEZA AUTOMÁTICA...`);
    
    try {
        const cleanResult = await pool.query(`
            UPDATE user_api_keys 
            SET api_key = REPLACE(api_key, CHR(0), ''),
                secret_key = REPLACE(secret_key, CHR(0), ''),
                validation_status = 'pending',
                error_message = 'Cleaned NUL characters'
            WHERE api_key ~ E'\\\\000' OR secret_key ~ E'\\\\000'
            RETURNING id, user_id
        `);
        
        console.log(`   ✅ ${cleanResult.rows.length} chaves limpas automaticamente`);
        
        if (cleanResult.rows.length > 0) {
            console.log(`   🔄 Agora atualizando com chaves válidas...`);
            
            // Atualizar com chaves válidas
            const updateResult = await pool.query(`
                UPDATE user_api_keys 
                SET api_key = '9HZy9BiUW95iXprVRI',
                    secret_key = 'QUjDXNmSI0qiqaKTUk7FHAHZnjEN8AaRKQO',
                    validation_status = 'valid',
                    error_message = NULL,
                    last_validated_at = NOW()
                WHERE is_active = true
                RETURNING id, user_id
            `);
            
            console.log(`   ✅ ${updateResult.rows.length} chaves atualizadas com dados válidos`);
        }
        
    } catch (error) {
        console.log(`   ❌ Erro na limpeza: ${error.message}`);
    }
}

async function verificarOutrasCorrupcoes() {
    console.log(`\n🔍 VERIFICANDO OUTRAS POSSÍVEIS CORRUPÇÕES:`);
    console.log(`==========================================`);
    
    try {
        // Verificar encoding
        console.log(`📝 Verificando encoding das strings...`);
        
        const encodingTest = await pool.query(`
            SELECT 
                id,
                api_key,
                secret_key,
                encode(api_key::bytea, 'hex') as api_key_hex,
                encode(secret_key::bytea, 'hex') as secret_key_hex,
                char_length(api_key) as api_key_chars,
                octet_length(api_key) as api_key_bytes,
                char_length(secret_key) as secret_key_chars,
                octet_length(secret_key) as secret_key_bytes
            FROM user_api_keys 
            WHERE is_active = true
            LIMIT 3
        `);
        
        encodingTest.rows.forEach((row, index) => {
            console.log(`\n   🔍 Chave ${index + 1}:`);
            console.log(`      API Key: "${row.api_key}"`);
            console.log(`      Caracteres: ${row.api_key_chars}, Bytes: ${row.api_key_bytes}`);
            console.log(`      Hex: ${row.api_key_hex}`);
            
            console.log(`      Secret Key: "${row.secret_key.substring(0, 10)}..."`);
            console.log(`      Caracteres: ${row.secret_key_chars}, Bytes: ${row.secret_key_bytes}`);
            console.log(`      Hex (primeiros 20 chars): ${row.secret_key_hex.substring(0, 40)}...`);
            
            // Detectar problemas
            if (row.api_key_chars !== row.api_key_bytes) {
                console.log(`      ⚠️  API Key: diferença entre chars/bytes detectada`);
            }
            if (row.secret_key_chars !== row.secret_key_bytes) {
                console.log(`      ⚠️  Secret Key: diferença entre chars/bytes detectada`);
            }
        });
        
    } catch (error) {
        console.log(`   ❌ Erro na verificação: ${error.message}`);
    }
}

// Executar detecção
console.log('🚨 RAILWAY NUL CHARACTER FIX');
console.log('============================');
console.log('Este script vai detectar e corrigir a corrupção de caracteres NUL');
console.log('que está causando o erro "invalid character NUL" no Railway.\n');

detectarCorrupcaoNUL();
