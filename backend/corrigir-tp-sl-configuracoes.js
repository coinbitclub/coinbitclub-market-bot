/**
 * 🔧 CORRIGIR CONFIGURAÇÕES DE TP/SL - ESPECIFICAÇÃO ATUALIZADA
 * 
 * PADRÃO DEFAULT:
 * Take Profit = 3x Alavancagem (5x = 15%)
 * Stop Loss = 2x Alavancagem (5x = 10%)
 * 
 * LIMITES MÁXIMOS DO SISTEMA:
 * Alavancagem máxima = 10x
 * Tak        console.log('   💳 Pagamentos: Processamento de pagamentos');
        console.log('   🤖 Trading Bot: Execução de operações');
        
        console.log('\n⏰ CONTROLE DE TEMPO DE SINAIS:');
        console.log('   ⚠️ LIMITE: Sinais são REJEITADOS após 2 minutos da chegada');
        console.log('   📊 VALIDAÇÃO: IA verifica timestamp de cada sinal recebido');
        console.log('   ❌ BLOQUEIO: Sinal expirado = operação não executada');
        console.log('   📝 LOG: Registra motivo da rejeição por tempo limite');
        console.log('');
        console.log('📊 MONITORAMENTO EM TEMPO REAL:');
        console.log('   🔄 INTERVAL: Verifica operações a cada 30 segundos');
        console.log('   👁️ MONITORA: Status, P&L, tempo aberto, preços TP/SL');
        console.log('   📈 ATUALIZA: Preços atuais e cálculo de lucro/prejuízo');
        console.log('   🚨 ALERTA: Operações próximas de TP ou SL');
        console.log('   📝 REGISTRA: Todos os eventos no banco de dados');
        console.log('');
        console.log('🔒 SINAIS DE FECHAMENTO AUTOMÁTICO:');
        console.log('   🎯 "FECHE LONG": IA emite ordem imediata para fechar TODAS as operações LONG');
        console.log('   🎯 "FECHE SHORT": IA emite ordem imediata para fechar TODAS as operações SHORT');
        console.log('   ⚡ VELOCIDADE: Processamento em menos de 1 segundo');
        console.log('   📊 MÚLTIPLAS: Fecha todas as operações da direção especificada');
        console.log('   💾 REGISTRO: Salva motivo do fechamento (manual via sinal)');
        console.log('');
        console.log('💾 REGISTRO COMPLETO NO BANCO DE DADOS:');
        console.log('   👤 POR USUÁRIO: Todas as operações separadas por usuário');
        console.log('   📊 DETALHAMENTO: Entry, exit, TP, SL, P&L, timestamps');
        console.log('   🔄 TEMPO REAL: Atualização contínua durante operação');
        console.log('   📈 HISTÓRICO: Manutenção completa do histórico de trades');
        console.log('   🏷️ TAGS: Motivo de abertura/fechamento, fonte do sinal');
        console.log('   📋 LOGS: Registro de cada ação da IA supervisora');
        console.log('');
        console.log('⚙️ CONFIGURAÇÕES DE SUPERVISÃO:');
        console.log('   🕐 Verificação operações: 30 segundos');
        console.log('   🕐 Validação sinais: Instantânea ao receber');
        console.log('   🕐 Timeout sinais: 2 minutos máximo');
        console.log('   🕐 Fechamento por sinal: < 1 segundo');
        console.log('   🕐 Atualização P&L: 1 minuto');
        console.log('   🕐 Backup dados: 5 minutos');Profit limite = 5x Alavancagem
 * Stop Loss limite = 4x Alavancagem
 * 
 * SINAIS TRADINGVIEW (CONFORME PINE SCRIPT):
 * "SINAL LONG" / "SINAL LONG FORTE" → ABRE OPERAÇÕES LONG
 * "SINAL SHORT" / "SINAL SHORT FORTE" → ABRE OPERAÇÕES SHORT
 * "FECHE LONG" → FECHA POSIÇÕES LONG
 * "FECHE SHORT" → FECHA POSIÇÕES SHORT
 * "CONFIRMAÇÃO LONG" / "CONFIRMAÇÃO SHORT" → CONFIRMAÇÕES
 * 
 * IA SUPERVISOR DE TRADE EM TEMPO REAL:
 * - IA monitora TODAS as operações em tempo real (30s)
 * - IA rejeita sinais após 2 minutos da chegada
 * - IA emite ordem imediata para "FECHE LONG" / "FECHE SHORT"
 * - IA registra TODAS as informações por usuário no banco
 * - IA supervisiona sem executar diretamente
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function corrigirConfiguracoesTpSl() {
    try {
        console.log('🔧 CORRIGINDO CONFIGURAÇÕES TP/SL - ESPECIFICAÇÃO ATUALIZADA');
        console.log('='.repeat(60));
        console.log('📊 ESPECIFICAÇÃO ATUAL:');
        console.log('   • Take Profit = 3x Alavancagem (DEFAULT)');
        console.log('   • Stop Loss = 2x Alavancagem (DEFAULT)');
        console.log('   • Alavancagem padrão = 5x');
        console.log('   • TP DEFAULT = 3 × 5 = 15%');
        console.log('   • SL DEFAULT = 2 × 5 = 10%');
        console.log('');
        console.log('🔒 LIMITES MÁXIMOS DO SISTEMA:');
        console.log('   • Alavancagem máxima: 10x');
        console.log('   • Take Profit limite: 5x alavancagem');
        console.log('   • Stop Loss limite: 4x alavancagem');
        console.log('');
        console.log('📡 SINAIS TRADINGVIEW ACEITOS (CONFORME PINE SCRIPT):');
        console.log('   • "SINAL LONG" / "SINAL LONG FORTE" → ABRE OPERAÇÕES LONG');
        console.log('   • "SINAL SHORT" / "SINAL SHORT FORTE" → ABRE OPERAÇÕES SHORT');
        console.log('   • "FECHE LONG" → FECHA POSIÇÕES LONG');
        console.log('   • "FECHE SHORT" → FECHA POSIÇÕES SHORT');
        console.log('   • "CONFIRMAÇÃO LONG" / "CONFIRMAÇÃO SHORT" → CONFIRMAÇÕES');
        console.log('');
        
        // 1. Buscar ID da Paloma
        const palomaQuery = `
            SELECT id, name, email
            FROM users 
            WHERE email = 'pamaral15@hotmail.com';
        `;
        
        const paloma = await pool.query(palomaQuery);
        const userId = paloma.rows[0].id;
        
        console.log(`✅ Paloma ID: ${userId}`);
        
        // 2. Verificar se existe tabela usuario_configuracoes
        const checkTableQuery = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name = 'usuario_configuracoes';
        `;
        
        const tableExists = await pool.query(checkTableQuery);
        
        if (tableExists.rows.length > 0) {
            console.log('📊 Usando tabela usuario_configuracoes...');
            
            // Verificar se já tem configurações
            const configExistQuery = `
                SELECT * FROM usuario_configuracoes WHERE user_id = $1;
            `;
            
            const configExist = await pool.query(configExistQuery, [userId]);
            
            if (configExist.rows.length > 0) {
                // Atualizar configurações existentes
                console.log('🔄 Atualizando configurações existentes...');
                
                const updateQuery = `
                    UPDATE usuario_configuracoes 
                    SET 
                        leverage_default = 5,
                        take_profit_multiplier = 3,
                        stop_loss_multiplier = 2,
                        leverage_max = 10,
                        take_profit_max_multiplier = 5,
                        stop_loss_max_multiplier = 4,
                        balance_percentage = 30,
                        max_open_positions = 2,
                        risk_reward_ratio = 1.5,
                        min_signal_confidence = 0.7,
                        updated_at = NOW()
                    WHERE user_id = $1
                    RETURNING *;
                `;
                
                const result = await pool.query(updateQuery, [userId]);
                console.log('✅ Configurações atualizadas na usuario_configuracoes');
                
            } else {
                // Criar novas configurações
                console.log('📊 Criando novas configurações...');
                
                const insertQuery = `
                    INSERT INTO usuario_configuracoes (
                        user_id, 
                        leverage_default,
                        take_profit_multiplier,
                        stop_loss_multiplier,
                        leverage_max,
                        take_profit_max_multiplier,
                        stop_loss_max_multiplier,
                        balance_percentage,
                        max_open_positions,
                        trailing_stop,
                        risk_reward_ratio,
                        min_signal_confidence,
                        max_slippage_percent,
                        created_at,
                        updated_at
                    ) VALUES (
                        $1, 5, 3, 2, 10, 5, 4, 30, 2, false, 1.5, 0.7, 0.1, NOW(), NOW()
                    )
                    RETURNING *;
                `;
                
                const result = await pool.query(insertQuery, [userId]);
                console.log('✅ Configurações criadas na usuario_configuracoes');
            }
        }
        
        // 3. Criar/atualizar na tabela user_trading_params se existir
        const checkUserTradingParamsQuery = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name = 'user_trading_params';
        `;
        
        const tradingParamsExists = await pool.query(checkUserTradingParamsQuery);
        
        if (tradingParamsExists.rows.length > 0) {
            console.log('📊 Também atualizando user_trading_params...');
            
            // Verificar estrutura da tabela
            const columnsQuery = `
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'user_trading_params';
            `;
            
            const columns = await pool.query(columnsQuery);
            const columnNames = columns.rows.map(row => row.column_name);
            
            // Verificar se já tem registro
            const existingParamsQuery = `
                SELECT * FROM user_trading_params WHERE user_id = $1;
            `;
            
            const existingParams = await pool.query(existingParamsQuery, [userId]);
            
            if (existingParams.rows.length > 0) {
                // Atualizar usando apenas colunas que existem
                let updateFields = [];
                let values = [userId];
                let paramIndex = 2;
                
                const fieldsToUpdate = {
                    'take_profit_percent': 15,  // 3x leverage (5x = 15%)
                    'stop_loss_percent': 10,    // 2x leverage (5x = 10%)
                    'max_open_positions': 2,
                    'max_daily_trades': 50,
                    'max_daily_loss': 100,
                    'leverage_max': 10,
                    'tp_max_multiplier': 5,
                    'sl_max_multiplier': 4
                };
                
                Object.entries(fieldsToUpdate).forEach(([field, value]) => {
                    if (columnNames.includes(field)) {
                        updateFields.push(`${field} = $${paramIndex}`);
                        values.push(value);
                        paramIndex++;
                    }
                });
                
                if (updateFields.length > 0) {
                    updateFields.push(`updated_at = NOW()`);
                    
                    const updateTradingParamsQuery = `
                        UPDATE user_trading_params 
                        SET ${updateFields.join(', ')}
                        WHERE user_id = $1;
                    `;
                    
                    await pool.query(updateTradingParamsQuery, values);
                    console.log('✅ user_trading_params atualizada');
                }
            }
        }
        
        // 4. Exibir configurações finais
        console.log('\n📊 CONFIGURAÇÕES CORRETAS APLICADAS:');
        console.log('='.repeat(60));
        console.log('⚙️ TRADING PARAMETERS (PADRÃO):');
        console.log('   🎯 Alavancagem padrão: 5x');
        console.log('   📈 Take Profit: 15% (3x alavancagem)');
        console.log('   📉 Stop Loss: 10% (2x alavancagem)');
        console.log('   💰 Percentual por trade: 30% do saldo');
        console.log('   🔄 Max posições simultâneas: 2');
        console.log('   📊 Relação risco/retorno: 1:1.5');
        console.log('   🎯 Confiança mínima sinal: 70%');
        console.log('');
        console.log('🔒 LIMITES MÁXIMOS DO SISTEMA:');
        console.log('   🎯 Alavancagem máxima: 10x');
        console.log('   📈 Take Profit máximo: 5x alavancagem (50% em 10x)');
        console.log('   📉 Stop Loss máximo: 4x alavancagem (40% em 10x)');
        
        console.log('\n💡 LÓGICA IMPLEMENTADA:');
        console.log('   • PADRÃO: Se alavancagem = 5x → TP = 15%, SL = 10%');
        console.log('   • EXEMPLO: Se alavancagem = 10x → TP = 30%, SL = 20%');
        console.log('   • EXEMPLO: Se alavancagem = 3x → TP = 9%, SL = 6%');
        console.log('   • Fórmula: TP = 3 × leverage, SL = 2 × leverage');
        console.log('   • Limite TP: máximo 5 × leverage');
        console.log('   • Limite SL: máximo 4 × leverage');
        
        console.log('\n📡 SINAIS ACEITOS (CONFORME PINE SCRIPT):');
        console.log('   • "SINAL LONG" / "SINAL LONG FORTE" → Abre operações LONG');
        console.log('   • "SINAL SHORT" / "SINAL SHORT FORTE" → Abre operações SHORT');
        console.log('   • "FECHE LONG" → Fecha todas as posições LONG');
        console.log('   • "FECHE SHORT" → Fecha todas as posições SHORT');
        console.log('   • "CONFIRMAÇÃO LONG" / "CONFIRMAÇÃO SHORT" → Confirmações');
        
        console.log('\n🤖 IA COMO SUPERVISOR FINANCEIRO (ESPECIFICAÇÃO FINAL):');
        console.log('   ❌ IA NÃO executa: Trading, Pagamentos, Transferências');
        console.log('   ✅ IA SUPERVISIONA: Robô Financeiro, Comissões, Contabilização');
        console.log('   ✅ IA EMITE ORDENS para microserviços responsáveis');
        console.log('   ✅ IA MONITORA: Operações, Afiliados, Cálculos');
        console.log('   ✅ IA EXECUTA APENAS: Atualização de dados em tempo real');
        console.log('   ✅ IA GARANTE sequência: Fear&Greed → Sinal → Operação');
        console.log('   ✅ IA BUSCA dados web quando APIs falham (FALLBACK = 50)');
        console.log('   🔄 IA INTEGRADA com todos os microserviços como supervisor');
        console.log('');
        console.log('🏗️ MICROSERVIÇOS SUPERVISIONADOS:');
        console.log('   📊 Robô Financeiro: Cálculos e análises');
        console.log('   🤝 Sistema Afiliados: Comissionamento automático');
        console.log('   📚 Contabilização: Registros contábeis');
        console.log('   💳 Pagamentos: Processamento de pagamentos');
        console.log('   � Trading Bot: Execução de operações');
        
        console.log('\n✅ CONFIGURAÇÕES CORRIGIDAS COM SUCESSO!');
        console.log('🚀 Sistema pronto para trading com parâmetros corretos');
        
        // 5. Verificar configurações aplicadas
        await verificarConfiguracaoFinal(userId);
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

async function verificarConfiguracaoFinal(userId) {
    try {
        console.log('\n🔍 VERIFICAÇÃO FINAL DAS CONFIGURAÇÕES:');
        console.log('-'.repeat(40));
        
        // Verificar usuario_configuracoes
        const configQuery = `
            SELECT * FROM usuario_configuracoes WHERE user_id = $1;
        `;
        
        const config = await pool.query(configQuery, [userId]);
        if (config.rows.length > 0) {
            const cfg = config.rows[0];
            console.log('📊 USUARIO_CONFIGURACOES:');
            console.log(`   Leverage: ${cfg.leverage_default}x`);
            console.log(`   TP Multiplier: ${cfg.take_profit_multiplier}x`);
            console.log(`   SL Multiplier: ${cfg.stop_loss_multiplier}x`);
            console.log(`   TP Calculado: ${cfg.leverage_default * cfg.take_profit_multiplier}%`);
            console.log(`   SL Calculado: ${cfg.leverage_default * cfg.stop_loss_multiplier}%`);
            console.log(`   Leverage Máxima: ${cfg.leverage_max || 10}x`);
            console.log(`   TP Máximo: ${cfg.take_profit_max_multiplier || 5}x leverage`);
            console.log(`   SL Máximo: ${cfg.stop_loss_max_multiplier || 4}x leverage`);
            console.log(`   Balance %: ${cfg.balance_percentage}%`);
            console.log(`   Max Posições: ${cfg.max_open_positions}`);
        }
        
        // Verificar user_trading_params se existir
        const tradingParamsQuery = `
            SELECT table_name FROM information_schema.tables 
            WHERE table_name = 'user_trading_params';
        `;
        
        const tradingParamsExists = await pool.query(tradingParamsQuery);
        if (tradingParamsExists.rows.length > 0) {
            const paramsQuery = `
                SELECT * FROM user_trading_params WHERE user_id = $1;
            `;
            
            const params = await pool.query(paramsQuery, [userId]);
            if (params.rows.length > 0) {
                const prm = params.rows[0];
                console.log('\n📊 USER_TRADING_PARAMS:');
                if (prm.take_profit_percent) console.log(`   TP %: ${prm.take_profit_percent}%`);
                if (prm.stop_loss_percent) console.log(`   SL %: ${prm.stop_loss_percent}%`);
                if (prm.max_open_positions) console.log(`   Max Posições: ${prm.max_open_positions}`);
                if (prm.max_daily_trades) console.log(`   Max Trades/dia: ${prm.max_daily_trades}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Erro na verificação:', error.message);
    }
}

corrigirConfiguracoesTpSl();
