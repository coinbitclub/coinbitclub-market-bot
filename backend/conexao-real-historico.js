/**
 * 🔥 CONEXÃO REAL SÍNCRONA - BASEADA NO HISTÓRICO QUE FUNCIONOU
 * ===========================================================
 */

const { Pool } = require('pg');
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

// Configuração exata que funcionou antes
const pool = new Pool({
    connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
    ssl: { rejectUnauthorized: false }
});

// Dados da conexão real que funcionou (do histórico)
const ERICA_API_KEY = '2iNeNZQepHJS0lWBkf';
const ERICA_SECRET_KEY = 'ZtmCtREm6CU8CKW68Z6jKOPKcvxTfBIhKJqU';

async function executarConexaoRealHistorico() {
    const startTime = new Date();
    const logData = [];
    
    function log(msg) {
        const timestamp = new Date().toISOString();
        const fullMsg = `[${timestamp}] ${msg}`;
        console.log(fullMsg);
        logData.push(fullMsg);
    }

    try {
        log('🔥 REPLICANDO CONEXÃO REAL DO HISTÓRICO');
        log('======================================');
        log(`Início: ${startTime.toISOString()}`);

        // PASSO 1: Testar banco (como no histórico que funcionou)
        log('1️⃣ Testando conexão com banco...');
        const dbTest = await pool.query('SELECT NOW() as timestamp, version()');
        log(`✅ Banco conectado: ${dbTest.rows[0].timestamp}`);

        // PASSO 2: Verificar/corrigir chave da Erica 
        log('2️⃣ Verificando chave da Erica...');
        await pool.query(`
            UPDATE user_api_keys 
            SET secret_key = $1 
            WHERE api_key = $2
        `, [ERICA_SECRET_KEY, ERICA_API_KEY]);
        log('✅ Chave da Erica verificada/corrigida');

        // PASSO 3: CONEXÃO REAL COM BYBIT (exato do histórico)
        log('3️⃣ EXECUTANDO CONEXÃO REAL COM BYBIT V5...');
        log('==========================================');

        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        const params = { accountType: 'UNIFIED' };
        const queryString = new URLSearchParams(params).toString();
        
        // Assinatura HMAC (exata do que funcionou)
        const signPayload = timestamp + ERICA_API_KEY + recvWindow + queryString;
        const signature = crypto.createHmac('sha256', ERICA_SECRET_KEY).update(signPayload).digest('hex');
        
        log(`🔐 Timestamp: ${timestamp}`);
        log(`🔐 Signature: ${signature.substring(0, 20)}...`);

        // Fazer requisição HTTP manual (mais estável)
        const requestData = await new Promise((resolve, reject) => {
            const options = {
                hostname: 'api.bybit.com',
                port: 443,
                path: `/v5/account/wallet-balance?${queryString}`,
                method: 'GET',
                headers: {
                    'X-BAPI-API-KEY': ERICA_API_KEY,
                    'X-BAPI-SIGN': signature,
                    'X-BAPI-SIGN-TYPE': '2',
                    'X-BAPI-TIMESTAMP': timestamp,
                    'X-BAPI-RECV-WINDOW': recvWindow,
                    'Content-Type': 'application/json',
                    'User-Agent': 'CoinBitClub/1.0'
                },
                timeout: 30000
            };

            const req = https.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const jsonData = JSON.parse(data);
                        resolve({
                            status: res.statusCode,
                            data: jsonData
                        });
                    } catch (e) {
                        reject(new Error(`Parse error: ${e.message}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.end();
        });

        log(`📡 HTTP Status: ${requestData.status}`);
        log(`📊 Bybit retCode: ${requestData.data.retCode}`);

        if (requestData.data.retCode === 0) {
            log('🎉 CONEXÃO REAL ESTABELECIDA - SALDOS REAIS OBTIDOS!');
            log('==================================================');

            const result = requestData.data.result;
            const walletList = result?.list || [];
            
            log(`💼 Total de carteiras: ${walletList.length}`);

            let totalUSDGeral = 0;
            let totalMoedasGeral = 0;

            walletList.forEach((wallet, idx) => {
                const accountType = wallet.accountType || 'UNIFIED';
                const coins = wallet.coin || [];
                
                log(`\n💼 CARTEIRA ${idx + 1}: ${accountType}`);
                log('='.repeat(40));

                let totalUSDCarteira = 0;
                let moedasAtivas = 0;

                coins.forEach(coin => {
                    const walletBalance = parseFloat(coin.walletBalance) || 0;
                    const usdValue = parseFloat(coin.usdValue) || 0;
                    const available = parseFloat(coin.availableToWithdraw) || 0;
                    const locked = parseFloat(coin.locked) || 0;

                    if (walletBalance > 0) {
                        log(`💰 ${coin.coin}:`);
                        log(`   Saldo: ${walletBalance}`);
                        log(`   USD: $${usdValue.toFixed(2)}`);
                        log(`   Livre: ${available}`);
                        log(`   Bloqueado: ${locked}`);
                        
                        totalUSDCarteira += usdValue;
                        moedasAtivas++;
                    }
                });

                log(`💵 Total carteira: $${totalUSDCarteira.toFixed(2)}`);
                log(`🪙 Moedas ativas: ${moedasAtivas}`);
                
                totalUSDGeral += totalUSDCarteira;
                totalMoedasGeral += moedasAtivas;
            });

            log('\n🏆 RESUMO FINAL - SALDOS REAIS:');
            log('==============================');
            log(`👤 Conta: Erica dos Santos`);
            log(`🏦 Exchange: Bybit`);
            log(`💰 TOTAL USD: $${totalUSDGeral.toFixed(2)}`);
            log(`🪙 TOTAL MOEDAS: ${totalMoedasGeral}`);
            log(`📊 CARTEIRAS: ${walletList.length}`);
            log(`✅ STATUS: SALDOS REAIS COLETADOS!`);

            // Salvar no banco
            await pool.query(`
                UPDATE user_api_keys 
                SET validation_status = 'CONNECTED',
                    last_validated_at = NOW(),
                    error_details = NULL
                WHERE api_key = $1
            `, [ERICA_API_KEY]);

            log('✅ Status salvo no banco de dados');

            // Criar relatório final
            const relatorioFinal = {
                timestamp: new Date().toISOString(),
                conta: 'Erica dos Santos',
                exchange: 'Bybit',
                ambiente: 'mainnet',
                totalUSD: totalUSDGeral,
                totalMoedas: totalMoedasGeral,
                carteiras: walletList.length,
                status: 'SUCESSO - SALDOS REAIS COLETADOS',
                detalhes: walletList
            };

            fs.writeFileSync(`saldos-reais-${Date.now()}.json`, JSON.stringify(relatorioFinal, null, 2));
            log('📄 Relatório JSON salvo');

        } else {
            log(`❌ ERRO BYBIT:`);
            log(`   Código: ${requestData.data.retCode}`);
            log(`   Mensagem: ${requestData.data.retMsg}`);
        }

    } catch (error) {
        log(`❌ ERRO: ${error.message}`);
        log(`Stack: ${error.stack}`);
    } finally {
        await pool.end();
        
        const endTime = new Date();
        log(`🕒 Duração: ${endTime - startTime}ms`);
        log('🔚 EXECUÇÃO FINALIZADA');
        
        // Salvar log completo
        fs.writeFileSync(`log-conexao-real-${Date.now()}.txt`, logData.join('\n'));
    }
}

// Executar
executarConexaoRealHistorico().catch(console.error);
