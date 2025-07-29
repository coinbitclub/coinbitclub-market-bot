/**
 * 📱 GESTOR SMS AUTHENTICATION COMPLETO
 * Sistema de autenticação por SMS usando Twilio
 * Para registro de usuários e notificações importantes
 */

const twilio = require('twilio');
const { Pool } = require('pg');
const crypto = require('crypto');

console.log('📱 GESTOR SMS AUTHENTICATION COMPLETO');
console.log('====================================');

class GestorSMSAuth {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/coinbitclub',
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        this.twilioClient = twilio(
            process.env.TWILIO_ACCOUNT_SID || 'AC_test_sid',
            process.env.TWILIO_AUTH_TOKEN || 'test_token'
        );

        this.configuracoes = {
            twilio: {
                phone_number: process.env.TWILIO_PHONE_NUMBER || '+12345678901',
                service_sid: process.env.TWILIO_VERIFY_SID || 'VA_test_service',
                webhook_url: process.env.TWILIO_WEBHOOK_URL || 'https://coinbitclub.railway.app/api/sms/webhook'
            },
            validacao: {
                codigo_length: 6,
                expiry_minutes: 10,
                max_tentativas: 3,
                throttle_minutes: 1,
                daily_limit: 10
            },
            paises: {
                brasil: { codigo: '+55', formato: /^\+55\d{10,11}$/ },
                eua: { codigo: '+1', formato: /^\+1\d{10}$/ },
                outros: { formato: /^\+\d{7,15}$/ }
            }
        };

        this.estatisticas = {
            sms_enviados: 0,
            sms_verificados: 0,
            tentativas_falhadas: 0,
            usuarios_verificados: 0
        };

