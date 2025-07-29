/**
 * 🔄 CONFIGURAÇÕES CORRETAS DE TRADING - PALOMA
 * 
 * Aplicar as configurações padrão conforme especificação do sistema
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

/**
 * Configurações corretas conforme sistema
 */
const configuracaoCorreta = {
    email: "pamaral15@hotmail.com",
    nome: "PALOMA AMARAL",
    
    // TRADING - Conforme especificação
    trading: {
        balance_percentage: 30,             // 30% do saldo por operação
        leverage_default: 5,                // 5x alavancagem padrão
        take_profit_multiplier: 3,          // TP = 3x alavancagem
        stop_loss_multiplier: 2,            // SL = 2x alavancagem
        max_open_positions: 2,              // Máximo 2 operações simultâneas
        trailing_stop: false,               // Sem trailing stop
        risk_reward_ratio: 1.5,             // Relação risco/retorno 1:1.5
        min_signal_confidence: 0.7,         // Confiança mínima do sinal (70%)
        max_slippage_percent: 0.1           // Slippage máximo 0.1%
    },

    // LIMITES E SEGURANÇA
    limits: {
        max_daily_trades: 20,              // Máximo 20 trades por dia
        max_daily_loss_usd: 500,           // Perda máxima diária USD
        max_weekly_loss_usd: 2000,         // Perda máxima semanal USD
        max_drawdown_percent: 10,          // Drawdown máximo 10%
        min_account_balance: 100,          // Saldo mínimo da conta
        emergency_stop_loss: 15            // Stop de emergência em 15% de perda
    },

    // PARES AUTORIZADOS
    assets: {
        whitelisted_pairs: [
            'BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'BNBUSDT', 
            'DOTUSDT', 'LINKUSDT', 'SOLUSDT', 'AVAXUSDT'
        ],
        blacklisted_pairs: [],
        preferred_quote_currency: 'USDT',
        min_trade_amount_usd: 10,
        max_trade_amount_usd: 5000
    },

    // HORÁRIOS - Cripto 24/7
    schedule: {
        trading_enabled: true,
        timezone: 'UTC',
        weekend_trading: true,
        holiday_trading: true,
        break_times: [],  // Sem pausas - mercado 24/7
        maintenance_window: {
            enabled: false,
            start: '00:00',
            end: '00:00'
        }
    },

    // NOTIFICAÇÕES
    notifications: {
        email_enabled: true,
        sms_enabled: false,
        telegram_enabled: false,
        notify_on_trade: true,
        notify_on_profit: true,
        notify_on_loss: true,
        notify_on_emergency_stop: true,
        daily_report: true
    },

    // CONFIGURAÇÕES AVANÇADAS
    advanced: {
        use_trailing_stop: true,
        partial_close_on_profit: false,
        scale_in_enabled: false,
        martingale_enabled: false,
        copy_trading_enabled: false,
        auto_compound: true,
        reinvest_profits: true
    }
};

