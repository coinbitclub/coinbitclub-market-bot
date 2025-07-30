/**
 * 🔍 TESTE DIRETO DAS CHAVES API CONHECIDAS
 * Verifica as chaves que sabemos que funcionam
 */

const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🔍 TESTE DIRETO DAS CHAVES API CONHECIDAS');
console.log('='.repeat(50));

class DirectApiTester {
    constructor() {
        this.workingKeys = [];
        this.failedKeys = [];
    }

    // Gerar assinatura Bybit
    generateBybitSignature(secret, queryString) {
        return crypto.createHmac('sha256', secret)
                    .update(queryString)
                    .digest('hex');
    }

    // Validar chave API com método robusto
    async validarChaveAPI(apiKey, secretKey, userName = 'Desconhecido') {
        console.log(`\n🔄 Testando chave de ${userName}:`);
        console.log(`   🔑 API Key: ${apiKey.substring(0, 8)}...`);
        
        try {
            const timestamp = Date.now().toString();
            const recvWindow = '5000';
            
            // Primeiro, vamos tentar o endpoint mais simples - server time
            console.log('   📡 Testando conectividade básica...');
            
            const timeResponse = await fetch('https://api.bybit.com/v5/market/time', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!timeResponse.ok) {
                throw new Error('Erro de conectividade com Bybit');
            }

            console.log('   ✅ Conectividade com Bybit OK');

            // Agora testar com autenticação
            console.log('   🔐 Testando autenticação...');
            
            const params = `api_key=${apiKey}&recv_window=${recvWindow}&timestamp=${timestamp}`;
            const signature = this.generateBybitSignature(secretKey, params);
            
            const url = `https://api.bybit.com/v5/account/wallet-balance?${params}&sign=${signature}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-BAPI-API-KEY': apiKey,
                    'X-BAPI-TIMESTAMP': timestamp,
                    'X-BAPI-RECV-WINDOW': recvWindow,
                    'X-BAPI-SIGN': signature,
                    'Content-Type': 'application/json'
                }
            });

            console.log(`   📊 Status Response: ${response.status}`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const text = await response.text();
            console.log(`   📄 Response length: ${text.length} characters`);
            
            if (!text || text.trim() === '') {
                throw new Error('Resposta vazia da API');
            }

            let data;
            try {
                data = JSON.parse(text);
            } catch (parseError) {
                console.log(`   ❌ Erro ao fazer parse do JSON: ${parseError.message}`);
                console.log(`   📄 Texto recebido: ${text.substring(0, 100)}...`);
                throw new Error('Resposta não é JSON válido');
            }

            console.log(`   📊 RetCode: ${data.retCode}`);
            console.log(`   📊 RetMsg: ${data.retMsg || 'N/A'}`);

            if (data.retCode === 0) {
                // Chave válida - extrair informações do saldo
                const walletBalance = data.result?.list?.[0]?.coin || [];
                const usdtBalance = walletBalance.find(coin => coin.coin === 'USDT');
                
                const balance = usdtBalance ? parseFloat(usdtBalance.walletBalance) : 0;
                const availableBalance = usdtBalance ? parseFloat(usdtBalance.availableBalance) : 0;
                
                console.log(`   ✅ CHAVE VÁLIDA!`);
                console.log(`   💰 Saldo: $${balance.toFixed(2)} USDT`);
                console.log(`   💵 Disponível: $${availableBalance.toFixed(2)} USDT`);
                
                this.workingKeys.push({
                    userName,
                    apiKey: apiKey.substring(0, 8) + '...',
                    balance,
                    availableBalance
                });

                return {
                    valid: true,
                    balance,
                    availableBalance,
                    message: 'Chave válida e funcional'
                };
            } else {
                console.log(`   ❌ Chave inválida: ${data.retMsg || 'Erro desconhecido'}`);
                
                this.failedKeys.push({
                    userName,
                    apiKey: apiKey.substring(0, 8) + '...',
                    error: data.retMsg || 'Erro desconhecido',
                    retCode: data.retCode
                });

                return {
                    valid: false,
                    error: data.retMsg || 'Erro na validação',
                    retCode: data.retCode
                };
            }

        } catch (error) {
            console.log(`   ❌ Erro na validação: ${error.message}`);
            
            this.failedKeys.push({
                userName,
                apiKey: apiKey.substring(0, 8) + '...',
                error: error.message
            });

            return {
                valid: false,
                error: `Erro de conexão: ${error.message}`
            };
        }
    }

    // Buscar e testar todas as chaves do banco
    async testarTodasAsChaves() {
        console.log('🗃️ BUSCANDO CHAVES NO BANCO DE DADOS\n');

        try {
            const result = await pool.query(`
                SELECT 
                    k.id, k.user_id, k.api_key, k.secret_key, 
                    k.is_active, k.last_validated, k.validation_error,
                    u.name as user_name, u.email, u.is_active as user_active
                FROM user_api_keys k
                INNER JOIN users u ON k.user_id = u.id
                WHERE u.is_active = true
                ORDER BY k.last_validated DESC NULLS LAST
            `);

            const chaves = result.rows;
            
            if (chaves.length === 0) {
                console.log('❌ Nenhuma chave encontrada no banco');
                return;
            }

            console.log(`📊 Encontradas ${chaves.length} chaves no banco\n`);

            for (const chave of chaves) {
                await this.validarChaveAPI(chave.api_key, chave.secret_key, chave.user_name);
                
                // Delay para evitar rate limiting
                await new Promise(resolve => setTimeout(resolve, 3000));
            }

        } catch (error) {
            console.error('❌ Erro ao buscar chaves do banco:', error.message);
        }
    }

    // Testar chaves específicas que sabemos que funcionam
    async testarChavesEspecificas() {
        console.log('🎯 TESTANDO CHAVES ESPECÍFICAS QUE DEVEM FUNCIONAR\n');

        // Buscar especificamente as chaves que funcionaram antes
        try {
            const luizaResult = await pool.query(`
                SELECT k.api_key, k.secret_key, u.name as user_name
                FROM user_api_keys k
                INNER JOIN users u ON k.user_id = u.id
                WHERE u.name ILIKE '%luiza%' 
                OR u.email ILIKE '%luiza%'
                LIMIT 1
            `);

            if (luizaResult.rows.length > 0) {
                const luiza = luizaResult.rows[0];
                console.log('🔍 Encontrada chave da Luiza no banco');
                await this.validarChaveAPI(luiza.api_key, luiza.secret_key, luiza.user_name);
            } else {
                console.log('❌ Chave da Luiza não encontrada no banco');
            }

            // Delay
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Buscar chave mais recentemente validada
            const recentResult = await pool.query(`
                SELECT k.api_key, k.secret_key, u.name as user_name
                FROM user_api_keys k
                INNER JOIN users u ON k.user_id = u.id
                WHERE k.last_validated IS NOT NULL
                ORDER BY k.last_validated DESC
                LIMIT 1
            `);

            if (recentResult.rows.length > 0) {
                const recent = recentResult.rows[0];
                console.log('\n🔍 Testando chave mais recentemente validada');
                await this.validarChaveAPI(recent.api_key, recent.secret_key, recent.user_name);
            }

        } catch (error) {
            console.error('❌ Erro ao buscar chaves específicas:', error.message);
        }
    }

    // Gerar relatório final
    gerarRelatorio() {
        console.log('\n📋 RELATÓRIO FINAL DOS TESTES');
        console.log('='.repeat(50));

        console.log(`🎯 RESUMO:`);
        console.log(`   Chaves funcionais: ${this.workingKeys.length}`);
        console.log(`   Chaves com erro: ${this.failedKeys.length}`);
        console.log(`   Total testadas: ${this.workingKeys.length + this.failedKeys.length}`);

        if (this.workingKeys.length > 0) {
            console.log(`\n✅ CHAVES FUNCIONAIS:`);
            this.workingKeys.forEach((key, index) => {
                console.log(`   ${index + 1}. ${key.userName}`);
                console.log(`      🔑 ${key.apiKey}`);
                console.log(`      💰 $${key.balance.toFixed(2)} USDT`);
                console.log(`      💵 $${key.availableBalance.toFixed(2)} disponível`);
            });

            const totalBalance = this.workingKeys.reduce((sum, key) => sum + key.balance, 0);
            console.log(`\n💰 SALDO TOTAL: $${totalBalance.toFixed(2)} USDT`);
        }

        if (this.failedKeys.length > 0) {
            console.log(`\n❌ CHAVES COM ERRO:`);
            this.failedKeys.forEach((key, index) => {
                console.log(`   ${index + 1}. ${key.userName}`);
                console.log(`      🔑 ${key.apiKey}`);
                console.log(`      ❌ ${key.error}`);
            });
        }

        console.log(`\n🚀 RECOMENDAÇÕES:`);
        
        if (this.workingKeys.length === 0) {
            console.log(`   🔴 CRÍTICO: Nenhuma chave funcionando`);
            console.log(`   📝 Verificar conectividade e credenciais`);
        } else if (this.workingKeys.length < this.failedKeys.length) {
            console.log(`   🟡 PARCIAL: Algumas chaves funcionando`);
            console.log(`   📝 Corrigir chaves com erro`);
        } else {
            console.log(`   ✅ BOM: Maioria das chaves funcionando`);
            console.log(`   🚀 Sistema operacional`);
        }

        console.log(`\n🎉 TESTE CONCLUÍDO`);
    }

    // Executar todos os testes
    async executarTestes() {
        try {
            await this.testarChavesEspecificas();
            await this.testarTodasAsChaves();
            this.gerarRelatorio();
            
        } catch (error) {
            console.error('❌ Erro durante testes:', error.message);
        } finally {
            await pool.end();
        }
    }
}

// Executar testes
const tester = new DirectApiTester();
tester.executarTestes();
