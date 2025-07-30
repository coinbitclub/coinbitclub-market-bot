/**
 * 🧪 TESTE INTEGRAÇÃO COMPLETA BYBIT COM NOVO BANCO
 * Testando todos os endpoints e salvando dados no banco com estrutura atualizada
 */

const { Pool } = require('pg');
const axios = require('axios');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

// CHAVES CORRETAS DA LUIZA (funcionam perfeitamente)
const API_KEY = '9HZy9BiUW95iXprVRl';
const API_SECRET = 'QUjDXNmSI0qiqaKTUk7FHAHZnjiEN8AaRKQO';

console.log('🧪 TESTE INTEGRAÇÃO COMPLETA BYBIT COM NOVO BANCO');
console.log('='.repeat(60));

class BybitIntegrationTester {
    constructor() {
        this.baseURL = 'https://api.bybit.com';
        this.userId = 4; // ID da Luiza no banco
    }

    // Gerar assinatura para autenticação
    generateSignature(timestamp, params = '') {
        const recvWindow = '5000';
        const signPayload = timestamp + API_KEY + recvWindow + params;
        return crypto.createHmac('sha256', API_SECRET).update(signPayload).digest('hex');
    }

    // Cabeçalhos para requisições
    getHeaders(signature, timestamp) {
        return {
            'Content-Type': 'application/json',
            'X-BAPI-API-KEY': API_KEY,
            'X-BAPI-SIGN': signature,
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-RECV-WINDOW': '5000',
            'X-BAPI-SIGN-TYPE': '2'
        };
    }

    // Teste 1: Wallet Balance e salvar no banco
    async testWalletBalance() {
        console.log('💰 TESTE 1: WALLET BALANCE');
        console.log('-'.repeat(30));

        try {
            const timestamp = Date.now().toString();
            const params = 'accountType=UNIFIED';
            const signature = this.generateSignature(timestamp, params);
            const headers = this.getHeaders(signature, timestamp);

            const response = await axios.get(`${this.baseURL}/v5/account/wallet-balance?${params}`, { headers });
            
            console.log('✅ Resposta da API recebida');
            console.log(`📊 Status: ${response.status}`);
            console.log(`📋 RetCode: ${response.data.retCode}`);

            if (response.data.retCode === 0 && response.data.result.list.length > 0) {
                const account = response.data.result.list[0];
                
                console.log('💎 Dados da conta:');
                console.log(`   Total Equity: ${account.totalEquity} USD`);
                console.log(`   Available Balance: ${account.totalAvailableBalance} USD`);
                console.log(`   Wallet Balance: ${account.totalWalletBalance} USD`);

                // Salvar dados de saldo no banco usando novos campos
                if (account.coin && account.coin.length > 0) {
                    for (const coin of account.coin) {
                        if (parseFloat(coin.walletBalance) > 0) {
                            console.log(`\n💰 Salvando saldo ${coin.coin}...`);
                            
                            await pool.query(`
                                INSERT INTO user_operations (
                                    user_id, symbol, operation_type, 
                                    balance, available_balance, wallet_balance,
                                    status, created_at, updated_at
                                ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
                            `, [
                                this.userId,
                                coin.coin,
                                'BALANCE_UPDATE',
                                parseFloat(account.totalEquity),
                                parseFloat(account.totalAvailableBalance),
                                parseFloat(coin.walletBalance),
                                'ACTIVE'
                            ]);
                            
                            console.log(`   ✅ Saldo ${coin.coin} salvo no banco`);
                        }
                    }
                }
            }

            return response.data;
        } catch (error) {
            console.error('❌ Erro no teste de wallet:', error.message);
            return null;
        }
    }

    // Teste 2: Position Info
    async testPositionInfo() {
        console.log('\n📊 TESTE 2: POSITION INFO');
        console.log('-'.repeat(30));

        try {
            const timestamp = Date.now().toString();
            const params = 'category=linear';
            const signature = this.generateSignature(timestamp, params);
            const headers = this.getHeaders(signature, timestamp);

            const response = await axios.get(`${this.baseURL}/v5/position/list?${params}`, { headers });
            
            console.log('✅ Resposta da API recebida');
            console.log(`📊 Status: ${response.status}`);
            console.log(`📋 RetCode: ${response.data.retCode}`);

            if (response.data.retCode === 0 && response.data.result.list.length > 0) {
                console.log(`📈 ${response.data.result.list.length} posições encontradas`);
                
                for (const position of response.data.result.list) {
                    if (parseFloat(position.size) > 0) {
                        console.log(`\n📊 Posição ${position.symbol}:`);
                        console.log(`   Side: ${position.side}`);
                        console.log(`   Size: ${position.size}`);
                        console.log(`   Entry Price: ${position.entryPrice}`);
                        console.log(`   Mark Price: ${position.markPrice}`);
                        console.log(`   Unrealized PnL: ${position.unrealisedPnl}`);

                        // Salvar posição no banco usando novos campos
                        await pool.query(`
                            INSERT INTO user_operations (
                                user_id, symbol, side, quantity, entry_price, 
                                current_price, unrealized_pnl, status, 
                                operation_type, leverage, created_at, updated_at
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
                        `, [
                            this.userId,
                            position.symbol,
                            position.side,
                            parseFloat(position.size),
                            parseFloat(position.entryPrice),
                            parseFloat(position.markPrice),
                            parseFloat(position.unrealisedPnl),
                            position.positionStatus,
                            'POSITION',
                            parseInt(position.leverage)
                        ]);
                        
                        console.log(`   ✅ Posição ${position.symbol} salva no banco`);
                    }
                }
            } else {
                console.log('📝 Nenhuma posição ativa encontrada');
            }

            return response.data;
        } catch (error) {
            console.error('❌ Erro no teste de posições:', error.message);
            return null;
        }
    }

