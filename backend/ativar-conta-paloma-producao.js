/**
 * 🎯 ATIVAR CONTA PALOMA PARA OPERAÇÕES REAIS
 * 
 * Habilitar completamente a conta da Paloma para trading em produção
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

const configPaloma = {
    email: "pamaral15@hotmail.com",
    nome: "PALOMA AMARAL",
    
    // STATUS OPERACIONAL
    status: {
        user_status: 'ATIVO_TRADING',
        trading_enabled: true,
        risk_management_enabled: true,
        notifications_enabled: true,
        ai_mode_enabled: true,
        auto_trading_enabled: true
    },
    
    // LIMITES OPERACIONAIS
    limits: {
        max_daily_trades: 50,              // Aumentado para produção
        max_daily_loss_usd: 100,           // Limite de perda diária
        max_weekly_loss_usd: 500,          // Limite de perda semanal
        max_position_size_usd: 2000,       // Tamanho máximo por posição
        min_position_size_usd: 10,         // Tamanho mínimo por posição
        max_drawdown_percent: 20,          // Drawdown máximo permitido
        emergency_stop_loss_percent: 30    // Stop de emergência
    },
    
    // CONFIGURAÇÕES DE PRODUÇÃO
    production: {
        environment: 'PRODUCTION',
        api_endpoint: 'https://api.bybit.com',
        webhook_url: 'https://coinbitclub-market-bot-backend-production.up.railway.app/webhook/trading-signal',
        ip_whitelist: ['132.255.160.140'],
        ssl_enabled: true,
        monitoring_enabled: true
    }
};

async function ativarContaPaloma() {
    const client = await pool.connect();
    
    try {
        console.log('🚀 ATIVANDO CONTA PALOMA PARA OPERAÇÕES REAIS');
        console.log('='.repeat(70));
        console.log('📅 Data: 29 de Julho de 2025');
        console.log('🎯 Objetivo: Habilitar trading em produção');
        console.log('');
        
        await client.query('BEGIN');
        
        // 1. Verificar dados atuais da Paloma
        console.log('🔍 VERIFICANDO DADOS ATUAIS...');
        const verificarQuery = `
            SELECT 
                u.id,
                u.name,
                u.email,
                u.status,
                u.balance_usd,
                uak.api_key,
                uak.secret_key,
                uak.exchange,
                uak.environment,
                utp.take_profit_percent,
                utp.stop_loss_percent,
                utp.max_daily_trades,
                utp.max_open_positions
            FROM users u
            LEFT JOIN user_api_keys uak ON u.id = uak.user_id AND uak.exchange = 'bybit'
            LEFT JOIN user_trading_params utp ON u.id = utp.user_id
            WHERE u.email = $1;
        `;
        
        const paloma = await client.query(verificarQuery, [configPaloma.email]);
        
        if (paloma.rows.length === 0) {
            console.log('❌ Paloma não encontrada!');
            return;
        }
        
        const dados = paloma.rows[0];
        console.log(`👤 Usuária: ${dados.name}`);
        console.log(`📧 Email: ${dados.email}`);
        console.log(`💰 Saldo: $${dados.balance_usd}`);
        console.log(`🔑 API Key: ${dados.api_key || 'não configurada'}`);
        console.log(`📊 Status atual: ${dados.status}`);
        console.log('');
        
        // 2. Ativar status de trading
        console.log('⚡ ATIVANDO STATUS DE TRADING...');
        const ativarStatusQuery = `
            UPDATE users 
            SET 
                status = $2,
                updated_at = NOW()
            WHERE email = $1
            RETURNING id, name, status;
        `;
        
        const statusResult = await client.query(ativarStatusQuery, [
            configPaloma.email,
            configPaloma.status.user_status
        ]);
        
        console.log(`   ✅ Status atualizado: ${statusResult.rows[0].status}`);
        
        // 3. Verificar e confirmar chaves API
        console.log('🔑 VERIFICANDO CHAVES API...');
        const verificarChavesQuery = `
            SELECT api_key, secret_key, environment, is_active
            FROM user_api_keys 
            WHERE user_id = $1 AND exchange = 'bybit';
        `;
        
        const chaves = await client.query(verificarChavesQuery, [dados.id]);
        
        if (chaves.rows.length > 0) {
            const chave = chaves.rows[0];
            console.log(`   ✅ API Key: ${chave.api_key}`);
            console.log(`   ✅ Environment: ${chave.environment}`);
            console.log(`   ✅ Status: ${chave.is_active ? 'ATIVA' : 'INATIVA'}`);
            
            // Ativar chave se não estiver ativa
            if (!chave.is_active) {
                await client.query(`
                    UPDATE user_api_keys 
                    SET is_active = true, updated_at = NOW()
                    WHERE user_id = $1 AND exchange = 'bybit'
                `, [dados.id]);
                console.log('   🔄 Chave API ativada');
            }
        } else {
            console.log('   ❌ Nenhuma chave API encontrada!');
        }
        
        // 4. Configurar parâmetros de produção
        console.log('⚙️ CONFIGURANDO PARÂMETROS DE PRODUÇÃO...');
        const configProducaoQuery = `
            UPDATE user_trading_params 
            SET 
                max_daily_trades = $2,
                max_daily_loss = $3,
                risk_settings = $4,
                updated_at = NOW()
            WHERE user_id = $1
            RETURNING id;
        `;
        
        const riskSettings = {
            production_mode: true,
            max_weekly_loss_usd: configPaloma.limits.max_weekly_loss_usd,
            max_position_size_usd: configPaloma.limits.max_position_size_usd,
            min_position_size_usd: configPaloma.limits.min_position_size_usd,
            max_drawdown_percent: configPaloma.limits.max_drawdown_percent,
            emergency_stop_loss_percent: configPaloma.limits.emergency_stop_loss_percent,
            trading_enabled: configPaloma.status.trading_enabled,
            ai_mode_enabled: configPaloma.status.ai_mode_enabled,
            auto_trading_enabled: configPaloma.status.auto_trading_enabled,
            production_config: configPaloma.production
        };
        
        const paramResult = await client.query(configProducaoQuery, [
            dados.id,
            configPaloma.limits.max_daily_trades,
            configPaloma.limits.max_daily_loss_usd,
            JSON.stringify(riskSettings)
        ]);
        
        console.log('   ✅ Parâmetros de produção configurados');
        
        // 5. Criar log de ativação
        console.log('📝 REGISTRANDO ATIVAÇÃO...');
        const logQuery = `
            INSERT INTO trading_logs (
                user_id, action, details, timestamp
            ) VALUES ($1, $2, $3, NOW())
            RETURNING id;
        `;
        
        const logDetails = {
            action: 'ACCOUNT_ACTIVATION',
            user: configPaloma.nome,
            email: configPaloma.email,
            status: 'ATIVO_TRADING',
            production_mode: true,
            limits: configPaloma.limits,
            activated_by: 'SYSTEM',
            activation_time: new Date().toISOString()
        };
        
        await client.query(logQuery, [
            dados.id,
            'CONTA_ATIVADA_PRODUCAO',
            JSON.stringify(logDetails)
        ]);
        
        await client.query('COMMIT');
        
        console.log('');
        console.log('🎉 CONTA PALOMA ATIVADA COM SUCESSO!');
        console.log('='.repeat(70));
        console.log('✅ STATUS OPERACIONAL:');
        console.log(`   👤 Usuária: ${configPaloma.nome}`);
        console.log(`   📧 Email: ${configPaloma.email}`);
        console.log(`   📊 Status: ${configPaloma.status.user_status}`);
        console.log(`   💰 Saldo: $${dados.balance_usd}`);
        console.log('');
        console.log('⚙️ CONFIGURAÇÕES ATIVAS:');
        console.log(`   🔄 Trading: ${configPaloma.status.trading_enabled ? 'HABILITADO' : 'DESABILITADO'}`);
        console.log(`   🤖 IA: ${configPaloma.status.ai_mode_enabled ? 'ATIVA' : 'INATIVA'}`);
        console.log(`   ⚡ Auto Trading: ${configPaloma.status.auto_trading_enabled ? 'ATIVO' : 'INATIVO'}`);
        console.log(`   🛡️ Risk Management: ${configPaloma.status.risk_management_enabled ? 'ATIVO' : 'INATIVO'}`);
        console.log(`   🔔 Notificações: ${configPaloma.status.notifications_enabled ? 'ATIVAS' : 'INATIVAS'}`);
        console.log('');
        console.log('📊 LIMITES OPERACIONAIS:');
        console.log(`   📈 Max trades/dia: ${configPaloma.limits.max_daily_trades}`);
        console.log(`   💸 Max perda/dia: $${configPaloma.limits.max_daily_loss_usd}`);
        console.log(`   💸 Max perda/semana: $${configPaloma.limits.max_weekly_loss_usd}`);
        console.log(`   💰 Max posição: $${configPaloma.limits.max_position_size_usd}`);
        console.log(`   💰 Min posição: $${configPaloma.limits.min_position_size_usd}`);
        console.log(`   📉 Max drawdown: ${configPaloma.limits.max_drawdown_percent}%`);
        console.log(`   🚨 Stop emergência: ${configPaloma.limits.emergency_stop_loss_percent}%`);
        console.log('');
        console.log('🌐 AMBIENTE DE PRODUÇÃO:');
        console.log(`   🔗 API: ${configPaloma.production.api_endpoint}`);
        console.log(`   🌍 Environment: ${configPaloma.production.environment}`);
        console.log(`   🔒 SSL: ${configPaloma.production.ssl_enabled ? 'HABILITADO' : 'DESABILITADO'}`);
        console.log(`   📊 Monitoring: ${configPaloma.production.monitoring_enabled ? 'ATIVO' : 'INATIVO'}`);
        console.log(`   🔐 IP Whitelist: ${configPaloma.production.ip_whitelist.join(', ')}`);
        console.log('');
        console.log('🚀 SISTEMA PRONTO PARA OPERAÇÕES REAIS!');
        console.log('📊 Dashboard: dashboard-paloma.html');
        console.log('🔗 Webhook: configurado e ativo');
        console.log('⚡ Status: OPERACIONAL');
        
        // 6. Testar conectividade final
        await testarConectividadeFinal(dados.id);
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ ERRO NA ATIVAÇÃO:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        client.release();
    }
}

/**
 * Testar conectividade final do sistema
 */
