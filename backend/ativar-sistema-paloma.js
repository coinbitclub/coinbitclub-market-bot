/**
 * 🚀 ATIVAÇÃO DO SISTEMA DE TRADING REAL - PALOMA AMARAL
 * 
 * Configurar e ativar o sistema de trading em produção
 * Usuário: Paloma Amaral (conectividade confirmada - 236.72 USD)
 */

const { Pool } = require('pg');
const axios = require('axios');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

/**
 * Configurações de produção para Paloma
 */
const configuracaoPaloma = {
    email: "pamaral15@hotmail.com",
    nome: "PALOMA AMARAL",
    modo_operacao: "PRODUCAO",
    exchange_principal: "bybit",
    saldo_inicial: 500.00,
    
    // Parâmetros de trading
    parametros_trading: {
        take_profit: 2.0,      // 2% de lucro
        stop_loss: 1.0,        // 1% de perda
        quantidade_minima: 10, // R$ 10 mínimo por trade
        quantidade_maxima: 50, // R$ 50 máximo por trade (10% do saldo)
        max_trades_dia: 10,    // Máximo 10 trades por dia
        horario_inicio: "09:00",
        horario_fim: "17:00",
        timezone: "America/Sao_Paulo"
    },
    
    // Moedas autorizadas
    moedas_autorizadas: [
        "BTCUSDT", "ETHUSDT", "ADAUSDT", 
        "DOTUSDT", "LINKUSDT", "LTCUSDT"
    ],
    
    // Configurações de risco
    controle_risco: {
        max_perda_dia: 25.00,      // Máximo R$ 25 de perda por dia
        max_posicoes_abertas: 3,    // Máximo 3 posições simultâneas
        cooldown_apos_perda: 300,   // 5 minutos de pausa após perda
        parar_se_lucro_dia: 100.00  // Parar se lucrar R$ 100 no dia
    }
};

/**
 * Verificar status atual da Paloma
 */
async function verificarStatusPaloma() {
    try {
        console.log('🔍 VERIFICANDO STATUS ATUAL DA PALOMA...');
        
        const query = `
            SELECT 
                u.id,
                u.name,
                u.email,
                u.balance_usd,
                uak.api_key,
                uak.secret_key,
                uak.exchange,
                uak.environment,
                ub.balance_brl
            FROM users u
            LEFT JOIN user_api_keys uak ON u.id = uak.user_id
            LEFT JOIN user_balances ub ON u.id = ub.user_id
            WHERE u.email = $1;
        `;
        
        const result = await pool.query(query, [configuracaoPaloma.email]);
        
        if (result.rows.length === 0) {
            console.log('❌ Paloma não encontrada no banco');
            return null;
        }
        
        const paloma = result.rows[0];
        console.log('✅ DADOS DA PALOMA:');
        console.log(`   👤 Nome: ${paloma.name}`);
        console.log(`   📧 Email: ${paloma.email}`);
        console.log(`   💰 Saldo BRL: R$ ${paloma.balance_brl || 0}`);
        console.log(`   💵 Saldo USD: $ ${paloma.balance_usd || 0}`);
        console.log(`   🔑 API Key: ${paloma.api_key}`);
        console.log(`   🏢 Exchange: ${paloma.exchange}`);
        console.log(`   🌍 Environment: ${paloma.environment}`);
        
        return paloma;
        
    } catch (error) {
        console.error('❌ Erro ao verificar Paloma:', error.message);
        return null;
    }
}

/**
 * Configurar parâmetros de trading para Paloma
 */