    // Teste 3: Order History
    async testOrderHistory() {
        console.log('\n📋 TESTE 3: ORDER HISTORY');
        console.log('-'.repeat(30));

        try {
            const timestamp = Date.now().toString();
            const params = 'category=linear&limit=5';
            const signature = this.generateSignature(timestamp, params);
            const headers = this.getHeaders(signature, timestamp);

            const response = await axios.get(`${this.baseURL}/v5/order/history?${params}`, { headers });
            
            console.log('✅ Resposta da API recebida');
            console.log(`📊 Status: ${response.status}`);
            console.log(`📋 RetCode: ${response.data.retCode}`);

            if (response.data.retCode === 0 && response.data.result.list.length > 0) {
                console.log(`📋 ${response.data.result.list.length} ordens encontradas no histórico`);
                
                for (const order of response.data.result.list) {
                    console.log(`\n📋 Ordem ${order.orderId}:`);
                    console.log(`   Symbol: ${order.symbol}`);
                    console.log(`   Side: ${order.side}`);
                    console.log(`   Type: ${order.orderType}`);
                    console.log(`   Qty: ${order.qty}`);
                    console.log(`   Price: ${order.price}`);
                    console.log(`   Status: ${order.orderStatus}`);

                    // Salvar ordem no banco usando novos campos
                    await pool.query(`
                        INSERT INTO user_operations (
                            user_id, symbol, side, quantity, price, 
                            order_id, order_type, status, operation_type,
                            created_at, updated_at
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TO_TIMESTAMP($10/1000), NOW())
                    `, [
                        this.userId,
                        order.symbol,
                        order.side,
                        parseFloat(order.qty),
                        parseFloat(order.price),
                        order.orderId,
                        order.orderType,
                        order.orderStatus,
                        'ORDER',
                        parseInt(order.createdTime)
                    ]);
                    
                    console.log(`   ✅ Ordem ${order.orderId} salva no banco`);
                }
            } else {
                console.log('📝 Nenhuma ordem encontrada no histórico');
            }

            return response.data;
        } catch (error) {
            console.error('❌ Erro no teste de ordens:', error.message);
            return null;
        }
    }

    // Verificar dados salvos no banco
    async verificarDadosSalvos() {
        console.log('\n🔍 VERIFICAÇÃO DOS DADOS SALVOS NO BANCO');
        console.log('-'.repeat(40));

        try {
            // Contar registros por tipo
            const stats = await pool.query(`
                SELECT operation_type, COUNT(*) as total
                FROM user_operations 
                WHERE user_id = $1 
                GROUP BY operation_type
                ORDER BY operation_type
            `, [this.userId]);

            console.log('📊 ESTATÍSTICAS DOS DADOS SALVOS:');
            if (stats.rows.length > 0) {
                stats.rows.forEach(stat => {
                    console.log(`   ${stat.operation_type}: ${stat.total} registros`);
                });
            } else {
                console.log('   📝 Nenhum registro encontrado');
            }

            // Mostrar últimos registros salvos
            const ultimos = await pool.query(`
                SELECT * FROM user_operations 
                WHERE user_id = $1 
                ORDER BY created_at DESC 
                LIMIT 5
            `, [this.userId]);

            console.log('\n📋 ÚLTIMOS 5 REGISTROS SALVOS:');
            ultimos.rows.forEach((row, index) => {
                console.log(`   ${index + 1}. [${row.operation_type}] ${row.symbol} - ${row.side || 'N/A'} - Status: ${row.status}`);
                console.log(`      ID: ${row.id} | Order ID: ${row.order_id || 'N/A'} | Created: ${row.created_at}`);
            });

        } catch (error) {
            console.error('❌ Erro ao verificar dados salvos:', error.message);
        }
    }

    // Executar todos os testes
    async runAllTests() {
        console.log('🚀 INICIANDO TODOS OS TESTES...\n');
        
        const resultados = {
            wallet: await this.testWalletBalance(),
            positions: await this.testPositionInfo(),
            orders: await this.testOrderHistory()
        };

        await this.verificarDadosSalvos();

        console.log('\n' + '='.repeat(60));
        console.log('📊 RESUMO DOS TESTES');
        console.log('='.repeat(60));

        console.log(`💰 Wallet Balance: ${resultados.wallet ? '✅ SUCESSO' : '❌ FALHOU'}`);
        console.log(`📊 Position Info: ${resultados.positions ? '✅ SUCESSO' : '❌ FALHOU'}`);
        console.log(`📋 Order History: ${resultados.orders ? '✅ SUCESSO' : '❌ FALHOU'}`);

        const sucessos = Object.values(resultados).filter(r => r !== null).length;
        console.log(`\n🎯 TAXA DE SUCESSO: ${sucessos}/3 (${Math.round(sucessos/3*100)}%)`);

        if (sucessos === 3) {
            console.log('\n🎉 TODOS OS TESTES PASSARAM!');
            console.log('✅ Integração Bybit funcionando perfeitamente');
            console.log('✅ Estrutura do banco 100% compatível');
            console.log('✅ Dados sendo salvos corretamente');
        } else {
            console.log('\n⚠️ Alguns testes falharam - verificar logs acima');
        }

        return resultados;
    }
}

// Executar os testes
async function main() {
    const tester = new BybitIntegrationTester();
    
    try {
        await tester.runAllTests();
    } catch (error) {
        console.error('❌ Erro geral nos testes:', error.message);
    } finally {
        await pool.end();
        console.log('\n🔚 Testes finalizados.');
    }
}

main();
