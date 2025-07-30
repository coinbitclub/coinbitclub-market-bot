/**
 * 🔧 GESTOR DE CHAVES API MULTIUSUÁRIOS - COINBITCLUB MARKET BOT V3.0.0
 * Validação e gerenciamento automático de chaves API Bybit
 * INTEGRADO AO ORQUESTRADOR SISTEMA COMPLETO
 */

const { Pool } = require('pg');
const crypto = require('crypto');
const SistemaOrquestrador = require('./orquestrador-sistema-completo');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🔑 GESTOR DE CHAVES API MULTIUSUÁRIOS - Iniciando...');
console.log('🎯 INTEGRADO AO SISTEMA ORQUESTRADOR V3.0.0');

class ApiKeyManager {
    constructor() {
        this.validationCount = 0;
        this.errorCount = 0;
        this.lastValidation = null;
    }

    // Gerar assinatura Bybit
    generateBybitSignature(secret, queryString) {
        return crypto.createHmac('sha256', secret)
                    .update(queryString)
                    .digest('hex');
    }

    // Validar chave API individual
    async validarChaveAPI(apiKey, secretKey) {
        try {
            const timestamp = Date.now().toString();
            const recvWindow = '5000';
            
            // Parâmetros para endpoint de saldo
            const params = `api_key=${apiKey}&recv_window=${recvWindow}&timestamp=${timestamp}`;
            const signature = this.generateBybitSignature(secretKey, params);
            
            const url = `https://api.bybit.com/v5/account/wallet-balance?${params}&sign=${signature}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-BAPI-API-KEY': apiKey,
                    'X-BAPI-TIMESTAMP': timestamp,
                    'X-BAPI-RECV-WINDOW': recvWindow,
                    'X-BAPI-SIGN': signature,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            if (data.retCode === 0) {
                // Chave válida - extrair informações do saldo
                const walletBalance = data.result?.list?.[0]?.coin || [];
                const usdtBalance = walletBalance.find(coin => coin.coin === 'USDT');
                
                return {
                    valid: true,
                    balance: usdtBalance ? parseFloat(usdtBalance.walletBalance) : 0,
                    availableBalance: usdtBalance ? parseFloat(usdtBalance.availableBalance) : 0,
                    message: 'Chave válida e funcional'
                };
            } else {
                return {
                    valid: false,
                    error: data.retMsg || 'Erro na validação',
                    retCode: data.retCode
                };
            }

        } catch (error) {
            return {
                valid: false,
                error: `Erro de conexão: ${error.message}`
            };
        }
    }

    // Processar todas as chaves de usuários ativos
    async processarTodasAsChaves() {
        console.log('\n🔍 Buscando chaves API para validação...');

        try {
            // Buscar todas as chaves de usuários ativos
            const chavesResult = await pool.query(`
                SELECT 
                    k.id, k.user_id, k.api_key, k.secret_key, 
                    k.is_active, k.last_validated, k.validation_error,
                    u.name as user_name, u.email, u.is_active as user_active
                FROM user_api_keys k
                INNER JOIN users u ON k.user_id = u.id
                WHERE u.is_active = true
                ORDER BY k.last_validated ASC NULLS FIRST
            `);

            const chaves = chavesResult.rows;
            
            if (chaves.length === 0) {
                console.log('ℹ️ Nenhuma chave API encontrada para validação');
                return;
            }

            console.log(`🔑 Encontradas ${chaves.length} chaves para validar`);

            for (const chave of chaves) {
                await this.processarChaveIndividual(chave);
                // Delay para evitar rate limiting
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

        } catch (error) {
            console.error('❌ Erro ao processar chaves:', error.message);
            this.errorCount++;
        }
    }

    async processarChaveIndividual(chave) {
        console.log(`\n🔄 Validando chave do usuário: ${chave.user_name}`);
        console.log(`📧 Email: ${chave.email}`);
        console.log(`🔑 API Key: ${chave.api_key.substring(0, 8)}...`);

        try {
            const validationResult = await this.validarChaveAPI(chave.api_key, chave.secret_key);
            
            if (validationResult.valid) {
                console.log(`✅ Chave válida! Saldo: $${validationResult.balance.toFixed(2)} USDT`);
                console.log(`💰 Disponível: $${validationResult.availableBalance.toFixed(2)} USDT`);

                // Atualizar chave como válida
                await pool.query(`
                    UPDATE user_api_keys 
                    SET is_active = true,
                        last_validated = NOW(),
                        validation_error = NULL,
                        balance_usdt = $1,
                        available_balance_usdt = $2
                    WHERE id = $3
                `, [validationResult.balance, validationResult.availableBalance, chave.id]);

                // Atualizar saldo do usuário
                await pool.query(`
                    UPDATE users 
                    SET balance = $1,
                        available_balance = $2,
                        updated_at = NOW()
                    WHERE id = $3
                `, [validationResult.balance, validationResult.availableBalance, chave.user_id]);

                this.validationCount++;

            } else {
                console.log(`❌ Chave inválida: ${validationResult.error}`);

                // Marcar chave como inválida
                await pool.query(`
                    UPDATE user_api_keys 
                    SET is_active = false,
                        last_validated = NOW(),
                        validation_error = $1
                    WHERE id = $2
                `, [validationResult.error, chave.id]);

                this.errorCount++;
            }

        } catch (error) {
            console.error(`❌ Erro ao validar chave de ${chave.user_name}:`, error.message);
            
            await pool.query(`
                UPDATE user_api_keys 
                SET is_active = false,
                    last_validated = NOW(),
                    validation_error = $1
                WHERE id = $2
            `, [`Erro de validação: ${error.message}`, chave.id]);

            this.errorCount++;
        }
    }

    async obterEstatisticasChaves() {
        try {
            const stats = await pool.query(`
                SELECT 
                    COUNT(*) as total_keys,
                    COUNT(*) FILTER (WHERE is_active = true) as active_keys,
                    COUNT(*) FILTER (WHERE is_active = false) as inactive_keys,
                    COUNT(*) FILTER (WHERE last_validated IS NULL) as never_validated,
                    COUNT(*) FILTER (WHERE last_validated > NOW() - INTERVAL '1 day') as validated_today,
                    AVG(balance_usdt) FILTER (WHERE is_active = true) as avg_balance,
                    SUM(balance_usdt) FILTER (WHERE is_active = true) as total_balance
                FROM user_api_keys k
                INNER JOIN users u ON k.user_id = u.id
                WHERE u.is_active = true
            `);

            return stats.rows[0];
        } catch (error) {
            console.error('❌ Erro ao obter estatísticas:', error.message);
            return null;
        }
    }

    async executarCicloValidacao() {
        console.log(`\n🔄 Ciclo de validação iniciado - ${new Date().toISOString()}`);
        
        await this.processarTodasAsChaves();
        
        const stats = await this.obterEstatisticasChaves();
        if (stats) {
            console.log('\n📊 ESTATÍSTICAS DAS CHAVES API:');
            console.log(`   Total de chaves: ${stats.total_keys}`);
            console.log(`   Chaves ativas: ${stats.active_keys}`);
            console.log(`   Chaves inativas: ${stats.inactive_keys}`);
            console.log(`   Nunca validadas: ${stats.never_validated}`);
            console.log(`   Validadas hoje: ${stats.validated_today}`);
            console.log(`   Saldo médio: $${(stats.avg_balance || 0).toFixed(2)} USDT`);
            console.log(`   Saldo total: $${(stats.total_balance || 0).toFixed(2)} USDT`);
        }

        console.log(`✅ Ciclo concluído - Validadas: ${this.validationCount} | Erros: ${this.errorCount}`);
        this.lastValidation = new Date();
    }

    async criarTabelaSeNaoExistir() {
        try {
            // Verificar se a coluna balance_usdt existe
            const columnCheck = await pool.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'user_api_keys' 
                AND column_name IN ('balance_usdt', 'available_balance_usdt')
            `);

            if (columnCheck.rows.length < 2) {
                console.log('🔧 Adicionando colunas de saldo às chaves API...');
                
                await pool.query(`
                    ALTER TABLE user_api_keys 
                    ADD COLUMN IF NOT EXISTS balance_usdt DECIMAL(20,8) DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS available_balance_usdt DECIMAL(20,8) DEFAULT 0
                `);
                
                console.log('✅ Colunas adicionadas com sucesso');
            }

        } catch (error) {
            console.error('❌ Erro ao verificar/criar estrutura:', error.message);
        }
    }

    async iniciar() {
        console.log('🚀 Gestor de Chaves API iniciado');
        console.log('⏰ Validação a cada 30 minutos');
        
        // Verificar estrutura do banco
        await this.criarTabelaSeNaoExistir();
        
        // Executar primeiro ciclo
        await this.executarCicloValidacao();
        
        // Configurar interval de 30 minutos (1800000ms)
        setInterval(() => {
            this.executarCicloValidacao();
        }, 30 * 60 * 1000);
    }

    // Método para validação manual de chave específica
    async validarChaveEspecifica(userId) {
        try {
            const chaveResult = await pool.query(`
                SELECT k.*, u.name as user_name 
                FROM user_api_keys k
                INNER JOIN users u ON k.user_id = u.id
                WHERE k.user_id = $1
            `, [userId]);

            if (chaveResult.rows.length === 0) {
                console.log(`❌ Nenhuma chave encontrada para usuário ID: ${userId}`);
                return false;
            }

            await this.processarChaveIndividual(chaveResult.rows[0]);
            return true;

        } catch (error) {
            console.error('❌ Erro na validação específica:', error.message);
            return false;
        }
    }
}

// Inicializar gestor
const keyManager = new ApiKeyManager();
keyManager.iniciar();

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🔄 Encerrando gestor de chaves...');
    await pool.end();
    console.log('✅ Gestor encerrado');
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('🔄 Encerrando gestor de chaves...');
    await pool.end();
    console.log('✅ Gestor encerrado');
    process.exit(0);
});

module.exports = ApiKeyManager;
