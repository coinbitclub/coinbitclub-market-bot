/**
 * 🎯 TRADING AVANÇADO - STOP LOSS E TAKE PROFIT
 * 
 * Sistema completo com gestão de risco
 */

const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🎯 SISTEMA DE TRADING AVANÇADO - BYBIT');
console.log('====================================');

async function tradingAvancado() {
    try {
        // Carregar chave da Luiza
        const result = await pool.query(`
            SELECT uak.api_key, uak.secret_key, uak.environment
            FROM user_api_keys uak
            JOIN users u ON uak.user_id = u.id
            WHERE u.name ILIKE '%luiza%' 
            AND uak.exchange = 'bybit'
            AND uak.validation_status = 'valid'
        `);
        
        const luiza = result.rows[0];
        
        console.log('\n🎮 MENU DE TRADING AVANÇADO:');
        console.log('============================');
        console.log('1. 📈 LONG com Stop Loss e Take Profit');
        console.log('2. 📉 SHORT com Stop Loss e Take Profit');
        console.log('3. 🔒 Fechar todas as posições');
        console.log('4. 📊 Monitorar posições em tempo real');
        
        // Demonstração: LONG com SL/TP
        console.log('\n🔥 DEMONSTRAÇÃO: LONG BTC com SL/TP');
        await demonstracaoLongComRisco(luiza);
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

async function abrirPosicaoComRisco(chave, symbol, side, qty, stopLoss, takeProfit) {
    try {
        const baseUrl = chave.environment === 'testnet' ? 
            'https://api-testnet.bybit.com' : 
            'https://api.bybit.com';
        
        // 1. Abrir posição principal
        const posicao = await abrirOrdem(chave, {
            category: 'linear',
            symbol: symbol,
            side: side,
            orderType: 'Market',
            qty: qty.toString(),
            timeInForce: 'IOC'
        });
        
        if (!posicao.success) {
            return { success: false, error: 'Falha ao abrir posição principal' };
        }
        
        console.log('✅ Posição principal aberta!');
        
        // 2. Configurar Stop Loss
        if (stopLoss) {
            const slResult = await configurarStopLoss(chave, symbol, side, qty, stopLoss);
            console.log(slResult.success ? '🛡️ Stop Loss configurado' : '⚠️ Falha no Stop Loss');
        }
        
        // 3. Configurar Take Profit
        if (takeProfit) {
            const tpResult = await configurarTakeProfit(chave, symbol, side, qty, takeProfit);
            console.log(tpResult.success ? '🎯 Take Profit configurado' : '⚠️ Falha no Take Profit');
        }
        
        return { success: true, orderId: posicao.data.orderId };
        
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function abrirOrdem(chave, params) {
    try {
        const baseUrl = chave.environment === 'testnet' ? 
            'https://api-testnet.bybit.com' : 
            'https://api.bybit.com';
        
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        
        const query = Object.entries(params)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join('&');
        
        const signPayload = timestamp + chave.api_key + recvWindow + query;
        const signature = crypto.createHmac('sha256', chave.secret_key).update(signPayload).digest('hex');
        
        const headers = {
            'Content-Type': 'application/json',
            'X-BAPI-API-KEY': chave.api_key,
            'X-BAPI-SIGN': signature,
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-RECV-WINDOW': recvWindow,
            'X-BAPI-SIGN-TYPE': '2'
        };
        
        const response = await fetch(`${baseUrl}/v5/order/create`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(params)
        });
        
        const data = await response.json();
        
        if (data.retCode === 0) {
            return { success: true, data: data.result };
        } else {
            return { success: false, error: data.retMsg };
        }
        
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function configurarStopLoss(chave, symbol, side, qty, stopPrice) {
    const oppositeSign = side === 'Buy' ? 'Sell' : 'Buy';
    
    return await abrirOrdem(chave, {
        category: 'linear',
        symbol: symbol,
        side: oppositeSign,
        orderType: 'Market',
        qty: qty.toString(),
        stopLoss: stopPrice.toString(),
        timeInForce: 'GTC'
    });
}

async function configurarTakeProfit(chave, symbol, side, qty, profitPrice) {
    const oppositeSign = side === 'Buy' ? 'Sell' : 'Buy';
    
    return await abrirOrdem(chave, {
        category: 'linear',
        symbol: symbol,
        side: oppositeSign,
        orderType: 'Limit',
        qty: qty.toString(),
        price: profitPrice.toString(),
        timeInForce: 'GTC'
    });
}

async function demonstracaoLongComRisco(chave) {
    console.log('\n💡 ESTRATÉGIA LONG BTC:');
    console.log('======================');
    
    // Obter preço atual
    const preco = await obterPrecoAtual('BTCUSDT');
    const precoAtual = preco.price;
    
    // Calcular níveis
    const quantidade = 0.001; // $117 aproximadamente
    const stopLoss = precoAtual * 0.98;    // 2% abaixo
    const takeProfit = precoAtual * 1.04;   // 4% acima
    
    console.log(`📊 Preço atual: $${precoAtual.toLocaleString()}`);
    console.log(`📊 Quantidade: ${quantidade} BTC`);
    console.log(`🛡️ Stop Loss: $${stopLoss.toLocaleString()} (-2%)`);
    console.log(`🎯 Take Profit: $${takeProfit.toLocaleString()} (+4%)`);
    console.log(`💰 Valor da posição: $${(quantidade * precoAtual).toFixed(2)}`);
    console.log(`💸 Risco máximo: $${(quantidade * (precoAtual - stopLoss)).toFixed(2)}`);
    console.log(`💰 Lucro potencial: $${(quantidade * (takeProfit - precoAtual)).toFixed(2)}`);
    
    const riskReward = (takeProfit - precoAtual) / (precoAtual - stopLoss);
    console.log(`📊 Risk/Reward: 1:${riskReward.toFixed(2)}`);
    
    console.log('\n🔒 MODO DEMONSTRAÇÃO ATIVO');
    console.log('Para ativar trading real:');
    console.log('const resultado = await abrirPosicaoComRisco(chave, "BTCUSDT", "Buy", 0.001, stopLoss, takeProfit);');
}

async function obterPrecoAtual(symbol) {
    try {
        const response = await fetch(`https://api.bybit.com/v5/market/tickers?category=linear&symbol=${symbol}`);
        const data = await response.json();
        
        if (data.retCode === 0 && data.result && data.result.list && data.result.list.length > 0) {
            const ticker = data.result.list[0];
            return {
                success: true,
                price: parseFloat(ticker.lastPrice),
                bid: parseFloat(ticker.bid1Price),
                ask: parseFloat(ticker.ask1Price)
            };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function monitorarPosicoes(chave) {
    console.log('\n📊 MONITORAMENTO EM TEMPO REAL:');
    console.log('===============================');
    
    setInterval(async () => {
        const posicoes = await listarPosicoes(chave);
        if (posicoes.success && posicoes.positions.length > 0) {
            console.clear();
            console.log('📊 POSIÇÕES ATIVAS:', new Date().toLocaleTimeString());
            posicoes.positions.forEach(pos => {
                if (parseFloat(pos.size) > 0) {
                    const pnl = parseFloat(pos.unrealisedPnl);
                    const emoji = pnl >= 0 ? '📈' : '📉';
                    console.log(`${emoji} ${pos.symbol}: ${pos.side} ${pos.size} | PnL: $${pos.unrealisedPnl}`);
                }
            });
        }
    }, 5000); // Atualizar a cada 5 segundos
}

// Executar
tradingAvancado().catch(console.error);