async function configurarParametrosTrading(userId) {
    try {
        console.log('\n⚙️ CONFIGURANDO PARÂMETROS DE TRADING...');
        
        const insertQuery = `
            INSERT INTO user_trading_params (
                user_id, 
                take_profit_percent, 
                stop_loss_percent,
                min_trade_amount,
                max_trade_amount,
                max_daily_trades,
                max_daily_loss,
                max_open_positions,
                trading_start_time,
                trading_end_time,
                timezone,
                authorized_symbols,
                risk_settings,
                is_active,
                created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true, NOW())
            ON CONFLICT (user_id) 
            DO UPDATE SET
                take_profit_percent = EXCLUDED.take_profit_percent,
                stop_loss_percent = EXCLUDED.stop_loss_percent,
                min_trade_amount = EXCLUDED.min_trade_amount,
                max_trade_amount = EXCLUDED.max_trade_amount,
                max_daily_trades = EXCLUDED.max_daily_trades,
                max_daily_loss = EXCLUDED.max_daily_loss,
                max_open_positions = EXCLUDED.max_open_positions,
                trading_start_time = EXCLUDED.trading_start_time,
                trading_end_time = EXCLUDED.trading_end_time,
                timezone = EXCLUDED.timezone,
                authorized_symbols = EXCLUDED.authorized_symbols,
                risk_settings = EXCLUDED.risk_settings,
                updated_at = NOW()
            RETURNING id;
        `;
        
        const result = await pool.query(insertQuery, [
            userId,
            configuracaoPaloma.parametros_trading.take_profit,
            configuracaoPaloma.parametros_trading.stop_loss,
            configuracaoPaloma.parametros_trading.quantidade_minima,
            configuracaoPaloma.parametros_trading.quantidade_maxima,
            configuracaoPaloma.parametros_trading.max_trades_dia,
            configuracaoPaloma.controle_risco.max_perda_dia,
            configuracaoPaloma.controle_risco.max_posicoes_abertas,
            configuracaoPaloma.parametros_trading.horario_inicio,
            configuracaoPaloma.parametros_trading.horario_fim,
            configuracaoPaloma.parametros_trading.timezone,
            JSON.stringify(configuracaoPaloma.moedas_autorizadas),
            JSON.stringify(configuracaoPaloma.controle_risco)
        ]);
        
        console.log('   ✅ Parâmetros configurados com sucesso!');
        console.log(`   📊 ID dos parâmetros: ${result.rows[0].id}`);
        
        return result.rows[0].id;
        
    } catch (error) {
        console.error('   ❌ Erro ao configurar parâmetros:', error.message);
        return null;
    }
}

/**
 * Testar conectividade final da Paloma
 */
async function testarConectividadeFinal(apiKey, secretKey) {
    try {
        console.log('\n🧪 TESTE FINAL DE CONECTIVIDADE...');
        
        const baseUrl = 'https://api.bybit.com';
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        const queryString = 'accountType=UNIFIED';
        
        // Gerar assinatura
        const paramStr = timestamp + apiKey + recvWindow + queryString;
        const signature = crypto.createHmac('sha256', secretKey).update(paramStr).digest('hex');
        
        const response = await axios.get(`${baseUrl}/v5/account/wallet-balance`, {
            headers: {
                'X-BAPI-API-KEY': apiKey,
                'X-BAPI-SIGN': signature,
                'X-BAPI-SIGN-TYPE': '2',
                'X-BAPI-TIMESTAMP': timestamp,
                'X-BAPI-RECV-WINDOW': recvWindow
            },
            params: { accountType: 'UNIFIED' },
            timeout: 10000
        });
        
        if (response.data.retCode === 0) {
            console.log('   ✅ CONECTIVIDADE PERFEITA!');
            
            if (response.data.result?.list) {
                response.data.result.list.forEach(account => {
                    if (account.totalWalletBalance && parseFloat(account.totalWalletBalance) > 0) {
                        console.log(`   💰 Saldo disponível: ${account.totalWalletBalance} USD`);
                    }
                });
            }
            
            return true;
        } else {
            console.log(`   ❌ Erro: ${response.data.retCode} - ${response.data.retMsg}`);
            return false;
        }
        
    } catch (error) {
        console.log(`   ❌ Erro de conectividade: ${error.message}`);
        return false;
    }
}

/**
 * Ativar sistema de trading para Paloma
 */
async function ativarSistemaTrading(userId) {
    try {
        console.log('\n🚀 ATIVANDO SISTEMA DE TRADING...');
        
        // Atualizar status do usuário
        const updateQuery = `
            UPDATE users 
            SET 
                status = 'ATIVO_TRADING',
                role = 'TRADER_PRODUCAO',
                updated_at = NOW()
            WHERE id = $1
            RETURNING name, status, role;
        `;
        
        const result = await pool.query(updateQuery, [userId]);
        
        if (result.rows.length > 0) {
            const user = result.rows[0];
            console.log('   ✅ SISTEMA ATIVADO!');
            console.log(`   👤 Usuário: ${user.name}`);
            console.log(`   📊 Status: ${user.status}`);
            console.log(`   🎯 Função: ${user.role}`);
            
            return true;
        }
        
        return false;
        
    } catch (error) {
        console.error('   ❌ Erro ao ativar sistema:', error.message);
        return false;
    }
}

