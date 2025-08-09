const { Pool } = require('pg');

class APIKeyMonitor {
    constructor(pool) {
        this.pool = pool;
        this.monitoringInterval = null;
        console.log('🔐 API Key Monitor inicializado');
    }

    /**
     * 🔍 Monitorar chaves API em tempo real
     */
    async startMonitoring() {
        console.log('🔍 Iniciando monitoramento de chaves API...');
        
        // Monitorar a cada 5 minutos
        this.monitoringInterval = setInterval(async () => {
            await this.checkAllAPIKeys();
        }, 300000);

        // Primeira verificação imediata
        await this.checkAllAPIKeys();
    }

    /**
     * 📊 Verificar todas as chaves API
     */
    async checkAllAPIKeys() {
        try {
            console.log('🔍 Verificando todas as chaves API...');

            const usersWithKeys = await this.pool.query(`
                SELECT u.id, u.username, u.email, 
                       uak.api_key, uak.api_secret, uak.exchange
                FROM users u
                INNER JOIN user_api_keys uak ON u.id = uak.user_id
                WHERE uak.api_key IS NOT NULL 
                AND uak.api_secret IS NOT NULL
                ORDER BY u.username
            `);

            console.log(`🔐 Encontradas ${usersWithKeys.rows.length} chaves para verificar`);

            for (const user of usersWithKeys.rows) {
                await this.validateUserAPIKey(user);
            }

        } catch (error) {
            console.error('❌ Erro ao verificar chaves API:', error.message);
        }
    }

    /**
     * ✅ Validar chave API de um usuário
     */
    async validateUserAPIKey(user) {
        try {
            console.log(`🔍 Verificando chave de ${user.username} (${user.exchange})...`);

            let isValid = false;
            let errorMessage = null;

            if (user.exchange === 'bybit') {
                isValid = await this.validateBybitKey(user.api_key, user.api_secret);
            } else if (user.exchange === 'binance') {
                isValid = await this.validateBinanceKey(user.api_key, user.api_secret);
            }

            await this.updateKeyStatus(user.id, user.exchange, isValid, errorMessage);

            const status = isValid ? '✅' : '❌';
            console.log(`${status} ${user.username}: ${isValid ? 'Válida' : 'Inválida'}`);

        } catch (error) {
            console.error(`❌ Erro ao validar chave de ${user.username}:`, error.message);
            await this.updateKeyStatus(user.id, user.exchange, false, error.message);
        }
    }

    /**
     * 🟡 Validar chave Bybit
     */
    async validateBybitKey(apiKey, secretKey) {
        try {
            const crypto = require('crypto');
            const timestamp = Date.now().toString();
            const recvWindow = '5000';
            
            const signPayload = timestamp + apiKey + recvWindow;
            const signature = crypto.createHmac('sha256', secretKey).update(signPayload).digest('hex');

            const response = await fetch('https://api.bybit.com/v5/account/wallet-balance?accountType=UNIFIED', {
                method: 'GET',
                headers: {
                    'X-BAPI-API-KEY': apiKey,
                    'X-BAPI-SIGN': signature,
                    'X-BAPI-TIMESTAMP': timestamp,
                    'X-BAPI-RECV-WINDOW': recvWindow,
                    'X-BAPI-SIGN-TYPE': '2'
                }
            });

            const data = await response.json();
            return data.retCode === 0;

        } catch (error) {
            console.error('❌ Erro na validação Bybit:', error.message);
            return false;
        }
    }

    /**
     * 🟡 Validar chave Binance
     */
    async validateBinanceKey(apiKey, secretKey) {
        try {
            const crypto = require('crypto');
            const timestamp = Date.now();
            const queryString = `timestamp=${timestamp}`;
            const signature = crypto.createHmac('sha256', secretKey).update(queryString).digest('hex');

            const response = await fetch(`https://api.binance.com/api/v3/account?${queryString}&signature=${signature}`, {
                method: 'GET',
                headers: {
                    'X-MBX-APIKEY': apiKey
                }
            });

            return response.status === 200;

        } catch (error) {
            console.error('❌ Erro na validação Binance:', error.message);
            return false;
        }
    }

    /**
     * 💾 Atualizar status da chave no banco
     */
    async updateKeyStatus(userId, exchange, isValid, errorMessage = null) {
        try {
            const status = isValid ? 'valid' : 'invalid';
            
            await this.pool.query(`
                UPDATE user_api_keys 
                SET validation_status = $1,
                    last_validated = NOW(),
                    error_message = $2
                WHERE user_id = $3 AND exchange = $4
            `, [status, errorMessage, userId, exchange]);

        } catch (error) {
            console.error('❌ Erro ao atualizar status:', error.message);
        }
    }

    /**
     * 📊 Obter estatísticas das chaves
     */
    async getKeyStatistics() {
        try {
            const stats = await this.pool.query(`
                SELECT 
                    exchange,
                    validation_status,
                    COUNT(*) as count
                FROM user_api_keys 
                WHERE api_key IS NOT NULL
                GROUP BY exchange, validation_status
                ORDER BY exchange, validation_status
            `);

            return stats.rows;

        } catch (error) {
            console.error('❌ Erro ao obter estatísticas:', error.message);
            return [];
        }
    }

    /**
     * 🛑 Parar monitoramento
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            console.log('🛑 Monitoramento de chaves API parado');
        }
    }

    /**
     * 🔧 Criar colunas de validação se não existirem
     */
    async ensureValidationTable() {
        try {
            await this.pool.query(`
                ALTER TABLE user_api_keys 
                ADD COLUMN IF NOT EXISTS validation_status VARCHAR(20) DEFAULT 'pending',
                ADD COLUMN IF NOT EXISTS last_validated TIMESTAMP,
                ADD COLUMN IF NOT EXISTS error_message TEXT
            `);

            console.log('✅ Tabela de validação verificada/criada');

        } catch (error) {
            console.log('⚠️ Aviso ao verificar tabela:', error.message);
        }
    }
}

module.exports = APIKeyMonitor;
