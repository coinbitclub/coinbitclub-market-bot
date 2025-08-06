/**
 * 🚀 SISTEMA DE TRADING BYBIT - ABERTURA E FECHAMENTO DE POSIÇÕES
 * 
 * Sistema completo para operar posições na Bybit usando chaves do banco
 */

const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🚀 SISTEMA DE TRADING BYBIT - POSIÇÕES');
console.log('=====================================');

async function sistemaTrading() {
    try {
        console.log('\n📊 1. CARREGANDO CHAVE DA LUIZA:');
        
        const result = await pool.query(`
            SELECT 
                u.name,
                u.email,
                uak.api_key,
                uak.secret_key,
                uak.environment
            FROM user_api_keys uak
            JOIN users u ON uak.user_id = u.id
            WHERE u.name ILIKE '%luiza%' 
            AND uak.exchange = 'bybit'
            AND uak.validation_status = 'valid'
        `);
        
        if (result.rows.length === 0) {
            console.log('❌ Chave válida da Luiza não encontrada!');
            return;
        }
        
        const luiza = result.rows[0];
        console.log(`👤 Trader: ${luiza.name}`);
        console.log(`🔑 API Key: ${luiza.api_key}`);
        console.log(`🌍 Ambiente: ${luiza.environment}`);
        
        // 1. Verificar saldo disponível
        console.log('\n💰 2. VERIFICANDO SALDO DISPONÍVEL:');
        const saldo = await verificarSaldo(luiza);
        
        if (!saldo.success) {
            console.log('❌ Não foi possível verificar saldo');
            return;
        }
        
        console.log(`💵 Saldo Total: ${saldo.totalEquity} USD`);
        console.log(`💳 Disponível: ${saldo.availableBalance} USD`);
        
        // 2. Listar posições atuais
        console.log('\n📈 3. VERIFICANDO POSIÇÕES ATUAIS:');
        await listarPosicoes(luiza);
        
        // 3. Obter preço atual do BTCUSDT
        console.log('\n📊 4. OBTENDO PREÇO ATUAL:');
        const preco = await obterPrecoAtual('BTCUSDT');
        
        if (preco.success) {
            console.log(`₿ BTCUSDT: $${preco.price}`);
        }
        
        // 4. Menu de operações
        console.log('\n🎯 5. OPERAÇÕES DISPONÍVEIS:');
        console.log('============================');
        
        // Demonstração: Abrir posição pequena de teste
        console.log('🔸 Demonstração: Abrindo posição de teste...');
        await demonstracaoTrading(luiza, preco.price);
        
    } catch (error) {
        console.error('❌ Erro no sistema de trading:', error.message);
        console.error(error.stack);
    } finally {
        await pool.end();
    }
}

