const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
    ssl: { rejectUnauthorized: false }
});

function testDecryptWithKey(encryptedKey, encryptedSecret, encryptionKey) {
    try {
        const algorithm = 'aes-256-cbc';
        const key = crypto.scryptSync(encryptionKey, 'salt', 32);

        const keyBuffer = Buffer.from(encryptedKey, 'hex');
        const keyIv = keyBuffer.slice(0, 16);
        const keyEncrypted = keyBuffer.slice(16);
        const keyDecipher = crypto.createDecipheriv(algorithm, key, keyIv);
        const apiKey = keyDecipher.update(keyEncrypted, null, 'utf8') + keyDecipher.final('utf8');

        const secretBuffer = Buffer.from(encryptedSecret, 'hex');
        const secretIv = secretBuffer.slice(0, 16);
        const secretEncrypted = secretBuffer.slice(16);
        const secretDecipher = crypto.createDecipheriv(algorithm, key, secretIv);
        const apiSecret = secretDecipher.update(secretEncrypted, null, 'utf8') + secretDecipher.final('utf8');

        return { success: true, apiKey: apiKey.substring(0, 12) + '...', apiSecret: apiSecret.substring(0, 12) + '...' };
    } catch (error) {
        return { success: false, error: error.message.split(':').pop().trim() };
    }
}

async function testKeys() {
    try {
        const result = await pool.query('SELECT binance_api_key_encrypted, binance_api_secret_encrypted FROM users WHERE id = 16');
        const user = result.rows[0];
        
        console.log('🔐 TESTANDO DIFERENTES CHAVES DE ENCRIPTAÇÃO');
        console.log('============================================\n');
        
        const possibleKeys = [
            'CoinBitClubSecretKey32CharsForProd',
            'coinbitclub2024',
            'your-secret-key-here',
            'coinbitclub-secret-key-2024',
            'CoinBitClub2024SecretKeyForProduction',
            'coinbitclub_encryption_key_2024',
            '32CharacterLongSecretKeyForCoinBit!',
            'COINBITCLUB_SECRET_2024_PRODUCTION',
            'coinbitclub',
            'CoinBitClub123',
            'default-encryption-key',
            'secretkey123'
        ];
        
        for (let i = 0; i < possibleKeys.length; i++) {
            const testKey = possibleKeys[i];
            const testResult = testDecryptWithKey(user.binance_api_key_encrypted, user.binance_api_secret_encrypted, testKey);
            
            console.log(`${i + 1}. ${testKey}`);
            if (testResult.success) {
                console.log(`   ✅ SUCESSO!`);
                console.log(`   API Key: ${testResult.apiKey}`);
                console.log(`   Secret: ${testResult.apiSecret}`);
                console.log('\n🎉 CHAVE DE ENCRIPTAÇÃO CORRETA ENCONTRADA!');
                break;
            } else {
                console.log(`   ❌ Falhou: ${testResult.error}`);
            }
            console.log('');
        }
        
        await pool.end();
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        await pool.end();
    }
}

testKeys();
