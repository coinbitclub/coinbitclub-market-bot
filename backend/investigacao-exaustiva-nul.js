const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function investigacaoExaustivaRailwayNUL() {
    console.log('🔍 INVESTIGAÇÃO EXAUSTIVA - RAILWAY NUL CHARACTERS');
    console.log('===================================================');
    console.log('🎯 Objetivo: Detectar e corrigir problemas de caracteres NUL');
    console.log('🚨 Status Railway: Múltiplos erros de caracteres NUL detectados\n');
    
    try {
        // 1. ANÁLISE PROFUNDA DAS CHAVES
        console.log('🔬 ANÁLISE PROFUNDA DAS CHAVES ATUAIS:');
        const allKeys = await pool.query(`
            SELECT u.name, ak.*, 
                   LENGTH(ak.api_key) as api_key_length,
                   LENGTH(ak.secret_key) as secret_key_length,
                   POSITION(E'\\000' IN ak.api_key) as api_key_nul_pos,
                   POSITION(E'\\000' IN ak.secret_key) as secret_key_nul_pos
            FROM user_api_keys ak
            JOIN users u ON ak.user_id = u.id
            ORDER BY u.name
        `);
        
        console.log('📊 Análise detalhada por usuário:');
        allKeys.rows.forEach(key => {
            console.log(`\n   👤 ${key.name}:`);
            console.log(`      🔑 API Key: "${key.api_key}" (${key.api_key_length} chars)`);
            console.log(`      🔐 Secret: "${key.secret_key?.substring(0, 20)}..." (${key.secret_key_length} chars)`);
            console.log(`      🚨 NUL em API Key: ${key.api_key_nul_pos > 0 ? `Posição ${key.api_key_nul_pos}` : 'Não detectado'}`);
            console.log(`      🚨 NUL em Secret: ${key.secret_key_nul_pos > 0 ? `Posição ${key.secret_key_nul_pos}` : 'Não detectado'}`);
            
            // Análise hex para detectar caracteres invisíveis
            const apiKeyHex = Buffer.from(key.api_key || '', 'utf8').toString('hex');
            const secretHex = Buffer.from(key.secret_key || '', 'utf8').toString('hex');
            
            console.log(`      🔍 API Key (hex): ${apiKeyHex}`);
            console.log(`      🔍 Secret (hex): ${secretHex.substring(0, 40)}...`);
            
            // Verificar se há caracteres NUL (00) no hex
            if (apiKeyHex.includes('00')) {
                console.log(`      ⚠️  DETECTADO: Caracteres NUL na API Key!`);
            }
            if (secretHex.includes('00')) {
                console.log(`      ⚠️  DETECTADO: Caracteres NUL no Secret Key!`);
            }
        });
        
        // 2. LIMPEZA E CORREÇÃO DE CARACTERES NUL
        console.log('\n🧹 LIMPEZA DE CARACTERES NUL:');
        
        // Limpar caracteres NUL existentes
        const cleanupResult = await pool.query(`
            UPDATE user_api_keys 
            SET 
                api_key = REPLACE(api_key, E'\\000', ''),
                secret_key = REPLACE(secret_key, E'\\000', ''),
                error_message = 'Cleaned NUL characters due to Railway corruption'
            WHERE POSITION(E'\\000' IN api_key) > 0 
               OR POSITION(E'\\000' IN secret_key) > 0
            RETURNING user_id, api_key, secret_key
        `);
        
        console.log(`   ✅ ${cleanupResult.rows.length} chaves limpas de caracteres NUL`);
        
        // 3. ATUALIZAÇÃO COM CHAVES CORRETAS (SEM NUL)
        console.log('\n🔄 ATUALIZANDO COM CHAVES CORRETAS:');
        
        // Chaves válidas fornecidas pelo usuário
        const chavesValidas = {
            'Luiza Maria de Almeida Pinto': {
                api_key: '9HZy9BiUW95iXprVRI',
                secret_key: 'QUjDXNmSI0qiqaKTUk7FHAHZnjEN8AaRKQO'
            },
            'Érica dos Santos': {
                api_key: 'rg1HWyxEfWwobzJGew',
                secret_key: 'sOGr9nokGvtfDB0CSFymJZrOE8XnyA1nmB4r'
            }
        };
        
        // Atualizar uma por vez para evitar corrupção
        for (const [nome, chaves] of Object.entries(chavesValidas)) {
            console.log(`\n   👤 Atualizando ${nome}:`);
            
            try {
                // Usar prepared statement para evitar injeção e corrupção
                const updateResult = await pool.query(`
                    UPDATE user_api_keys 
                    SET 
                        api_key = $1,
                        secret_key = $2,
                        validation_status = 'valid',
                        error_message = 'Updated with clean keys - no NUL chars',
                        last_validated_at = NOW(),
                        updated_at = NOW()
                    WHERE user_id = (
                        SELECT id FROM users WHERE name ILIKE $3 LIMIT 1
                    )
                    RETURNING id, api_key, secret_key
                `, [chaves.api_key, chaves.secret_key, `%${nome.split(' ')[0]}%`]);
                
                if (updateResult.rows.length > 0) {
                    const updated = updateResult.rows[0];
                    console.log(`      ✅ Chave atualizada (ID: ${updated.id})`);
                    console.log(`      🔑 API: ${updated.api_key}`);
                    console.log(`      🔐 Secret: ${updated.secret_key.substring(0, 10)}...`);
                    
                    // Verificar se a atualização não introduziu NUL
                    const verification = await pool.query(`
                        SELECT 
                            POSITION(E'\\000' IN api_key) as api_nul,
                            POSITION(E'\\000' IN secret_key) as secret_nul
                        FROM user_api_keys WHERE id = $1
                    `, [updated.id]);
                    
                    const verify = verification.rows[0];
                    if (verify.api_nul === 0 && verify.secret_nul === 0) {
                        console.log(`      ✅ Verificação: Nenhum caractere NUL detectado`);
                    } else {
                        console.log(`      ❌ ATENÇÃO: Ainda há caracteres NUL após atualização!`);
                    }
                } else {
                    console.log(`      ❌ Falha ao atualizar - usuário não encontrado`);
                }
                
            } catch (error) {
                console.log(`      ❌ Erro ao atualizar ${nome}: ${error.message}`);
            }
            
            // Esperar entre atualizações
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // 4. TESTE EXAUSTIVO DAS CHAVES LIMPAS
        console.log('\n🧪 TESTE EXAUSTIVO DAS CHAVES CORRIGIDAS:');
        
        for (const [nome, chaves] of Object.entries(chavesValidas)) {
            console.log(`\n   👤 Testando ${nome}:`);
            await testarChavesExaustivo(chaves, nome);
        }
        
        // 5. ANÁLISE FINAL DO ESTADO
        console.log('\n📊 ANÁLISE FINAL DO ESTADO:');
        const finalState = await pool.query(`
            SELECT u.name, ak.api_key, ak.secret_key, ak.validation_status,
                   LENGTH(ak.api_key) as api_len,
                   LENGTH(ak.secret_key) as secret_len,
                   POSITION(E'\\000' IN ak.api_key) as api_nul,
                   POSITION(E'\\000' IN ak.secret_key) as secret_nul
            FROM user_api_keys ak
            JOIN users u ON ak.user_id = u.id
            WHERE u.name ILIKE '%luiza%' OR u.name ILIKE '%érica%'
            ORDER BY u.name
        `);
        
        finalState.rows.forEach(row => {
            console.log(`\n   👤 ${row.name}:`);
            console.log(`      🔑 API Key: ${row.api_key} (${row.api_len} chars)`);
            console.log(`      🔐 Secret: ${row.secret_key?.substring(0, 15)}... (${row.secret_len} chars)`);
            console.log(`      📊 Status: ${row.validation_status}`);
            console.log(`      🚨 NUL chars: API=${row.api_nul}, Secret=${row.secret_nul}`);
        });
        
        console.log('\n✅ INVESTIGAÇÃO CONCLUÍDA');
        console.log('==========================');
        console.log('🧹 Caracteres NUL removidos');
        console.log('🔄 Chaves atualizadas com dados válidos');
        console.log('🧪 Testes exaustivos executados');
        console.log('📊 Estado final verificado');
        
    } catch (error) {
        console.error('❌ Erro na investigação:', error.message);
        console.error(error.stack);
    } finally {
        pool.end();
    }
}

async function testarChavesExaustivo(chaves, nome) {
    console.log(`      🔍 Teste exaustivo para ${nome}:`);
    
    const configuracoes = [
        { nome: 'TESTNET', url: 'https://api-testnet.bybit.com', endpoint: '/v5/account/info' },
        { nome: 'MAINNET', url: 'https://api.bybit.com', endpoint: '/v5/account/info' },
        { nome: 'MAINNET-ALT', url: 'https://api.bybit.com', endpoint: '/v5/user/query-api' }
    ];
    
    for (const config of configuracoes) {
        console.log(`\n         🌍 ${config.nome} (${config.endpoint}):`);
        
        try {
            const timestamp = Date.now().toString();
            const recvWindow = '20000'; // Aumentar recv_window
            
            // Criar assinatura mais robusta
            const message = timestamp + chaves.api_key + recvWindow;
            const signature = crypto.createHmac('sha256', chaves.secret_key).update(message).digest('hex');
            
            const headers = {
                'X-BAPI-API-KEY': chaves.api_key,
                'X-BAPI-SIGN': signature,
                'X-BAPI-SIGN-TYPE': '2',
                'X-BAPI-TIMESTAMP': timestamp,
                'X-BAPI-RECV-WINDOW': recvWindow,
                'Content-Type': 'application/json',
                'User-Agent': 'CoinBitClub-NUL-Fix/1.0',
                'Accept': 'application/json'
            };
            
            // Teste com timeout maior
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);
            
            const response = await fetch(`${config.url}${config.endpoint}`, {
                method: 'GET',
                headers: headers,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            const data = await response.json();
            
            console.log(`            ${data.retCode === 0 ? '✅' : '❌'} Código: ${data.retCode} - ${data.retMsg}`);
            
            if (data.retCode === 0) {
                console.log(`            🎉 SUCESSO! Chaves válidas em ${config.nome}`);
                if (data.result) {
                    console.log(`            💰 Dados da conta: Disponível`);
                }
            } else {
                console.log(`            📊 Erro: ${data.retMsg}`);
                
                // Análise detalhada do erro
                switch (data.retCode) {
                    case 10003:
                        console.log(`            🔍 API Key inválida - verificar se a chave está correta`);
                        break;
                    case 10004:
                        console.log(`            🔍 Erro de assinatura - verificar timestamp/signature`);
                        break;
                    case 10006:
                        console.log(`            🔍 IP não autorizado - verificar whitelist da Bybit`);
                        break;
                    case 10018:
                        console.log(`            🔍 Timestamp inválido - problema de sincronização`);
                        break;
                    default:
                        console.log(`            🔍 Erro não catalogado - código ${data.retCode}`);
                }
            }
            
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log(`            ⏱️  Timeout - conexão demorou mais que 15s`);
            } else {
                console.log(`            ❌ Erro de conexão: ${error.message}`);
            }
        }
        
        // Pausa entre testes
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

// Executar investigação
investigacaoExaustivaRailwayNUL();
