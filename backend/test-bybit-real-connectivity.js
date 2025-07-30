const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

class BybitRealConnectivityTest {
    constructor() {
        this.pool = pool;
        this.baseUrl = 'https://api.bybit.com';
    }

    // Implementação correta da assinatura Bybit V5
    generateCorrectSignature(timestamp, apiKey, recv_window, queryString, secret) {
        // Para Bybit V5, a string a ser assinada é: timestamp + apiKey + recv_window + queryString
        const param_str = timestamp + apiKey + recv_window + queryString;
        console.log(`   🔍 Debug - String a assinar: [${param_str}]`);
        
        const signature = crypto.createHmac('sha256', secret).update(param_str).digest('hex');
        console.log(`   🔍 Debug - Assinatura gerada: ${signature.substring(0, 20)}...`);
        
        return signature;
    }

    // Teste simples com endpoint público primeiro
    async testPublicEndpoint() {
        try {
            console.log(`\n🌍 TESTE DE ENDPOINT PÚBLICO`);
            console.log(`   🔄 Testando /v5/market/time...`);
            
            const response = await fetch(`${this.baseUrl}/v5/market/time`);
            const data = await response.json();
            
            console.log(`   📡 Status: ${response.status}`);
            console.log(`   📊 Dados: ${JSON.stringify(data)}`);
            
            return response.ok && data.retCode === 0;
        } catch (error) {
            console.log(`   ❌ Erro: ${error.message}`);
            return false;
        }
    }

    // Teste com uma chave real usando método correto
    async testRealApiKey(apiKey, secretKey, userInfo = '') {
        try {
            console.log(`\n🔑 TESTE REAL DE CHAVE: ${userInfo}`);
            console.log(`   🗝️  API Key: ${apiKey}`);
            console.log(`   🔐 Secret: ${secretKey.substring(0, 20)}...`);
            
            const timestamp = Date.now().toString();
            const recv_window = '5000';
            const queryString = ''; // Sem parâmetros para teste básico
            
            // Gerar assinatura correta
            const signature = this.generateCorrectSignature(timestamp, apiKey, recv_window, queryString, secretKey);
            
            // Preparar headers exatos da documentação Bybit
            const headers = {
                'X-BAPI-API-KEY': apiKey,
                'X-BAPI-SIGN': signature,
                'X-BAPI-SIGN-TYPE': '2',
                'X-BAPI-TIMESTAMP': timestamp,
                'X-BAPI-RECV-WINDOW': recv_window,
                'Content-Type': 'application/json'
            };
            
            console.log(`   📋 Headers preparados:`);
            console.log(`      API-KEY: ${headers['X-BAPI-API-KEY']}`);
            console.log(`      TIMESTAMP: ${headers['X-BAPI-TIMESTAMP']}`);
            console.log(`      SIGNATURE: ${headers['X-BAPI-SIGN'].substring(0, 20)}...`);
            
            // Testar endpoint mais simples: account/info
            const url = `${this.baseUrl}/v5/account/info`;
            console.log(`   🔄 Fazendo requisição para: ${url}`);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: headers
            });
            
            console.log(`   📡 Status HTTP: ${response.status}`);
            
            const data = await response.json();
            console.log(`   📊 Resposta: ${JSON.stringify(data, null, 2).substring(0, 500)}...`);
            
