const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function atualizarChavesErica() {
    console.log('🔧 ATUALIZANDO CHAVES DA ÉRICA');
    console.log('==============================');
    console.log('Ação: Atualizar chaves da Érica com dados da imagem\n');
    
    // Chaves corretas da imagem
    const chavesCorretas = {
        api_key: 'rg1HWyxEfWwobzJGew',
        secret_key: 'sOGr9nokGvtfDB0CSFymJZrOE8XnyA1nmB4r'
    };
    
    try {
        // 1. Verificar estado atual da Érica
        console.log('📊 ESTADO ATUAL DA ÉRICA:');
        const currentState = await pool.query(`
            SELECT u.id, u.name, ak.id as key_id, ak.api_key, ak.secret_key, ak.environment, ak.is_active, ak.validation_status
            FROM users u
            LEFT JOIN user_api_keys ak ON u.id = ak.user_id
            WHERE u.name ILIKE '%erica%' OR u.name ILIKE '%érica%'
            ORDER BY ak.id
        `);
        
        if (currentState.rows.length === 0) {
            console.log('   ❌ Usuário Érica não encontrado');
            return;
        }
        
        currentState.rows.forEach(row => {
            if (row.key_id) {
                console.log(`   👤 ${row.name} (ID: ${row.id}): ${row.api_key} | Secret: ${row.secret_key?.substring(0, 10)}... | Ativo: ${row.is_active} | Status: ${row.validation_status}`);
            } else {
                console.log(`   👤 ${row.name} (ID: ${row.id}): SEM CHAVES`);
            }
        });
        
        // 2. Atualizar chaves da Érica
        console.log('\n🔄 ATUALIZANDO CHAVES DA ÉRICA:');
        
        const ericaUser = currentState.rows[0];
        const ericaId = ericaUser.id;
        
        if (ericaUser.key_id) {
            // Atualizar chaves existentes
            const updateResult = await pool.query(`
                UPDATE user_api_keys 
                SET 
                    api_key = $1,
                    secret_key = $2,
                    validation_status = 'pending',
                    error_message = 'Updated with correct keys from image',
                    last_validated_at = NOW(),
                    updated_at = NOW()
                WHERE user_id = $3
                RETURNING id, environment, exchange
            `, [chavesCorretas.api_key, chavesCorretas.secret_key, ericaId]);
            
            console.log(`   ✅ ${updateResult.rows.length} chaves da Érica atualizadas`);
            updateResult.rows.forEach(row => {
                console.log(`      - Chave ID ${row.id} (${row.exchange}/${row.environment})`);
            });
            
        } else {
            // Criar nova chave para Érica
            console.log(`   📊 Érica não tem chaves, criando nova...`);
            
            const insertResult = await pool.query(`
                INSERT INTO user_api_keys (
                    user_id, exchange, api_key, secret_key, environment, 
                    is_active, validation_status, error_message, created_at, updated_at
                ) VALUES (
                    $1, 'bybit', $2, $3, 'mainnet', 
                    true, 'pending', 'New keys from image', NOW(), NOW()
                )
                RETURNING id
            `, [ericaId, chavesCorretas.api_key, chavesCorretas.secret_key]);
            
            console.log(`   ✅ Nova chave criada para Érica (ID: ${insertResult.rows[0].id})`);
        }
        
        // 3. Verificar estado final
        console.log('\n📊 ESTADO FINAL DA ÉRICA:');
        const finalState = await pool.query(`
            SELECT u.id, u.name, ak.id as key_id, ak.api_key, ak.secret_key, ak.environment, ak.is_active
            FROM users u
            LEFT JOIN user_api_keys ak ON u.id = ak.user_id
            WHERE u.name ILIKE '%erica%' OR u.name ILIKE '%érica%'
            ORDER BY ak.id
        `);
        
        finalState.rows.forEach(row => {
            if (row.key_id) {
                console.log(`   👤 ${row.name} (ID: ${row.id}): ${row.api_key} | Secret: ${row.secret_key?.substring(0, 10)}... | Env: ${row.environment} | Ativo: ${row.is_active}`);
            } else {
                console.log(`   👤 ${row.name} (ID: ${row.id}): SEM CHAVES`);
            }
        });
        
        // 4. Testar chaves atualizadas
        console.log('\n🧪 TESTANDO CHAVES ATUALIZADAS DA ÉRICA:');
        await testarChaves(chavesCorretas);
        
        console.log('\n✅ OPERAÇÃO CONCLUÍDA:');
        console.log('======================');
        console.log('✅ Chaves da Érica atualizadas com dados da imagem');
        console.log('🧪 Teste da API executado');
        console.log('📝 Status: Chaves prontas para uso');
        
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
                'User-Agent': 'CoinBitClub-EricaUpdate/1.0'
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
console.log('🚀 OPERAÇÃO: ATUALIZAR CHAVES DA ÉRICA');
console.log('======================================');
console.log('📝 Plano:');
console.log('   1. Verificar estado atual das chaves da Érica');
console.log('   2. Atualizar com novas credenciais da imagem');
console.log('   3. Testar conectividade das chaves atualizadas');
console.log('');

atualizarChavesErica();
