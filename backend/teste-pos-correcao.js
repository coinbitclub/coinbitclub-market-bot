/**
 * ✅ TESTE PÓS-CORREÇÃO: VALIDAR SE IP FOI ADICIONADO NA WHITELIST
 * Execute após adicionar IP 132.255.160.140 na conta Bybit
 */

const { Pool } = require('pg');
const crypto = require('crypto');
const https = require('https');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function testarBybitAuth(apiKey, apiSecret, userName) {
    console.log(`\n🔑 TESTANDO: ${userName}`);
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
                            console.log(`   ✅ SUCESSO! Chave funcionando`);
                            console.log(`   📊 API Info: ${JSON.stringify(response.result).substring(0, 80)}...`);
                            
                            // Atualizar status no banco
                            pool.query(`
                                UPDATE user_api_keys 
                                SET validation_status = 'validated', 
                                    error_message = NULL,
                                    last_validated_at = NOW()
                                WHERE api_key = $1
                            `, [apiKey]).catch(console.error);
                            
                            resolve({ success: true, data: response.result });
                        } else if (response.retCode === 10003) {
                            console.log(`   🚨 ERRO 10003: IP ainda não está na whitelist`);
                            console.log(`   💡 Aguarde alguns minutos e tente novamente`);
                            resolve({ success: false, error: 'IP not whitelisted', code: 10003 });
                        } else if (response.retCode === 10004) {
                            console.log(`   ❌ ERRO 10004: API key inválida ou revogada`);
                            resolve({ success: false, error: 'Invalid API key', code: 10004 });
                        } else {
                            console.log(`   ❌ ERRO ${response.retCode}: ${response.retMsg}`);
                            resolve({ success: false, error: response.retMsg, code: response.retCode });
                        }
                    } catch (error) {
                        console.log(`   ❌ Erro de parsing: ${error.message}`);
                        resolve({ success: false, error: error.message });
                    }
                });
            });

            req.on('error', (error) => {
                console.log(`   ❌ Erro de conexão: ${error.message}`);
                resolve({ success: false, error: error.message });
            });

            req.setTimeout(15000, () => {
                console.log(`   ⏰ Timeout - tente novamente`);
                resolve({ success: false, error: 'Timeout' });
            });

            req.end();
        });
    } catch (error) {
        console.log(`   ❌ Erro geral: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function testarAposCorrecao() {
    try {
        console.log('✅ TESTE PÓS-CORREÇÃO: VALIDAR IP NA WHITELIST');
        console.log('='.repeat(55));
        
        console.log('\n📍 INFORMAÇÕES DO SERVIDOR:');
        console.log('   🌐 IP que deve estar na whitelist: 132.255.160.140');
        console.log('   📋 Este teste verifica se o IP foi adicionado corretamente');
        
        // 1. Buscar todas as chaves no banco
        console.log('\n📊 1. BUSCANDO CHAVES NO BANCO:');
        const chavesResult = await pool.query(`
            SELECT 
                u.name,
                k.api_key,
                k.secret_key,
                k.validation_status,
                k.exchange
            FROM user_api_keys k
            JOIN users u ON k.user_id = u.id
            WHERE k.exchange = 'bybit'
            ORDER BY u.name
        `);

        if (chavesResult.rows.length === 0) {
            console.log('   ❌ Nenhuma chave Bybit encontrada no banco');
            return;
        }

        console.log(`   📋 Encontradas ${chavesResult.rows.length} chaves Bybit:`);
        chavesResult.rows.forEach(row => {
            console.log(`   • ${row.name}: ${row.api_key.substring(0, 8)}... (${row.validation_status})`);
        });

        // 2. Testar cada chave
        console.log('\n🔐 2. TESTANDO AUTENTICAÇÃO COM CADA CHAVE:');
        const resultados = [];

        for (const row of chavesResult.rows) {
            if (row.api_key.includes('PLACEHOLDER') || row.api_key.includes('API_KEY_REAL')) {
                console.log(`\n🔑 PULANDO: ${row.name}`);
                console.log(`   ⚠️  Chave é placeholder: ${row.api_key}`);
                resultados.push({ name: row.name, success: false, error: 'Placeholder key' });
                continue;
            }

            const resultado = await testarBybitAuth(row.api_key, row.secret_key, row.name);
            resultados.push({ name: row.name, ...resultado });
            
            // Aguardar um pouco entre as chamadas
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // 3. Resumo dos resultados
        console.log('\n📊 3. RESUMO DOS TESTES:');
        console.log('='.repeat(30));
        
        const sucessos = resultados.filter(r => r.success).length;
        const falhas = resultados.filter(r => !r.success).length;
        const ipErrors = resultados.filter(r => r.code === 10003).length;
        const keyErrors = resultados.filter(r => r.code === 10004).length;

        console.log(`   ✅ Sucessos: ${sucessos}`);
        console.log(`   ❌ Falhas: ${falhas}`);
        console.log(`   🚨 Erros de IP (10003): ${ipErrors}`);
        console.log(`   🔑 Erros de chave (10004): ${keyErrors}`);

        // 4. Análise e recomendações
        console.log('\n🎯 4. ANÁLISE E PRÓXIMOS PASSOS:');
        console.log('='.repeat(35));

        if (sucessos === chavesResult.rows.length) {
            console.log('🎉 PERFEITO! Todas as chaves funcionando');
            console.log('✅ IP foi adicionado corretamente na whitelist');
            console.log('✅ Sistema está operacional');
            
            console.log('\n🚀 SISTEMA PRONTO PARA OPERAR:');
            console.log('   • API Keys validadas');
            console.log('   • Conexão com Bybit OK');
            console.log('   • Multiusuário funcionando');
            console.log('   • Pronto para receber sinais TradingView');
            
        } else if (ipErrors > 0) {
            console.log('🚨 AINDA HÁ PROBLEMAS DE IP:');
            console.log(`   • ${ipErrors} chaves ainda com erro 10003`);
            console.log('   • IP 132.255.160.140 pode não estar na whitelist');
            console.log('   • Ou mudanças ainda não propagaram');
            
            console.log('\n🔧 AÇÕES RECOMENDADAS:');
            console.log('   1. Verificar se IP foi adicionado corretamente');
            console.log('   2. Aguardar 5-10 minutos para propagação');
            console.log('   3. Executar este teste novamente');
            console.log('   4. Verificar se não há múltiplas contas Bybit');

        } else if (keyErrors > 0) {
            console.log('🔑 PROBLEMAS COM CHAVES API:');
            console.log(`   • ${keyErrors} chaves inválidas ou revogadas`);
            console.log('   • Podem ter sido desabilitadas');
            
            console.log('\n🔧 AÇÕES RECOMENDADAS:');
            console.log('   1. Verificar status das chaves na conta Bybit');
            console.log('   2. Regenerar chaves se necessário');
            console.log('   3. Atualizar banco de dados com novas chaves');

        } else {
            console.log('🤔 PROBLEMAS DIVERSOS:');
            console.log('   • Verificar logs detalhados acima');
            console.log('   • Pode ser problema de conectividade');
        }

        // 5. Comandos úteis
        console.log('\n💻 5. COMANDOS ÚTEIS:');
        console.log('   • Testar novamente: node teste-pos-correcao.js');
        console.log('   • Verificar banco: node check-api-keys-table.js');
        console.log('   • Diagnóstico IP: node teste-diagnostico-ip.js');

    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
    } finally {
        pool.end();
    }
}

testarAposCorrecao();
