const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function atualizarChavesPalomaLuiza() {
    console.log('🔧 ATUALIZANDO CHAVES - PALOMA E LUIZA');
    console.log('=====================================');
    console.log('Ação: Deletar chaves da Paloma e atualizar Luiza com chaves corretas\n');
    
    // Chaves corretas da imagem
    const chavesCorretas = {
        api_key: '9HZy9BiUW95iXprVRI',
        secret_key: 'QUjDXNmSI0qiqaKTUk7FHAHZnjEN8AaRKQO'
    };
    
    try {
        // 1. Verificar estado atual
        console.log('📊 ESTADO ATUAL:');
        const currentState = await pool.query(`
            SELECT u.id, u.name, ak.id as key_id, ak.api_key, ak.secret_key, ak.environment, ak.is_active
            FROM users u
            LEFT JOIN user_api_keys ak ON u.id = ak.user_id
            WHERE u.name ILIKE '%paloma%' OR u.name ILIKE '%luiza%'
            ORDER BY u.name, ak.id
        `);
        
        currentState.rows.forEach(row => {
            if (row.key_id) {
                console.log(`   👤 ${row.name} (ID: ${row.id}): ${row.api_key} | Ativo: ${row.is_active} | Env: ${row.environment}`);
            } else {
                console.log(`   👤 ${row.name} (ID: ${row.id}): SEM CHAVES`);
            }
        });
        
        // 2. Deletar chaves da Paloma
        console.log('\n🗑️ DELETANDO CHAVES DA PALOMA:');
        const palomaResult = await pool.query(`
            DELETE FROM user_api_keys 
            WHERE user_id IN (
                SELECT id FROM users WHERE name ILIKE '%paloma%'
            )
            RETURNING id, user_id
        `);
        
        console.log(`   ✅ ${palomaResult.rows.length} chaves da Paloma deletadas`);
        
        // 3. Atualizar chaves da Luiza
        console.log('\n🔄 ATUALIZANDO CHAVES DA LUIZA:');
        
        // Primeiro verificar se Luiza tem chaves
        const luizaKeys = await pool.query(`
            SELECT ak.id, ak.api_key, ak.environment
            FROM user_api_keys ak
            JOIN users u ON ak.user_id = u.id
            WHERE u.name ILIKE '%luiza%'
        `);
        
        if (luizaKeys.rows.length > 0) {
            console.log(`   📊 Luiza tem ${luizaKeys.rows.length} chaves existentes`);
            
            // Atualizar chaves existentes
            const updateResult = await pool.query(`
                UPDATE user_api_keys 
                SET 
                    api_key = $1,
                    secret_key = $2,
                    validation_status = 'pending',
                    error_message = 'Updated with correct keys from image',
                    last_validated_at = NOW()
                WHERE user_id IN (
                    SELECT id FROM users WHERE name ILIKE '%luiza%'
                )
                RETURNING id, user_id, environment
            `, [chavesCorretas.api_key, chavesCorretas.secret_key]);
            
            console.log(`   ✅ ${updateResult.rows.length} chaves da Luiza atualizadas`);
            
        } else {
            console.log(`   📊 Luiza não tem chaves, criando novas...`);
            
            // Buscar ID da Luiza
            const luizaUser = await pool.query(`
                SELECT id FROM users WHERE name ILIKE '%luiza%' LIMIT 1
            `);
            
            if (luizaUser.rows.length > 0) {
                const luizaId = luizaUser.rows[0].id;
                
                // Criar nova chave para Luiza
                const insertResult = await pool.query(`
                    INSERT INTO user_api_keys (
                        user_id, exchange, api_key, secret_key, environment, 
                        is_active, validation_status, error_message, created_at
                    ) VALUES (
                        $1, 'bybit', $2, $3, 'mainnet', 
                        true, 'pending', 'New keys from image', NOW()
                    )
                    RETURNING id
                `, [luizaId, chavesCorretas.api_key, chavesCorretas.secret_key]);
                
                console.log(`   ✅ Nova chave criada para Luiza (ID: ${insertResult.rows[0].id})`);
            } else {
                console.log(`   ❌ Usuário Luiza não encontrado`);
            }
        }
        
        // 4. Verificar estado final
        console.log('\n📊 ESTADO FINAL:');
        const finalState = await pool.query(`
            SELECT u.id, u.name, ak.id as key_id, ak.api_key, ak.secret_key, ak.environment, ak.is_active
            FROM users u
            LEFT JOIN user_api_keys ak ON u.id = ak.user_id
            WHERE u.name ILIKE '%paloma%' OR u.name ILIKE '%luiza%'
            ORDER BY u.name, ak.id
        `);
        
        finalState.rows.forEach(row => {
            if (row.key_id) {
                console.log(`   👤 ${row.name} (ID: ${row.id}): ${row.api_key} | Secret: ${row.secret_key.substring(0, 10)}... | Env: ${row.environment}`);
            } else {
                console.log(`   👤 ${row.name} (ID: ${row.id}): SEM CHAVES`);
            }
        });
        
        // 5. Testar chaves da Luiza
        console.log('\n🧪 TESTANDO CHAVES ATUALIZADAS DA LUIZA:');
        await testarChaves(chavesCorretas);
        
        console.log('\n✅ OPERAÇÃO CONCLUÍDA:');
        console.log('======================');
        console.log('✅ Chaves da Paloma deletadas');
        console.log('✅ Chaves da Luiza atualizadas com dados da imagem');
        console.log('🧪 Teste da API executado');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        console.error(error.stack);
    } finally {
        pool.end();
    }
}

