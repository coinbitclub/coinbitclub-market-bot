/**
 * 🔍 VERIFICADOR DE VARIÁVEIS DE AMBIENTE - RAILWAY
 * Verifica e testa conexões com APIs configuradas
 */

const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🔍 VERIFICADOR DE VARIÁVEIS DE AMBIENTE - RAILWAY');
console.log('='.repeat(60));

class EnvironmentChecker {
    constructor() {
        this.apiConnections = {};
        this.envVariables = {};
    }

    // Verificar todas as variáveis de ambiente relevantes
    verificarVariaveisAmbiente() {
        console.log('📋 1. VERIFICANDO VARIÁVEIS DE AMBIENTE\n');

        const variaveisEsperadas = [
            // OpenAI
            'OPENAI_API_KEY',
            'OPENAI_ORG_ID',
            
            // Twilio
            'TWILIO_ACCOUNT_SID',
            'TWILIO_AUTH_TOKEN',
            'TWILIO_PHONE_NUMBER',
            'TWILIO_WHATSAPP_NUMBER',
            
            // Stripe
            'STRIPE_SECRET_KEY',
            'STRIPE_PUBLISHABLE_KEY',
            'STRIPE_WEBHOOK_SECRET',
            
            // Bybit (pode estar nas variáveis)
            'BYBIT_API_KEY',
            'BYBIT_SECRET_KEY',
            'BYBIT_TESTNET',
            
            // Database
            'DATABASE_URL',
            'POSTGRES_URL',
            
            // JWT
            'JWT_SECRET',
            'JWT_EXPIRES_IN',
            
            // Email
            'SENDGRID_API_KEY',
            'SMTP_HOST',
            'SMTP_USER',
            'SMTP_PASS',
            
            // Outros
            'NODE_ENV',
            'PORT',
            'API_BASE_URL'
        ];

        variaveisEsperadas.forEach(varName => {
            const value = process.env[varName];
            if (value) {
                this.envVariables[varName] = {
                    exists: true,
                    value: value.length > 20 ? `${value.substring(0, 10)}...` : value,
                    length: value.length
                };
                console.log(`✅ ${varName}: ${this.envVariables[varName].value} (${value.length} chars)`);
            } else {
                this.envVariables[varName] = { exists: false };
                console.log(`❌ ${varName}: NÃO ENCONTRADA`);
            }
        });

        const encontradas = Object.values(this.envVariables).filter(v => v.exists).length;
        const total = variaveisEsperadas.length;
        
        console.log(`\n📊 Resumo: ${encontradas}/${total} variáveis encontradas (${Math.round(encontradas/total*100)}%)\n`);
    }

    // Testar conexão OpenAI
    async testarOpenAI() {
        console.log('🧠 2. TESTANDO CONEXÃO OPENAI');
        
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.log('❌ OPENAI_API_KEY não encontrada\n');
            return false;
        }

        try {
            const response = await fetch('https://api.openai.com/v1/models', {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log(`✅ OpenAI conectado com sucesso`);
                console.log(`📊 ${data.data?.length || 0} modelos disponíveis`);
                
                // Testar modelo específico
                const gpt4Available = data.data?.some(model => model.id.includes('gpt-4'));
                console.log(`🤖 GPT-4 disponível: ${gpt4Available ? 'Sim' : 'Não'}`);
                
                this.apiConnections.openai = { status: 'connected', models: data.data?.length || 0 };
                console.log('');
                return true;
            } else {
                console.log(`❌ Erro OpenAI: ${response.status} - ${response.statusText}\n`);
                return false;
            }

        } catch (error) {
            console.log(`❌ Erro de conexão OpenAI: ${error.message}\n`);
            return false;
        }
    }

