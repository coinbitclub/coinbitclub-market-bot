/**
 * 🚀 SISTEMA DE TRADING MULTIUSUÁRIO DINÂMICO - v2.0
 * 
 * Sistema completo com:
 * - Recarregamento dinâmico de usuários
 * - Validação automática de chaves
 * - Trading automático em tempo real
 * - Monitoramento contínuo
 */

const { Pool } = require('pg');
const crypto = require('crypto');
const { DynamicReloader } = require('./dynamic-reloader');
const { AutomaticKeyValidator, autoValidateNewKey } = require('./automatic-key-validator');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🚀 SISTEMA DE TRADING MULTIUSUÁRIO DINÂMICO - v2.0');
console.log('===================================================');

class TradingMultiuserDynamic {
    constructor() {
        this.activeUsers = new Map();
        this.tradingInterval = null;
        this.monitoringInterval = null;
        
        // Sistemas integrados
        this.dynamicReloader = new DynamicReloader();
        this.keyValidator = new AutomaticKeyValidator();
        
        // Estado do sistema
        this.isRunning = false;
        this.stats = {
            totalOperations: 0,
            successfulOperations: 0,
            errors: 0,
            lastReload: null
        };
    }

    /**
     * Inicializa o sistema completo
     */
    async inicializar() {
        try {
            console.log('\n🚀 INICIALIZANDO SISTEMA MULTIUSUÁRIO...');
            
            // 1. Configurar recarregamento dinâmico
            await this.configurarRecarregamentoDinamico();
            
            // 2. Iniciar validação automática
            this.keyValidator.startContinuousMonitoring(3); // 3 minutos
            
            // 3. Carregar usuários iniciais
            await this.carregarUsuariosIniciais();
            
            // 4. Iniciar monitoramento de trading
            this.iniciarMonitoramento();
            
            this.isRunning = true;
            console.log('✅ SISTEMA OPERACIONAL!');
            console.log('Press Ctrl+C para parar...\n');
            
        } catch (error) {
            console.error('❌ Erro na inicialização:', error.message);
            throw error;
        }
    }

    /**
     * Configura sistema de recarregamento dinâmico
     */
    async configurarRecarregamentoDinamico() {
        console.log('🔄 Configurando recarregamento dinâmico...');
        
        // Listener para recarregamento de usuários
        this.dynamicReloader.on('usersReloaded', (data) => {
            console.log(`\n🔔 RECARREGAMENTO DINÂMICO ATIVADO!`);
            console.log(`📊 ${data.users.length} usuário(s) ativo(s) detectado(s)`);
            
            if (data.changes.newUsers.length > 0) {
                console.log(`🆕 Novos usuários: ${data.changes.newUsers.map(u => u.name).join(', ')}`);
            }
            
            if (data.changes.updatedUsers.length > 0) {
                console.log(`🔄 Usuários atualizados: ${data.changes.updatedUsers.map(u => u.name).join(', ')}`);
            }
            
            if (data.changes.removedUsers.length > 0) {
                console.log(`➖ Usuários removidos: ${data.changes.removedUsers.map(u => u.name).join(', ')}`);
            }
            
            // Atualizar cache interno
            this.atualizarUsuariosAtivos(data.users);
            this.stats.lastReload = new Date().toLocaleString('pt-BR');
            
            console.log('✅ Recarregamento concluído!\n');
        });
        
        // Iniciar monitoramento dinâmico (30 segundos)
        this.dynamicReloader.startMonitoring(30);
        
        console.log('✅ Recarregamento dinâmico configurado');
    }

    /**
     * Carrega usuários iniciais
     */
    async carregarUsuariosIniciais() {
        console.log('📊 Carregando usuários iniciais...');
        
        const result = await this.dynamicReloader.checkAndReload();
        
        if (result.users) {
            this.atualizarUsuariosAtivos(result.users);
            console.log(`📊 ${result.users.length} usuário(s) ativo(s) carregado(s):`);
            
            result.users.forEach(user => {
                const primaryKey = user.keys[0];
                if (primaryKey) {
                    console.log(`   👤 ${user.name}: ${primaryKey.exchange} (${primaryKey.environment})`);
                }
            });
        }
    }