            if (data.retCode === 0) {
                console.log(`   ✅ SUCESSO! Chave válida e funcionando`);
                
                // Mostrar informações da conta se disponíveis
                if (data.result) {
                    console.log(`   📋 Informações da conta:`);
                    console.log(`      UID: ${data.result.uid || 'N/A'}`);
                    console.log(`      Status: ${data.result.status || 'N/A'}`);
                    console.log(`      Tipo: ${data.result.accountType || 'N/A'}`);
                }
                
                return { success: true, data: data };
            } else {
                console.log(`   ❌ FALHA: ${data.retMsg || 'Erro desconhecido'}`);
                console.log(`   🔍 Código: ${data.retCode}`);
                
                return { success: false, error: data.retMsg, code: data.retCode };
            }
            
        } catch (error) {
            console.error(`   💥 ERRO CRÍTICO: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    // Testar saldo específico (só se a chave for válida)
    async testWalletBalance(apiKey, secretKey) {
        try {
            console.log(`   💰 Testando saldo da carteira...`);
            
            const timestamp = Date.now().toString();
            const recv_window = '5000';
            const queryString = 'accountType=UNIFIED';
            
            const signature = this.generateCorrectSignature(timestamp, apiKey, recv_window, queryString, secretKey);
            
            const headers = {
                'X-BAPI-API-KEY': apiKey,
                'X-BAPI-SIGN': signature,
                'X-BAPI-SIGN-TYPE': '2',
                'X-BAPI-TIMESTAMP': timestamp,
                'X-BAPI-RECV-WINDOW': recv_window,
                'Content-Type': 'application/json'
            };
            
            const url = `${this.baseUrl}/v5/account/wallet-balance?${queryString}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: headers
            });
            
            const data = await response.json();
            
            if (data.retCode === 0) {
                console.log(`   ✅ Saldo obtido com sucesso!`);
                
                if (data.result && data.result.list) {
                    data.result.list.forEach(account => {
                        console.log(`   📊 Conta ${account.accountType}:`);
                        if (account.coin) {
                            const coinsWithBalance = account.coin.filter(c => parseFloat(c.walletBalance) > 0);
                            if (coinsWithBalance.length > 0) {
                                coinsWithBalance.slice(0, 5).forEach(coin => {
                                    console.log(`      ${coin.coin}: ${coin.walletBalance} (Disponível: ${coin.availableToWithdraw})`);
                                });
                            } else {
                                console.log(`      Sem saldos disponíveis`);
                            }
                        }
                    });
                }
                
                return { success: true, data: data };
            } else {
                console.log(`   ❌ Erro no saldo: ${data.retMsg}`);
                return { success: false, error: data.retMsg };
            }
            
        } catch (error) {
            console.log(`   ❌ Erro ao buscar saldo: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    // Testar todas as chaves do banco
    async testAllKeysReal() {
        try {
            console.log('🔍 TESTE REAL DE CONECTIVIDADE BYBIT');
            console.log('===================================');
            
            // Teste público primeiro
            const publicTest = await this.testPublicEndpoint();
            if (!publicTest) {
                console.log('❌ Falha no teste público - verificar internet');
                return [];
            }
            
            // Buscar chaves do banco
            const activeKeys = await this.pool.query(`
                SELECT ak.*, u.name, u.email, u.vip_status
                FROM user_api_keys ak
                JOIN users u ON ak.user_id = u.id
                WHERE ak.is_active = true 
                AND ak.exchange = 'bybit'
                AND u.is_active = true
                ORDER BY u.vip_status DESC, u.name
            `);
            
            console.log(`\n📋 Testando ${activeKeys.rows.length} chaves reais...`);
            
            const results = [];
            
            for (const keyData of activeKeys.rows) {
                const userInfo = `${keyData.name} (${keyData.vip_status ? 'VIP' : 'BÁSICO'})`;
                
                // Testar autenticação básica
                const authTest = await this.testRealApiKey(
                    keyData.api_key,
                    keyData.secret_key,
                    userInfo
                );
                
                let balanceTest = { success: false };
                
                // Se autenticação passou, testar saldo
                if (authTest.success) {
                    balanceTest = await this.testWalletBalance(
                        keyData.api_key,
                        keyData.secret_key
                    );
                }
                
                // Atualizar banco de dados
                const finalStatus = authTest.success ? 'valid' : 'error';
                const errorMsg = authTest.success ? null : (authTest.error || 'Falha na autenticação');
                
                await this.pool.query(`
                    UPDATE user_api_keys 
                    SET validation_status = $1, 
                        error_message = $2,
                        last_validated_at = NOW()
                    WHERE id = $3
                `, [finalStatus, errorMsg, keyData.id]);
                
                results.push({
                    user: keyData.name,
                    vip: keyData.vip_status,
                    valid: authTest.success,
                    hasBalance: balanceTest.success,
                    apiKey: keyData.api_key.substring(0, 15) + '...',
                    error: authTest.error
                });
                
                console.log(`   ⏳ Pausa de 2s antes do próximo teste...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            return results;
            
        } catch (error) {
            console.error('❌ Erro no teste geral:', error.message);
            return [];
        }
    }

    // Relatório final
    async generateFinalReport(results) {
        try {
            console.log('\n📊 RELATÓRIO FINAL DE CONECTIVIDADE');
            console.log('==================================');
            
            const valid = results.filter(r => r.valid);
            const invalid = results.filter(r => !r.valid);
            const withBalance = results.filter(r => r.hasBalance);
            
            console.log(`📈 RESUMO:`);
            console.log(`   🔑 Total de chaves testadas: ${results.length}`);
            console.log(`   ✅ Chaves válidas: ${valid.length}`);
            console.log(`   ❌ Chaves inválidas: ${invalid.length}`);
            console.log(`   💰 Chaves com saldo: ${withBalance.length}`);
            console.log(`   📊 Taxa de sucesso: ${Math.round((valid.length / results.length) * 100)}%`);
            
            if (valid.length > 0) {
                console.log(`\n✅ CHAVES FUNCIONANDO:`);
                valid.forEach(result => {
                    const vipStatus = result.vip ? '⭐ VIP' : '👤 BÁSICO';
                    const balanceStatus = result.hasBalance ? '💰 COM SALDO' : '💸 SEM SALDO';
                    console.log(`   ${vipStatus} | ${balanceStatus} | ${result.user}`);
                });
            }
            
            if (invalid.length > 0) {
                console.log(`\n❌ CHAVES COM PROBLEMA:`);
                invalid.forEach(result => {
                    const vipStatus = result.vip ? '⭐ VIP' : '👤 BÁSICO';
                    console.log(`   ${vipStatus} ${result.user}: ${result.error || 'Erro desconhecido'}`);
                });
                
                console.log(`\n🔧 AÇÕES RECOMENDADAS PARA CHAVES INVÁLIDAS:`);
                console.log(`   1. 🔄 Regenerar chaves na Bybit`);
                console.log(`   2. ✅ Verificar permissões (READ, TRADE)`);
                console.log(`   3. 🌐 Adicionar IP do Railway na whitelist`);
                console.log(`   4. 📝 Atualizar chaves no banco de dados`);
            }
            
            console.log(`\n🎯 STATUS GERAL DO SISTEMA:`);
            if (valid.length === results.length) {
                console.log(`   🎉 PERFEITO: Todas as chaves funcionando!`);
            } else if (valid.length > 0) {
                console.log(`   ⚠️  PARCIAL: Algumas chaves precisam de correção`);
            } else {
                console.log(`   🚨 CRÍTICO: Nenhuma chave funcionando!`);
            }
            
        } catch (error) {
            console.error('❌ Erro no relatório:', error.message);
        }
    }

    async close() {
        await this.pool.end();
    }
}

// Função principal
async function main() {
    const tester = new BybitRealConnectivityTest();

    try {
        console.log('🚀 INICIANDO TESTE REAL DE CONECTIVIDADE BYBIT');
        console.log('==============================================');
        
        const results = await tester.testAllKeysReal();
        await tester.generateFinalReport(results);
        
        console.log('\n✅ TESTE COMPLETO FINALIZADO!');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await tester.close();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = BybitRealConnectivityTest;
