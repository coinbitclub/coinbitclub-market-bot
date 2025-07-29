/**
 * 🚨 FECHAR POSIÇÕES ABERTAS - EMERGÊNCIA
 * 
 * Fechar todas as posições da Paloma na Bybit
 */

const axios = require('axios');
const crypto = require('crypto');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function fecharTodasPosicoes() {
    try {
        console.log('🚨 FECHANDO TODAS AS POSIÇÕES ABERTAS');
        console.log('='.repeat(50));
        
        // 1. Buscar chaves da Paloma
        const chavesQuery = `
            SELECT api_key, secret_key 
            FROM user_api_keys 
            WHERE user_id = (SELECT id FROM users WHERE email = 'pamaral15@hotmail.com')
            AND exchange = 'bybit' AND is_active = true;
        `;
        
        const chaves = await pool.query(chavesQuery);
        
        if (chaves.rows.length === 0) {
            console.log('❌ Chaves API não encontradas');
            return;
        }
        
        const { api_key, secret_key } = chaves.rows[0];
        console.log(`✅ Chaves encontradas: ${api_key}`);
        
        // 2. Verificar posições abertas
        console.log('\n🔍 VERIFICANDO POSIÇÕES ABERTAS...');
        const posicoes = await verificarPosicoes(api_key, secret_key);
        
        if (posicoes.length === 0) {
            console.log('✅ Nenhuma posição aberta encontrada');
            return;
        }
        
        console.log(`📊 ${posicoes.length} posição(ões) encontrada(s):`);
        posicoes.forEach((pos, index) => {
            console.log(`   ${index + 1}. ${pos.symbol} - ${pos.side} - Size: ${pos.size} - PnL: ${pos.unrealisedPnl}`);
        });
        
        // 3. Fechar todas as posições
        console.log('\n🔄 FECHANDO POSIÇÕES...');
        for (const posicao of posicoes) {
            try {
                const resultado = await fecharPosicao(api_key, secret_key, posicao);
                console.log(`   ✅ ${posicao.symbol} fechada - Order ID: ${resultado.orderId}`);
            } catch (error) {
                console.log(`   ❌ Erro ao fechar ${posicao.symbol}: ${error.message}`);
            }
        }
        
        // 4. Verificar novamente
        console.log('\n🔍 VERIFICAÇÃO FINAL...');
        const posicoesFinais = await verificarPosicoes(api_key, secret_key);
        
        if (posicoesFinais.length === 0) {
            console.log('✅ TODAS AS POSIÇÕES FORAM FECHADAS COM SUCESSO!');
        } else {
            console.log(`⚠️ Ainda restam ${posicoesFinais.length} posição(ões) abertas`);
        }
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

async function verificarPosicoes(apiKey, secretKey) {
    const timestamp = Date.now().toString();
    const recvWindow = '5000';
    const queryString = 'category=linear&settleCoin=USDT';
    
    const paramStr = timestamp + apiKey + recvWindow + queryString;
    const signature = crypto.createHmac('sha256', secretKey).update(paramStr).digest('hex');
    
    const response = await axios.get('https://api.bybit.com/v5/position/list', {
        headers: {
            'X-BAPI-API-KEY': apiKey,
            'X-BAPI-SIGN': signature,
            'X-BAPI-SIGN-TYPE': '2',
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-RECV-WINDOW': recvWindow
        },
        params: {
            category: 'linear',
            settleCoin: 'USDT'
        }
    });
    
    if (response.data.retCode === 0) {
        // Filtrar apenas posições com size > 0
        return response.data.result.list.filter(pos => parseFloat(pos.size) > 0);
    } else {
        throw new Error(`API Error: ${response.data.retMsg}`);
    }
}

async function fecharPosicao(apiKey, secretKey, posicao) {
    const timestamp = Date.now().toString();
    const recvWindow = '5000';
    
    const orderData = {
        category: 'linear',
        symbol: posicao.symbol,
        side: posicao.side === 'Buy' ? 'Sell' : 'Buy', // Lado oposto para fechar
        orderType: 'Market',
        qty: posicao.size,
        reduceOnly: true,
        timeInForce: 'IOC'
    };
    
    const queryString = Object.keys(orderData)
        .sort()
        .map(key => `${key}=${orderData[key]}`)
        .join('&');
    
    const paramStr = timestamp + apiKey + recvWindow + queryString;
    const signature = crypto.createHmac('sha256', secretKey).update(paramStr).digest('hex');
    
    const response = await axios.post('https://api.bybit.com/v5/order/create', orderData, {
        headers: {
            'X-BAPI-API-KEY': apiKey,
            'X-BAPI-SIGN': signature,
            'X-BAPI-SIGN-TYPE': '2',
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-RECV-WINDOW': recvWindow,
            'Content-Type': 'application/json'
        }
    });
    
    if (response.data.retCode === 0) {
        return response.data.result;
    } else {
        throw new Error(`API Error: ${response.data.retMsg}`);
    }
}

fecharTodasPosicoes();
