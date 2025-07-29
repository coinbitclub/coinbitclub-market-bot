/**
 * 🔧 SISTEMA INTEGRADO COMPLETO - IA + FEAR & GREED + TRADING
 * 
 * INTEGRAÇÃO COMPLETA:
 * - IA Guardian garantindo sequência correta
 * - Fear & Greed com múltiplas fontes + fallback
 * - CoinStats API cadastrada como prioridade
 * - Web scraping como backup
 * - Processamento de sinais TradingView
 * - Configurações TP/SL corretas
 */

const IASequenceGuardian = require('./ia-sequence-guardian');
const TradingViewSignalProcessor = require('./processador-sinais-tradingview-real');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:LukinhaCBB123@junction.proxy.rlwy.net:15433/railway',
    ssl: { rejectUnauthorized: false }
});

class SistemaIntegradoCompleto {
    constructor() {
        this.iaGuardian = new IASequenceGuardian();
        this.signalProcessor = new TradingViewSignalProcessor();
        this.isActive = false;
        this.monitoringInterval = null;
    }

    async iniciarSistemaCompleto() {
        console.log('🚀 INICIALIZANDO SISTEMA INTEGRADO COMPLETO');
        console.log('='.repeat(60));
        console.log('📋 COMPONENTES:');
        console.log('   🤖 IA Guardian - Garantia de sequência');
        console.log('   📊 Fear & Greed - Múltiplas fontes + CoinStats API');
        console.log('   📡 TradingView - Processamento de sinais');
        console.log('   ⚙️ Trading Config - TP/SL corretos');
        console.log('   💾 Database - Registro completo');
        console.log('');

        try {
            // 1. Verificar configurações do sistema
            console.log('1️⃣ VERIFICANDO CONFIGURAÇÕES...');
            await this.verificarConfiguracoesCompletas();

            // 2. Testar conectividade
            console.log('\n2️⃣ TESTANDO CONECTIVIDADE...');
            await this.testarConectividade();

            // 3. Inicializar IA Guardian
            console.log('\n3️⃣ INICIALIZANDO IA GUARDIAN...');
            const sequenceResult = await this.iaGuardian.garantirSequenciaCompleta();
            console.log('✅ IA Guardian ativa');

            // 4. Configurar monitoramento contínuo
            console.log('\n4️⃣ CONFIGURANDO MONITORAMENTO CONTÍNUO...');
            await this.configurarMonitoramentoContinuo();

            // 5. Sistema pronto
            this.isActive = true;
            console.log('\n✅ SISTEMA INTEGRADO COMPLETO ATIVO!');
            console.log('🔄 Monitoramento: Fear&Greed a cada 5min, Posições a cada 1min');
            console.log('📡 Pronto para receber sinais do TradingView');

            return {
                success: true,
                components: {
                    iaGuardian: true,
                    fearGreed: sequenceResult.fearGreed,
                    signalProcessor: true,
                    monitoring: true
                }
            };

        } catch (error) {
            console.error('❌ Erro na inicialização:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async verificarConfiguracoesCompletas() {
        // Verificar usuário Paloma
        const userQuery = `
            SELECT 
                u.id, u.name, u.balance_usd,
                uc.leverage_default, uc.take_profit_multiplier, uc.stop_loss_multiplier
            FROM users u
            LEFT JOIN usuario_configuracoes uc ON u.id = uc.user_id
            WHERE u.name = 'Paloma'
        `;

        const userResult = await pool.query(userQuery);
        if (userResult.rows.length === 0) {
            throw new Error('Usuário Paloma não encontrado');
        }

        const user = userResult.rows[0];
        console.log(`   ✅ Paloma: $${user.balance_usd} USDT`);
        
        if (user.leverage_default) {
            console.log(`   ✅ Configurações: ${user.leverage_default}x leverage, TP=${user.take_profit_multiplier}x, SL=${user.stop_loss_multiplier}x`);
        } else {
            console.log('   ⚠️ Configurações não encontradas, usando padrão');
        }

        // Verificar configurações do sistema
        const systemQuery = `
            SELECT config_key, config_value 
            FROM system_config 
            WHERE config_key LIKE 'fear_greed%'
        `;

        const systemResult = await pool.query(systemQuery);
        console.log(`   ✅ Configurações sistema: ${systemResult.rows.length} registros`);
    }

    async testarConectividade() {
        // Testar banco de dados
        try {
            await pool.query('SELECT NOW()');
            console.log('   ✅ Database: Conectado');
        } catch (error) {
            console.log('   ❌ Database: Falha de conexão');
            throw error;
        }

        // Testar Fear & Greed APIs
        try {
            const fearGreedResult = await this.iaGuardian.obterFearGreedInteligente();
            console.log(`   ✅ Fear & Greed: ${fearGreedResult.value} (${fearGreedResult.source})`);
        } catch (error) {
            console.log('   ⚠️ Fear & Greed: Usando fallback');
        }
    }

    async configurarMonitoramentoContinuo() {
        // Monitoramento Fear & Greed a cada 5 minutos
        const fearGreedInterval = setInterval(async () => {
            try {
                console.log('\n🔄 ATUALIZAÇÃO AUTOMÁTICA FEAR & GREED');
                await this.iaGuardian.garantirSequenciaCompleta();
            } catch (error) {
                console.log('❌ Erro na atualização F&G:', error.message);
            }
        }, 5 * 60 * 1000); // 5 minutos

        // Monitoramento de posições a cada 1 minuto
        const positionsInterval = setInterval(async () => {
            try {
                await this.monitorarPosicoesAbertas();
            } catch (error) {
                console.log('❌ Erro no monitoramento posições:', error.message);
            }
        }, 60 * 1000); // 1 minuto

        // Salvar referências para poder parar depois
        this.monitoringInterval = {
            fearGreed: fearGreedInterval,
            positions: positionsInterval
        };

        console.log('   ✅ Monitoramento Fear & Greed: 5 minutos');
        console.log('   ✅ Monitoramento posições: 1 minuto');
    }

    async monitorarPosicoesAbertas() {
        try {
            const query = `
                SELECT 
                    uo.id, uo.symbol, uo.side, uo.entry_price, 
                    uo.take_profit_price, uo.stop_loss_price,
                    uo.created_at, u.name
                FROM user_operations uo
                JOIN users u ON uo.user_id = u.id
                WHERE uo.status IN ('OPEN', 'PENDING')
                  AND u.name = 'Paloma'
            `;

            const result = await pool.query(query);
            
            if (result.rows.length > 0) {
                console.log(`👁️ Monitorando ${result.rows.length} posições abertas`);
                
                // Aqui poderia implementar lógica de monitoramento específica
                // Por exemplo, verificar se atingiu TP/SL
                
            } else {
                console.log('📊 Nenhuma posição aberta para monitorar');
            }

        } catch (error) {
            console.log('❌ Erro no monitoramento:', error.message);
        }
    }

    async processarSinalCompleto(signalData) {
        console.log('\n📡 PROCESSAMENTO COMPLETO DE SINAL');
        console.log('='.repeat(50));

        if (!this.isActive) {
            console.log('❌ Sistema não está ativo');
            return { success: false, reason: 'Sistema inativo' };
        }

        try {
            // 1. IA Guardian garantir sequência
            console.log('🤖 IA: Garantindo sequência completa...');
            const sequenceResult = await this.iaGuardian.garantirSequenciaCompleta(signalData);

            if (!sequenceResult.success) {
                return sequenceResult;
            }

            // 2. Processar sinal com validação Fear & Greed
            console.log('📊 Processando sinal com validação F&G...');
            const processingResult = await this.signalProcessor.processWebhookSignal(signalData);

            // 3. Registrar resultado completo
            await this.registrarProcessamentoCompleto({
                signal: signalData,
                sequence: sequenceResult,
                processing: processingResult,
                timestamp: new Date().toISOString()
            });

            console.log('✅ PROCESSAMENTO COMPLETO FINALIZADO');
            return processingResult;

        } catch (error) {
            console.error('❌ Erro no processamento completo:', error.message);
            return { success: false, reason: error.message };
        }
    }

    async registrarProcessamentoCompleto(data) {
        try {
            const query = `
                INSERT INTO ai_analysis (
                    analysis_type,
                    analysis_data,
                    fear_greed_value,
                    created_at
                ) VALUES (
                    'COMPLETE_PROCESSING',
                    $1,
                    $2,
                    NOW()
                )
            `;

            await pool.query(query, [
                JSON.stringify(data),
                data.sequence.fearGreed.value
            ]);

            console.log('📝 Processamento completo registrado');

        } catch (error) {
            console.log('❌ Erro ao registrar processamento:', error.message);
        }
    }

    async pararSistema() {
        console.log('\n🛑 PARANDO SISTEMA INTEGRADO');
        
        this.isActive = false;
        
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval.fearGreed);
            clearInterval(this.monitoringInterval.positions);
            console.log('✅ Monitoramento parado');
        }
        
        await pool.end();
        console.log('✅ Conexão banco fechada');
        console.log('✅ Sistema integrado parado');
    }

