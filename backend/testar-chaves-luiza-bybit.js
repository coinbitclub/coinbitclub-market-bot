/**
 * 🔐 SCRIPT SIMPLIFICADO - TESTE DE CHAVES BYBIT LUIZA MARIA
 * Validação das chaves da Bybit sem banco de dados
 */

const crypto = require('crypto');
const https = require('https');

console.log('🔐 TESTE DE CHAVES BYBIT - LUIZA MARIA (SEM BANCO)');
console.log('=================================================');

async function testarChavesBybitLuiza() {
    const apiKey = '9HZy9BiUW95iXprVRl';
    const apiSecret = 'QUjDXNmSI0qiqaKTUk7FHAHZnjiEN8AaRKQO';
    
    console.log('👤 Usuário: Luiza Maria');
    console.log('🏪 Exchange: Bybit');
    console.log('🔑 API Key:', apiKey);
    console.log('🔐 API Secret: ***' + apiSecret.slice(-6));
    console.log('');
    
    // Testar PRODUÇÃO
    console.log('🚀 TESTANDO PRODUÇÃO (api.bybit.com)...');
    const resultadoProd = await validarBybit(apiKey, apiSecret, false);
    console.log(`Status PRODUÇÃO: ${resultadoProd.valida ? '✅ VÁLIDA' : '❌ ' + resultadoProd.erro}`);
    
    if (resultadoProd.valida && resultadoProd.saldo) {
        console.log('💰 Saldos encontrados:', Object.keys(resultadoProd.saldo).length, 'moedas');
        Object.entries(resultadoProd.saldo).forEach(([moeda, dados]) => {
            console.log(`   ${moeda}: ${dados.total} (Disponível: ${dados.disponivel})`);
        });
    }
    
    console.log('');
    
    // Testar TESTNET
    console.log('🧪 TESTANDO TESTNET (api-testnet.bybit.com)...');
    const resultadoTest = await validarBybit(apiKey, apiSecret, true);
    console.log(`Status TESTNET: ${resultadoTest.valida ? '✅ VÁLIDA' : '❌ ' + resultadoTest.erro}`);
    
    if (resultadoTest.valida && resultadoTest.saldo) {
        console.log('💰 Saldos encontrados:', Object.keys(resultadoTest.saldo).length, 'moedas');
        Object.entries(resultadoTest.saldo).forEach(([moeda, dados]) => {
            console.log(`   ${moeda}: ${dados.total} (Disponível: ${dados.disponivel})`);
        });
    }
}

async function validarBybit(apiKey, apiSecret, testnet) {
    const modoOperacao = testnet ? 'TESTNET' : 'PRODUÇÃO';
    console.log(`🔍 Validando chaves Bybit (${modoOperacao})`);
    
    try {
        // Usar endpoints corretos para testnet e produção
        const baseUrl = testnet ? 'https://api-testnet.bybit.com' : 'https://api.bybit.com';
        const timestamp = Date.now();
        const recvWindow = '5000';
        
        console.log(`📡 Conectando em: ${baseUrl} (${modoOperacao})`);
        
        // Criar assinatura HMAC-SHA256 (formato Bybit)
        const signature = crypto
            .createHmac('sha256', apiSecret)
            .update(timestamp + apiKey + recvWindow)
            .digest('hex');

        const headers = {
            'X-BAPI-API-KEY': apiKey,
            'X-BAPI-SIGN': signature,
            'X-BAPI-SIGN-TYPE': '2',
            'X-BAPI-TIMESTAMP': timestamp.toString(),
            'X-BAPI-RECV-WINDOW': recvWindow,
            'Content-Type': 'application/json'
        };

        const url = `${baseUrl}/v5/account/wallet-balance?accountType=UNIFIED`;
        
        // Fazer requisição autenticada
        const response = await new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const options = {
                hostname: urlObj.hostname,
                path: urlObj.pathname + urlObj.search,
                method: 'GET',
                headers: headers
            };
            
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const jsonData = JSON.parse(data);
                        console.log('📨 Resposta recebida:', JSON.stringify(jsonData, null, 2));
                        resolve(jsonData);
                    } catch (error) {
                        console.log('📨 Resposta (texto):', data);
                        reject(new Error('Resposta inválida da Bybit'));
                    }
                });
            });
            
            req.on('error', (error) => {
                console.log('🔌 Erro de conexão:', error.message);
                reject(error);
            });
            
            req.setTimeout(15000, () => {
                req.destroy();
                reject(new Error('Timeout na requisição'));
            });
            
            req.end();
        });
        
        if (response.result && response.retCode === 0) {
            // Extrair saldos da Bybit
            const saldos = {};
            if (response.result.list && response.result.list.length > 0) {
                const wallet = response.result.list[0];
                if (wallet.coin) {
                    wallet.coin.forEach(coin => {
                        const total = parseFloat(coin.walletBalance);
                        if (total > 0) {
                            saldos[coin.coin] = {
                                disponivel: parseFloat(coin.availableToWithdraw || coin.walletBalance),
                                total: total,
                                bloqueado: parseFloat(coin.locked || 0)
                            };
                        }
                    });
                }
            }
            
            return {
                valida: true,
                permissoes: ['spot_trading', 'derivatives_trading', 'read_account'],
                saldo: saldos,
                informacoes: {
                    accountType: response.result.list[0]?.accountType || 'UNIFIED',
                    totalEquity: response.result.list[0]?.totalEquity || '0',
                    totalWalletBalance: response.result.list[0]?.totalWalletBalance || '0',
                    accountIMRate: response.result.list[0]?.accountIMRate || '0',
                    canTrade: true,
                    canWithdraw: true,
                    canDeposit: true,
                    updateTime: Date.now()
                }
            };
        } else if (response.retCode !== 0) {
            // Mapear códigos de erro comuns da Bybit
            let mensagemErro = `Código ${response.retCode}: ${response.retMsg}`;
            if (response.retCode === 10003) {
                mensagemErro = 'API Key inválida';
            } else if (response.retCode === 10004) {
                mensagemErro = 'Assinatura inválida (API Secret incorreto)';
            } else if (response.retCode === 10005) {
                mensagemErro = 'Permissões insuficientes';
            }
            
            return {
                valida: false,
                erro: mensagemErro,
                permissoes: []
            };
        } else {
            return {
                valida: false,
                erro: 'Resposta inesperada da Bybit',
                permissoes: []
            };
        }
        
    } catch (error) {
        console.error('❌ Erro na validação Bybit:', error.message);
        return {
            valida: false,
            erro: error.message,
            permissoes: []
        };
    }
}

// Executar teste
testarChavesBybitLuiza()
    .then(() => {
        console.log('');
        console.log('🏁 TESTE FINALIZADO');
    })
    .catch(error => {
        console.error('💥 ERRO:', error.message);
    });
