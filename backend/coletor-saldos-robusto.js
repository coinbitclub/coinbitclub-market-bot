#!/usr/bin/env node

console.log('💰 COLETOR DE SALDOS ROBUSTO - API ENDPOINTS CORRIGIDOS');
console.log('======================================================');

require('dotenv').config();
const { Pool } = require('pg');
const axios = require('axios');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

class RobustBalanceCollector {
    constructor() {
        this.isRunning = false;
        this.intervalId = null;
        this.collectCount = 0;
        
        // URLs corrigidas das exchanges
        this.exchangeUrls = {
            binance: {
                testnet: 'https://testnet.binance.vision/api/v3',
                mainnet: 'https://api.binance.com/api/v3'
            },
            bybit: {
                testnet: 'https://api-testnet.bybit.com',
                mainnet: 'https://api.bybit.com'
            }
        };
    }

    // Coletar saldo Bybit com endpoints V5 atualizados
    async getBybitBalanceV5(apiKey, apiSecret, environment = 'mainnet') {
        try {
            const baseUrl = this.exchangeUrls.bybit[environment];
            const timestamp = Date.now().toString();
            
            console.log(`      🌐 Conectando: ${baseUrl} (API V5)`);
            
            // Bybit V5 API - Endpoint atualizado
            const endpoint = '/v5/account/wallet-balance';
            const params = `timestamp=${timestamp}&recv_window=5000`;
            
            // Criar assinatura V5
            const signature = crypto.createHmac('sha256', apiSecret)
                .update(timestamp + apiKey + '5000' + params)
                .digest('hex');
            
            const response = await axios.get(`${baseUrl}${endpoint}?${params}`, {
                headers: {
                    'X-BAPI-API-KEY': apiKey,
                    'X-BAPI-SIGN': signature,
                    'X-BAPI-TIMESTAMP': timestamp,
                    'X-BAPI-RECV-WINDOW': '5000'
                },
                timeout: 15000
            });

            if (response.data.retCode === 0) {
                const result = response.data.result;
                let totalUSDT = 0;
                let assetsFound = 0;
                
                console.log(`         📊 Resposta API: ${JSON.stringify(result).substring(0, 200)}...`);
                
                // Processar diferentes formatos de resposta
                if (result.list && Array.isArray(result.list)) {
                    for (const account of result.list) {
                        if (account.coin && Array.isArray(account.coin)) {
                            for (const coin of account.coin) {
                                if (coin.coin === 'USDT') {
                                    const balance = parseFloat(coin.walletBalance || coin.equity || 0);
                                    totalUSDT += balance;
                                    assetsFound++;
                                    console.log(`         💰 ${coin.coin}: ${balance.toFixed(4)}`);
                                }
                            }
                        }
                    }
                }
                
                console.log(`      ✅ Bybit V5 (${environment}): $${totalUSDT.toFixed(2)} USDT (${assetsFound} assets)`);
                return totalUSDT;
            } else {
                console.log(`      ❌ Bybit V5 Error: ${response.data.retMsg || 'Erro desconhecido'}`);
                return 0;
            }

        } catch (error) {
            const errorMsg = error.response?.data?.retMsg || error.message;
            console.log(`      ❌ Bybit V5 (${environment}): ${errorMsg}`);
            return 0;
        }
    }

    // Fallback: Bybit V2 (legado)
    async getBybitBalanceV2(apiKey, apiSecret, environment = 'mainnet') {
        try {
            const baseUrl = this.exchangeUrls.bybit[environment];
            const timestamp = Date.now().toString();
            
            console.log(`      🔄 Tentando Bybit V2 como fallback...`);
            
            const params = {
                api_key: apiKey,
                timestamp: timestamp,
                recv_window: '5000'
            };

            // Criar query string
            const queryString = Object.keys(params).sort().map(key => `${key}=${params[key]}`).join('&');
            const signature = crypto.createHmac('sha256', apiSecret).update(queryString).digest('hex');
            params.sign = signature;

            const response = await axios.get(`${baseUrl}/v2/private/wallet/balance`, {
                params: params,
                timeout: 15000
            });

            if (response.data.ret_code === 0) {
                const result = response.data.result;
                let totalUSDT = 0;
                
                if (result.USDT) {
                    totalUSDT = parseFloat(result.USDT.wallet_balance || 0);
                    console.log(`         💰 USDT: ${totalUSDT.toFixed(4)}`);
                }
                
                console.log(`      ✅ Bybit V2 (${environment}): $${totalUSDT.toFixed(2)} USDT`);
                return totalUSDT;
            } else {
                console.log(`      ❌ Bybit V2 Error: ${response.data.ret_msg || 'Erro desconhecido'}`);
                return 0;
            }

        } catch (error) {
            const errorMsg = error.response?.data?.ret_msg || error.message;
            console.log(`      ❌ Bybit V2 (${environment}): ${errorMsg}`);
            return 0;
        }
    }

    // Método principal para Bybit (tenta V5, depois V2)
    async getBybitBalance(apiKey, apiSecret, environment = 'mainnet') {
        console.log(`      📡 Testando endpoints Bybit...`);
        
        // Primeiro tenta V5
        const v5Balance = await this.getBybitBalanceV5(apiKey, apiSecret, environment);
        if (v5Balance > 0) {
            return v5Balance;
        }
        
        // Se V5 falhar, tenta V2
        const v2Balance = await this.getBybitBalanceV2(apiKey, apiSecret, environment);
        return v2Balance;
    }