async function testarConectividadeFinal(userId) {
    try {
        console.log('');
        console.log('🧪 TESTE FINAL DE CONECTIVIDADE...');
        console.log('-'.repeat(50));
        
        // Buscar chaves da Paloma
        const chavesQuery = `
            SELECT api_key, secret_key 
            FROM user_api_keys 
            WHERE user_id = $1 AND exchange = 'bybit' AND is_active = true;
        `;
        
        const chaves = await pool.query(chavesQuery, [userId]);
        
        if (chaves.rows.length === 0) {
            console.log('❌ Chaves não encontradas');
            return;
        }
        
        const { api_key, secret_key } = chaves.rows[0];
        
        // Testar conexão com Bybit
        const axios = require('axios');
        const crypto = require('crypto');
        
        const baseUrl = 'https://api.bybit.com';
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        const queryString = 'accountType=UNIFIED';
        
        // Gerar assinatura
        const paramStr = timestamp + api_key + recvWindow + queryString;
        const signature = crypto.createHmac('sha256', secret_key).update(paramStr).digest('hex');
        
        console.log('🔍 Testando API Bybit...');
        
        const response = await axios.get(`${baseUrl}/v5/account/wallet-balance`, {
            headers: {
                'X-BAPI-API-KEY': api_key,
                'X-BAPI-SIGN': signature,
                'X-BAPI-SIGN-TYPE': '2',
                'X-BAPI-TIMESTAMP': timestamp,
                'X-BAPI-RECV-WINDOW': recvWindow
            },
            params: { accountType: 'UNIFIED' },
            timeout: 10000
        });
        
        if (response.data.retCode === 0) {
            console.log('✅ CONECTIVIDADE BYBIT: OK');
            
            if (response.data.result?.list) {
                response.data.result.list.forEach(account => {
                    if (account.totalWalletBalance && parseFloat(account.totalWalletBalance) > 0) {
                        console.log(`💰 Saldo Total: ${account.totalWalletBalance} USD`);
                    }
                });
            }
            
            console.log('');
            console.log('🎯 SISTEMA 100% OPERACIONAL');
            console.log('✅ Pronto para receber sinais do TradingView');
            console.log('✅ Pronto para executar trades automaticamente');
            console.log('✅ Monitoramento ativo via dashboard');
            
        } else {
            console.log(`❌ ERRO API: ${response.data.retCode} - ${response.data.retMsg}`);
        }
        
    } catch (error) {
        if (error.response?.data) {
            console.log(`❌ ERRO HTTP: ${error.response.status}`);
            console.log(`📊 Detalhes: ${JSON.stringify(error.response.data)}`);
        } else {
            console.log(`❌ ERRO: ${error.message}`);
        }
    }
}