    /**
     * Atualiza cache interno de usuários ativos
     */
    atualizarUsuariosAtivos(users) {
        this.activeUsers.clear();
        
        users.forEach(user => {
            // Usar primeira chave válida como primária
            const primaryKey = user.keys.find(k => k.validation_status === 'valid');
            
            if (primaryKey) {
                this.activeUsers.set(user.id, {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    primaryKey: primaryKey,
                    allKeys: user.keys,
                    lastCheck: null,
                    balance: null,
                    status: 'active'
                });
            }
        });
        
        console.log(`💾 Cache atualizado: ${this.activeUsers.size} usuário(s) ativo(s)`);
    }

    /**
     * Adiciona nova chave com validação e recarregamento automático
     */
    async adicionarChaveComValidacaoAutomatica(userId, exchange, apiKey, secretKey, environment = 'mainnet') {
        try {
            console.log(`\n🔐 ADICIONANDO NOVA CHAVE - ${exchange.toUpperCase()}`);
            console.log(`👤 Usuário ID: ${userId}`);
            console.log(`🌍 Ambiente: ${environment}`);
            
            // 1. Validar entrada
            if (!apiKey || !secretKey || apiKey.length < 10 || secretKey.length < 20) {
                throw new Error('API Key ou Secret Key inválida');
            }
            
            // 2. Inserir no banco
            const insertQuery = `
                INSERT INTO user_api_keys (
                    user_id,
                    api_key,
                    secret_key,
                    exchange,
                    environment,
                    is_active,
                    validation_status,
                    created_at,
                    updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
                RETURNING id
            `;
            
            const result = await pool.query(insertQuery, [
                userId,
                apiKey,
                secretKey,
                exchange,
                environment,
                true,
                'pending'
            ]);
            
            const keyId = result.rows[0].id;
            console.log(`✅ Chave inserida no banco - ID: ${keyId}`);
            
            // 3. Iniciar validação automática
            console.log('🔄 Iniciando validação automática...');
            autoValidateNewKey(keyId, userId);
            
            // 4. Força recarregamento após validação (com delay)
            setTimeout(() => {
                this.dynamicReloader.forceReload();
            }, 5000); // 5 segundos para validação completar
            
            console.log('🚀 Processo iniciado! Validação e recarregamento automáticos em andamento...');
            
            return {
                success: true,
                keyId: keyId,
                message: 'Chave adicionada com sucesso. Validação automática iniciada.'
            };
            
        } catch (error) {
            console.error('❌ Erro ao adicionar chave:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Testa chave de exchange específica
     */
    async testarChaveExchange(apiKey, secretKey, exchange, environment) {
        try {
            if (exchange === 'bybit') {
                return await this.testarChaveBybit(apiKey, secretKey, environment);
            } else if (exchange === 'binance') {
                return await this.testarChaveBinance(apiKey, secretKey, environment);
            } else {
                throw new Error(`Exchange ${exchange} não suportada`);
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Testa conectividade Bybit
     */
    async testarChaveBybit(apiKey, secretKey, environment) {
        try {
            const timestamp = Date.now();
            const recvWindow = 5000;
            
            const params = {
                api_key: apiKey,
                timestamp: timestamp,
                recv_window: recvWindow
            };
            
            const queryString = Object.keys(params)
                .sort()
                .map(key => `${key}=${params[key]}`)
                .join('&');
            
            const signature = crypto.createHmac('sha256', secretKey).update(queryString).digest('hex');
            
            const baseUrl = environment === 'testnet' ? 
                'https://api-testnet.bybit.com' : 
                'https://api.bybit.com';
            
            const headers = {
                'X-BAPI-API-KEY': apiKey,
                'X-BAPI-TIMESTAMP': timestamp.toString(),
                'X-BAPI-RECV-WINDOW': recvWindow.toString(),
                'X-BAPI-SIGN': signature,
                'Content-Type': 'application/json'
            };
            
            const response = await fetch(`${baseUrl}/v5/account/wallet-balance?accountType=UNIFIED`, {
                method: 'GET',
                headers: headers
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.retCode === 0) {
                    return { success: true, data: data };
                } else {
                    return { success: false, error: data.retMsg };
                }
            } else {
                return { success: false, error: `HTTP ${response.status}` };
            }
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Testa conectividade Binance
     */
    async testarChaveBinance(apiKey, secretKey, environment) {
        try {
            const timestamp = Date.now();
            const recvWindow = 5000;
            
            const queryString = `timestamp=${timestamp}&recvWindow=${recvWindow}`;
            const signature = crypto.createHmac('sha256', secretKey).update(queryString).digest('hex');
            
            const baseUrl = environment === 'testnet' ? 
                'https://testnet.binance.vision' : 
                'https://api.binance.com';
            
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
                if (data.accountType) {
                    return { success: true, data: data };
                } else {
                    return { success: false, error: 'Invalid response' };
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                return { success: false, error: errorData.msg || response.statusText };
            }
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Verifica saldo do usuário
     */
    async verificarSaldoUsuario(user) {
        try {
            const key = user.primaryKey;
            
            if (key.exchange === 'bybit') {
                return await this.verificarSaldoBybit(key.api_key, key.secret_key, key.environment);
            } else if (key.exchange === 'binance') {
                return await this.verificarSaldoBinance(key.api_key, key.secret_key, key.environment);
            }
            
            return null;
            
        } catch (error) {
            console.error(`❌ Erro ao verificar saldo de ${user.name}:`, error.message);
            return null;
        }
    }

    /**
     * Verifica saldo Bybit
     */
    async verificarSaldoBybit(apiKey, secretKey, environment) {
        try {
            const timestamp = Date.now();
            const recvWindow = 5000;
            
            const params = {
                api_key: apiKey,
                timestamp: timestamp,
                recv_window: recvWindow
            };
            
            const queryString = Object.keys(params)
                .sort()
                .map(key => `${key}=${params[key]}`)
                .join('&');
            
            const signature = crypto.createHmac('sha256', secretKey).update(queryString).digest('hex');
            
            const baseUrl = environment === 'testnet' ? 
                'https://api-testnet.bybit.com' : 
                'https://api.bybit.com';
            
            const headers = {
                'X-BAPI-API-KEY': apiKey,
                'X-BAPI-TIMESTAMP': timestamp.toString(),
                'X-BAPI-RECV-WINDOW': recvWindow.toString(),
                'X-BAPI-SIGN': signature,
                'Content-Type': 'application/json'
            };
            
            const response = await fetch(`${baseUrl}/v5/account/wallet-balance?accountType=UNIFIED`, {
                method: 'GET',
                headers: headers
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.retCode === 0 && data.result && data.result.list) {
                    const wallet = data.result.list[0];
                    if (wallet && wallet.totalWalletBalance) {
                        return parseFloat(wallet.totalWalletBalance);
                    }
                }
            }
            
            return null;
            
        } catch (error) {
            return null;
        }
    }

    /**
     * Verifica saldo Binance
     */
    async verificarSaldoBinance(apiKey, secretKey, environment) {
        try {
            const timestamp = Date.now();
            const recvWindow = 5000;
            
            const queryString = `timestamp=${timestamp}&recvWindow=${recvWindow}`;
            const signature = crypto.createHmac('sha256', secretKey).update(queryString).digest('hex');
            
            const baseUrl = environment === 'testnet' ? 
                'https://testnet.binance.vision' : 
                'https://api.binance.com';
            
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
                if (data.balances) {
                    // Calcular saldo total em USDT equivalente (simplificado)
                    const usdtBalance = data.balances.find(b => b.asset === 'USDT');
                    if (usdtBalance) {
                        return parseFloat(usdtBalance.free) + parseFloat(usdtBalance.locked);
                    }
                }
            }
            
            return null;
            
        } catch (error) {
            return null;
        }
    }

    /**
     * Inicia monitoramento principal
     */
    iniciarMonitoramento() {
        console.log('📊 INICIANDO MONITORAMENTO EM TEMPO REAL...');
        
        this.monitoringInterval = setInterval(async () => {
            await this.executarVerificacaoMultiusuario();
        }, 10000); // 10 segundos
        
        // Executar uma vez imediatamente
        this.executarVerificacaoMultiusuario();
    }

    /**
     * Executa verificação de todos os usuários
     */
    async executarVerificacaoMultiusuario() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('pt-BR');
        
        console.log(`\n⏰ ${timeStr} - VERIFICAÇÃO MULTIUSUÁRIO`);
        console.log('==================================================');
        
        if (this.activeUsers.size === 0) {
            console.log('⚠️ Nenhum usuário ativo para monitorar');
            return;
        }
        
        let activeChecks = 0;
        
        for (const [userId, user] of this.activeUsers) {
            try {
                console.log(`\n👤 ${user.name}:`);
                
                const saldo = await this.verificarSaldoUsuario(user);
                
                if (saldo !== null) {
                    user.balance = saldo;
                    user.lastCheck = now;
                    user.status = 'online';
                    
                    console.log(`   🏦 ${user.primaryKey.exchange.charAt(0).toUpperCase() + user.primaryKey.exchange.slice(1)} - Saldo: $${saldo.toFixed(2)}`);
                    activeChecks++;
                    this.stats.successfulOperations++;
                } else {
                    user.status = 'error';
                    console.log(`   ❌ Erro na verificação de saldo`);
                    this.stats.errors++;
                }
                
                this.stats.totalOperations++;
                
            } catch (error) {
                console.log(`   ❌ Erro: ${error.message}`);
                user.status = 'error';
                this.stats.errors++;
            }
        }
        
        if (activeChecks === 0) {
            console.log('\n⚠️ Nenhuma verificação bem-sucedida');
        }
    }

    /**
     * Obtém estatísticas do sistema
     */
    obterEstatisticas() {
        const users = Array.from(this.activeUsers.values());
        const onlineUsers = users.filter(u => u.status === 'online').length;
        const totalBalance = users.reduce((sum, u) => sum + (u.balance || 0), 0);
        
        return {
            ...this.stats,
            totalUsers: this.activeUsers.size,
            onlineUsers: onlineUsers,
            totalBalance: totalBalance.toFixed(2),
            reloaderStats: this.dynamicReloader.getStats(),
            uptime: this.isRunning ? 'Running' : 'Stopped'
        };
    }

    /**
     * Para o sistema
     */
    async parar() {
        console.log('\n⏹️ Parando sistema multiusuário...');
        
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        
        await this.dynamicReloader.close();
        await this.keyValidator.close();
        await pool.end();
        
        this.isRunning = false;
        console.log('✅ Sistema parado');
    }
}

// Função para demonstração
async function exemploUso() {
    const sistema = new TradingMultiuserDynamic();
    
    try {
        await sistema.inicializar();
        
        // Exemplo de como adicionar nova chave (descomente para testar)
        /*
        setTimeout(async () => {
            console.log('\n🧪 TESTE: Adicionando nova chave...');
            await sistema.adicionarChaveComValidacaoAutomatica(
                12, // ID da Paloma
                'bybit',
                'API_KEY_TESTE',
                'SECRET_KEY_TESTE',
                'testnet'
            );
        }, 30000); // Após 30 segundos
        */
        
        // Graceful shutdown
        process.on('SIGINT', async () => {
            await sistema.parar();
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Erro no sistema:', error.message);
        await sistema.parar();
    }
}

// Executar se for arquivo principal
if (require.main === module) {
    exemploUso().catch(console.error);
}

module.exports = {
    TradingMultiuserDynamic
};