async function testarChaves(chaves) {
    console.log('🔍 Testando conectividade das chaves atualizadas...');
    
    const ambientes = [
        { nome: 'TESTNET', url: 'https://api-testnet.bybit.com' },
        { nome: 'MAINNET', url: 'https://api.bybit.com' }
    ];
    
    for (const ambiente of ambientes) {
        console.log(`\n   🌍 ${ambiente.nome}:`);
        
        try {
            const timestamp = Date.now().toString();
            const recvWindow = '10000';
            const message = timestamp + chaves.api_key + recvWindow;
            const signature = crypto.createHmac('sha256', chaves.secret_key).update(message).digest('hex');
            
            const headers = {
                'X-BAPI-API-KEY': chaves.api_key,
                'X-BAPI-SIGN': signature,
                'X-BAPI-SIGN-TYPE': '2',
                'X-BAPI-TIMESTAMP': timestamp,
                'X-BAPI-RECV-WINDOW': recvWindow,
                'Content-Type': 'application/json',
                'User-Agent': 'CoinBitClub-Updated/1.0'
            };
            
            const response = await fetch(`${ambiente.url}/v5/account/info`, {
                method: 'GET',
                headers: headers
            });
            
            const data = await response.json();
            
            console.log(`      ${data.retCode === 0 ? '✅' : '❌'} ${data.retCode} - ${data.retMsg}`);
            
            if (data.retCode === 0) {
                console.log(`      🎉 SUCESSO! Chaves funcionando em ${ambiente.nome}`);
                if (data.result) {
                    console.log(`      💰 Dados da conta disponíveis`);
                }
            } else {
                console.log(`      📊 Detalhes: ${data.retMsg}`);
                
                // Análise do erro
                if (data.retCode === 10003) {
                    console.log(`      🔍 Análise: API key inválida ou conta suspensa`);
                } else if (data.retCode === 10004) {
                    console.log(`      🔍 Análise: Erro de assinatura ou IP não whitelistado`);
                } else if (data.retCode === 10006) {
                    console.log(`      🔍 Análise: IP não autorizado - verificar whitelist`);
                }
            }
            
        } catch (error) {
            console.log(`      ❌ Erro de conexão: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

// Executar atualização
console.log('🚀 OPERAÇÃO: ATUALIZAR CHAVES PALOMA/LUIZA');
console.log('===========================================');
console.log('📝 Plano:');
console.log('   1. Deletar todas as chaves da Paloma');
console.log('   2. Atualizar chaves da Luiza com dados da imagem');
console.log('   3. Testar conectividade das novas chaves');
console.log('');

atualizarChavesPalomaLuiza();
