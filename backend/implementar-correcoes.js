/**
 * 🔧 IMPLEMENTAR CORREÇÕES PÓS-MIGRAÇÃO RAILWAY
 * Atualizar chaves reais da Paloma e configurar o sistema
 */

const { Pool } = require('pg');
const crypto = require('crypto');
const https = require('https');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

// Função para testar chaves Bybit
async function testarChavesBybit(apiKey, apiSecret, nome) {
    console.log(`\n🔑 TESTANDO CHAVES: ${nome}`);
    console.log(`   API Key: ${apiKey.substring(0, 8)}...`);
    
    try {
        const timestamp = Date.now().toString();
        const recv_window = '5000';
        
        const signaturePayload = timestamp + apiKey + recv_window;
        const signature = crypto
            .createHmac('sha256', apiSecret)
            .update(signaturePayload)
            .digest('hex');

        const options = {
            hostname: 'api.bybit.com',
            port: 443,
            path: '/v5/user/query-api',
            method: 'GET',
            headers: {
                'X-BAPI-API-KEY': apiKey,
                'X-BAPI-SIGN': signature,
                'X-BAPI-SIGN-TYPE': '2',
                'X-BAPI-TIMESTAMP': timestamp,
                'X-BAPI-RECV-WINDOW': recv_window,
                'Content-Type': 'application/json'
            }
        };

        return new Promise((resolve) => {
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        if (response.retCode === 0) {
                            console.log(`   ✅ SUCESSO! Chave válida`);
                            console.log(`   📊 Dados: ${JSON.stringify(response.result).substring(0, 80)}...`);
                            resolve({ success: true, data: response.result });
                        } else {
                            console.log(`   ❌ ERRO: ${response.retMsg || response.message}`);
                            resolve({ success: false, error: response.retMsg || response.message });
                        }
                    } catch (error) {
                        console.log(`   ❌ ERRO DE PARSING: ${error.message}`);
                        resolve({ success: false, error: error.message });
                    }
                });
            });

            req.on('error', (error) => {
                console.log(`   ❌ ERRO DE CONEXÃO: ${error.message}`);
                resolve({ success: false, error: error.message });
            });

            req.setTimeout(10000, () => {
                console.log(`   ⏰ TIMEOUT`);
                resolve({ success: false, error: 'Timeout' });
            });

            req.end();
        });
    } catch (error) {
        console.log(`   ❌ ERRO GERAL: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function implementarCorrecoes() {
    try {
        console.log('🔧 IMPLEMENTANDO CORREÇÕES PÓS-MIGRAÇÃO RAILWAY');
        console.log('='.repeat(60));
        
        console.log('\n📋 INFORMAÇÕES IMPORTANTES:');
        console.log('• IP atual do servidor: 132.255.160.140');
        console.log('• Este IP DEVE estar na whitelist da Bybit');
        console.log('• Chaves atuais são placeholders genéricos');
        
        // 1. Verificar estado atual
        console.log('\n📊 1. VERIFICANDO ESTADO ATUAL:');
        const estadoAtual = await pool.query(`
            SELECT 
                u.name,
                u.balance_usd,
                k.api_key,
                k.secret_key,
                k.validation_status,
                k.error_message
            FROM users u
            LEFT JOIN user_api_keys k ON u.id = k.user_id
            WHERE u.name ILIKE '%paloma%'
        `);

        if (estadoAtual.rows.length > 0) {
            const paloma = estadoAtual.rows[0];
            console.log(`   👤 Nome: ${paloma.name}`);
            console.log(`   💰 Saldo: $${paloma.balance_usd}`);
            console.log(`   🔑 API Key atual: ${paloma.api_key || 'Não configurada'}`);
            console.log(`   📊 Status: ${paloma.validation_status || 'N/A'}`);
        }

        // 2. Fornecer chaves reais de exemplo (você precisa substituir por chaves verdadeiras)
        console.log('\n🔑 2. CONFIGURANDO CHAVES REAIS DA PALOMA:');
        console.log('   ⚠️  IMPORTANTE: Substitua pelas chaves reais da conta Bybit da Paloma');
        
        // CHAVES DE EXEMPLO - SUBSTITUIR PELAS REAIS
        const chavesReaisPaloma = {
            apiKey: 'SUBSTITUA_PELA_CHAVE_REAL_DA_PALOMA',
            secretKey: 'SUBSTITUA_PELO_SECRET_REAL_DA_PALOMA'
        };

        console.log(`   🔑 API Key: ${chavesReaisPaloma.apiKey}`);
        console.log(`   🗝️ Secret: ${chavesReaisPaloma.secretKey.substring(0, 10)}...`);

        // 3. Se as chaves foram fornecidas corretamente, atualize no banco
        if (!chavesReaisPaloma.apiKey.includes('SUBSTITUA')) {
            console.log('\n💾 3. ATUALIZANDO BANCO DE DADOS:');
            
            const updateResult = await pool.query(`
                UPDATE user_api_keys SET
                    api_key = $1,
                    secret_key = $2,
                    validation_status = 'pending',
                    error_message = NULL,
                    updated_at = NOW()
                WHERE user_id = (
                    SELECT id FROM users WHERE name ILIKE '%paloma%'
                ) AND exchange = 'bybit'
                RETURNING *
            `, [chavesReaisPaloma.apiKey, chavesReaisPaloma.secretKey]);

            if (updateResult.rows.length > 0) {
                console.log(`   ✅ Chaves atualizadas no banco`);
                
                // 4. Testar as chaves atualizadas
                await testarChavesBybit(
                    chavesReaisPaloma.apiKey, 
                    chavesReaisPaloma.secretKey, 
                    'PALOMA AMARAL - CHAVES ATUALIZADAS'
                );
            } else {
                console.log(`   ❌ Erro ao atualizar chaves no banco`);
            }
        } else {
            console.log('\n⚠️  3. CHAVES AINDA SÃO PLACEHOLDERS');
            console.log('   Para completar a correção:');
            console.log('   1. Edite este arquivo e substitua as chaves');
            console.log('   2. Execute novamente: node implementar-correcoes.js');
        }

        // 5. Verificar outras usuárias
        console.log('\n👥 4. VERIFICANDO OUTRAS USUÁRIAS:');
        const outrasUsuarias = await pool.query(`
            SELECT 
                u.name,
                k.api_key,
                k.validation_status
            FROM users u
            JOIN user_api_keys k ON u.id = k.user_id
            WHERE u.name NOT ILIKE '%paloma%'
            AND k.exchange = 'bybit'
        `);

        if (outrasUsuarias.rows.length > 0) {
            console.log(`   📊 Encontradas ${outrasUsuarias.rows.length} outras usuárias:`);
            outrasUsuarias.rows.forEach(user => {
                console.log(`   • ${user.name}: ${user.api_key.substring(0, 8)}... (${user.validation_status})`);
            });

            // Testar chaves da Luiza e Érica que temos
            console.log('\n🔍 TESTANDO CHAVES CONHECIDAS:');
            await testarChavesBybit('9HSZqEUJW9kDxHOA', 'OjJxNmsLOqajkTUcTFFtlsKzjqFNBKabOCU', 'LUIZA MARIA');
            await testarChavesBybit('g1HWyxEfWxobzJGew', 'gOGv9nokGvfFoB0CSFyudZrOE8XnyA1nmR4r', 'ÉRICA SANTOS');
        }

        // 6. Guia de próximos passos
        console.log('\n🎯 5. PRÓXIMOS PASSOS PARA COMPLETAR A CORREÇÃO:');
        console.log('='.repeat(50));
        
        console.log('\n🔐 NO BYBIT (conta da Paloma):');
        console.log('   1. Acesse www.bybit.com e faça login');
        console.log('   2. Vá em Account & Security > API Management');
        console.log('   3. Verifique se as chaves API ainda existem');
        console.log('   4. Adicione o IP 132.255.160.140 na whitelist');
        console.log('   5. Verifique permissões: Spot Trading, Derivatives');
        console.log('   6. Se necessário, gere novas chaves API');

        console.log('\n🚀 NO RAILWAY:');
        console.log('   1. Acesse o painel do Railway');
        console.log('   2. Vá na aba Variables');
        console.log('   3. Adicione: BYBIT_API_KEY=chave_real');
        console.log('   4. Adicione: BYBIT_API_SECRET=secret_real');
        console.log('   5. Adicione: NODE_ENV=production');
        console.log('   6. Faça redeploy do serviço');

        console.log('\n💻 NO CÓDIGO:');
        console.log('   1. Edite implementar-correcoes.js com chaves reais');
        console.log('   2. Execute: node implementar-correcoes.js');
        console.log('   3. Execute: node teste-rapido-pos-correcao.js');
        console.log('   4. Verifique se todos os testes passam');

        console.log('\n✅ SISTEMA ESTARÁ OPERACIONAL APÓS ESSAS CORREÇÕES!');

    } catch (error) {
        console.error('❌ Erro na implementação:', error.message);
    } finally {
        pool.end();
    }
}

implementarCorrecoes();
