/**
 * 📱 GESTOR DE AUTENTICAÇÃO TWILIO SMS
 * Sistema completo de OTP e validação por SMS
 */

const { Pool } = require('pg');
const twilio = require('twilio');
const crypto = require('crypto');

console.log('📱 GESTOR AUTENTICAÇÃO TWILIO - SMS/OTP');
console.log('======================================');

class GestorAuthTwilio {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/coinbitclub',
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        // Configurações Twilio
        this.twilioConfig = {
            accountSid: process.env.TWILIO_ACCOUNT_SID,
            authToken: process.env.TWILIO_AUTH_TOKEN,
            phoneNumber: process.env.TWILIO_PHONE_NUMBER,
            serviceSid: process.env.TWILIO_VERIFY_SERVICE_SID
        };

        // Inicializar cliente Twilio
        this.twilioClient = null;
        this.inicializarTwilio();

        // Configurações de OTP
        this.otpConfig = {
            length: 6,                    // Código 6 dígitos
            expiry: 300,                  // 5 minutos expiração
            maxAttempts: 3,               // Máximo 3 tentativas
            cooldown: 60,                 // 1 minuto entre envios
            dailyLimit: 10,               // Máximo 10 SMS por dia por número
            blacklistAfter: 5             // Blacklist após 5 falhas
        };

        // Configurações de segurança
        this.security = {
            rateLimit: {
                requests: 5,              // 5 tentativas
                window: 900,              // em 15 minutos
                blockTime: 3600           // bloqueio 1 hora
            },
            encryption: {
                algorithm: 'aes-256-gcm',
                keyLength: 32
            }
        };

        this.estatisticas = {
            sms_enviados: 0,
            verificacoes_sucesso: 0,
            verificacoes_falha: 0,
            numeros_bloqueados: 0
        };