async function atualizarConfiguracoesCorretas() {
    try {
        console.log('🔄 ATUALIZANDO CONFIGURAÇÕES CORRETAS - PALOMA');
        console.log('='.repeat(60));
        console.log('📊 Aplicando configurações conforme especificação do sistema');
        console.log('');
        
        // 1. Buscar ID da Paloma
        const buscarPaloma = `
            SELECT id, name, email 
            FROM users 
            WHERE email = $1;
        `;
        
        const paloma = await pool.query(buscarPaloma, [configuracaoCorreta.email]);
        
        if (paloma.rows.length === 0) {
            console.log('❌ Paloma não encontrada');
            return;
        }
        
        const userId = paloma.rows[0].id;
        console.log(`✅ Paloma encontrada - ID: ${userId}`);
        
        // 2. Verificar estrutura da tabela
        const checkColumns = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'user_trading_params';
        `;
        
        const columns = await pool.query(checkColumns);
        console.log('📊 Colunas disponíveis:');
        columns.rows.forEach(col => console.log(`   • ${col.column_name}`));
        
        // 3. Atualizar configurações usando JSON para campos complexos
        const updateQuery = `
            UPDATE user_trading_params 
            SET 
                take_profit_percent = $2,
                stop_loss_percent = $3,
                min_trade_amount = $4,
                max_trade_amount = $5,
                max_daily_trades = $6,
                max_daily_loss = $7,
                max_open_positions = $8,
                trading_start_time = $9,
                trading_end_time = $10,
                timezone = $11,
                authorized_symbols = $12,
                risk_settings = $13,
                updated_at = NOW()
            WHERE user_id = $1
            RETURNING id;
        `;
        
        // Calcular valores derivados
        const takeProfitPercent = configuracaoCorreta.trading.take_profit_multiplier * 2; // 6%
        const stopLossPercent = configuracaoCorreta.trading.stop_loss_multiplier * 1; // 2%
        
        const riskSettings = {
            balance_percentage: configuracaoCorreta.trading.balance_percentage,
            leverage_default: configuracaoCorreta.trading.leverage_default,
            risk_reward_ratio: configuracaoCorreta.trading.risk_reward_ratio,
            min_signal_confidence: configuracaoCorreta.trading.min_signal_confidence,
            max_slippage_percent: configuracaoCorreta.trading.max_slippage_percent,
            limits: configuracaoCorreta.limits,
            schedule: configuracaoCorreta.schedule,
            notifications: configuracaoCorreta.notifications,
            advanced: configuracaoCorreta.advanced
        };
        
        const result = await pool.query(updateQuery, [
            userId,
            takeProfitPercent,                                    // 6%
            stopLossPercent,                                      // 2%
            configuracaoCorreta.assets.min_trade_amount_usd,     // $10
            configuracaoCorreta.assets.max_trade_amount_usd,     // $5000
            configuracaoCorreta.limits.max_daily_trades,         // 20
            configuracaoCorreta.limits.max_daily_loss_usd,       // $500
            configuracaoCorreta.trading.max_open_positions,      // 2
            '00:00',                                             // 24/7
            '23:59',                                             // 24/7
            configuracaoCorreta.schedule.timezone,               // UTC
            JSON.stringify(configuracaoCorreta.assets.whitelisted_pairs),
            JSON.stringify(riskSettings)
        ]);
        
        if (result.rows.length > 0) {
            console.log('\n✅ CONFIGURAÇÕES ATUALIZADAS COM SUCESSO!');
            console.log(`📊 ID dos parâmetros: ${result.rows[0].id}`);
            
            // 4. Exibir configurações aplicadas
            console.log('\n📋 CONFIGURAÇÕES APLICADAS:');
            console.log('─'.repeat(50));
            console.log(`📈 Take Profit: ${takeProfitPercent}% (3x multiplicador)`);
            console.log(`📉 Stop Loss: ${stopLossPercent}% (2x multiplicador)`);
            console.log(`💰 Percentual por trade: ${configuracaoCorreta.trading.balance_percentage}% do saldo`);
            console.log(`🎯 Alavancagem padrão: ${configuracaoCorreta.trading.leverage_default}x`);
            console.log(`💵 Min/Max por trade: $${configuracaoCorreta.assets.min_trade_amount_usd} - $${configuracaoCorreta.assets.max_trade_amount_usd}`);
            console.log(`📊 Max trades/dia: ${configuracaoCorreta.limits.max_daily_trades}`);
            console.log(`🛡️ Max perda/dia: $${configuracaoCorreta.limits.max_daily_loss_usd}`);
            console.log(`🚀 Max posições abertas: ${configuracaoCorreta.trading.max_open_positions}`);
            console.log(`⏰ Horário: 24/7 (${configuracaoCorreta.schedule.timezone})`);
            console.log(`🎯 Relação Risco/Retorno: 1:${configuracaoCorreta.trading.risk_reward_ratio}`);
            console.log(`📊 Confiança mínima sinal: ${configuracaoCorreta.trading.min_signal_confidence * 100}%`);
            
            console.log('\n💎 PARES AUTORIZADOS:');
            configuracaoCorreta.assets.whitelisted_pairs.forEach(pair => {
                console.log(`   • ${pair}`);
            });
            
            console.log('\n🔔 NOTIFICAÇÕES:');
            console.log(`   📧 Email: ${configuracaoCorreta.notifications.email_enabled ? 'Ativo' : 'Inativo'}`);
            console.log(`   📱 SMS: ${configuracaoCorreta.notifications.sms_enabled ? 'Ativo' : 'Inativo'}`);
            console.log(`   📊 Relatório diário: ${configuracaoCorreta.notifications.daily_report ? 'Ativo' : 'Inativo'}`);
            
            console.log('\n⚙️ CONFIGURAÇÕES AVANÇADAS:');
            console.log(`   📈 Trailing Stop: ${configuracaoCorreta.advanced.use_trailing_stop ? 'Ativo' : 'Inativo'}`);
            console.log(`   🔄 Auto Compound: ${configuracaoCorreta.advanced.auto_compound ? 'Ativo' : 'Inativo'}`);
            console.log(`   💰 Reinvestir lucros: ${configuracaoCorreta.advanced.reinvest_profits ? 'Ativo' : 'Inativo'}`);
            
        } else {
            console.log('❌ Erro ao atualizar configurações');
        }
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

atualizarConfiguracoesCorretas();
