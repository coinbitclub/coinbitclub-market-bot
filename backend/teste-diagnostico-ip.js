/**
 * 🧪 TESTE DIAGNÓSTICO: VERIFICAR SE É PROBLEMA DE IP WHITELIST
 * Vamos testar diferentes aspectos da conexão com Bybit
 */

const https = require('https');
const crypto = require('crypto');

async function testarConexaoBybit() {
    console.log('🧪 TESTE DIAGNÓSTICO: PROBLEMA DE IP WHITELIST');
    console.log('='.repeat(55));
    
    // 1. Testar acesso básico à API Bybit
    console.log('\n📡 1. TESTANDO ACESSO BÁSICO À API BYBIT:');
    
    const testarEndpointPublico = () => {
        return new Promise((resolve) => {
            const req = https.request({
                hostname: 'api.bybit.com',
                port: 443,
                path: '/v5/market/time',
                method: 'GET'
            }, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        console.log('   ✅ Acesso público OK');
                        console.log(`   🕐 Server time: ${new Date(parseInt(response.result.timeNano / 1000000))}`);
                        resolve(true);
                    } catch (error) {
                        console.log(`   ❌ Erro no acesso público: ${error.message}`);
                        resolve(false);
                    }
                });
            });

            req.on('error', (error) => {
                console.log(`   ❌ Erro de conexão: ${error.message}`);
                resolve(false);
            });

            req.end();
        });
    };

    const acessoPublico = await testarEndpointPublico();

    // 2. Testar endpoint que requer autenticação
    console.log('\n🔐 2. TESTANDO ENDPOINT QUE REQUER AUTENTICAÇÃO:');
    console.log('   (Este deve falhar se IP não estiver na whitelist)');
    
    const testarEndpointPrivado = (apiKey, apiSecret, nome) => {
        return new Promise((resolve) => {
            console.log(`   🔑 Testando: ${nome}`);
            
            const timestamp = Date.now().toString();
            const recv_window = '5000';
            
            const signaturePayload = timestamp + apiKey + recv_window;
            const signature = crypto
                .createHmac('sha256', apiSecret)
                .update(signaturePayload)
                .digest('hex');

            const req = https.request({
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
            }, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        console.log(`   📊 Status Code: ${res.statusCode}`);
                        console.log(`   📋 Response: ${JSON.stringify(response).substring(0, 100)}...`);
                        
                        if (response.retCode === 0) {
                            console.log(`   ✅ ${nome}: SUCESSO`);
                        } else if (response.retCode === 10003) {
                            console.log(`   🚨 ${nome}: ERRO 10003 - IP não está na whitelist!`);
                        } else if (response.retCode === 10004) {
                            console.log(`   🔑 ${nome}: ERRO 10004 - API key inválida`);
                        } else {
                            console.log(`   ❌ ${nome}: ERRO ${response.retCode} - ${response.retMsg}`);
                        }
                        resolve(response);
                    } catch (error) {
                        console.log(`   ❌ ${nome}: Erro de parsing - ${error.message}`);
                        resolve({ error: error.message });
                    }
                });
            });

            req.on('error', (error) => {
                console.log(`   ❌ ${nome}: Erro de conexão - ${error.message}`);
                resolve({ error: error.message });
            });

            req.setTimeout(10000, () => {
                console.log(`   ⏰ ${nome}: Timeout`);
                resolve({ error: 'Timeout' });
            });

            req.end();
        });
    };

    // Testar com as chaves conhecidas
    const resultadoLuiza = await testarEndpointPrivado(
        '9HSZqEUJW9kDxHOA', 
        'OjJxNmsLOqajkTUcTFFtlsKzjqFNBKabOCU', 
        'LUIZA MARIA'
    );

    const resultadoErica = await testarEndpointPrivado(
        'g1HWyxEfWxobzJGew', 
        'gOGv9nokGvfFoB0CSFyudZrOE8XnyA1nmR4r', 
        'ÉRICA SANTOS'
    );

    // 3. Análise dos resultados
    console.log('\n🔍 3. ANÁLISE DOS RESULTADOS:');
    console.log('='.repeat(35));
    
    if (acessoPublico) {
        console.log('✅ Conectividade com Bybit: OK');
    } else {
        console.log('❌ Problema de conectividade básica');
    }

    // Verificar códigos de erro específicos
    const erros = [resultadoLuiza, resultadoErica];
    const erro10003 = erros.some(r => r.retCode === 10003);
    const erro10004 = erros.some(r => r.retCode === 10004);
    
    if (erro10003) {
        console.log('🚨 PROBLEMA CONFIRMADO: IP não está na whitelist!');
        console.log('   Solução: Adicionar IP 132.255.160.140 na whitelist Bybit');
    } else if (erro10004) {
        console.log('🔑 PROBLEMA: Chaves API inválidas ou revogadas');
        console.log('   Solução: Verificar/regenerar chaves na conta Bybit');
    } else {
        console.log('🤔 Problema não identificado pelos códigos padrão');
    }

    // 4. Obter informações do IP atual
    console.log('\n📍 4. INFORMAÇÕES DO SERVIDOR:');
    
    const obterIPPublico = () => {
        return new Promise((resolve) => {
            https.get('https://api.ipify.org?format=json', (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const ip = JSON.parse(data).ip;
                        console.log(`   🌐 IP público atual: ${ip}`);
                        console.log(`   📋 Este IP deve estar na whitelist Bybit`);
                        resolve(ip);
                    } catch (error) {
                        console.log(`   ❌ Erro ao obter IP: ${error.message}`);
                        resolve(null);
                    }
                });
            }).on('error', (error) => {
                console.log(`   ❌ Erro de conexão: ${error.message}`);
                resolve(null);
            });
        });
    };

    const ipAtual = await obterIPPublico();

    // 5. Recomendações finais
    console.log('\n🎯 5. RECOMENDAÇÕES BASEADAS NO DIAGNÓSTICO:');
    console.log('='.repeat(45));
    
    console.log('\n📋 AÇÕES IMEDIATAS:');
    if (ipAtual) {
        console.log(`   1. ✅ Confirmar IP do servidor: ${ipAtual}`);
    }
    console.log('   2. 🔐 Acessar conta Bybit da Paloma');
    console.log('   3. 🌐 Adicionar IP na whitelist da API');
    console.log('   4. 🔑 Verificar se chaves API ainda existem');
    console.log('   5. ⚙️ Verificar permissões das chaves');
    
    console.log('\n🔧 SE PROBLEMA PERSISTIR:');
    console.log('   1. 🆕 Gerar novas chaves API');
    console.log('   2. 📝 Atualizar chaves no banco de dados');
    console.log('   3. 🚀 Configurar variáveis no Railway');
    console.log('   4. 🧪 Testar novamente');

    console.log('\n💡 IMPORTANTE:');
    console.log('   • Erro "API key is invalid" pode ser whitelist IP');
    console.log('   • Migração Railway mudou o IP do servidor');
    console.log('   • Todas as chaves falham = problema de IP');
    console.log('   • Sistema funcionava ontem = chaves são válidas');
}

testarConexaoBybit();