    // Testar conexão Twilio
    async testarTwilio() {
        console.log('📞 3. TESTANDO CONEXÃO TWILIO');
        
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        
        if (!accountSid || !authToken) {
            console.log('❌ Credenciais Twilio não encontradas\n');
            return false;
        }

        try {
            const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
            
            const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
                headers: {
                    'Authorization': `Basic ${auth}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log(`✅ Twilio conectado com sucesso`);
                console.log(`📊 Account SID: ${data.sid}`);
                console.log(`💰 Status: ${data.status}`);
                
                this.apiConnections.twilio = { status: 'connected', account: data.sid };
                console.log('');
                return true;
            } else {
                console.log(`❌ Erro Twilio: ${response.status} - ${response.statusText}\n`);
                return false;
            }

        } catch (error) {
            console.log(`❌ Erro de conexão Twilio: ${error.message}\n`);
            return false;
        }
    }

    // Testar conexão Stripe
    async testarStripe() {
        console.log('💳 4. TESTANDO CONEXÃO STRIPE');
        
        const secretKey = process.env.STRIPE_SECRET_KEY;
        if (!secretKey) {
            console.log('❌ STRIPE_SECRET_KEY não encontrada\n');
            return false;
        }

        try {
            const response = await fetch('https://api.stripe.com/v1/payment_methods', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${secretKey}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log(`✅ Stripe conectado com sucesso`);
                console.log(`📊 API respondendo corretamente`);
                
                this.apiConnections.stripe = { status: 'connected' };
                console.log('');
                return true;
            } else {
                console.log(`❌ Erro Stripe: ${response.status} - ${response.statusText}\n`);
                return false;
            }

        } catch (error) {
            console.log(`❌ Erro de conexão Stripe: ${error.message}\n`);
            return false;
        }
    }

    // Testar chaves Bybit das variáveis de ambiente
    async testarBybitVariaveis() {
        console.log('🔗 5. TESTANDO BYBIT DAS VARIÁVEIS DE AMBIENTE');
        
        const apiKey = process.env.BYBIT_API_KEY;
        const secretKey = process.env.BYBIT_SECRET_KEY;
        
        if (!apiKey || !secretKey) {
            console.log('❌ Chaves Bybit não encontradas nas variáveis de ambiente');
            console.log('🔍 Verificando chaves do banco de dados...\n');
            return await this.testarBybitBanco();
        }

        console.log(`🔑 Testando chave: ${apiKey.substring(0, 8)}...`);
        
        try {
            const result = await this.validarChaveBybit(apiKey, secretKey);
            
            if (result.valid) {
                console.log(`✅ Bybit conectado com sucesso!`);
                console.log(`💰 Saldo: $${result.balance.toFixed(2)} USDT`);
                console.log(`💵 Disponível: $${result.availableBalance.toFixed(2)} USDT`);
                
                this.apiConnections.bybit = { 
                    status: 'connected', 
                    balance: result.balance,
                    source: 'environment_variables'
                };
                console.log('');
                return true;
            } else {
                console.log(`❌ Chave Bybit inválida: ${result.error}\n`);
                return false;
            }

        } catch (error) {
            console.log(`❌ Erro ao testar Bybit: ${error.message}\n`);
            return false;
        }
    }

    // Testar chaves Bybit do banco de dados
    async testarBybitBanco() {
        console.log('🗃️ TESTANDO CHAVES BYBIT DO BANCO DE DADOS');
        
        try {
            const chavesResult = await pool.query(`
                SELECT k.api_key, k.secret_key, k.is_active, 
                       u.name as user_name, u.email
                FROM user_api_keys k
                INNER JOIN users u ON k.user_id = u.id
                WHERE u.is_active = true
                AND k.is_active = true
                LIMIT 3
            `);

            const chaves = chavesResult.rows;
            
            if (chaves.length === 0) {
                console.log('❌ Nenhuma chave ativa encontrada no banco\n');
                return false;
            }

            console.log(`🔑 Encontradas ${chaves.length} chaves ativas no banco`);
            
            let conexoesValidas = 0;
            
            for (const chave of chaves) {
                console.log(`\n🔄 Testando chave de ${chave.user_name}:`);
                console.log(`   📧 Email: ${chave.email}`);
                console.log(`   🔑 API Key: ${chave.api_key.substring(0, 8)}...`);
                
                const result = await this.validarChaveBybit(chave.api_key, chave.secret_key);
                
                if (result.valid) {
                    console.log(`   ✅ Chave válida! Saldo: $${result.balance.toFixed(2)} USDT`);
                    conexoesValidas++;
                } else {
                    console.log(`   ❌ Chave inválida: ${result.error}`);
                }
                
                // Delay para evitar rate limiting
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            this.apiConnections.bybit = { 
                status: conexoesValidas > 0 ? 'connected' : 'failed',
                validKeys: conexoesValidas,
                totalKeys: chaves.length,
                source: 'database'
            };

            console.log(`\n📊 Resultado: ${conexoesValidas}/${chaves.length} chaves válidas\n`);
            return conexoesValidas > 0;

        } catch (error) {
            console.log(`❌ Erro ao acessar banco: ${error.message}\n`);
            return false;
        }
    }

    // Validar chave Bybit individual
    async validarChaveBybit(apiKey, secretKey) {
        try {
            const timestamp = Date.now().toString();
            const recvWindow = '5000';
            
            // Parâmetros para endpoint de saldo
            const params = `api_key=${apiKey}&recv_window=${recvWindow}&timestamp=${timestamp}`;
            const signature = crypto.createHmac('sha256', secretKey)
                                   .update(params)
                                   .digest('hex');
            
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
                const walletBalance = data.result?.list?.[0]?.coin || [];
                const usdtBalance = walletBalance.find(coin => coin.coin === 'USDT');
                
                return {
                    valid: true,
                    balance: usdtBalance ? parseFloat(usdtBalance.walletBalance) : 0,
                    availableBalance: usdtBalance ? parseFloat(usdtBalance.availableBalance) : 0
                };
            } else {
                return {
                    valid: false,
                    error: data.retMsg || 'Erro na validação'
                };
            }

        } catch (error) {
            return {
                valid: false,
                error: `Erro de conexão: ${error.message}`
            };
        }
    }

    // Gerar relatório final
    gerarRelatorioFinal() {
        console.log('📋 6. RELATÓRIO FINAL DAS CONEXÕES');
        console.log('='.repeat(60));

        const conexoesAtivas = Object.keys(this.apiConnections).filter(
            key => this.apiConnections[key].status === 'connected'
        ).length;

        console.log(`🎯 RESUMO GERAL:`);
        console.log(`   Conexões ativas: ${conexoesAtivas}/4 possíveis`);
        console.log(`   Taxa de sucesso: ${Math.round(conexoesAtivas/4*100)}%\n`);

        console.log(`🔗 STATUS DAS INTEGRAÇÕES:`);
        
        // OpenAI
        const openai = this.apiConnections.openai;
        if (openai) {
            console.log(`   🧠 OpenAI: ✅ CONECTADO (${openai.models} modelos)`);
        } else {
            console.log(`   🧠 OpenAI: ❌ NÃO CONECTADO`);
        }

        // Twilio
        const twilio = this.apiConnections.twilio;
        if (twilio) {
            console.log(`   📞 Twilio: ✅ CONECTADO (${twilio.account})`);
        } else {
            console.log(`   📞 Twilio: ❌ NÃO CONECTADO`);
        }

        // Stripe
        const stripe = this.apiConnections.stripe;
        if (stripe) {
            console.log(`   💳 Stripe: ✅ CONECTADO`);
        } else {
            console.log(`   💳 Stripe: ❌ NÃO CONECTADO`);
        }

        // Bybit
        const bybit = this.apiConnections.bybit;
        if (bybit && bybit.status === 'connected') {
            if (bybit.source === 'environment_variables') {
                console.log(`   🔗 Bybit: ✅ CONECTADO (variáveis ambiente - $${bybit.balance.toFixed(2)} USDT)`);
            } else {
                console.log(`   🔗 Bybit: ✅ CONECTADO (banco - ${bybit.validKeys}/${bybit.totalKeys} chaves válidas)`);
            }
        } else {
            console.log(`   🔗 Bybit: ❌ NÃO CONECTADO`);
        }

        console.log(`\n🚀 PRÓXIMOS PASSOS:`);
        
        if (conexoesAtivas === 0) {
            console.log(`   🔴 CRÍTICO: Nenhuma integração funcionando`);
            console.log(`   📝 Verificar todas as variáveis de ambiente no Railway`);
        } else if (conexoesAtivas < 3) {
            console.log(`   🟡 PARCIAL: Algumas integrações funcionando`);
            console.log(`   📝 Configurar integrações faltantes`);
        } else {
            console.log(`   ✅ EXCELENTE: Maioria das integrações funcionando`);
            console.log(`   🚀 Sistema pronto para operação completa`);
        }

        console.log(`\n🎉 VERIFICAÇÃO CONCLUÍDA`);
    }

    // Executar verificação completa
    async executarVerificacaoCompleta() {
        try {
            this.verificarVariaveisAmbiente();
            await this.testarOpenAI();
            await this.testarTwilio();
            await this.testarStripe();
            await this.testarBybitVariaveis();
            this.gerarRelatorioFinal();
            
        } catch (error) {
            console.error('❌ Erro durante verificação:', error.message);
        } finally {
            await pool.end();
        }
    }
}

// Executar verificação
const checker = new EnvironmentChecker();
checker.executarVerificacaoCompleta();