        this.cache = {
            codigos_pendentes: new Map(),
            throttle_control: new Map(),
            daily_limits: new Map()
        };
    }

    // ========================================
    // 1. ENVIO DE SMS DE VERIFICAÇÃO
    // ========================================

    async enviarCodigoVerificacao(phone, tipo = 'registration', userId = null) {
        console.log(`📱 Enviando código de verificação para ${phone} (${tipo})`);

        try {
            // Validar e formatar número
            const phoneFormatado = await this.validarFormatarTelefone(phone);
            
            // Verificar throttling
            await this.verificarThrottling(phoneFormatado);

            // Verificar limite diário
            await this.verificarLimiteDiario(phoneFormatado);

            // Gerar código
            const codigo = this.gerarCodigoVerificacao();

            // Preparar mensagem
            const mensagem = this.criarMensagemSMS(codigo, tipo);

            // Enviar SMS via Twilio
            let resultadoEnvio;
            if (process.env.NODE_ENV === 'production') {
                resultadoEnvio = await this.enviarSMSTwilio(phoneFormatado, mensagem);
            } else {
                resultadoEnvio = await this.simularEnvioSMS(phoneFormatado, mensagem, codigo);
            }

            // Salvar no banco de dados
            await this.salvarCodigoVerificacao(phoneFormatado, codigo, tipo, userId, resultadoEnvio);

            // Atualizar cache e estatísticas
            this.atualizarCacheVerificacao(phoneFormatado, codigo, tipo);
            this.estatisticas.sms_enviados++;

            console.log(`✅ SMS enviado com sucesso para ${phoneFormatado}`);

            return {
                success: true,
                phone: phoneFormatado,
                message_sid: resultadoEnvio.sid,
                expiry: new Date(Date.now() + this.configuracoes.validacao.expiry_minutes * 60000)
            };

        } catch (error) {
            console.error('Erro ao enviar código de verificação:', error.message);
            this.estatisticas.tentativas_falhadas++;
            throw error;
        }
    }

    async enviarSMSTwilio(phone, mensagem) {
        return await this.twilioClient.messages.create({
            body: mensagem,
            from: this.configuracoes.twilio.phone_number,
            to: phone,
            statusCallback: this.configuracoes.twilio.webhook_url
        });
    }

    async simularEnvioSMS(phone, mensagem, codigo) {
        console.log(`🧪 [SIMULAÇÃO] SMS para ${phone}: ${mensagem}`);
        console.log(`🔑 [DESENVOLVIMENTO] Código: ${codigo}`);
        
        return {
            sid: `SM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            status: 'sent',
            to: phone,
            from: this.configuracoes.twilio.phone_number
        };
    }

    gerarCodigoVerificacao() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    criarMensagemSMS(codigo, tipo) {
        const mensagens = {
            registration: `CoinbitClub: Seu código de verificação é ${codigo}. Válido por 10 minutos. Não compartilhe este código.`,
            login: `CoinbitClub: Código de acesso: ${codigo}. Se você não solicitou, ignore esta mensagem.`,
            withdrawal: `CoinbitClub: Código para saque: ${codigo}. IMPORTANTE: Confirme apenas se você iniciou esta operação.`,
            password_reset: `CoinbitClub: Código para redefinir senha: ${codigo}. Válido por 10 minutos.`,
            security_alert: `CoinbitClub: Código de segurança: ${codigo}. Atividade suspeita detectada em sua conta.`
        };

        return mensagens[tipo] || mensagens.registration;
    }

    // ========================================
    // 2. VERIFICAÇÃO DE CÓDIGOS
    // ========================================

    async verificarCodigoSMS(phone, codigo, tipo = 'registration') {
        console.log(`🔍 Verificando código ${codigo} para ${phone}`);

        try {
            const phoneFormatado = await this.validarFormatarTelefone(phone);

            const client = await this.pool.connect();
            try {
                // Buscar código no banco
                const resultado = await client.query(`
                    SELECT id, code, user_id, type, attempts, created_at, verified_at
                    FROM sms_verifications 
                    WHERE phone = $1 
                    AND type = $2 
                    AND verified_at IS NULL
                    AND created_at > NOW() - INTERVAL '${this.configuracoes.validacao.expiry_minutes} minutes'
                    ORDER BY created_at DESC 
                    LIMIT 1;
                `, [phoneFormatado, tipo]);

                if (resultado.rows.length === 0) {
                    throw new Error('Código não encontrado ou expirado');
                }

                const verificacao = resultado.rows[0];

                // Verificar número de tentativas
                if (verificacao.attempts >= this.configuracoes.validacao.max_tentativas) {
                    throw new Error('Número máximo de tentativas excedido');
                }

                // Incrementar tentativas
                await client.query(`
                    UPDATE sms_verifications 
                    SET attempts = attempts + 1 
                    WHERE id = $1;
                `, [verificacao.id]);

                // Verificar código
                if (verificacao.code !== codigo) {
                    this.estatisticas.tentativas_falhadas++;
                    throw new Error('Código inválido');
                }

                // Marcar como verificado
                await client.query(`
                    UPDATE sms_verifications 
                    SET verified_at = NOW(), status = 'verified'
                    WHERE id = $1;
                `, [verificacao.id]);

                // Atualizar usuário se necessário
                if (verificacao.user_id) {
                    await client.query(`
                        UPDATE users 
                        SET phone_verified = true, phone_verified_at = NOW()
                        WHERE id = $1;
                    `, [verificacao.user_id]);
                }

                // Limpar cache
                this.cache.codigos_pendentes.delete(phoneFormatado);
                this.estatisticas.sms_verificados++;
                this.estatisticas.usuarios_verificados++;

                console.log(`✅ Código verificado com sucesso para ${phoneFormatado}`);

                return {
                    success: true,
                    verified: true,
                    user_id: verificacao.user_id,
                    verification_id: verificacao.id
                };

            } finally {
                client.release();
            }

        } catch (error) {
            console.error('Erro ao verificar código SMS:', error.message);
            throw error;
        }
    }

    // ========================================
    // 3. VALIDAÇÃO E FORMATAÇÃO
    // ========================================

    async validarFormatarTelefone(phone) {
        // Remover caracteres não numéricos exceto +
        let phoneClean = phone.replace(/[^\d+]/g, '');

        // Adicionar + se não tiver
        if (!phoneClean.startsWith('+')) {
            phoneClean = '+' + phoneClean;
        }

        // Detectar país e validar formato
        const pais = this.detectarPais(phoneClean);
        
        if (pais === 'brasil' && !this.configuracoes.paises.brasil.formato.test(phoneClean)) {
            throw new Error('Formato de telefone brasileiro inválido');
        } else if (pais === 'eua' && !this.configuracoes.paises.eua.formato.test(phoneClean)) {
            throw new Error('Formato de telefone americano inválido');
        } else if (!this.configuracoes.paises.outros.formato.test(phoneClean)) {
            throw new Error('Formato de telefone inválido');
        }

        return phoneClean;
    }

    detectarPais(phone) {
        if (phone.startsWith('+55')) return 'brasil';
        if (phone.startsWith('+1')) return 'eua';
        return 'outros';
    }

    // ========================================
    // 4. CONTROLES DE SEGURANÇA
    // ========================================

    async verificarThrottling(phone) {
        const agora = Date.now();
        const ultimoEnvio = this.cache.throttle_control.get(phone);

        if (ultimoEnvio && (agora - ultimoEnvio) < (this.configuracoes.validacao.throttle_minutes * 60000)) {
            const esperar = Math.ceil(((this.configuracoes.validacao.throttle_minutes * 60000) - (agora - ultimoEnvio)) / 1000);
            throw new Error(`Aguarde ${esperar} segundos antes de solicitar novo código`);
        }

        this.cache.throttle_control.set(phone, agora);
    }

    async verificarLimiteDiario(phone) {
        const hoje = new Date().toISOString().split('T')[0];
        const chave = `${phone}_${hoje}`;
        
        const contadorHoje = this.cache.daily_limits.get(chave) || 0;
        
        if (contadorHoje >= this.configuracoes.validacao.daily_limit) {
            throw new Error('Limite diário de SMS excedido');
        }

        this.cache.daily_limits.set(chave, contadorHoje + 1);
    }

    // ========================================
    // 5. NOTIFICAÇÕES ESPECIAIS
    // ========================================

    async enviarNotificacaoSeguranca(userId, tipo, dados = {}) {
        try {
            const client = await this.pool.connect();
            try {
                // Buscar dados do usuário
                const usuario = await client.query(`
                    SELECT phone, username, phone_verified 
                    FROM users 
                    WHERE id = $1 AND phone_verified = true;
                `, [userId]);

                if (usuario.rows.length === 0) {
                    console.log('Usuário não encontrado ou telefone não verificado');
                    return false;
                }

                const user = usuario.rows[0];
                const mensagem = this.criarMensagemSeguranca(tipo, user.username, dados);

                // Enviar SMS de notificação (sem código)
                let resultado;
                if (process.env.NODE_ENV === 'production') {
                    resultado = await this.twilioClient.messages.create({
                        body: mensagem,
                        from: this.configuracoes.twilio.phone_number,
                        to: user.phone
                    });
                } else {
                    console.log(`🚨 [NOTIFICAÇÃO] ${user.phone}: ${mensagem}`);
                    resultado = { sid: `NOTIF_${Date.now()}` };
                }

                // Registrar notificação
                await client.query(`
                    INSERT INTO sms_notifications (
                        user_id, phone, type, message, twilio_sid, sent_at
                    ) VALUES ($1, $2, $3, $4, $5, NOW());
                `, [userId, user.phone, tipo, mensagem, resultado.sid]);

                console.log(`🚨 Notificação de segurança enviada para ${user.username}`);
                return true;

            } finally {
                client.release();
            }

        } catch (error) {
            console.error('Erro ao enviar notificação de segurança:', error.message);
            return false;
        }
    }

    criarMensagemSeguranca(tipo, username, dados) {
        const mensagens = {
            login_suspeito: `CoinbitClub: Login suspeito detectado em sua conta (${username}). IP: ${dados.ip || 'desconhecido'}. Se não foi você, altere sua senha imediatamente.`,
            saque_iniciado: `CoinbitClub: Saque de ${dados.valor || '0'} ${dados.moeda || 'USD'} iniciado em sua conta. Se não foi você, cancele imediatamente no app.`,
            senha_alterada: `CoinbitClub: Senha de sua conta foi alterada. Se não foi você, contate o suporte imediatamente.`,
            novo_dispositivo: `CoinbitClub: Novo dispositivo acessou sua conta. Local: ${dados.location || 'desconhecido'}. Se não foi você, revise sua segurança.`,
            api_key_criada: `CoinbitClub: Nova chave API criada em sua conta. Se não foi você, revogue todas as chaves no painel de segurança.`
        };

        return mensagens[tipo] || `CoinbitClub: Atividade de segurança detectada em sua conta (${username}).`;
    }

    // ========================================
    // 6. WEBHOOK TWILIO
    // ========================================

    async processarWebhookTwilio(dadosWebhook) {
        try {
            const { MessageSid, MessageStatus, To, ErrorCode, ErrorMessage } = dadosWebhook;

            console.log(`📡 Webhook Twilio: ${MessageSid} - Status: ${MessageStatus}`);

            const client = await this.pool.connect();
            try {
                // Atualizar status no banco
                await client.query(`
                    UPDATE sms_verifications 
                    SET 
                        twilio_status = $1,
                        error_code = $2,
                        error_message = $3,
                        updated_at = NOW()
                    WHERE twilio_sid = $4;
                `, [MessageStatus, ErrorCode, ErrorMessage, MessageSid]);

                // Se houve erro, marcar como falhado
                if (MessageStatus === 'failed' || MessageStatus === 'undelivered') {
                    await client.query(`
                        UPDATE sms_verifications 
                        SET status = 'failed'
                        WHERE twilio_sid = $1;
                    `, [MessageSid]);
                }

            } finally {
                client.release();
            }

        } catch (error) {
            console.error('Erro ao processar webhook Twilio:', error.message);
        }
    }

    // ========================================
    // 7. UTILITÁRIOS E BANCO DE DADOS
    // ========================================

    async salvarCodigoVerificacao(phone, codigo, tipo, userId, resultadoTwilio) {
        const client = await this.pool.connect();
        try {
            await client.query(`
                INSERT INTO sms_verifications (
                    phone, code, type, user_id, twilio_sid, 
                    twilio_status, status, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW());
            `, [
                phone, codigo, tipo, userId, 
                resultadoTwilio.sid, resultadoTwilio.status
            ]);

        } finally {
            client.release();
        }
    }

    atualizarCacheVerificacao(phone, codigo, tipo) {
        this.cache.codigos_pendentes.set(phone, {
            codigo,
            tipo,
            timestamp: Date.now()
        });
    }

    // ========================================
    // 8. RELATÓRIOS E ESTATÍSTICAS
    // ========================================

    async obterRelatorioSMS(periodo = '7days') {
        const client = await this.pool.connect();
        try {
            const intervalos = {
                '24h': '24 hours',
                '7days': '7 days',
                '30days': '30 days'
            };

            const intervalo = intervalos[periodo] || '7 days';

            const estatisticas = await client.query(`
                SELECT 
                    type,
                    COUNT(*) as total_envios,
                    COUNT(CASE WHEN verified_at IS NOT NULL THEN 1 END) as verificados,
                    COUNT(CASE WHEN status = 'failed' THEN 1 END) as falhados,
                    AVG(attempts) as media_tentativas
                FROM sms_verifications 
                WHERE created_at >= NOW() - INTERVAL '${intervalo}'
                GROUP BY type;
            `);

            const custos = await client.query(`
                SELECT 
                    COUNT(*) as total_sms,
                    COUNT(*) * 0.0075 as custo_estimado_usd
                FROM sms_verifications 
                WHERE created_at >= NOW() - INTERVAL '${intervalo}'
                AND status != 'failed';
            `);

            return {
                periodo,
                estatisticas_por_tipo: estatisticas.rows,
                custos: custos.rows[0],
                estatisticas_sistema: this.estatisticas,
                cache_status: {
                    codigos_pendentes: this.cache.codigos_pendentes.size,
                    throttle_control: this.cache.throttle_control.size,
                    daily_limits: this.cache.daily_limits.size
                }
            };

        } finally {
            client.release();
        }
    }

    obterStatus() {
        return {
            twilio_configurado: !!process.env.TWILIO_ACCOUNT_SID,
            webhook_url: this.configuracoes.twilio.webhook_url,
            estatisticas: this.estatisticas,
            cache_sizes: {
                codigos_pendentes: this.cache.codigos_pendentes.size,
                throttle_control: this.cache.throttle_control.size,
                daily_limits: this.cache.daily_limits.size
            }
        };
    }

    // ========================================
    // 9. LIMPEZA E MANUTENÇÃO
    // ========================================

    async limparDadosExpirados() {
        const client = await this.pool.connect();
        try {
            // Remover verificações antigas (30 dias)
            const resultado = await client.query(`
                DELETE FROM sms_verifications 
                WHERE created_at < NOW() - INTERVAL '30 days';
            `);

            // Limpar cache diário antigo
            const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            for (const [chave] of this.cache.daily_limits) {
                if (!chave.includes(new Date().toISOString().split('T')[0])) {
                    this.cache.daily_limits.delete(chave);
                }
            }

            console.log(`🧹 Limpeza SMS: ${resultado.rowCount} registros antigos removidos`);

        } finally {
            client.release();
        }
    }
}

// Executar se for chamado diretamente
if (require.main === module) {
    const gestorSMS = new GestorSMSAuth();
    
    console.log('✅ Gestor SMS Authentication iniciado');
    console.log('📊 Status:', gestorSMS.obterStatus());
    
    // Limpeza automática diária
    setInterval(() => {
        gestorSMS.limparDadosExpirados();
    }, 24 * 60 * 60 * 1000);
}

module.exports = GestorSMSAuth;
