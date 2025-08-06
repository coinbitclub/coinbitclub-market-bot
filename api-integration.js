/**
 * 🔗 API ENDPOINT PARA INTEGRAÇÃO COM FRONTEND
 * 
 * Sistema de webhooks e endpoints para:
 * - Receber notificações de novas chaves
 * - Disparar validação automática
 * - Integrar com interface de usuário
 */

const express = require('express');
const { autoValidateNewKey } = require('./automatic-key-validator');
const { triggerReload } = require('./dynamic-reloader');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🔗 API ENDPOINT PARA INTEGRAÇÃO');
console.log('==============================');

/**
 * Middleware para log de requisições
 */
app.use((req, res, next) => {
    console.log(`📞 ${req.method} ${req.path} - ${new Date().toLocaleString('pt-BR')}`);
    next();
});

/**
 * Webhook para nova chave adicionada
 */
app.post('/webhook/new-key', async (req, res) => {
    try {
        const { keyId, userId, exchange, environment } = req.body;
        
        console.log('\n🔔 WEBHOOK: Nova chave detectada!');
        console.log(`   🆔 Key ID: ${keyId}`);
        console.log(`   👤 User ID: ${userId}`);
        console.log(`   🏦 Exchange: ${exchange}`);
        console.log(`   🌍 Environment: ${environment}`);
        
        if (!keyId) {
            return res.status(400).json({
                success: false,
                error: 'keyId é obrigatório'
            });
        }
        
        // Disparar validação automática
        autoValidateNewKey(keyId, userId);
        
        // Agendar recarregamento
        setTimeout(() => {
            triggerReload('webhook_new_key');
        }, 3000);
        
        res.json({
            success: true,
            message: 'Validação automática iniciada',
            keyId: keyId,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro no webhook:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Endpoint para adicionar nova chave via API
 */
app.post('/api/keys', async (req, res) => {
    try {
        const { userId, exchange, apiKey, secretKey, environment = 'mainnet' } = req.body;
        
        console.log('\n🔑 API: Adicionando nova chave');
        console.log(`   👤 User ID: ${userId}`);
        console.log(`   🏦 Exchange: ${exchange}`);
        console.log(`   🌍 Environment: ${environment}`);
        
        // Validar entrada
        if (!userId || !exchange || !apiKey || !secretKey) {
            return res.status(400).json({
                success: false,
                error: 'Todos os campos são obrigatórios: userId, exchange, apiKey, secretKey'
            });
        }
        
        // Inserir no banco
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
        
        // Disparar validação automática
        autoValidateNewKey(keyId, userId);
        
        // Agendar recarregamento
        setTimeout(() => {
            triggerReload('api_new_key');
        }, 3000);
        
        res.json({
            success: true,
            message: 'Chave adicionada com sucesso',
            keyId: keyId,
            validationStatus: 'pending',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro na API:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Endpoint para status de uma chave
 */
app.get('/api/keys/:keyId/status', async (req, res) => {
    try {
        const { keyId } = req.params;
        
        const result = await pool.query(`
            SELECT 
                uak.id,
                uak.exchange,
                uak.environment,
                uak.validation_status,
                uak.is_active,
                uak.created_at,
                uak.updated_at,
                u.name as user_name
            FROM user_api_keys uak
            JOIN users u ON uak.user_id = u.id
            WHERE uak.id = $1
        `, [keyId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Chave não encontrada'
            });
        }
        
        const key = result.rows[0];
        
        res.json({
            success: true,
            key: {
                id: key.id,
                exchange: key.exchange,
                environment: key.environment,
                validationStatus: key.validation_status,
                isActive: key.is_active,
                userName: key.user_name,
                createdAt: key.created_at,
                updatedAt: key.updated_at
            }
        });
        
    } catch (error) {
        console.error('❌ Erro ao buscar status:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Endpoint para forçar validação de uma chave
 */
app.post('/api/keys/:keyId/validate', async (req, res) => {
    try {
        const { keyId } = req.params;
        
        console.log(`🔄 API: Forçando validação da chave ${keyId}`);
        
        // Disparar validação
        autoValidateNewKey(keyId);
        
        res.json({
            success: true,
            message: 'Validação iniciada',
            keyId: keyId,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro ao validar:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Endpoint para forçar recarregamento do sistema
 */
app.post('/api/system/reload', (req, res) => {
    try {
        const { reason = 'manual_api' } = req.body;
        
        console.log(`🔄 API: Forçando recarregamento - ${reason}`);
        
        triggerReload(reason);
        
        res.json({
            success: true,
            message: 'Recarregamento disparado',
            reason: reason,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro ao recarregar:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Endpoint para listar usuários ativos
 */
app.get('/api/users/active', async (req, res) => {
    try {
        const result = await pool.query(`
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
        
        res.json({
            success: true,
            users: result.rows,
            total: result.rows.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro ao listar usuários:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Endpoint de health check
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'coinbitclub-api'
    });
});

/**
 * Endpoint para documentação
 */
app.get('/', (req, res) => {
    res.json({
        service: 'CoinBitClub Trading API',
        version: '2.0',
        endpoints: {
            'POST /webhook/new-key': 'Webhook para nova chave',
            'POST /api/keys': 'Adicionar nova chave',
            'GET /api/keys/:keyId/status': 'Status de uma chave',
            'POST /api/keys/:keyId/validate': 'Forçar validação',
            'POST /api/system/reload': 'Forçar recarregamento',
            'GET /api/users/active': 'Listar usuários ativos',
            'GET /health': 'Health check'
        },
        documentation: 'https://api.coinbitclub.com/docs'
    });
});

/**
 * Middleware de erro
 */
app.use((error, req, res, next) => {
    console.error('❌ Erro não tratado:', error.message);
    res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
    });
});

// Configurar porta
const PORT = process.env.PORT || 3001;

// Iniciar servidor
const server = app.listen(PORT, () => {
    console.log(`🚀 API Endpoint rodando na porta ${PORT}`);
    console.log(`📄 Documentação: http://localhost:${PORT}/`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log('');
    console.log('📋 ENDPOINTS DISPONÍVEIS:');
    console.log('========================');
    console.log('POST /webhook/new-key - Webhook para nova chave');
    console.log('POST /api/keys - Adicionar nova chave');
    console.log('GET /api/keys/:keyId/status - Status de uma chave');
    console.log('POST /api/keys/:keyId/validate - Forçar validação');
    console.log('POST /api/system/reload - Forçar recarregamento');
    console.log('GET /api/users/active - Listar usuários ativos');
    console.log('');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n⏹️ Encerrando API...');
    server.close();
    await pool.end();
    process.exit(0);
});

module.exports = app;