async function verificarSaldo(chave) {
    try {
        const baseUrl = chave.environment === 'testnet' ? 
            'https://api-testnet.bybit.com' : 
            'https://api.bybit.com';
        
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        const query = 'accountType=UNIFIED';
        
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
        
        const response = await fetch(`${baseUrl}/v5/account/wallet-balance?accountType=UNIFIED`, {
            method: 'GET',
            headers: headers
        });
        
        const data = await response.json();
        
        if (data.retCode === 0 && data.result && data.result.list && data.result.list.length > 0) {
            const account = data.result.list[0];
            return {
                success: true,
                totalEquity: parseFloat(account.totalEquity),
                availableBalance: parseFloat(account.totalAvailableBalance),
                totalWallet: parseFloat(account.totalWalletBalance)
            };
        } else {
            return { success: false, error: data.retMsg };
        }
        
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function listarPosicoes(chave) {
    try {
        const baseUrl = chave.environment === 'testnet' ? 
            'https://api-testnet.bybit.com' : 
            'https://api.bybit.com';
        
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        const query = 'category=linear&settleCoin=USDT';
        
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
        
        const response = await fetch(`${baseUrl}/v5/position/list?category=linear&settleCoin=USDT`, {
            method: 'GET',
            headers: headers
        });
        
        const data = await response.json();
        
        if (data.retCode === 0 && data.result && data.result.list) {
            const positionsWithBalance = data.result.list.filter(pos => 
                parseFloat(pos.size) > 0
            );
            
            if (positionsWithBalance.length > 0) {
                console.log(`📊 ${positionsWithBalance.length} posição(ões) ativa(s):`);
                positionsWithBalance.forEach(pos => {
                    const pnl = parseFloat(pos.unrealisedPnl);
                    const pnlSymbol = pnl >= 0 ? '📈' : '📉';
                    console.log(`   ${pnlSymbol} ${pos.symbol}: ${pos.side} ${pos.size} @ $${pos.avgPrice}`);
                    console.log(`      💰 PnL: $${pos.unrealisedPnl} (${pos.unrealisedPnlPercentage}%)`);
                    console.log(`      💵 Valor: $${pos.positionValue}`);
                });
            } else {
                console.log('📊 Nenhuma posição ativa encontrada');
            }
            
            return { success: true, positions: data.result.list };
        } else {
            console.log(`❌ Erro ao listar posições: ${data.retMsg}`);
            return { success: false, error: data.retMsg };
        }
        
    } catch (error) {
        console.log(`❌ Erro de conexão: ${error.message}`);
        return { success: false, error: error.message };
    }
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
                ask: parseFloat(ticker.ask1Price),
                volume24h: parseFloat(ticker.volume24h)
            };
        } else {
            return { success: false, error: data.retMsg };
        }
        
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function abrirPosicao(chave, symbol, side, qty, orderType = 'Market') {
    try {
        const baseUrl = chave.environment === 'testnet' ? 
            'https://api-testnet.bybit.com' : 
            'https://api.bybit.com';
        
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        
        const params = {
            category: 'linear',
            symbol: symbol,
            side: side,
            orderType: orderType,
            qty: qty.toString(),
            timeInForce: 'IOC' // Immediate or Cancel
        };
        
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
        
        console.log(`📤 Abrindo posição: ${side} ${qty} ${symbol}`);
        console.log(`🔗 URL: ${baseUrl}/v5/order/create`);
        
        const response = await fetch(`${baseUrl}/v5/order/create`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(params)
        });
        
        const data = await response.json();
        
        console.log(`📊 Status: ${response.status}`);
        console.log(`📋 RetCode: ${data.retCode}`);
        console.log(`📋 RetMsg: ${data.retMsg}`);
        
        if (data.retCode === 0) {
            console.log('✅ POSIÇÃO ABERTA COM SUCESSO!');
            console.log(`🆔 Order ID: ${data.result.orderId}`);
            console.log(`🔗 Order Link ID: ${data.result.orderLinkId}`);
            return { success: true, data: data.result };
        } else {
            console.log(`❌ ERRO: ${data.retMsg}`);
            return { success: false, error: data.retMsg };
        }
        
    } catch (error) {
        console.log(`❌ Erro de conexão: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function demonstracaoTrading(chave, precoAtual) {
    console.log('\n🎯 DEMONSTRAÇÃO DE TRADING:');
    console.log('===========================');
    
    // Verificar se há saldo suficiente (mínimo $10)
    const saldo = await verificarSaldo(chave);
    
    if (!saldo.success || saldo.availableBalance < 10) {
        console.log('⚠️  Saldo insuficiente para demonstração (mínimo $10)');
        console.log(`💰 Saldo atual: $${saldo.availableBalance || 0}`);
        return;
    }
    
    console.log('💡 SIMULAÇÃO DE OPERAÇÃO:');
    console.log('=========================');
    console.log('🔸 Par: BTCUSDT');
    console.log('🔸 Tipo: Market Order');
    console.log('🔸 Quantidade: 0.001 BTC (posição pequena de teste)');
    console.log(`🔸 Preço atual: $${precoAtual}`);
    console.log(`🔸 Valor aproximado: $${(0.001 * precoAtual).toFixed(2)}`);
    
    console.log('\n⚠️  IMPORTANTE: Esta é uma DEMONSTRAÇÃO');
    console.log('Para operações reais, implemente:');
    console.log('1. 🛡️  Stop Loss');
    console.log('2. 🎯 Take Profit');
    console.log('3. 📊 Análise técnica');
    console.log('4. 💰 Gestão de risco');
    
    // Comentar esta linha para evitar trades reais acidentais
    // const resultado = await abrirPosicao(chave, 'BTCUSDT', 'Buy', 0.001);
    
    console.log('\n🔒 Trade não executado (modo demonstração)');
    console.log('💡 Descomente a linha para trades reais');
    
    // Exemplo de como fechar posição
    console.log('\n📝 EXEMPLO - FECHAR POSIÇÃO:');
    console.log('Para fechar: abrirPosicao(chave, "BTCUSDT", "Sell", 0.001)');
}

// Menu interativo (futuro)
async function menuTrading() {
    console.log('\n🎮 MENU DE TRADING:');
    console.log('==================');
    console.log('1. 📈 Abrir posição LONG');
    console.log('2. 📉 Abrir posição SHORT');
    console.log('3. 🔒 Fechar posição');
    console.log('4. 📊 Listar posições');
    console.log('5. 💰 Verificar saldo');
    console.log('6. 📈 Obter preços');
    console.log('0. 🚪 Sair');
}

// Executar sistema
sistemaTrading().catch(console.error);
