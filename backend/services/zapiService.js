/**
 * 🚀 INTEGRAÇÃO ZAPI - WhatsApp Business API
 * CoinBitClub Market Bot - Versão 3.0.0
 * 
 * Sistema completo de integração com Zapi para envio real de WhatsApp
 * Inclui webhook para recebimento de status e respostas
 */

const axios = require('axios');
const crypto = require('crypto');
const { Pool } = require('pg');

// Configuração do Zapi
const ZAPI_CONFIG = {
    instanceId: process.env.ZAPI_INSTANCE_ID || 'sua-instancia-zapi',
    token: process.env.ZAPI_TOKEN || 'seu-token-zapi',
    baseUrl: process.env.ZAPI_BASE_URL || 'https://api.z-api.io/instances',
    webhookSecret: process.env.ZAPI_WEBHOOK_SECRET || 'webhook-secret-key'
};

// Pool de conexão do banco
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Enviar mensagem via Zapi WhatsApp
 */
async function sendWhatsAppMessage(whatsappNumber, message, messageType = 'verification') {
    try {
        console.log('📱 ENVIANDO WhatsApp via ZAPI:');
        console.log(`📞 Número: ${whatsappNumber}`);
        console.log(`💬 Mensagem: ${message}`);
        console.log(`🔖 Tipo: ${messageType}`);
        
        // Normalizar número (remover caracteres especiais)
        const cleanNumber = whatsappNumber.replace(/[^\d]/g, '');
        
        // Configurar requisição para Zapi
        const zapiUrl = `${ZAPI_CONFIG.baseUrl}/${ZAPI_CONFIG.instanceId}/token/${ZAPI_CONFIG.token}/send-text`;
        
        const payload = {
            phone: cleanNumber,
            message: message,
            delayMessage: 1 // 1 segundo de delay
        };

        const response = await axios.post(zapiUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Client-Token': ZAPI_CONFIG.token
            },
            timeout: 30000 // 30 segundos timeout
        });

        console.log('✅ Resposta Zapi:', response.data);

        // Registrar envio no banco
        await registerMessageSent(whatsappNumber, message, messageType, response.data);

        return {
            success: true,
            messageId: response.data.messageId || response.data.id,
            status: response.data.status || 'sent',
            data: response.data
        };

    } catch (error) {
        console.error('❌ Erro ao enviar WhatsApp via Zapi:', error.message);
        
        // Registrar erro no banco
        await registerMessageError(whatsappNumber, message, messageType, error.message);
        
        return {
            success: false,
            error: error.message,
            status: 'error'
        };
    }
}

/**
 * Verificar status da instância Zapi
 */
async function checkZapiInstanceStatus() {
    try {
        const url = `${ZAPI_CONFIG.baseUrl}/${ZAPI_CONFIG.instanceId}/token/${ZAPI_CONFIG.token}/status`;
        
        const response = await axios.get(url, {
            headers: {
                'Client-Token': ZAPI_CONFIG.token
            },
            timeout: 10000
        });

        console.log('📊 Status da instância Zapi:', response.data);
        
        return {
            success: true,
            status: response.data.connected ? 'connected' : 'disconnected',
            instanceStatus: response.data.status,
            batteryLevel: response.data.battery,
            phoneNumber: response.data.phone,
            data: response.data
        };

    } catch (error) {
        console.error('❌ Erro ao verificar status Zapi:', error.message);
        return {
            success: false,
            error: error.message,
            status: 'error'
        };
    }
}

/**
 * Registrar mensagem enviada no banco
 */
async function registerMessageSent(whatsappNumber, message, messageType, zapiResponse) {
    try {
        const query = `
            INSERT INTO whatsapp_api_logs (
                whatsapp_number, 
                message_content, 
                message_type, 
                status, 
                external_message_id, 
                provider, 
                provider_response, 
                sent_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        `;

        const values = [
            whatsappNumber,
            message,
            messageType,
            'sent',
            zapiResponse.messageId || zapiResponse.id,
            'zapi',
            JSON.stringify(zapiResponse)
        ];

        await pool.query(query, values);
        console.log('✅ Log de envio registrado no banco');

    } catch (error) {
        console.error('❌ Erro ao registrar log de envio:', error.message);
    }
}

/**
 * Registrar erro de envio no banco
 */
async function registerMessageError(whatsappNumber, message, messageType, errorMessage) {
    try {
        const query = `
            INSERT INTO whatsapp_api_logs (
                whatsapp_number, 
                message_content, 
                message_type, 
                status, 
                error_message, 
                provider, 
                sent_at
            ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `;

        const values = [
            whatsappNumber,
            message,
            messageType,
            'error',
            errorMessage,
            'zapi'
        ];

        await pool.query(query, values);
        console.log('✅ Log de erro registrado no banco');

    } catch (error) {
        console.error('❌ Erro ao registrar log de erro:', error.message);
    }
}

/**
 * Processar webhook do Zapi
 */
