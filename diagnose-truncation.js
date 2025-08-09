/**
 * 🔍 DIAGNÓSTICO DE TRUNCAMENTO DE CHAVES
 * 
 * Verificar se as chaves API estão sendo truncadas no banco
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🔍 DIAGNÓSTICO DE TRUNCAMENTO DE CHAVES');
console.log('=====================================');

async function diagnosticarTruncamento() {
    try {
        // 1. Verificar estrutura da tabela
        console.log('\n📊 1. ESTRUTURA DA TABELA:');
        const structure = await pool.query(`
            SELECT column_name, data_type, character_maximum_length 
            FROM information_schema.columns 
            WHERE table_name = 'user_api_keys' 
            AND column_name IN ('api_key', 'secret_key')
            ORDER BY column_name
        `);
        
        console.log('Colunas da tabela user_api_keys:');
        structure.rows.forEach(col => {
            console.log(`  ${col.column_name}: ${col.data_type}(${col.character_maximum_length || 'unlimited'})`);
        });
        
        // 2. Verificar tamanhos das chaves armazenadas
        console.log('\n🔍 2. TAMANHOS DAS CHAVES ARMAZENADAS:');
        const keys = await pool.query(`
            SELECT 
                u.name,
                uak.exchange,
                LENGTH(uak.api_key) as api_key_length,
                LENGTH(uak.secret_key) as secret_key_length,
                uak.api_key,
                LEFT(uak.secret_key, 20) as secret_preview
            FROM user_api_keys uak
            JOIN users u ON uak.user_id = u.id
            WHERE uak.exchange IN ('bybit', 'binance')
            ORDER BY uak.exchange, u.name
        `);
        
        keys.rows.forEach(key => {
            console.log(`${key.name} (${key.exchange}):`);
            console.log(`  API Key: ${key.api_key} (tamanho: ${key.api_key_length})`);
            console.log(`  Secret: ${key.secret_preview}... (tamanho: ${key.secret_key_length})`);
            console.log('');
        });
        
        // 3. Verificar tamanhos esperados
        console.log('📏 3. TAMANHOS ESPERADOS:');
        console.log('Bybit API Keys: 18-64 caracteres');
        console.log('Bybit Secrets: 36-128 caracteres');
        console.log('Binance API Keys: 64 caracteres');
        console.log('Binance Secrets: 64 caracteres');
        
        // 4. Identificar problemas
        console.log('\n🚨 4. PROBLEMAS IDENTIFICADOS:');
        let problemasEncontrados = false;
        
        keys.rows.forEach(key => {
            let problema = false;
            
            if (key.exchange === 'bybit') {
                if (key.api_key_length < 18 || key.api_key_length > 64) {
                    console.log(`❌ ${key.name}: API Key Bybit com tamanho anormal (${key.api_key_length})`);
                    problema = true;
                }
                if (key.secret_key_length < 36 || key.secret_key_length > 128) {
                    console.log(`❌ ${key.name}: Secret Bybit com tamanho anormal (${key.secret_key_length})`);
                    problema = true;
                }
            }
            
            if (key.exchange === 'binance') {
                if (key.api_key_length !== 64) {
                    console.log(`❌ ${key.name}: API Key Binance deveria ter 64 chars, tem ${key.api_key_length}`);
                    problema = true;
                }
                if (key.secret_key_length !== 64) {
                    console.log(`❌ ${key.name}: Secret Binance deveria ter 64 chars, tem ${key.secret_key_length}`);
                    problema = true;
                }
            }
            
            if (problema) {
                problemasEncontrados = true;
            }
        });
        
        if (!problemasEncontrados) {
            console.log('✅ Nenhum problema de truncamento detectado');
        }
        
        // 5. Solução para truncamento
        if (problemasEncontrados) {
            console.log('\n🔧 5. SOLUÇÃO PARA TRUNCAMENTO:');
            console.log('================================');
            
            console.log('A. Verificar limite de caracteres da tabela:');
            console.log('   ALTER TABLE user_api_keys ALTER COLUMN api_key TYPE VARCHAR(128);');
            console.log('   ALTER TABLE user_api_keys ALTER COLUMN secret_key TYPE VARCHAR(256);');
            
            console.log('\nB. Re-inserir chaves completas:');
            console.log('   • Solicitar aos usuários para re-cadastrar suas chaves');
            console.log('   • Implementar validação de tamanho antes de inserir');
            console.log('   • Teste com chaves de desenvolvimento primeiro');
            
            // Gerar script de correção
            await gerarScriptCorrecao();
        }
        
    } catch (error) {
        console.error('❌ Erro no diagnóstico:', error.message);
        console.error(error.stack);
    } finally {
        await pool.end();
    }
}

async function gerarScriptCorrecao() {
    console.log('\n📝 6. SCRIPT DE CORREÇÃO:');
    console.log('========================');
    
    const scriptSQL = `
-- 🔧 SCRIPT DE CORREÇÃO - TRUNCAMENTO DE CHAVES API
-- Execute este script para corrigir os limites de caracteres

-- 1. Backup da tabela atual
CREATE TABLE user_api_keys_backup AS SELECT * FROM user_api_keys;

-- 2. Aumentar limite das colunas
ALTER TABLE user_api_keys 
ALTER COLUMN api_key TYPE VARCHAR(128);

ALTER TABLE user_api_keys 
ALTER COLUMN secret_key TYPE VARCHAR(256);

-- 3. Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_api_keys_exchange 
ON user_api_keys(exchange);

CREATE INDEX IF NOT EXISTS idx_user_api_keys_validation_status 
ON user_api_keys(validation_status);

-- 4. Adicionar check constraints para validação
ALTER TABLE user_api_keys 
ADD CONSTRAINT check_api_key_length 
CHECK (LENGTH(api_key) >= 10);

ALTER TABLE user_api_keys 
ADD CONSTRAINT check_secret_key_length 
CHECK (LENGTH(secret_key) >= 20);

-- 5. Marcar chaves existentes como "needs_update" se suspeitas
UPDATE user_api_keys 
SET validation_status = 'needs_update'
WHERE (exchange = 'bybit' AND (LENGTH(api_key) < 18 OR LENGTH(secret_key) < 36))
   OR (exchange = 'binance' AND (LENGTH(api_key) != 64 OR LENGTH(secret_key) != 64));

COMMIT;
    `;
    
    console.log(scriptSQL);
    
    // Salvar script em arquivo
    require('fs').writeFileSync('fix-key-truncation.sql', scriptSQL);
    console.log('\n💾 Script salvo em: fix-key-truncation.sql');
}

// Executar diagnóstico
diagnosticarTruncamento().catch(console.error);
