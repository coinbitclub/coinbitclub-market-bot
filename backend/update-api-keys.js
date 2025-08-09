/**
 * 🔧 SISTEMA DE ATUALIZAÇÃO DE CHAVES API
 * =======================================
 * 
 * Use este script quando conseguir novas chaves dos usuários
 */

const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

// 🔑 QUANDO CONSEGUIR NOVAS CHAVES, ATUALIZE AQUI:
const NOVAS_CHAVES = [
    {
        userId: 14, // Paloma Amaral
        exchange: 'bybit',
        environment: 'mainnet',
        newApiKey: 'NOVA_CHAVE_PALOMA_AQUI',
        newApiSecret: 'NOVO_SECRET_PALOMA_AQUI'
    },
    {
        userId: 15, // Erica dos Santos  
        exchange: 'bybit',
        environment: 'mainnet',
        newApiKey: 'NOVA_CHAVE_ERICA_AQUI',
        newApiSecret: 'NOVO_SECRET_ERICA_AQUI'
    }
    // Adicione mais usuários conforme necessário
];

async function validateBybitKey(apiKey, apiSecret) {
    try {
        const timestamp = Date.now();
        const queryParams = `accountType=UNIFIED&timestamp=${timestamp}`;
        
        const signature = crypto
            .createHmac('sha256', apiSecret)
            .update(timestamp + apiKey + '5000' + queryParams)
            .digest('hex');
        
        const url = `https://api.bybit.com/v5/account/wallet-balance?${queryParams}&sign=${signature}`;
        
        const response = await fetch(url, {
            headers: {
                'X-BAPI-API-KEY': apiKey,
                'X-BAPI-SIGN': signature,
                'X-BAPI-TIMESTAMP': timestamp.toString(),
                'X-BAPI-RECV-WINDOW': '5000'
            }
        });
        
        if (response.status === 200) {
            const data = await response.json();
            return data.retCode === 0 ? 'valid' : `error: ${data.retMsg}`;
        } else {
            return `http_error: ${response.status} ${response.statusText}`;
        }
        
    } catch (error) {
        return `exception: ${error.message}`;
    }
}

async function updateUserKeys() {
    console.log('🔧 SISTEMA DE ATUALIZAÇÃO DE CHAVES API');
    console.log('=======================================\n');
    
    for (const keyData of NOVAS_CHAVES) {
        console.log(`👤 Atualizando usuário ID ${keyData.userId}:`);
        
        // Verificar se as chaves são placeholders
        if (keyData.newApiKey.includes('NOVA_CHAVE') || keyData.newApiSecret.includes('NOVO_SECRET')) {
            console.log('⚠️  CHAVES AINDA SÃO PLACEHOLDERS - ATUALIZE COM CHAVES REAIS\n');
            continue;
        }
        
        console.log(`🔑 Nova API Key: ${keyData.newApiKey}`);
        console.log(`🔐 Novo Secret: ${keyData.newApiSecret.substring(0, 10)}...`);
        
        // Validar a nova chave antes de salvar
        console.log('🧪 Validando nova chave...');
        const validationResult = await validateBybitKey(keyData.newApiKey, keyData.newApiSecret);
        
        if (validationResult === 'valid') {
            console.log('✅ Chave válida! Atualizando no banco...');
            
            try {
                // Atualizar ou inserir chave
                const result = await pool.query(`
                    INSERT INTO user_api_keys (user_id, exchange, environment, api_key, api_secret, validation_status, last_validated)
                    VALUES ($1, $2, $3, $4, $5, 'valid', NOW())
                    ON CONFLICT (user_id, exchange, environment)
                    DO UPDATE SET 
                        api_key = EXCLUDED.api_key,
                        api_secret = EXCLUDED.api_secret,
                        validation_status = 'valid',
                        last_validated = NOW(),
                        error_message = NULL
                `, [keyData.userId, keyData.exchange, keyData.environment, keyData.newApiKey, keyData.newApiSecret]);
                
                console.log('💾 Chave salva no banco com sucesso!');
                
            } catch (dbError) {
                console.log('❌ Erro ao salvar no banco:', dbError.message);
            }
            
        } else {
            console.log('❌ Chave inválida:', validationResult);
        }
        
        console.log(''); // Linha em branco
    }
    
    console.log('🏁 Processo de atualização concluído!');
    pool.end();
}

// Função para testar coleta com novas chaves
async function testCollectionWithNewKeys() {
    console.log('\n🧪 TESTANDO COLETA COM NOVAS CHAVES');
    console.log('===================================');
    
    try {
        // Buscar chaves válidas do banco
        const validKeys = await pool.query(`
            SELECT u.id, u.name, uak.api_key, uak.api_secret
            FROM users u
            INNER JOIN user_api_keys uak ON u.id = uak.user_id
            WHERE uak.validation_status = 'valid' AND uak.exchange = 'bybit'
            ORDER BY u.id
        `);
        
        console.log(`🔍 Encontradas ${validKeys.rows.length} chaves válidas no banco`);
        
        for (const user of validKeys.rows) {
            console.log(`\n👤 Testando ${user.name} (ID: ${user.id})`);
            
            const result = await validateBybitKey(user.api_key, user.api_secret);
            if (result === 'valid') {
                console.log('✅ Chave funcionando - pode coletar saldos!');
            } else {
                console.log('❌ Chave com problema:', result);
            }
        }
        
    } catch (error) {
        console.log('❌ Erro no teste:', error.message);
    }
}

// Instruções de uso
console.log('📋 INSTRUÇÕES DE USO:');
console.log('===================');
console.log('1. Solicite novas chaves API dos usuários');
console.log('2. Atualize a constante NOVAS_CHAVES acima');
console.log('3. Execute: node update-api-keys.js');
console.log('4. O sistema validará e salvará as novas chaves');
console.log('5. Teste a coleta novamente\n');

console.log('🌐 IP ATUAL DA RAILWAY: 132.255.160.131');
console.log('💡 Informe este IP aos usuários para whitelist\n');

console.log('📞 MENSAGEM PARA OS USUÁRIOS:');
console.log('============================');
console.log('Olá! Preciso que você gere uma nova chave API na Bybit:');
console.log('1. Acesse: https://www.bybit.com/app/user/api-management');
console.log('2. Crie nova chave com permissão "Read"');
console.log('3. Adicione o IP 132.255.160.131 ao whitelist');
console.log('4. Me envie a nova API Key e Secret\n');

// Executar apenas se não for importado como módulo
if (require.main === module) {
    updateUserKeys().then(() => {
        console.log('Processo concluído!');
    });
}
