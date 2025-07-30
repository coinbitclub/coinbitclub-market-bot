/**
 * 🚀 SISTEMA DE TRADING MULTIUSUÁRIO - TEMPO REAL
 * 
 * Sistema completo para múltiplos usuários operando simultaneamente
 * com validação de chaves, prevenção de truncamento e trading automático
 */

const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🚀 SISTEMA DE TRADING MULTIUSUÁRIO - TEMPO REAL');
console.log('===============================================');

class TradingMultiuser {
    constructor() {
        this.activeUsers = new Map();
        this.tradingInterval = null;
        this.monitoringInterval = null;
    }

    // 1. VALIDAÇÃO E INSERÇÃO SEGURA DE CHAVES
    async adicionarChaveSegura(userId, exchange, apiKey, secretKey, environment = 'mainnet') {
        try {
            console.log(`🔐 Adicionando chave para usuário ${userId}...`);
            
            // Validar tamanhos mínimos
            const validacao = this.validarTamanhoChaves(exchange, apiKey, secretKey);
            if (!validacao.valida) {
                throw new Error(`Chave inválida: ${validacao.erro}`);
            }
            
            // Testar chave antes de salvar
            const teste = await this.testarChaveExchange(apiKey, secretKey, exchange, environment);
            if (!teste.success) {
                throw new Error(`Chave não funciona: ${teste.error}`);
            }
            
            // Inserir com validação de tamanho
            const query = `
                INSERT INTO user_api_keys (
                    user_id, 
                    exchange, 
                    api_key, 
                    secret_key, 
                    environment, 
                    is_active, 
                    validation_status,
                    created_at,
                    updated_at
                ) VALUES ($1, $2, $3, $4, $5, true, 'valid', NOW(), NOW())
                ON CONFLICT (user_id, exchange, environment) 
                DO UPDATE SET 
                    api_key = EXCLUDED.api_key,
                    secret_key = EXCLUDED.secret_key,
                    validation_status = 'valid',
                    updated_at = NOW()
                RETURNING id
            `;
            
            const result = await pool.query(query, [
                userId, 
                exchange, 
                apiKey, 
                secretKey, 
                environment
            ]);
            
            console.log(`✅ Chave adicionada com ID: ${result.rows[0].id}`);
            return { success: true, keyId: result.rows[0].id };
            
        } catch (error) {
            console.error(`❌ Erro ao adicionar chave: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    // 2. VALIDAÇÃO DE TAMANHOS
    validarTamanhoChaves(exchange, apiKey, secretKey) {
        const requisitos = {
            'bybit': { apiMin: 18, apiMax: 64, secretMin: 36, secretMax: 128 },
            'binance': { apiMin: 60, apiMax: 70, secretMin: 60, secretMax: 70 }
        };
        
        const req = requisitos[exchange];
        if (!req) {
            return { valida: false, erro: 'Exchange não suportada' };
        }
        
        if (apiKey.length < req.apiMin || apiKey.length > req.apiMax) {
            return { 
                valida: false, 
                erro: `API Key ${exchange} deve ter ${req.apiMin}-${req.apiMax} caracteres, tem ${apiKey.length}` 
            };
        }
        
        if (secretKey.length < req.secretMin || secretKey.length > req.secretMax) {
            return { 
                valida: false, 
                erro: `Secret Key ${exchange} deve ter ${req.secretMin}-${req.secretMax} caracteres, tem ${secretKey.length}` 
            };
        }
        
        return { valida: true };
    }

    // 3. TESTE DE CHAVES POR EXCHANGE
    async testarChaveExchange(apiKey, secretKey, exchange, environment) {
        switch (exchange.toLowerCase()) {
            case 'bybit':
                return await this.testarChaveBybit(apiKey, secretKey, environment);
            case 'binance':
                return await this.testarChaveBinance(apiKey, secretKey, environment);
            default:
                return { success: false, error: 'Exchange não suportada' };
        }
    }

    // 4. TESTE BYBIT
    async testarChaveBybit(apiKey, secretKey, environment) {
        try {
            const baseUrl = environment === 'testnet' ? 
                'https://api-testnet.bybit.com' : 
                'https://api.bybit.com';
            
            const timestamp = Date.now().toString();
            const recvWindow = '5000';
            const query = 'accountType=UNIFIED';
            
            const signPayload = timestamp + apiKey + recvWindow + query;
            const signature = crypto.createHmac('sha256', secretKey).update(signPayload).digest('hex');
            
            const headers = {
                'Content-Type': 'application/json',
                'X-BAPI-API-KEY': apiKey,
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
            
            if (data.retCode === 0) {
                return { success: true, data: data };
            } else {
                return { success: false, error: data.retMsg };
            }
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // 5. TESTE BINANCE
    async testarChaveBinance(apiKey, secretKey, environment) {
        try {
            const baseUrl = environment === 'testnet' ? 
                'https://testnet.binance.vision' : 
                'https://api.binance.com';
            
            const timestamp = Date.now();
            const recvWindow = 5000;
            
            const queryString = `timestamp=${timestamp}&recvWindow=${recvWindow}`;
            const signature = crypto.createHmac('sha256', secretKey).update(queryString).digest('hex');
            
            const headers = {
                'X-MBX-APIKEY': apiKey,
                'Content-Type': 'application/json'
            };
            
            const response = await fetch(`${baseUrl}/api/v3/account?${queryString}&signature=${signature}`, {
                method: 'GET',
                headers: headers
            });
            
            if (response.ok) {
                const data = await response.json();
                return { success: true, data: data };
            } else {
                const errorData = await response.json();
                return { success: false, error: errorData.msg };
            }
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // 6. CARREGAR TODOS OS USUÁRIOS ATIVOS
    async carregarUsuariosAtivos() {
        try {
            const query = `
                SELECT 
                    u.id as user_id,
                    u.name,
                    u.email,
                    uak.id as key_id,
                    uak.api_key,
                    uak.secret_key,
                    uak.exchange,
                    uak.environment,
                    uak.validation_status
                FROM user_api_keys uak
                JOIN users u ON uak.user_id = u.id
                WHERE uak.is_active = true 
                AND uak.validation_status = 'valid'
                ORDER BY u.name, uak.exchange
            `;
            
            const result = await pool.query(query);
            
            console.log(`📊 ${result.rows.length} usuário(s) ativo(s) carregado(s):`);
            
            // Organizar por usuário
            const usuarios = {};
            for (const row of result.rows) {
                if (!usuarios[row.user_id]) {
                    usuarios[row.user_id] = {
                        id: row.user_id,
                        name: row.name,
                        email: row.email,
                        chaves: {}
                    };
                }
                
                usuarios[row.user_id].chaves[row.exchange] = {
                    keyId: row.key_id,
                    apiKey: row.api_key,
                    secretKey: row.secret_key,
                    environment: row.environment
                };
                
                console.log(`   👤 ${row.name}: ${row.exchange} (${row.environment})`);
            }
            
            this.activeUsers = new Map(Object.entries(usuarios));
            return { success: true, usuarios: usuarios };
            
        } catch (error) {
            console.error(`❌ Erro ao carregar usuários: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    // 7. MONITORAMENTO EM TEMPO REAL
    async iniciarMonitoramento() {
        console.log('\n📊 INICIANDO MONITORAMENTO EM TEMPO REAL...');
        
        this.monitoringInterval = setInterval(async () => {
            try {
                console.log(`\n⏰ ${new Date().toLocaleTimeString()} - VERIFICAÇÃO MULTIUSUÁRIO`);
                console.log('='.repeat(50));
                
                for (const [userId, usuario] of this.activeUsers) {
                    console.log(`\n👤 ${usuario.name}:`);
                    
                    // Verificar cada exchange do usuário
                    for (const [exchange, chave] of Object.entries(usuario.chaves)) {
                        if (exchange === 'bybit') {
                            await this.monitorarBybit(usuario.name, chave);
                        } else if (exchange === 'binance') {
                            await this.monitorarBinance(usuario.name, chave);
                        }
                    }
                }
                
            } catch (error) {
                console.error('❌ Erro no monitoramento:', error.message);
            }
        }, 10000); // A cada 10 segundos
    }

    // 8. MONITORAR BYBIT
    async monitorarBybit(nomeUsuario, chave) {
        try {
            const saldo = await this.obterSaldoBybit(chave);
            const posicoes = await this.obterPosicoesBybit(chave);
            
            if (saldo.success) {
                console.log(`   🏦 Bybit - Saldo: $${saldo.totalEquity.toFixed(2)}`);
            }
            
            if (posicoes.success && posicoes.positions.length > 0) {
                const positionsActive = posicoes.positions.filter(p => parseFloat(p.size) > 0);
                if (positionsActive.length > 0) {
                    console.log(`   📈 Bybit - ${positionsActive.length} posição(ões) ativa(s)`);
                    positionsActive.forEach(pos => {
                        const pnl = parseFloat(pos.unrealisedPnl);
                        const emoji = pnl >= 0 ? '📈' : '📉';
                        console.log(`      ${emoji} ${pos.symbol}: ${pos.side} ${pos.size} | PnL: $${pos.unrealisedPnl}`);
                    });
                }
            }
            
        } catch (error) {
            console.log(`   ❌ Bybit error: ${error.message}`);
        }
    }

    // 9. MONITORAR BINANCE
    async monitorarBinance(nomeUsuario, chave) {
        try {
            const teste = await this.testarChaveBinance(chave.apiKey, chave.secretKey, chave.environment);
            
            if (teste.success) {
                console.log(`   🟡 Binance - Conta ativa`);
                
                if (teste.data.balances) {
                    const saldosPositivos = teste.data.balances.filter(b => parseFloat(b.free) > 0);
                    if (saldosPositivos.length > 0) {
                        console.log(`   💰 Binance - ${saldosPositivos.length} moeda(s) com saldo`);
                    }
                }
            } else {
                console.log(`   ❌ Binance - ${teste.error}`);
            }
            
        } catch (error) {
            console.log(`   ❌ Binance error: ${error.message}`);
        }
    }

    // 10. OBTER SALDO BYBIT
    async obterSaldoBybit(chave) {
        try {
            const baseUrl = chave.environment === 'testnet' ? 
                'https://api-testnet.bybit.com' : 
                'https://api.bybit.com';
            
            const timestamp = Date.now().toString();
            const recvWindow = '5000';
            const query = 'accountType=UNIFIED';
            
            const signPayload = timestamp + chave.apiKey + recvWindow + query;
            const signature = crypto.createHmac('sha256', chave.secretKey).update(signPayload).digest('hex');
            
            const headers = {
                'Content-Type': 'application/json',
                'X-BAPI-API-KEY': chave.apiKey,
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
                    availableBalance: parseFloat(account.totalAvailableBalance)
                };
            } else {
                return { success: false, error: data.retMsg };
            }
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // 11. OBTER POSIÇÕES BYBIT
    async obterPosicoesBybit(chave) {
        try {
            const baseUrl = chave.environment === 'testnet' ? 
                'https://api-testnet.bybit.com' : 
                'https://api.bybit.com';
            
            const timestamp = Date.now().toString();
            const recvWindow = '5000';
            const query = 'category=linear&settleCoin=USDT';
            
            const signPayload = timestamp + chave.apiKey + recvWindow + query;
            const signature = crypto.createHmac('sha256', chave.secretKey).update(signPayload).digest('hex');
            
            const headers = {
                'Content-Type': 'application/json',
                'X-BAPI-API-KEY': chave.apiKey,
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
            
            if (data.retCode === 0) {
                return { success: true, positions: data.result.list };
            } else {
                return { success: false, error: data.retMsg };
            }
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // 12. PARAR SISTEMA
    pararSistema() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            console.log('⏹️  Sistema de monitoramento parado');
        }
        if (this.tradingInterval) {
            clearInterval(this.tradingInterval);
            console.log('⏹️  Sistema de trading parado');
        }
    }
}

// 13. INICIALIZAÇÃO DO SISTEMA
async function iniciarSistemaMultiusuario() {
    const sistema = new TradingMultiuser();
    
    try {
        console.log('\n🚀 INICIALIZANDO SISTEMA MULTIUSUÁRIO...');
        
        // Carregar usuários ativos
        const usuarios = await sistema.carregarUsuariosAtivos();
        
        if (!usuarios.success) {
            console.log('❌ Falha ao carregar usuários');
            return;
        }
        
        if (sistema.activeUsers.size === 0) {
            console.log('⚠️  Nenhum usuário ativo encontrado');
            console.log('💡 Adicione chaves com: sistema.adicionarChaveSegura(userId, exchange, apiKey, secretKey)');
            return;
        }
        
        // Iniciar monitoramento
        await sistema.iniciarMonitoramento();
        
        console.log('\n✅ SISTEMA OPERACIONAL!');
        console.log('Press Ctrl+C para parar...');
        
        // Capturar Ctrl+C para parar graciosamente
        process.on('SIGINT', () => {
            console.log('\n🛑 Parando sistema...');
            sistema.pararSistema();
            pool.end();
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Erro fatal:', error.message);
        await pool.end();
    }
}

// Executar sistema
iniciarSistemaMultiusuario();
