/**
 * 🔄 SISTEMA DE VALIDAÇÃO AUTOMÁTICA DE CHAVES API
 * 
 * Módulo para validação automática de chaves recém-cadastradas
 * Suporta Bybit e Binance com validação em tempo real
 */

const { Pool } = require('pg');
const crypto = require('crypto');

class AutomaticKeyValidator {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
            ssl: { rejectUnauthorized: false }
        });
        
        this.isValidating = false;
        this.validationQueue = [];
    }

    /**
     * Inicia a validação automática de uma chave recém-cadastrada
     */
    async validateNewKey(keyId, userId = null) {
        console.log(`🔄 Iniciando validação automática da chave ID: ${keyId}`);
        
        try {
            // Buscar dados da chave
            const keyQuery = `
                SELECT 
                    uak.id,
                    uak.user_id,
                    uak.api_key,
                    uak.secret_key,
                    uak.exchange,
                    uak.environment,
                    u.name as user_name,
                    u.email as user_email
                FROM user_api_keys uak
                JOIN users u ON uak.user_id = u.id
                WHERE uak.id = $1
            `;
            
            const result = await this.pool.query(keyQuery, [keyId]);
            
            if (result.rows.length === 0) {
                console.log(`❌ Chave ID ${keyId} não encontrada`);
                return false;
            }
            
            const keyData = result.rows[0];
            console.log(`👤 Validando chave de: ${keyData.user_name}`);
            console.log(`🏦 Exchange: ${keyData.exchange} (${keyData.environment})`);
            
            // Marcar como em validação
            await this.pool.query(`
                UPDATE user_api_keys 
                SET validation_status = 'validating', updated_at = NOW()
                WHERE id = $1
            `, [keyId]);
            
            // Validar baseado na exchange
            let validationResult;
            if (keyData.exchange === 'bybit') {
                validationResult = await this.validateBybitKey(keyData);
            } else if (keyData.exchange === 'binance') {
                validationResult = await this.validateBinanceKey(keyData);
            } else {
                validationResult = {
                    valid: false,
                    error: `Exchange ${keyData.exchange} não suportada`
                };
            }
            
            // Atualizar status no banco
            const newStatus = validationResult.valid ? 'valid' : `error: ${validationResult.error}`;
            
            await this.pool.query(`
                UPDATE user_api_keys 
                SET validation_status = $1, updated_at = NOW()
                WHERE id = $2
            `, [newStatus, keyId]);
            
            // Log do resultado
            if (validationResult.valid) {
                console.log(`✅ Chave validada com sucesso!`);
                console.log(`   👤 Usuário: ${keyData.user_name}`);
                console.log(`   🏦 Exchange: ${keyData.exchange}`);
                console.log(`   🎯 Status: VÁLIDA`);
                
                // Disparar recarregamento do sistema
                await this.triggerSystemReload();
                
            } else {
                console.log(`❌ Falha na validação:`);
                console.log(`   👤 Usuário: ${keyData.user_name}`);
                console.log(`   🏦 Exchange: ${keyData.exchange}`);
                console.log(`   ❌ Erro: ${validationResult.error}`);
            }
            
            return validationResult.valid;
            
        } catch (error) {
            console.error(`❌ Erro na validação automática:`, error.message);
            
            // Marcar como erro
            await this.pool.query(`
                UPDATE user_api_keys 
                SET validation_status = $1, updated_at = NOW()
                WHERE id = $2
            `, [`validation_error: ${error.message}`, keyId]);
            
            return false;
        }
    }

    /**
     * Valida chave Bybit
     */
    async validateBybitKey(keyData) {
        try {
            const timestamp = Date.now();
            const recvWindow = 5000;
            
            // Preparar parâmetros
            const params = {
                api_key: keyData.api_key,
                timestamp: timestamp,
                recv_window: recvWindow
            };
            
            // Criar query string ordenada
            const queryString = Object.keys(params)
                .sort()
                .map(key => `${key}=${params[key]}`)
                .join('&');
            
            // Criar assinatura
            const signature = crypto.createHmac('sha256', keyData.secret_key).update(queryString).digest('hex');
            
            const headers = {
                'X-BAPI-API-KEY': keyData.api_key,
                'X-BAPI-TIMESTAMP': timestamp.toString(),
                'X-BAPI-RECV-WINDOW': recvWindow.toString(),
                'X-BAPI-SIGN': signature,
                'Content-Type': 'application/json'
            };
            
            // Escolher URL baseada no ambiente
            const baseUrl = keyData.environment === 'testnet' ? 
                'https://api-testnet.bybit.com' : 
                'https://api.bybit.com';
            
            // Testar endpoint de wallet
            const response = await fetch(`${baseUrl}/v5/account/wallet-balance?accountType=UNIFIED`, {
                method: 'GET',
                headers: headers
            });
            
            if (!response.ok) {
                return {
                    valid: false,
                    error: `HTTP ${response.status}: ${response.statusText}`
                };
            }
            
            const data = await response.json();
            
            if (data.retCode === 0) {
                console.log(`      📊 Bybit: Conectividade confirmada`);
                return {
                    valid: true,
                    data: data
                };
            } else {
                return {
                    valid: false,
                    error: `Bybit API Error: ${data.retMsg || 'Unknown error'}`
                };
            }
            
        } catch (error) {
            return {
                valid: false,
                error: `Connection error: ${error.message}`
            };
        }
    }

    /**
     * Valida chave Binance
     */
    async validateBinanceKey(keyData) {
        try {
            const timestamp = Date.now();
            const recvWindow = 5000;
            
            // Criar query string
            const queryString = `timestamp=${timestamp}&recvWindow=${recvWindow}`;
            const signature = crypto.createHmac('sha256', keyData.secret_key).update(queryString).digest('hex');
            
            const headers = {
                'X-MBX-APIKEY': keyData.api_key,
                'Content-Type': 'application/json'
            };
            
            // Escolher URL baseada no ambiente
            const baseUrl = keyData.environment === 'testnet' ? 
                'https://testnet.binance.vision' : 
                'https://api.binance.com';
            
            // Testar endpoint de conta
            const response = await fetch(`${baseUrl}/api/v3/account?${queryString}&signature=${signature}`, {
                method: 'GET',
                headers: headers
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch {
                    errorData = { msg: errorText };
                }
                
                return {
                    valid: false,
                    error: `HTTP ${response.status}: ${errorData.msg || response.statusText}`
                };
            }
            
            const data = await response.json();
            
            if (data.accountType) {
                console.log(`      📊 Binance: Account Type ${data.accountType}`);
                return {
                    valid: true,
                    data: data
                };
            } else {
                return {
                    valid: false,
                    error: 'Invalid API response'
                };
            }
            
        } catch (error) {
            return {
                valid: false,
                error: `Connection error: ${error.message}`
            };
        }
    }

    /**
     * Monitora chaves pendentes de validação
     */
    async monitorPendingValidations() {
        try {
            const pendingKeys = await this.pool.query(`
                SELECT id, user_id, exchange, created_at
                FROM user_api_keys 
                WHERE validation_status IN ('pending', 'validating', '')
                OR validation_status IS NULL
                ORDER BY created_at ASC
            `);
            
            if (pendingKeys.rows.length > 0) {
                console.log(`🔍 ${pendingKeys.rows.length} chave(s) pendente(s) encontrada(s)`);
                
                for (const key of pendingKeys.rows) {
                    await this.validateNewKey(key.id);
                    // Pequena pausa entre validações
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
        } catch (error) {
            console.error('❌ Erro no monitoramento de validações:', error.message);
        }
    }

    /**
     * Dispara recarregamento do sistema principal
     */
    async triggerSystemReload() {
        try {
            console.log('🔄 Disparando recarregamento do sistema...');
            
            // Verificar se há processo principal rodando
            const fs = require('fs');
            const path = require('path');
            
            // Criar arquivo de sinal para recarregamento
            const reloadSignalFile = path.join(__dirname, '.reload-signal');
            fs.writeFileSync(reloadSignalFile, JSON.stringify({
                timestamp: Date.now(),
                reason: 'new_key_validated'
            }));
            
            console.log('✅ Sinal de recarregamento criado');
            
            // Aqui poderia implementar outros métodos como:
            // - Enviar evento via WebSocket
            // - Chamar endpoint de recarregamento
            // - Usar processo de comunicação inter-processo
            
        } catch (error) {
            console.error('❌ Erro ao disparar recarregamento:', error.message);
        }
    }

    /**
     * Inicia monitoramento contínuo
     */
    startContinuousMonitoring(intervalMinutes = 5) {
        console.log(`🔄 Iniciando monitoramento contínuo (${intervalMinutes} min)`);
        
        setInterval(async () => {
            await this.monitorPendingValidations();
        }, intervalMinutes * 60 * 1000);
        
        // Executar uma vez imediatamente
        this.monitorPendingValidations();
    }

    /**
     * Fecha conexão com banco
     */
    async close() {
        await this.pool.end();
    }
}

// Função utilitária para validação manual
async function validateKeyManually(keyId) {
    const validator = new AutomaticKeyValidator();
    const result = await validator.validateNewKey(keyId);
    await validator.close();
    return result;
}

// Função para iniciar validação automática de nova chave
async function autoValidateNewKey(keyId, userId = null) {
    const validator = new AutomaticKeyValidator();
    
    // Executar validação em background
    setTimeout(async () => {
        await validator.validateNewKey(keyId, userId);
        await validator.close();
    }, 2000); // Aguardar 2 segundos para garantir que a inserção foi commitada
    
    console.log(`🚀 Validação automática agendada para chave ID: ${keyId}`);
}

module.exports = {
    AutomaticKeyValidator,
    validateKeyManually,
    autoValidateNewKey
};

// Se executado diretamente, iniciar monitoramento
if (require.main === module) {
    console.log('🔄 SISTEMA DE VALIDAÇÃO AUTOMÁTICA');
    console.log('==================================');
    
    const validator = new AutomaticKeyValidator();
    validator.startContinuousMonitoring(2); // Verificar a cada 2 minutos
    
    console.log('✅ Monitoramento iniciado!');
    console.log('Press Ctrl+C para parar...');
}
