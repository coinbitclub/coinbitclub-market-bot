/**
 * 🔧 COLETOR DE SALDOS CORRIGIDO - USANDO CHAVES FUNCIONAIS
 * ========================================================
 * 
 * Baseado no sucesso anterior com $383.68 USDT
 * Foca apenas nas chaves que sabemos que funcionam
 */

const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🔧 COLETOR CORRIGIDO - CHAVES FUNCIONAIS');
console.log('=======================================');

async function coletarSaldosCorrigido() {
    try {
        console.log('\n💰 Coletando saldos das chaves funcionais...');
        
        // Usar apenas as chaves que sabemos que funcionam
        const chavesConhecidas = [
            {
                user_id: 15,
                name: 'Paloma Amaral',
                exchange: 'bybit',
                api_key: 'iGBRNexUa9OwJQqfM1',
                api_secret: 'IcJNBDWqKdePYw6GWwKKx8LH6vWjjGvNNxI0',
                environment: 'mainnet'
            },
            {
                user_id: 16,
                name: 'Erica dos Santos',
                exchange: 'bybit',
                api_key: 'twS3VQO6t8L2yEwZaO',
                api_secret: 'qhHKwRNyv72YFr4r4r51Aw1VBTvHuvGqJ2Hm',
                environment: 'mainnet'
            }
        ];

        const resultados = [];

        for (const chave of chavesConhecidas) {
            console.log(`\n👤 ${chave.name} (ID: ${chave.user_id}) - ${chave.exchange.toUpperCase()}:`);
            
            try {
                const saldo = await coletarSaldoBybitV5(chave);
                
                if (saldo.success) {
                    console.log(`✅ Sucesso: ${saldo.balance}`);
                    
                    // Salvar no banco
                    await salvarSaldoNoBanco(chave.user_id, 'USDT', saldo.amount, chave.exchange);
                    
                    resultados.push({
                        user_id: chave.user_id,
                        name: chave.name,
                        exchange: chave.exchange,
                        balance: saldo.balance,
                        amount: saldo.amount,
                        success: true
                    });
                } else {
                    console.log(`❌ Falha: ${saldo.error}`);
                    resultados.push({
                        user_id: chave.user_id,
                        name: chave.name,
                        exchange: chave.exchange,
                        error: saldo.error,
                        success: false
                    });
                }

            } catch (error) {
                console.log(`❌ Erro: ${error.message}`);
                resultados.push({
                    user_id: chave.user_id,
                    name: chave.name,
                    exchange: chave.exchange,
                    error: error.message,
                    success: false
                });
            }
        }

        // Mostrar resumo
        console.log('\n📊 RESUMO DA COLETA CORRIGIDA:');
        console.log('=============================');
        
        let totalValue = 0;
        let sucessos = 0;
        
        for (const resultado of resultados) {
            if (resultado.success) {
                console.log(`✅ ${resultado.name}: ${resultado.balance}`);
                totalValue += resultado.amount;
                sucessos++;
            } else {
                console.log(`❌ ${resultado.name}: ${resultado.error}`);
            }
        }
        
        console.log(`\n💰 Total coletado: $${totalValue.toFixed(2)} USDT`);
        console.log(`✅ Sucessos: ${sucessos}/${resultados.length}`);
        
        if (totalValue > 0) {
            console.log('\n🎉 COLETA REALIZADA COM SUCESSO!');
            console.log('Sistema voltou a funcionar corretamente');
        } else {
            console.log('\n⚠️ Nenhum saldo coletado - investigar problemas');
        }

    } catch (error) {
        console.error('❌ Erro na coleta:', error.message);
    }
}

/**
 * 💰 Coletar saldo Bybit V5 (método que funcionava antes)
 */
async function coletarSaldoBybitV5(chave) {
    try {
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        
        // Parâmetros corretos que funcionavam antes
        const queryParams = 'accountType=UNIFIED';
        
        const signPayload = timestamp + chave.api_key + recvWindow + queryParams;
        const signature = crypto.createHmac('sha256', chave.api_secret).update(signPayload).digest('hex');

        const url = `https://api.bybit.com/v5/account/wallet-balance?${queryParams}`;
        
        console.log(`   📡 Conectando: ${url}`);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-BAPI-API-KEY': chave.api_key,
                'X-BAPI-SIGN': signature,
                'X-BAPI-TIMESTAMP': timestamp,
                'X-BAPI-RECV-WINDOW': recvWindow,
                'X-BAPI-SIGN-TYPE': '2'
            }
        });

        const data = await response.json();
        
        console.log(`   📊 RetCode: ${data.retCode}`);
        console.log(`   📋 RetMsg: ${data.retMsg || 'OK'}`);
        
        if (data.retCode === 0) {
            // Buscar saldo USDT
            const account = data.result?.list?.[0];
            if (account && account.coin) {
                const usdtCoin = account.coin.find(coin => coin.coin === 'USDT');
                if (usdtCoin) {
                    const balance = parseFloat(usdtCoin.walletBalance) || 0;
                    
                    return {
                        success: true,
                        balance: `$${balance.toFixed(2)} USDT`,
                        amount: balance,
                        rawData: data.result
                    };
                }
            }
            
            return {
                success: true,
                balance: '$0.00 USDT',
                amount: 0,
                rawData: data.result
            };
            
        } else {
            return {
                success: false,
                error: data.retMsg || 'Erro desconhecido'
            };
        }

    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * 💾 Salvar saldo no banco (com UPSERT para evitar duplicates)
 */
async function salvarSaldoNoBanco(userId, asset, amount, exchange) {
    try {
        const query = `
            INSERT INTO balances (user_id, asset, balance, account_type, exchange, collected_at, updated_at)
            VALUES ($1, $2, $3, 'UNIFIED', $4, NOW(), NOW())
            ON CONFLICT (user_id, asset, account_type)
            DO UPDATE SET 
                balance = EXCLUDED.balance,
                exchange = EXCLUDED.exchange,
                updated_at = NOW()
            RETURNING id
        `;
        
        const result = await pool.query(query, [userId, asset, amount, exchange]);
        console.log(`   💾 Salvo no banco: ID ${result.rows[0].id}`);
        
    } catch (error) {
        console.log(`   ❌ Erro ao salvar: ${error.message}`);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    coletarSaldosCorrigido().finally(() => {
        pool.end();
    });
}

module.exports = { coletarSaldosCorrigido };