    async statusSistema() {
        return {
            active: this.isActive,
            components: {
                iaGuardian: !!this.iaGuardian,
                signalProcessor: !!this.signalProcessor,
                monitoring: !!this.monitoringInterval
            },
            timestamp: new Date().toISOString()
        };
    }
}

// Função principal para iniciar tudo
async function iniciarSistemaCompleto() {
    console.log('🌟 INICIANDO SISTEMA COINBITCLUB COMPLETO');
    console.log('='.repeat(60));
    console.log('📅 Data:', new Date().toISOString());
    console.log('🎯 Objetivo: Sistema totalmente integrado e automatizado');
    console.log('');

    const sistema = new SistemaIntegradoCompleto();
    
    try {
        const result = await sistema.iniciarSistemaCompleto();
        
        if (result.success) {
            console.log('\n🎉 SISTEMA COINBITCLUB TOTALMENTE ATIVO!');
            console.log('='.repeat(60));
            console.log('📊 Fear & Greed:', result.components.fearGreed.value, '(' + result.components.fearGreed.source + ')');
            console.log('🤖 IA Guardian: Ativa');
            console.log('📡 Signal Processor: Pronto');
            console.log('🔄 Monitoring: Ativo');
            console.log('');
            console.log('✅ PRONTO PARA OPERAÇÃO REAL!');
            console.log('📱 Configure webhooks TradingView para: /webhook/tradingview');
            
            // Manter sistema rodando
            process.on('SIGINT', async () => {
                console.log('\n\n🛑 Recebido sinal de parada...');
                await sistema.pararSistema();
                process.exit(0);
            });
            
            // Teste de status a cada 30 minutos
            setInterval(async () => {
                const status = await sistema.statusSistema();
                console.log('\n📊 STATUS:', status.active ? 'ATIVO' : 'INATIVO');
            }, 30 * 60 * 1000);
            
        } else {
            console.log('\n❌ FALHA NA INICIALIZAÇÃO:', result.error);
        }
        
    } catch (error) {
        console.error('\n❌ ERRO CRÍTICO:', error.message);
    }
}

// Exportar para uso como módulo
module.exports = SistemaIntegradoCompleto;

// Executar se chamado diretamente
if (require.main === module) {
    iniciarSistemaCompleto();
}