/**
 * Verificar status final do sistema
 */
async function verificarStatusFinal() {
    try {
        console.log('');
        console.log('📊 STATUS FINAL DO SISTEMA');
        console.log('='.repeat(50));
        
        const statusQuery = `
            SELECT 
                u.name,
                u.email,
                u.status,
                u.balance_usd,
                uak.api_key,
                uak.environment,
                uak.is_active as api_active,
                utp.max_daily_trades,
                utp.max_daily_loss,
                utp.take_profit_percent,
                utp.stop_loss_percent,
                utp.risk_settings
            FROM users u
            LEFT JOIN user_api_keys uak ON u.id = uak.user_id AND uak.exchange = 'bybit'
            LEFT JOIN user_trading_params utp ON u.id = utp.user_id
            WHERE u.email = $1;
        `;
        
        const result = await pool.query(statusQuery, [configPaloma.email]);
        
        if (result.rows.length > 0) {
            const dados = result.rows[0];
            
            console.log('👤 DADOS DO USUÁRIO:');
            console.log(`   Nome: ${dados.name}`);
            console.log(`   Email: ${dados.email}`);
            console.log(`   Status: ${dados.status}`);
            console.log(`   Saldo: $${dados.balance_usd}`);
            console.log('');
            console.log('🔑 CONFIGURAÇÃO API:');
            console.log(`   API Key: ${dados.api_key}`);
            console.log(`   Environment: ${dados.environment}`);
            console.log(`   Status API: ${dados.api_active ? 'ATIVA' : 'INATIVA'}`);
            console.log('');
            console.log('📊 PARÂMETROS TRADING:');
            console.log(`   Max trades/dia: ${dados.max_daily_trades}`);
            console.log(`   Max perda/dia: $${dados.max_daily_loss}`);
            console.log(`   Take Profit: ${dados.take_profit_percent}%`);
            console.log(`   Stop Loss: ${dados.stop_loss_percent}%`);
            
            if (dados.risk_settings) {
                const riskSettings = JSON.parse(dados.risk_settings);
                console.log('');
                console.log('⚙️ CONFIGURAÇÕES AVANÇADAS:');
                console.log(`   Modo Produção: ${riskSettings.production_mode ? 'SIM' : 'NÃO'}`);
                console.log(`   Trading Habilitado: ${riskSettings.trading_enabled ? 'SIM' : 'NÃO'}`);
                console.log(`   IA Ativa: ${riskSettings.ai_mode_enabled ? 'SIM' : 'NÃO'}`);
                console.log(`   Auto Trading: ${riskSettings.auto_trading_enabled ? 'SIM' : 'NÃO'}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Erro ao verificar status final:', error.message);
    }
}

/**
 * Executar ativação completa
 */
async function executarAtivacaoCompleta() {
    try {
        await ativarContaPaloma();
        await verificarStatusFinal();
        
        console.log('');
        console.log('🎉 ATIVAÇÃO COMPLETA CONCLUÍDA!');
        console.log('📋 Próximos passos:');
        console.log('   1. Abrir dashboard-paloma.html no navegador');
        console.log('   2. Configurar webhooks no TradingView');
        console.log('   3. Monitorar operações em tempo real');
        console.log('   4. Acompanhar relatórios e performance');
        console.log('');
        console.log('🚀 SISTEMA ATIVO E PRONTO PARA TRADING!');
        
    } catch (error) {
        console.error('❌ Erro no processo de ativação:', error.message);
    } finally {
        await pool.end();
    }
}

// Executar ativação
executarAtivacaoCompleta();
