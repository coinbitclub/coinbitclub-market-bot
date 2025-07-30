const { Pool } = require('pg');
const crypto = require('crypto');
const axios = require('axios');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

class BybitV5Client {
    constructor() {
        this.pool = pool;
        this.baseUrl = 'https://api.bybit.com';
        this.fallbackKeys = {
            apiKey: 'q3JH2TYGwCHaupbwgG',
            secretKey: 'GqF3E7RZWHBhERnBTUBK4l2qpSiVF3GBWEs'
        };
    }

    // Gerar assinatura V5
    generateSignature(timestamp, apiKey, secret, params = '') {
        const payload = timestamp + apiKey + '5000' + params;
        return crypto.createHmac('sha256', secret).update(payload).digest('hex');
    }

    // Fazer requisição autenticada V5
    async makeRequest(endpoint, apiKey, secret, params = {}) {
        try {
            const timestamp = Date.now().toString();
            const recv_window = '5000';
            
            // Para GET requests, adicionar params na query string
            let queryString = '';
            if (Object.keys(params).length > 0) {
                queryString = '?' + Object.keys(params)
                    .map(key => `${key}=${encodeURIComponent(params[key])}`)
                    .join('&');
            }
            
            const signature = this.generateSignature(timestamp, apiKey, secret, queryString);
            
            const headers = {
                'X-BAPI-API-KEY': apiKey,
                'X-BAPI-SIGN': signature,
                'X-BAPI-SIGN-TYPE': '2',
                'X-BAPI-TIMESTAMP': timestamp,
                'X-BAPI-RECV-WINDOW': recv_window,
                'Content-Type': 'application/json'
            };
            
            const url = `${this.baseUrl}${endpoint}${queryString}`;
            
            const response = await axios.get(url, {
                headers: headers,
                timeout: 15000
            });
            
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data || error.message,
                status: error.response?.status
            };
        }
    }

    // Buscar informações da conta
    async getAccountInfo(apiKey, secret) {
        const result = await this.makeRequest('/v5/account/info', apiKey, secret);
        
        if (result.success && result.data.retCode === 0) {
            return {
                success: true,
                accountInfo: result.data.result
            };
        } else {
            return {
                success: false,
                error: result.error?.retMsg || result.error || 'Erro desconhecido'
            };
        }
    }

    // Buscar saldo da carteira
    async getWalletBalance(apiKey, secret, accountType = 'UNIFIED') {
        const params = { accountType };
        const result = await this.makeRequest('/v5/account/wallet-balance', apiKey, secret, params);
        
        if (result.success && result.data.retCode === 0) {
            return {
                success: true,
                balances: result.data.result
            };
        } else {
            return {
                success: false,
                error: result.error?.retMsg || result.error || 'Erro desconhecido'
            };
        }
    }

    // Buscar posições abertas
    async getPositions(apiKey, secret, category = 'linear') {
        const params = { category };
        const result = await this.makeRequest('/v5/position/list', apiKey, secret, params);
        
        if (result.success && result.data.retCode === 0) {
            return {
                success: true,
                positions: result.data.result
            };
        } else {
            return {
                success: false,
                error: result.error?.retMsg || result.error || 'Erro desconhecido'
            };
        }
    }

    // Buscar chaves de um usuário
    async getUserKeys(userId) {
        try {
            const result = await this.pool.query(`
                SELECT * FROM user_api_keys 
                WHERE user_id = $1 AND exchange = 'bybit' AND is_active = true
                ORDER BY created_at DESC LIMIT 1
            `, [userId]);

            if (result.rows.length > 0) {
                const key = result.rows[0];
                return {
                    type: 'individual',
                    apiKey: key.api_key,
                    secretKey: key.secret_key
                };
            } else {
                return {
                    type: 'shared',
                    apiKey: this.fallbackKeys.apiKey,
                    secretKey: this.fallbackKeys.secretKey
                };
            }
        } catch (error) {
            return {
                type: 'shared',
                apiKey: this.fallbackKeys.apiKey,
                secretKey: this.fallbackKeys.secretKey
            };
        }
    }

    // Teste completo de um usuário
    async testUser(userId, userName) {
        console.log(`\n💰 TESTE DE SALDOS - ${userName} (ID: ${userId})`);
        console.log('=' .repeat(50));

        const keys = await this.getUserKeys(userId);
        const keyType = keys.type === 'individual' ? '🔑 Individual' : '🌐 Compartilhada';
        
        console.log(`   🔐 Usando chave: ${keyType}`);
        console.log(`   🗝️  API Key: ${keys.apiKey.substring(0, 15)}...`);

        // 1. Teste de informações da conta
        console.log('\n   📋 Informações da Conta:');
        const accountInfo = await this.getAccountInfo(keys.apiKey, keys.secretKey);
        
        if (accountInfo.success) {
            console.log('   ✅ Conta acessível');
            if (accountInfo.accountInfo) {
                console.log(`      👤 Tipo: ${accountInfo.accountInfo.accountType || 'N/A'}`);
                console.log(`      🏢 Status: ${accountInfo.accountInfo.status || 'N/A'}`);
            }
        } else {
            console.log(`   ❌ Erro na conta: ${accountInfo.error}`);
        }

        // 2. Teste de saldo da carteira
        console.log('\n   💰 Saldo da Carteira (UNIFIED):');
        const walletBalance = await this.getWalletBalance(keys.apiKey, keys.secretKey, 'UNIFIED');
        
        if (walletBalance.success && walletBalance.balances.list) {
            console.log('   ✅ Saldo acessível');
            
            walletBalance.balances.list.forEach(account => {
                if (account.coin && account.coin.length > 0) {
                    console.log(`      🏦 Conta: ${account.accountType}`);
                    
                    account.coin.slice(0, 5).forEach(coin => {
                        const balance = parseFloat(coin.walletBalance);
                        if (balance > 0) {
                            console.log(`         💎 ${coin.coin}: ${balance.toFixed(8)}`);
                        }
                    });
                }
            });
        } else {
            console.log(`   ❌ Erro no saldo: ${walletBalance.error}`);
        }

        // 3. Teste de saldo SPOT (se disponível)
        console.log('\n   💰 Saldo SPOT:');
        const spotBalance = await this.getWalletBalance(keys.apiKey, keys.secretKey, 'SPOT');
        
        if (spotBalance.success && spotBalance.balances.list) {
            console.log('   ✅ Saldo SPOT acessível');
            
            spotBalance.balances.list.forEach(account => {
                if (account.coin && account.coin.length > 0) {
                    account.coin.slice(0, 5).forEach(coin => {
                        const balance = parseFloat(coin.walletBalance);
                        if (balance > 0) {
                            console.log(`         💎 ${coin.coin}: ${balance.toFixed(8)}`);
                        }
                    });
                }
            });
        } else {
            console.log(`   ⚠️  SPOT não disponível: ${spotBalance.error}`);
        }

        // 4. Teste de posições
        console.log('\n   📈 Posições Abertas:');
        const positions = await this.getPositions(keys.apiKey, keys.secretKey, 'linear');
        
        if (positions.success && positions.positions.list) {
            const openPositions = positions.positions.list.filter(pos => 
                parseFloat(pos.size) > 0
            );
            
            if (openPositions.length > 0) {
                console.log(`   ✅ ${openPositions.length} posições abertas`);
                openPositions.slice(0, 3).forEach(pos => {
                    console.log(`      📊 ${pos.symbol}: ${pos.side} ${pos.size} (PnL: ${pos.unrealisedPnl})`);
                });
            } else {
                console.log('   📊 Nenhuma posição aberta');
            }
        } else {
            console.log(`   ⚠️  Posições não acessíveis: ${positions.error}`);
        }

        // Resumo do usuário
        const isWorking = accountInfo.success || walletBalance.success;
        const status = isWorking ? 'FUNCIONAL' : 'COM PROBLEMAS';
        
        console.log(`\n   🎯 Status Final: ${status}`);
        
        return {
            userId,
            userName,
            keyType: keys.type,
            working: isWorking,
            tests: {
                account: accountInfo.success,
                wallet: walletBalance.success,
                spot: spotBalance.success,
                positions: positions.success
            }
        };
    }

    // Testar todos os usuários
    async testAllUsers() {
        try {
            console.log('💰 TESTE DE SALDOS REAIS - API BYBIT V5');
            console.log('======================================');

            const users = await this.pool.query(`
                SELECT DISTINCT u.id, u.name, u.email, u.vip_status
                FROM users u 
                WHERE u.is_active = true
                ORDER BY u.vip_status DESC, u.id
            `);

            console.log(`📋 Testando ${users.rows.length} usuários ativos\n`);

            const results = [];

            for (const user of users.rows) {
                const result = await this.testUser(user.id, user.name);
                results.push(result);
                
                // Atualizar status no banco
                const status = result.working ? 'valid' : 'error';
                await this.pool.query(`
                    UPDATE user_api_keys 
                    SET validation_status = $1, last_validated_at = NOW()
                    WHERE user_id = $2 AND exchange = 'bybit' AND is_active = true
                `, [status, user.id]);
                
                // Pausa entre usuários
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            // Relatório final
            console.log('\n📊 RELATÓRIO FINAL DE CONECTIVIDADE');
            console.log('==================================');

            const working = results.filter(r => r.working);
            const notWorking = results.filter(r => !r.working);

            console.log(`✅ Funcionando: ${working.length}/${results.length} usuários`);
            console.log(`❌ Com problemas: ${notWorking.length}/${results.length} usuários`);

            if (working.length > 0) {
                console.log('\n✅ USUÁRIOS FUNCIONAIS:');
                working.forEach(r => {
                    console.log(`   ${r.keyType === 'individual' ? '🔑' : '🌐'} ${r.userName} - API V5 OK`);
                });
            }

            if (notWorking.length > 0) {
                console.log('\n❌ USUÁRIOS COM PROBLEMAS:');
                notWorking.forEach(r => {
                    console.log(`   ⚠️  ${r.userName} - Verificar chaves`);
                });
            }

            const successRate = Math.round((working.length / results.length) * 100);
            console.log(`\n🎯 Taxa de Sucesso: ${successRate}%`);

            if (successRate >= 80) {
                console.log('✅ Sistema pronto para produção!');
            } else if (successRate >= 50) {
                console.log('⚠️  Sistema parcialmente funcional - verificar chaves com problema');
            } else {
                console.log('❌ Sistema precisa de correções antes de usar em produção');
            }

            return results;

        } catch (error) {
            console.error('❌ Erro no teste:', error.message);
            return [];
        }
    }

    async close() {
        await this.pool.end();
    }
}

// Executar teste
async function main() {
    const client = new BybitV5Client();
    
    try {
        await client.testAllUsers();
        console.log('\n🎉 TESTE DE SALDOS CONCLUÍDO!');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await client.close();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = BybitV5Client;