async function processZapiWebhook(req, res) {
    try {
        console.log('📨 Webhook Zapi recebido:', JSON.stringify(req.body, null, 2));

        // Validar assinatura do webhook (se configurada)
        if (ZAPI_CONFIG.webhookSecret) {
            const signature = req.headers['x-zapi-signature'];
            const expectedSignature = crypto
                .createHmac('sha256', ZAPI_CONFIG.webhookSecret)
                .update(JSON.stringify(req.body))
                .digest('hex');

            if (signature !== `sha256=${expectedSignature}`) {
                console.log('❌ Assinatura do webhook inválida');
                return res.status(401).json({ error: 'Invalid signature' });
            }
        }

        const webhookData = req.body;
        const { type, data } = webhookData;

        // Processar diferentes tipos de webhook
        switch (type) {
            case 'ReceivedCallback':
                await processMessageReceived(data);
                break;
            case 'MessageStatus':
                await processMessageStatus(data);
                break;
            case 'Connected':
                await processInstanceConnected(data);
                break;
            case 'Disconnected':
                await processInstanceDisconnected(data);
                break;
            default:
                console.log(`🔔 Tipo de webhook não processado: ${type}`);
        }

        // Registrar webhook no banco
        await registerWebhookReceived(webhookData);

        res.status(200).json({ success: true, message: 'Webhook processed' });

    } catch (error) {
        console.error('❌ Erro ao processar webhook Zapi:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * Processar mensagem recebida
 */
async function processMessageReceived(data) {
    try {
        console.log('📩 Mensagem recebida:', data);

        const { phone, message, messageId, timestamp } = data;
        
        // Verificar se é resposta a um código de verificação
        if (message && message.conversation) {
            const messageText = message.conversation.trim();
            
            // Se for um código de 6 dígitos, processar como verificação
            if (/^\d{6}$/.test(messageText)) {
                await processVerificationCodeReceived(phone, messageText, messageId);
            }
        }

        // Registrar mensagem recebida
        const query = `
            INSERT INTO whatsapp_received_messages (
                whatsapp_number, 
                message_content, 
                external_message_id, 
                provider, 
                received_at, 
                raw_data
            ) VALUES ($1, $2, $3, $4, $5, $6)
        `;

        const values = [
            phone,
            message.conversation || JSON.stringify(message),
            messageId,
            'zapi',
            new Date(timestamp * 1000),
            JSON.stringify(data)
        ];

        await pool.query(query, values);

    } catch (error) {
        console.error('❌ Erro ao processar mensagem recebida:', error.message);
    }
}

/**
 * Processar status de mensagem
 */
async function processMessageStatus(data) {
    try {
        console.log('📊 Status de mensagem:', data);

        const { messageId, status, timestamp } = data;

        // Atualizar status no banco
        const query = `
            UPDATE whatsapp_api_logs 
            SET 
                delivery_status = $1,
                status_updated_at = $2,
                provider_status_data = $3
            WHERE external_message_id = $4
        `;

        const values = [
            status,
            new Date(timestamp * 1000),
            JSON.stringify(data),
            messageId
        ];

        const result = await pool.query(query, values);
        console.log(`✅ Status atualizado para ${result.rowCount} mensagem(s)`);

    } catch (error) {
        console.error('❌ Erro ao processar status de mensagem:', error.message);
    }
}

/**
 * Processar código de verificação recebido
 */
async function processVerificationCodeReceived(phone, code, messageId) {
    try {
        console.log(`🔢 Código de verificação recebido: ${code} de ${phone}`);

        // Buscar verificação pendente para este número
        const query = `
            SELECT id, user_id 
            FROM whatsapp_verification_logs 
            WHERE whatsapp_number = $1 
            AND status = 'pending' 
            AND expires_at > NOW()
            ORDER BY created_at DESC
            LIMIT 1
        `;

        const result = await pool.query(query, [phone]);

        if (result.rows.length > 0) {
            const { id: logId, user_id: userId } = result.rows[0];

            // Verificar se o código está correto
            const verifyResult = await pool.query(
                'SELECT verify_whatsapp_code($1, $2, $3) as result',
                [userId, code, '127.0.0.1']
            );

            const verification = verifyResult.rows[0].result;

            if (verification.success) {
                console.log('✅ Código verificado automaticamente via webhook');
                
                // Enviar confirmação por WhatsApp
                await sendWhatsAppMessage(
                    phone,
                    '✅ WhatsApp verificado com sucesso! Sua conta está agora ativa.',
                    'verification_success'
                );
            } else {
                console.log('❌ Código inválido recebido via webhook');
                
                // Enviar mensagem de erro
                await sendWhatsAppMessage(
                    phone,
                    '❌ Código inválido. Tente novamente ou solicite um novo código.',
                    'verification_error'
                );
            }
        }

    } catch (error) {
        console.error('❌ Erro ao processar código de verificação:', error.message);
    }
}

/**
 * Processar conexão da instância
 */
async function processInstanceConnected(data) {
    console.log('✅ Instância Zapi conectada:', data);
    
    // Registrar evento
    await registerSystemEvent('zapi_connected', data);
}

/**
 * Processar desconexão da instância
 */
async function processInstanceDisconnected(data) {
    console.log('❌ Instância Zapi desconectada:', data);
    
    // Registrar evento
    await registerSystemEvent('zapi_disconnected', data);
}

/**
 * Registrar webhook recebido
 */
async function registerWebhookReceived(webhookData) {
    try {
        const query = `
            INSERT INTO whatsapp_webhook_logs (
                webhook_type, 
                provider, 
                raw_payload, 
                processed_at
            ) VALUES ($1, $2, $3, NOW())
        `;

        const values = [
            webhookData.type,
            'zapi',
            JSON.stringify(webhookData)
        ];

        await pool.query(query, values);

    } catch (error) {
        console.error('❌ Erro ao registrar webhook:', error.message);
    }
}

/**
 * Registrar evento do sistema
 */
async function registerSystemEvent(eventType, data) {
    try {
        const query = `
            INSERT INTO system_events (
                event_type, 
                event_data, 
                created_at
            ) VALUES ($1, $2, NOW())
        `;

        await pool.query(query, [eventType, JSON.stringify(data)]);

    } catch (error) {
        console.error('❌ Erro ao registrar evento:', error.message);
    }
}

module.exports = {
    sendWhatsAppMessage,
    checkZapiInstanceStatus,
    processZapiWebhook,
    ZAPI_CONFIG
};
