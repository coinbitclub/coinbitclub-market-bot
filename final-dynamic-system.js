/**
 * 🎯 SISTEMA DINÂMICO FINAL SIMPLIFICADO
 * 
 * Sistema completo que implementa:
 * ✅ Validação automática após cadastro de chave
 * ✅ Recarregamento dinâmico sem restart
 * ✅ Monitoramento em tempo real
 * ✅ Interface de usuário via API
 */

const { Pool } = require('pg');
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');

class CoinBitClubDynamicSystem {
    constructor() {
        console.log('🚀 INICIALIZANDO SISTEMA DINÂMICO COINBITCLUB');
        console.log('===============================================');
        
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
            ssl: { rejectUnauthorized: false }
        });
        
        this.activeUsers = new Map();
        this.validationQueue = [];
        this.isSystemActive = false;
        this.validationInterval = null;
        this.monitorInterval = null;
        
        console.log('✅ Sistema inicializado');
    }
    
    /**
     * Iniciar sistema completo
     */
    async start() {
        try {
            console.log('\n📡 Testando conexão com banco...');
            await this.pool.query('SELECT NOW()');
            console.log('✅ Conexão estabelecida');
            
            console.log('👥 Carregando usuários ativos...');
            await this.loadActiveUsers();
            console.log(`✅ ${this.activeUsers.size} usuários carregados`);
            
            console.log('🔑 Iniciando validador automático...');
            this.startAutomaticValidation();
            console.log('✅ Validador ativo');
            
            console.log('📊 Iniciando monitor...');
            this.startMonitoring();
            console.log('✅ Monitor ativo');
            
            console.log('🌐 Iniciando API...');
            this.startAPI();
            console.log('✅ API ativa na porta 3001');
            
            this.isSystemActive = true;
            
            console.log('\n🎉 SISTEMA DINÂMICO ATIVO!');
            console.log('==========================');
            this.displayStatus();
            
        } catch (error) {
            console.error('❌ Erro ao iniciar sistema:', error.message);
            throw error;
        }
    }
    
    /**
     * Carregar usuários ativos
     */
    async loadActiveUsers() {
        const result = await this.pool.query(`
            SELECT 
                u.id,
                u.name,
                u.email,
                u.role,
                COUNT(uak.id) as total_keys,
                COUNT(CASE WHEN uak.validation_status = 'valid' THEN 1 END) as valid_keys
            FROM users u
            LEFT JOIN user_api_keys uak ON u.id = uak.user_id AND uak.is_active = true
            WHERE u.is_active = true
            GROUP BY u.id, u.name, u.email, u.role
            ORDER BY u.name
        `);
        
        this.activeUsers.clear();
        result.rows.forEach(user => {
            this.activeUsers.set(user.id, {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                totalKeys: parseInt(user.total_keys),
                validKeys: parseInt(user.valid_keys),
                lastUpdate: new Date()
            });
        });
    }
    
    /**
     * Adicionar chave com validação automática
     */
    async addKeyWithAutoValidation(userId, exchange, apiKey, secretKey, environment = 'mainnet') {
        try {
            console.log(`\n🔑 ADICIONANDO CHAVE COM VALIDAÇÃO AUTOMÁTICA`);
            console.log(`   👤 Usuário: ${userId}`);
            console.log(`   🏦 Exchange: ${exchange}`);
            console.log(`   🌍 Environment: ${environment}`);
            
            // 1. Inserir no banco
            const result = await this.pool.query(`
                INSERT INTO user_api_keys (
                    user_id, api_key, secret_key, exchange,
                    environment, is_active, validation_status,
                    created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
                RETURNING id
            `, [userId, apiKey, secretKey, exchange, environment, true, 'pending']);
            
            const keyId = result.rows[0].id;
            console.log(`✅ Chave inserida - ID: ${keyId}`);
            
            // 2. Adicionar à fila de validação
            this.validationQueue.push({
                keyId: keyId,
                userId: userId,
                exchange: exchange,
                apiKey: apiKey,
                secretKey: secretKey,
                environment: environment,
                attempts: 0,
                addedAt: new Date()
            });
            
            console.log(`📋 Chave adicionada à fila de validação`);
            
            // 3. Agendar recarregamento
            setTimeout(() => {
                this.reloadUsersAfterChange();
            }, 3000);
            
            return keyId;
            
        } catch (error) {
            console.error('❌ Erro ao adicionar chave:', error.message);
            throw error;
        }
    }
    
    /**
     * Iniciar validação automática
     */
    startAutomaticValidation() {
        // Processar fila a cada 5 segundos
        this.validationInterval = setInterval(async () => {
            if (this.validationQueue.length > 0) {
                const item = this.validationQueue.shift();
                await this.validateKey(item);
            }
        }, 5000);
    }
    
    /**
     * Validar chave individual
     */
    async validateKey(item) {
        try {
            console.log(`\n🔍 VALIDANDO CHAVE ${item.keyId}`);
            console.log(`   🏦 Exchange: ${item.exchange}`);
            console.log(`   🌍 Environment: ${item.environment}`);
            
            let isValid = false;
            let errorMessage = '';
            
            if (item.exchange === 'bybit') {
                isValid = await this.validateBybitKey(item.apiKey, item.secretKey, item.environment);
            } else if (item.exchange === 'binance') {
                isValid = await this.validateBinanceKey(item.apiKey, item.secretKey, item.environment);
            }
            
            // Atualizar status no banco
            const status = isValid ? 'valid' : 'failed';
            await this.pool.query(`
                UPDATE user_api_keys 
                SET validation_status = $1, updated_at = NOW()
                WHERE id = $2
            `, [status, item.keyId]);
            
            console.log(`${isValid ? '✅' : '❌'} Chave ${item.keyId}: ${status}`);
            
            // Se válida, recarregar usuários
            if (isValid) {
                setTimeout(() => {
                    this.reloadUsersAfterChange();
                }, 2000);
            }
            
        } catch (error) {
            console.error(`❌ Erro ao validar chave ${item.keyId}:`, error.message);
            
            // Tentar novamente se não passou do limite
            item.attempts++;
            if (item.attempts < 3) {
                this.validationQueue.push(item);
            } else {
                // Marcar como falhada
                await this.pool.query(`
                    UPDATE user_api_keys 
                    SET validation_status = 'failed', updated_at = NOW()
                    WHERE id = $1
                `, [item.keyId]);
            }
        }
    }
    
    /**
     * Validar chave Bybit
     */
    async validateBybitKey(apiKey, secretKey, environment) {
        try {
            const timestamp = Date.now().toString();
            const params = `timestamp=${timestamp}`;
            const signature = crypto.createHmac('sha256', secretKey).update(params).digest('hex');
            
            const baseUrl = environment === 'testnet' 
                ? 'https://api-testnet.bybit.com'
                : 'https://api.bybit.com';
            
            const response = await axios.get(`${baseUrl}/v5/account/wallet-balance?${params}&signature=${signature}`, {
                headers: {
                    'X-BAPI-API-KEY': apiKey,
                    'X-BAPI-TIMESTAMP': timestamp,
                    'X-BAPI-SIGN': signature
                },
                timeout: 10000
            });
            
            return response.data.retCode === 0;
            
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Validar chave Binance
     */
    async validateBinanceKey(apiKey, secretKey, environment) {
        try {
            const timestamp = Date.now();
            const queryString = `timestamp=${timestamp}`;
            const signature = crypto.createHmac('sha256', secretKey).update(queryString).digest('hex');
            
            const baseUrl = environment === 'testnet'
                ? 'https://testnet.binance.vision'
                : 'https://api.binance.com';
            
            const response = await axios.get(`${baseUrl}/api/v3/account?${queryString}&signature=${signature}`, {
                headers: {
                    'X-MBX-APIKEY': apiKey
                },
                timeout: 10000
            });
            
            return response.status === 200;
            
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Recarregar usuários após mudança
     */
    async reloadUsersAfterChange() {
        console.log('\n🔄 RECARREGAMENTO DINÂMICO');
        console.log('===========================');
        
        const previousCount = this.activeUsers.size;
        const previousValidUsers = Array.from(this.activeUsers.values()).filter(u => u.validKeys > 0).length;
        
        await this.loadActiveUsers();
        
        const newCount = this.activeUsers.size;
        const newValidUsers = Array.from(this.activeUsers.values()).filter(u => u.validKeys > 0).length;
        
        console.log(`👥 Usuários: ${previousCount} → ${newCount}`);
        console.log(`✅ Com chaves válidas: ${previousValidUsers} → ${newValidUsers}`);
        console.log('🔄 Sistema recarregado dinamicamente!');
    }
    
    /**
     * Iniciar monitoramento
     */
    startMonitoring() {
        this.monitorInterval = setInterval(async () => {
            await this.displayStatus();
        }, 30000); // A cada 30 segundos
    }
    
    /**
     * Exibir status do sistema
     */
    async displayStatus() {
        try {
            const stats = await this.getSystemStats();
            
            console.log('\n📊 STATUS DO SISTEMA DINÂMICO');
            console.log('==============================');
            console.log(`🕒 ${new Date().toLocaleString('pt-BR')}`);
            console.log(`🟢 Sistema ativo: ${this.isSystemActive ? 'SIM' : 'NÃO'}`);
            console.log(`👥 Usuários ativos: ${stats.totalUsers}`);
            console.log(`🔑 Chaves ativas: ${stats.activeKeys}`);
            console.log(`✅ Chaves válidas: ${stats.validKeys}`);
            console.log(`⏳ Pendentes validação: ${stats.pendingKeys}`);
            console.log(`📋 Fila de validação: ${this.validationQueue.length}`);
            
            if (this.activeUsers.size > 0) {
                console.log('\n👥 USUÁRIOS:');
                Array.from(this.activeUsers.values()).forEach(user => {
                    const status = user.validKeys > 0 ? '✅' : '⏳';
                    console.log(`   ${status} ${user.name} (${user.validKeys}/${user.totalKeys})`);
                });
            }
            
        } catch (error) {
            console.error('❌ Erro ao exibir status:', error.message);
        }
    }
    
    /**
     * Obter estatísticas do sistema
     */
    async getSystemStats() {
        const keysResult = await this.pool.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN validation_status = 'valid' THEN 1 END) as valid,
                COUNT(CASE WHEN validation_status = 'pending' THEN 1 END) as pending
            FROM user_api_keys 
            WHERE is_active = true
        `);
        
        const stats = keysResult.rows[0];
        
        return {
            totalUsers: this.activeUsers.size,
            activeKeys: parseInt(stats.total),
            validKeys: parseInt(stats.valid),
            pendingKeys: parseInt(stats.pending)
        };
    }
    
    /**
     * Iniciar API endpoints
     */
    startAPI() {
        const app = express();
        app.use(express.json());
        
        // Middleware de log
        app.use((req, res, next) => {
            console.log(`📞 API ${req.method} ${req.path}`);
            next();
        });
        
        // Endpoint para adicionar chave
        app.post('/api/keys/add', async (req, res) => {
            try {
                const { userId, exchange, apiKey, secretKey, environment } = req.body;
                
                if (!userId || !exchange || !apiKey || !secretKey) {
                    return res.status(400).json({
                        success: false,
                        error: 'Campos obrigatórios: userId, exchange, apiKey, secretKey'
                    });
                }
                
                const keyId = await this.addKeyWithAutoValidation(userId, exchange, apiKey, secretKey, environment);
                
                res.json({
                    success: true,
                    message: 'Chave adicionada - validação automática iniciada',
                    keyId: keyId,
                    timestamp: new Date().toISOString()
                });
                
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Status do sistema
        app.get('/api/status', async (req, res) => {
            try {
                const stats = await this.getSystemStats();
                const users = Array.from(this.activeUsers.values());
                
                res.json({
                    success: true,
                    system: {
                        isActive: this.isSystemActive,
                        validationQueueSize: this.validationQueue.length
                    },
                    stats: stats,
                    users: users,
                    timestamp: new Date().toISOString()
                });
                
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Forçar recarregamento
        app.post('/api/reload', async (req, res) => {
            try {
                await this.reloadUsersAfterChange();
                
                res.json({
                    success: true,
                    message: 'Recarregamento realizado'
                });
                
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Health check
        app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                system: 'coinbitclub-dynamic',
                timestamp: new Date().toISOString()
            });
        });
        
        this.server = app.listen(3001, () => {
            console.log('🌐 API rodando na porta 3001');
        });
    }
    
    /**
     * Parar sistema
     */
    async stop() {
        console.log('\n⏹️ PARANDO SISTEMA...');
        
        this.isSystemActive = false;
        
        if (this.validationInterval) {
            clearInterval(this.validationInterval);
        }
        
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
        }
        
        if (this.server) {
            this.server.close();
        }
        
        await this.pool.end();
        
        console.log('✅ Sistema parado com sucesso');
    }
}

// Função de teste
async function testDynamicSystem() {
    const system = new CoinBitClubDynamicSystem();
    
    try {
        await system.start();
        
        console.log('\n🧪 TESTANDO FUNCIONALIDADES...');
        
        // Simular adição de uma chave após 10 segundos
        setTimeout(async () => {
            console.log('\n🧪 SIMULANDO ADIÇÃO DE NOVA CHAVE...');
            try {
                await system.addKeyWithAutoValidation(
                    2, // userId
                    'bybit',
                    'test_api_key_' + Date.now(),
                    'test_secret_key_' + Date.now(),
                    'testnet'
                );
                console.log('✅ Teste de adição realizado');
            } catch (error) {
                console.log('⚠️ Erro no teste:', error.message);
            }
        }, 10000);
        
        // Manter rodando até interrupção
        process.on('SIGINT', async () => {
            await system.stop();
            process.exit(0);
        });
        
        console.log('\n💡 Sistema rodando - Pressione Ctrl+C para parar');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
        await system.stop();
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    testDynamicSystem().catch(console.error);
}

module.exports = {
    CoinBitClubDynamicSystem
};