        this.iniciarLimpezaPeriodica();
    }

    async log(nivel, mensagem, dados = null) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${nivel.toUpperCase()}: ${mensagem}`);
        
        if (dados) {
            // Mascarar dados sensíveis no log
            const dadosSeguro = this.mascararDadosSensiveis(dados);
            console.log('   Dados:', JSON.stringify(dadosSeguro, null, 2));
        }

        // Salvar no banco para auditoria
        try {
            const client = await this.pool.connect();
            await client.query(`
                INSERT INTO sms_logs (timestamp, level, message, data, created_at)
                VALUES ($1, $2, $3, $4, NOW());
            `, [timestamp, nivel, mensagem, JSON.stringify(dados)]);
            client.release();
        } catch (error) {
            // Não quebrar por erro de log
        }
    }

    inicializarTwilio() {
        try {
            if (!this.twilioConfig.accountSid || !this.twilioConfig.authToken) {
                console.warn('⚠️  Credenciais Twilio não configuradas - modo simulação');
                this.twilioClient = null;
                return;
            }

            this.twilioClient = twilio(
                this.twilioConfig.accountSid,
                this.twilioConfig.authToken
            );

            console.log('✅ Cliente Twilio inicializado');

        } catch (error) {
            console.error('❌ Erro ao inicializar Twilio:', error.message);
            this.twilioClient = null;
        }
    }

    // ========================================
    // 1. ENVIO DE SMS/OTP
    // ========================================

    async enviarCodigoVerificacao(phoneNumber, userId = null, tipoOperacao = 'login') {
        await this.log('info', `Enviando código de verificação`, {
            phone: this.mascararTelefone(phoneNumber),
            user_id: userId,
            tipo: tipoOperacao
        });

        try {
            // 1. Validar número de telefone
            const numeroLimpo = this.limparNumeroTelefone(phoneNumber);
            this.validarNumeroTelefone(numeroLimpo);

            // 2. Verificar rate limiting
            await this.verificarRateLimit(numeroLimpo);

            // 3. Verificar blacklist
            await this.verificarBlacklist(numeroLimpo);

            // 4. Verificar limite diário
            await this.verificarLimiteDiario(numeroLimpo);

            // 5. Gerar código OTP
            const codigoOTP = this.gerarCodigoOTP();

            // 6. Salvar no banco
            const otpId = await this.salvarOTP(numeroLimpo, codigoOTP, userId, tipoOperacao);

            // 7. Enviar SMS
            const resultadoEnvio = await this.enviarSMS(numeroLimpo, codigoOTP, tipoOperacao);

            // 8. Atualizar registro com resultado
            await this.atualizarStatusEnvio(otpId, resultadoEnvio);

            this.estatisticas.sms_enviados++;

            await this.log('info', `Código enviado com sucesso`, {
                otp_id: otpId,
                phone: this.mascararTelefone(numeroLimpo),
                provider_id: resultadoEnvio.sid || 'simulado'
            });

            return {
                sucesso: true,
                otp_id: otpId,
                phone_masked: this.mascararTelefone(numeroLimpo),
                expires_in: this.otpConfig.expiry,
                provider_id: resultadoEnvio.sid || null,
                simulado: !this.twilioClient
            };

        } catch (error) {
            await this.log('error', 'Erro no envio de código', {
                phone: this.mascararTelefone(phoneNumber),
                erro: error.message
            });
            throw error;
        }
    }

    async enviarSMS(phoneNumber, codigo, tipoOperacao) {
        const mensagem = this.criarMensagemSMS(codigo, tipoOperacao);

        if (!this.twilioClient) {
            // Modo simulação para desenvolvimento
            await this.log('info', 'SMS simulado (Twilio não configurado)', {
                phone: this.mascararTelefone(phoneNumber),
                codigo: '***' + codigo.slice(-2),
                mensagem
            });

            return {
                sid: `sim_${Date.now()}`,
                status: 'delivered',
                simulado: true
            };
        }

        try {
            const message = await this.twilioClient.messages.create({
                body: mensagem,
                from: this.twilioConfig.phoneNumber,
                to: phoneNumber
            });

            await this.log('info', 'SMS enviado via Twilio', {
                sid: message.sid,
                status: message.status,
                phone: this.mascararTelefone(phoneNumber)
            });

            return {
                sid: message.sid,
                status: message.status,
                simulado: false
            };

        } catch (error) {
            await this.log('error', 'Erro no envio via Twilio', {
                phone: this.mascararTelefone(phoneNumber),
                erro: error.message,
                code: error.code
            });
            throw new Error(`Falha no envio SMS: ${error.message}`);
        }
    }

    // ========================================
    // 2. VERIFICAÇÃO DE CÓDIGOS
    // ========================================

    async verificarCodigoOTP(phoneNumber, codigo, otpId = null) {
        await this.log('info', `Verificando código OTP`, {
            phone: this.mascararTelefone(phoneNumber),
            otp_id: otpId
        });

        const client = await this.pool.connect();
        try {
            const numeroLimpo = this.limparNumeroTelefone(phoneNumber);

            // Buscar OTP no banco
            let query = `
                SELECT * FROM sms_otp 
                WHERE phone_number = $1 AND status = 'sent' 
                AND expires_at > NOW()
                ORDER BY created_at DESC 
                LIMIT 1;
            `;
            let params = [numeroLimpo];

            if (otpId) {
                query = `
                    SELECT * FROM sms_otp 
                    WHERE id = $1 AND phone_number = $2 AND status = 'sent'
                    AND expires_at > NOW();
                `;
                params = [otpId, numeroLimpo];
            }

            const resultado = await client.query(query, params);

            if (resultado.rows.length === 0) {
                await this.registrarTentativaFalha(numeroLimpo, 'OTP não encontrado ou expirado');
                throw new Error('Código não encontrado ou expirado');
            }

            const otp = resultado.rows[0];

            // Verificar tentativas
            if (otp.attempts >= this.otpConfig.maxAttempts) {
                await this.bloquearOTP(otp.id, 'Máximo de tentativas excedido');
                throw new Error('Máximo de tentativas excedido');
            }

            // Descriptografar e verificar código
            const codigoArmazenado = this.descriptografarCodigo(otp.code_encrypted);
            
            // Incrementar tentativas
            await client.query(`
                UPDATE sms_otp SET attempts = attempts + 1, updated_at = NOW()
                WHERE id = $1;
            `, [otp.id]);

            if (codigo !== codigoArmazenado) {
                await this.registrarTentativaFalha(numeroLimpo, 'Código incorreto');
                this.estatisticas.verificacoes_falha++;
                throw new Error('Código incorreto');
            }

            // Marcar como verificado
            await client.query(`
                UPDATE sms_otp 
                SET status = 'verified', verified_at = NOW()
                WHERE id = $1;
            `, [otp.id]);

            // Limpar outros códigos pendentes do mesmo número
            await client.query(`
                UPDATE sms_otp 
                SET status = 'expired'
                WHERE phone_number = $1 AND status = 'sent' AND id != $2;
            `, [numeroLimpo, otp.id]);

            this.estatisticas.verificacoes_sucesso++;

            await this.log('info', `Código verificado com sucesso`, {
                otp_id: otp.id,
                phone: this.mascararTelefone(numeroLimpo),
                user_id: otp.user_id,
                tipo: otp.operation_type
            });

            return {
                sucesso: true,
                otp_id: otp.id,
                user_id: otp.user_id,
                operation_type: otp.operation_type,
                verified_at: new Date().toISOString()
            };

        } catch (error) {
            await this.log('error', 'Erro na verificação de código', {
                phone: this.mascararTelefone(phoneNumber),
                erro: error.message
            });
            throw error;
        } finally {
            client.release();
        }
    }

    // ========================================
    // 3. VALIDAÇÕES E SEGURANÇA
    // ========================================

    async verificarRateLimit(phoneNumber) {
        const client = await this.pool.connect();
        try {
            const resultado = await client.query(`
                SELECT COUNT(*) as tentativas
                FROM sms_otp 
                WHERE phone_number = $1 
                AND created_at > NOW() - INTERVAL '${this.security.rateLimit.window} seconds';
            `, [phoneNumber]);

            const tentativas = parseInt(resultado.rows[0].tentativas);

            if (tentativas >= this.security.rateLimit.requests) {
                throw new Error('Muitas tentativas. Tente novamente em 15 minutos.');
            }

        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    }

    async verificarBlacklist(phoneNumber) {
        const client = await this.pool.connect();
        try {
            const resultado = await client.query(`
                SELECT * FROM phone_blacklist 
                WHERE phone_number = $1 AND status = 'active';
            `, [phoneNumber]);

            if (resultado.rows.length > 0) {
                const blacklist = resultado.rows[0];
                throw new Error(`Número bloqueado: ${blacklist.reason}`);
            }

        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    }

    async verificarLimiteDiario(phoneNumber) {
        const client = await this.pool.connect();
        try {
            const resultado = await client.query(`
                SELECT COUNT(*) as sms_hoje
                FROM sms_otp 
                WHERE phone_number = $1 
                AND DATE(created_at) = CURRENT_DATE;
            `, [phoneNumber]);

            const smsHoje = parseInt(resultado.rows[0].sms_hoje);

            if (smsHoje >= this.otpConfig.dailyLimit) {
                throw new Error('Limite diário de SMS excedido');
            }

        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    }

    async registrarTentativaFalha(phoneNumber, motivo) {
        const client = await this.pool.connect();
        try {
            // Contar falhas recentes
            const falhas = await client.query(`
                SELECT COUNT(*) as total_falhas
                FROM sms_failures 
                WHERE phone_number = $1 
                AND created_at > NOW() - INTERVAL '1 hour';
            `, [phoneNumber]);

            const totalFalhas = parseInt(falhas.rows[0].total_falhas);

            // Registrar nova falha
            await client.query(`
                INSERT INTO sms_failures (phone_number, reason, created_at)
                VALUES ($1, $2, NOW());
            `, [phoneNumber, motivo]);

            // Blacklist após muitas falhas
            if (totalFalhas >= this.otpConfig.blacklistAfter) {
                await this.adicionarBlacklist(phoneNumber, 'Muitas tentativas falhadas');
            }

        } catch (error) {
            await this.log('error', 'Erro ao registrar falha', { erro: error.message });
        } finally {
            client.release();
        }
    }

    async adicionarBlacklist(phoneNumber, motivo) {
        const client = await this.pool.connect();
        try {
            await client.query(`
                INSERT INTO phone_blacklist (phone_number, reason, status, created_at)
                VALUES ($1, $2, 'active', NOW())
                ON CONFLICT (phone_number) 
                DO UPDATE SET reason = $2, created_at = NOW(), status = 'active';
            `, [phoneNumber, motivo]);

            this.estatisticas.numeros_bloqueados++;

            await this.log('warning', `Número adicionado à blacklist`, {
                phone: this.mascararTelefone(phoneNumber),
                motivo
            });

        } catch (error) {
            await this.log('error', 'Erro ao adicionar blacklist', { erro: error.message });
        } finally {
            client.release();
        }
    }

    // ========================================
    // 4. UTILITÁRIOS
    // ========================================

    limparNumeroTelefone(phoneNumber) {
        // Remover caracteres não numéricos
        let numero = phoneNumber.replace(/\D/g, '');
        
        // Adicionar código do país se não tiver
        if (numero.length === 11 && numero.startsWith('0')) {
            numero = '55' + numero.slice(1);
        } else if (numero.length === 10) {
            numero = '55' + numero;
        } else if (numero.length === 11 && !numero.startsWith('55')) {
            numero = '55' + numero;
        }
        
        // Formato internacional
        return '+' + numero;
    }

    validarNumeroTelefone(phoneNumber) {
        // Validar formato brasileiro
        const regex = /^\+55\d{10,11}$/;
        if (!regex.test(phoneNumber)) {
            throw new Error('Número de telefone inválido');
        }
    }

    mascararTelefone(phoneNumber) {
        if (!phoneNumber) return '***';
        const numero = phoneNumber.replace(/\D/g, '');
        if (numero.length >= 8) {
            return numero.slice(0, 2) + '***' + numero.slice(-2);
        }
        return '***';
    }

    mascararDadosSensiveis(dados) {
        const copia = { ...dados };
        
        if (copia.phone) {
            copia.phone = this.mascararTelefone(copia.phone);
        }
        
        if (copia.codigo) {
            copia.codigo = '***' + copia.codigo.slice(-2);
        }
        
        if (copia.otp) {
            copia.otp = '***' + copia.otp.slice(-2);
        }
        
        return copia;
    }

    gerarCodigoOTP() {
        // Gerar código numérico de 6 dígitos
        const min = Math.pow(10, this.otpConfig.length - 1);
        const max = Math.pow(10, this.otpConfig.length) - 1;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    criptografarCodigo(codigo) {
        const algorithm = this.security.encryption.algorithm;
        const key = crypto.randomBytes(this.security.encryption.keyLength);
        const iv = crypto.randomBytes(16);
        
        const cipher = crypto.createCipher(algorithm, key);
        let encrypted = cipher.update(codigo.toString(), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return {
            encrypted,
            key: key.toString('hex'),
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex')
        };
    }

    descriptografarCodigo(dadosCriptografados) {
        try {
            const { encrypted, key, iv, authTag } = JSON.parse(dadosCriptografados);
            const algorithm = this.security.encryption.algorithm;
            
            const decipher = crypto.createDecipher(algorithm, Buffer.from(key, 'hex'));
            decipher.setAuthTag(Buffer.from(authTag, 'hex'));
            
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            throw new Error('Erro na descriptografia do código');
        }
    }

    criarMensagemSMS(codigo, tipoOperacao) {
        const mensagens = {
            'login': `CoinbitClub: Seu código de login é ${codigo}. Válido por ${this.otpConfig.expiry/60} minutos.`,
            'register': `CoinbitClub: Código de cadastro ${codigo}. Não compartilhe este código.`,
            'withdrawal': `CoinbitClub: Código para saque ${codigo}. Confirme apenas se solicitou esta operação.`,
            'password_reset': `CoinbitClub: Código para redefinir senha ${codigo}. Válido por ${this.otpConfig.expiry/60} minutos.`,
            'trading': `CoinbitClub: Código para operação ${codigo}. Confirme para autorizar.`
        };

        return mensagens[tipoOperacao] || `CoinbitClub: Seu código é ${codigo}. Válido por ${this.otpConfig.expiry/60} minutos.`;
    }

    async salvarOTP(phoneNumber, codigo, userId, tipoOperacao) {
        const client = await this.pool.connect();
        try {
            const codigoCriptografado = this.criptografarCodigo(codigo);
            const expiresAt = new Date(Date.now() + (this.otpConfig.expiry * 1000));

            const resultado = await client.query(`
                INSERT INTO sms_otp (
                    phone_number, user_id, operation_type, code_encrypted,
                    expires_at, status, created_at
                ) VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
                RETURNING id;
            `, [
                phoneNumber,
                userId,
                tipoOperacao,
                JSON.stringify(codigoCriptografado),
                expiresAt
            ]);

            return resultado.rows[0].id;

        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    }

    async atualizarStatusEnvio(otpId, resultadoEnvio) {
        const client = await this.pool.connect();
        try {
            await client.query(`
                UPDATE sms_otp 
                SET status = 'sent', provider_id = $1, provider_status = $2
                WHERE id = $3;
            `, [resultadoEnvio.sid, resultadoEnvio.status, otpId]);

        } catch (error) {
            await this.log('error', 'Erro ao atualizar status de envio', { erro: error.message });
        } finally {
            client.release();
        }
    }

    async bloquearOTP(otpId, motivo) {
        const client = await this.pool.connect();
        try {
            await client.query(`
                UPDATE sms_otp 
                SET status = 'blocked', blocked_reason = $1
                WHERE id = $2;
            `, [motivo, otpId]);

        } catch (error) {
            await this.log('error', 'Erro ao bloquear OTP', { erro: error.message });
        } finally {
            client.release();
        }
    }

    iniciarLimpezaPeriodica() {
        // Limpar registros expirados a cada hora
        setInterval(async () => {
            await this.limparRegistrosExpirados();
        }, 3600000); // 1 hora
    }

    async limparRegistrosExpirados() {
        const client = await this.pool.connect();
        try {
            // Limpar OTPs expirados
            const otpsLimpos = await client.query(`
                UPDATE sms_otp 
                SET status = 'expired'
                WHERE status IN ('pending', 'sent') 
                AND expires_at < NOW();
            `);

            // Limpar logs antigos (manter 30 dias)
            const logsLimpos = await client.query(`
                DELETE FROM sms_logs 
                WHERE created_at < NOW() - INTERVAL '30 days';
            `);

            if (otpsLimpos.rowCount > 0 || logsLimpos.rowCount > 0) {
                await this.log('info', 'Limpeza periódica executada', {
                    otps_expirados: otpsLimpos.rowCount,
                    logs_removidos: logsLimpos.rowCount
                });
            }

        } catch (error) {
            await this.log('error', 'Erro na limpeza periódica', { erro: error.message });
        } finally {
            client.release();
        }
    }

    async obterEstatisticas() {
        return {
            ...this.estatisticas,
            configuracoes: {
                otp_expiry: this.otpConfig.expiry,
                max_attempts: this.otpConfig.maxAttempts,
                daily_limit: this.otpConfig.dailyLimit
            },
            twilio_ativo: !!this.twilioClient,
            timestamp: new Date().toISOString()
        };
    }

    async parar() {
        console.log('🛑 Parando Gestor de Autenticação...');
        await this.pool.end();
        console.log('✅ Gestor de Autenticação parado');
    }
}

// Executar se for chamado diretamente
if (require.main === module) {
    const gestor = new GestorAuthTwilio();
    
    console.log('📱 Gestor de Autenticação Twilio ativo...');
    console.log('📊 Configurações OTP:', gestor.otpConfig);

    // Cleanup graceful
    process.on('SIGINT', async () => {
        await gestor.parar();
        process.exit(0);
    });
}

module.exports = GestorAuthTwilio;
