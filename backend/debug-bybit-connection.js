/**
 * 🔧 TESTE DE CONEXÃO DETALHADO - DEBUG COMPLETO
 * =============================================
 * 
 * Vamos debugar exatamente o que está acontecendo
 */

const crypto = require('crypto');

console.log('🔍 TESTE DETALHADO DE CONEXÃO BYBIT');
console.log('===================================');

async function testeDetalhadoBybit() {
    try {
        // Usar dados que funcionavam antes
        const chave = {
            user_id: 15,
            name: 'Paloma Amaral',
            api_key: 'iGBRNexUa9OwJQqfM1',
            api_secret: 'IcJNBDWqKdePYw6GWwKKx8LH6vWjjGvNNxI0'
        };

        console.log(`👤 Testando: ${chave.name}`);
        console.log(`🔑 API Key: ${chave.api_key}`);
        console.log(`🔐 Secret: ${chave.api_secret.substring(0, 10)}...`);

        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        const queryParams = 'accountType=UNIFIED';
        
        console.log(`⏰ Timestamp: ${timestamp}`);
        console.log(`🏠 RecvWindow: ${recvWindow}`);
        console.log(`🔧 QueryParams: ${queryParams}`);

        const signPayload = timestamp + chave.api_key + recvWindow + queryParams;
        const signature = crypto.createHmac('sha256', chave.api_secret).update(signPayload).digest('hex');

        console.log(`📝 SignPayload: ${signPayload}`);
        console.log(`✍️ Signature: ${signature}`);

        const url = `https://api.bybit.com/v5/account/wallet-balance?${queryParams}`;
        console.log(`🌐 URL Completa: ${url}`);

        const headers = {
            'X-BAPI-API-KEY': chave.api_key,
            'X-BAPI-SIGN': signature,
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-RECV-WINDOW': recvWindow,
            'X-BAPI-SIGN-TYPE': '2'
        };

        console.log('📋 Headers:', headers);

        console.log('\n📡 Fazendo requisição...');
        
        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });

        console.log(`📊 Status: ${response.status}`);
        console.log(`📊 StatusText: ${response.statusText}`);
        console.log(`📊 Headers Response:`, Object.fromEntries(response.headers.entries()));

        const responseText = await response.text();
        console.log(`📄 Response Text Length: ${responseText.length}`);
        console.log(`📄 Response Text: ${responseText.substring(0, 500)}...`);

        if (responseText) {
            try {
                const data = JSON.parse(responseText);
                console.log('✅ JSON Parse OK');
                console.log('📊 Data:', JSON.stringify(data, null, 2));
                
                if (data.retCode === 0) {
                    console.log('✅ API Call Successful!');
                    
                    // Extrair saldo USDT
                    const account = data.result?.list?.[0];
                    if (account && account.coin) {
                        const usdtCoin = account.coin.find(coin => coin.coin === 'USDT');
                        if (usdtCoin) {
                            const balance = parseFloat(usdtCoin.walletBalance) || 0;
                            console.log(`💰 Saldo USDT: $${balance.toFixed(2)}`);
                        } else {
                            console.log('⚠️ USDT coin not found');
                        }
                    } else {
                        console.log('⚠️ Account data not found');
                    }
                } else {
                    console.log(`❌ API Error: ${data.retCode} - ${data.retMsg}`);
                }
                
            } catch (jsonError) {
                console.error('❌ JSON Parse Error:', jsonError.message);
                console.log('📄 Raw response:', responseText);
            }
        } else {
            console.log('❌ Empty response');
        }

    } catch (error) {
        console.error('❌ Request Error:', error.message);
        console.error('🔍 Stack:', error.stack);
    }
}

// Executar teste
testeDetalhadoBybit();
