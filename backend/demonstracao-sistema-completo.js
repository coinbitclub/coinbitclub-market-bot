/**
 * 🎯 DEMONSTRAÇÃO COMPLETA DO SISTEMA
 * Robô buscando chaves do banco e executando operações
 */

const RoboTradingService = require('./robo-trading-service.js');

async function demonstracaoCompleta() {
    console.log('🚀 COINBITCLUB MARKETBOT - DEMONSTRAÇÃO COMPLETA');
    console.log('===============================================');
    console.log('');

    const robo = new RoboTradingService();

    // ========================================
    // 1. TESTE BUSCA DE CHAVES POR USUÁRIO
    // ========================================
    console.log('🔑 TESTE 1: BUSCA DE CHAVES POR USUÁRIO');
    console.log('======================================');
    
    try {
        // Teste com usuário que tem chaves próprias (Luiza Maria)
        console.log('📋 Testando usuário com chaves próprias:');
        const chavesLuiza = await robo.obterChavesUsuario(2, 'bybit');
        console.log(`   ✅ Fonte: ${chavesLuiza.source}`);
        console.log(`   🔑 API Key: ${chavesLuiza.apiKey}`);
        console.log('');
        
        // Teste com usuário que usa chaves do sistema (Mauro)
        console.log('📋 Testando usuário com chaves do sistema:');
        const chavesMauro = await robo.obterChavesUsuario(1, 'binance');
        console.log(`   ✅ Fonte: ${chavesMauro.source}`);
        console.log(`   🔑 API Key: ${chavesMauro.apiKey}`);
        console.log('');
        
    } catch (error) {
        console.error(`❌ Erro no teste de chaves: ${error.message}`);
    }

    // ========================================
    // 2. TESTE PREPARAÇÃO DE OPERAÇÃO
    // ========================================
    console.log('📊 TESTE 2: PREPARAÇÃO DE OPERAÇÃO');
    console.log('==================================');
    
    try {
        const sinalTeste = {
            symbol: 'BTCUSDT',
            direction: 'LONG',
            price: 45000,
            confidence: 0.85,
            timeframe: '15m'
        };
        
        console.log('📋 Preparando operação para Luiza Maria:');
        const operacaoLuiza = await robo.prepararOperacao(2, 'bybit', 'BTCUSDT', sinalTeste);
        console.log(`   👤 Usuário: ${operacaoLuiza.usuario.username}`);
        console.log(`   🏪 Exchange: ${operacaoLuiza.exchange}`);
        console.log(`   💰 Valor: $${operacaoLuiza.dadosCalculados.valorOperacao}`);
        console.log(`   📈 Direção: ${operacaoLuiza.dadosCalculados.direcao}`);
        console.log('');
        
    } catch (error) {
        console.error(`❌ Erro na preparação: ${error.message}`);
    }

    // ========================================
    // 3. TESTE EXECUÇÃO DE OPERAÇÃO
    // ========================================
    console.log('🚀 TESTE 3: EXECUÇÃO DE OPERAÇÃO');
    console.log('================================');
    
    try {
        const sinalExecucao = {
            symbol: 'ETHUSDT',
            direction: 'SHORT',
            price: 3200,
            confidence: 0.9,
            timeframe: '5m'
        };
        
        console.log('📋 Executando operação completa:');
        const dadosOperacao = await robo.prepararOperacao(2, 'bybit', 'ETHUSDT', sinalExecucao);
        const operacaoExecutada = await robo.executarOperacao(dadosOperacao);
        
        console.log(`   🆔 ID da Operação: ${operacaoExecutada.id}`);
        console.log(`   📊 Status: ${operacaoExecutada.status}`);
        console.log(`   🌐 Fonte das Chaves: ${operacaoExecutada.apiSource}`);
        console.log('');
        
    } catch (error) {
        console.error(`❌ Erro na execução: ${error.message}`);
    }

    // ========================================
    // 4. TESTE PROCESSAMENTO DE SINAL
    // ========================================
    console.log('📡 TESTE 4: PROCESSAMENTO DE SINAL TRADINGVIEW');
    console.log('==============================================');
    
    try {
        const sinalTradingView = {
            symbol: 'ADAUSDT',
            direction: 'LONG',
            price: 0.45,
            confidence: 0.88,
            timeframe: '1h',
            strategy: 'RSI_MACD_COMBINED',
            timestamp: new Date()
        };
        
        console.log('📋 Processando sinal para todos os usuários:');
        const resultados = await robo.processarSinalTradingView(sinalTradingView);
        
        console.log(`   ✅ Total de operações: ${resultados.length}`);
        resultados.forEach(resultado => {
            if (resultado.sucesso) {
                console.log(`   ✅ ${resultado.usuario} (${resultado.exchange}): Operação ${resultado.operacao.id}`);
            } else {
                console.log(`   ❌ ${resultado.usuario} (${resultado.exchange}): ${resultado.erro}`);
            }
        });
        console.log('');
        
    } catch (error) {
        console.error(`❌ Erro no processamento: ${error.message}`);
    }

    // ========================================
    // 5. RELATÓRIO FINAL
    // ========================================
    console.log('📊 RELATÓRIO DE OPERAÇÕES ATIVAS');
    console.log('================================');
    robo.relatorioOperacoesAtivas();
    
    console.log('✅ DEMONSTRAÇÃO COMPLETA FINALIZADA');
    console.log('==================================');
    console.log('');
    console.log('🎯 PRÓXIMOS PASSOS:');
    console.log('1. Executar adicionar-chaves-reais-banco.js para adicionar chaves da Luiza');
    console.log('2. Configurar webhook do TradingView');
    console.log('3. Testar com sinais reais');
    console.log('4. Monitorar operações no dashboard');
}

// Executar demonstração se chamado diretamente
if (require.main === module) {
    demonstracaoCompleta().catch(error => {
        console.error('❌ Erro na demonstração:', error.message);
        process.exit(1);
    });
}

module.exports = { demonstracaoCompleta };
