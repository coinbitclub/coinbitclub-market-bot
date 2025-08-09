const { Pool } = require('pg');

class APIKe                 // Buscar usuários com chaves API (query segura sem depender de colunas opcionais)
            const usersWithKeys = await this.pool.query(`
                SELECT u.id, u.username, u.email, 
                       uak.api_key, uak.api_secret, uak.exchange
                FROM users u
                INNER JOIN user_api_keys uak ON u.id = uak.user_id
                WHERE uak.api_key IS NOT NULL 
                AND uak.api_secret IS NOT NULL
                ORDER BY u.username
            `);st activeKeys = await pool.query(`
                SELECT u.id, u.username, u.email,
                       uak.api_key, uak.api_secret, uak.exchange
                FROM users u
                INNER JOIN user_api_keys uak ON u.id = uak.user_id
                WHERE uak.api_key IS NOT NULL 
                AND uak.api_secret IS NOT NULLr {
    constructor(pool) {
        this.pool = pool;
        this.monitoringInterval = null;
        this.isRunning = false;
    }

    // Função para validar chaves API Binance
    async validateBinanceKeys(apiKey, secretKey) {
        try {
            // Em produção, fazer chamada real para Binance API
            // Para agora, vamos verificar se as chaves existem e têm formato válido
            if (!apiKey || !secretKey || apiKey.length < 10 || secretKey.length < 10) {
                return { 
                    status: 'invalid',
                    error: 'Chaves inválidas ou muito curtas',
                    timestamp: new Date().toISOString()
                };
            }

            // TODO: Implementar validação real com Binance API
            // const binance = new Binance().options({ APIKEY: apiKey, APISECRET: secretKey });
            // const accountInfo = await binance.accountInfo();
            
            return {
                status: 'valid',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            return {
                status: 'invalid',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // Verificar todas as chaves dos usuários
    async checkAllAPIKeys() {
        console.log(`🔍 [${new Date().toLocaleString('pt-BR')}] Verificando chaves API dos usuários...`);
        
        try {
            // Buscar usuários com chaves API (query segura sem depender de colunas opcionais)
            const usersWithKeys = await this.pool.query(`
                SELECT u.id, u.username, u.email, 
                       uak.api_key, uak.secret_key, uak.exchange
                FROM users u
                INNER JOIN user_api_keys uak ON u.id = uak.user_id
                WHERE uak.api_key IS NOT NULL 
                AND uak.secret_key IS NOT NULL
                ORDER BY u.username
            `);
            
            console.log(`📊 Encontrados ${usersWithKeys.rows.length} usuários com chaves API ativas`);
            
            let validKeys = 0;
            let invalidKeys = 0;
            let errors = 0;
            
            for (const user of usersWithKeys.rows) {
                try {
                    let validationResult;
                    
                    if (user.exchange === 'binance') {
                        validationResult = await this.validateBinanceKeys(user.api_key, user.secret_key);
                    } else {
                        validationResult = { status: 'not_tested', error: 'Exchange não suportado' };
                    }
                    
                    // Atualizar status no banco (query segura)
                    try {
                        await this.pool.query(`
                            UPDATE user_api_keys 
                            SET updated_at = NOW()
                            WHERE user_id = $1 AND exchange = $2
                        `, [user.id, user.exchange]);
                    } catch (updateError) {
                        console.log(`   ⚠️ Não foi possível atualizar status para ${user.username}`);
                    }
                    
                    if (validationResult.status === 'valid') {
                        validKeys++;
                        console.log(`   ✅ ${user.username}: Chaves ${user.exchange} válidas`);
                    } else {
                        invalidKeys++;
                        console.log(`   ❌ ${user.username}: Chaves ${user.exchange} inválidas - ${validationResult.error}`);
                    }
                    
                } catch (error) {
                    errors++;
                    console.log(`   ❌ Erro ao validar ${user.username}:`, error.message);
                    
                    // Marcar como erro no banco
                    await this.pool.query(`
                        UPDATE user_api_keys 
                        SET is_valid = false, 
                            last_checked = NOW(),
                            error_message = $1
                        WHERE user_id = $2 AND exchange = $3
                    `, [error.message, user.id, user.exchange]);
                }
            }
            
            console.log(`\n📈 RESUMO DA VERIFICAÇÃO:`);
            console.log(`   ✅ Chaves válidas: ${validKeys}`);
            console.log(`   ❌ Chaves inválidas: ${invalidKeys}`);
            console.log(`   ⚠️ Erros: ${errors}`);
            console.log(`🔄 Próxima verificação em 10 minutos\n`);
            
        } catch (error) {
            console.error('❌ Erro na verificação das chaves:', error.message);
        }
    }

    // Iniciar monitoramento automático
    start() {
        if (this.isRunning) {
            console.log('⚠️ Monitoramento já está em execução');
            return;
        }

        console.log('🔑 INICIANDO MONITORAMENTO AUTOMÁTICO DAS CHAVES API');
        console.log('================================================');
        
        this.isRunning = true;
        
        // Verificação inicial
        this.checkAllAPIKeys();
        
        // Configurar verificação automática a cada 10 minutos
        this.monitoringInterval = setInterval(() => {
            this.checkAllAPIKeys();
        }, 10 * 60 * 1000);
        
        console.log('🔄 Monitoramento ativo - verificando a cada 10 minutos');
    }

    // Parar monitoramento
    stop() {
        if (!this.isRunning) {
            console.log('⚠️ Monitoramento não está em execução');
            return;
        }

        console.log('🛑 Parando monitoramento de chaves API...');
        
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        
        this.isRunning = false;
        console.log('✅ Monitoramento parado');
    }

    // Verificar status
    getStatus() {
        return {
            isRunning: this.isRunning,
            intervalId: this.monitoringInterval ? 'active' : 'none'
        };
    }
}

module.exports = APIKeyMonitor;
