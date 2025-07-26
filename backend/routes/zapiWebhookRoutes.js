/**
 * 🚀 ROTAS WEBHOOK ZAPI - CoinBitClub Market Bot
 * Sistema de recebimento de webhooks do Zapi WhatsApp Business API
 * Versão: 3.0.0
 */

const express = require('express');
const router = express.Router();
const zapiService = require('../services/zapiService');
const { Pool } = require('pg');

// Pool de conexão do banco
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Webhook para receber eventos do Zapi
 * POST /api/webhooks/zapi
 */
router.post('/zapi', async (req, res) => {
    try {
        console.log('📨 Webhook Zapi recebido:', req.body);
        
        // Processar webhook usando o serviço
        await zapiService.processZapiWebhook(req, res);
        
    } catch (error) {
        console.error('❌ Erro no webhook Zapi:', error.message);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            code: 'WEBHOOK_ERROR'
        });
    }
});

/**
 * Status da integração Zapi (Admin)
 * GET /api/webhooks/zapi/status
 */
router.get('/zapi/status', async (req, res) => {
    try {
        // Verificar status da instância
        const zapiStatus = await zapiService.checkZapiInstanceStatus();
        
        // Buscar configuração do banco
        const configResult = await pool.query('SELECT get_active_zapi_config() as config');
        const zapiConfig = configResult.rows[0].config;
        
        // Buscar estatísticas de mensagens
        const statsResult = await pool.query('SELECT get_whatsapp_message_stats(7) as stats');
        const messageStats = statsResult.rows[0].stats;
        
        res.json({
            success: true,
            zapi_instance: zapiStatus,
            database_config: zapiConfig,
            message_stats: messageStats,
            checked_at: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro ao obter status Zapi:', error.message);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            code: 'STATUS_ERROR'
        });
    }
});

/**
 * Teste de envio manual (Admin)
 * POST /api/webhooks/zapi/test-send
 */
router.post('/zapi/test-send', async (req, res) => {
    try {
        const { phoneNumber, message } = req.body;
        
        if (!phoneNumber || !message) {
            return res.status(400).json({
                success: false,
                error: 'Número de telefone e mensagem são obrigatórios',
                code: 'MISSING_FIELDS'
            });
        }
        
        console.log('🧪 Teste de envio Zapi:', { phoneNumber, message });
        
        // Enviar mensagem de teste
        const result = await zapiService.sendWhatsAppMessage(phoneNumber, message, 'test');
        
        res.json({
            success: result.success,
            message_id: result.messageId,
            status: result.status,
            error: result.error,
            sent_at: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro no teste de envio:', error.message);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            code: 'TEST_SEND_ERROR'
        });
    }
});

/**
 * Logs de webhooks recebidos (Admin)
 * GET /api/webhooks/zapi/logs
 */
router.get('/zapi/logs', async (req, res) => {
    try {
        const { page = 1, limit = 20, type } = req.query;
        const offset = (page - 1) * limit;
        
        let whereClause = '';
        const params = [limit, offset];
        let paramIndex = 3;
        
        if (type) {
            whereClause = 'WHERE webhook_type = $3';
            params.push(type);
            paramIndex = 4;
        }
        
        const query = `
            SELECT 
                id,
                webhook_type,
                provider,
                raw_payload,
                processed_at,
                processing_status,
                error_message,
                created_at
            FROM whatsapp_webhook_logs
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
        `;
        
        const result = await pool.query(query, params);
        
        // Contar total
        const countQuery = `SELECT COUNT(*) as total FROM whatsapp_webhook_logs ${whereClause}`;
        const countParams = type ? [type] : [];
        const countResult = await pool.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].total);
        
        res.json({
            success: true,
            logs: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
        
    } catch (error) {
        console.error('❌ Erro ao buscar logs:', error.message);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            code: 'LOGS_ERROR'
        });
    }
});

/**
 * Configurar instância Zapi (Admin)
 * POST /api/webhooks/zapi/configure
 */
router.post('/zapi/configure', async (req, res) => {
    try {
        const { instanceId, instanceName, token, webhookUrl } = req.body;
        
        if (!instanceId || !token) {
            return res.status(400).json({
                success: false,
                error: 'Instance ID e token são obrigatórios',
                code: 'MISSING_FIELDS'
            });
        }
        
        // Inserir ou atualizar configuração
        const query = `
            INSERT INTO zapi_configurations (
                instance_id,
                instance_name,
                token_encrypted,
                webhook_url,
                status
            ) VALUES ($1, $2, $3, $4, 'active')
            ON CONFLICT (instance_id) 
            DO UPDATE SET
                instance_name = $2,
                token_encrypted = $3,
                webhook_url = $4,
                status = 'active',
                updated_at = NOW()
        `;
        
        await pool.query(query, [instanceId, instanceName, token, webhookUrl]);
        
        res.json({
            success: true,
            message: 'Configuração Zapi atualizada com sucesso',
            instance_id: instanceId,
            updated_at: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro ao configurar Zapi:', error.message);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            code: 'CONFIGURE_ERROR'
        });
    }
});

module.exports = router;