/**
 * Criar registro de início de operação
 */
async function registrarInicioOperacao(userId) {
    try {
        console.log('\n📝 REGISTRANDO INÍCIO DE OPERAÇÃO...');
        
        const insertQuery = `
            INSERT INTO trading_operations (
                user_id,
                operation_type,
                symbol,
                side,
                quantity,
                price,
                status,
                exchange,
                metadata,
                created_at
            ) VALUES ($1, 'SISTEMA_ATIVADO', 'SYSTEM', 'INFO', 0, 0, 'COMPLETED', 'bybit', $2, NOW())
            RETURNING id;
        `;
        
        const metadata = {
            evento: 'ATIVACAO_SISTEMA_TRADING',
            modo: 'PRODUCAO',
            configuracao: configuracaoPaloma,
            ip_origem: '132.255.160.140',
            timestamp_ativacao: new Date().toISOString()
        };
        
        const result = await pool.query(insertQuery, [
            userId,
            JSON.stringify(metadata)
        ]);
        
        console.log('   ✅ Operação registrada!');
        console.log(`   📊 ID da operação: ${result.rows[0].id}`);
        
        return result.rows[0].id;
        
    } catch (error) {
        console.error('   ❌ Erro ao registrar operação:', error.message);
        return null;
    }
}

/**
 * Executar ativação completa
 */
async function executarAtivacaoCompleta() {
    try {
        console.log('🚀 ATIVAÇÃO DO SISTEMA DE TRADING REAL');
        console.log('='.repeat(60));
        console.log('📅 Data: 29 de Julho de 2025');
        console.log('👤 Usuário: PALOMA AMARAL');
        console.log('🎯 Objetivo: Entrar em operação real');
        console.log('');
        
        // 1. Verificar status da Paloma
        const paloma = await verificarStatusPaloma();
        if (!paloma) {
            console.log('❌ Não foi possível prosseguir sem dados da Paloma');
            return;
        }
        
        // 2. Testar conectividade final
        const conectividade = await testarConectividadeFinal(paloma.api_key, paloma.secret_key);
        if (!conectividade) {
            console.log('❌ Conectividade falhou - não é seguro ativar');
            return;
        }
        
        // 3. Configurar parâmetros de trading
        const parametrosId = await configurarParametrosTrading(paloma.id);
        if (!parametrosId) {
            console.log('❌ Falha ao configurar parâmetros');
            return;
        }
        
        // 4. Ativar sistema de trading
        const sistemaAtivado = await ativarSistemaTrading(paloma.id);
        if (!sistemaAtivado) {
            console.log('❌ Falha ao ativar sistema');
            return;
        }
        
        // 5. Registrar início de operação
        const operacaoId = await registrarInicioOperacao(paloma.id);
        
        // Resumo final
        console.log('\n🎉 SISTEMA ATIVADO COM SUCESSO!');
        console.log('='.repeat(50));
        console.log('✅ PALOMA AMARAL EM OPERAÇÃO REAL');
        console.log('');
        console.log('📊 CONFIGURAÇÕES ATIVAS:');
        console.log(`   💰 Saldo disponível: ${paloma.balance_brl || 500} BRL`);
        console.log(`   📈 Take Profit: ${configuracaoPaloma.parametros_trading.take_profit}%`);
        console.log(`   📉 Stop Loss: ${configuracaoPaloma.parametros_trading.stop_loss}%`);
        console.log(`   💵 Min/Max por trade: R$${configuracaoPaloma.parametros_trading.quantidade_minima} - R$${configuracaoPaloma.parametros_trading.quantidade_maxima}`);
        console.log(`   🕒 Horário: ${configuracaoPaloma.parametros_trading.horario_inicio} - ${configuracaoPaloma.parametros_trading.horario_fim}`);
        console.log(`   📊 Max trades/dia: ${configuracaoPaloma.parametros_trading.max_trades_dia}`);
        console.log(`   🛡️ Max perda/dia: R$${configuracaoPaloma.controle_risco.max_perda_dia}`);
        console.log('');
        console.log('🚀 AGUARDANDO SINAIS DO TRADINGVIEW...');
        console.log('📡 Webhook ativo em: /webhook/tradingview');
        console.log('🔗 IP configurado: 132.255.160.140');
        
    } catch (error) {
        console.error('❌ ERRO NA ATIVAÇÃO:', error.message);
    } finally {
        await pool.end();
    }
}

// Executar ativação
executarAtivacaoCompleta();