    // Coletar saldo Binance (mantido)
    async getBinanceBalance(apiKey, apiSecret, environment = 'testnet') {
        try {
            const baseUrl = this.exchangeUrls.binance[environment];
            const timestamp = Date.now();
            const queryString = `timestamp=${timestamp}`;
            const signature = crypto.createHmac('sha256', apiSecret).update(queryString).digest('hex');
            
            console.log(`      🌐 Conectando: ${baseUrl}`);
            
            const response = await axios.get(`${baseUrl}/account`, {
                headers: {
                    'X-MBX-APIKEY': apiKey
                },
                params: {
                    timestamp,
                    signature
                },
                timeout: 15000
            });

            let totalUSDT = 0;
            let assetsCount = 0;
            
            for (const balance of response.data.balances) {
                const free = parseFloat(balance.free);
                const locked = parseFloat(balance.locked);
                const total = free + locked;
                
                if (total > 0) {
                    assetsCount++;
                    if (balance.asset === 'USDT' || balance.asset === 'BUSD') {
                        totalUSDT += total;
                        console.log(`         💰 ${balance.asset}: ${total.toFixed(4)}`);
                    }
                }
            }

            console.log(`      ✅ Binance (${environment}): $${totalUSDT.toFixed(2)} USDT (${assetsCount} assets)`);
            return totalUSDT;

        } catch (error) {
            const errorMsg = error.response?.data?.msg || error.message;
            console.log(`      ❌ Binance (${environment}): ${errorMsg}`);
            return 0;
        }
    }

    // Coletar saldos de todos os usuários
    async collectAllBalances() {
        this.collectCount++;
        
        console.log(`\n🔄 COLETA #${this.collectCount} - ${new Date().toLocaleString('pt-BR')}`);
        console.log('==================================================');

        try {
            // Buscar configurações de API (query segura)
            const apiConfigs = await pool.query(`
                SELECT u.id, u.username, u.email,
                       uak.api_key, uak.secret_key, uak.exchange, uak.environment
                FROM users u
                INNER JOIN user_api_keys uak ON u.id = uak.user_id
                WHERE uak.api_key IS NOT NULL 
                AND uak.secret_key IS NOT NULL
                ORDER BY u.id
            `);

            console.log(`💰 Coletando saldos de ${apiConfigs.rows.length} configurações...`);

            const results = [];

            for (const config of apiConfigs.rows) {
                console.log(`\n👤 USUÁRIO ${config.id} (${config.username}) - ${config.exchange.toUpperCase()}:`);
                
                let balance = 0;
                const environment = config.environment || 'mainnet';

                if (config.exchange === 'binance') {
                    balance = await this.getBinanceBalance(config.api_key, config.secret_key, environment);
                } else if (config.exchange === 'bybit') {
                    balance = await this.getBybitBalance(config.api_key, config.secret_key, environment);
                } else {
                    console.log(`      ⚠️ Exchange ${config.exchange} não suportada`);
                    continue;
                }

                // Salvar no banco
                try {
                    await pool.query(`
                        INSERT INTO balances (user_id, exchange, balance, currency, created_at)
                        VALUES ($1, $2, $3, 'USDT', NOW())
                        ON CONFLICT (user_id, exchange)
                        DO UPDATE SET balance = $3, updated_at = NOW()
                    `, [config.id, config.exchange, balance]);
                    
                    console.log(`      💾 Salvo no banco: $${balance.toFixed(2)}`);
                    
                    results.push({
                        userId: config.id,
                        username: config.username,
                        exchange: config.exchange,
                        balance: balance
                    });
                    
                } catch (dbError) {
                    console.log(`      ❌ Erro ao salvar no banco: ${dbError.message}`);
                }
            }

            console.log(`\n📊 RESUMO DA COLETA:`);
            console.log('===================');
            results.forEach(r => {
                console.log(`ID ${r.userId} (${r.username}) - ${r.exchange}: $${r.balance.toFixed(2)} (${r.balance > 0 ? 'mainnet' : 'mainnet'})`);
            });

            return results;

        } catch (error) {
            console.error('❌ Erro na coleta automática:', error.message);
            return [];
        }
    }

    // Iniciar coleta automática
    start() {
        if (this.isRunning) {
            console.log('⚠️ Coletor já está rodando');
            return;
        }

        console.log('🚀 Iniciando coletor automático de saldos...');
        console.log('⏰ Intervalo: 2 minutos');
        console.log('👥 Usuários: Todos com chaves API válidas');
        console.log('🔑 Fonte: Banco de dados (user_api_keys)\n');

        this.isRunning = true;
        
        // Executar primeira coleta imediatamente
        this.collectAllBalances();
        
        // Agendar coletas automáticas a cada 2 minutos
        this.intervalId = setInterval(() => {
            this.collectAllBalances();
        }, 2 * 60 * 1000);

        console.log('✅ Coletor automático iniciado!');
    }

    // Parar coleta automática
    stop() {
        if (!this.isRunning) {
            console.log('⚠️ Coletor não está rodando');
            return;
        }

        console.log('🛑 Parando coletor automático...');
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        this.isRunning = false;
        console.log('✅ Coletor automático parado');
    }

    // Status do coletor
    getStatus() {
        return {
            isRunning: this.isRunning,
            collectCount: this.collectCount,
            nextCollection: this.isRunning ? new Date(Date.now() + 2 * 60 * 1000) : null
        };
    }
}

// Exportar para uso em outros módulos
module.exports = RobustBalanceCollector;

// Executar se chamado diretamente
if (require.main === module) {
    const collector = new RobustBalanceCollector();
    collector.start();
    
    // Parar com Ctrl+C
    process.on('SIGINT', () => {
        console.log('\n🛑 Recebido sinal de parada...');
        collector.stop();
        process.exit(0);
    });
}
